# Hướng dẫn tạo lại trang Dashboard

Tài liệu này mô tả từng bước để tái tạo trang **Dashboard** (HR & Payroll) ở dự án khác. Bao gồm: phụ thuộc, mock data, helper, design tokens, và snippet copy-paste cho từng biểu đồ.

---

## 1. Phụ thuộc cần cài

```bash
npm i recharts lucide-react
# Tailwind CSS + shadcn/ui đã có sẵn trong dự án Lovable
```

Component dùng từ shadcn: `Badge` (`@/components/ui/badge`).

---

## 2. Design tokens (HSL semantic)

Dashboard dùng các CSS variable HSL trong `src/index.css`. Tối thiểu cần:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --border: 220 13% 91%;
  --muted-foreground: 215 16% 47%;

  --accent: 217 91% 60%;        /* Xanh dương chính */
  --success: 142 71% 45%;        /* Xanh lá */
  --warning: 38 92% 50%;         /* Cam */
  --info: 199 89% 48%;           /* Xanh nhạt */
  --destructive: 0 84% 60%;      /* Đỏ */
}
```

Class util `.stat-card` dùng cho mọi card:

```css
.stat-card {
  @apply bg-card border border-border rounded-xl p-5 shadow-sm;
}
```

---

## 3. Mock data (`src/data/mockData.ts`)

```ts
// Stats tổng quan
export const dashboardStats = {
  totalEmployees: 100,
  totalPayroll: 2_450_000_000,
  avgSalary: 24_500_000,
  newEmployees: 5,
  leaveRemaining: 8,
};

// Pie chart - phân bổ phòng ban
export const departmentDistribution = [
  { name: 'CNTT',       value: 25, fill: 'hsl(217, 91%, 60%)' },
  { name: 'Kế toán',    value: 12, fill: 'hsl(142, 71%, 45%)' },
  { name: 'Kinh doanh', value: 30, fill: 'hsl(38, 92%, 50%)' },
  { name: 'Marketing',  value: 15, fill: 'hsl(0, 84%, 60%)' },
  { name: 'Nhân sự',    value: 8,  fill: 'hsl(262, 83%, 58%)' },
  { name: 'Hành chính', value: 10, fill: 'hsl(199, 89%, 48%)' },
];

// Radar chart - đánh giá năng lực
export const departmentPerformance = [
  { subject: 'Hiệu suất',  CNTT: 85, 'Kinh doanh': 90, 'Kế toán': 80, Marketing: 75 },
  { subject: 'Chấm công',  CNTT: 92, 'Kinh doanh': 78, 'Kế toán': 95, Marketing: 88 },
  { subject: 'Đào tạo',    CNTT: 88, 'Kinh doanh': 70, 'Kế toán': 75, Marketing: 82 },
  { subject: 'Chi phí',    CNTT: 70, 'Kinh doanh': 85, 'Kế toán': 90, Marketing: 65 },
  { subject: 'Tăng trưởng',CNTT: 80, 'Kinh doanh': 95, 'Kế toán': 60, Marketing: 78 },
];

// Stacked bar - cơ cấu lương theo phòng ban (triệu VNĐ)
export const departmentSalaryBreakdown = [
  { department: 'CNTT',       baseSalary: 620, bonus: 85,  deduction: 95 },
  { department: 'Kế toán',    baseSalary: 350, bonus: 40,  deduction: 55 },
  { department: 'Kinh doanh', baseSalary: 780, bonus: 120, deduction: 110 },
  { department: 'Marketing',  baseSalary: 380, bonus: 50,  deduction: 60 },
  { department: 'Nhân sự',    baseSalary: 200, bonus: 25,  deduction: 30 },
  { department: 'Hành chính', baseSalary: 260, bonus: 30,  deduction: 40 },
];

// Area chart - tỷ lệ chấm công theo tháng (%)
export const attendanceRate = [
  { month: 'T8/2024',  onTime: 88, late: 8,  absent: 4 },
  { month: 'T9/2024',  onTime: 90, late: 7,  absent: 3 },
  { month: 'T10/2024', onTime: 87, late: 9,  absent: 4 },
  { month: 'T11/2024', onTime: 91, late: 6,  absent: 3 },
  { month: 'T12/2024', onTime: 85, late: 10, absent: 5 },
  { month: 'T1/2025',  onTime: 92, late: 5,  absent: 3 },
];

// Helpers
export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export const formatNumber = (num: number) =>
  new Intl.NumberFormat('vi-VN').format(num);

