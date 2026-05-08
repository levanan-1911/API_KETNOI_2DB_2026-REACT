import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Users, DollarSign, BarChart3, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../components/Logo";

const FEATURES = [
  { icon: Users,      title: "Quản lý nhân viên",   desc: "Hồ sơ, hợp đồng, phòng ban toàn diện" },
  { icon: DollarSign, title: "Tính lương tự động",  desc: "Bảo hiểm, thuế TNCN theo quy định" },
  { icon: BarChart3,  title: "Báo cáo thông minh",  desc: "Phân tích dữ liệu HR theo thời gian thực" },
  { icon: Shield,     title: "Phân quyền RBAC",     desc: "Kiểm soát truy cập theo vai trò" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState("");

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

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      overflow: "hidden",
    }}>

      {/* ══ LEFT PANEL — Branding ══ */}
      <div style={{
        flex: "0 0 52%",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1d4ed8 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "60px 64px",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Animated blobs */}
        <div style={{
          position: "absolute", width: 500, height: 500,
          borderRadius: "50%", top: -120, right: -120,
          background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
          animation: "blobPulse 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400,
          borderRadius: "50%", bottom: -80, left: -80,
          background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
          animation: "blobPulse 10s ease-in-out infinite reverse",
        }} />
        <div style={{
          position: "absolute", width: 200, height: 200,
          borderRadius: "50%", top: "45%", right: "15%",
          background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
          animation: "blobPulse 6s ease-in-out infinite 2s",
        }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 56 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
            }}>
              <Logo size={34} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
                HR &amp; Payroll
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>
                Management System
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 42, fontWeight: 900, color: "#fff",
            lineHeight: 1.15, margin: "0 0 16px",
            letterSpacing: -1,
          }}>
            Quản lý nhân sự<br />
            <span style={{
              background: "linear-gradient(90deg, #818cf8, #60a5fa, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              thông minh hơn
            </span>
          </h1>
          <p style={{
            fontSize: 16, color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7, margin: "0 0 48px",
          }}>
            Nền tảng tích hợp quản lý nhân viên, tính lương tự động
            và phân tích dữ liệu HR toàn diện.
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 16,
                animation: `fadeSlideIn 0.5s ease ${i * 0.1 + 0.3}s both`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(8px)",
                }}>
                  <f.icon size={18} color="rgba(255,255,255,0.85)" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom badge */}
          <div style={{
            marginTop: 56, display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 100, padding: "8px 16px",
            backdropFilter: "blur(8px)",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              Hệ thống đang hoạt động · v2.0 · 2026
            </span>
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL — Form ══ */}
      <div style={{
        flex: 1,
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 48px",
        position: "relative",
      }}>

        {/* Subtle background pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 80% 20%, rgba(99,102,241,0.06) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(59,130,246,0.05) 0%, transparent 50%)",
          pointerEvents: "none",
        }} />

        <div style={{ width: "100%", maxWidth: 400, position: "relative" }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{
              fontSize: 28, fontWeight: 800, color: "#0f172a",
              margin: "0 0 8px", letterSpacing: -0.5,
            }}>
              Chào mừng trở lại 👋
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
              Đăng nhập để tiếp tục quản lý hệ thống
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Username */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: "#374151", marginBottom: 7,
              }}>
                Tài khoản
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(""); }}
                  onFocus={() => setFocused("user")}
                  onBlur={() => setFocused("")}
                  placeholder="Nhập tên đăng nhập"
                  autoComplete="username"
                  style={{
                    width: "100%", padding: "13px 16px",
                    border: `2px solid ${focused === "user" ? "#6366f1" : error ? "#ef4444" : "#e2e8f0"}`,
                    borderRadius: 12, fontSize: 14,
                    background: "#fff", color: "#0f172a",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: focused === "user" ? "0 0 0 4px rgba(99,102,241,0.1)" : "none",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: "#374151", marginBottom: 7,
              }}>
                Mật khẩu
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onFocus={() => setFocused("pw")}
                  onBlur={() => setFocused("")}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  style={{
                    width: "100%", padding: "13px 48px 13px 16px",
                    border: `2px solid ${focused === "pw" ? "#6366f1" : error ? "#ef4444" : "#e2e8f0"}`,
                    borderRadius: 12, fontSize: 14,
                    background: "#fff", color: "#0f172a",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: focused === "pw" ? "0 0 0 4px rgba(99,102,241,0.1)" : "none",
                  }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 14, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    cursor: "pointer", color: "#94a3b8", padding: 0,
                    display: "flex", alignItems: "center",
                  }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
              <button type="button" style={{
                background: "none", border: "none",
                fontSize: 13, color: "#6366f1", cursor: "pointer",
                padding: 0, fontWeight: 500,
              }}>
                Quên mật khẩu?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 10, padding: "11px 14px",
                color: "#dc2626", fontSize: 13, fontWeight: 500,
                marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px",
                background: loading
                  ? "#a5b4fc"
                  : "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3b82f6 100%)",
                border: "none", borderRadius: 12,
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 10,
                transition: "all 0.2s",
                boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,0.4)",
                letterSpacing: 0.3,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 20px rgba(99,102,241,0.4)"; }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 18, height: 18,
                    border: "2.5px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  Đang đăng nhập...
                </>
              ) : (
                <><LogIn size={18} /> Đăng nhập</>
              )}
            </button>
          </form>

          {/* Footer */}
          <p style={{
            textAlign: "center", fontSize: 12,
            color: "#94a3b8", marginTop: 32,
          }}>
            © 2026 HR &amp; Payroll System · Công ty X
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes blobPulse {
          0%, 100% { transform: scale(1) translate(0, 0); }
          33%       { transform: scale(1.08) translate(10px, -15px); }
          66%       { transform: scale(0.95) translate(-8px, 10px); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 768px) {
          div[style*="flex: 0 0 52%"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
