import React from 'react';
import { Role } from '@/data/mockData';
import {
  LayoutDashboard, Users, DollarSign, Building2, Calendar,
  BarChart3, Bell, Settings, ChevronLeft, ChevronRight, UserCircle, Calculator
} from 'lucide-react';
import logo from '@/assets/logo.png';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const menuItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: ['admin', 'hr_manager', 'payroll_manager', 'employee'] },
  { id: 'employees', label: 'Nhân viên', icon: Users, roles: ['admin', 'hr_manager'] },
  { id: 'payroll', label: 'Tiền lương', icon: DollarSign, roles: ['admin', 'payroll_manager'] },
  { id: 'payroll-calc', label: 'Tính lương', icon: Calculator, roles: ['admin', 'payroll_manager', 'hr_manager', 'employee'] },
  { id: 'departments', label: 'Phòng ban & Chức vụ', icon: Building2, roles: ['admin', 'hr_manager'] },
  { id: 'attendance', label: 'Chấm công & Nghỉ phép', icon: Calendar, roles: ['admin', 'hr_manager', 'payroll_manager', 'employee'] },
  { id: 'reports', label: 'Báo cáo', icon: BarChart3, roles: ['admin', 'hr_manager', 'payroll_manager'] },
  { id: 'alerts', label: 'Cảnh báo', icon: Bell, roles: ['admin', 'hr_manager', 'payroll_manager'] },
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserCircle, roles: ['admin', 'hr_manager', 'payroll_manager', 'employee'] },
  { id: 'admin', label: 'Quản trị', icon: Settings, roles: ['admin'] },
];

interface AppSidebarProps {
  collapsed: boolean;
  currentPage: string;
  onNavigate: (page: string) => void;
  onToggle: () => void;
  role: Role;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, currentPage, onNavigate, onToggle, role }) => {
  const visibleItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <div className="h-full bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <img src={logo} alt="Logo" width={32} height={32} className="h-8 w-8 object-contain shrink-0" />
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <h1 className="text-sm font-bold text-sidebar-primary-foreground whitespace-nowrap">HR & Payroll</h1>
            <p className="text-xs text-sidebar-foreground/60 whitespace-nowrap">Công ty X</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`sidebar-link w-full ${active ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-sidebar-border hidden lg:block">
        <button
          onClick={onToggle}
          className="sidebar-link sidebar-link-inactive w-full justify-center"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};
