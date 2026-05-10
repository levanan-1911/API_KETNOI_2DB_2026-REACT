import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, DollarSign, TrendingUp, Award, RefreshCw,
  Download, AlertCircle,
} from "lucide-react";
import {
  exportPayrollExcel, exportPayrollPDF,
  exportEmployeesExcel, exportEmployeesPDF,
} from "../utils/exportUtils";

const API = "http://localhost:5000";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

const fmtShort = (n) => {
  if (!n && n !== 0) return "—";
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + " tỷ";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + " tr";
  return new Intl.NumberFormat("vi-VN").format(n);
};

const COLORS = ["#2563eb","#16a34a","#d97706","#dc2626","#9333ea","#0891b2","#be185d","#65a30d"];



function Skeleton({ h = 14, w = "100%" }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 6,
      background: "linear-gradient(90deg,#f0f4f8 25%,#e8ecf0 50%,#f0f4f8 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
}

/* ── Custom Tooltip ── */
function CustomTooltip({ active, payload, label, prefix = "", suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e8ecf0", borderRadius: 10,
      padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: 12,
    }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#1e2a3a" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "2px 0", color: p.color, fontWeight: 600 }}>
          {p.name}: {prefix}{typeof p.value === "number" ? fmtShort(p.value) : p.value}{suffix}
        </p>
      ))}
    </div>
  );
}

