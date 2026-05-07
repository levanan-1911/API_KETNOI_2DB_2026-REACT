import { useState } from "react";
import { Check, AlertTriangle, Info, AlertCircle } from "lucide-react";

/* ============================================================
   MOCK DATA
   ============================================================ */
const INITIAL_ALERTS = [
  {
    id: 1,
    severity: "critical",
    title: "Hợp đồng sắp hết hạn",
    description: "5 nhân viên có hợp đồng lao động hết hạn trong vòng 7 ngày tới. Cần gia hạn ngay.",
    time: "5 phút trước",
    read: false,
  },
  {
    id: 2,
    severity: "warning",
    title: "Quỹ lương tháng 5 chưa được duyệt",
    description: "Bảng lương tháng 5/2025 đã được tổng hợp nhưng chưa có phê duyệt từ cấp quản lý.",
    time: "1 giờ trước",
    read: false,
  },
  {
    id: 3,
    severity: "info",
    title: "Cập nhật chính sách nghỉ phép",
    description: "Chính sách nghỉ phép năm 2025 đã được cập nhật. Vui lòng thông báo đến toàn bộ nhân viên.",
    time: "3 giờ trước",
    read: false,
  },
  {
    id: 4,
    severity: "warning",
    title: "Nhân viên chưa chấm công",
    description: "12 nhân viên chưa chấm công trong ngày hôm nay (07/05/2025). Cần kiểm tra và xử lý.",
    time: "Hôm nay, 08:30",
    read: false,
  },
  {
    id: 5,
    severity: "info",
    title: "Báo cáo tháng 4 đã sẵn sàng",
    description: "Báo cáo nhân sự và tiền lương tháng 4/2025 đã được tổng hợp và sẵn sàng để xem xét.",
    time: "Hôm qua, 17:00",
    read: true,
  },
  {
    id: 6,
    severity: "critical",
    title: "Phát hiện đăng nhập bất thường",
    description: "Tài khoản admin có đăng nhập từ địa chỉ IP lạ (203.x.x.x) lúc 02:15 sáng. Cần xác minh.",
    time: "Hôm qua, 02:15",
    read: true,
  },
  {
    id: 7,
    severity: "info",
    title: "Nhắc nhở: Đánh giá hiệu suất Q2",
    description: "Chu kỳ đánh giá hiệu suất quý 2 sẽ bắt đầu vào ngày 15/05/2025. Chuẩn bị mẫu đánh giá.",
    time: "2 ngày trước",
    read: true,
  },
];

/* ============================================================
   SEVERITY CONFIG
   ============================================================ */
const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
    badgeBg: "#dbeafe",
    badgeColor: "#1d4ed8",
    label: "Thông tin",
    borderColor: "#3b82f6",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "#fffbeb",
    iconColor: "#d97706",
    badgeBg: "#fef3c7",
    badgeColor: "#92400e",
    label: "Cảnh báo",
    borderColor: "#f59e0b",
  },
  critical: {
    icon: AlertCircle,
    iconBg: "#fef2f2",
    iconColor: "#dc2626",
    badgeBg: "#fee2e2",
    badgeColor: "#991b1b",
    label: "Nghiêm trọng",
    borderColor: "#ef4444",
  },
};

/* ============================================================
   COMPONENT
   ============================================================ */
export default function Alerts() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [filter, setFilter] = useState("all"); // "all" | "unread" | "read"

  const unreadCount = alerts.filter((a) => !a.read).length;

  const filtered = alerts.filter((a) => {
    if (filter === "unread") return !a.read;
    if (filter === "read")   return a.read;
    return true;
  });

  const markAsRead = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: 0, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3>Cảnh báo &amp; Thông báo</h3>
          <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>
            Theo dõi và xử lý các cảnh báo hệ thống
          </p>
        </div>
        <button
          className="btn btn-sm d-flex align-items-center gap-2"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 8,
            background: "#fff",
            color: unreadCount === 0 ? "#8a94a6" : "#1e2a3a",
            fontWeight: 600,
            fontSize: 13,
            padding: "7px 14px",
            cursor: unreadCount === 0 ? "not-allowed" : "pointer",
          }}
        >
          <Check size={15} />
          Đánh dấu tất cả đã đọc
          {unreadCount > 0 && (
            <span style={{
              background: "#ef4444", color: "#fff",
              borderRadius: 20, fontSize: 11, fontWeight: 700,
              padding: "1px 7px", marginLeft: 2,
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { id: "all",    label: "Tất cả" },
          { id: "unread", label: `Chưa đọc${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
          { id: "read",   label: "Đã đọc" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              border: filter === tab.id ? "none" : "1px solid #d1d5db",
              background: filter === tab.id ? "#2563eb" : "#fff",
              color: filter === tab.id ? "#fff" : "#5a6478",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Alerts List ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: "center",
            padding: "48px 0",
            color: "#8a94a6",
            fontSize: 14,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <p style={{ fontWeight: 600, margin: 0 }}>Không có cảnh báo nào</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              {filter === "unread" ? "Bạn đã đọc tất cả thông báo." : "Chưa có thông báo nào."}
            </p>
          </div>
        ) : (
          filtered.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity];
            const Icon = cfg.icon;

            return (
              <div
                key={alert.id}
                className="stat-card"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  borderLeft: !alert.read ? `4px solid ${cfg.borderColor}` : "1px solid #e8ecf0",
                  borderRadius: 14,
                  padding: "16px 20px",
                  transition: "box-shadow 0.2s",
                  background: alert.read ? "#fff" : "#fafbff",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: cfg.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={20} color={cfg.iconColor} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#1e2a3a" }}>
                      {alert.title}
                    </span>

                    {/* Unread dot */}
                    {!alert.read && (
                      <span style={{
                        width: 8, height: 8,
                        borderRadius: "50%",
                        background: "#3b82f6",
                        display: "inline-block",
                        flexShrink: 0,
                      }} />
                    )}

                    {/* Severity badge */}
                    <span style={{
                      background: cfg.badgeBg,
                      color: cfg.badgeColor,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 9px",
                      borderRadius: 20,
                    }}>
                      {cfg.label}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: "#5a6478", margin: "0 0 6px", lineHeight: 1.5 }}>
                    {alert.description}
                  </p>

                  <span style={{ fontSize: 11, color: "#8a94a6" }}>{alert.time}</span>
                </div>

                {/* Action button — chỉ hiện khi chưa đọc */}
                {!alert.read && (
                  <button
                    onClick={() => markAsRead(alert.id)}
                    style={{
                      flexShrink: 0,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      color: "#5a6478",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f4ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
