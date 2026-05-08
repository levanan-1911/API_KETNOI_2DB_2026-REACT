import { useEffect, useState, useCallback } from "react";
import {
  Calendar, Users, RefreshCw, Clock, CheckCircle, XCircle,
  FileText,
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────── */
const fmtShort = (n) => {
  if (!n) return "0";
  return new Intl.NumberFormat("vi-VN").format(n);
};

function AttendanceStatus({ workDays, absentDays, leaveDays }) {
  const total = workDays + absentDays + leaveDays;
  const workRate = total > 0 ? (workDays / total) * 100 : 0;
  const color = workRate >= 90 ? "#16a34a" : workRate >= 70 ? "#d97706" : "#dc2626";
  const bg = workRate >= 90 ? "#f0fdf4" : workRate >= 70 ? "#fffbeb" : "#fef2f2";
  return (
    <span style={{ background: bg, color, padding: "3px 10px",
                   borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
      {workRate.toFixed(0)}%
    </span>
  );
}

/* ── Main Attendance Page ─────────────────────────────── */
export default function Attendance() {
  const [rows,    setRows]    = useState([]);
  const [employees, setEmployees] = useState([]);
  const [month,   setMonth]   = useState("");
  const [empId,   setEmpId]   = useState("");
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

  /* Load danh sách nhân viên để filter */
  useEffect(() => {
    fetch("http://localhost:5000/api/employees")
      .then((r) => r.json())
      .then((data) => setEmployees(data))
      .catch(() => {});
  }, []);

  /* Set tháng mặc định (tháng hiện tại) */
  useEffect(() => {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setMonth(defaultMonth);
  }, []);

  /* Load bảng chấm công */
  const load = useCallback(() => {
    setLoading(true);
    let url = "http://localhost:5000/api/attendance";
    const params = [];
    if (month) params.push(`month=${month}`);
    if (empId) params.push(`emp_id=${empId}`);
    if (params.length > 0) url += "?" + params.join("&");
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month, empId]);

  useEffect(() => { if (month) load(); }, [month, empId, load]);

  /* Filter */
  const filtered = rows.filter((r) =>
    r.FullName?.toLowerCase().includes(search.toLowerCase())
  );

  /* Summary */
  const totalEmployees = new Set(filtered.map((r) => r.EmployeeID)).size;
  const totalWorkDays = filtered.reduce((s, r) => s + Number(r.WorkDays || 0), 0);
  const totalAbsentDays = filtered.reduce((s, r) => s + Number(r.AbsentDays || 0), 0);
  const totalLeaveDays = filtered.reduce((s, r) => s + Number(r.LeaveDays || 0), 0);

  /* Generate tháng options (12 tháng gần nhất) */
  const monthOptions = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthOptions.push(m);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h3>Chấm công & Nghỉ phép</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Theo dõi tình hình chấm công và nghỉ phép của nhân viên
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select
            className="form-select"
            style={{ width: "auto", fontSize: 13, borderRadius: 8 }}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {new Date(m + "-01").toLocaleDateString("vi-VN",
                  { month: "long", year: "numeric" })}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6,
                     background: "#f4f6fb", border: "1px solid #e8ecf0",
                     borderRadius: 8, color: "#5a6478", fontWeight: 600,
                     fontSize: 13, padding: "7px 14px", cursor: "pointer" }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="row g-3">
        {[
          { label: "Tổng nhân viên",  value: totalEmployees + " người",  icon: Users,      bg: "#eff6ff", color: "#2563eb" },
          { label: "Tổng ngày công",   value: fmtShort(totalWorkDays),     icon: CheckCircle, bg: "#f0fdf4", color: "#16a34a" },
          { label: "Tổng ngày nghỉ",    value: fmtShort(totalLeaveDays),    icon: FileText, bg: "#fffbeb", color: "#d97706" },
          { label: "Tổng ngày vắng",    value: fmtShort(totalAbsentDays),   icon: XCircle, bg: "#fef2f2", color: "#dc2626" },
        ].map((c, i) => (
          <div key={i} className="col-6 col-xl-3">
            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center",
                            justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 11, color: "#8a94a6", fontWeight: 600,
                               textTransform: "uppercase", letterSpacing: "0.5px",
                               margin: "0 0 4px" }}>{c.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#1e2a3a", margin: 0 }}>
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

      {/* ── Table card ── */}
      <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8ecf0",
                      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <select
            className="form-select"
            style={{ width: "auto", fontSize: 13, borderRadius: 8 }}
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
          >
            <option value="">Tất cả nhân viên</option>
            {employees.map((e) => (
              <option key={e.EmployeeID} value={e.EmployeeID}>
                {e.FullName}
              </option>
            ))}
          </select>
          <input
            className="form-control"
            placeholder="Tìm theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280, fontSize: 13 }}
          />
          <span style={{ fontSize: 13, color: "#8a94a6", marginLeft: "auto" }}>
            {filtered.length} bản ghi
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="table table-custom mb-0" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ tên</th>
                <th>Tháng</th>
                <th className="text-center">Ngày công</th>
                <th className="text-center">Ngày vắng</th>
                <th className="text-center">Ngày nghỉ</th>
                <th className="text-center">Tỷ lệ</th>
                <th className="text-center">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j}>
                          <div style={{ height: 16, background: "#f0f4f8",
                                        borderRadius: 4, animation: "shimmer 1.4s infinite",
                                        backgroundSize: "200% 100%",
                                        backgroundImage: "linear-gradient(90deg,#f0f4f8 25%,#e8ecf0 50%,#f0f4f8 75%)" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "48px 0",
                                               color: "#8a94a6", fontSize: 14 }}>
                        Không có dữ liệu chấm công
                      </td>
                    </tr>
                  )
                  : filtered.map((r) => (
                    <tr key={r.AttendanceID}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: 12,
                                       background: "#f4f6fb", padding: "2px 8px",
                                       borderRadius: 6, color: "#5a6478" }}>
                          #{r.EmployeeID}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#1e2a3a" }}>{r.FullName}</td>
                      <td>
                        <span style={{ fontSize: 12, color: "#5a6478",
                                       background: "#f4f6fb", padding: "2px 8px",
                                       borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={12} />
                          {new Date(r.AttendanceMonth).toLocaleDateString("vi-VN",
                            { month: "long", year: "numeric" })}
                        </span>
                      </td>
                      <td className="text-center">
                        <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 14 }}>
                          {r.WorkDays}
                        </span>
                      </td>
                      <td className="text-center">
                        <span style={{ color: "#dc2626", fontWeight: 600, fontSize: 14 }}>
                          {r.AbsentDays}
                        </span>
                      </td>
                      <td className="text-center">
                        <span style={{ color: "#d97706", fontWeight: 600, fontSize: 14 }}>
                          {r.LeaveDays}
                        </span>
                      </td>
                      <td className="text-center">
                        <AttendanceStatus
                          workDays={Number(r.WorkDays)}
                          absentDays={Number(r.AbsentDays)}
                          leaveDays={Number(r.LeaveDays)}
                        />
                      </td>
                      <td className="text-center">
                        <Clock size={14} color="#8a94a6" />
                      </td>
                    </tr>
                  ))}
            </tbody>

            {/* Footer tổng */}
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: "12px 16px", color: "#5a6478",
                                           fontSize: 13, fontWeight: 700 }}>
                    Tổng cộng ({filtered.length} bản ghi)
                  </td>
                  <td className="text-center" style={{ padding: "12px 16px", color: "#16a34a" }}>
                    {totalWorkDays}
                  </td>
                  <td className="text-center" style={{ padding: "12px 16px", color: "#dc2626" }}>
                    {totalAbsentDays}
                  </td>
                  <td className="text-center" style={{ padding: "12px 16px", color: "#d97706" }}>
                    {totalLeaveDays}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
