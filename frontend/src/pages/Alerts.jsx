import { useState, useEffect, useCallback } from "react";
import { Check, AlertTriangle, Info, AlertCircle, RefreshCw } from "lucide-react";

const API = "http://localhost:5000";

/* ============================================================
   SEVERITY CONFIG
   ============================================================ */
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

const CATEGORY_LABEL = {
  salary:     "💰 Lương",
  attendance: "📅 Chấm công",
  hr:         "👥 Nhân sự",
  birthday:   "🎂 Sinh nhật",
};

/* ============================================================
   COMPONENT
   ============================================================ */
export default function Alerts() {
  const [alerts,   setAlerts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filter,   setFilter]   = useState("all");   // all | unread | read
  const [category, setCategory] = useState("all");   // all | salary | attendance | hr

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/alerts`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(res => {
        // Thêm trạng thái read từ localStorage
        const readIds = JSON.parse(localStorage.getItem("readAlerts") || "[]");
        const data = (res.data || []).map(a => ({
          ...a,
          read: readIds.includes(`${a.employeeId}-${a.category}-${a.time}`),
        }));
        setAlerts(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAsRead = (alert) => {
    const key = `${alert.employeeId}-${alert.category}-${alert.time}`;
    const readIds = JSON.parse(localStorage.getItem("readAlerts") || "[]");
    if (!readIds.includes(key)) {
      localStorage.setItem("readAlerts", JSON.stringify([...readIds, key]));
    }
    setAlerts(prev => prev.map(a =>
      a.id === alert.id ? { ...a, read: true } : a
    ));
  };

  const markAllRead = () => {
    const keys = alerts.map(a => `${a.employeeId}-${a.category}-${a.time}`);
    localStorage.setItem("readAlerts", JSON.stringify(keys));
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  // Filter
  const filtered = alerts.filter(a => {
    const readOk     = filter === "all" || (filter === "unread" ? !a.read : a.read);
    const categoryOk = category === "all" || a.category === category;
    return readOk && categoryOk;
  });

  const unreadCount = alerts.filter(a => !a.read).length;

  // Đếm theo category
  const countBy = (cat) => alerts.filter(a => a.category === cat).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: 0, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3>Cảnh báo &amp; Thông báo</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Phân tích tự động bằng AI · {alerts.length} cảnh báo phát hiện
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={load}
            disabled={loading}
            style={{
              border: "1px solid #d1d5db", borderRadius: 8,
              background: "#fff", color: "#5a6478",
              fontWeight: 600, fontSize: 13, padding: "7px 14px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Làm mới
          </button>
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            style={{
              border: "1px solid #d1d5db", borderRadius: 8,
              background: "#fff",
              color: unreadCount === 0 ? "#8a94a6" : "#1e2a3a",
              fontWeight: 600, fontSize: 13, padding: "7px 14px",
              cursor: unreadCount === 0 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Check size={15} />
            Đánh dấu tất cả đã đọc
            {unreadCount > 0 && (
              <span style={{
                background: "#ef4444", color: "#fff",
                borderRadius: 20, fontSize: 11, fontWeight: 700,
                padding: "1px 7px",
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      {!loading && !error && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Nghiêm trọng", count: alerts.filter(a=>a.severity==="critical").length, color: "#ef4444", bg: "#fef2f2" },
            { label: "Cảnh báo",     count: alerts.filter(a=>a.severity==="warning").length,  color: "#d97706", bg: "#fffbeb" },
            { label: "Thông tin",    count: alerts.filter(a=>a.severity==="info").length,     color: "#2563eb", bg: "#eff6ff" },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: 10, padding: "8px 16px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.count}</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {/* Read filter */}
        {[
          { id: "all",    label: "Tất cả" },
          { id: "unread", label: `Chưa đọc${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
          { id: "read",   label: "Đã đọc" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
            padding: "7px 18px", borderRadius: 8,
            border: filter === tab.id ? "none" : "1px solid #d1d5db",
            background: filter === tab.id ? "#2563eb" : "#fff",
            color: filter === tab.id ? "#fff" : "#5a6478",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            {tab.label}
          </button>
        ))}

        <span style={{ color: "#d1d5db", margin: "0 4px" }}>|</span>

        {/* Category filter */}
        {[
          { id: "all",        label: "Tất cả loại" },
          { id: "salary",     label: `💰 Lương (${countBy("salary")})` },
          { id: "attendance", label: `📅 Chấm công (${countBy("attendance")})` },
          { id: "hr",         label: `👥 Nhân sự (${countBy("hr")})` },
          { id: "birthday",   label: `🎂 Sinh nhật (${countBy("birthday")})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setCategory(tab.id)} style={{
            padding: "7px 14px", borderRadius: 8,
            border: category === tab.id ? "none" : "1px solid #d1d5db",
            background: category === tab.id ? "#1e2a3a" : "#fff",
            color: category === tab.id ? "#fff" : "#5a6478",
            fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#8a94a6" }}>
          <RefreshCw size={28} className="spin" style={{ marginBottom: 12 }} />
          <p style={{ fontWeight: 600 }}>Đang phân tích dữ liệu bằng AI...</p>
          <p style={{ fontSize: 13 }}>Isolation Forest đang xử lý lương và chấm công</p>
        </div>
      ) : error ? (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: 12, padding: "24px", textAlign: "center", color: "#dc2626",
        }}>
          <AlertCircle size={32} style={{ marginBottom: 8 }} />
          <p style={{ fontWeight: 600, margin: 0 }}>Không thể tải cảnh báo</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>{error}</p>
          <button onClick={load} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
            Thử lại
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#8a94a6" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <p style={{ fontWeight: 600, margin: 0 }}>Không có cảnh báo nào</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                {filter === "unread" ? "Bạn đã đọc tất cả." : "Không có dữ liệu bất thường."}
              </p>
            </div>
          ) : (
            filtered.map(alert => {
              const cfg  = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <div key={alert.id} className="stat-card" style={{
                  display: "flex", alignItems: "flex-start", gap: 16,
                  borderLeft: !alert.read ? `4px solid ${cfg.borderColor}` : "1px solid #e8ecf0",
                  borderRadius: 14, padding: "16px 20px",
                  background: alert.read ? "#fff" : "#fafbff",
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: cfg.iconBg, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={20} color={cfg.iconColor} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#1e2a3a" }}>
                        {alert.title}
                      </span>
                      {!alert.read && (
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: "#3b82f6", display: "inline-block", flexShrink: 0,
                        }} />
                      )}
                      <span style={{
                        background: cfg.badgeBg, color: cfg.badgeColor,
                        fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                      }}>
                        {cfg.label}
                      </span>
                      {alert.category && (
                        <span style={{
                          background: "#f4f6fb", color: "#5a6478",
                          fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
                        }}>
                          {CATEGORY_LABEL[alert.category] || alert.category}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "#5a6478", margin: "0 0 6px", lineHeight: 1.5 }}>
                      {alert.description}
                    </p>
                    <span style={{ fontSize: 11, color: "#8a94a6" }}>{alert.time}</span>
                  </div>

                  {/* Mark read */}
                  {!alert.read && (
                    <button onClick={() => markAsRead(alert)} style={{
                      flexShrink: 0, padding: "6px 12px", borderRadius: 8,
                      border: "none", background: "transparent",
                      color: "#5a6478", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
