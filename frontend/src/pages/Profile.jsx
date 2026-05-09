import { useState, useEffect } from "react";
import {
  User, Mail, Phone, Building2, Briefcase,
  Shield, Key, Bell, Palette, Save,
  Camera, CheckCircle, Eye, EyeOff, RefreshCw, AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API = "http://localhost:5000";

const AVATAR_COLORS = [
  "linear-gradient(135deg, #3b82f6, #8b5cf6)",
  "linear-gradient(135deg, #22c55e, #06b6d4)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
  "linear-gradient(135deg, #1e2a3a, #3b82f6)",
  "linear-gradient(135deg, #f97316, #eab308)",
];

const TABS = [
  { id: "info",     label: "Thông tin cá nhân", icon: User },
  { id: "security", label: "Bảo mật",           icon: Shield },
  { id: "notify",   label: "Thông báo",          icon: Bell },
  { id: "display",  label: "Giao diện",          icon: Palette },
];

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

function InfoField({ label, value, icon: Icon, editable, name, onChange, type = "text" }) {
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
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          style={{ fontSize: 14 }}
        />
      ) : (
        <div style={{
          padding: "9px 12px", background: "#f8fafc",
          border: "1px solid #e8ecf0", borderRadius: 8,
          fontSize: 14, color: "#1e2a3a", fontWeight: 500,
        }}>
          {value || "—"}
        </div>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, sub }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", borderBottom: "1px solid #f0f4f8",
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2a3a" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "#8a94a6", marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!checked)} style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? "#2563eb" : "#d1d5db",
        border: "none", cursor: "pointer", position: "relative",
        transition: "background 0.2s", flexShrink: 0,
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

export default function Profile() {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState("info");
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [editMode,  setEditMode]  = useState(false);
  const [draft,     setDraft]     = useState({});
  const [saving,    setSaving]    = useState(false);
  const [avatarBg,  setAvatarBg]  = useState(AVATAR_COLORS[0]);

  // Toast
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  // Security
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw,  setShowPw]  = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // Notifications (local state)
  const [notif, setNotif] = useState({
    email: true, browser: true, salary: true, system: false, report: true,
  });

  // Display (local state)
  const [display, setDisplay] = useState({ compact: false, animation: true, lang: "vi" });

  /* ── Load thông tin từ API ── */
  const loadProfile = () => {
    setLoading(true);
    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(res => {
        if (res.status === "success") {
          setProfile(res.user);
          setDraft({
            fullName: res.user.fullName || "",
            email:    res.user.email    || "",
            phone:    res.user.phone    || "",
          });
        }
      })
      .catch(() => showToast("Không thể tải thông tin", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProfile(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Lưu thông tin cá nhân ── */
  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method:  "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          FullName: draft.fullName,
          Email:    draft.email,
          Phone:    draft.phone,
        }),
      }).then(r => r.json());

      if (res.status === "success") {
        setProfile(p => ({ ...p, fullName: draft.fullName, email: draft.email, phone: draft.phone }));
        setEditMode(false);
        showToast("Cập nhật thông tin thành công");
      } else {
        showToast(res.msg || "Lỗi khi cập nhật", "error");
      }
    } catch {
      showToast("Không thể kết nối server", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Đổi mật khẩu ── */
  const handleSavePassword = async () => {
    if (!pwForm.current) { setPwError("Vui lòng nhập mật khẩu hiện tại"); return; }
    if (pwForm.next.length < 6) { setPwError("Mật khẩu mới phải ít nhất 6 ký tự"); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Mật khẩu xác nhận không khớp"); return; }
    setPwError("");
    setPwSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method:  "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword:     pwForm.next,
        }),
      }).then(r => r.json());

      if (res.status === "success") {
        setPwForm({ current: "", next: "", confirm: "" });
        showToast("Đổi mật khẩu thành công");
      } else {
        setPwError(res.msg || "Lỗi khi đổi mật khẩu");
      }
    } catch {
      setPwError("Không thể kết nối server");
    } finally {
      setPwSaving(false);
    }
  };

  /* ── Avatar initials ── */
  const initials = (name) =>
    (name || "?").split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();

  /* ── Render tabs ── */
  const renderTab = () => {
    switch (activeTab) {

      /* ── Tab: Thông tin cá nhân ── */
      case "info": return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h5 style={{ margin: 0 }}>Thông tin cá nhân</h5>
              <p style={{ fontSize: 13, color: "#8a94a6", margin: "4px 0 0" }}>
                Cập nhật thông tin hồ sơ của bạn
              </p>
            </div>
            {!editMode ? (
              <button className="btn btn-primary btn-sm"
                onClick={() => setEditMode(true)}>
                Chỉnh sửa
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-sm"
                  onClick={() => { setEditMode(false); setDraft({ fullName: profile?.fullName || "", email: profile?.email || "", phone: profile?.phone || "" }); }}
                  style={{ background: "#f4f6fb", border: "1px solid #e8ecf0", borderRadius: 8, color: "#5a6478", fontWeight: 600 }}>
                  Hủy
                </button>
                <button className="btn btn-primary btn-sm"
                  onClick={handleSaveInfo} disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {saving ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ height: 52, background: "#f0f4f8", borderRadius: 8,
                  backgroundImage: "linear-gradient(90deg,#f0f4f8 25%,#e8ecf0 50%,#f0f4f8 75%)",
                  backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
              ))}
            </div>
          ) : (
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <InfoField label="Họ và tên" icon={User}
                  value={editMode ? draft.fullName : profile?.fullName}
                  editable={editMode} name="fullName"
                  onChange={e => setDraft(d => ({ ...d, fullName: e.target.value }))} />
              </div>
              <div className="col-12 col-md-6">
                <InfoField label="Email" icon={Mail}
                  value={editMode ? draft.email : profile?.email}
                  editable={editMode} name="email" type="email"
                  onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
              </div>
              <div className="col-12 col-md-6">
                <InfoField label="Số điện thoại" icon={Phone}
                  value={editMode ? draft.phone : profile?.phone}
                  editable={editMode} name="phone"
                  onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
              </div>
              <div className="col-12 col-md-6">
                <InfoField label="Tên đăng nhập" icon={User}
                  value={profile?.username} editable={false} />
              </div>
              <div className="col-12 col-md-6">
                <InfoField label="Lần đăng nhập cuối" icon={Briefcase}
                  value={profile?.lastLogin
                    ? new Date(profile.lastLogin).toLocaleString("vi-VN")
                    : "—"}
                  editable={false} />
              </div>
            </div>
          )}

          {/* Role badge */}
          {!loading && (
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
                fontSize: 13, fontWeight: 700, border: "1px solid #bfdbfe",
              }}>
                <Shield size={13} /> {profile?.role || user?.role || "—"}
              </span>
            </div>
          )}
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
                    onChange={e => { setPwForm(p => ({ ...p, [field]: e.target.value })); setPwError(""); }}
                    placeholder="••••••••"
                    style={{ paddingRight: 40, fontSize: 14 }}
                  />
                  <button onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                    type="button"
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

          <button className="btn btn-primary"
            onClick={handleSavePassword} disabled={pwSaving}
            style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {pwSaving ? <RefreshCw size={15} className="spin" /> : <Key size={15} />}
            {pwSaving ? "Đang lưu..." : "Cập nhật mật khẩu"}
          </button>
        </div>
      );

      /* ── Tab: Thông báo ── */
      case "notify": return (
        <div>
          <h5 style={{ marginBottom: 4 }}>Cài đặt thông báo</h5>
          <p style={{ fontSize: 13, color: "#8a94a6", marginBottom: 24 }}>
            Chọn loại thông báo bạn muốn nhận
          </p>
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

      /* ── Tab: Giao diện ── */
      case "display": return (
        <div>
          <h5 style={{ marginBottom: 4 }}>Tùy chỉnh giao diện</h5>
          <p style={{ fontSize: 13, color: "#8a94a6", marginBottom: 24 }}>
            Cá nhân hóa trải nghiệm sử dụng
          </p>
          <Toggle checked={display.compact}   onChange={v => setDisplay(p => ({ ...p, compact: v }))}
            label="Chế độ thu gọn" sub="Giảm khoảng cách giữa các phần tử" />
          <Toggle checked={display.animation} onChange={v => setDisplay(p => ({ ...p, animation: v }))}
            label="Hiệu ứng chuyển động" sub="Bật/tắt animation trong giao diện" />
          <div style={{ padding: "14px 0", borderBottom: "1px solid #f0f4f8" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2a3a", marginBottom: 8 }}>Ngôn ngữ</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ val: "vi", label: "🇻🇳 Tiếng Việt" }, { val: "en", label: "🇺🇸 English" }].map(l => (
                <button key={l.val} onClick={() => setDisplay(p => ({ ...p, lang: l.val }))}
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
            onClick={() => showToast("Đã lưu cài đặt giao diện")}>
            <Save size={15} /> Lưu cài đặt
          </button>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Toast show={toast.show} msg={toast.msg} type={toast.type} />

      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h3>Hồ sơ cá nhân</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Quản lý thông tin tài khoản và cài đặt
          </p>
        </div>
        <button onClick={loadProfile} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6,
            background: "#f4f6fb", border: "1px solid #e8ecf0",
            borderRadius: 8, color: "#5a6478", fontWeight: 600,
            fontSize: 13, padding: "7px 14px", cursor: "pointer" }}>
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          Làm mới
        </button>
      </div>

      <div className="row g-3" style={{ alignItems: "flex-start" }}>

        {/* ── Cột trái: Avatar card ── */}
        <div className="col-12 col-lg-3">
          <div className="content-card" style={{ textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: avatarBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 32, fontWeight: 800, margin: "0 auto",
                boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
              }}>
                {loading ? "?" : initials(profile?.fullName || user?.fullName)}
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
              {loading ? "—" : (profile?.fullName || user?.fullName || "—")}
            </div>
            <div style={{ fontSize: 13, color: "#8a94a6", marginTop: 2 }}>
              {loading ? "—" : (profile?.role || user?.role || "—")}
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#eff6ff", color: "#2563eb",
                padding: "4px 12px", borderRadius: 20,
                fontSize: 12, fontWeight: 700, border: "1px solid #bfdbfe",
              }}>
                <Shield size={11} /> {loading ? "—" : (profile?.role || user?.role)}
              </span>
            </div>

            <div style={{ height: 1, background: "#f0f4f8", margin: "20px 0" }} />

            {[
              { icon: Mail,  val: profile?.email },
              { icon: Phone, val: profile?.phone },
              { icon: User,  val: profile?.username },
            ].filter(r => r.val).map(({ icon: Icon, val }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, textAlign: "left" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f4f6fb",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={14} color="#5a6478" />
                </div>
                <span style={{ fontSize: 12, color: "#5a6478", wordBreak: "break-all" }}>{val}</span>
              </div>
            ))}

            <div style={{ height: 1, background: "#f0f4f8", margin: "16px 0 12px" }} />

            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#8a94a6",
                textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                Màu avatar
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {AVATAR_COLORS.map((bg, i) => (
                  <button key={i} onClick={() => setAvatarBg(bg)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", background: bg,
                      border: avatarBg === bg ? "2.5px solid #1e2a3a" : "2px solid transparent",
                      cursor: "pointer", transition: "transform 0.15s",
                    }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Cột phải: Tab content ── */}
        <div className="col-12 col-lg-9">
          <div className="content-card">
            <div style={{ display: "flex", gap: 4, marginBottom: 28,
              borderBottom: "1px solid #e8ecf0", paddingBottom: 0, overflowX: "auto" }}>
              {TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "10px 16px", background: "none", border: "none",
                      borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
                      color: active ? "#2563eb" : "#5a6478",
                      fontWeight: active ? 700 : 500, fontSize: 13.5,
                      cursor: "pointer", whiteSpace: "nowrap",
                      marginBottom: -1, transition: "all 0.15s",
                    }}>
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {renderTab()}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
