import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, ArrowLeft, RefreshCw, AlertCircle,
  User, Mail, Phone, Building2, Calendar,
} from "lucide-react";

const API = "http://localhost:5000";

const FIELD_CONFIG = [
  { id: "FullName",    label: "Họ và tên",       type: "text",   icon: User,      required: true,  col: 6 },
  { id: "Gender",      label: "Giới tính",        type: "select", icon: User,      required: false, col: 6,
    options: [{ value: "", label: "-- Chọn --" }, { value: "Male", label: "Nam" }, { value: "Female", label: "Nữ" }, { value: "Other", label: "Khác" }] },
  { id: "DateOfBirth", label: "Ngày sinh",        type: "date",   icon: Calendar,  required: false, col: 6 },
  { id: "HireDate",    label: "Ngày vào làm",     type: "date",   icon: Calendar,  required: false, col: 6 },
  { id: "Email",       label: "Email",            type: "email",  icon: Mail,      required: true,  col: 6 },
  { id: "PhoneNumber", label: "Số điện thoại",    type: "tel",    icon: Phone,     required: false, col: 6 },
];

export default function EmployeeAdd() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    FullName: "", DateOfBirth: "", Gender: "", PhoneNumber: "",
    Email: "", HireDate: "", DepartmentID: "", PositionID: "", Status: "Active",
  });
  const [departments, setDepartments] = useState([]);
  const [positions,   setPositions]   = useState([]);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    fetch(`${API}/api/departments`).then(r => r.json()).then(setDepartments);
    fetch(`${API}/api/positions`).then(r => r.json()).then(setPositions);
  }, []);

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then(r => r.json());

      if (r.status === "success") {
        nav("/employees");
      } else {
        setError(r.msg || "Thêm nhân viên thất bại");
      }
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setSaving(false);
    }
  };

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
        <div>
          <h3 style={{ margin: 0 }}>Thêm nhân viên mới</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Điền đầy đủ thông tin để tạo hồ sơ nhân viên
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Thông tin cơ bản */}
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
          <div style={{ padding: "20px" }}>
            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
                padding: "10px 14px", marginBottom: 16, color: "#dc2626",
                fontSize: 13, display: "flex", alignItems: "center", gap: 8,
              }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
            <div className="row g-3">
              {FIELD_CONFIG.map(f => (
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
                      placeholder={f.type === "text" ? `Nhập ${f.label.toLowerCase()}...` : undefined} />
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
          <div style={{ padding: "20px" }}>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                  Phòng ban <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select id="DepartmentID" className="form-select" style={{ fontSize: 13 }}
                  value={form.DepartmentID} onChange={handleChange} required>
                  <option value="">-- Chọn phòng ban --</option>
                  {departments.map(d => (
                    <option key={d.DepartmentID} value={d.DepartmentID}>{d.DepartmentName}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                  Chức vụ <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select id="PositionID" className="form-select" style={{ fontSize: 13 }}
                  value={form.PositionID} onChange={handleChange} required>
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
            {saving ? <RefreshCw size={15} className="spin" /> : <UserPlus size={15} />}
            {saving ? "Đang lưu..." : "Thêm nhân viên"}
          </button>
        </div>
      </form>
    </div>
  );
}
