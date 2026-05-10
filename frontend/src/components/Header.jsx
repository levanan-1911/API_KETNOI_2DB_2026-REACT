import { Bell, Search, LogOut, User, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect, useCallback } from "react";

const API = "http://localhost:5000";

const pageTitles = {
  "/":                    { title: "Tổng quan",             sub: "Chào mừng trở lại!" },
  "/employees":           { title: "Quản lý nhân viên",     sub: "Danh sách toàn bộ nhân viên" },
  "/employees/add":       { title: "Thêm nhân viên",        sub: "Tạo hồ sơ nhân viên mới" },
  "/payroll":             { title: "Bảng lương",             sub: "Quản lý lương, thưởng và khấu trừ" },
  "/salary":              { title: "Chi tiết lương",         sub: "Thông tin lương cá nhân" },
  "/payroll-calc":        { title: "Tính lương",             sub: "Tính toán lương tháng" },
  "/departments":         { title: "Phòng ban & Chức vụ",   sub: "Quản lý cơ cấu tổ chức" },
  "/attendance":          { title: "Chấm công & Nghỉ phép", sub: "Theo dõi chấm công" },
  "/reports":             { title: "Báo cáo",               sub: "Thống kê và xuất báo cáo" },
  "/reports/dividend":    { title: "Báo cáo cổ tức",        sub: "Thống kê cổ tức nhân viên" },
  "/alerts":              { title: "Cảnh báo",              sub: "Thông báo hệ thống" },
  "/profile":             { title: "Hồ sơ cá nhân",         sub: "Thông tin tài khoản" },
  "/admin":               { title: "Quản trị hệ thống",     sub: "Cấu hình và phân quyền" },
  "/my-salary":           { title: "Lương của tôi",          sub: "Thông tin lương cá nhân" },
  "/my-attendance":       { title: "Chấm công của tôi",      sub: "Ngày công và nghỉ phép" },
};

const STATUS_STYLE = {
  Active:   { color: "#16a34a", bg: "#f0fdf4", label: "Đang làm" },
  Inactive: { color: "#dc2626", bg: "#fef2f2", label: "Đã nghỉ" },
  OnLeave:  { color: "#d97706", bg: "#fffbeb", label: "Nghỉ phép" },
};

/* ── Global Search Component ── */
function GlobalSearch() {
  const navigate = useNavigate();
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef  = useRef(null);
  const wrapRef   = useRef(null);
  const timerRef  = useRef(null);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounce search
  const search = useCallback((q) => {
    clearTimeout(timerRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.data || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    search(val);
  };

  const handleSelect = (emp) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    navigate(`/employees/${emp.EmployeeID}/edit`);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const initials = (name) =>
    (name || "?").split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();

  return (
    <div ref={wrapRef} style={{ position: "relative", minWidth: 220 }}>
      {/* Input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: focused ? "#fff" : "#f4f6fb",
        border: `1px solid ${focused ? "#2563eb" : "#e8ecf0"}`,
        borderRadius: 10, padding: "7px 12px",
        transition: "all 0.15s", boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
      }}>
        <Search size={15} color={focused ? "#2563eb" : "#8a94a6"} style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => { setFocused(true); if (results.length > 0) setOpen(true); }}
          placeholder="Tìm nhân viên, phòng ban..."
          style={{
            border: "none", outline: "none", background: "transparent",
            fontSize: 13, color: "#1e2a3a", width: "100%", minWidth: 160,
          }}
        />
        {loading && (
          <div style={{ width: 14, height: 14, border: "2px solid #e8ecf0",
            borderTopColor: "#2563eb", borderRadius: "50%",
            animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
        )}
        {query && !loading && (
          <button onClick={handleClear} style={{
            border: "none", background: "none", cursor: "pointer",
            color: "#8a94a6", padding: 0, display: "flex", flexShrink: 0,
          }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "#fff", borderRadius: 12, zIndex: 9999,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          border: "1px solid #e8ecf0", overflow: "hidden",
          minWidth: 320,
        }}>
          {results.length === 0 ? (
            <div style={{ padding: "16px 16px", fontSize: 13, color: "#8a94a6", textAlign: "center" }}>
              Không tìm thấy kết quả cho "<strong>{query}</strong>"
            </div>
          ) : (
            <>
              <div style={{ padding: "8px 14px 6px", fontSize: 11, color: "#8a94a6",
                fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px",
                borderBottom: "1px solid #f0f4f8" }}>
                {results.length} kết quả
              </div>
              {results.map(emp => {
                const st = STATUS_STYLE[emp.Status] || STATUS_STYLE.Active;
                return (
                  <button key={emp.EmployeeID} onClick={() => handleSelect(emp)}
                    style={{
                      width: "100%", textAlign: "left", border: "none",
                      background: "transparent", padding: "10px 14px",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                      borderBottom: "1px solid #f8fafc", transition: "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 12, fontWeight: 700,
                    }}>
                      {initials(emp.FullName)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#1e2a3a",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {emp.FullName}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px",
                          borderRadius: 20, background: st.bg, color: st.color, flexShrink: 0 }}>
                          {st.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#8a94a6", marginTop: 1,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        #{emp.EmployeeID} · {emp.DepartmentName} · {emp.PositionName}
                      </div>
                    </div>

                    {/* Arrow */}
                    <User size={14} color="#8a94a6" style={{ flexShrink: 0 }} />
                  </button>
                );
              })}
              <div style={{ padding: "8px 14px", borderTop: "1px solid #f0f4f8",
                fontSize: 11, color: "#8a94a6", textAlign: "center" }}>
                Nhấn để xem hồ sơ nhân viên
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Header ── */
export default function Header({ collapsed }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate("/login"); };

  const initials = user?.fullName
    ? user.fullName.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase()
    : "AD";

  const matchedKey = Object.keys(pageTitles)
    .filter(k => location.pathname === k || location.pathname.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];

  const page = pageTitles[matchedKey] || { title: "Dashboard", sub: "" };
  const leftOffset = collapsed ? 64 : 240;

  return (
    <header className="app-header" style={{ left: leftOffset }}>
      {/* Page title */}
      <div className="header-title">
        <div style={{ fontWeight: 700, fontSize: 16, color: "#1e2a3a" }}>{page.title}</div>
        <div style={{ fontSize: 12, color: "#8a94a6", fontWeight: 400 }}>{page.sub}</div>
      </div>

      {/* Global Search */}
      <GlobalSearch />

      {/* Bell */}
      <button
        onClick={() => navigate("/alerts")}
        style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "1px solid #e8ecf0", background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#5a6478", position: "relative", flexShrink: 0,
        }}
        title="Cảnh báo"
      >
        <Bell size={17} />
        <span style={{
          position: "absolute", top: 7, right: 7,
          width: 7, height: 7, background: "#ef4444",
          borderRadius: "50%", border: "1.5px solid #fff",
        }} />
      </button>

      {/* Role badge */}
      <div className="header-badge">
        <span style={{ width: 7, height: 7, background: "#22c55e",
          borderRadius: "50%", display: "inline-block" }} />
        {user?.role || "Admin"}
      </div>

      {/* Avatar */}
      <div className="header-avatar" title={user?.fullName || "Tài khoản"}
        onClick={() => navigate("/profile")}
        style={{ cursor: "pointer" }}>
        {initials}
      </div>

      {/* Logout */}
      <button onClick={handleLogout} title="Đăng xuất" style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "1px solid #e8ecf0", background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: "#ef4444", flexShrink: 0, transition: "all 0.15s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
      >
        <LogOut size={16} />
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}
