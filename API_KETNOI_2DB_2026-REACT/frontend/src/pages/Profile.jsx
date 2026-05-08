import { useState } from "react";
import {
  User, Mail, Phone, Building2, Briefcase,
  Shield, Key, Bell, Palette, Save,
  Camera, CheckCircle, Eye, EyeOff,
} from "lucide-react";

/* ── Dữ liệu mặc định (mock) ─────────────────────────── */
const DEFAULT_PROFILE = {
  fullName:   "Admin Hệ thống",
  email:      "admin@company.com",
  phone:      "0901 234 567",
  department: "Phòng Nhân sự",
  position:   "Quản trị viên",
  role:       "Admin",
  joinDate:   "01/01/2024",
  avatar:     "AD",
  avatarBg:   "linear-gradient(135deg, #3b82f6, #8b5cf6)",
};

const TABS = [
  { id: "info",     label: "Thông tin cá nhân", icon: User },
  { id: "security", label: "Bảo mật",           icon: Shield },
  { id: "notify",   label: "Thông báo",          icon: Bell },
  { id: "display",  label: "Giao diện",          icon: Palette },
];

/* ── Toast thông báo lưu thành công ──────────────────── */
function Toast({ show }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: "#16a34a", color: "#fff",
      padding: "12px 20px", borderRadius: 12,
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 8px 24px rgba(22,163,74,0.3)",
      fontSize: 14, fontWeight: 600,
      animation: "slideUp 0.3s ease",
    }}>
      <CheckCircle size={18} />
      Lưu thành công!
    </div>
  );
}

/* ── Field hiển thị thông tin ────────────────────────── */
function InfoField({ label, value, icon: Icon, editable, name, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        fontSize: 12, fontWeight: 600, color: "#8a94a6",
        textTransform: "uppercase", letterSpacing: "0.5px",
        display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
      }}>
        {Icon && <Icon size={13} />}
        {label}
      </label>
      {editable ? (
        <input
          className="form-control"
          name={name}
          value={value}
          onChange={onChange}
          style={{ fontSize: 14 }}
        />
      ) : (
        <div style={{
          padding: "9px 12px", background: "#f8fafc",
          border: "1px solid #e8ecf0", borderRadius: 8,
          fontSize: 14, color: "#1e2a3a", fontWeight: 500,
        }}>
          {value}
        </div>
      )}
    </div>
  );
}

/* ── Toggle switch ───────────────────────────────────── */
function Toggle({ checked, onChange, label, sub }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 0",
      borderBottom: "1px solid #f0f4f8",
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2a3a" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "#8a94a6", marginTop: 2 }}>{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: checked ? "#2563eb" : "#d1d5db",
          border: "none", cursor: "pointer",
          position: "relative", transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 3,
          left: checked ? 23 : 3,
          width: 18, height: 18,
          background: "#fff", borderRadius: "50%",
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }} />
      </button>
    </div>
  );
}

