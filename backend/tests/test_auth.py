"""
test_auth.py – Test tự động cho phần đăng nhập / xác thực
Chạy: pytest backend/tests/test_auth.py -v
"""
import pytest


# ============================================================
# 1. POST /api/auth/login
# ============================================================

class TestLogin:

    def test_login_admin_success(self, client):
        """Admin đăng nhập đúng → 200, có token và user info."""
        res = client.post("/api/auth/login", json={
            "username": "admin",
            "password": "Admin@123"
        })
        data = res.get_json()

        assert res.status_code == 200
        assert data["status"] == "success"
        assert "token" in data
        assert len(data["token"]) > 20

        user = data["user"]
        assert user["username"] == "admin"
        assert user["role"] == "Admin"
        assert isinstance(user["permissions"], list)
        assert len(user["permissions"]) > 0

    def test_login_hr_manager_success(self, client):
        """HR Manager đăng nhập đúng → role và permissions đúng."""
        res = client.post("/api/auth/login", json={
            "username": "hr_manager",
            "password": "Hr@123"
        })
        data = res.get_json()

        assert res.status_code == 200
        assert data["user"]["role"] == "HR_Manager"
        assert "employee.read" in data["user"]["permissions"]
        assert "employee.write" in data["user"]["permissions"]
        # HR không có quyền payroll.write
        assert "payroll.write" not in data["user"]["permissions"]

    def test_login_payroll_manager_success(self, client):
        """Payroll Manager → có quyền payroll, không có quyền employee.delete."""
        res = client.post("/api/auth/login", json={
            "username": "payroll_manager",
            "password": "Payroll@123"
        })
        data = res.get_json()

        assert res.status_code == 200
        assert data["user"]["role"] == "Payroll_Manager"
        assert "payroll.read" in data["user"]["permissions"]
        assert "payroll.write" in data["user"]["permissions"]
        assert "employee.delete" not in data["user"]["permissions"]

    def test_login_employee_success(self, client):
        """Employee → chỉ có quyền xem cơ bản."""
        res = client.post("/api/auth/login", json={
            "username": "employee",
            "password": "Emp@123"
        })
        data = res.get_json()

        assert res.status_code == 200
        assert data["user"]["role"] == "Employee"
        # Employee chỉ có 4 quyền cơ bản
        assert len(data["user"]["permissions"]) == 4
        assert "employee.delete" not in data["user"]["permissions"]
        assert "payroll.write" not in data["user"]["permissions"]

    def test_login_wrong_password(self, client):
        """Sai mật khẩu → 401."""
        res = client.post("/api/auth/login", json={
            "username": "admin",
            "password": "SaiMatKhau123"
        })
        data = res.get_json()

        assert res.status_code == 401
        assert data["status"] == "error"
        assert "token" not in data

    def test_login_wrong_username(self, client):
        """Sai username → 401."""
        res = client.post("/api/auth/login", json={
            "username": "khong_ton_tai",
            "password": "Admin@123"
        })
        assert res.status_code == 401
        assert res.get_json()["status"] == "error"

    def test_login_empty_username(self, client):
        """Username rỗng → 400."""
        res = client.post("/api/auth/login", json={
            "username": "",
            "password": "Admin@123"
        })
        assert res.status_code == 400

    def test_login_empty_password(self, client):
        """Password rỗng → 400."""
        res = client.post("/api/auth/login", json={
            "username": "admin",
            "password": ""
        })
        assert res.status_code == 400

    def test_login_missing_body(self, client):
        """Không gửi body → 400."""
        res = client.post("/api/auth/login",
                          data="", content_type="application/json")
        assert res.status_code == 400

    def test_login_returns_full_name_and_email(self, client):
        """Response phải có fullName và email từ AuthDB."""
        res = client.post("/api/auth/login", json={
            "username": "hr_manager",
            "password": "Hr@123"
        })
        user = res.get_json()["user"]
        assert user["fullName"] != ""
        assert "@" in user["email"]


