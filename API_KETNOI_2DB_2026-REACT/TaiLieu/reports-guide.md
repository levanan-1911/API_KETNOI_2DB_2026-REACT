# Trang Báo cáo & Phân tích — Hướng dẫn tái sử dụng

Tài liệu đóng gói **nguyên bản** trang `Reports` (file `src/pages/Reports.tsx` của dự án này) để bạn paste sang một dự án **React + TypeScript + Tailwind CSS + shadcn/ui + Recharts** khác và chạy ngay.

---

## 1. Tổng quan

Trang gồm:

```
┌──────────────────────────────────────────────────────┐
│ Báo cáo & Phân tích           [Xuất PDF] [Xuất Excel]│
├──────────────────────────────────────────────────────┤
│ [ Nhân sự ] [ Tiền lương ] [ Cổ tức ]                │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────┐   ┌──────────────────┐         │
│  │   Chart trái     │   │   Chart phải     │         │
│  └──────────────────┘   └──────────────────┘         │
└──────────────────────────────────────────────────────┘
```

| Tab | Nội dung |
|-----|----------|
| **Nhân sự** | BarChart "Số NV theo trạng thái" + AreaChart "Tỷ lệ nghỉ việc theo quý" |
| **Tiền lương** | LineChart "Quỹ lương 2025 vs 2024" + BarChart ngang "Lương TB theo phòng ban" |
| **Cổ tức** | Bảng tĩnh 4 cổ đông |

---

## 2. Dependencies

```bash
npm i recharts lucide-react
npx shadcn@latest add button tabs
```

Yêu cầu sẵn có trong dự án đích:
- Tailwind CSS (đã cấu hình)
- shadcn/ui đã `init` (sinh ra `@/lib/utils.ts`, alias `@/*`)
- Biến CSS: `--border`, `--secondary`, `--card`, `--muted-foreground` (mặc định khi cài shadcn)

Thêm class helper vào `src/index.css`:

```css
@layer components {
  .stat-card {
    @apply bg-card border border-border rounded-lg p-4 shadow-sm;
  }
}
```

---

## 3. Mock data — `src/data/reportsMockData.ts`

Tạo file mới với toàn bộ nội dung:

```ts
// ============== Types ==============
export interface Employee {
  id: string;
  name: string;
  department: string;
  salary: number; // VND
}

// ============== Tab Nhân sự ==============
export const employeeStatusCount = [
  { status: 'Đang làm', count: 142, fill: 'hsl(217, 91%, 60%)' },
  { status: 'Thử việc', count: 18,  fill: 'hsl(38, 92%, 50%)' },
  { status: 'Nghỉ phép', count: 9,  fill: 'hsl(262, 83%, 58%)' },
  { status: 'Đã nghỉ',  count: 12,  fill: 'hsl(0, 84%, 60%)' },
];

export const quarterlyTurnover = [
  { quarter: 'Q1/2024', rate: 3.2 },
  { quarter: 'Q2/2024', rate: 4.1 },
  { quarter: 'Q3/2024', rate: 5.8 },
  { quarter: 'Q4/2024', rate: 4.5 },
  { quarter: 'Q1/2025', rate: 3.6 },
];

// ============== Tab Tiền lương ==============
export const yearlyPayrollComparison = [
  { month: 'T1',  current: 1850, previous: 1620 },
  { month: 'T2',  current: 1920, previous: 1680 },
  { month: 'T3',  current: 1980, previous: 1750 },
  { month: 'T4',  current: 2050, previous: 1820 },
  { month: 'T5',  current: 2120, previous: 1880 },
  { month: 'T6',  current: 2200, previous: 1950 },
  { month: 'T7',  current: 2280, previous: 2010 },
  { month: 'T8',  current: 2350, previous: 2080 },
  { month: 'T9',  current: 2410, previous: 2140 },
  { month: 'T10', current: 2480, previous: 2200 },
  { month: 'T11', current: 2550, previous: 2270 },
  { month: 'T12', current: 2620, previous: 2340 },
];

export const departmentDistribution = [
  { name: 'CNTT',       value: 25, fill: 'hsl(217, 91%, 60%)' },
  { name: 'Kế toán',    value: 12, fill: 'hsl(142, 71%, 45%)' },
  { name: 'Kinh doanh', value: 30, fill: 'hsl(38, 92%, 50%)' },
  { name: 'Marketing',  value: 15, fill: 'hsl(0, 84%, 60%)' },
  { name: 'Nhân sự',    value: 8,  fill: 'hsl(262, 83%, 58%)' },
  { name: 'Hành chính', value: 10, fill: 'hsl(199, 89%, 48%)' },
];

// Rút gọn — chỉ cần để tính avgSalaryByDept
export const mockEmployees: Employee[] = [
  { id: '1',  name: 'Nguyễn Văn A', department: 'Công nghệ thông tin', salary: 28000000 },
  { id: '2',  name: 'Trần Thị B',   department: 'Công nghệ thông tin', salary: 32000000 },
  { id: '3',  name: 'Lê Văn C',     department: 'Kế toán',             salary: 22000000 },
  { id: '4',  name: 'Phạm Thị D',   department: 'Kế toán',             salary: 24000000 },
  { id: '5',  name: 'Hoàng Văn E',  department: 'Kinh doanh',          salary: 35000000 },
  { id: '6',  name: 'Vũ Thị F',     department: 'Kinh doanh',          salary: 30000000 },
  { id: '7',  name: 'Đặng Văn G',   department: 'Marketing',           salary: 26000000 },
  { id: '8',  name: 'Bùi Thị H',    department: 'Marketing',           salary: 24000000 },
  { id: '9',  name: 'Mai Văn I',    department: 'Nhân sự',             salary: 21000000 },
  { id: '10', name: 'Lý Thị K',     department: 'Hành chính',          salary: 19000000 },
];

// ============== Tab Cổ tức ==============
export const dividendData = [
  { name: 'Nguyễn Quốc Anh', shares: 50000, pct: 25, dividend: 500_000_000 },
  { name: 'Trần Văn Bình',   shares: 40000, pct: 20, dividend: 400_000_000 },
  { name: 'Lê Thị Cẩm',      shares: 30000, pct: 15, dividend: 300_000_000 },
  { name: 'Phạm Văn Dũng',   shares: 80000, pct: 40, dividend: 800_000_000 },
];

// ============== Helpers ==============
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
```

