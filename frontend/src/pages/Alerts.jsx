import { useState } from "react";
import {
  Check, AlertTriangle, Info, AlertCircle, Bell,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   DỮ LIỆU MẪU – thay bằng API thực khi backend sẵn sàng
───────────────────────────────────────────────────────── */
const INITIAL_ALERTS = [
  {
    id: 1,
    severity: "critical",
    title: "Lương tháng 5/2026 chưa được duyệt",
    description: "Bảng lương tháng 05/2026 đã được tạo nhưng chưa có người phê duyệt. Vui lòng kiểm tra và xác nhận trước ngày 10/05.",
    time: "5 phút trước",
    read: false,
  },
  {
    id: 2,
    severity: "warning",
    title: "3 nhân viên sắp hết hạn hợp đồng",
    description: "Nguyễn Văn A, Trần Thị B, Lê Văn C có hợp đồng hết hạn trong vòng 30 ngày tới. Cần gia hạn hoặc chấm dứt hợp đồng.",
    time: "1 giờ trước",
    read: false,
  },
  {
    id: 3,
    severity: "info",
    title: "Đồng bộ dữ liệu hoàn tất",
    description: "Quá trình đồng bộ dữ liệu giữa HUMAN_2025 (SQL Server) và payroll_2026 (MySQL) đã hoàn tất thành công. 42 bản ghi được cập nhật.",
    time: "2 giờ trước",
    read: false,
  },
  {
    id: 4,
    severity: "warning",
    title: "Tỷ lệ nghỉ phép phòng Kỹ thuật vượt ngưỡng",
    description: "Phòng Kỹ thuật có 6/15 nhân viên đang nghỉ phép cùng lúc (40%), vượt ngưỡng cho phép 30%. Cần điều phối lại lịch nghỉ.",
    time: "3 giờ trước",
    read: true,
  },
  {
    id: 5,
    severity: "info",
    title: "Báo cáo cổ tức Q1/2026 đã sẵn sàng",
    description: "Báo cáo cổ tức quý 1 năm 2026 đã được tổng hợp. Tổng giá trị: 1.250.000.000 VNĐ cho 28 nhân viên đủ điều kiện.",
    time: "Hôm qua",
    read: true,
  },
  {
    id: 6,
    severity: "critical",
    title: "Lỗi kết nối cơ sở dữ liệu AuthDB",
    description: "Hệ thống phát hiện 2 lần kết nối thất bại đến SQL Server AuthDB trong 24 giờ qua. Kiểm tra cấu hình kết nối và trạng thái server.",
    time: "Hôm qua",
    read: true,
  },
  {
    id: 7,
    severity: "info",
    title: "Cập nhật hệ thống phiên bản 2.1.0",
    description: "Hệ thống HR & Payroll đã được cập nhật lên phiên bản 2.1.0. Xem chi tiết các tính năng mới và bản vá lỗi trong ghi chú phát hành.",
    time: "2 ngày trước",
    read: true,
  },
];

/* ─────────────────────────────────────────────────────────
   CẤU HÌNH SEVERITY
───────────────────────────────────────────────────────── */
const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    iconBg: "rgba(59,130,246,0.10)",
    iconColor: "#3b82f6",
    badgeBg: "#eff6ff",
    badgeColor: "#2563eb",
    badgeBorder: "#bfdbfe",
    label: "Thông tin",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "rgba(245,158,11,0.10)",
    iconColor: "#f59e0b",
    badgeBg: "#fffbeb",
    badgeColor: "#d97706",
    badgeBorder: "#fde68a",
    label: "Cảnh báo",
  },
  critical: {
    icon: AlertCircle,
    iconBg: "rgba(239,68,68,0.10)",
    iconColor: "#ef4444",
    badgeBg: "#fef2f2",
    badgeColor: "#dc2626",
    badgeBorder: "#fecaca",
    label: "Nghiêm trọng",
  },
};

