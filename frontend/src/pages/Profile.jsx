import { useState, useEffect } from "react";
import {
  User, Mail, Phone, Building2, Briefcase, Calendar,
  Shield, Key, Bell, Save, CheckCircle,
  Eye, EyeOff, RefreshCw, AlertCircle, TrendingUp, Award,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";

const API = "http://localhost:5000";

/* ── Role config ── */
const ROLE_CONFIG = {
  Admin:           { banner: "linear-gradient(135deg,#1e2a3a 0%,#2563eb 100%)", label: "Quản trị viên" },
  HR_Manager:      { banner: "linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)", label: "Quản lý Nhân sự" },
  Payroll_Manager: { banner: "linear-gradient(135deg,#065f46 0%,#10b981 100%)", label: "Quản lý Lương" },
  Employee:        { banner: "linear-gradient(135deg,#92400e 0%,#f59e0b 100%)", label: "Nhân viên" },
};

const STATUS_CONFIG = {
  Active:   { color: "#16a34a", bg: "#f0fdf4", label: "Đang làm việc" },
  OnLeave:  { color: "#d97706", bg: "#fffbeb", label: "Nghỉ phép" },
  Inactive: { color: "#dc2626", bg: "#fef2f2", label: "Đã nghỉ việc" },
};

const TABS = [
  { id: "info",     label: "Thông tin",  icon: User },
  { id: "salary",   label: "Lương",      icon: TrendingUp },
  { id: "security", label: "Bảo mật",    icon: Shield },
  { id: "notify",   label: "Thông báo",  icon: Bell },
];

/* ── Helpers ── */
const fmtVND  = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n ?? 0)) + " đ";
const fmtShort = (n) => {
  if (!n) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + " tỷ";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " tr";
  return new Intl.NumberFormat("vi-VN").format(n);
};
const initials = (name) =>
  (name || "?").split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
const yearsWorked = (hireDate) => {
  if (!hireDate) return 0;
  return Math.floor((Date.now() - new Date(hireDate)) / (365.25 * 24 * 3600 * 1000));
};

/* ── Toast ── */
function Toast({ show, msg, type = "success" }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: type === "success" ? "#16a34a" : "#dc2626",
      color: "#fff", padding: "12px 20px", borderRadius: 12,
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      fontSize: 14, fontWeight: 600, animation: "slideUp 0.3s ease",
    }}>
      {type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      {msg}
    </div>
  );
}

