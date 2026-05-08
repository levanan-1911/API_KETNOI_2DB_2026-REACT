import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, User, Mail, Phone, Calendar,
  Building, Briefcase, UserCheck, UserX, RefreshCw,
  Coffee, BriefcaseBusiness,
} from "lucide-react";

const convertDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function EmployeeEdit() {
  const nav = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [form, setForm] = useState({
    FullName: "",
    DateOfBirth: "",
    Gender: "",
    PhoneNumber: "",
    Email: "",
    HireDate: "",
    DepartmentID: "",
    PositionID: "",
    Status: "Active",
  });

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:5000/api/departments").then(r => r.json()),
      fetch("http://localhost:5000/api/positions").then(r => r.json()),
      fetch(`http://localhost:5000/api/employees/${id}`).then(r => r.json()),
    ]).then(([depts, pos, emp]) => {
      setDepartments(depts);
      setPositions(pos);
      setForm({
        FullName: emp.FullName || "",
        DateOfBirth: convertDate(emp.DateOfBirth),
        Gender: emp.Gender || "",
        PhoneNumber: emp.PhoneNumber || "",
        Email: emp.Email || "",
        HireDate: convertDate(emp.HireDate),
        DepartmentID: emp.DepartmentID || "",
        PositionID: emp.PositionID || "",
        Status: emp.Status || "Active",
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    fetch(`http://localhost:5000/api/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        DepartmentID: form.DepartmentID ? Number(form.DepartmentID) : null,
        PositionID: form.PositionID ? Number(form.PositionID) : null,
      }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.status === "success") {
          alert("Cập nhật thành công!");
          nav("/employees");
        } else {
          alert("Lỗi: " + (res.msg || "Không xác định"));
        }
      })
      .catch(() => alert("Không thể kết nối server"))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <RefreshCw size={32} className="spin" color="#2563eb" />
          <span style={{ color: "#8a94a6", fontSize: 13 }}>Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => nav("/employees")}
            style={{ border: "none", background: "#f4f6fb", color: "#5a6478",
                     borderRadius: 8, padding: 8, cursor: "pointer" }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3>Sửa thông tin nhân viên</h3>
            <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
              Cập nhật thông tin chi tiết cho nhân viên
            </p>
          </div>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="content-card">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Thông tin cơ bản */}
            <div className="col-12">
              <h6 style={{ color: "#1e2a3a", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <User size={16} /> Thông tin cơ bản
              </h6>
            </div>

            <div className="col-md-6">
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                Họ và tên *
              </label>
              <input
                id="FullName"
                className="form-control"
                value={form.FullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                Giới tính
              </label>
              <select
                id="Gender"
                className="form-select"
                value={form.Gender}
                onChange={handleChange}
              >
                <option value="">-- Chọn giới tính --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="col-md-6">
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={14} color="#8a94a6" /> Ngày sinh
              </label>
              <input
                id="DateOfBirth"
                type="date"
                className="form-control"
                value={form.DateOfBirth}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={14} color="#8a94a6" /> Ngày vào làm
              </label>
              <input
                id="HireDate"
                type="date"
                className="form-control"
                value={form.HireDate}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Phone size={14} color="#8a94a6" /> Số điện thoại
              </label>
              <input
                id="PhoneNumber"
                className="form-control"
                value={form.PhoneNumber}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Mail size={14} color="#8a94a6" /> Email *
              </label>
              <input
                id="Email"
                type="email"
                className="form-control"
                value={form.Email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Thông tin công việc */}
            <div className="col-12" style={{ marginTop: 16 }}>
              <h6 style={{ color: "#1e2a3a", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Briefcase size={16} /> Thông tin công việc
              </h6>
            </div>

            <div className="col-md-4">
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Building size={14} color="#8a94a6" /> Phòng ban
              </label>
              <select
                id="DepartmentID"
                className="form-select"
                value={form.DepartmentID}
                onChange={handleChange}
              >
                <option value="">-- Chọn phòng ban --</option>
                {departments.map((d) => (
                  <option key={d.DepartmentID} value={d.DepartmentID}>
                    {d.DepartmentName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Briefcase size={14} color="#8a94a6" /> Chức vụ
              </label>
              <select
                id="PositionID"
                className="form-select"
                value={form.PositionID}
                onChange={handleChange}
              >
                <option value="">-- Chọn chức vụ --</option>
                {positions.map((p) => (
                  <option key={p.PositionID} value={p.PositionID}>
                    {p.PositionName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                {(() => {
                  const s = (form.Status || "").toLowerCase().trim();
                  if (s === "nghỉ phép" || s.includes("nghỉ")) {
                    return <Coffee size={14} color="#d97706" />;
                  } else if (s === "thử việc" || s.includes("thử")) {
                    return <BriefcaseBusiness size={14} color="#2563eb" />;
                  } else if (s === "inactive" || s === "ngừng" || s === "0") {
                    return <UserX size={14} color="#dc2626" />;
                  }
                  return <UserCheck size={14} color="#16a34a" />;
                })()} Trạng thái
              </label>
              <select
                id="Status"
                className="form-select"
                value={form.Status}
                onChange={handleChange}
              >
                <option value="Đang làm việc">Đang làm việc</option>
                <option value="Thử việc">Thử việc</option>
                <option value="Nghỉ phép">Nghỉ phép</option>
                <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Footer buttons */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #e8ecf0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={() => nav("/employees")}
              className="btn btn-sm"
              style={{ background: "#f4f6fb", border: "1px solid #e8ecf0", color: "#5a6478", borderRadius: 8, fontWeight: 600, padding: "8px 18px" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {saving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