/* ─────────────────────────────────────────────────────────
   COMPONENT CHÍNH
───────────────────────────────────────────────────────── */
export default function Alerts() {
  const [alerts, setAlerts]     = useState(INITIAL_ALERTS);
  const [filter, setFilter]     = useState("all"); // "all" | "unread" | "read"

  const unreadCount = alerts.filter((a) => !a.read).length;

  /* Đánh dấu 1 thông báo đã đọc */
  const markRead = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  /* Đánh dấu tất cả đã đọc */
  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  /* Lọc theo tab */
  const filtered = alerts.filter((a) => {
    if (filter === "unread") return !a.read;
    if (filter === "read")   return a.read;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Row 1: Tiêu đề + nút */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1e2a3a", margin: 0 }}>
              Cảnh báo &amp; Thông báo
            </h3>
            <p style={{ fontSize: 13, color: "#8a94a6", margin: "4px 0 0" }}>
              Theo dõi các cảnh báo và thông báo hệ thống
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                color: "#374151",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f4f6fb";
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.color = "#2563eb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.color = "#374151";
              }}
            >
              <Check size={14} />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Row 2: Filter tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "all",    label: "Tất cả",   count: alerts.length },
            { key: "unread", label: "Chưa đọc", count: unreadCount },
            { key: "read",   label: "Đã đọc",   count: alerts.length - unreadCount },
          ].map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 16px",
                  borderRadius: 8,
                  border: active ? "1px solid #2563eb" : "1px solid #e8ecf0",
                  background: active ? "#2563eb" : "#fff",
                  color: active ? "#fff" : "#5a6478",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
                {/* Badge số lượng */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    background: active ? "rgba(255,255,255,0.25)" : "#f0f4f8",
                    color: active ? "#fff" : "#5a6478",
                    padding: "0 5px",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Danh sách thông báo ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 ? (
          /* Empty state */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e8ecf0",
              gap: 12,
            }}
          >
            <Bell size={40} color="#d1d5db" />
            <p style={{ fontSize: 14, color: "#8a94a6", margin: 0, fontWeight: 500 }}>
              Không có cảnh báo nào
            </p>
          </div>
        ) : (
          filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkRead={() => markRead(alert.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ALERT CARD
───────────────────────────────────────────────────────── */
function AlertCard({ alert, onMarkRead }) {
  const cfg  = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
  const Icon = cfg.icon;

  return (
    <div
      className="stat-card"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "16px 20px",
        /* Viền dọc trái nổi bật cho thông báo chưa đọc */
        borderLeft: alert.read ? "1px solid #e8ecf0" : "4px solid #3b82f6",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
    >
      {/* ── Icon severity ── */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: cfg.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={cfg.iconColor} />
      </div>

      {/* ── Nội dung ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Tiêu đề + chấm chưa đọc + badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: "#1e2a3a",
              lineHeight: 1.3,
            }}
          >
            {alert.title}
          </span>

          {/* Chấm tròn chưa đọc */}
          {!alert.read && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#3b82f6",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
          )}

          {/* Badge severity */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 10px",
              borderRadius: 20,
              background: cfg.badgeBg,
              color: cfg.badgeColor,
              border: `1px solid ${cfg.badgeBorder}`,
              flexShrink: 0,
            }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Mô tả */}
        <p
          style={{
            fontSize: 13,
            color: "#5a6478",
            margin: "0 0 6px",
            lineHeight: 1.5,
          }}
        >
          {alert.description}
        </p>

        {/* Thời gian */}
        <span style={{ fontSize: 11, color: "#8a94a6" }}>{alert.time}</span>
      </div>

      {/* ── Nút đánh dấu đã đọc ── */}
      {!alert.read && (
        <button
          onClick={onMarkRead}
          title="Đánh dấu đã đọc"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "#8a94a6",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f0f4ff";
            e.currentTarget.style.color = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#8a94a6";
          }}
        >
          <Check size={13} />
          Đã đọc
        </button>
      )}
    </div>
  );
}
