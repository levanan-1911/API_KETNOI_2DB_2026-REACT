"""
auth.py – Blueprint xử lý đăng nhập / đăng xuất / xác thực JWT
Kết nối AuthDB (SQL Server) – RBAC với bảng Users, Roles, Permissions
"""
import jwt
import datetime
from functools import wraps
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from config import get_authdb_connection

auth_bp = Blueprint("auth", __name__)

JWT_SECRET  = "HR_PAYROLL_SECRET_2026_CHANGE_IN_PROD"
JWT_ALGO    = "HS256"
JWT_EXPIRES = 8   # giờ


# ============================================================
# Helper: lấy role + permissions của user từ AuthDB
# ============================================================
def _get_user_role_and_permissions(conn, user_id: int):
    cur = conn.cursor()

    # Lấy role (lấy role đầu tiên nếu có nhiều)
    cur.execute("""
        SELECT TOP 1 r.RoleName
        FROM Users_Roles ur
        JOIN Roles r ON ur.RoleID = r.RoleID
        WHERE ur.UserID = ?
    """, user_id)
    row = cur.fetchone()
    role = row[0] if row else "Employee"

    # Lấy danh sách permissions
    cur.execute("""
        SELECT DISTINCT p.PermissionName
        FROM Users_Roles ur
        JOIN Role_Permissions rp ON ur.RoleID = rp.RoleID
        JOIN Permissions p ON rp.PermissionID = p.PermissionID
        WHERE ur.UserID = ?
    """, user_id)
    permissions = [r[0] for r in cur.fetchall()]

    return role, permissions


# ============================================================
# Helper: tạo JWT token
# ============================================================
def create_token(user: dict) -> str:
    payload = {
        "sub":         str(user["UserID"]),   # PyJWT >= 2.x yêu cầu sub là string
        "username":    user["Username"],
        "role":        user["Role"],
        "permissions": user.get("Permissions", []),
        "iat":         datetime.datetime.utcnow(),
        "exp":         datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


# ============================================================
# Decorator: bảo vệ route cần đăng nhập
# ============================================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({"status": "error", "msg": "Token không tồn tại"}), 401

        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
            request.current_user = data
        except jwt.ExpiredSignatureError:
            return jsonify({"status": "error", "msg": "Token đã hết hạn"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"status": "error", "msg": "Token không hợp lệ"}), 401

        return f(*args, **kwargs)
    return decorated


# ============================================================
# Decorator: kiểm tra permission cụ thể
# ============================================================
def require_permission(permission: str):
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            perms = request.current_user.get("permissions", [])
            if permission not in perms:
                return jsonify({
                    "status": "error",
                    "msg": f"Không có quyền: {permission}"
                }), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


# ============================================================
# POST /api/auth/login
# ============================================================
@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data     = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"status": "error", "msg": "Vui lòng nhập tài khoản và mật khẩu"}), 400

    try:
        conn = get_authdb_connection()
        cur  = conn.cursor()
        cur.execute("""
            SELECT UserID, Username, PasswordHash, FullName, Email, IsActive
            FROM Users
            WHERE Username = ?
        """, username)
        row = cur.fetchone()
    except Exception as e:
        return jsonify({"status": "error", "msg": f"Lỗi kết nối database: {str(e)}"}), 500

    if not row:
        return jsonify({"status": "error", "msg": "Tài khoản hoặc mật khẩu không đúng"}), 401

    user_id, uname, pw_hash, full_name, email, is_active = row

    if not is_active:
        return jsonify({"status": "error", "msg": "Tài khoản đã bị vô hiệu hóa"}), 403

    if not check_password_hash(pw_hash, password):
        return jsonify({"status": "error", "msg": "Tài khoản hoặc mật khẩu không đúng"}), 401

    # Lấy role + permissions từ RBAC
    try:
        role, permissions = _get_user_role_and_permissions(conn, user_id)
    except Exception:
        role, permissions = "Employee", []

    # Cập nhật LastLogin + ghi Audit_Log
    try:
        cur.execute("UPDATE Users SET LastLogin = GETDATE() WHERE UserID = ?", user_id)
        cur.execute("""
            INSERT INTO Audit_Log (UserID, Action, Resource, ResourceID, Details, IPAddress)
            VALUES (?, 'LOGIN_SUCCESS', 'Auth', ?, 'Đăng nhập thành công', ?)
        """, user_id, str(user_id), request.remote_addr or "unknown")
        conn.commit()
    except Exception:
        pass

    user_obj = {
        "UserID":      user_id,
        "Username":    uname,
        "Role":        role,
        "Permissions": permissions,
    }
    token = create_token(user_obj)

    return jsonify({
        "status": "success",
        "msg":    "Đăng nhập thành công",
        "token":  token,
        "user": {
            "id":          user_id,
            "username":    uname,
            "fullName":    full_name,
            "email":       email,
            "role":        role,
            "permissions": permissions,
        }
    })


