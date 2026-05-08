import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Plus, Edit, Trash2, Search, RefreshCw,
  UserCheck, UserX, Mail, Phone, Building, Briefcase,
  Clock, Coffee, BriefcaseBusiness, AlertCircle, X, CheckCircle2,
} from "lucide-react";

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase().trim();
  
  let config = {
    bg: "#f0fdf4",
    color: "#16a34a",
    icon: UserCheck,
    text: "Đang làm việc"
  };

  if (s === "nghỉ phép" || s === "nghiphep" || s.includes("nghỉ")) {
    config = { bg: "#fffbeb", color: "#d97706", icon: Coffee, text: "Nghỉ phép" };
  } else if (s === "thử việc" || s === "thuviec" || s.includes("thử")) {
    config = { bg: "#eff6ff", color: "#2563eb", icon: BriefcaseBusiness, text: "Thử việc" };
  } else if (s === "inactive" || s === "ngừng" || s === "0") {
    config = { bg: "#fef2f2", color: "#dc2626", icon: UserX, text: "Ngừng hoạt động" };
  }

  const Icon = config.icon;
  
  return (
    <span style={{
      background: config.bg,
      color: config.color,
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }}>
      <Icon size={12} />
      {config.text}
    </span>
  );
}

export default function Employees() {
  const nav = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("http://localhost:5000/api/employees")
      .then((res) => res.json())
      .then((data) => { setEmployees(data); setLoading(false); })
      .catch((err) => { console.error("Lỗi tải danh sách:", err); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteEmployee = (id, name) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa nhân viên "${name}"?`)) return;
    setError(null);
    setSuccess(null);
    fetch(`http://localhost:5000/api/employees/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((rs) => {
        if (rs.status === "success") {
          setSuccess(`Đã xóa nhân viên "${name}" thành công!`);
          setError(null);
          load();
          setTimeout(() => setSuccess(null), 5000);
        } else {
          setError(rs.msg || "Không thể xóa nhân viên");
          setSuccess(null);
        }
      })
      .catch(() => {
        setError("Không thể kết nối server");
        setSuccess(null);
      });
  };

  const filtered = employees.filter((e) =>
    e.FullName?.toLowerCase().includes(search.toLowerCase()) ||
    e.Email?.toLowerCase().includes(search.toLowerCase()) ||
    e.Department?.toLowerCase().includes(search.toLowerCase())
  );

  const isStatusActive = (s) => {
    const status = (s || "").toLowerCase().trim();
    return !status || 
           status.includes("đang") || 
           status.includes("active") || 
           status === "1" ||
           status.includes("thử");
  };

  const totalActive = employees.filter((e) => isStatusActive(e.Status)).length;
  const totalInactive = employees.length - totalActive;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Success alert ── */}
      {success && (
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 10,
          padding: "14px 18px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12
        }}>
          <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: "#16a34a", fontSize: 13, fontWeight: 600 }}>
              Thành công
            </p>
            <p style={{ margin: "4px 0 0", color: "#166534", fontSize: 13 }}>
              {success}
            </p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, color: "#166534" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Error alert ── */}
      {error && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 10,
          padding: "14px 18px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12
        }}>
          <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
              Không thể thực hiện
            </p>
            <p style={{ margin: "4px 0 0", color: "#991b1b", fontSize: 13 }}>
              {error}
            </p>
          </div>
          <button
            onClick={() => setError(null)}
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, color: "#991b1b" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h3>Quản lý nhân viên</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Danh sách toàn bộ nhân viên trong công ty
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => nav("/employees/add")}
            className="btn btn-primary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={14} /> Thêm nhân viên
          </button>
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
          { label: "Tổng nhân viên",  value: employees.length,  icon: Users,      bg: "#eff6ff", color: "#2563eb" },
          { label: "Đang làm việc",   value: totalActive,      icon: UserCheck,  bg: "#f0fdf4", color: "#16a34a" },
          { label: "Không hoạt động", value: totalInactive,    icon: UserX,      bg: "#fef2f2", color: "#dc2626" },
        ].map((c, i) => (
          <div key={i} className="col-6 col-xl-4">
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
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%",
                                        transform: "translateY(-50%)", color: "#8a94a6" }} />
            <input
              className="form-control"
              placeholder="Tìm theo tên, email, phòng ban..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 38, fontSize: 13 }}
            />
          </div>
          <span style={{ fontSize: 13, color: "#8a94a6", marginLeft: "auto" }}>
            {filtered.length} bản ghi
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="table table-custom mb-0" style={{ minWidth: 1000 }}>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ tên</th>
                <th>Phòng ban</th>
                <th>Chức vụ</th>
                <th>Email</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
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
                      <td colSpan={7} style={{ textAlign: "center", padding: "48px 0",
                                               color: "#8a94a6", fontSize: 14 }}>
                        Không có dữ liệu
                      </td>
                    </tr>
                  )
                  : filtered.map((e) => (
                    <tr key={e.EmployeeID}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: 12,
                                       background: "#f4f6fb", padding: "2px 8px",
                                       borderRadius: 6, color: "#5a6478" }}>
                          #{e.EmployeeID}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#1e2a3a" }}>{e.FullName}</td>
                      <td>
                        <span style={{ fontSize: 12, color: "#5a6478",
                                       background: "#f4f6fb", padding: "2px 8px",
                                       borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Building size={12} />
                          {e.Department || "—"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: "#5a6478",
                                       background: "#fffbeb", padding: "2px 8px",
                                       borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Briefcase size={12} />
                          {e.Position || "—"}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: "#5a6478", display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={13} color="#8a94a6" />
                        {e.Email}
                      </td>
                      <td>
                        <StatusBadge status={e.Status} />
                      </td>
                      <td className="text-center">
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button
                            onClick={() => nav(`/employees/${e.EmployeeID}`)}
                            title="Sửa"
                            style={{ border: "none", background: "#eff6ff", color: "#2563eb",
                                     borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                                     display: "flex", alignItems: "center", gap: 4, fontSize: 12,
                                     fontWeight: 600 }}
                          >
                            <Edit size={13} /> Sửa
                          </button>
                          <button
                            onClick={() => deleteEmployee(e.EmployeeID, e.FullName)}
                            title="Xóa"
                            style={{ border: "none", background: "#fef2f2", color: "#dc2626",
                                     borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                                     display: "flex", alignItems: "center", gap: 4, fontSize: 12,
                                     fontWeight: 600 }}
                          >
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
    </div>
  );
}
