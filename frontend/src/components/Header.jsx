import { Bell, Search, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

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

export default function Header({ collapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Avatar initials từ tên thật
  const initials = user?.fullName
    ? user.fullName.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()
    : "AD";

  // Tìm title phù hợp nhất
  const matchedKey = Object.keys(pageTitles)
    .filter((k) => location.pathname === k || location.pathname.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];

  const page = pageTitles[matchedKey] || { title: "Dashboard", sub: "" };

  const leftOffset = collapsed ? 64 : 240;

  return (
    <header
      className="app-header"
      style={{ left: leftOffset }}
    >
      {/* Page title */}
      <div className="header-title">
        <div style={{ fontWeight: 700, fontSize: 16, color: "#1e2a3a" }}>
          {page.title}
        </div>
        <div style={{ fontSize: 12, color: "#8a94a6", fontWeight: 400 }}>
          {page.sub}
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#f4f6fb",
          border: "1px solid #e8ecf0",
          borderRadius: 10,
          padding: "7px 14px",
          fontSize: 13,
          color: "#8a94a6",
          cursor: "text",
          minWidth: 200,
        }}
      >
        <Search size={15} />
        <span>Tìm kiếm...</span>
      </div>

      {/* Bell */}
      <button
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1px solid #e8ecf0",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#5a6478",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <Bell size={17} />
        {/* Notification dot */}
        <span
          style={{
            position: "absolute",
            top: 7,
            right: 7,
            width: 7,
            height: 7,
            background: "#ef4444",
            borderRadius: "50%",
            border: "1.5px solid #fff",
          }}
        />
      </button>

      {/* Role badge */}
      <div className="header-badge">
        <span
          style={{
            width: 7,
            height: 7,
            background: "#22c55e",
            borderRadius: "50%",
            display: "inline-block",
          }}
        />
        {user?.role || "Admin"}
      </div>

      {/* Avatar */}
      <div className="header-avatar" title={user?.fullName || "Tài khoản"}>
        {initials}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Đăng xuất"
        style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "1px solid #e8ecf0", background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#ef4444", flexShrink: 0,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
      >
        <LogOut size={16} />
      </button>
    </header>
  );
}