// Mock 1 nhân viên cho EmployeeDashboard
export const mockEmployees = [
  {
    id: 'e5',
    code: 'NV005',
    name: 'Nguyễn Văn A',
    email: 'a.nguyen@example.com',
    phone: '0901234567',
    joinDate: '2022-03-15',
    gender: 'Nam',
    department: 'CNTT',
    position: 'Lập trình viên',
    salary: 22_000_000,
  },
];
```

---

## 4. Cấu trúc trang Dashboard

Dashboard chia 2 nhánh theo `role`:
- `employee` → `EmployeeDashboard` (thông tin cá nhân + bảng chấm công).
- Còn lại (admin, hr_manager, payroll_manager) → `ManagerDashboard` (KPI + 4 biểu đồ).

```
ManagerDashboard
├── Tiêu đề
├── 4 StatCard (Tổng NV, Quỹ lương, Lương TB, NV mới)
├── Pie  – Cơ cấu nhân sự theo phòng ban
├── Grid 2 cột:
│   ├── Radar – Đánh giá năng lực phòng ban
│   └── Stacked Bar – Cơ cấu lương theo phòng ban
└── Area – Tỷ lệ chấm công (%)
```

---

## 5. Component `StatCard` (dùng chung)

```tsx
import React from 'react';

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);
```

---

## 6. Snippet từng biểu đồ

### 6.1 KPI Stats (4 thẻ)

```tsx
import { Users, DollarSign, TrendingUp, UserPlus } from 'lucide-react';
import { dashboardStats, formatCurrency, formatNumber } from '@/data/mockData';

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard title="Tổng nhân viên"  value={formatNumber(dashboardStats.totalEmployees)} icon={Users}      color="bg-accent/10 text-accent"   subtitle="+5 tháng này" />
  <StatCard title="Quỹ lương tháng" value={formatCurrency(dashboardStats.totalPayroll)} icon={DollarSign} color="bg-success/10 text-success" />
  <StatCard title="Lương trung bình" value={formatCurrency(dashboardStats.avgSalary)}    icon={TrendingUp} color="bg-warning/10 text-warning" />
  <StatCard title="Nhân viên mới"   value={dashboardStats.newEmployees.toString()}      icon={UserPlus}   color="bg-info/10 text-info"       subtitle="Tháng này" />
</div>
```

### 6.2 Pie chart – Cơ cấu nhân sự

```tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { departmentDistribution } from '@/data/mockData';

