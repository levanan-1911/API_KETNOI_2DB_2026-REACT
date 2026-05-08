import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Search, Plus, Edit3, Trash2, RefreshCw,
  CheckCircle, XCircle, AlertCircle,
  Phone, Mail, Building2, Calendar,
} from "lucide-react";

const API = "http://localhost:5000";

/* Chuẩn hóa chuỗi tiếng Việt — bỏ dấu để tìm kiếm không phân biệt dấu */
const normalize = (str) =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // bỏ dấu
    .replace(/đ/g, "d")               // đ → d
    .replace(/Đ/g, "d");              // Đ → d

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
  // Tiếng Anh (chuẩn)
  "Active":        { label: "Đang làm",    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "Inactive":      { label: "Đã nghỉ",     color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  "OnLeave":       { label: "Nghỉ phép",   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  // Tiếng Việt (thực tế trong DB)
  "Đang làm việc": { label: "Đang làm",    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "Nghỉ phép":     { label: "Nghỉ phép",   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "Thử việc":      { label: "Thử việc",    color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  "Thực tập":      { label: "Thực tập",    color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  "Đã nghỉ":       { label: "Đã nghỉ",     color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  "Đã nghỉ việc":  { label: "Đã nghỉ",     color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status || "—", color: "#5a6478", bg: "#f4f6fb", border: "#e8ecf0" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700,
    }}>{s.label}</span>
  );
}

/* ── Modal xác nhận xóa ── */
function DeleteModal({ emp, onClose, onConfirm, deleting }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", padding: 28,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "#fef2f2", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 16px",
        }}>
          <Trash2 size={22} color="#dc2626" />
        </div>
        <h5 style={{ margin: "0 0 8px", fontWeight: 700, color: "#1e2a3a", textAlign: "center" }}>
          Xác nhận xóa nhân viên
        </h5>
        <p style={{ fontSize: 13, color: "#5a6478", textAlign: "center", margin: "0 0 20px" }}>
          Bạn chắc chắn muốn xóa <strong>{emp.FullName}</strong>?<br />
          Hành động này không thể hoàn tác.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onClose}
            style={{
              background: "#f4f6fb", border: "1px solid #e8ecf0",
              color: "#5a6478", borderRadius: 8, fontWeight: 600,
              fontSize: 13, padding: "9px 22px", cursor: "pointer",
            }}>
            Huỷ
          </button>
          <button onClick={onConfirm} disabled={deleting}
            style={{
              background: "#dc2626", border: "none", borderRadius: 8,
              color: "#fff", fontWeight: 700, fontSize: 13,
              padding: "9px 22px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              opacity: deleting ? 0.7 : 1,
            }}>
            {deleting ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
            {deleting ? "Đang xóa..." : "Xóa nhân viên"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function Employees() {
  const nav = useNavigate();
  const [employees,    setEmployees]    = useState([]);
  const [depts,        setDepts]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [filterDept,   setFilterDept]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [toast,        setToast]        = useState(null);
  const [viewMode,     setViewMode]     = useState("table"); // "table" | "card"

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/employees`).then(r => r.json());
      setEmployees(Array.isArray(r) ? r : []);
    } catch { showToast("Không thể tải danh sách nhân viên", "error"); }
    finally { setLoading(false); }
  }, []);

  const loadDepts = useCallback(async () => {
    const r = await fetch(`${API}/api/departments`).then(r => r.json());
    setDepts(Array.isArray(r) ? r : []);
  }, []);

  useEffect(() => { loadEmployees(); loadDepts(); }, [loadEmployees, loadDepts]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const r = await fetch(`${API}/api/employees/${deleteTarget.EmployeeID}`, {
        method: "DELETE",
      }).then(r => r.json());
      if (r.status === "success") {
        showToast("Đã xóa nhân viên thành công");
        loadEmployees();
      } else {
        showToast(r.msg || "Xóa thất bại", "error");
      }
    } catch { showToast("Không thể kết nối server", "error"); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  /* ── Filter ── */
  const filtered = employees.filter(e => {
    const q = normalize(search);
    const matchSearch = !search ||
      normalize(e.FullName).includes(q) ||
      normalize(e.Email).includes(q) ||
      (e.PhoneNumber || "").includes(search) ||
      normalize(e.Department).includes(q) ||
      normalize(e.Position).includes(q) ||
      String(e.EmployeeID).includes(search);
    const matchDept   = !filterDept   || String(e.DepartmentID) === filterDept;
    const matchStatus = !filterStatus || e.Status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  /* ── Summary ── */
  const summary = {
    total:      employees.length,
    active:     employees.filter(e => ["Active","Đang làm việc"].includes(e.Status)).length,
    probation:  employees.filter(e => e.Status === "Thử việc").length,
    intern:     employees.filter(e => e.Status === "Thực tập").length,
    inactive:   employees.filter(e => ["Inactive","Đã nghỉ","Đã nghỉ việc"].includes(e.Status)).length,
    onLeave:    employees.filter(e => ["OnLeave","Nghỉ phép"].includes(e.Status)).length,
  };

  const avatarColor = (name) => {
    const colors = ["#2563eb","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2","#be185d"];
    let h = 0;
    for (let i = 0; i < (name || "").length; i++) h = (name.charCodeAt(i) + h * 31) % colors.length;
    return colors[h];
  };

  const initials = (name) => (name || "?").split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === "success" ? "#16a34a" : "#dc2626",
          color: "#fff", padding: "12px 20px", borderRadius: 12,
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          fontSize: 14, fontWeight: 600, animation: "slideUp 0.3s ease",
        }}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h3>Nhân viên</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Quản lý thông tin toàn bộ nhân viên trong công ty
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* View toggle */}
          <div style={{
            display: "flex", background: "#f4f6fb",
            border: "1px solid #e8ecf0", borderRadius: 8, overflow: "hidden",
          }}>
            {["table", "card"].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{
                  border: "none", padding: "7px 14px", cursor: "pointer", fontSize: 12,
                  fontWeight: 600,
                  background: viewMode === mode ? "#2563eb" : "transparent",
                  color: viewMode === mode ? "#fff" : "#5a6478",
                  transition: "all 0.15s",
                }}>
                {mode === "table" ? "☰ Bảng" : "⊞ Thẻ"}
              </button>
            ))}
          </div>

          <button onClick={() => nav("/employees/add")}
            className="btn btn-primary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> Thêm nhân viên
          </button>

          <button onClick={loadEmployees} disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#f4f6fb", border: "1px solid #e8ecf0",
              borderRadius: 8, color: "#5a6478", fontWeight: 600,
              fontSize: 13, padding: "7px 14px", cursor: "pointer",
            }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { label: "Tổng nhân viên", value: summary.total,     icon: Users,        bg: "#eff6ff", color: "#2563eb" },
          { label: "Đang làm việc",  value: summary.active,    icon: CheckCircle,  bg: "#f0fdf4", color: "#16a34a" },
          ...(summary.probation > 0 ? [{ label: "Thử việc",  value: summary.probation, icon: Users, bg: "#eff6ff", color: "#2563eb" }] : []),
          ...(summary.intern    > 0 ? [{ label: "Thực tập",  value: summary.intern,    icon: Users, bg: "#ecfeff", color: "#0891b2" }] : []),
          { label: "Nghỉ phép",      value: summary.onLeave,   icon: Calendar,     bg: "#fffbeb", color: "#d97706" },
          { label: "Đã nghỉ việc",   value: summary.inactive,  icon: XCircle,      bg: "#fef2f2", color: "#dc2626" },
        ].map((c, i) => (
          <div key={i} className="stat-card" style={{ flex: "1 1 160px", minWidth: 160 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{
                  fontSize: 11, color: "#8a94a6", fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.5px",
                  margin: "0 0 4px", whiteSpace: "nowrap",
                }}>{c.label}</p>
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

      {/* ── Filter bar ── */}
      <div className="content-card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#f4f6fb", border: "1px solid #e8ecf0",
            borderRadius: 8, padding: "8px 12px", flex: "1 1 200px", minWidth: 180,
          }}>
            <Search size={14} color="#8a94a6" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT, phòng ban, chức vụ..."
              style={{
                border: "none", background: "transparent", outline: "none",
                fontSize: 13, color: "#1e2a3a", width: "100%",
              }} />
            {search && (
              <button onClick={() => setSearch("")}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#8a94a6", padding: 0 }}>
                <XCircle size={14} />
              </button>
            )}
          </div>

          {/* Dept filter */}
          <select className="form-select" style={{ width: "auto", fontSize: 13, minWidth: 160 }}
            value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">Tất cả phòng ban</option>
            {depts.map(d => (
              <option key={d.DepartmentID} value={d.DepartmentID}>{d.DepartmentName}</option>
            ))}
          </select>

          {/* Status filter */}
          <select className="form-select" style={{ width: "auto", fontSize: 13, minWidth: 140 }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="Đang làm việc">Đang làm việc</option>
            <option value="Thử việc">Thử việc</option>
            <option value="Thực tập">Thực tập</option>
            <option value="Nghỉ phép">Nghỉ phép</option>
            <option value="Đã nghỉ việc">Đã nghỉ việc</option>
          </select>

          <span style={{ fontSize: 13, color: "#8a94a6", marginLeft: "auto" }}>
            {filtered.length} / {employees.length} nhân viên
          </span>
        </div>
      </div>

      {/* ── Table view ── */}
      {viewMode === "table" && (
        <div className="content-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-custom mb-0" style={{ minWidth: 780 }}>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Liên hệ</th>
                  <th>Phòng ban</th>
                  <th>Chức vụ</th>
                  <th>Ngày vào</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(6)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(7)].map((_, j) => (
                          <td key={j}><Skeleton h={14} /></td>
                        ))}
                      </tr>
                    ))
                  : filtered.length === 0
                    ? (
                      <tr>
                        <td colSpan={7} style={{
                          textAlign: "center", padding: "56px 0",
                          color: "#8a94a6", fontSize: 14,
                        }}>
                          <div style={{ fontSize: 36, marginBottom: 8 }}>👤</div>
                          Không tìm thấy nhân viên nào
                        </td>
                      </tr>
                    )
                    : filtered.map(emp => (
                        <tr key={emp.EmployeeID}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: "50%",
                                background: avatarColor(emp.FullName),
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0,
                              }}>
                                {initials(emp.FullName)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: "#1e2a3a" }}>
                                  {emp.FullName}
                                </div>
                                <div style={{ fontSize: 11, color: "#8a94a6" }}>
                                  #{emp.EmployeeID}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 12, color: "#5a6478" }}>
                              {emp.Email && (
                                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                  <Mail size={11} color="#8a94a6" />
                                  {emp.Email}
                                </div>
                              )}
                              {emp.PhoneNumber && (
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <Phone size={11} color="#8a94a6" />
                                  {emp.PhoneNumber}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              fontSize: 12, color: "#2563eb", background: "#eff6ff",
                              padding: "3px 10px", borderRadius: 6, fontWeight: 500,
                            }}>
                              {emp.Department || "—"}
                            </span>
                          </td>
                          <td style={{ fontSize: 13, color: "#5a6478" }}>
                            {emp.Position || "—"}
                          </td>
                          <td style={{ fontSize: 12, color: "#8a94a6" }}>
                            {emp.HireDate
                              ? new Date(emp.HireDate).toLocaleDateString("vi-VN")
                              : "—"}
                          </td>
                          <td className="text-center">
                            <StatusBadge status={emp.Status} />
                          </td>
                          <td className="text-center">
                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                              <button onClick={() => nav(`/employees/${emp.EmployeeID}`)}
                                style={{
                                  border: "none", background: "#eff6ff", color: "#2563eb",
                                  borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  fontSize: 12, fontWeight: 600,
                                }}>
                                <Edit3 size={13} /> Sửa
                              </button>
                              <button onClick={() => setDeleteTarget(emp)}
                                style={{
                                  border: "none", background: "#fef2f2", color: "#dc2626",
                                  borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  fontSize: 12, fontWeight: 600,
                                }}>
                                <Trash2 size={13} /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Card view ── */}
      {viewMode === "card" && (
        <div className="row g-3">
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="col-12 col-md-6 col-xl-4">
                  <div className="content-card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                      <Skeleton h={48} w={48} />
                      <div style={{ flex: 1 }}>
                        <Skeleton h={14} w="60%" />
                        <div style={{ marginTop: 6 }}><Skeleton h={11} w="40%" /></div>
                      </div>
                    </div>
                    <Skeleton h={11} /><div style={{ marginTop: 6 }}><Skeleton h={11} /></div>
                  </div>
                </div>
              ))
            : filtered.length === 0
              ? (
                <div className="col-12" style={{ textAlign: "center", padding: "56px 0", color: "#8a94a6" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>👤</div>
                  Không tìm thấy nhân viên nào
                </div>
              )
              : filtered.map(emp => (
                  <div key={emp.EmployeeID} className="col-12 col-md-6 col-xl-4">
                    <div className="content-card" style={{
                      padding: 20, transition: "box-shadow 0.2s",
                      cursor: "default",
                    }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.10)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = ""}>

                      {/* Header */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: "50%",
                          background: avatarColor(emp.FullName),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0,
                        }}>
                          {initials(emp.FullName)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e2a3a",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {emp.FullName}
                          </div>
                          <div style={{ fontSize: 12, color: "#8a94a6", marginTop: 2 }}>
                            #{emp.EmployeeID} · {emp.Position || "—"}
                          </div>
                        </div>
                        <StatusBadge status={emp.Status} />
                      </div>

                      {/* Info rows */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                        {[
                          { icon: Building2, value: emp.Department },
                          { icon: Mail,      value: emp.Email },
                          { icon: Phone,     value: emp.PhoneNumber },
                          { icon: Calendar,  value: emp.HireDate
                              ? "Vào làm: " + new Date(emp.HireDate).toLocaleDateString("vi-VN")
                              : null },
                        ].filter(r => r.value).map((row, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <row.icon size={13} color="#8a94a6" style={{ flexShrink: 0 }} />
                            <span style={{
                              fontSize: 12, color: "#5a6478",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>{row.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div style={{
                        display: "flex", gap: 8, paddingTop: 14,
                        borderTop: "1px solid #f0f4f8",
                      }}>
                        <button onClick={() => nav(`/employees/${emp.EmployeeID}`)}
                          style={{
                            flex: 1, border: "1px solid #e8ecf0", background: "#f8fafc",
                            color: "#2563eb", borderRadius: 8, padding: "7px 0",
                            cursor: "pointer", fontSize: 12, fontWeight: 600,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          }}>
                          <Edit3 size={13} /> Chỉnh sửa
                        </button>
                        <button onClick={() => setDeleteTarget(emp)}
                          style={{
                            flex: 1, border: "1px solid #fecaca", background: "#fef2f2",
                            color: "#dc2626", borderRadius: 8, padding: "7px 0",
                            cursor: "pointer", fontSize: 12, fontWeight: 600,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          }}>
                          <Trash2 size={13} /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          emp={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
