/**
 * AuthContext.jsx
 * Quản lý trạng thái đăng nhập toàn cục.
 * Token lưu vào localStorage → không mất khi reload.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export { AuthContext };

const API = "http://localhost:5000";
const TOKEN_KEY = "hr_token";
const USER_KEY  = "hr_user";

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  });
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  /* ── Đăng xuất (khai báo trước useEffect để dùng được bên trong) ── */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  /* ── Xác minh token khi app khởi động ── */
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) { setLoading(false); return; }

    let cancelled = false;   // tránh race condition khi StrictMode unmount

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res.status === "success") {
          setUser(res.user);
          setToken(savedToken);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        } else {
          logout();
        }
      })
      .catch(() => { if (!cancelled) logout(); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [logout]);

  /* ── Đăng nhập ── */
  const login = useCallback(async (username, password) => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.status === "success") {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { ok: true };
      }
      return { ok: false, msg: data.msg || "Đăng nhập thất bại" };
    } catch (err) {
      console.error("Login fetch error:", err);
      return { ok: false, msg: `Không thể kết nối server (${err.message})` };
    }
  }, []);

  const isAuthenticated = !!token && !!user;

  // Helper: kiểm tra quyền
  const hasPermission = (permission) => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  // Helper: kiểm tra role
  const hasRole = (...roles) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng trong AuthProvider");
  return ctx;
};