<div className="stat-card">
  <h3 className="font-semibold mb-4">Cơ cấu nhân sự theo phòng ban</h3>
  <ResponsiveContainer width="100%" height={320}>
    <PieChart>
      <Pie
        data={departmentDistribution}
        cx="50%" cy="50%"
        outerRadius={110}
        dataKey="value"
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
      >
        {departmentDistribution.map((entry, i) => (
          <Cell key={i} fill={entry.fill} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
</div>
```

### 6.3 Radar chart – Đánh giá năng lực phòng ban

```tsx
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { departmentPerformance } from '@/data/mockData';

<div className="stat-card">
  <h3 className="font-semibold mb-4">Đánh giá năng lực phòng ban</h3>
  <ResponsiveContainer width="100%" height={300}>
    <RadarChart data={departmentPerformance}>
      <PolarGrid stroke="hsl(var(--border))" />
      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
      <Radar name="CNTT"       dataKey="CNTT"       stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.2} />
      <Radar name="Kinh doanh" dataKey="Kinh doanh" stroke="hsl(38, 92%, 50%)"  fill="hsl(38, 92%, 50%)"  fillOpacity={0.2} />
      <Radar name="Kế toán"    dataKey="Kế toán"    stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.2} />
      <Radar name="Marketing"  dataKey="Marketing"  stroke="hsl(0, 84%, 60%)"   fill="hsl(0, 84%, 60%)"   fillOpacity={0.2} />
      <Legend />
      <Tooltip />
    </RadarChart>
  </ResponsiveContainer>
</div>
```

### 6.4 Stacked Bar – Cơ cấu lương theo phòng ban

```tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { departmentSalaryBreakdown } from '@/data/mockData';

<div className="stat-card">
  <h3 className="font-semibold mb-4">Cơ cấu lương theo phòng ban (triệu VNĐ)</h3>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={departmentSalaryBreakdown}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis dataKey="department" tick={{ fontSize: 11 }} />
      <YAxis tick={{ fontSize: 11 }} />
      <Tooltip />
      <Legend />
      <Bar dataKey="baseSalary" name="Lương CB"  stackId="a" fill="hsl(217, 91%, 60%)" />
      <Bar dataKey="bonus"      name="Thưởng"    stackId="a" fill="hsl(142, 71%, 45%)" />
      <Bar dataKey="deduction"  name="Khấu trừ"  stackId="a" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>
```

### 6.5 Area chart – Tỷ lệ chấm công

```tsx
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { attendanceRate } from '@/data/mockData';

<div className="stat-card">
  <h3 className="font-semibold mb-4">Tỷ lệ chấm công (%)</h3>
  <ResponsiveContainer width="100%" height={320}>
    <AreaChart data={attendanceRate}>
      <defs>
        <linearGradient id="colorOnTime" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
          <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
          <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
          <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
      <YAxis tick={{ fontSize: 11 }} />
      <Tooltip formatter={(val: number) => [`${val}%`]} />
      <Legend />
      <Area type="monotone" dataKey="onTime" name="Đúng giờ" stroke="hsl(142, 71%, 45%)" fill="url(#colorOnTime)" strokeWidth={2} />
      <Area type="monotone" dataKey="late"   name="Đi muộn"  stroke="hsl(38, 92%, 50%)"  fill="url(#colorLate)"   strokeWidth={2} />
      <Area type="monotone" dataKey="absent" name="Vắng"     stroke="hsl(0, 84%, 60%)"   fill="url(#colorAbsent)" strokeWidth={2} />
    </AreaChart>
  </ResponsiveContainer>
</div>
```

---

## 7. EmployeeDashboard (xem khi role = `employee`)

```tsx
import { Users, TrendingUp, DollarSign, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { mockEmployees, dashboardStats, formatCurrency } from '@/data/mockData';

const EmployeeDashboard: React.FC = () => {
  const emp = mockEmployees.find(e => e.id === 'e5')!;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Xin chào, {emp.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Phòng ban"         value={emp.department}                     icon={Users}        color="bg-accent/10 text-accent" />
        <StatCard title="Chức vụ"           value={emp.position}                       icon={TrendingUp}   color="bg-success/10 text-success" />
        <StatCard title="Lương tháng này"   value={formatCurrency(emp.salary)}         icon={DollarSign}   color="bg-warning/10 text-warning" />
        <StatCard title="Ngày phép còn lại" value={`${dashboardStats.leaveRemaining} ngày`} icon={CalendarDays} color="bg-info/10 text-info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Thông tin cá nhân</h3>
          <div className="space-y-3">
            {[
              ['Mã nhân viên', emp.code],
              ['Họ tên', emp.name],
              ['Email', emp.email],
              ['Điện thoại', emp.phone],
              ['Ngày vào làm', emp.joinDate],
              ['Giới tính', emp.gender],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold mb-4">Chi tiết lương tháng 1/2025</h3>
          <div className="space-y-3">
            {[
              ['Lương cơ bản',            formatCurrency(emp.salary)],
              ['Thưởng',                  formatCurrency(2_000_000)],
              ['Khấu trừ (BHXH, thuế)',   formatCurrency(1_500_000)],
              ['Thực nhận',               formatCurrency(emp.salary + 2_000_000 - 1_500_000)],
            ].map(([label, value], i) => (
              <div key={label} className={`flex justify-between text-sm ${i === 3 ? 'pt-3 border-t font-semibold' : ''}`}>
                <span className={i === 3 ? '' : 'text-muted-foreground'}>{label}</span>
                <span className={i === 3 ? 'text-accent' : 'font-medium'}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold mb-4">Chấm công gần đây</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-muted-foreground font-medium">Ngày</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Vào</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Ra</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, i) => {
                const day = 22 - i;
                return (
                  <tr key={day} className="border-b last:border-0">
                    <td className="py-2">2025-01-{day.toString().padStart(2, '0')}</td>
                    <td className="py-2">07:55</td>
                    <td className="py-2">17:10</td>
                    <td className="py-2">
                      <Badge variant="secondary" className="bg-success/10 text-success">Đúng giờ</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
```

---

## 8. File hoàn chỉnh `src/pages/Dashboard.tsx`

```tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, DollarSign, TrendingUp, UserPlus, CalendarDays } from 'lucide-react';
import {
  dashboardStats, departmentDistribution, formatCurrency, formatNumber,
  mockEmployees, departmentPerformance, departmentSalaryBreakdown, attendanceRate,
} from '@/data/mockData';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
} from 'recharts';
import { Badge } from '@/components/ui/badge';

// ... (StatCard, ManagerDashboard, EmployeeDashboard — copy từ các snippet ở mục 5–7)

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'employee' ? <EmployeeDashboard /> : <ManagerDashboard />;
};

export default Dashboard;
```

`ManagerDashboard` chính là tổ hợp các snippet 6.1 → 6.5 đặt trong `<div className="space-y-6">`, với hai snippet Radar (6.3) + Stacked Bar (6.4) bọc trong `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">`.

---

## 9. Tích hợp router & layout

```tsx
// src/App.tsx (rút gọn)
<Route element={<DashboardLayout />}>
  <Route path="/" element={<Dashboard />} />
</Route>
```

`DashboardLayout` cung cấp sidebar + header. Bảo vệ route bằng `AuthContext` nếu cần phân quyền.

---

## 10. Checklist khi áp dụng ở dự án khác

1. [ ] Cài `recharts`, `lucide-react`, `tailwindcss`, shadcn `Badge`.
2. [ ] Copy CSS variables HSL + class `.stat-card` vào `index.css`.
3. [ ] Copy mock data ở mục 3 vào `src/data/mockData.ts`.
4. [ ] Tạo `Dashboard.tsx` theo mục 8 (ghép các snippet 6.x).
5. [ ] Thêm `AuthContext` cung cấp `user.role` (hoặc bỏ phân nhánh nếu không cần).
6. [ ] Mount `<Dashboard />` trong layout có sidebar/header.