/* ── Toggle ── */
function Toggle({ checked, onChange, label, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", borderBottom: "1px solid #f0f4f8" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2a3a" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "#8a94a6", marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!checked)} style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? "#2563eb" : "#d1d5db",
        border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
      }}>
        <span style={{
          position: "absolute", top: 3, left: checked ? 23 : 3,
          width: 18, height: 18, background: "#fff", borderRadius: "50%",
          transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
export default function Profile() {
  const { user, token } = useAuth();

  const [activeTab,  setActiveTab]  = useState("info");
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [editMode,   setEditMode]   = useState(false);
  const [draft,      setDraft]      = useState({});
  const [saving,     setSaving]     = useState(false);

  // Salary history
  const [salaryHistory,  setSalaryHistory]  = useState([]);
  const [loadingSalary,  setLoadingSalary]  = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  // Security
  const [pwForm,   setPwForm]   = useState({ current: "", next: "", confirm: "" });
  const [showPw,   setShowPw]   = useState({ current: false, next: false, confirm: false });
  const [pwError,  setPwError]  = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // Notifications
  const [notif, setNotif] = useState({
    email: true, browser: true, salary: true, system: false, report: true,
  });

  /* ── Load profile ── */
  const loadProfile = () => {
    setLoading(true);
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => {
        if (res.status === "success") {
          setProfile(res.user);
          setDraft({ fullName: res.user.fullName || "", email: res.user.email || "", phone: res.user.phone || "" });
        }
      })
      .catch(() => showToast("Không thể tải thông tin", "error"))
      .finally(() => setLoading(false));
  };

  /* ── Load salary history ── */
  const loadSalary = (empId) => {
    if (!empId) return;
    setLoadingSalary(true);
    fetch(`${API}/api/salary/${empId}/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setSalaryHistory(arr.slice(0, 6).reverse());
      })
      .catch(() => {})
      .finally(() => setLoadingSalary(false));
  };

  useEffect(() => { loadProfile(); }, []); // eslint-disable-line
  useEffect(() => {
    if (profile?.employeeId) loadSalary(profile.employeeId);
  }, [profile?.employeeId]); // eslint-disable-line

  /* ── Save info ── */
  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ FullName: draft.fullName, Email: draft.email, Phone: draft.phone }),
      }).then(r => r.json());
      if (res.status === "success") {
        setProfile(p => ({ ...p, fullName: draft.fullName, email: draft.email, phone: draft.phone }));
        setEditMode(false);
        showToast("Cập nhật thành công");
      } else showToast(res.msg || "Lỗi khi cập nhật", "error");
    } catch { showToast("Không thể kết nối server", "error"); }
    finally { setSaving(false); }
  };

  /* ── Change password ── */
  const handleSavePassword = async () => {
    if (!pwForm.current) { setPwError("Vui lòng nhập mật khẩu hiện tại"); return; }
    if (pwForm.next.length < 6) { setPwError("Mật khẩu mới phải ít nhất 6 ký tự"); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Mật khẩu xác nhận không khớp"); return; }
    setPwError(""); setPwSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      }).then(r => r.json());
      if (res.status === "success") { setPwForm({ current: "", next: "", confirm: "" }); showToast("Đổi mật khẩu thành công"); }
      else setPwError(res.msg || "Lỗi khi đổi mật khẩu");
    } catch { setPwError("Không thể kết nối server"); }
    finally { setPwSaving(false); }
  };

  /* ── Derived ── */
  const roleCfg   = ROLE_CONFIG[profile?.role || user?.role] || ROLE_CONFIG.Employee;
  const statusCfg = STATUS_CONFIG[profile?.status || "Active"] || STATUS_CONFIG.Active;
  const years     = yearsWorked(profile?.hireDate);
  const latestSal = salaryHistory.length > 0 ? salaryHistory[salaryHistory.length - 1] : null;

  // Chart data
  const chartData = salaryHistory.map(r => ({
    month: (r.SalaryMonthStr || r.SalaryMonth || "").slice(0, 7),
    "Thực nhận": Math.round(Number(r.NetSalary || 0) / 1e6),
    "Lương CB":  Math.round(Number(r.BaseSalary || 0) / 1e6),
  }));

  /* ── Tab renders ── */
  const renderInfo = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h5 style={{ margin: 0 }}>Thông tin cá nhân</h5>
          <p style={{ fontSize: 13, color: "#8a94a6", margin: "4px 0 0" }}>Cập nhật thông tin hồ sơ</p>
        </div>
        {!editMode ? (
          <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>Chỉnh sửa</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setEditMode(false); setDraft({ fullName: profile?.fullName || "", email: profile?.email || "", phone: profile?.phone || "" }); }}
              style={{ background: "#f4f6fb", border: "1px solid #e8ecf0", borderRadius: 8, color: "#5a6478", fontWeight: 600, padding: "6px 16px", cursor: "pointer" }}>
              Hủy
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSaveInfo} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {saving ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        )}
      </div>

      <div className="row g-3">
        {[
          { label: "Họ và tên", key: "fullName", icon: User, type: "text" },
          { label: "Email",     key: "email",    icon: Mail, type: "email" },
          { label: "Số điện thoại", key: "phone", icon: Phone, type: "tel" },
        ].map(f => (
          <div key={f.key} className="col-12 col-md-6">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#8a94a6", textTransform: "uppercase",
              letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
              <f.icon size={12} /> {f.label}
            </label>
            {editMode ? (
              <input className="form-control" type={f.type} value={draft[f.key] || ""}
                onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                style={{ fontSize: 14 }} />
            ) : (
              <div style={{ padding: "9px 12px", background: "#f8fafc", border: "1px solid #e8ecf0",
                borderRadius: 8, fontSize: 14, color: "#1e2a3a", fontWeight: 500 }}>
                {profile?.[f.key] || "—"}
              </div>
            )}
          </div>
        ))}
        <div className="col-12 col-md-6">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8a94a6", textTransform: "uppercase",
            letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
            <User size={12} /> Tên đăng nhập
          </label>
          <div style={{ padding: "9px 12px", background: "#f8fafc", border: "1px solid #e8ecf0",
            borderRadius: 8, fontSize: 14, color: "#1e2a3a", fontWeight: 500 }}>
            {profile?.username || "—"}
          </div>
        </div>
        <div className="col-12 col-md-6">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8a94a6", textTransform: "uppercase",
            letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
            <Shield size={12} /> Vai trò
          </label>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6,
              background: "#eff6ff", color: "#2563eb", padding: "6px 14px", borderRadius: 20,
              fontSize: 13, fontWeight: 700, border: "1px solid #bfdbfe" }}>
              <Shield size={12} /> {profile?.role || user?.role || "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSalary = () => (
    <div>
      <h5 style={{ margin: "0 0 4px" }}>Lịch sử lương</h5>
      <p style={{ fontSize: 13, color: "#8a94a6", marginBottom: 20 }}>6 tháng gần nhất</p>

      {loadingSalary ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#8a94a6" }}>
          <RefreshCw size={24} className="spin" />
        </div>
      ) : salaryHistory.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#8a94a6", fontSize: 13 }}>
          Chưa có dữ liệu lương
        </div>
      ) : (
        <>
          {/* Line chart */}
          <div style={{ marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" tr" />
                <Tooltip formatter={(v, n) => [`${v} tr đ`, n]} />
                <Line type="monotone" dataKey="Thực nhận" stroke="#2563eb" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#2563eb" }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Lương CB" stroke="#93c5fd" strokeWidth={1.5}
                  strokeDasharray="4 2" dot={{ r: 3, fill: "#93c5fd" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th className="text-end">Lương CB</th>
                  <th className="text-end">Thưởng</th>
                  <th className="text-end">Khấu trừ</th>
                  <th className="text-end">Thực nhận</th>
                </tr>
              </thead>
              <tbody>
                {[...salaryHistory].reverse().map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{(r.SalaryMonthStr || r.SalaryMonth || "").slice(0, 7)}</td>
                    <td className="text-end" style={{ fontSize: 13 }}>{fmtVND(r.BaseSalary)}</td>
                    <td className="text-end" style={{ color: "#16a34a", fontSize: 13 }}>+{fmtVND(r.Bonus)}</td>
                    <td className="text-end" style={{ color: "#dc2626", fontSize: 13 }}>-{fmtVND(r.Deductions)}</td>
                    <td className="text-end">
                      <span style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 10px",
                        borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {fmtVND(r.NetSalary)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  const renderSecurity = () => (
    <div>
      <h5 style={{ marginBottom: 4 }}>Đổi mật khẩu</h5>
      <p style={{ fontSize: 13, color: "#8a94a6", marginBottom: 24 }}>Mật khẩu mới phải ít nhất 6 ký tự</p>
      {["current", "next", "confirm"].map(field => {
        const labels = { current: "Mật khẩu hiện tại", next: "Mật khẩu mới", confirm: "Xác nhận mật khẩu mới" };
        return (
          <div key={field} style={{ marginBottom: 16 }}>
            <label className="form-label">{labels[field]}</label>
            <div style={{ position: "relative" }}>
              <input className="form-control" type={showPw[field] ? "text" : "password"}
                value={pwForm[field]}
                onChange={e => { setPwForm(p => ({ ...p, [field]: e.target.value })); setPwError(""); }}
                placeholder="••••••••" style={{ paddingRight: 40, fontSize: 14 }} />
              <button onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))} type="button"
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#8a94a6", padding: 0 }}>
                {showPw[field] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        );
      })}
      {pwError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} /> {pwError}
        </div>
      )}
      <button className="btn btn-primary" onClick={handleSavePassword} disabled={pwSaving}
        style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {pwSaving ? <RefreshCw size={15} className="spin" /> : <Key size={15} />}
        {pwSaving ? "Đang lưu..." : "Cập nhật mật khẩu"}
      </button>
    </div>
  );

  const renderNotify = () => (
    <div>
      <h5 style={{ marginBottom: 4 }}>Cài đặt thông báo</h5>
      <p style={{ fontSize: 13, color: "#8a94a6", marginBottom: 24 }}>Chọn loại thông báo bạn muốn nhận</p>
      <Toggle checked={notif.email}   onChange={v => setNotif(p => ({ ...p, email: v }))}
        label="Thông báo qua Email" sub="Nhận email khi có cập nhật quan trọng" />
      <Toggle checked={notif.browser} onChange={v => setNotif(p => ({ ...p, browser: v }))}
        label="Thông báo trình duyệt" sub="Hiển thị popup thông báo trên trình duyệt" />
      <Toggle checked={notif.salary}  onChange={v => setNotif(p => ({ ...p, salary: v }))}
        label="Thông báo lương" sub="Nhận thông báo khi bảng lương được cập nhật" />
      <Toggle checked={notif.report}  onChange={v => setNotif(p => ({ ...p, report: v }))}
        label="Báo cáo định kỳ" sub="Nhận báo cáo tổng hợp hàng tháng" />
      <Toggle checked={notif.system}  onChange={v => setNotif(p => ({ ...p, system: v }))}
        label="Thông báo hệ thống" sub="Cảnh báo bảo trì và cập nhật hệ thống" />
      <button className="btn btn-primary" style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 8 }}
        onClick={() => showToast("Đã lưu cài đặt thông báo")}>
        <Save size={15} /> Lưu cài đặt
      </button>
    </div>
  );

  const tabContent = { info: renderInfo, salary: renderSalary, security: renderSecurity, notify: renderNotify };

  /* ── Render ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <Toast show={toast.show} msg={toast.msg} type={toast.type} />

      {/* ══ COVER BANNER ══ */}
      <div style={{
        background: roleCfg.banner, borderRadius: "16px 16px 0 0",
        height: 140, position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160,
          borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -20, left: 120, width: 100, height: 100,
          borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        {/* Edit button */}
        {!editMode && (
          <button onClick={() => { setActiveTab("info"); setEditMode(true); }}
            style={{ position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 12,
              padding: "6px 14px", cursor: "pointer", backdropFilter: "blur(4px)" }}>
            ✏ Chỉnh sửa
          </button>
        )}
      </div>

      {/* ══ HERO SECTION ══ */}
      <div style={{ background: "#fff", borderRadius: "0 0 0 0", padding: "0 28px 20px",
        borderLeft: "1px solid #e8ecf0", borderRight: "1px solid #e8ecf0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginTop: -40 }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
            background: roleCfg.banner,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 26, fontWeight: 800,
            border: "4px solid #fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}>
            {loading ? "?" : initials(profile?.fullName || user?.fullName)}
          </div>

          {/* Name + info */}
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h4 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e2a3a" }}>
                {loading ? "—" : (profile?.fullName || user?.fullName || "—")}
              </h4>
              <span style={{ background: statusCfg.bg, color: statusCfg.color,
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                ● {statusCfg.label}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#5a6478", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Briefcase size={12} /> {profile?.positionName || roleCfg.label}
              </span>
              {profile?.departmentName && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Building2 size={12} /> {profile.departmentName}
                </span>
              )}
              {profile?.hireDate && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={12} /> Vào làm {new Date(profile.hireDate).toLocaleDateString("vi-VN")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY: 2 columns ══ */}
      <div style={{ background: "#f4f6fb", padding: "20px 0 0",
        borderLeft: "1px solid #e8ecf0", borderRight: "1px solid #e8ecf0",
        borderBottom: "1px solid #e8ecf0", borderRadius: "0 0 16px 16px" }}>
        <div className="row g-3" style={{ margin: "0 8px" }}>

          {/* ── Sidebar trái ── */}
          <div className="col-12 col-lg-4">
            {/* Liên hệ */}
            <div className="content-card" style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e2a3a", marginBottom: 14,
                paddingBottom: 10, borderBottom: "1px solid #f0f4f8" }}>
                Thông tin liên hệ
              </div>
              {[
                { icon: Mail,  label: "Email",        val: profile?.email },
                { icon: Phone, label: "Điện thoại",   val: profile?.phone },
                { icon: User,  label: "Tài khoản",    val: profile?.username },
              ].map(({ icon: Icon, label, val }, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f4f6fb",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} color="#5a6478" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#8a94a6", fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
                    <div style={{ fontSize: 13, color: "#1e2a3a", fontWeight: 500, wordBreak: "break-all" }}>{val || "—"}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mini stats */}
            <div className="content-card">
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e2a3a", marginBottom: 14,
                paddingBottom: 10, borderBottom: "1px solid #f0f4f8" }}>
                Thống kê
              </div>
              {[
                { icon: Calendar,   label: "Năm làm việc",    val: `${years} năm`,           color: "#2563eb", bg: "#eff6ff" },
                { icon: TrendingUp, label: "Lương tháng này", val: latestSal ? fmtShort(latestSal.NetSalary) : "—", color: "#16a34a", bg: "#f0fdf4" },
                { icon: Award,      label: "Vai trò",         val: profile?.role || user?.role || "—", color: "#9333ea", bg: "#fdf4ff" },
              ].map(({ icon: Icon, label, val, color, bg }, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
                  background: bg, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color, fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1e2a3a" }}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tab content phải ── */}
          <div className="col-12 col-lg-8">
            <div className="content-card">
              {/* Tab bar */}
              <div style={{ display: "flex", gap: 0, marginBottom: 24,
                borderBottom: "1px solid #e8ecf0", overflowX: "auto" }}>
                {TABS.filter(t => t.id !== "salary" || profile?.employeeId).map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "10px 18px", background: "none", border: "none",
                      borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
                      color: active ? "#2563eb" : "#5a6478",
                      fontWeight: active ? 700 : 500, fontSize: 13.5,
                      cursor: "pointer", whiteSpace: "nowrap", marginBottom: -1,
                    }}>
                      <Icon size={15} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab body */}
              {(tabContent[activeTab] || tabContent.info)()}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
