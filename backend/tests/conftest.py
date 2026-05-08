"""
conftest.py – Cấu hình pytest fixtures dùng chung
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from app import app as flask_app


@pytest.fixture
def app():
    flask_app.config.update({
        "TESTING": True,
    })
    yield flask_app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def admin_token(client):
    """Lấy JWT token của admin để dùng trong các test khác."""
    res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "Admin@123"
    })
    data = res.get_json()
    assert data["status"] == "success", f"Login thất bại: {data}"
    return data["token"]
