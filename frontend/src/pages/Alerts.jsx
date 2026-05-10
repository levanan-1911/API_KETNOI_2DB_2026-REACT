import { useState, useEffect, useCallback } from "react";
import { Check, AlertTriangle, Info, AlertCircle, RefreshCw } from "lucide-react";

const API = "http://localhost:5000";

/* ── Severity config ── */
const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    iconBg: "#eff6ff", iconColor: "#2563eb",
    badgeBg: "#dbeafe", badgeColor: "#1d4ed8",
    label: "Thông tin", borderColor: "#3b82f6",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "#fffbeb", iconColor: "#d97706",
    badgeBg: "#fef3c7", badgeColor: "#92400e",
    label: "Cảnh báo", borderColor: "#f59e0b",
  },
  critical: {
    icon: AlertCircle,
    iconBg: "#fef2f2", iconColor: "#dc2626",
    badgeBg: "#fee2e2", badgeColor: "#991b1b",
    label: "Nghiêm trọng", borderColor: "#ef4444",
  },
};

/* ── Sidebar menu config ── */
const CATEGORIES = [
  { id: "all",        label: "Tất cả",     icon: "🔔", color: "#2563eb", bg: "#eff6ff" },
  { id: "salary",     label: "Lương",      icon: "💰", color: "#16a34a", bg: "#f0fdf4" },
  { id: "attendance", label: "Chấm công",  icon: "📅", color: "#d97706", bg: "#fffbeb" },
  { id: "hr",         label: "Nhân sự",    icon: "👥", color: "#9333ea", bg: "#fdf4ff" },
  { id: "birthday",   label: "Sinh nhật",  icon: "🎂", color: "#ec4899", bg: "#fdf2f8" },
];