---

## 4. Component đầy đủ — `src/pages/Reports.tsx`

Paste-ready (đã đổi import sang `reportsMockData`):

```tsx
import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  departmentDistribution, mockEmployees, formatCurrency,
  employeeStatusCount, quarterlyTurnover, yearlyPayrollComparison,
  dividendData,
} from '@/data/reportsMockData';

const Reports: React.FC = () => {
  const avgSalaryByDept = useMemo(
    () => departmentDistribution.map(d => {
      const key = d.name === 'CNTT' ? 'Công nghệ' : d.name;
      const emps = mockEmployees.filter(e => e.department.includes(key));
      const avg = emps.length > 0
        ? emps.reduce((s, e) => s + e.salary, 0) / emps.length
        : 20_000_000;
      return { name: d.name, avgSalary: Math.round(avg / 1_000_000) };
    }),
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Báo cáo & Phân tích</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />Xuất PDF
          </Button>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />Xuất Excel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hr">
        <TabsList>
          <TabsTrigger value="hr">Nhân sự</TabsTrigger>
          <TabsTrigger value="payroll">Tiền lương</TabsTrigger>
          <TabsTrigger value="dividend">Cổ tức</TabsTrigger>
        </TabsList>

        {/* === Tab Nhân sự === */}
        <TabsContent value="hr" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="stat-card">
              <h3 className="font-semibold mb-4">Số nhân viên theo trạng thái</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeStatusCount}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {employeeStatusCount.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="stat-card">
              <h3 className="font-semibold mb-4">Tỷ lệ nghỉ việc theo quý (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={quarterlyTurnover}>
                  <defs>
                    <linearGradient id="turnoverGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(0, 84%, 60%)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Tỷ lệ nghỉ']} />
                  <Area type="monotone" dataKey="rate"
                    stroke="hsl(0, 84%, 60%)" fill="url(#turnoverGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* === Tab Tiền lương === */}
        <TabsContent value="payroll" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="stat-card">
              <h3 className="font-semibold mb-4">So sánh quỹ lương 2025 vs 2024 (triệu VNĐ)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={yearlyPayrollComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v} triệu`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="current"  name="Năm 2025"
                    stroke="hsl(217, 91%, 60%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="previous" name="Năm 2024"
                    stroke="hsl(38, 92%, 50%)" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="stat-card">
              <h3 className="font-semibold mb-4">Lương trung bình theo phòng ban (triệu VNĐ)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={avgSalaryByDept} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip formatter={(v: number) => [`${v} triệu`, 'TB Lương']} />
                  <Bar dataKey="avgSalary" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* === Tab Cổ tức === */}
        <TabsContent value="dividend" className="mt-4">
          <div className="stat-card">
            <h3 className="font-semibold mb-4">Báo cáo cổ tức nội bộ</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary">
                    <th className="text-left  p-3 font-medium">Cổ đông</th>
                    <th className="text-right p-3 font-medium">Số cổ phần</th>
                    <th className="text-right p-3 font-medium">Tỷ lệ (%)</th>
                    <th className="text-right p-3 font-medium">Cổ tức (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {dividendData.map((s, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-secondary/50">
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3 text-right">{s.shares.toLocaleString('vi-VN')}</td>
                      <td className="p-3 text-right">{s.pct}%</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(s.dividend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
```

---

## 5. Snippet độc lập từng biểu đồ

Có thể copy từng phần ra để nhúng vào trang khác.

### 5.1 BarChart dọc — Số NV theo trạng thái

Đặc điểm: mỗi cột màu khác nhau bằng `<Cell fill>`.

```tsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={employeeStatusCount}>
    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
    <YAxis tick={{ fontSize: 12 }} />
    <Tooltip />
    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
      {employeeStatusCount.map((e, i) => <Cell key={i} fill={e.fill} />)}
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

Data shape: `{ status: string; count: number; fill: string }[]`.

### 5.2 AreaChart — Tỷ lệ nghỉ việc theo quý

Đặc điểm: gradient `<linearGradient>` định nghĩa trong `<defs>`, ID dùng lại trong `fill="url(#id)"`. **Lưu ý**: nếu nhúng nhiều chart cùng trang, đổi ID gradient để tránh đụng nhau.

```tsx
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={quarterlyTurnover}>
    <defs>
      <linearGradient id="turnoverGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="hsl(0, 84%, 60%)" stopOpacity={0.8} />
        <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.1} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
    <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
    <YAxis tick={{ fontSize: 12 }} />
    <Tooltip formatter={(v: number) => [`${v}%`, 'Tỷ lệ nghỉ']} />
    <Area type="monotone" dataKey="rate"
      stroke="hsl(0, 84%, 60%)" fill="url(#turnoverGrad)" strokeWidth={2} />
  </AreaChart>
</ResponsiveContainer>
```

Data shape: `{ quarter: string; rate: number }[]`.

### 5.3 LineChart 2 đường — So sánh quỹ lương

Đặc điểm: 1 nét liền + 1 nét đứt (`strokeDasharray="5 5"`), có `<Legend />`.

```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={yearlyPayrollComparison}>
    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
    <YAxis tick={{ fontSize: 12 }} />
    <Tooltip formatter={(v: number) => [`${v} triệu`, '']} />
    <Legend />
    <Line type="monotone" dataKey="current"  name="Năm 2025"
      stroke="hsl(217, 91%, 60%)" strokeWidth={2} />
    <Line type="monotone" dataKey="previous" name="Năm 2024"
      stroke="hsl(38, 92%, 50%)" strokeWidth={2} strokeDasharray="5 5" />
  </LineChart>
</ResponsiveContainer>
```

Data shape: `{ month: string; current: number; previous: number }[]`.

### 5.4 BarChart ngang — Lương TB theo phòng ban

Đặc điểm: `layout="vertical"` (đảo trục), `XAxis type="number"`, `YAxis type="category"`.

```tsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={avgSalaryByDept} layout="vertical">
    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
    <XAxis type="number" tick={{ fontSize: 12 }} />
    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
    <Tooltip formatter={(v: number) => [`${v} triệu`, 'TB Lương']} />
    <Bar dataKey="avgSalary" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
  </BarChart>
</ResponsiveContainer>
```

Data shape: `{ name: string; avgSalary: number }[]`.

### 5.5 Bảng cổ tức — table thuần Tailwind

```tsx
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b bg-secondary">
        <th className="text-left  p-3 font-medium">Cổ đông</th>
        <th className="text-right p-3 font-medium">Số cổ phần</th>
        <th className="text-right p-3 font-medium">Tỷ lệ (%)</th>
        <th className="text-right p-3 font-medium">Cổ tức (VNĐ)</th>
      </tr>
    </thead>
    <tbody>
      {dividendData.map((s, i) => (
        <tr key={i} className="border-b last:border-0 hover:bg-secondary/50">
          <td className="p-3 font-medium">{s.name}</td>
          <td className="p-3 text-right">{s.shares.toLocaleString('vi-VN')}</td>
          <td className="p-3 text-right">{s.pct}%</td>
          <td className="p-3 text-right font-semibold">{formatCurrency(s.dividend)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 6. Tuỳ biến nhanh

### 6.1 Bảng màu đang dùng

| Mục đích       | HSL                  | Hex tương đương |
|----------------|----------------------|-----------------|
| Primary blue   | `hsl(217, 91%, 60%)` | `#3B82F6`       |
| Success green  | `hsl(142, 71%, 45%)` | `#22C55E`       |
| Warning amber  | `hsl(38, 92%, 50%)`  | `#F59E0B`       |
| Danger red     | `hsl(0, 84%, 60%)`   | `#EF4444`       |
| Purple         | `hsl(262, 83%, 58%)` | `#8B5CF6`       |
| Sky            | `hsl(199, 89%, 48%)` | `#0EA5E9`       |

Khuyến nghị: chuyển các giá trị này sang CSS variable trong `index.css` (`--chart-1` … `--chart-6`) rồi tham chiếu `hsl(var(--chart-1))` để theme dark/light đồng nhất.

### 6.2 Đổi label tiếng Việt → tiếng Anh

| VI                              | EN                              |
|---------------------------------|---------------------------------|
| Báo cáo & Phân tích             | Reports & Analytics             |
| Nhân sự / Tiền lương / Cổ tức   | HR / Payroll / Dividends        |
| Số nhân viên theo trạng thái    | Employees by Status             |
| Tỷ lệ nghỉ việc theo quý (%)    | Quarterly Turnover Rate (%)     |
| So sánh quỹ lương 2025 vs 2024  | Payroll 2025 vs 2024            |
| Lương trung bình theo phòng ban | Avg Salary by Department        |
| Báo cáo cổ tức nội bộ           | Internal Dividend Report        |
| Xuất PDF / Xuất Excel           | Export PDF / Export Excel       |

### 6.3 Thêm tab mới

```tsx
<TabsList>
  <TabsTrigger value="hr">Nhân sự</TabsTrigger>
  <TabsTrigger value="payroll">Tiền lương</TabsTrigger>
  <TabsTrigger value="dividend">Cổ tức</TabsTrigger>
  <TabsTrigger value="attendance">Chấm công</TabsTrigger>  {/* ⬅ thêm */}
</TabsList>

<TabsContent value="attendance" className="mt-4 space-y-6">
  {/* charts ... */}
</TabsContent>
```

### 6.4 Nối thật export PDF / Excel

```bash
npm i jspdf jspdf-autotable xlsx
```

```tsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const exportPDF = () => {
  const doc = new jsPDF();
  doc.text('Báo cáo cổ tức', 14, 16);
  autoTable(doc, {
    head: [['Cổ đông', 'Số CP', '%', 'Cổ tức']],
    body: dividendData.map(s => [s.name, s.shares, s.pct, s.dividend]),
    startY: 22,
  });
  doc.save('report.pdf');
};

const exportExcel = () => {
  const ws = XLSX.utils.json_to_sheet(dividendData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cổ tức');
  XLSX.writeFile(wb, 'report.xlsx');
};
```

Sau đó gắn vào button: `<Button onClick={exportPDF}>…</Button>`.

---

## 7. Tích hợp vào dự án đích

### Có dùng React Router

```tsx
// App.tsx
import Reports from '@/pages/Reports';

<Route path="/reports" element={<Reports />} />
```

### Không dùng React Router (state-based router như dự án gốc)

```tsx
const pages = { reports: Reports, /* ... */ };
const Page = pages[currentPage];
return <Page />;
```

### Sidebar item gợi ý

```tsx
import { BarChart3 } from 'lucide-react';

{ id: 'reports', label: 'Báo cáo', icon: BarChart3, path: '/reports' }
```

---

## 8. Troubleshooting

| Triệu chứng                          | Nguyên nhân & cách sửa |
|--------------------------------------|------------------------|
| Chart hiện trống / cao 0px           | Parent của `ResponsiveContainer` chưa có chiều cao. Bọc trong `<div className="h-[300px]">` hoặc đặt `height={300}` trên `ResponsiveContainer` (đã làm sẵn ở trên). |
| Gradient không hiện                  | ID `linearGradient` bị trùng giữa nhiều chart trong cùng trang. Đổi ID duy nhất. |
| `Tooltip` lỗi `v.toFixed is not a function` | `formatter` nhận `unknown`. Ép kiểu: `formatter={(v: number) => …}` hoặc check `typeof v === 'number'`. |
| Không chuyển tab                     | Thiếu `npx shadcn add tabs` (chưa có `@radix-ui/react-tabs`). |
| Màu border / bg sai                  | Chưa định nghĩa `--border`, `--secondary`, `--card` trong `:root` của `index.css`. Cài `shadcn init` để tự sinh. |
| `formatCurrency` ra `NaN ₫`          | Truyền chuỗi thay vì số. Dùng `Number(value)` trước khi format. |
| Bảng cổ tức tràn ngang trên mobile   | Đã bọc `overflow-x-auto`, kéo ngang để xem. Muốn ẩn cột phụ: thêm `hidden sm:table-cell`. |

---

## Tóm tắt 3 bước áp dụng

1. `npm i recharts lucide-react && npx shadcn@latest add button tabs`
2. Tạo `src/data/reportsMockData.ts` (mục 3) và `src/pages/Reports.tsx` (mục 4)
3. Thêm route / sidebar entry trỏ tới `<Reports />`

Done — mở trang sẽ thấy đầy đủ 3 tab + 4 biểu đồ + 1 bảng như bản gốc.
