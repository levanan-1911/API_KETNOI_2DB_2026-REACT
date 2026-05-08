import { useEffect, useState, useCallback } from "react";
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Plus, X, Check, ChevronDown, Users,
  FileText, Search, Edit3,
} from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

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

const STATUS_MAP = {
  Pending:  { label: "Chờ duyệt", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  Approved: { label: "Đã duyệt",  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  Rejected: { label: "Từ chối",   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.Pending;
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700,
    }}>{s.label}</span>
  );
}

/* ── Modal chỉnh sửa chấm công ───────────────────────── */
function EditAttModal({ row, onClose, onSaved }) {
  const [form, setForm] = useState({
    WorkDays:      row.WorkDays,
    LeaveDays:     row.LeaveDays,
    AbsentDays:    row.AbsentDays,
    OvertimeHours: row.OvertimeHours,
    Note:          row.Note || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/attendance/${row.AttendanceID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then(r => r.json());
      if (r.status === "success") { onSaved(); onClose(); }
      else setErr(r.msg || "Lỗi không xác định");
    } catch { setErr("Không thể kết nối server"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",
                  display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
      <div style={{ background:"#fff",borderRadius:16,width:"100%",maxWidth:440,
                    boxShadow:"0 20px 60px rgba(0,0,0,0.2)",overflow:"hidden" }}>
        <div style={{ padding:"20px 24px 16px",borderBottom:"1px solid #e8ecf0",
                      display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <h5 style={{ margin:0,fontWeight:700,color:"#1e2a3a" }}>Chỉnh sửa chấm công</h5>
            <p style={{ margin:0,fontSize:13,color:"#8a94a6" }}>
              {row.FullName} · {row.AttendanceMonth}/{row.AttendanceYear}
            </p>
          </div>
          <button onClick={onClose} style={{ border:"none",background:"#f4f6fb",
            borderRadius:8,padding:6,cursor:"pointer",color:"#5a6478" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding:"20px 24px" }}>
          {err && (
            <div style={{ background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,
                          padding:"10px 14px",marginBottom:16,color:"#dc2626",fontSize:13 }}>
              {err}
            </div>
          )}
          <div className="row g-3">
            {[
              { key:"WorkDays",      label:"Ngày làm việc",  color:"#16a34a" },
              { key:"LeaveDays",     label:"Ngày nghỉ phép", color:"#2563eb" },
              { key:"AbsentDays",    label:"Ngày vắng mặt",  color:"#dc2626" },
              { key:"OvertimeHours", label:"Giờ tăng ca",    color:"#d97706", step:0.5 },
            ].map(({ key, label, color, step }) => (
              <div key={key} className="col-6">
                <label style={{ fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4 }}>
                  {label}
                </label>
                <input type="number" className="form-control"
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: Number(e.target.value) })}
                  min={0} step={step || 1}
                  style={{ textAlign:"center",fontSize:14,fontWeight:700,color }} />
              </div>
            ))}
            <div className="col-12">
              <label style={{ fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4 }}>
                Ghi chú
              </label>
              <textarea className="form-control" rows={2}
                value={form.Note}
                onChange={e => setForm({ ...form, Note: e.target.value })}
                placeholder="Ghi chú (tuỳ chọn)..." />
            </div>
          </div>
          <div style={{ background:"#f8fafc",borderRadius:10,padding:"12px 16px",marginTop:14,
                        display:"flex",justifyContent:"space-between" }}>
            <span style={{ fontSize:13,color:"#5a6478" }}>Tổng ngày</span>
            <span style={{ fontWeight:700,color:"#1e2a3a" }}>
              {Number(form.WorkDays)+Number(form.LeaveDays)+Number(form.AbsentDays)} ngày
            </span>
          </div>
        </div>
        <div style={{ padding:"0 24px 20px",display:"flex",gap:10,justifyContent:"flex-end" }}>
          <button onClick={onClose} className="btn btn-sm"
            style={{ background:"#f4f6fb",border:"1px solid #e8ecf0",
                     color:"#5a6478",borderRadius:8,fontWeight:600,padding:"8px 18px" }}>
            Huỷ
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm"
            style={{ display:"flex",alignItems:"center",gap:6 }}>
            {saving ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal tạo yêu cầu nghỉ phép ─────────────────────── */
function NewLeaveModal({ employees, onClose, onSaved }) {
  const [form, setForm] = useState({
    EmployeeID: "", StartDate: "", EndDate: "", Reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const calcDays = () => {
    if (!form.StartDate || !form.EndDate) return 0;
    const diff = new Date(form.EndDate) - new Date(form.StartDate);
    return Math.max(1, Math.round(diff / 86400000) + 1);
  };

  const handleSave = async () => {
    if (!form.EmployeeID || !form.StartDate || !form.EndDate) {
      setErr("Vui lòng điền đầy đủ thông tin"); return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/leave-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, LeaveDays: calcDays() }),
      }).then(r => r.json());
      if (r.status === "success") { onSaved(); onClose(); }
      else setErr(r.msg || "Lỗi không xác định");
    } catch { setErr("Không thể kết nối server"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",
                  display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
      <div style={{ background:"#fff",borderRadius:16,width:"100%",maxWidth:460,
                    boxShadow:"0 20px 60px rgba(0,0,0,0.2)",overflow:"hidden" }}>
        <div style={{ padding:"20px 24px 16px",borderBottom:"1px solid #e8ecf0",
                      display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <h5 style={{ margin:0,fontWeight:700,color:"#1e2a3a" }}>Tạo yêu cầu nghỉ phép</h5>
          <button onClick={onClose} style={{ border:"none",background:"#f4f6fb",
            borderRadius:8,padding:6,cursor:"pointer",color:"#5a6478" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding:"20px 24px" }}>
          {err && (
            <div style={{ background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,
                          padding:"10px 14px",marginBottom:16,color:"#dc2626",fontSize:13 }}>
              {err}
            </div>
          )}
          <div style={{ marginBottom:14 }}>
            <label className="form-label">Nhân viên</label>
            <select className="form-select"
              value={form.EmployeeID}
              onChange={e => setForm({ ...form, EmployeeID: e.target.value })}>
              <option value="">-- Chọn nhân viên --</option>
              {employees.map(e => (
                <option key={e.EmployeeID} value={e.EmployeeID}>{e.FullName}</option>
              ))}
            </select>
          </div>
          <div className="row g-3" style={{ marginBottom:14 }}>
            <div className="col-6">
              <label className="form-label">Từ ngày</label>
              <input type="date" className="form-control"
                value={form.StartDate}
                onChange={e => setForm({ ...form, StartDate: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label">Đến ngày</label>
              <input type="date" className="form-control"
                value={form.EndDate}
                onChange={e => setForm({ ...form, EndDate: e.target.value })} />
            </div>
          </div>
          {form.StartDate && form.EndDate && (
            <div style={{ background:"#eff6ff",borderRadius:8,padding:"8px 14px",
                          marginBottom:14,fontSize:13,color:"#2563eb",fontWeight:600 }}>
              Số ngày nghỉ: {calcDays()} ngày
            </div>
          )}
          <div>
            <label className="form-label">Lý do</label>
            <textarea className="form-control" rows={3}
              value={form.Reason}
              onChange={e => setForm({ ...form, Reason: e.target.value })}
              placeholder="Nhập lý do nghỉ phép..." />
          </div>
        </div>
        <div style={{ padding:"0 24px 20px",display:"flex",gap:10,justifyContent:"flex-end" }}>
          <button onClick={onClose} className="btn btn-sm"
            style={{ background:"#f4f6fb",border:"1px solid #e8ecf0",
                     color:"#5a6478",borderRadius:8,fontWeight:600,padding:"8px 18px" }}>
            Huỷ
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm"
            style={{ display:"flex",alignItems:"center",gap:6 }}>
            {saving ? <RefreshCw size={14} className="spin" /> : <Plus size={14} />}
            {saving ? "Đang tạo..." : "Tạo yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal từ chối ────────────────────────────────────── */
function RejectModal({ req, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleReject = async () => {
    setSaving(true);
    await fetch(`${API}/api/leave-requests/${req.RequestID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", RejectReason: reason }),
    });
    setSaving(false);
    onSaved(); onClose();
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",
                  display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
      <div style={{ background:"#fff",borderRadius:16,width:"100%",maxWidth:400,
                    boxShadow:"0 20px 60px rgba(0,0,0,0.2)",padding:28 }}>
        <h5 style={{ margin:"0 0 6px",fontWeight:700,color:"#1e2a3a" }}>Từ chối yêu cầu</h5>
        <p style={{ fontSize:13,color:"#8a94a6",margin:"0 0 16px" }}>
          {req.FullName} · {req.StartDate} → {req.EndDate}
        </p>
        <label className="form-label">Lý do từ chối</label>
        <textarea className="form-control" rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Nhập lý do từ chối..." />
        <div style={{ display:"flex",gap:10,marginTop:16,justifyContent:"flex-end" }}>
          <button onClick={onClose} className="btn btn-sm"
            style={{ background:"#f4f6fb",border:"1px solid #e8ecf0",
                     color:"#5a6478",borderRadius:8,fontWeight:600,padding:"8px 18px" }}>
            Huỷ
          </button>
          <button onClick={handleReject} disabled={saving}
            style={{ background:"#dc2626",border:"none",borderRadius:8,color:"#fff",
                     fontWeight:700,fontSize:13,padding:"8px 18px",cursor:"pointer",
                     display:"flex",alignItems:"center",gap:6 }}>
            {saving ? <RefreshCw size={14} className="spin" /> : <XCircle size={14} />}
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function Attendance() {
  const [activeTab,   setActiveTab]   = useState("att");
  const [attRows,     setAttRows]     = useState([]);
  const [leaveRows,   setLeaveRows]   = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [depts,       setDepts]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [month,       setMonth]       = useState(now.getMonth() + 1);
  const [year,        setYear]        = useState(now.getFullYear());
  const [filterDept,  setFilterDept]  = useState("");
  const [filterStatus,setFilterStatus]= useState("");
  const [search,      setSearch]      = useState("");
  const [editAtt,     setEditAtt]     = useState(null);
  const [showNewLeave,setShowNewLeave]= useState(false);
  const [rejectReq,   setRejectReq]   = useState(null);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Load dữ liệu ── */
  const loadAtt = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month, year });
      if (filterDept) params.append("dept_id", filterDept);
      const r = await fetch(`${API}/api/attendance/detail?${params}`).then(r => r.json());
      setAttRows(r.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [month, year, filterDept]);

  const loadLeave = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      const r = await fetch(`${API}/api/leave-requests?${params}`).then(r => r.json());
      setLeaveRows(r.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [filterStatus]);

  const loadEmployees = useCallback(async () => {
    const r = await fetch(`${API}/api/employees`).then(r => r.json());
    setEmployees(Array.isArray(r) ? r : []);
  }, []);

  const loadDepts = useCallback(async () => {
    const r = await fetch(`${API}/api/departments`).then(r => r.json());
    setDepts(Array.isArray(r) ? r : []);
  }, []);

  useEffect(() => { loadDepts(); loadEmployees(); }, []);
  useEffect(() => { if (activeTab === "att")   loadAtt();   }, [activeTab, loadAtt]);
  useEffect(() => { if (activeTab === "leave") loadLeave(); }, [activeTab, loadLeave]);

  /* ── Approve ── */
  const handleApprove = async (req) => {
    await fetch(`${API}/api/leave-requests/${req.RequestID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    showToast("Đã duyệt yêu cầu nghỉ phép");
    loadLeave();
  };

  /* ── Filter ── */
  const filteredAtt = attRows.filter(r =>
    r.FullName?.toLowerCase().includes(search.toLowerCase()) ||
    r.DepartmentName?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLeave = leaveRows.filter(r =>
    r.FullName?.toLowerCase().includes(search.toLowerCase()) ||
    r.DepartmentName?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Summary att ── */
  const attSummary = {
    totalEmp:   attRows.length,
    totalWork:  attRows.reduce((s, r) => s + (r.WorkDays || 0), 0),
    totalOT:    attRows.reduce((s, r) => s + (r.OvertimeHours || 0), 0),
    totalAbsent:attRows.reduce((s, r) => s + (r.AbsentDays || 0), 0),
  };

  const leaveSummary = {
    pending:  leaveRows.filter(r => r.Status === "Pending").length,
    approved: leaveRows.filter(r => r.Status === "Approved").length,
    rejected: leaveRows.filter(r => r.Status === "Rejected").length,
    totalDays:leaveRows.filter(r => r.Status === "Approved")
                       .reduce((s, r) => s + (r.LeaveDays || 0), 0),
  };

  const years  = [2024, 2025, 2026, 2027];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:24 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed",bottom:28,right:28,zIndex:9999,
          background: toast.type === "success" ? "#16a34a" : "#dc2626",
          color:"#fff",padding:"12px 20px",borderRadius:12,
          display:"flex",alignItems:"center",gap:10,
          boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
          fontSize:14,fontWeight:600,animation:"slideUp 0.3s ease",
        }}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom:0 }}>
        <div>
          <h3>Chấm công &amp; Nghỉ phép</h3>
          <p style={{ color:"#8a94a6",fontSize:13,margin:0 }}>
            Quản lý ngày công và yêu cầu nghỉ phép nhân viên
          </p>
        </div>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
          {activeTab === "att" && (
            <>
              <select className="form-select" style={{ width:"auto",fontSize:13 }}
                value={month} onChange={e => setMonth(Number(e.target.value))}>
                {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
              </select>
              <select className="form-select" style={{ width:"auto",fontSize:13 }}
                value={year} onChange={e => setYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="form-select" style={{ width:"auto",fontSize:13 }}
                value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                <option value="">Tất cả phòng ban</option>
                {depts.map(d => (
                  <option key={d.DepartmentID} value={d.DepartmentID}>{d.DepartmentName}</option>
                ))}
              </select>
            </>
          )}
          {activeTab === "leave" && (
            <>
              <select className="form-select" style={{ width:"auto",fontSize:13 }}
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Tất cả trạng thái</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Approved">Đã duyệt</option>
                <option value="Rejected">Từ chối</option>
              </select>
              <button onClick={() => setShowNewLeave(true)}
                className="btn btn-primary btn-sm"
                style={{ display:"flex",alignItems:"center",gap:6 }}>
                <Plus size={14} /> Tạo yêu cầu
              </button>
            </>
          )}
          <button onClick={activeTab === "att" ? loadAtt : loadLeave} disabled={loading}
            style={{ display:"flex",alignItems:"center",gap:6,
                     background:"#f4f6fb",border:"1px solid #e8ecf0",
                     borderRadius:8,color:"#5a6478",fontWeight:600,
                     fontSize:13,padding:"7px 14px",cursor:"pointer" }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      {activeTab === "att" ? (
        <div className="row g-3">
          {[
            { label:"Nhân viên",    value: attSummary.totalEmp,              icon:Users,        bg:"#eff6ff",color:"#2563eb" },
            { label:"Tổng ngày công",value: attSummary.totalWork + " ngày",  icon:Calendar,     bg:"#f0fdf4",color:"#16a34a" },
            { label:"Tổng tăng ca", value: attSummary.totalOT.toFixed(1)+"h",icon:Clock,        bg:"#fffbeb",color:"#d97706" },
            { label:"Vắng mặt",     value: attSummary.totalAbsent + " ngày", icon:AlertCircle,  bg:"#fef2f2",color:"#dc2626" },
          ].map((c, i) => (
            <div key={i} className="col-6 col-xl-3">
              <div className="stat-card">
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div>
                    <p style={{ fontSize:11,color:"#8a94a6",fontWeight:600,
                                 textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 4px" }}>
                      {c.label}
                    </p>
                    <p style={{ fontSize:20,fontWeight:800,color:"#1e2a3a",margin:0 }}>
                      {loading ? "—" : c.value}
                    </p>
                  </div>
                  <div className="stat-icon" style={{ background:c.bg }}>
                    <c.icon size={20} color={c.color} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="row g-3">
          {[
            { label:"Chờ duyệt",    value: leaveSummary.pending,              icon:Clock,        bg:"#fffbeb",color:"#d97706" },
            { label:"Đã duyệt",     value: leaveSummary.approved,             icon:CheckCircle,  bg:"#f0fdf4",color:"#16a34a" },
            { label:"Từ chối",      value: leaveSummary.rejected,             icon:XCircle,      bg:"#fef2f2",color:"#dc2626" },
            { label:"Tổng ngày nghỉ",value: leaveSummary.totalDays + " ngày", icon:Calendar,     bg:"#eff6ff",color:"#2563eb" },
          ].map((c, i) => (
            <div key={i} className="col-6 col-xl-3">
              <div className="stat-card">
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div>
                    <p style={{ fontSize:11,color:"#8a94a6",fontWeight:600,
                                 textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 4px" }}>
                      {c.label}
                    </p>
                    <p style={{ fontSize:20,fontWeight:800,color:"#1e2a3a",margin:0 }}>
                      {loading ? "—" : c.value}
                    </p>
                  </div>
                  <div className="stat-icon" style={{ background:c.bg }}>
                    <c.icon size={20} color={c.color} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab bar + content ── */}
      <div className="content-card" style={{ padding:0,overflow:"hidden" }}>
        {/* Tabs */}
        <div style={{ display:"flex",borderBottom:"1px solid #e8ecf0",padding:"0 20px" }}>
          {[
            { id:"att",   label:"Chấm công",  icon:Calendar },
            { id:"leave", label:"Nghỉ phép",  icon:FileText },
          ].map(tab => {
            const Icon   = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                style={{
                  display:"flex",alignItems:"center",gap:8,
                  padding:"14px 16px",background:"none",border:"none",
                  borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
                  color: active ? "#2563eb" : "#5a6478",
                  fontWeight: active ? 700 : 500,fontSize:14,
                  cursor:"pointer",marginBottom:-1,transition:"all 0.15s",
                }}>
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
          {/* Search */}
          <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",
                        padding:"0 4px",gap:8 }}>
            <div style={{ display:"flex",alignItems:"center",gap:6,
                          background:"#f4f6fb",border:"1px solid #e8ecf0",
                          borderRadius:8,padding:"6px 10px" }}>
              <Search size={13} color="#8a94a6" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm nhân viên..."
                style={{ border:"none",background:"transparent",outline:"none",
                         fontSize:12,color:"#1e2a3a",width:140 }} />
            </div>
          </div>
        </div>

        {/* ── Tab Chấm công ── */}
        {activeTab === "att" && (
          <div style={{ overflowX:"auto" }}>
            <table className="table table-custom mb-0" style={{ minWidth:800 }}>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Phòng ban</th>
                  <th className="text-center">Ngày làm</th>
                  <th className="text-center">Nghỉ phép</th>
                  <th className="text-center">Vắng mặt</th>
                  <th className="text-center">Tăng ca (h)</th>
                  <th>Tiến độ</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(8)].map((_, j) => (
                          <td key={j}><Skeleton h={14} /></td>
                        ))}
                      </tr>
                    ))
                  : filteredAtt.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign:"center",padding:"48px 0",
                                                  color:"#8a94a6",fontSize:14 }}>
                          Không có dữ liệu chấm công tháng {month}/{year}
                        </td>
                      </tr>
                    )
                    : filteredAtt.map(r => {
                        const pct = Math.min(100, Math.round((r.WorkDays / 26) * 100));
                        const warnAbsent = r.AbsentDays > 2;
                        const warnOT     = r.OvertimeHours > 20;
                        return (
                          <tr key={r.AttendanceID}>
                            <td>
                              <div style={{ fontWeight:600,fontSize:13,color:"#1e2a3a" }}>
                                {r.FullName}
                              </div>
                              <div style={{ fontSize:11,color:"#8a94a6" }}>{r.PositionName}</div>
                            </td>
                            <td>
                              <span style={{ fontSize:12,color:"#5a6478",background:"#f4f6fb",
                                             padding:"2px 8px",borderRadius:6 }}>
                                {r.DepartmentName || "—"}
                              </span>
                            </td>
                            <td className="text-center">
                              <span style={{ fontWeight:700,fontSize:14,color:"#16a34a" }}>
                                {r.WorkDays}
                              </span>
                            </td>
                            <td className="text-center">
                              <span style={{ fontWeight:600,fontSize:13,color:"#2563eb" }}>
                                {r.LeaveDays}
                              </span>
                            </td>
                            <td className="text-center">
                              <span style={{
                                fontWeight:700,fontSize:13,
                                color: warnAbsent ? "#dc2626" : "#1e2a3a",
                                background: warnAbsent ? "#fef2f2" : "transparent",
                                padding: warnAbsent ? "2px 8px" : 0,
                                borderRadius: warnAbsent ? 20 : 0,
                              }}>
                                {r.AbsentDays}
                                {warnAbsent && " ⚠️"}
                              </span>
                            </td>
                            <td className="text-center">
                              <span style={{
                                fontWeight:600,fontSize:13,
                                color: warnOT ? "#d97706" : "#5a6478",
                              }}>
                                {Number(r.OvertimeHours).toFixed(1)}
                                {warnOT && " 🔥"}
                              </span>
                            </td>
                            <td style={{ minWidth:120 }}>
                              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                                <div style={{ flex:1,height:6,background:"#f0f4f8",borderRadius:4 }}>
                                  <div style={{
                                    height:"100%",width:`${pct}%`,borderRadius:4,
                                    background: pct >= 80 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626",
                                    transition:"width 0.6s ease",
                                  }} />
                                </div>
                                <span style={{ fontSize:11,color:"#8a94a6",minWidth:28 }}>
                                  {pct}%
                                </span>
                              </div>
                            </td>
                            <td className="text-center">
                              <button onClick={() => setEditAtt(r)}
                                style={{ border:"none",background:"#fffbeb",color:"#d97706",
                                         borderRadius:7,padding:"5px 10px",cursor:"pointer",
                                         display:"inline-flex",alignItems:"center",gap:4,
                                         fontSize:12,fontWeight:600 }}>
                                <Edit3 size={13} /> Sửa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab Nghỉ phép ── */}
        {activeTab === "leave" && (
          <div style={{ overflowX:"auto" }}>
            <table className="table table-custom mb-0" style={{ minWidth:900 }}>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Phòng ban</th>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                  <th className="text-center">Số ngày</th>
                  <th>Lý do</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(8)].map((_, j) => (
                          <td key={j}><Skeleton h={14} /></td>
                        ))}
                      </tr>
                    ))
                  : filteredLeave.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign:"center",padding:"48px 0",
                                                  color:"#8a94a6",fontSize:14 }}>
                          Không có yêu cầu nghỉ phép
                        </td>
                      </tr>
                    )
                    : filteredLeave.map(r => (
                        <tr key={r.RequestID}>
                          <td>
                            <div style={{ fontWeight:600,fontSize:13,color:"#1e2a3a" }}>
                              {r.FullName}
                            </div>
                            <div style={{ fontSize:11,color:"#8a94a6" }}>{r.PositionName}</div>
                          </td>
                          <td>
                            <span style={{ fontSize:12,color:"#5a6478",background:"#f4f6fb",
                                           padding:"2px 8px",borderRadius:6 }}>
                              {r.DepartmentName || "—"}
                            </span>
                          </td>
                          <td style={{ fontSize:13 }}>
                            {r.StartDate ? new Date(r.StartDate).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td style={{ fontSize:13 }}>
                            {r.EndDate ? new Date(r.EndDate).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="text-center">
                            <span style={{ background:"#eff6ff",color:"#2563eb",
                                           padding:"2px 10px",borderRadius:20,
                                           fontSize:12,fontWeight:700 }}>
                              {r.LeaveDays} ngày
                            </span>
                          </td>
                          <td style={{ fontSize:13,color:"#5a6478",maxWidth:200 }}>
                            <span title={r.Reason} style={{ display:"block",
                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                              {r.Reason || "—"}
                            </span>
                            {r.RejectReason && (
                              <span style={{ fontSize:11,color:"#dc2626" }}>
                                Lý do từ chối: {r.RejectReason}
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            <StatusBadge status={r.Status} />
                          </td>
                          <td className="text-center">
                            {r.Status === "Pending" ? (
                              <div style={{ display:"flex",gap:6,justifyContent:"center" }}>
                                <button onClick={() => handleApprove(r)}
                                  style={{ border:"none",background:"#f0fdf4",color:"#16a34a",
                                           borderRadius:7,padding:"5px 10px",cursor:"pointer",
                                           display:"inline-flex",alignItems:"center",gap:4,
                                           fontSize:12,fontWeight:600 }}>
                                  <CheckCircle size={13} /> Duyệt
                                </button>
                                <button onClick={() => setRejectReq(r)}
                                  style={{ border:"none",background:"#fef2f2",color:"#dc2626",
                                           borderRadius:7,padding:"5px 10px",cursor:"pointer",
                                           display:"inline-flex",alignItems:"center",gap:4,
                                           fontSize:12,fontWeight:600 }}>
                                  <XCircle size={13} /> Từ chối
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize:12,color:"#8a94a6" }}>
                                {r.ApprovedAt
                                  ? new Date(r.ApprovedAt).toLocaleDateString("vi-VN")
                                  : "—"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {editAtt && (
        <EditAttModal row={editAtt} onClose={() => setEditAtt(null)}
          onSaved={() => { showToast("Cập nhật chấm công thành công"); loadAtt(); }} />
      )}
      {showNewLeave && (
        <NewLeaveModal employees={employees} onClose={() => setShowNewLeave(false)}
          onSaved={() => { showToast("Tạo yêu cầu thành công"); loadLeave(); }} />
      )}
      {rejectReq && (
        <RejectModal req={rejectReq} onClose={() => setRejectReq(null)}
          onSaved={() => { showToast("Đã từ chối yêu cầu"); loadLeave(); }} />
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
