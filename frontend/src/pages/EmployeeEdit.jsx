import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save, ArrowLeft, RefreshCw, AlertCircle,
  User, Building2,
} from "lucide-react";

const API = "http://localhost:5000";

// Tính 1 lần, không tính lại mỗi render
const today = new Date().toISOString().slice(0, 10);
const maxDOB = new Date(new Date().setFullYear(new Date().getFullYear() - 18))
  .toISOString().slice(0, 10);

const STATUS_MAP = {
  Active:   { label: "Đang làm",  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  Inactive: { label: "Đã nghỉ",   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  OnLeave:  { label: "Nghỉ phép", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
};

export default function EmployeeEdit() {
  const nav = useNavigate();
  const { id } = useParams();

  const [form,        setForm]        = useState({
    FullName: "", DateOfBirth: "", Gender: "", PhoneNumber: "",
    Email: "", HireDate: "", DepartmentID: "", PositionID: "", Status: "Active",
  });
  const [departments, setDepartments] = useState([]);
  const [positions,   setPositions]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/departments`).then(r => r.json()),
      fetch(`${API}/api/positions`).then(r => r.json()),
      fetch(`${API}/api/employees/${id}`).then(r => r.json()),
    ]).then(([depts, pos, emp]) => {
      setDepartments(Array.isArray(depts) ? depts : []);
      setPositions(Array.isArray(pos) ? pos : []);
      setForm({
        FullName:     emp.FullName     || "",
        DateOfBirth:  emp.DateOfBirth  ? emp.DateOfBirth.slice(0, 10) : "",
        Gender:       emp.Gender       || "",
        PhoneNumber:  emp.PhoneNumber  || "",
        Email:        emp.Email        || "",
        HireDate:     emp.HireDate     ? emp.HireDate.slice(0, 10) : "",
        DepartmentID: emp.DepartmentID || "",
        PositionID:   emp.PositionID   || "",
        Status:       emp.Status       || "Active",
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    setError(""); setSuccess(false);
    let value = e.target.value;
    // Số điện thoại: chỉ cho phép chữ số
    if (e.target.id === "PhoneNumber") {
      value = value.replace(/[^0-9]/g, "");
    }
    setForm({ ...form, [e.target.id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess(false);
    try {
      const r = await fetch(`${API}/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then(r => r.json());

      if (r.status === "success") {
        setSuccess(true);
        setTimeout(() => nav("/employees"), 1200);
      } else {
        setError(r.msg || "Cập nhật thất bại");
      }
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setSaving(false);
    }
  };

  const statusInfo = STATUS_MAP[form.Status] || STATUS_MAP.Active;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 10, color: "#8a94a6" }}>
        <RefreshCw size={18} className="spin" /> Đang tải thông tin nhân viên...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => nav("/employees")}
          style={{
            border: "1px solid #e8ecf0", background: "#f4f6fb",
            borderRadius: 8, padding: "7px 10px", cursor: "pointer",
            display: "flex", alignItems: "center", color: "#5a6478",
          }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0 }}>{form.FullName || "Chỉnh sửa nhân viên"}</h3>
            <span style={{
              background: statusInfo.bg, color: statusInfo.color,
              border: `1px solid ${statusInfo.border}`,
              padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            }}>{statusInfo.label}</span>
          </div>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Mã nhân viên #{id}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Alert */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
            padding: "12px 16px", marginBottom: 4, color: "#dc2626",
            fontSize: 13, display: "flex", alignItems: "center", gap: 8,
          }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
            padding: "12px 16px", marginBottom: 4, color: "#16a34a",
            fontSize: 13, display: "flex", alignItems: "center", gap: 8,
          }}>
            ✅ Cập nhật thành công! Đang chuyển hướng...
          </div>
        )}

        {/* Thông tin cá nhân */}
        <div className="content-card" style={{ marginBottom: 16 }}>
          <div style={{
            padding: "16px 20px 14px", borderBottom: "1px solid #f0f4f8",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: "#eff6ff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <User size={16} color="#2563eb" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1e2a3a" }}>
              Thông tin cá nhân
            </span>
          </div>
          <div style={{ padding: 20 }}>
            <div className="row g-3">
              {[
                { id: "FullName",    label: "Họ và tên",    type: "text",  col: 6, required: true },
                { id: "Gender",      label: "Giới tính",    type: "select",col: 6,
                  options: [{ value: "", label: "-- Chọn --" }, { value: "Male", label: "Nam" }, { value: "Female", label: "Nữ" }, { value: "Other", label: "Khác" }] },
                { id: "DateOfBirth", label: "Ngày sinh",    type: "date",  col: 6,
                  max: maxDOB },
                { id: "HireDate",    label: "Ngày vào làm", type: "date",  col: 6,
                  max: today },
                { id: "Email",       label: "Email",        type: "email", col: 6, required: true },
                { id: "PhoneNumber", label: "Số điện thoại",type: "tel",   col: 6,
                  pattern: "\\d{9,15}", title: "Số điện thoại chỉ gồm 9-15 chữ số" },
              ].map(f => (
                <div key={f.id} className={`col-12 col-md-${f.col}`}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                    {f.label} {f.required && <span style={{ color: "#dc2626" }}>*</span>}
                  </label>
                  {f.type === "select" ? (
                    <select id={f.id} className="form-select" style={{ fontSize: 13 }}
                      value={form[f.id]} onChange={handleChange}>
                      {f.options.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input id={f.id} type={f.type} className="form-control"
                      style={{ fontSize: 13 }}
                      value={form[f.id]} onChange={handleChange}
                      required={f.required}
                      pattern={f.pattern || undefined}
                      title={f.title || undefined}
                      max={f.max || undefined} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Thông tin công việc */}
        <div className="content-card" style={{ marginBottom: 16 }}>
          <div style={{
            padding: "16px 20px 14px", borderBottom: "1px solid #f0f4f8",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: "#f0fdf4",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Building2 size={16} color="#16a34a" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1e2a3a" }}>
              Thông tin công việc
            </span>
          </div>
          <div style={{ padding: 20 }}>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                  Phòng ban
                </label>
                <select id="DepartmentID" className="form-select" style={{ fontSize: 13 }}
                  value={form.DepartmentID} onChange={handleChange}>
                  <option value="">-- Chọn phòng ban --</option>
                  {departments.map(d => (
                    <option key={d.DepartmentID} value={d.DepartmentID}>{d.DepartmentName}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                  Chức vụ
                </label>
                <select id="PositionID" className="form-select" style={{ fontSize: 13 }}
                  value={form.PositionID} onChange={handleChange}>
                  <option value="">-- Chọn chức vụ --</option>
                  {positions.map(p => (
                    <option key={p.PositionID} value={p.PositionID}>{p.PositionName}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                  Trạng thái
                </label>
                <select id="Status" className="form-select" style={{ fontSize: 13 }}
                  value={form.Status} onChange={handleChange}>
                  <option value="Active">Đang làm việc</option>
                  <option value="OnLeave">Nghỉ phép</option>
                  <option value="Inactive">Đã nghỉ việc</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={() => nav("/employees")}
            style={{
              background: "#f4f6fb", border: "1px solid #e8ecf0",
              color: "#5a6478", borderRadius: 8, fontWeight: 600,
              fontSize: 13, padding: "10px 24px", cursor: "pointer",
            }}>
            Huỷ
          </button>
          <button type="submit" disabled={saving}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px" }}>
            {saving ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