/* ── Avatar color options ────────────────────────────── */
const AVATAR_COLORS = [
  "linear-gradient(135deg, #3b82f6, #8b5cf6)",
  "linear-gradient(135deg, #22c55e, #06b6d4)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
  "linear-gradient(135deg, #1e2a3a, #3b82f6)",
  "linear-gradient(135deg, #f97316, #eab308)",
];

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
export default function Profile() {
  const [activeTab, setActiveTab]   = useState("info");
  const [profile, setProfile]       = useState(DEFAULT_PROFILE);
  const [editMode, setEditMode]     = useState(false);
  const [draft, setDraft]           = useState(DEFAULT_PROFILE);
  const [showToast, setShowToast]   = useState(false);

  // Security
  const [pwForm, setPwForm]         = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw]         = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError]       = useState("");

  // Notifications
  const [notif, setNotif] = useState({
    email:   true,
    browser: true,
    salary:  true,
    system:  false,
    report:  true,
  });

  // Display
  const [display, setDisplay] = useState({
    compact:   false,
    animation: true,
    lang:      "vi",
  });

  /* ── Handlers ── */
  const handleDraftChange = (e) => {
    setDraft((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSaveInfo = () => {
    setProfile(draft);
    setEditMode(false);
    toast();
  };

  const handleCancelEdit = () => {
    setDraft(profile);
    setEditMode(false);
  };

  const handleSavePassword = () => {
    if (!pwForm.current) { setPwError("Vui lòng nhập mật khẩu hiện tại"); return; }
    if (pwForm.next.length < 6) { setPwError("Mật khẩu mới phải ít nhất 6 ký tự"); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Mật khẩu xác nhận không khớp"); return; }
    setPwError("");
    setPwForm({ current: "", next: "", confirm: "" });
    toast();
  };

  const toast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  /* ── Render tabs ── */
  const renderTab = () => {
    switch (activeTab) {

      /* ── Tab: Thông tin cá nhân ── */
      case "info": return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 24 }}>
            <div>
              <h5 style={{ margin: 0 }}>Thông tin cá nhân</h5>
              <p style={{ fontSize: 13, color: "#8a94a6", margin: "4px 0 0" }}>
                Cập nhật thông tin hồ sơ của bạn
              </p>
            </div>
            {!editMode ? (
              <button className="btn btn-primary btn-sm"
                onClick={() => { setDraft(profile); setEditMode(true); }}>
                Chỉnh sửa
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-sm"
                  onClick={handleCancelEdit}
                  style={{ background: "#f4f6fb", border: "1px solid #e8ecf0",
                           borderRadius: 8, color: "#5a6478", fontWeight: 600 }}>
                  Hủy
                </button>
                <button className="btn btn-primary btn-sm"
                  onClick={handleSaveInfo}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Save size={13} /> Lưu
                </button>
              </div>
            )}
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <InfoField label="Họ và tên" icon={User}
                value={editMode ? draft.fullName : profile.fullName}
                editable={editMode} name="fullName" onChange={handleDraftChange} />
            </div>
            <div className="col-12 col-md-6">
              <InfoField label="Email" icon={Mail}
                value={editMode ? draft.email : profile.email}
                editable={editMode} name="email" onChange={handleDraftChange} />
            </div>
            <div className="col-12 col-md-6">
              <InfoField label="Số điện thoại" icon={Phone}
                value={editMode ? draft.phone : profile.phone}
                editable={editMode} name="phone" onChange={handleDraftChange} />
            </div>
            <div className="col-12 col-md-6">
              <InfoField label="Ngày vào làm" icon={Briefcase}
                value={profile.joinDate} editable={false} />
            </div>
            <div className="col-12 col-md-6">
              <InfoField label="Phòng ban" icon={Building2}
                value={profile.department} editable={false} />
            </div>
            <div className="col-12 col-md-6">
              <InfoField label="Chức vụ" icon={Briefcase}
                value={profile.position} editable={false} />
            </div>
          </div>

          {/* Role badge */}
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#8a94a6",
                            textTransform: "uppercase", letterSpacing: "0.5px",
                            display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Shield size={13} /> Vai trò
            </label>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#eff6ff", color: "#2563eb",
              padding: "6px 14px", borderRadius: 20,
              fontSize: 13, fontWeight: 700,
              border: "1px solid #bfdbfe",
            }}>
              <Shield size={13} /> {profile.role}
            </span>
          </div>
        </div>
      );

      /* ── Tab: Bảo mật ── */
      case "security": return (
        <div>
          <h5 style={{ marginBottom: 4 }}>Đổi mật khẩu</h5>
          <p style={{ fontSize: 13, color: "#8a94a6", marginBottom: 24 }}>
            Mật khẩu mới phải ít nhất 6 ký tự
          </p>

          {["current", "next", "confirm"].map((field) => {
            const labels = { current: "Mật khẩu hiện tại", next: "Mật khẩu mới", confirm: "Xác nhận mật khẩu mới" };
            return (
              <div key={field} style={{ marginBottom: 16 }}>
                <label className="form-label">{labels[field]}</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="form-control"
                    type={showPw[field] ? "text" : "password"}
                    value={pwForm[field]}
                    onChange={(e) => setPwForm((p) => ({ ...p, [field]: e.target.value }))}
                    placeholder="••••••••"
                    style={{ paddingRight: 40, fontSize: 14 }}
                  />
                  <button
                    onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
                    style={{
                      position: "absolute", right: 10, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none",
                      cursor: "pointer", color: "#8a94a6", padding: 0,
                    }}
                  >
                    {showPw[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            );
          })}

          {pwError && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px",
              color: "#dc2626", fontSize: 13, marginBottom: 16,
            }}>
              {pwError}
            </div>
          )}

          <button className="btn btn-primary"
            onClick={handleSavePassword}
            style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Key size={15} /> Cập nhật mật khẩu
          </button>

          {/* Phiên đăng nhập */}
          <div style={{ marginTop: 32 }}>
            <h5 style={{ marginBottom: 4 }}>Phiên đăng nhập</h5>
            <p style={{ fontSize: 13, color: "#8a94a6", marginBottom: 16 }}>
              Các thiết bị đang đăng nhập vào tài khoản của bạn
            </p>
            {[
              { device: "Chrome / Windows", ip: "192.168.1.10", time: "Hiện tại", current: true },
              { device: "Firefox / Windows", ip: "192.168.1.11", time: "2 giờ trước", current: false },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", background: "#f8fafc",
                border: "1px solid #e8ecf0", borderRadius: 10, marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: s.current ? "#eff6ff" : "#f4f6fb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Shield size={18} color={s.current ? "#2563eb" : "#8a94a6"} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2a3a" }}>{s.device}</div>
                    <div style={{ fontSize: 12, color: "#8a94a6" }}>IP: {s.ip} · {s.time}</div>
                  </div>
                </div>
                {s.current
                  ? <span style={{ fontSize: 11, background: "#dcfce7", color: "#16a34a",
                                   padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                      Hiện tại
                    </span>
                  : <button className="btn btn-danger btn-sm">Đăng xuất</button>
                }
              </div>
            ))}
          </div>
        </div>
      );

      /* ── Tab: Thông báo ── */
      case "notify": return (
        <div>
          <h5 style={{ marginBottom: 4 }}>Cài đặt thông báo</h5>
          <p style={{ fontSize: 13, color: "#8a94a6", marginBottom: 24 }}>
            Chọn loại thông báo bạn muốn nhận
          </p>
          <Toggle checked={notif.email}   onChange={(v) => setNotif((p) => ({ ...p, email: v }))}
            label="Thông báo qua Email"
            sub="Nhận email khi có cập nhật quan trọng" />
          <Toggle checked={notif.browser} onChange={(v) => setNotif((p) => ({ ...p, browser: v }))}
            label="Thông báo trình duyệt"
            sub="Hiển thị popup thông báo trên trình duyệt" />
          <Toggle checked={notif.salary}  onChange={(v) => setNotif((p) => ({ ...p, salary: v }))}
            label="Thông báo lương"
            sub="Nhận thông báo khi bảng lương được cập nhật" />
          <Toggle checked={notif.report}  onChange={(v) => setNotif((p) => ({ ...p, report: v }))}
            label="Báo cáo định kỳ"
            sub="Nhận báo cáo tổng hợp hàng tháng" />
          <Toggle checked={notif.system}  onChange={(v) => setNotif((p) => ({ ...p, system: v }))}
            label="Thông báo hệ thống"
            sub="Cảnh báo bảo trì và cập nhật hệ thống" />

          <button className="btn btn-primary" style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 8 }}
            onClick={toast}>
            <Save size={15} /> Lưu cài đặt
          </button>
        </div>
      );

      /* ── Tab: Giao diện ── */
      case "display": return (
        <div>
          <h5 style={{ marginBottom: 4 }}>Tùy chỉnh giao diện</h5>
          <p style={{ fontSize: 13, color: "#8a94a6", marginBottom: 24 }}>
            Cá nhân hóa trải nghiệm sử dụng
          </p>

          <Toggle checked={display.compact}   onChange={(v) => setDisplay((p) => ({ ...p, compact: v }))}
            label="Chế độ thu gọn"
            sub="Giảm khoảng cách giữa các phần tử" />
          <Toggle checked={display.animation} onChange={(v) => setDisplay((p) => ({ ...p, animation: v }))}
            label="Hiệu ứng chuyển động"
            sub="Bật/tắt animation trong giao diện" />

          {/* Ngôn ngữ */}
          <div style={{ padding: "14px 0", borderBottom: "1px solid #f0f4f8" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2a3a", marginBottom: 8 }}>
              Ngôn ngữ
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ val: "vi", label: "🇻🇳 Tiếng Việt" }, { val: "en", label: "🇺🇸 English" }].map((l) => (
                <button key={l.val}
                  onClick={() => setDisplay((p) => ({ ...p, lang: l.val }))}
                  style={{
                    padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s",
                    background: display.lang === l.val ? "#eff6ff" : "#f4f6fb",
                    border: display.lang === l.val ? "1.5px solid #2563eb" : "1px solid #e8ecf0",
                    color: display.lang === l.val ? "#2563eb" : "#5a6478",
                  }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 8 }}
            onClick={toast}>
            <Save size={15} /> Lưu cài đặt
          </button>
        </div>
      );

      default: return null;
    }
  };

  /* ══ JSX ══ */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Toast show={showToast} />

      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h3>Hồ sơ cá nhân</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Quản lý thông tin tài khoản và cài đặt
          </p>
        </div>
      </div>

      <div className="row g-3" style={{ alignItems: "flex-start" }}>

        {/* ── Cột trái: Avatar card ── */}
        <div className="col-12 col-lg-3">
          <div className="content-card" style={{ textAlign: "center" }}>

            {/* Avatar */}
            <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: profile.avatarBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 32, fontWeight: 800,
                margin: "0 auto",
                boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
              }}>
                {profile.avatar}
              </div>
              <button style={{
                position: "absolute", bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: "50%",
                background: "#2563eb", border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff",
              }}>
                <Camera size={13} />
              </button>
            </div>

            <div style={{ fontSize: 17, fontWeight: 700, color: "#1e2a3a" }}>
              {profile.fullName}
            </div>
            <div style={{ fontSize: 13, color: "#8a94a6", marginTop: 2 }}>
              {profile.position}
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#eff6ff", color: "#2563eb",
                padding: "4px 12px", borderRadius: 20,
                fontSize: 12, fontWeight: 700,
                border: "1px solid #bfdbfe",
              }}>
                <Shield size={11} /> {profile.role}
              </span>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#f0f4f8", margin: "20px 0" }} />

            {/* Info tóm tắt */}
            {[
              { icon: Mail,      val: profile.email },
              { icon: Phone,     val: profile.phone },
              { icon: Building2, val: profile.department },
            ].map(({ icon: Icon, val }, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: 10, textAlign: "left",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "#f4f6fb",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={14} color="#5a6478" />
                </div>
                <span style={{ fontSize: 12, color: "#5a6478", wordBreak: "break-all" }}>{val}</span>
              </div>
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: "#f0f4f8", margin: "16px 0 12px" }} />

            {/* Màu avatar */}
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#8a94a6",
                            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                Màu avatar
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {AVATAR_COLORS.map((bg, i) => (
                  <button key={i}
                    onClick={() => setProfile((p) => ({ ...p, avatarBg: bg }))}
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: bg, border: profile.avatarBg === bg
                        ? "2.5px solid #1e2a3a" : "2px solid transparent",
                      cursor: "pointer", transition: "transform 0.15s",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Cột phải: Tab content ── */}
        <div className="col-12 col-lg-9">
          <div className="content-card">

            {/* Tab bar */}
            <div style={{
              display: "flex", gap: 4, marginBottom: 28,
              borderBottom: "1px solid #e8ecf0", paddingBottom: 0,
              overflowX: "auto",
            }}>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "10px 16px",
                      background: "none", border: "none",
                      borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
                      color: active ? "#2563eb" : "#5a6478",
                      fontWeight: active ? 700 : 500,
                      fontSize: 13.5, cursor: "pointer",
                      whiteSpace: "nowrap",
                      marginBottom: -1,
                      transition: "all 0.15s",
                    }}>
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {renderTab()}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
