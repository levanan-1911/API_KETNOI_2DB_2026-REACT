import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, Eye, Edit3, TrendingUp,
  TrendingDown, Users, RefreshCw, X, Check, AlertCircle, Download,
} from "lucide-react";
import { exportPayrollExcel, exportPayrollPDF, exportAttendanceExcel, exportAttendancePDF } from "../utils/exportUtils";

/* ── helpers ─────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

const fmtShort = (n) => {
  if (!n) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + " tỷ";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " tr";
  return new Intl.NumberFormat("vi-VN").format(n);
};

/* ── Modal điều chỉnh lương ──────────────────────────── */
function AdjustModal({ row, onClose, onSaved }) {
  const [form, setForm] = useState({
    BaseSalary: row.BaseSalary,
    Bonus:      row.Bonus,
    Deductions: row.Deductions,
    Note:       "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const net = Number(form.BaseSalary || 0)
            + Number(form.Bonus      || 0)
            - Number(form.Deductions || 0);

  const handleSave = () => {
    if (Number(form.BaseSalary) < 0 || Number(form.Bonus) < 0 || Number(form.Deductions) < 0) {
      setErr("Giá trị không được âm"); return;
    }
    setSaving(true);
    fetch(`http://localhost:5000/api/salary/${row.SalaryID}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        BaseSalary: Number(form.BaseSalary),
        Bonus:      Number(form.Bonus),
        Deductions: Number(form.Deductions),
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.status === "success") { onSaved(); onClose(); }
        else setErr(res.msg || "Lỗi không xác định");
      })
      .catch(() => setErr("Không thể kết nối server"))
      .finally(() => setSaving(false));
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #e8ecf0",
                      display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, color: "#1e2a3a" }}>Điều chỉnh lương</h5>
            <p style={{ margin: 0, fontSize: 13, color: "#8a94a6" }}>
              {row.FullName} · {row.SalaryMonthStr || row.SalaryMonth}
            </p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#f4f6fb",
            borderRadius: 8, padding: 6, cursor: "pointer", color: "#5a6478" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {err && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca",
                          borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                          display: "flex", gap: 8, alignItems: "center", color: "#dc2626", fontSize: 13 }}>
              <AlertCircle size={15} /> {err}
            </div>
          )}

          {[
            { key: "BaseSalary", label: "Lương cơ bản", color: "#2563eb" },
            { key: "Bonus",      label: "Thưởng",        color: "#16a34a" },
            { key: "Deductions", label: "Khấu trừ",      color: "#dc2626" },
          ].map(({ key, label, color }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151",
                              display: "block", marginBottom: 5 }}>
                {label}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  className="form-control"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={{ paddingRight: 50 }}
                />
                <span style={{ position: "absolute", right: 12, top: "50%",
                               transform: "translateY(-50%)", fontSize: 11,
                               color, fontWeight: 700 }}>VNĐ</span>
              </div>
            </div>
          ))}

          <div key="Note" style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151",
                            display: "block", marginBottom: 5 }}>
              Lý do điều chỉnh
            </label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Nhập lý do (tuỳ chọn)..."
              value={form.Note}
              onChange={(e) => setForm({ ...form, Note: e.target.value })}
            />
          </div>

          {/* Preview net */}
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px",
                        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#5a6478", fontWeight: 500 }}>Thực nhận dự kiến</span>
            <span style={{ fontSize: 18, fontWeight: 800,
                           color: net >= 0 ? "#16a34a" : "#dc2626" }}>
              {fmt(net)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-sm"
            style={{ background: "#f4f6fb", border: "1px solid #e8ecf0",
                     color: "#5a6478", borderRadius: 8, fontWeight: 600, padding: "8px 18px" }}>
            Huỷ
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {saving ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const color = value >= 15e6 ? "#16a34a" : value >= 10e6 ? "#d97706" : "#dc2626";
  const bg    = value >= 15e6 ? "#f0fdf4" : value >= 10e6 ? "#fffbeb" : "#fef2f2";
  return (
    <span style={{ background: bg, color, padding: "3px 10px",
                   borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
      {fmt(value)}
    </span>
  );
}

/* ── Main Payroll Page ───────────────────────────────── */
export default function Payroll() {
  const nav = useNavigate();

  const [rows,       setRows]       = useState([]);
  const [allEmps,    setAllEmps]    = useState([]); // toàn bộ nhân viên
  const [months,     setMonths]     = useState([]);
  const [month,      setMonth]      = useState("");
  const [search,     setSearch]     = useState("");
  const [filterDept] = useState("all");
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [showNoSalary, setShowNoSalary] = useState(true); // hiện/ẩn NV chưa có lương

  /* Load danh sách tháng */
  useEffect(() => {
    fetch("http://localhost:5000/api/payroll/months")
      .then((r) => r.json())
      .then((data) => {
        setMonths(data);
        if (data.length > 0) setMonth(data[0]);
      })
      .catch(() => {});
    // Load toàn bộ nhân viên để phát hiện người chưa có lương
    fetch("http://localhost:5000/api/employees")
      .then(r => r.json())
      .then(data => setAllEmps(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  /* Load bảng lương */
  const load = useCallback(() => {
    setLoading(true);
    const url = month
      ? `http://localhost:5000/api/payroll?month=${month}`
      : "http://localhost:5000/api/payroll";
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month]);

  useEffect(() => { if (month) load(); }, [month, load]);

  /* Filter */
  // Nhân viên đã có lương tháng này
  const empIdsWithSalary = new Set(rows.map(r => r.EmployeeID));
  // Nhân viên chưa có lương tháng này
  const empsNoSalary = allEmps.filter(e => !empIdsWithSalary.has(e.EmployeeID));

  const filtered = rows.filter((r) => {
    const matchSearch = r.FullName?.toLowerCase().includes(search.toLowerCase()) ||
                        r.DepartmentName?.toLowerCase().includes(search.toLowerCase());
    const matchDept   = filterDept === "all" || r.DepartmentName === filterDept;
    return matchSearch && matchDept;
  });

  const filteredNoSalary = empsNoSalary.filter(e =>
    e.FullName?.toLowerCase().includes(search.toLowerCase()) ||
    e.Department?.toLowerCase().includes(search.toLowerCase())
  );

  /* Summary */
  const totalBase = rows.reduce((s, r) => s + Number(r.BaseSalary || 0), 0);
  const totalBonus = rows.reduce((s, r) => s + Number(r.Bonus || 0), 0);
  const totalDed   = rows.reduce((s, r) => s + Number(r.Deductions || 0), 0);
  const totalNet   = rows.reduce((s, r) => s + Number(r.NetSalary || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h3>Bảng lương</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Quản lý lương, thưởng và khấu trừ nhân viên
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select
            className="form-select"
            style={{ width: "auto", fontSize: 13, borderRadius: 8 }}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {months.map((m) => (
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
          <button onClick={() => exportPayrollExcel(rows, month)} disabled={loading || !rows.length}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontWeight: 600, fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
            <Download size={14} /> Excel
          </button>
          <button onClick={() => exportPayrollPDF(rows, month)} disabled={loading || !rows.length}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontWeight: 600, fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="row g-3">
        {[
          { label: "Tổng nhân viên",  value: rows.length + " người",  icon: Users,      bg: "#eff6ff", color: "#2563eb" },
          { label: "Tổng lương CB",   value: fmtShort(totalBase),     icon: DollarSign, bg: "#f0fdf4", color: "#16a34a" },
          { label: "Tổng thưởng",     value: fmtShort(totalBonus),    icon: TrendingUp, bg: "#fffbeb", color: "#d97706" },
          { label: "Tổng thực nhận",  value: fmtShort(totalNet),      icon: TrendingDown, bg: "#fdf4ff", color: "#9333ea" },
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
          <input
            className="form-control"
            placeholder="Tìm theo tên, phòng ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280, fontSize: 13 }}
          />
          {/* Toggle hiện NV chưa có lương */}
          {empsNoSalary.length > 0 && (
            <button onClick={() => setShowNoSalary(!showNoSalary)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: showNoSalary ? "#fef2f2" : "#f4f6fb",
                border: `1px solid ${showNoSalary ? "#fecaca" : "#e8ecf0"}`,
                borderRadius: 8, color: showNoSalary ? "#dc2626" : "#5a6478",
                fontWeight: 600, fontSize: 12, padding: "6px 12px", cursor: "pointer",
              }}>
              {showNoSalary ? "🔴" : "⚪"} {empsNoSalary.length} NV chưa có lương
            </button>
          )}
          <span style={{ fontSize: 13, color: "#8a94a6", marginLeft: "auto" }}>
            {filtered.length} bản ghi{empsNoSalary.length > 0 ? ` + ${empsNoSalary.length} chưa có lương` : ""}
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="table table-custom mb-0" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ tên</th>
                <th>Phòng ban</th>
                <th>Chức vụ</th>
                <th className="text-end">Lương CB</th>
                <th className="text-end">Thưởng</th>
                <th className="text-end">Khấu trừ</th>
                <th className="text-end">Thực nhận</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(9)].map((_, j) => (
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
                      <td colSpan={9} style={{ textAlign: "center", padding: "48px 0",
                                               color: "#8a94a6", fontSize: 14 }}>
                        Không có dữ liệu
                      </td>
                    </tr>
                  )
                  : filtered.map((r) => (
                    <tr key={r.SalaryID}>
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
                                       borderRadius: 6 }}>
                          {r.DepartmentName || "—"}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: "#5a6478" }}>
                        {r.PositionName || "—"}
                      </td>
                      <td className="text-end" style={{ fontSize: 13, color: "#1e2a3a" }}>
                        {fmt(r.BaseSalary)}
                      </td>
                      <td className="text-end">
                        <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 13 }}>
                          +{fmt(r.Bonus)}
                        </span>
                      </td>
                      <td className="text-end">
                        <span style={{ color: "#dc2626", fontWeight: 600, fontSize: 13 }}>
                          -{fmt(r.Deductions)}
                        </span>
                      </td>
                      <td className="text-end">
                        <StatusBadge value={Number(r.NetSalary)} type="net" />
                      </td>
                      <td className="text-center">
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button
                            onClick={() => nav(`/salary/${r.EmployeeID}/details`)}
                            title="Xem chi tiết"
                            style={{ border: "none", background: "#eff6ff", color: "#2563eb",
                                     borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                                     display: "flex", alignItems: "center", gap: 4, fontSize: 12,
                                     fontWeight: 600 }}
                          >
                            <Eye size={13} /> Chi tiết
                          </button>
                          <button
                            onClick={() => setModal(r)}
                            title="Điều chỉnh lương"
                            style={{ border: "none", background: "#fffbeb", color: "#d97706",
                                     borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                                     display: "flex", alignItems: "center", gap: 4, fontSize: 12,
                                     fontWeight: 600 }}
                          >
                            <Edit3 size={13} /> Điều chỉnh
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>

            {/* Footer tổng */}
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: "12px 16px", color: "#5a6478",
                                           fontSize: 13, fontWeight: 700 }}>
                    Tổng cộng ({filtered.length} NV)
                  </td>
                  <td className="text-end" style={{ padding: "12px 16px", color: "#1e2a3a" }}>
                    {fmt(totalBase)}
                  </td>
                  <td className="text-end" style={{ padding: "12px 16px", color: "#16a34a" }}>
                    +{fmt(totalBonus)}
                  </td>
                  <td className="text-end" style={{ padding: "12px 16px", color: "#dc2626" }}>
                    -{fmt(totalDed)}
                  </td>
                  <td className="text-end" style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#eff6ff", color: "#2563eb",
                                   padding: "4px 12px", borderRadius: 20,
                                   fontSize: 13, fontWeight: 800 }}>
                      {fmt(totalNet)}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}

            {/* Nhân viên chưa có lương tháng này */}
            {!loading && showNoSalary && filteredNoSalary.length > 0 && (
              <tbody>
                <tr>
                  <td colSpan={9} style={{ padding: "10px 16px", background: "#fffbeb",
                                           borderTop: "2px dashed #fde68a" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706",
                                   display: "flex", alignItems: "center", gap: 6 }}>
                      ⚠️ Nhân viên chưa có lương tháng này — cần vào Tính lương để tạo
                    </span>
                  </td>
                </tr>
                {filteredNoSalary.map(e => (
                  <tr key={`no-${e.EmployeeID}`} style={{ background: "#fffbeb", opacity: 0.85 }}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: 12,
                                     background: "#fde68a", padding: "2px 8px",
                                     borderRadius: 6, color: "#92400e" }}>
                        #{e.EmployeeID}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#1e2a3a", fontSize: 13 }}>{e.FullName}</div>
                      <span style={{ fontSize: 10, background: "#fef3c7", color: "#d97706",
                                     border: "1px solid #fde68a", padding: "1px 6px",
                                     borderRadius: 10, fontWeight: 700 }}>
                        Chưa có lương
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "#5a6478", background: "#f4f6fb",
                                     padding: "2px 8px", borderRadius: 6 }}>
                        {e.Department || "—"}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "#5a6478" }}>{e.Position || "—"}</td>
                    <td className="text-end" style={{ color: "#8a94a6", fontSize: 13 }}>—</td>
                    <td className="text-end" style={{ color: "#8a94a6", fontSize: 13 }}>—</td>
                    <td className="text-end" style={{ color: "#8a94a6", fontSize: 13 }}>—</td>
                    <td className="text-end">
                      <span style={{ background: "#f4f6fb", color: "#8a94a6",
                                     padding: "3px 10px", borderRadius: 20,
                                     fontSize: 12, fontWeight: 600 }}>
                        Chưa tính
                      </span>
                    </td>
                    <td className="text-center">
                      <button onClick={() => nav("/payroll-calc")}
                        style={{ border: "1px solid #fde68a", background: "#fffbeb", color: "#d97706",
                                 borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                                 display: "inline-flex", alignItems: "center", gap: 4,
                                 fontSize: 12, fontWeight: 600 }}>
                        ➕ Tạo lương
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <AdjustModal
          row={modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
