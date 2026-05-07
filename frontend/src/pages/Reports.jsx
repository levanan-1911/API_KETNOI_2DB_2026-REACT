import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell,
} from "recharts";
import { FileText, FileSpreadsheet } from "lucide-react";

/* ============================================================
   MOCK DATA
   ============================================================ */

// Tab Nhân sự
const employeeStatusCount = [
  { status: "Đang làm",  count: 142, fill: "#3b82f6" },
  { status: "Thử việc",  count: 18,  fill: "#f59e0b" },
  { status: "Nghỉ phép", count: 9,   fill: "#8b5cf6" },
  { status: "Đã nghỉ",   count: 12,  fill: "#ef4444" },
];

const quarterlyTurnover = [
  { quarter: "Q1/2024", rate: 3.2 },
  { quarter: "Q2/2024", rate: 4.1 },
  { quarter: "Q3/2024", rate: 5.8 },
  { quarter: "Q4/2024", rate: 4.5 },
  { quarter: "Q1/2025", rate: 3.6 },
];

// Tab Tiền lương
const yearlyPayrollComparison = [
  { month: "T1",  current: 1850, previous: 1620 },
  { month: "T2",  current: 1920, previous: 1680 },
  { month: "T3",  current: 1980, previous: 1750 },
  { month: "T4",  current: 2050, previous: 1820 },
  { month: "T5",  current: 2120, previous: 1880 },
  { month: "T6",  current: 2200, previous: 1950 },
  { month: "T7",  current: 2280, previous: 2010 },
  { month: "T8",  current: 2350, previous: 2080 },
  { month: "T9",  current: 2410, previous: 2140 },
  { month: "T10", current: 2480, previous: 2200 },
  { month: "T11", current: 2550, previous: 2270 },
  { month: "T12", current: 2620, previous: 2340 },
];

const departmentAvgSalary = [
  { name: "CNTT",       avgSalary: 30 },
  { name: "Kế toán",    avgSalary: 23 },
  { name: "Kinh doanh", avgSalary: 32 },
  { name: "Marketing",  avgSalary: 25 },
  { name: "Nhân sự",    avgSalary: 21 },
  { name: "Hành chính", avgSalary: 19 },
];

// Tab Cổ tức
const dividendData = [
  { name: "Nguyễn Quốc Anh", shares: 50000, pct: 25, dividend: 500_000_000 },
  { name: "Trần Văn Bình",   shares: 40000, pct: 20, dividend: 400_000_000 },
  { name: "Lê Thị Cẩm",      shares: 30000, pct: 15, dividend: 300_000_000 },
  { name: "Phạm Văn Dũng",   shares: 80000, pct: 40, dividend: 800_000_000 },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

/* ============================================================
   TABS CONFIG
   ============================================================ */
const TABS = [
  { id: "hr",       label: "Nhân sự" },
  { id: "payroll",  label: "Tiền lương" },
  { id: "dividend", label: "Cổ tức" },
];

/* ============================================================
   COMPONENT
   ============================================================ */
export default function Reports() {
  const [activeTab, setActiveTab] = useState("hr");

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h3>Báo cáo &amp; Phân tích</h3>
          <p>Thống kê nhân sự, tiền lương và cổ tức</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <FileText size={15} /> Xuất PDF
          </button>
          <button className="btn btn-outline-success btn-sm d-flex align-items-center gap-1">
            <FileSpreadsheet size={15} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <ul className="nav nav-tabs">
          {TABS.map((tab) => (
            <li className="nav-item" key={tab.id}>
              <button
                className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ fontWeight: activeTab === tab.id ? 600 : 400, cursor: "pointer" }}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab: Nhân sự */}
      {activeTab === "hr" && (
        <div className="row g-4">
          {/* BarChart — Số NV theo trạng thái */}
          <div className="col-12 col-lg-6">
            <div className="content-card">
              <h5>Số nhân viên theo trạng thái</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeStatusCount} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Số NV" radius={[4, 4, 0, 0]}>
                    {employeeStatusCount.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AreaChart — Tỷ lệ nghỉ việc theo quý */}
          <div className="col-12 col-lg-6">
            <div className="content-card">
              <h5>Tỷ lệ nghỉ việc theo quý (%)</h5>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={quarterlyTurnover} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="turnoverGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}%`, "Tỷ lệ nghỉ"]} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#ef4444"
                    fill="url(#turnoverGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tiền lương */}
      {activeTab === "payroll" && (
        <div className="row g-4">
          {/* LineChart — So sánh quỹ lương */}
          <div className="col-12 col-lg-6">
            <div className="content-card">
              <h5>So sánh quỹ lương 2025 vs 2024 (triệu VNĐ)</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={yearlyPayrollComparison} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v} triệu`, ""]} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name="Năm 2025"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    name="Năm 2024"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BarChart ngang — Lương TB theo phòng ban */}
          <div className="col-12 col-lg-6">
            <div className="content-card">
              <h5>Lương trung bình theo phòng ban (triệu VNĐ)</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={departmentAvgSalary}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip formatter={(v) => [`${v} triệu`, "TB Lương"]} />
                  <Bar dataKey="avgSalary" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Cổ tức */}
      {activeTab === "dividend" && (
        <div className="content-card">
          <h5>Báo cáo cổ tức nội bộ</h5>
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Cổ đông</th>
                  <th className="text-end">Số cổ phần</th>
                  <th className="text-end">Tỷ lệ (%)</th>
                  <th className="text-end">Cổ tức (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {dividendData.map((s, i) => (
                  <tr key={i}>
                    <td className="fw-semibold">{s.name}</td>
                    <td className="text-end">{s.shares.toLocaleString("vi-VN")}</td>
                    <td className="text-end">{s.pct}%</td>
                    <td className="text-end fw-semibold">{formatCurrency(s.dividend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
