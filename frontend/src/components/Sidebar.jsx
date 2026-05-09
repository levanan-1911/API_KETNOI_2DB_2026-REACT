import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, DollarSign, Calculator,
  Building2, Calendar, BarChart3, Bell,
  UserCircle, Settings, ChevronLeft, ChevronRight,
  Wallet, ClipboardList,
} from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../contexts/AuthContext";

const ALL_MENU = [
  { id: "dashboard",     label: "Tổng quan",            icon: LayoutDashboard, path: "/",               roles: null },
  { id: "employees",     label: "Nhân viên",             icon: Users,           path: "/employees",      roles: ["Admin","HR_Manager"] },
  { id: "payroll",       label: "Tiền lương",            icon: DollarSign,      path: "/payroll",        roles: ["Admin","Payroll_Manager"] },
  { id: "payroll-calc",  label: "Tính lương",            icon: Calculator,      path: "/payroll-calc",   roles: ["Admin","Payroll_Manager"] },
  { id: "departments",   label: "Phòng ban & Chức vụ",   icon: Building2,       path: "/departments",    roles: ["Admin","HR_Manager"] },
  { id: "attendance",    label: "Chấm công & Nghỉ phép", icon: Calendar,        path: "/attendance",     roles: ["Admin","HR_Manager"] },
  { id: "reports",       label: "Báo cáo",               icon: BarChart3,       path: "/reports",        roles: ["Admin","HR_Manager","Payroll_Manager"] },
  { id: "alerts",        label: "Cảnh báo",              icon: Bell,            path: "/alerts",         roles: ["Admin","HR_Manager","Payroll_Manager"] },
  // Mục dành riêng cho Employee
  { id: "my-salary",     label: "Lương của tôi",         icon: Wallet,          path: "/my-salary",      roles: ["Employee"] },
  { id: "my-attendance", label: "Chấm công của tôi",     icon: ClipboardList,   path: "/my-attendance",  roles: ["Employee"] },
  // Tất cả role
  { id: "profile",       label: "Hồ sơ cá nhân",         icon: UserCircle,      path: "/profile",        roles: null },
  { id: "admin",         label: "Quản trị",              icon: Settings,        path: "/admin",          roles: ["Admin"] },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  // Lọc menu theo role — chờ loading xong để tránh flash menu sai
  const menuItems = ALL_MENU.filter(item => {
    if (loading) return !item.roles; // khi đang load chỉ hiện mục không cần role
    if (!item.roles) return true;           // null = tất cả role
    if (user?.role === "Admin") return true; // Admin thấy tất cả
    return item.roles.includes(user?.role);
  });

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    // /employees match cả /employees/add và /employees/:id
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Logo
            size={collapsed ? 32 : 36}
            color="#fff"
            bg="transparent"
          />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <h1>HR &amp; Payroll</h1>
            <p>Công ty X</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          // Divider trước Hồ sơ cá nhân
          const showDivider = item.id === "profile";

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
