"""
admin.py – Blueprint quản trị hệ thống
Quản lý Users, Roles, Permissions, Audit Log
"""
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from config import get_authdb_connection
from auth import token_required, require_permission

admin_bp = Blueprint("admin", __name__)


# ============================================================
# USERS MANAGEMENT
# ============================================================

@admin_bp.route("/api/admin/users", methods=["GET"])
@require_permission("user.manage")
def get_users():
    """Lấy danh sách users kèm role"""
    conn = get_authdb_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT u.UserID, u.Username, u.Email, u.FullName, u.IsActive,
               u.LastLogin, u.CreatedAt,
               STRING_AGG(r.RoleName, ', ') AS Roles
        FROM Users u
        LEFT JOIN Users_Roles ur ON u.UserID = ur.UserID
        LEFT JOIN Roles r ON ur.RoleID = r.RoleID
        GROUP BY u.UserID, u.Username, u.Email, u.FullName, u.IsActive,
                 u.LastLogin, u.CreatedAt
        ORDER BY u.UserID
    """)
    users = []
    for r in cur.fetchall():
        users.append({
            "UserID":     r[0],
            "Username":   r[1],
            "Email":      r[2],
            "FullName":   r[3],
            "IsActive":   bool(r[4]),
            "LastLogin":  str(r[5]) if r[5] else None,
            "CreatedAt":  str(r[6]) if r[6] else None,
            "Roles":      r[7] or "",
        })
    return jsonify({"status": "success", "data": users})


@admin_bp.route("/api/admin/users", methods=["POST"])
@require_permission("user.manage")
def create_user():
    """Tạo user mới"""
    data     = request.get_json()
    username = data.get("Username", "").strip()
    email    = data.get("Email", "").strip()
    password = data.get("Password", "")
    fullname = data.get("FullName", "").strip()
    role_ids = data.get("RoleIDs", [])  # list of RoleID

    if not username or not email or not password or not fullname:
        return jsonify({"status": "error", "msg": "Thiếu thông tin bắt buộc"}), 400

    conn = get_authdb_connection()
    cur  = conn.cursor()

    # Check duplicate
    cur.execute("SELECT COUNT(*) FROM Users WHERE Username = ? OR Email = ?", username, email)
    if cur.fetchone()[0] > 0:
        return jsonify({"status": "error", "msg": "Username hoặc Email đã tồn tại"}), 409

    pw_hash = generate_password_hash(password)

    try:
        cur.execute("""
            INSERT INTO Users (Username, Email, PasswordHash, FullName, IsActive)
            OUTPUT INSERTED.UserID
            VALUES (?, ?, ?, ?, 1)
        """, username, email, pw_hash, fullname)
        new_id = cur.fetchone()[0]

        # Gán roles
        for rid in role_ids:
            cur.execute("INSERT INTO Users_Roles (UserID, RoleID) VALUES (?, ?)", new_id, rid)

        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({"status": "success", "msg": "Tạo user thành công", "UserID": new_id}), 201


@admin_bp.route("/api/admin/users/<int:user_id>", methods=["PUT"])
@require_permission("user.manage")
def update_user(user_id):
    """Cập nhật user"""
    data     = request.get_json()
    email    = data.get("Email", "").strip()
    fullname = data.get("FullName", "").strip()
    is_active= data.get("IsActive", True)
    role_ids = data.get("RoleIDs", [])

    conn = get_authdb_connection()
    cur  = conn.cursor()

    try:
        cur.execute("""
            UPDATE Users SET Email = ?, FullName = ?, IsActive = ?, UpdatedAt = GETDATE()
            WHERE UserID = ?
        """, email, fullname, is_active, user_id)

        # Xóa roles cũ và gán lại
        cur.execute("DELETE FROM Users_Roles WHERE UserID = ?", user_id)
        for rid in role_ids:
            cur.execute("INSERT INTO Users_Roles (UserID, RoleID) VALUES (?, ?)", user_id, rid)

        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({"status": "success", "msg": "Cập nhật thành công"})


@admin_bp.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@require_permission("user.manage")
def delete_user(user_id):
    """Xóa user"""
    conn = get_authdb_connection()
    cur  = conn.cursor()
    try:
        cur.execute("DELETE FROM Users WHERE UserID = ?", user_id)
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500
    return jsonify({"status": "success", "msg": "Xóa user thành công"})


# ============================================================
# ROLES MANAGEMENT
# ============================================================

@admin_bp.route("/api/admin/roles", methods=["GET"])
@require_permission("role.manage")
def get_roles():
    """Lấy danh sách roles kèm số user"""
    conn = get_authdb_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT r.RoleID, r.RoleName, r.Description, r.CreatedAt,
               COUNT(ur.UserID) AS UserCount
        FROM Roles r
        LEFT JOIN Users_Roles ur ON r.RoleID = ur.RoleID
        GROUP BY r.RoleID, r.RoleName, r.Description, r.CreatedAt
        ORDER BY r.RoleID
    """)
    roles = []
    for r in cur.fetchall():
        roles.append({
            "RoleID":      r[0],
            "RoleName":    r[1],
            "Description": r[2],
            "CreatedAt":   str(r[3]) if r[3] else None,
            "UserCount":   r[4],
        })
    return jsonify({"status": "success", "data": roles})


