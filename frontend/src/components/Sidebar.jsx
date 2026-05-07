import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, DollarSign, Calculator,
  Building2, Calendar, BarChart3, Bell,
  UserCircle, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";

const menuItems = [
  { id: "dashboard",   label: "Tổng quan",              icon: LayoutDashboard, path: "/" },
  { id: "employees",   label: "Nhân viên",               icon: Users,           path: "/employees" },
  { id: "payroll",     label: "Tiền lương",              icon: DollarSign,      path: "/payroll" },
  { id: "payroll-calc",label: "Tính lương",              icon: Calculator,      path: "/payroll-calc" },
  { id: "departments", label: "Phòng ban & Chức vụ",     icon: Building2,       path: "/departments" },
  { id: "attendance",  label: "Chấm công & Nghỉ phép",   icon: Calendar,        path: "/attendance" },
  { id: "reports",     label: "Báo cáo",                 icon: BarChart3,       path: "/reports" },
  { id: "alerts",      label: "Cảnh báo",                icon: Bell,            path: "/alerts" },
  { id: "profile",     label: "Hồ sơ cá nhân",           icon: UserCircle,      path: "/profile" },
  { id: "admin",       label: "Quản trị",                icon: Settings,        path: "/admin" },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    // /employees match cả /employees/add và /employees/:id
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">HR</div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <h1>HR &amp; Payroll</h1>
            <p>Công ty X</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          // Divider trước Hồ sơ cá nhân
          const showDivider = idx === 8;

          return (
            <div key={item.id}>
              {showDivider && <div className="sidebar-divider" />}
              <Link
                to={item.path}
                className={`sidebar-item ${active ? "active" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="sidebar-item-icon" size={20} />
                {!collapsed && (
                  <span className="sidebar-item-label">{item.label}</span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="sidebar-toggle">
        <button onClick={onToggle} title={collapsed ? "Mở rộng" : "Thu gọn"}>
          {collapsed
            ? <ChevronRight size={18} />
            : <ChevronLeft size={18} />
          }
        </button>
      </div>
    </div>
  );
}