# ============================================================
# 2. GET /api/auth/me
# ============================================================

class TestMe:

    def test_me_with_valid_token(self, client, admin_token):
        """Token hợp lệ → trả về thông tin user."""
        res = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        data = res.get_json()

        assert res.status_code == 200
        assert data["status"] == "success"
        assert data["user"]["username"] == "admin"
        assert data["user"]["role"] == "Admin"
        assert isinstance(data["user"]["permissions"], list)

    def test_me_without_token(self, client):
        """Không có token → 401."""
        res = client.get("/api/auth/me")
        assert res.status_code == 401

    def test_me_with_invalid_token(self, client):
        """Token giả → 401."""
        res = client.get("/api/auth/me", headers={
            "Authorization": "Bearer token.gia.mao"
        })
        assert res.status_code == 401

    def test_me_with_malformed_header(self, client):
        """Header sai format (không có 'Bearer ') → 401."""
        res = client.get("/api/auth/me", headers={
            "Authorization": "InvalidFormat abc123"
        })
        assert res.status_code == 401


# ============================================================
# 3. POST /api/auth/logout
# ============================================================

class TestLogout:

    def test_logout_with_valid_token(self, client, admin_token):
        """Logout với token hợp lệ → 200."""
        res = client.post("/api/auth/logout", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        data = res.get_json()
        assert res.status_code == 200
        assert data["status"] == "success"

    def test_logout_without_token(self, client):
        """Logout không có token → 401."""
        res = client.post("/api/auth/logout")
        assert res.status_code == 401


# ============================================================
# 4. GET /api/auth/permissions
# ============================================================

class TestPermissions:

    def test_admin_has_all_permissions(self, client, admin_token):
        """Admin phải có đủ permissions và functions."""
        res = client.get("/api/auth/permissions", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        data = res.get_json()

        assert res.status_code == 200
        assert data["role"] == "Admin"
        assert len(data["permissions"]) >= 19
        assert len(data["functions"]) > 0

    def test_employee_limited_permissions(self, client):
        """Employee chỉ có quyền hạn chế."""
        login = client.post("/api/auth/login", json={
            "username": "employee", "password": "Emp@123"
        }).get_json()
        token = login["token"]

        res = client.get("/api/auth/permissions", headers={
            "Authorization": f"Bearer {token}"
        })
        data = res.get_json()

        assert res.status_code == 200
        assert len(data["permissions"]) == 4

    def test_permissions_without_token(self, client):
        """Không có token → 401."""
        res = client.get("/api/auth/permissions")
        assert res.status_code == 401


# ============================================================
# 5. Token integrity
# ============================================================

class TestTokenIntegrity:

    def test_token_contains_correct_claims(self, client):
        """JWT payload phải có đủ các claims cần thiết."""
        import jwt as pyjwt
        SECRET = "HR_PAYROLL_SECRET_2026_CHANGE_IN_PROD"

        res = client.post("/api/auth/login", json={
            "username": "admin", "password": "Admin@123"
        })
        token = res.get_json()["token"]
        # sub là string từ phiên bản mới
        payload = pyjwt.decode(token, SECRET, algorithms=["HS256"],
                               options={"verify_sub": False})

        assert "sub" in payload
        assert "username" in payload
        assert "role" in payload
        assert "permissions" in payload
        assert "exp" in payload
        assert payload["username"] == "admin"
        assert payload["role"] == "Admin"
        assert str(payload["sub"]) != ""

    def test_different_users_get_different_tokens(self, client):
        """Mỗi user phải nhận token khác nhau."""
        r1 = client.post("/api/auth/login", json={
            "username": "admin", "password": "Admin@123"
        }).get_json()["token"]

        r2 = client.post("/api/auth/login", json={
            "username": "employee", "password": "Emp@123"
        }).get_json()["token"]

        assert r1 != r2