export default function Alerts() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [active,  setActive]  = useState("all");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/alerts`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(res => {
        const readIds = JSON.parse(localStorage.getItem("readAlerts") || "[]");
        setAlerts((res.data || []).map(a => ({
          ...a,
          read: readIds.includes(`${a.employeeId}-${a.category}-${a.time}`),
        })));
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAsRead = (alert) => {
    const key = `${alert.employeeId}-${alert.category}-${alert.time}`;
    const ids = JSON.parse(localStorage.getItem("readAlerts") || "[]");
    if (!ids.includes(key)) localStorage.setItem("readAlerts", JSON.stringify([...ids, key]));
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, read: true } : a));
  };

  const markAllRead = () => {
    const keys = filtered.map(a => `${a.employeeId}-${a.category}-${a.time}`);
    const existing = JSON.parse(localStorage.getItem("readAlerts") || "[]");
    localStorage.setItem("readAlerts", JSON.stringify([...new Set([...existing, ...keys])]));
    setAlerts(prev => prev.map(a =>
      filtered.find(f => f.id === a.id) ? { ...a, read: true } : a
    ));
  };

  const countBy  = (cat) => alerts.filter(a => cat === "all" || a.category === cat).length;
  const unreadBy = (cat) => alerts.filter(a => !a.read && (cat === "all" || a.category === cat)).length;
  const filtered = alerts.filter(a => active === "all" || a.category === active);
  const unreadFiltered = filtered.filter(a => !a.read).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Header ── */}
      <div className="page-header" style={{ marginBottom: 0, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3>Cảnh báo &amp; Thông báo</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Phân tích tự động bằng AI · {alerts.length} cảnh báo phát hiện
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} disabled={loading} style={{
            border: "1px solid #d1d5db", borderRadius: 8, background: "#fff",
            color: "#5a6478", fontWeight: 600, fontSize: 13, padding: "7px 14px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Làm mới
          </button>
          <button onClick={markAllRead} disabled={unreadFiltered === 0} style={{
            border: "1px solid #d1d5db", borderRadius: 8, background: "#fff",
            color: unreadFiltered === 0 ? "#8a94a6" : "#1e2a3a",
            fontWeight: 600, fontSize: 13, padding: "7px 14px",
            cursor: unreadFiltered === 0 ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Check size={15} />
            Đánh dấu đã đọc
            {unreadFiltered > 0 && (
              <span style={{ background: "#ef4444", color: "#fff", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>
                {unreadFiltered}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Body: sidebar + list ── */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: 200, flexShrink: 0,
          background: "#fff", borderRadius: 14,
          border: "1px solid #e8ecf0",
          overflow: "hidden",
          position: "sticky", top: 16,
        }}>
          {/* Severity summary */}
          {!loading && !error && (
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f4f8" }}>
              {[
                { label: "Nghiêm trọng", count: alerts.filter(a=>a.severity==="critical").length, color: "#ef4444", bg: "#fef2f2" },
                { label: "Cảnh báo",     count: alerts.filter(a=>a.severity==="warning").length,  color: "#d97706", bg: "#fffbeb" },
                { label: "Thông tin",    count: alerts.filter(a=>a.severity==="info").length,     color: "#2563eb", bg: "#eff6ff" },
              ].map(s => (
                <div key={s.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "5px 8px", borderRadius: 8, marginBottom: 4, background: s.bg,
                }}>
                  <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Category menu */}
          <div style={{ padding: "8px 0" }}>
            {CATEGORIES.map(cat => {
              const total  = countBy(cat.id);
              const unread = unreadBy(cat.id);
              const isActive = active === cat.id;
              return (
                <button key={cat.id} onClick={() => setActive(cat.id)} style={{
                  width: "100%", textAlign: "left",
                  padding: "10px 16px",
                  border: "none",
                  background: isActive ? cat.bg : "transparent",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderLeft: isActive ? `3px solid ${cat.color}` : "3px solid transparent",
                  transition: "all 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? cat.color : "#374151" }}>
                      {cat.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {unread > 0 && (
                      <span style={{
                        background: "#ef4444", color: "#fff",
                        borderRadius: 20, fontSize: 10, fontWeight: 700,
                        padding: "1px 6px", minWidth: 18, textAlign: "center",
                      }}>
                        {unread}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "#8a94a6", fontWeight: 600 }}>
                      {total}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Alert list ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "#8a94a6" }}>
              <RefreshCw size={28} className="spin" style={{ marginBottom: 12 }} />
              <p style={{ fontWeight: 600, margin: 0 }}>Đang phân tích dữ liệu bằng AI...</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Isolation Forest đang xử lý lương và chấm công</p>
            </div>
          ) : error ? (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 24, textAlign: "center", color: "#dc2626" }}>
              <AlertCircle size={32} style={{ marginBottom: 8 }} />
              <p style={{ fontWeight: 600, margin: 0 }}>Không thể tải cảnh báo</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>{error}</p>
              <button onClick={load} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Thử lại</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "#8a94a6" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <p style={{ fontWeight: 600, margin: 0 }}>Không có cảnh báo nào</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Không có dữ liệu bất thường trong mục này.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Sub-header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#5a6478", fontWeight: 600 }}>
                  {CATEGORIES.find(c => c.id === active)?.icon}{" "}
                  {CATEGORIES.find(c => c.id === active)?.label} — {filtered.length} cảnh báo
                  {unreadFiltered > 0 && (
                    <span style={{ marginLeft: 8, background: "#fef2f2", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                      {unreadFiltered} chưa đọc
                    </span>
                  )}
                </span>
              </div>

              {filtered.map(alert => {
                const cfg  = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
                const Icon = cfg.icon;
                return (
                  <div key={alert.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 14,
                    background: alert.read ? "#fff" : "#fafbff",
                    border: "1px solid #e8ecf0",
                    borderLeft: !alert.read ? `4px solid ${cfg.borderColor}` : "1px solid #e8ecf0",
                    borderRadius: 12, padding: "14px 18px",
                    transition: "box-shadow 0.15s",
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: cfg.iconBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={18} color={cfg.iconColor} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#1e2a3a" }}>
                          {alert.title}
                        </span>
                        {!alert.read && (
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", display: "inline-block", flexShrink: 0 }} />
                        )}
                        <span style={{ background: cfg.badgeBg, color: cfg.badgeColor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "#5a6478", margin: "0 0 5px", lineHeight: 1.5 }}>
                        {alert.description}
                      </p>
                      <span style={{ fontSize: 11, color: "#8a94a6" }}>{alert.time}</span>
                    </div>

                    {/* Mark read */}
                    {!alert.read && (
                      <button onClick={() => markAsRead(alert)} style={{
                        flexShrink: 0, padding: "5px 10px", borderRadius: 8,
                        border: "1px solid #e8ecf0", background: "#f4f6fb",
                        color: "#5a6478", fontSize: 11, fontWeight: 600, cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}>
                        Đã đọc
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
