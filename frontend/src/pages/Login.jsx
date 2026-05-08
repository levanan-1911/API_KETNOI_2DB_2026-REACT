import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sun, Moon, LogIn, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

/* ── Tài khoản demo ──────────────────────────────────────── */
const DEMO_ACCOUNTS = [
  { label: "Admin",            username: "admin",           password: "Admin@123",   color: "#2563eb", bg: "#eff6ff" },
  { label: "HR Manager",       username: "hr_manager",      password: "Hr@123",      color: "#16a34a", bg: "#f0fdf4" },
  { label: "Payroll Manager",  username: "payroll_manager", password: "Payroll@123", color: "#d97706", bg: "#fffbeb" },
  { label: "Employee",         username: "employee",        password: "Emp@123",     color: "#9333ea", bg: "#fdf4ff" },
];

/* ── Role badge color ────────────────────────────────────── */
const ROLE_COLORS = {
  "Admin":            { color: "#2563eb", bg: "#eff6ff" },
  "HR Manager":       { color: "#16a34a", bg: "#f0fdf4" },
  "Payroll Manager":  { color: "#d97706", bg: "#fffbeb" },
  "Employee":         { color: "#9333ea", bg: "#fdf4ff" },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username,  setUsername]  = useState("");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [remember,  setRemember]  = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [darkMode,  setDarkMode]  = useState(false);

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(username.trim(), password);
    if (result.ok) {
      navigate("/", { replace: true });
    } else {
      setError(result.msg || "Đăng nhập thất bại");
      setLoading(false);
    }
  };

  /* ── Quick login ── */
  const quickLogin = async (acc) => {
    setLoading(true);
    setError("");
    const result = await login(acc.username, acc.password);
    if (result.ok) {
      navigate("/", { replace: true });
    } else {
      setError(result.msg);
      setLoading(false);
    }
  };

  /* ── Theme vars ── */
  const theme = {
    bg:        darkMode ? "#0f172a" : "#f4f6fb",
    card:      darkMode ? "#1e293b" : "#ffffff",
    border:    darkMode ? "#334155" : "#e8ecf0",
    text:      darkMode ? "#f1f5f9" : "#1e2a3a",
    subtext:   darkMode ? "#94a3b8" : "#8a94a6",
    input:     darkMode ? "#0f172a" : "#ffffff",
    inputBorder: darkMode ? "#475569" : "#d1d5db",
    demoBg:    darkMode ? "#0f172a" : "#f8fafc",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: darkMode
        ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
        : "linear-gradient(135deg, #eff6ff 0%, #f4f6fb 50%, #fdf4ff 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      position: "relative",
      fontFamily: "'Segoe UI', -apple-system, sans-serif",
    }}>

      {/* ── Dark mode toggle ── */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          position: "absolute", top: 20, right: 20,
          width: 40, height: 40, borderRadius: "50%",
          background: theme.card, border: `1px solid ${theme.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: theme.subtext,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          transition: "all 0.2s",
        }}
        title={darkMode ? "Chế độ sáng" : "Chế độ tối"}
      >
        {darkMode ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} />}
      </button>

      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* ── Logo & Title ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 24px rgba(59,130,246,0.35)",
            fontSize: 28, fontWeight: 900, color: "#fff",
            letterSpacing: -2,
          }}>
            HR
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: "0 0 6px" }}>
            HR &amp; Payroll System
          </h1>
          <p style={{ fontSize: 13, color: theme.subtext, margin: 0 }}>
            Hệ thống quản lý nhân sự &amp; tiền lương
          </p>
        </div>

        {/* ── Main Card ── */}
        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: 28,
          boxShadow: darkMode
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 8px 32px rgba(59,130,246,0.08)",
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: theme.text, margin: "0 0 20px" }}>
            Đăng nhập
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: theme.text, marginBottom: 6,
              }}>
                Tài khoản
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
                style={{
                  width: "100%", padding: "10px 12px",
                  border: `1px solid ${error ? "#ef4444" : theme.inputBorder}`,
                  borderRadius: 8, fontSize: 14,
                  background: theme.input, color: theme.text,
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.target.style.borderColor = error ? "#ef4444" : theme.inputBorder}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: theme.text, marginBottom: 6,
              }}>
                Mật khẩu
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  style={{
                    width: "100%", padding: "10px 40px 10px 12px",
                    border: `1px solid ${error ? "#ef4444" : theme.inputBorder}`,
                    borderRadius: 8, fontSize: 14,
                    background: theme.input, color: theme.text,
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = error ? "#ef4444" : theme.inputBorder}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 10, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    cursor: "pointer", color: theme.subtext, padding: 0,
                  }}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: 16,
            }}>
              <label style={{
                display: "flex", alignItems: "center", gap: 7,
                fontSize: 13, color: theme.subtext, cursor: "pointer",
              }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ accentColor: "#2563eb", width: 14, height: 14 }}
                />
                Ghi nhớ đăng nhập
              </label>
              <button type="button" style={{
                background: "none", border: "none",
                fontSize: 13, color: "#2563eb",
                cursor: "pointer", padding: 0,
                textDecoration: "none",
              }}
                onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.target.style.textDecoration = "none"}
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 8, padding: "10px 14px",
                color: "#dc2626", fontSize: 13,
                marginBottom: 16, fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "11px",
                background: loading
                  ? "#93c5fd"
                  : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none", borderRadius: 8,
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8,
                transition: "all 0.15s",
                boxShadow: loading ? "none" : "0 4px 12px rgba(37,99,235,0.3)",
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    display: "inline-block", animation: "spin 0.7s linear infinite",
                  }} />
                  Đang đăng nhập...
                </>
              ) : (
                <><LogIn size={16} /> Đăng nhập</>
              )}
            </button>
          </form>

          {/* ── Quick Login ── */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${theme.border}` }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
            }}>
              <Zap size={14} color="#f59e0b" />
              <span style={{ fontSize: 12, fontWeight: 700, color: theme.subtext,
                             textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Đăng nhập nhanh (Demo)
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => quickLogin(acc)}
                  disabled={loading}
                  style={{
                    padding: "8px 10px",
                    background: acc.bg,
                    border: `1px solid ${acc.color}30`,
                    borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 12, fontWeight: 700, color: acc.color,
                    transition: "all 0.15s",
                    opacity: loading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Demo accounts table ── */}
        <div style={{
          marginTop: 16,
          background: theme.demoBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 12, padding: 16,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: theme.subtext,
                      textTransform: "uppercase", letterSpacing: "0.5px",
                      margin: "0 0 10px" }}>
            Tài khoản demo
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {DEMO_ACCOUNTS.map((acc) => {
              const rc = ROLE_COLORS[acc.label] || { color: "#5a6478", bg: "#f4f6fb" };
              const emailMap = {
                "admin":           "admin@companyx.com",
                "hr_manager":      "hr@companyx.com",
                "payroll_manager": "payroll@companyx.com",
                "employee":        "employee@companyx.com",
              };
              return (
                <div key={acc.username} style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", fontSize: 12,
                }}>
                  <div>
                    <span style={{ color: theme.subtext, fontFamily: "monospace" }}>
                      {acc.username} / <strong style={{ color: theme.text }}>{acc.password}</strong>
                    </span>
                    <div style={{ fontSize: 11, color: theme.subtext, marginTop: 1 }}>
                      {emailMap[acc.username]}
                    </div>
                  </div>
                  <span style={{
                    background: rc.bg, color: rc.color,
                    padding: "2px 8px", borderRadius: 20,
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {acc.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: theme.subtext, marginTop: 16 }}>
          © 2026 HR &amp; Payroll System · Công ty X
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
