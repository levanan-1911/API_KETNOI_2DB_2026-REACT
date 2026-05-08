import { useState, useRef, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAlerts } from "../context/AlertsContext";

const pageTitles = {
  "/":                 { title: "Tổng quan",              sub: "Chào mừng trở lại!" },
  "/employees":        { title: "Quản lý nhân viên",      sub: "Danh sách toàn bộ nhân viên" },
  "/employees/add":    { title: "Thêm nhân viên",         sub: "Tạo hồ sơ nhân viên mới" },
  "/payroll":          { title: "Bảng lương",              sub: "Quản lý lương, thưởng và khấu trừ" },
  "/salary":           { title: "Chi tiết lương",          sub: "Thông tin lương cá nhân" },
  "/payroll-calc":     { title: "Tính lương",              sub: "Tính toán lương tháng" },
  "/departments":      { title: "Phòng ban & Chức vụ",    sub: "Quản lý cơ cấu tổ chức" },
  "/attendance":       { title: "Chấm công & Nghỉ phép",  sub: "Theo dõi chấm công" },
  "/reports":          { title: "Báo cáo",                 sub: "Thống kê và xuất báo cáo" },
  "/reports/dividend": { title: "Báo cáo cổ tức",         sub: "Thống kê cổ tức nhân viên" },
  "/alerts":           { title: "Cảnh báo & Thông báo",   sub: "Theo dõi cảnh báo và thông báo hệ thống" },
  "/profile":          { title: "Hồ sơ cá nhân",          sub: "Thông tin tài khoản" },
  "/admin":            { title: "Quản trị hệ thống",      sub: "Cấu hình và phân quyền" },
};

export default function Header({ collapsed }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { unreadCount } = useAlerts();

  // Dropdown bell
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Đóng dropdown khi chuyển trang
  useEffect(() => { setBellOpen(false); }, [location.pathname]);

  // Tìm title phù hợp nhất
  const matchedKey = Object.keys(pageTitles)
    .filter((k) => location.pathname === k || location.pathname.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];

  const page       = pageTitles[matchedKey] || { title: "Dashboard", sub: "" };
  const leftOffset = collapsed ? 64 : 240;

  // Badge: hiển thị tối đa "99+"
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <header className="app-header" style={{ left: leftOffset }}>

      {/* Page title */}
      <div className="header-title">
        <div style={{ fontWeight: 700, fontSize: 16, color: "#1e2a3a" }}>{page.title}</div>
        <div style={{ fontSize: 12, color: "#8a94a6", fontWeight: 400 }}>{page.sub}</div>
      </div>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#f4f6fb", border: "1px solid #e8ecf0",
        borderRadius: 10, padding: "7px 14px",
        fontSize: 13, color: "#8a94a6", cursor: "text", minWidth: 200,
      }}>
        <Search size={15} />
        <span>Tìm kiếm...</span>
      </div>

      {/* ── Bell + Dropdown ── */}
      <div ref={bellRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setBellOpen((prev) => !prev)}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "1px solid #e8ecf0", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#5a6478", position: "relative",
          }}
        >
          <Bell size={17} />

          {/* Badge số lượng chưa đọc */}
          {unreadCount > 0 && (
            <span style={{
              position: "absolute",
              top: unreadCount > 9 ? -6 : -4,
              right: unreadCount > 9 ? -6 : -4,
              minWidth: unreadCount > 9 ? 18 : 16,
              height: unreadCount > 9 ? 18 : 16,
              background: "#ef4444",
              borderRadius: 10,
              border: "2px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 800, color: "#fff",
              lineHeight: 1, padding: "0 3px",
            }}>
              {badgeLabel}
            </span>
          )}
        </button>

        {/* ── Dropdown mini ── */}
        {bellOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 10px)", right: 0,
            width: 280, background: "#fff",
            borderRadius: 14, border: "1px solid #e8ecf0",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 200, overflow: "hidden",
          }}>
            {/* Header dropdown */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px 10px",
              borderBottom: "1px solid #f0f4f8",
            }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#1e2a3a" }}>
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: "#fef2f2", color: "#dc2626",
                  border: "1px solid #fecaca",
                  borderRadius: 20, padding: "2px 8px",
                }}>
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>

            {/* Nội dung */}
            <div style={{ padding: "12px 16px" }}>
              {unreadCount === 0 ? (
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 8, padding: "12px 0",
                }}>
                  <Bell size={28} color="#d1d5db" />
                  <p style={{ fontSize: 12, color: "#8a94a6", margin: 0 }}>
                    Không có thông báo mới
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "#5a6478", margin: 0, lineHeight: 1.6 }}>
                  Bạn có <strong style={{ color: "#dc2626" }}>{unreadCount}</strong> thông báo chưa đọc.
                  Nhấn bên dưới để xem chi tiết.
                </p>
              )}
            </div>

            {/* Footer – nút xem tất cả */}
            <div style={{ borderTop: "1px solid #f0f4f8", padding: "10px 16px" }}>
              <button
                onClick={() => { navigate("/alerts"); setBellOpen(false); }}
                style={{
                  width: "100%", padding: "8px", borderRadius: 8,
                  border: "none", background: "#eff6ff",
                  color: "#2563eb", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; }}
              >
                Xem tất cả thông báo →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role badge */}
      <div className="header-badge">
        <span style={{ width: 7, height: 7, background: "#22c55e",
                       borderRadius: "50%", display: "inline-block" }} />
        Admin
      </div>

      {/* Avatar */}
      <div className="header-avatar" title="Tài khoản">AD</div>
    </header>
  );
}
