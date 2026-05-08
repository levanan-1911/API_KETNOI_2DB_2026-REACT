import { useEffect, useState, useCallback } from "react";
import {
  Building, Briefcase, Users, RefreshCw,
  Plus, Edit, Trash2, CheckCircle2, AlertCircle, X,
  Save,
} from "lucide-react";

export default function Organization() {
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingPos, setLoadingPos] = useState(true);
  const [syncing, setSyncing] = useState({ depts: false, pos: false });
  const [activeTab, setActiveTab] = useState("departments");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [modalType, setModalType] = useState("department"); // "department" | "position"
  const [editItem, setEditItem] = useState(null);
  const [formName, setFormName] = useState("");
  const [savingModal, setSavingModal] = useState(false);

  const loadDepartments = useCallback(() => {
    setLoadingDepts(true);
    fetch("http://localhost:5000/api/departments")
      .then((r) => r.json())
      .then((data) => { setDepartments(data); setLoadingDepts(false); })
      .catch(() => setLoadingDepts(false));
  }, []);

  const loadPositions = useCallback(() => {
    setLoadingPos(true);
    fetch("http://localhost:5000/api/positions")
      .then((r) => r.json())
      .then((data) => { setPositions(data); setLoadingPos(false); })
      .catch(() => setLoadingPos(false));
  }, []);

  useEffect(() => {
    loadDepartments();
    loadPositions();
  }, [loadDepartments, loadPositions]);

  const syncDepartments = () => {
    setSyncing((s) => ({ ...s, depts: true }));
    setError(null);
    setSuccess(null);
    fetch("http://localhost:5000/api/departments/sync", { method: "POST" })
      .then((r) => r.json())
      .then((res) => {
        if (res.status === "success") {
          setSuccess(`Đồng bộ thành công ${res.synced_count} phòng ban!`);
          loadDepartments();
          setTimeout(() => setSuccess(null), 5000);
        } else {
          setError(res.msg || "Lỗi đồng bộ");
        }
      })
      .catch(() => setError("Không thể kết nối server"))
      .finally(() => setSyncing((s) => ({ ...s, depts: false })));
  };

  const syncPositions = () => {
    setSyncing((s) => ({ ...s, pos: true }));
    setError(null);
    setSuccess(null);
    fetch("http://localhost:5000/api/positions/sync", { method: "POST" })
      .then((r) => r.json())
      .then((res) => {
        if (res.status === "success") {
          setSuccess(`Đồng bộ thành công ${res.synced_count} chức vụ!`);
          loadPositions();
          setTimeout(() => setSuccess(null), 5000);
        } else {
          setError(res.msg || "Lỗi đồng bộ");
        }
      })
      .catch(() => setError("Không thể kết nối server"))
      .finally(() => setSyncing((s) => ({ ...s, pos: false })));
  };

  const openAddModal = (type) => {
    setModalMode("add");
    setModalType(type);
    setEditItem(null);
    setFormName("");
    setModalOpen(true);
  };

  const openEditModal = (type, item) => {
    setModalMode("edit");
    setModalType(type);
    setEditItem(item);
    setFormName(type === "department" ? item.DepartmentName : item.PositionName);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(null);
    setFormName("");
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSavingModal(true);
    setError(null);
    setSuccess(null);

    const url = modalType === "department" 
      ? (modalMode === "add" ? "http://localhost:5000/api/departments" : `http://localhost:5000/api/departments/${editItem.DepartmentID}`)
      : (modalMode === "add" ? "http://localhost:5000/api/positions" : `http://localhost:5000/api/positions/${editItem.PositionID}`);
    
    const method = modalMode === "add" ? "POST" : "PUT";
    const body = modalType === "department" 
      ? JSON.stringify({ DepartmentName: formName })
      : JSON.stringify({ PositionName: formName });

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body
    })
      .then(r => r.json())
      .then(res => {
        if (res.status === "success") {
          const action = modalMode === "add" ? "thêm" : "cập nhật";
          const typeName = modalType === "department" ? "phòng ban" : "chức vụ";
          setSuccess(`Đã ${action} ${typeName} "${formName}" thành công!`);
          setTimeout(() => setSuccess(null), 5000);
          if (modalType === "department") loadDepartments();
          else loadPositions();
          closeModal();
        } else {
          setError(res.msg || "Không thể thực hiện");
        }
      })
      .catch(() => setError("Không thể kết nối server"))
      .finally(() => setSavingModal(false));
  };

  const handleDelete = (type, item) => {
    const name = type === "department" ? item.DepartmentName : item.PositionName;
    if (!window.confirm(`Bạn chắc chắn muốn xóa ${type === "department" ? "phòng ban" : "chức vụ"} "${name}"?`)) return;
    setError(null);
    setSuccess(null);

    const url = type === "department"
      ? `http://localhost:5000/api/departments/${item.DepartmentID}`
      : `http://localhost:5000/api/positions/${item.PositionID}`;

    fetch(url, { method: "DELETE" })
      .then(r => r.json())
      .then(res => {
        if (res.status === "success") {
          setSuccess(`Đã xóa ${type === "department" ? "phòng ban" : "chức vụ"} "${name}" thành công!`);
          setTimeout(() => setSuccess(null), 5000);
          if (type === "department") loadDepartments();
          else loadPositions();
        } else {
          setError(res.msg || "Không thể xóa");
        }
      })
      .catch(() => setError("Không thể kết nối server"));
  };

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
          <h3>Phòng ban & Chức vụ</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Quản lý cơ cấu tổ chức và đồng bộ dữ liệu
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => openAddModal(activeTab === "departments" ? "department" : "position")}
            className="btn btn-primary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
            title={`Thêm ${activeTab === "departments" ? "phòng ban" : "chức vụ"} mới vào hệ thống`}
          >
            <Plus size={14} />
            Thêm {activeTab === "departments" ? "phòng ban" : "chức vụ"}
          </button>
          <button
            onClick={activeTab === "departments" ? syncDepartments : syncPositions}
            disabled={syncing.depts || syncing.pos}
            className="btn btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6,
                     background: "#fffbeb", border: "1px solid #fde68a",
                     color: "#d97706", borderRadius: 8, fontWeight: 600 }}
            title={`Đồng bộ ${activeTab === "departments" ? "phòng ban" : "chức vụ"} từ hệ thống HUMAN_2025 sang payroll_2026`}
          >
            <RefreshCw size={14} className={(activeTab === "departments" ? syncing.depts : syncing.pos) ? "spin" : ""} />
            Đồng bộ {activeTab === "departments" ? "phòng ban" : "chức vụ"}
          </button>
          <button
            onClick={() => { loadDepartments(); loadPositions(); }}
            style={{ display: "flex", alignItems: "center", gap: 6,
                     background: "#f4f6fb", border: "1px solid #e8ecf0",
                     borderRadius: 8, color: "#5a6478", fontWeight: 600,
                     fontSize: 13, padding: "7px 14px", cursor: "pointer" }}
            title="Tải lại danh sách phòng ban và chức vụ từ server"
          >
            <RefreshCw size={14} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="row g-3">
        {[
          { label: "Tổng phòng ban",  value: departments.length,  icon: Building,    bg: "#eff6ff", color: "#2563eb" },
          { label: "Tổng chức vụ",    value: positions.length,    icon: Briefcase,   bg: "#f0fdf4", color: "#16a34a" },
        ].map((c, i) => (
          <div key={i} className="col-6 col-xl-6">
            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center",
                            justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 11, color: "#8a94a6", fontWeight: 600,
                               textTransform: "uppercase", letterSpacing: "0.5px",
                               margin: "0 0 4px" }}>{c.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#1e2a3a", margin: 0 }}>
                    {(loadingDepts || loadingPos) ? "—" : c.value}
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

      {/* ── Tabs ── */}
      <div className="content-card" style={{ padding: 0 }}>
        <div style={{ borderBottom: "1px solid #e8ecf0", display: "flex" }}>
          {[
            { id: "departments", label: "Phòng ban", icon: Building },
            { id: "positions", label: "Chức vụ", icon: Briefcase },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "14px 24px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? "#2563eb" : "#5a6478",
                fontSize: 13,
                borderBottom: activeTab === tab.id ? "2px solid #2563eb" : "2px solid transparent",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: "-1px",
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Departments Table ── */}
        {activeTab === "departments" && (
          <div style={{ overflowX: "auto" }}>
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Mã PB</th>
                  <th>Tên phòng ban</th>
                  <th className="text-center">Số nhân viên</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loadingDepts
                  ? [...Array(4)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(4)].map((_, j) => (
                          <td key={j}>
                            <div style={{ height: 16, background: "#f0f4f8", borderRadius: 4, animation: "shimmer 1.4s infinite" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : departments.length === 0
                    ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "48px 0", color: "#8a94a6" }}>
                          Không có dữ liệu phòng ban
                        </td>
                      </tr>
                    )
                    : departments.map((d) => (
                      <tr key={d.DepartmentID}>
                        <td>
                          <span style={{ fontFamily: "monospace", fontSize: 12, background: "#f4f6fb", padding: "2px 8px", borderRadius: 6, color: "#5a6478" }}>
                            #{d.DepartmentID}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: "#1e2a3a" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Building size={16} color="#2563eb" />
                            {d.DepartmentName}
                          </div>
                        </td>
                        <td className="text-center">
                          <span style={{ 
                            fontSize: 14, 
                            fontWeight: 700, 
                            color: d.EmployeeCount > 0 ? "#1e2a3a" : "#8a94a6",
                            background: d.EmployeeCount > 0 ? "#eff6ff" : "#f4f6fb",
                            padding: "4px 12px",
                            borderRadius: 20
                          }}>
                            {d.EmployeeCount}
                          </span>
                        </td>
                        <td className="text-center">
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            <button
                              onClick={() => openEditModal("department", d)}
                              title="Sửa"
                              style={{ border: "none", background: "#eff6ff", color: "#2563eb", borderRadius: 7, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}
                            >
                              <Edit size={13} /> Sửa
                            </button>
                            <button
                              onClick={() => handleDelete("department", d)}
                              title="Xóa"
                              style={{ border: "none", background: "#fef2f2", color: "#dc2626", borderRadius: 7, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}
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
        )}

        {/* ── Positions Table ── */}
        {activeTab === "positions" && (
          <div style={{ overflowX: "auto" }}>
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Mã CV</th>
                  <th>Tên chức vụ</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loadingPos
                  ? [...Array(4)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(3)].map((_, j) => (
                          <td key={j}>
                            <div style={{ height: 16, background: "#f0f4f8", borderRadius: 4, animation: "shimmer 1.4s infinite" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : positions.length === 0
                    ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: "48px 0", color: "#8a94a6" }}>
                          Không có dữ liệu chức vụ
                        </td>
                      </tr>
                    )
                    : positions.map((p) => (
                      <tr key={p.PositionID}>
                        <td>
                          <span style={{ fontFamily: "monospace", fontSize: 12, background: "#f4f6fb", padding: "2px 8px", borderRadius: 6, color: "#5a6478" }}>
                            #{p.PositionID}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: "#1e2a3a" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Briefcase size={16} color="#16a34a" />
                            {p.PositionName}
                          </div>
                        </td>
                        <td className="text-center">
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            <button
                              onClick={() => openEditModal("position", p)}
                              title="Sửa"
                              style={{ border: "none", background: "#eff6ff", color: "#2563eb", borderRadius: 7, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}
                            >
                              <Edit size={13} /> Sửa
                            </button>
                            <button
                              onClick={() => handleDelete("position", p)}
                              title="Xóa"
                              style={{ border: "none", background: "#fef2f2", color: "#dc2626", borderRadius: 7, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}
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
        )}
      </div>

      {/* ── Modal Add/Edit ── */}
      {modalOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 20
        }} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={{
            background: "#fff", borderRadius: 12, maxWidth: 450, width: "100%",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)", overflow: "hidden"
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e8ecf0",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {modalType === "department" ? <Building size={18} color="#2563eb" /> : <Briefcase size={18} color="#16a34a" />}
                <h6 style={{ margin: 0, color: "#1e2a3a", fontWeight: 700 }}>
                  {modalMode === "add" ? "Thêm" : "Sửa"} {modalType === "department" ? "phòng ban" : "chức vụ"}
                </h6>
              </div>
              <button onClick={closeModal} style={{ border: "none", background: "#f4f6fb", borderRadius: 8, padding: 6, cursor: "pointer", color: "#5a6478" }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveModal} style={{ padding: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>
                Tên {modalType === "department" ? "phòng ban" : "chức vụ"} *
              </label>
              <input
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="form-control"
                placeholder={`Nhập tên ${modalType === "department" ? "phòng ban" : "chức vụ"}...`}
                required
              />
              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={closeModal} className="btn btn-sm" style={{ background: "#f4f6fb", border: "1px solid #e8ecf0", color: "#5a6478", borderRadius: 8, fontWeight: 600 }}>
                  Hủy
                </button>
                <button type="submit" disabled={savingModal} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {savingModal ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                  {savingModal ? "Đang lưu..." : (modalMode === "add" ? "Thêm" : "Lưu")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