# ============================================================
# POST /api/auth/logout
# ============================================================
@auth_bp.route("/api/auth/logout", methods=["POST"])
@token_required
def logout():
    u = request.current_user
    try:
        conn = get_authdb_connection()
        cur  = conn.cursor()
        cur.execute("""
            INSERT INTO Audit_Log (UserID, Action, Resource, ResourceID, Details, IPAddress)
            VALUES (?, 'LOGOUT', 'Auth', ?, 'Đăng xuất', ?)
        """, u["sub"], str(u["sub"]), request.remote_addr or "unknown")
        conn.commit()
    except Exception:
        pass
    return jsonify({"status": "success", "msg": "Đăng xuất thành công"})


# ============================================================
# GET /api/auth/me
# ============================================================
@auth_bp.route("/api/auth/me", methods=["GET"])
@token_required
def me():
    u = request.current_user
    try:
        conn = get_authdb_connection()
        cur  = conn.cursor()
        cur.execute("""
            SELECT UserID, Username, FullName, Email, IsActive, LastLogin
            FROM Users WHERE UserID = ?
        """, u["sub"])
        row = cur.fetchone()
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

    if not row:
        return jsonify({"status": "error", "msg": "Không tìm thấy user"}), 404

    user_id, uname, full_name, email, is_active, last_login = row

    try:
        role, permissions = _get_user_role_and_permissions(conn, user_id)
    except Exception:
        role, permissions = u.get("role", "Employee"), u.get("permissions", [])

    return jsonify({
        "status": "success",
        "user": {
            "id":          user_id,
            "username":    uname,
            "fullName":    full_name,
            "email":       email,
            "role":        role,
            "permissions": permissions,
            "isActive":    bool(is_active),
            "lastLogin":   str(last_login) if last_login else None,
        }
    })


# ============================================================
# GET /api/auth/permissions  – lấy danh sách quyền của user
# ============================================================
@auth_bp.route("/api/auth/permissions", methods=["GET"])
@token_required
def get_permissions():
    u = request.current_user
    try:
        conn = get_authdb_connection()
        cur  = conn.cursor()
        # Lấy functions mà user có quyền truy cập
        cur.execute("""
            SELECT DISTINCT f.FunctionName, f.Route, m.ModuleName, m.Icon
            FROM Users_Roles ur
            JOIN Role_Permissions rp ON ur.RoleID = rp.RoleID
            JOIN Function_Permissions fp ON rp.PermissionID = fp.PermissionID
            JOIN Functions f ON fp.FunctionID = f.FunctionID
            JOIN Modules m ON f.ModuleID = m.ModuleID
            WHERE ur.UserID = ?
            ORDER BY m.ModuleName, f.FunctionName
        """, u["sub"])
        functions = [
            {"function": r[0], "route": r[1], "module": r[2], "icon": r[3]}
            for r in cur.fetchall()
        ]
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({
        "status":      "success",
        "role":        u.get("role"),
        "permissions": u.get("permissions", []),
        "functions":   functions,
    })
