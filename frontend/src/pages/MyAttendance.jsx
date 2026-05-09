/**
 * MyAttendance.jsx — Trang xem chấm công của chính mình (dành cho Employee)
 */
import { useEffect, useState, useCallback } from "react";
import { Calendar, Clock, AlertCircle, RefreshCw, CheckCircle, Plus, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API = "http://localhost:5000";
const now = new Date();

function Skeleton({ h = 16, w = "100%" }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 6,
      background: "linear-gradient(90deg,#f0f4f8 25%,#e8ecf0 50%,#f0f4f8 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
}

/* ── Modal tạo yêu cầu nghỉ phép ── */
function NewLeaveModal({ empId, onClose, onSaved }) {
  const [form, setForm] = useState({ StartDate: "", EndDate: "", Reason: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const calcDays = () => {
    if (!form.StartDate || !form.EndDate) return 0;
    const diff = new Date(form.EndDate) - new Date(form.StartDate);
    return Math.max(1, Math.round(diff / 86400000) + 1);
  };

  const handleSave = async () => {
    if (!form.StartDate || !form.EndDate) { setErr("Vui lòng chọn ngày"); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/leave-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ EmployeeID: empId, ...form, LeaveDays: calcDays() }),
      }).then(r => r.json());
      if (r.status === "success") { onSaved(); onClose(); }
      else setErr(r.msg || "Lỗi không xác định");
    } catch { setErr("Không thể kết nối server"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
                  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 440,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #e8ecf0",
                      display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h5 style={{ margin: 0, fontWeight: 700, color: "#1e2a3a" }}>Tạo yêu cầu nghỉ phép</h5>
          <button onClick={onClose} style={{ border: "none", background: "#f4f6fb",
            borderRadius: 8, padding: 6, cursor: "pointer", color: "#5a6478" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {err && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
                          padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>
              {err}
            </div>
          )}
          <div className="row g-3" style={{ marginBottom: 14 }}>
            <div className="col-6">
              <label className="form-label">Từ ngày</label>
              <input type="date" className="form-control"
                value={form.StartDate}
                onChange={e => setForm(f => ({ ...f, StartDate: e.target.value }))} />
            </div>
            <div className="col-6">
              <label className="form-label">Đến ngày</label>
              <input type="date" className="form-control"
                value={form.EndDate}
                onChange={e => setForm(f => ({ ...f, EndDate: e.target.value }))} />
            </div>
          </div>
          {form.StartDate && form.EndDate && (
            <div style={{ background: "#eff6ff", borderRadius: 8, padding: "8px 14px",
                          marginBottom: 14, fontSize: 13, color: "#2563eb", fontWeight: 600 }}>
              Số ngày nghỉ: {calcDays()} ngày
            </div>
          )}
          <div>
            <label className="form-label">Lý do</label>
            <textarea className="form-control" rows={3}
              value={form.Reason}
              onChange={e => setForm(f => ({ ...f, Reason: e.target.value }))}
              placeholder="Nhập lý do nghỉ phép..." />
          </div>
        </div>
        <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-sm"
            style={{ background: "#f4f6fb", border: "1px solid #e8ecf0",
                     color: "#5a6478", borderRadius: 8, fontWeight: 600, padding: "8px 18px" }}>
            Huỷ
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {saving ? <RefreshCw size={14} className="spin" /> : <Plus size={14} />}
            {saving ? "Đang tạo..." : "Tạo yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_MAP = {
  Pending:  { label: "Chờ duyệt", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  Approved: { label: "Đã duyệt",  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  Rejected: { label: "Từ chối",   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

export default function MyAttendance() {
  const { user } = useAuth();
  const empId = user?.employeeId || user?.employee_id || user?.EmployeeID;

  const [attRows,      setAttRows]      = useState([]);
  const [leaveRows,    setLeaveRows]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [activeTab,    setActiveTab]    = useState("att");
  const [month,        setMonth]        = useState(now.getMonth() + 1);
  const [year,         setYear]         = useState(now.getFullYear());
  const [showNewLeave, setShowNewLeave] = useState(false);
  const [toast,        setToast]        = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAtt = useCallback(async () => {
    if (!empId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/attendance?emp_id=${empId}&month=${year}-${String(month).padStart(2,"0")}`).then(r => r.json());
      setAttRows(Array.isArray(r) ? r : []);
    } catch {}
    finally { setLoading(false); }
  }, [empId, month, year]);

  const loadLeave = useCallback(async () => {
    if (!empId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/leave-requests?emp_id=${empId}`).then(r => r.json());
      setLeaveRows(r.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [empId]);

  useEffect(() => { if (activeTab === "att") loadAtt(); }, [activeTab, loadAtt]);
  useEffect(() => { if (activeTab === "leave") loadLeave(); }, [activeTab, loadLeave]);

  const years  = [2024, 2025, 2026, 2027];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Tổng hợp chấm công
  const attSummary = attRows.length > 0 ? attRows[0] : null;

  if (!empId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", minHeight: 400, gap: 16, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>📋</div>
        <h4 style={{ color: "#1e2a3a", fontWeight: 700, margin: 0 }}>Tài khoản chưa liên kết nhân viên</h4>
        <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
          Vui lòng liên hệ quản trị viên để được hỗ trợ.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999,
                      background: toast.type === "success" ? "#16a34a" : "#dc2626",
                      color: "#fff", padding: "12px 20px", borderRadius: 12,
                      display: "flex", alignItems: "center", gap: 10,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)", fontSize: 14, fontWeight: 600 }}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h3>Chấm công của tôi</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Xem ngày công và yêu cầu nghỉ phép của bạn
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {activeTab === "att" && (
            <>
              <select className="form-select" style={{ width: "auto", fontSize: 13 }}
                value={month} onChange={e => setMonth(Number(e.target.value))}>
                {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
              </select>
              <select className="form-select" style={{ width: "auto", fontSize: 13 }}
                value={year} onChange={e => setYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
          {activeTab === "leave" && (
            <button onClick={() => setShowNewLeave(true)}
              className="btn btn-primary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Tạo yêu cầu nghỉ
            </button>
          )}
          <button onClick={activeTab === "att" ? loadAtt : loadLeave} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6,
                     background: "#f4f6fb", border: "1px solid #e8ecf0",
                     borderRadius: 8, color: "#5a6478", fontWeight: 600,
                     fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Summary cards — chỉ hiện khi tab chấm công */}
      {activeTab === "att" && attSummary && (
        <div className="row g-3">
          {[
            { label: "Ngày làm việc",  value: attSummary.WorkDays + " ngày",              icon: Calendar,      bg: "#f0fdf4", color: "#16a34a" },
            { label: "Nghỉ phép",      value: attSummary.LeaveDays + " ngày",             icon: CheckCircle,   bg: "#eff6ff", color: "#2563eb" },
            { label: "Vắng mặt",       value: attSummary.AbsentDays + " ngày",            icon: AlertCircle,   bg: "#fef2f2", color: "#dc2626" },
            { label: "Tăng ca",        value: Number(attSummary.OvertimeHours || 0).toFixed(1) + " giờ", icon: Clock, bg: "#fffbeb", color: "#d97706" },
          ].map((c, i) => (
            <div key={i} className="col-6 col-xl-3">
              <div className="stat-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 11, color: "#8a94a6", fontWeight: 600,
                                 textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>
                      {c.label}
                    </p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: "#1e2a3a", margin: 0 }}>
                      {c.value}
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
      )}

      {/* Tab bar + content */}
      <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #e8ecf0", padding: "0 20px" }}>
          {[
            { id: "att",   label: "Chấm công",  icon: Calendar },
            { id: "leave", label: "Nghỉ phép",  icon: CheckCircle },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "14px 16px", background: "none", border: "none",
                  borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
                  color: active ? "#2563eb" : "#5a6478",
                  fontWeight: active ? 700 : 500, fontSize: 14,
                  cursor: "pointer", marginBottom: -1, transition: "all 0.15s",
                }}>
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab chấm công */}
        {activeTab === "att" && (
          <div style={{ overflowX: "auto" }}>
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th className="text-center">Ngày làm</th>
                  <th className="text-center">Nghỉ phép</th>
                  <th className="text-center">Vắng mặt</th>
                  <th className="text-center">Tăng ca (h)</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(3)].map((_, i) => (
                      <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><Skeleton h={14} /></td>)}</tr>
                    ))
                  : attRows.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 0", color: "#8a94a6" }}>
                        Không có dữ liệu chấm công tháng {month}/{year}
                      </td></tr>
                    : attRows.map(r => (
                        <tr key={r.AttendanceID}>
                          <td style={{ fontSize: 13, fontWeight: 600, color: "#1e2a3a" }}>
                            {r.AttendanceMonth
                              ? new Date(r.AttendanceMonth).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
                              : "—"}
                          </td>
                          <td className="text-center">
                            <span style={{ fontWeight: 700, fontSize: 14, color: "#16a34a" }}>{r.WorkDays}</span>
                          </td>
                          <td className="text-center">
                            <span style={{ fontWeight: 600, fontSize: 13, color: "#2563eb" }}>{r.LeaveDays}</span>
                          </td>
                          <td className="text-center">
                            <span style={{ fontWeight: 700, fontSize: 13,
                                           color: r.AbsentDays > 2 ? "#dc2626" : "#1e2a3a" }}>
                              {r.AbsentDays}{r.AbsentDays > 2 && " ⚠️"}
                            </span>
                          </td>
                          <td className="text-center">
                            <span style={{ fontWeight: 600, fontSize: 13,
                                           color: r.OvertimeHours > 20 ? "#d97706" : "#5a6478" }}>
                              {Number(r.OvertimeHours || 0).toFixed(1)}{r.OvertimeHours > 20 && " 🔥"}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: "#8a94a6" }}>{r.Note || "—"}</td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab nghỉ phép */}
        {activeTab === "leave" && (
          <div style={{ overflowX: "auto" }}>
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                  <th className="text-center">Số ngày</th>
                  <th>Lý do</th>
                  <th className="text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(3)].map((_, i) => (
                      <tr key={i}>{[...Array(5)].map((_, j) => <td key={j}><Skeleton h={14} /></td>)}</tr>
                    ))
                  : leaveRows.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px 0", color: "#8a94a6" }}>
                        Chưa có yêu cầu nghỉ phép nào
                      </td></tr>
                    : leaveRows.map(r => {
                        const s = STATUS_MAP[r.Status] || STATUS_MAP.Pending;
                        return (
                          <tr key={r.RequestID}>
                            <td style={{ fontSize: 13 }}>{r.StartDate || "—"}</td>
                            <td style={{ fontSize: 13 }}>{r.EndDate || "—"}</td>
                            <td className="text-center">
                              <span style={{ background: "#eff6ff", color: "#2563eb",
                                             padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                                {r.LeaveDays} ngày
                              </span>
                            </td>
                            <td style={{ fontSize: 13, color: "#5a6478" }}>{r.Reason || "—"}</td>
                            <td className="text-center">
                              <span style={{ background: s.bg, color: s.color,
                                             border: `1px solid ${s.border}`,
                                             padding: "3px 10px", borderRadius: 20,
                                             fontSize: 11, fontWeight: 700 }}>
                                {s.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNewLeave && (
        <NewLeaveModal
          empId={empId}
          onClose={() => setShowNewLeave(false)}
          onSaved={() => { showToast("Tạo yêu cầu thành công"); loadLeave(); }}
        />
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