/* ── Export CSV ── */
function exportCSV(rows, headers, filename) {
  const lines = [
    headers.join(","),
    ...rows.map(r => headers.map(h => `"${r[h] ?? ""}"`).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════
   TAB 1 – NHÂN SỰ
   ══════════════════════════════════════════════════════════ */
function TabHR() {
  const [employees, setEmployees] = useState([]);
  const [depts,     setDepts]     = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/employees`).then(r => r.json()),
      fetch(`${API}/api/departments/stats`).then(r => r.json()),
    ]).then(([emps, deptRes]) => {
      setEmployees(Array.isArray(emps) ? emps : []);
      setDepts(deptRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  /* Tổng hợp */
  const summary = {
    total:       employees.length,
    active:      employees.filter(e => ["Active","Đang làm việc"].includes(e.Status)).length,
    probation:   employees.filter(e => ["Thử việc"].includes(e.Status)).length,
    intern:      employees.filter(e => ["Thực tập"].includes(e.Status)).length,
    onLeave:     employees.filter(e => ["OnLeave","Nghỉ phép"].includes(e.Status)).length,
    inactive:    employees.filter(e => ["Inactive","Đã nghỉ","Đã nghỉ việc"].includes(e.Status)).length,
  };

  /* Dữ liệu biểu đồ trạng thái */
  const statusData = [
    { name: "Đang làm",  value: summary.active,    fill: "#16a34a" },
    { name: "Thử việc",  value: summary.probation, fill: "#2563eb" },
    { name: "Thực tập",  value: summary.intern,    fill: "#0891b2" },
    { name: "Nghỉ phép", value: summary.onLeave,   fill: "#d97706" },
    { name: "Đã nghỉ",   value: summary.inactive,  fill: "#dc2626" },
  ].filter(d => d.value > 0);

  /* Dữ liệu biểu đồ phòng ban */
  const deptChart = depts
    .filter(d => d.TotalEmployees > 0)
    .sort((a, b) => b.TotalEmployees - a.TotalEmployees)
    .slice(0, 8)
    .map(d => ({ name: d.DepartmentName, NV: d.TotalEmployees, LuongTB: Math.round(d.AvgSalary / 1e6) }));

  const handleExport = () => {
    exportCSV(
      employees.map(e => ({ EmployeeID: e.EmployeeID, FullName: e.FullName, Department: e.Department, Position: e.Position, Status: e.Status, HireDate: e.HireDate })),
      ["EmployeeID","FullName","Department","Position","Status","HireDate"],
      "bao-cao-nhan-su.csv"
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { label: "Tổng nhân viên", value: summary.total,     color: "#2563eb", bg: "#eff6ff", icon: Users },
          { label: "Đang làm việc",  value: summary.active,    color: "#16a34a", bg: "#f0fdf4", icon: Users },
          ...(summary.probation > 0 ? [{ label: "Thử việc", value: summary.probation, color: "#2563eb", bg: "#eff6ff", icon: Users }] : []),
          ...(summary.intern    > 0 ? [{ label: "Thực tập", value: summary.intern,    color: "#0891b2", bg: "#ecfeff", icon: Users }] : []),
          { label: "Nghỉ phép",      value: summary.onLeave,   color: "#d97706", bg: "#fffbeb", icon: Users },
          { label: "Đã nghỉ việc",   value: summary.inactive,  color: "#dc2626", bg: "#fef2f2", icon: Users },
        ].map((c, i) => (
          <div key={i} className="stat-card" style={{ flex: "1 1 160px", minWidth: 160 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 11, color: "#8a94a6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px", whiteSpace: "nowrap" }}>{c.label}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#1e2a3a", margin: 0 }}>
                  {loading ? "—" : c.value}
                </p>
              </div>
              <div className="stat-icon" style={{ background: c.bg, flexShrink: 0 }}>
                <c.icon size={20} color={c.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="row g-3">
        {/* Bar chart: NV theo phòng ban */}
        <div className="col-12 col-lg-7">
          <div className="content-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h6 style={{ margin: 0, fontWeight: 700, color: "#1e2a3a" }}>Nhân viên theo phòng ban</h6>
              <span style={{ fontSize: 11, color: "#8a94a6" }}>Dữ liệu thực</span>
            </div>
            {loading ? <Skeleton h={260} /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptChart} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip suffix=" người" />} />
                  <Bar dataKey="NV" name="Nhân viên" radius={[4, 4, 0, 0]}>
                    {deptChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie chart: Trạng thái */}
        <div className="col-12 col-lg-5">
          <div className="content-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h6 style={{ margin: 0, fontWeight: 700, color: "#1e2a3a" }}>Tỷ lệ trạng thái</h6>
              <span style={{ fontSize: 11, color: "#8a94a6" }}>{summary.total} nhân viên</span>
            </div>
            {loading ? <Skeleton h={260} /> : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" paddingAngle={3}>
                      {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v + " người", n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
                  {statusData.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.fill }} />
                      <span style={{ color: "#5a6478" }}>{d.name}</span>
                      <span style={{ fontWeight: 700, color: "#1e2a3a" }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bảng phòng ban */}
      <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8ecf0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h6 style={{ margin: 0, fontWeight: 700, color: "#1e2a3a" }}>Chi tiết theo phòng ban</h6>
          <button onClick={() => exportEmployeesExcel(employees)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontWeight: 600, fontSize: 12, padding: "6px 12px", cursor: "pointer" }}>
            <Download size={13} /> Excel
          </button>
          <button onClick={() => exportEmployeesPDF(employees)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontWeight: 600, fontSize: 12, padding: "6px 12px", cursor: "pointer" }}>
            <Download size={13} /> PDF
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th>Phòng ban</th>
                <th className="text-center">Số NV</th>
                <th>Trưởng phòng</th>
                <th className="text-end">Lương TB</th>
                <th>Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(5)].map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
              )) : depts.map((d, i) => {
                const pct = summary.total > 0 ? Math.round((d.TotalEmployees / summary.total) * 100) : 0;
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#1e2a3a" }}>{d.DepartmentName}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {d.TotalEmployees}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#5a6478" }}>{d.Manager || "—"}</td>
                    <td className="text-end" style={{ fontSize: 13, fontWeight: 600, color: "#1e2a3a" }}>
                      {d.AvgSalary > 0 ? fmtShort(d.AvgSalary) : "—"}
                    </td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 6, background: "#f0f4f8", borderRadius: 4 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: 4, transition: "width 0.6s ease" }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#8a94a6", minWidth: 28 }}>{pct}%</span>
                      </div>
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
}

/* ══════════════════════════════════════════════════════════
   TAB 2 – TIỀN LƯƠNG
   ══════════════════════════════════════════════════════════ */
function TabPayroll() {
  const [rows,    setRows]    = useState([]);
  const [months,  setMonths]  = useState([]);
  const [month,   setMonth]   = useState("");
  const [depts,   setDepts]   = useState([]);
  const [loading, setLoading] = useState(true);

  /* Load tháng */
  useEffect(() => {
    fetch(`${API}/api/payroll/months`).then(r => r.json()).then(data => {
      setMonths(data);
      if (data.length) setMonth(data[0]);
    });
  }, []);

  /* Load lương theo tháng */
  const load = useCallback(() => {
    if (!month) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/payroll?month=${month}`).then(r => r.json()),
      fetch(`${API}/api/departments/stats`).then(r => r.json()),
    ]).then(([payroll, deptRes]) => {
      setRows(Array.isArray(payroll) ? payroll : []);
      setDepts(deptRes.data || []);
    }).finally(() => setLoading(false));
  }, [month]);

  useEffect(() => { load(); }, [load]);

  /* Summary */
  const totalBase = rows.reduce((s, r) => s + Number(r.BaseSalary || 0), 0);
  const totalBonus= rows.reduce((s, r) => s + Number(r.Bonus || 0), 0);
  const totalDed  = rows.reduce((s, r) => s + Number(r.Deductions || 0), 0);
  const totalNet  = rows.reduce((s, r) => s + Number(r.NetSalary || 0), 0);
  const avgNet    = rows.length ? totalNet / rows.length : 0;

  /* Biểu đồ: lương theo từng NV */
  const empChart = rows.slice(0, 10).map(r => ({
    name:    r.FullName?.split(" ").slice(-1)[0] || r.FullName,
    LuongCB: Math.round(Number(r.BaseSalary) / 1e6),
    ThuNhan: Math.round(Number(r.NetSalary)  / 1e6),
  }));

  /* Biểu đồ: lương TB theo phòng ban */
  const deptPayChart = depts
    .filter(d => d.AvgSalary > 0)
    .sort((a, b) => b.AvgSalary - a.AvgSalary)
    .map(d => ({ name: d.DepartmentName, LuongTB: Math.round(d.AvgSalary / 1e6) }));

  const handleExport = () => {
    exportCSV(
      rows.map(r => ({ EmployeeID: r.EmployeeID, FullName: r.FullName, Department: r.DepartmentName, Position: r.PositionName, BaseSalary: r.BaseSalary, Bonus: r.Bonus, Deductions: r.Deductions, NetSalary: r.NetSalary })),
      ["EmployeeID","FullName","Department","Position","BaseSalary","Bonus","Deductions","NetSalary"],
      `bang-luong-${month}.csv`
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filter */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select className="form-select" style={{ width: "auto", fontSize: 13 }}
          value={month} onChange={e => setMonth(e.target.value)}>
          {months.map(m => (
            <option key={m} value={m}>
              {new Date(m + "-01").toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
            </option>
          ))}
        </select>
        <button onClick={load} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#f4f6fb", border: "1px solid #e8ecf0", borderRadius: 8, color: "#5a6478", fontWeight: 600, fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Làm mới
        </button>
        <button onClick={() => exportPayrollExcel(rows, month)} disabled={loading || !rows.length}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontWeight: 600, fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
          <Download size={14} /> Excel
        </button>
        <button onClick={() => exportPayrollPDF(rows, month)} disabled={loading || !rows.length}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontWeight: 600, fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
          <Download size={14} /> PDF
        </button>
      </div>

      {/* Summary cards */}
      <div className="row g-3">
        {[
          { label: "Tổng quỹ lương",  value: fmtShort(totalNet),  color: "#2563eb", bg: "#eff6ff", icon: DollarSign },
          { label: "Lương CB trung bình", value: fmtShort(avgNet), color: "#16a34a", bg: "#f0fdf4", icon: TrendingUp },
          { label: "Tổng thưởng",     value: fmtShort(totalBonus),color: "#d97706", bg: "#fffbeb", icon: Award },
          { label: "Tổng khấu trừ",   value: fmtShort(totalDed),  color: "#dc2626", bg: "#fef2f2", icon: AlertCircle },
        ].map((c, i) => (
          <div key={i} className="col-6 col-xl-3">
            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 11, color: "#8a94a6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>{c.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "#1e2a3a", margin: 0 }}>
                    {loading ? "—" : c.value}
                  </p>
                </div>
                <div className="stat-icon" style={{ background: c.bg }}>
                  <c.icon size={20} color={c.color} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-3">
        {/* Grouped bar: Lương CB vs Thực nhận */}
        <div className="col-12 col-lg-7">
          <div className="content-card">
            <h6 style={{ margin: "0 0 16px", fontWeight: 700, color: "#1e2a3a" }}>
              Lương cơ bản vs Thực nhận (triệu VNĐ)
            </h6>
            {loading ? <Skeleton h={260} /> : rows.length === 0 ? (
              <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#8a94a6", fontSize: 13 }}>
                Không có dữ liệu tháng này
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={empChart} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip suffix=" tr" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="LuongCB" name="Lương CB" fill="#93c5fd" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="ThuNhan" name="Thực nhận" fill="#2563eb" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar ngang: Lương TB theo phòng ban */}
        <div className="col-12 col-lg-5">
          <div className="content-card">
            <h6 style={{ margin: "0 0 16px", fontWeight: 700, color: "#1e2a3a" }}>
              Lương TB theo phòng ban (triệu)
            </h6>
            {loading ? <Skeleton h={260} /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptPayChart} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip content={<CustomTooltip suffix=" tr" />} />
                  <Bar dataKey="LuongTB" name="Lương TB" fill="#16a34a" radius={[0, 4, 4, 0]}>
                    {deptPayChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bảng chi tiết */}
      <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8ecf0" }}>
          <h6 style={{ margin: 0, fontWeight: 700, color: "#1e2a3a" }}>
            Chi tiết bảng lương — {rows.length} nhân viên
          </h6>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table table-custom mb-0" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th className="text-end">Lương CB</th>
                <th className="text-end">Thưởng</th>
                <th className="text-end">Khấu trừ</th>
                <th className="text-end">Thực nhận</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
              )) : rows.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 0", color: "#8a94a6" }}>
                  Không có dữ liệu
                </td></tr>
              ) : rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1e2a3a" }}>{r.FullName}</div>
                    <div style={{ fontSize: 11, color: "#8a94a6" }}>{r.PositionName}</div>
                  </td>
                  <td><span style={{ fontSize: 12, color: "#5a6478", background: "#f4f6fb", padding: "2px 8px", borderRadius: 6 }}>{r.DepartmentName || "—"}</span></td>
                  <td className="text-end" style={{ fontSize: 13 }}>{fmt(r.BaseSalary)}</td>
                  <td className="text-end"><span style={{ color: "#16a34a", fontWeight: 600, fontSize: 13 }}>+{fmt(r.Bonus)}</span></td>
                  <td className="text-end"><span style={{ color: "#dc2626", fontWeight: 600, fontSize: 13 }}>-{fmt(r.Deductions)}</span></td>
                  <td className="text-end">
                    <span style={{ background: "#eff6ff", color: "#2563eb", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {fmt(r.NetSalary)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {!loading && rows.length > 0 && (
              <tfoot>
                <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                  <td colSpan={2} style={{ padding: "12px 16px", color: "#5a6478", fontSize: 13 }}>Tổng cộng ({rows.length} NV)</td>
                  <td className="text-end" style={{ padding: "12px 16px" }}>{fmt(totalBase)}</td>
                  <td className="text-end" style={{ padding: "12px 16px", color: "#16a34a" }}>+{fmt(totalBonus)}</td>
                  <td className="text-end" style={{ padding: "12px 16px", color: "#dc2626" }}>-{fmt(totalDed)}</td>
                  <td className="text-end" style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 800 }}>{fmt(totalNet)}</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 3 – CỔ TỨC
   ══════════════════════════════════════════════════════════ */
function TabDividend() {
  const currentYear = new Date().getFullYear();
  const [year,    setYear]    = useState("");   // sẽ set sau khi biết năm có dữ liệu
  const [years,   setYears]   = useState([]);
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  /* Load danh sách năm có dữ liệu từ API trước */
  useEffect(() => {
    fetch(`${API}/api/reports/dividend`)
      .then(r => r.json())
      .then(res => {
        const allData = res.data || [];
        // Lấy các năm duy nhất từ FirstDate
        const yearSet = [...new Set(allData.map(d => d.FirstDate?.slice(0, 4)).filter(Boolean))].sort((a, b) => b - a);
        // Nếu không có năm nào từ data, fallback về 5 năm gần nhất
        const yearList = yearSet.length > 0 ? yearSet : Array.from({ length: 5 }, (_, i) => String(currentYear - i));
        setYears(yearList);
        setYear(yearList[0] || String(currentYear));
      });
  }, [currentYear]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/reports/dividend?year=${year}`)
      .then(r => r.json())
      .then(res => { setData(res.data || []); setTotal(res.GrandTotal || 0); })
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const maxAmt = data.length ? Math.max(...data.map(d => d.TotalAmount)) : 1;

  /* Pie chart: cổ tức theo phòng ban */
  const deptPie = Object.entries(
    data.reduce((acc, d) => {
      const k = d.DepartmentName || "Khác";
      acc[k] = (acc[k] || 0) + d.TotalAmount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const handleExport = () => {
    // Export cổ tức ra Excel
    const XLSX = require("xlsx");
    const exportData = data.map((r, i) => ({
      "STT": i + 1,
      "Mã NV": r.EmployeeID,
      "Họ và tên": r.FullName,
      "Phòng ban": r.DepartmentName || "",
      "Chức vụ": r.PositionName || "",
      "Số lần": r.TotalRecords,
      "Tổng cổ tức (đ)": Number(r.TotalAmount || 0),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = [{ wch: 5 }, { wch: 8 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Co tuc ${year}`);
    XLSX.writeFile(wb, `co-tuc-${year}.xlsx`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filter */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <select className="form-select" style={{ width: "auto", fontSize: 13 }}
          value={year} onChange={e => setYear(e.target.value)}>
          {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
        </select>
        <button onClick={load} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#f4f6fb", border: "1px solid #e8ecf0", borderRadius: 8, color: "#5a6478", fontWeight: 600, fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Làm mới
        </button>
        <button onClick={handleExport} disabled={loading || !data.length}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontWeight: 600, fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
          <Download size={14} /> Excel
        </button>
      </div>

      {/* Summary cards */}
      <div className="row g-3">
        {[
          { label: "Tổng cổ tức",      value: fmtShort(total),                                    color: "#9333ea", bg: "#fdf4ff", icon: Award },
          { label: "Số nhân viên",      value: (loading ? "—" : data.length) + " NV",              color: "#2563eb", bg: "#eff6ff", icon: Users },
          { label: "TB mỗi nhân viên",  value: data.length ? fmtShort(total / data.length) : "—", color: "#16a34a", bg: "#f0fdf4", icon: TrendingUp },
          { label: "Cao nhất",          value: data.length ? fmtShort(data[0]?.TotalAmount) : "—", color: "#d97706", bg: "#fffbeb", icon: DollarSign },
        ].map((c, i) => (
          <div key={i} className="col-6 col-xl-3">
            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 11, color: "#8a94a6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>{c.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "#1e2a3a", margin: 0 }}>
                    {loading ? "—" : c.value}
                  </p>
                </div>
                <div className="stat-icon" style={{ background: c.bg }}>
                  <c.icon size={20} color={c.color} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Table */}
      <div className="row g-3">
        {/* Bảng */}
        <div className="col-12 col-lg-7">
          <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8ecf0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h6 style={{ margin: 0, fontWeight: 700, color: "#1e2a3a" }}>Danh sách nhận cổ tức — {year}</h6>
              <span style={{ fontSize: 12, color: "#8a94a6" }}>{data.length} nhân viên</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Họ tên</th>
                    <th>Phòng ban</th>
                    <th className="text-center">Số lần</th>
                    <th className="text-end">Tổng cổ tức</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? [...Array(5)].map((_, i) => (
                    <tr key={i}>{[...Array(5)].map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
                  )) : data.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px 0", color: "#8a94a6" }}>
                      Không có dữ liệu cổ tức năm {year}
                    </td></tr>
                  ) : data.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <span style={{ width: 24, height: 24, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                          {i + 1}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1e2a3a" }}>{row.FullName}</div>
                        <div style={{ fontSize: 11, color: "#8a94a6" }}>{row.PositionName}</div>
                      </td>
                      <td><span style={{ fontSize: 12, color: "#5a6478", background: "#f4f6fb", padding: "2px 8px", borderRadius: 6 }}>{row.DepartmentName || "—"}</span></td>
                      <td className="text-center">
                        <span style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{row.TotalRecords}</span>
                      </td>
                      <td className="text-end">
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#9333ea" }}>{fmt(row.TotalAmount)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {!loading && data.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#f8fafc" }}>
                      <td colSpan={4} style={{ padding: "12px 16px", fontWeight: 700, color: "#5a6478", fontSize: 13 }}>Tổng cộng</td>
                      <td className="text-end" style={{ padding: "12px 16px" }}>
                        <span style={{ background: "#fdf4ff", color: "#9333ea", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 800 }}>{fmt(total)}</span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Right column: bar + pie */}
        <div className="col-12 col-lg-5" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Bar chart */}
          <div className="content-card">
            <h6 style={{ margin: "0 0 14px", fontWeight: 700, color: "#1e2a3a" }}>Top nhân viên</h6>
            {loading ? <Skeleton h={180} /> : data.slice(0, 6).map((row, i) => {
              const pct = maxAmt > 0 ? (row.TotalAmount / maxAmt) * 100 : 0;
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{row.FullName}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#9333ea" }}>{fmtShort(row.TotalAmount)}</span>
                  </div>
                  <div style={{ height: 7, background: "#f0f4f8", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: 4, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pie chart: theo phòng ban */}
          {!loading && deptPie.length > 0 && (
            <div className="content-card">
              <h6 style={{ margin: "0 0 14px", fontWeight: 700, color: "#1e2a3a" }}>Theo phòng ban</h6>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={deptPie} cx="50%" cy="50%"
                    innerRadius={45} outerRadius={80}
                    dataKey="value" paddingAngle={3}
                  >
                    {deptPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [fmtShort(v), n]} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend tự vẽ — 2 cột, gọn */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4px 12px",
                marginTop: 10,
              }}>
                {deptPie.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: COLORS[i % COLORS.length], flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 11, color: "#5a6478",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }} title={d.name}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function Reports() {
  const [activeTab, setActiveTab] = useState("hr");

  const TABS = [
    { id: "hr",       label: "👥 Nhân sự",    },
    { id: "payroll",  label: "💰 Tiền lương",  },
    { id: "dividend", label: "🏆 Cổ tức",      },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h3>Báo cáo &amp; Phân tích</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Thống kê nhân sự, tiền lương và cổ tức từ dữ liệu thực
          </p>
        </div>
      </div>

      {/* Tab card */}
      <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #e8ecf0", padding: "0 20px" }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "14px 20px", background: "none", border: "none",
                  borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
                  color: active ? "#2563eb" : "#5a6478",
                  fontWeight: active ? 700 : 500, fontSize: 14,
                  cursor: "pointer", marginBottom: -1, transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab body */}
        <div style={{ padding: 20 }}>
          {activeTab === "hr"       && <TabHR />}
          {activeTab === "payroll"  && <TabPayroll />}
          {activeTab === "dividend" && <TabDividend />}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