@admin_bp.route("/api/admin/roles/<int:role_id>/permissions", methods=["GET"])
@require_permission("role.manage")
def get_role_permissions(role_id):
    """Lấy danh sách permissions của 1 role"""
    conn = get_authdb_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT p.PermissionID, p.PermissionName, p.Resource, p.Action, p.Description
        FROM Role_Permissions rp
        JOIN Permissions p ON rp.PermissionID = p.PermissionID
        WHERE rp.RoleID = ?
        ORDER BY p.Resource, p.Action
    """, role_id)
    perms = []
    for r in cur.fetchall():
        perms.append({
            "PermissionID":   r[0],
            "PermissionName": r[1],
            "Resource":       r[2],
            "Action":         r[3],
            "Description":    r[4],
        })
    return jsonify({"status": "success", "data": perms})


# ============================================================
# PERMISSIONS
# ============================================================

@admin_bp.route("/api/admin/permissions", methods=["GET"])
@require_permission("permission.manage")
def get_permissions():
    """Lấy toàn bộ permissions"""
    conn = get_authdb_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT PermissionID, PermissionName, Resource, Action, Description
        FROM Permissions
        ORDER BY Resource, Action
    """)
    perms = []
    for r in cur.fetchall():
        perms.append({
            "PermissionID":   r[0],
            "PermissionName": r[1],
            "Resource":       r[2],
            "Action":         r[3],
            "Description":    r[4],
        })
    return jsonify({"status": "success", "data": perms})


# ============================================================
# AUDIT LOG
# ============================================================

@admin_bp.route("/api/admin/audit-log", methods=["GET"])
@require_permission("audit.view")
def get_audit_log():
    """Lấy audit log với phân trang"""
    page  = request.args.get("page",  type=int, default=1)
    limit = request.args.get("limit", type=int, default=50)
    offset= (page - 1) * limit

    conn = get_authdb_connection()
    cur  = conn.cursor()

    # Count total
    cur.execute("SELECT COUNT(*) FROM Audit_Log")
    total = cur.fetchone()[0]

    # Get logs
    cur.execute("""
        SELECT a.LogID, a.UserID, u.Username, a.Action, a.Resource,
               a.ResourceID, a.Details, a.IPAddress, a.CreatedAt
        FROM Audit_Log a
        LEFT JOIN Users u ON a.UserID = u.UserID
        ORDER BY a.CreatedAt DESC
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    """, offset, limit)

    logs = []
    for r in cur.fetchall():
        logs.append({
            "LogID":      r[0],
            "UserID":     r[1],
            "Username":   r[2] or "System",
            "Action":     r[3],
            "Resource":   r[4],
            "ResourceID": r[5],
            "Details":    r[6],
            "IPAddress":  r[7],
            "CreatedAt":  str(r[8]) if r[8] else None,
        })

    return jsonify({
        "status": "success",
        "data":   logs,
        "total":  total,
        "page":   page,
        "limit":  limit,
    })


# ============================================================
# SYSTEM STATS
# ============================================================

@admin_bp.route("/api/admin/stats", methods=["GET"])
@token_required
def get_system_stats():
    """Lấy thống kê hệ thống"""
    conn = get_authdb_connection()
    cur  = conn.cursor()

    # Total users
    cur.execute("SELECT COUNT(*) FROM Users WHERE IsActive = 1")
    total_users = cur.fetchone()[0]

    # Total roles
    cur.execute("SELECT COUNT(*) FROM Roles")
    total_roles = cur.fetchone()[0]

    # Total permissions
    cur.execute("SELECT COUNT(*) FROM Permissions")
    total_perms = cur.fetchone()[0]

    # Audit log count (last 30 days)
    cur.execute("""
        SELECT COUNT(*) FROM Audit_Log
        WHERE CreatedAt >= DATEADD(day, -30, GETDATE())
    """)
    recent_logs = cur.fetchone()[0]

    return jsonify({
        "status": "success",
        "data": {
            "TotalUsers":       total_users,
            "TotalRoles":       total_roles,
            "TotalPermissions": total_perms,
            "RecentLogs":       recent_logs,
        }
    })
