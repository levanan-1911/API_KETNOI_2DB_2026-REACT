import { useState, useEffect, useCallback, useRef } from "react";
import {
  Check, AlertTriangle, Info, AlertCircle, Bell,
  RefreshCw, AlertCircle as ErrorIcon, Trash2, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { useAlerts } from "../context/AlertsContext";

const API_BASE  = "http://localhost:5000";
const PAGE_SIZE = 5; // số thông báo mỗi trang

/* ─────────────────────────────────────────────────────────
   Helper: format thời gian tương đối
───────────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)     return "Vừa xong";
  if (diff < 3600)   return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 172800) return "Hôm qua";
  return `${Math.floor(diff / 86400)} ngày trước`;
}

/* ─────────────────────────────────────────────────────────
   CẤU HÌNH SEVERITY
───────────────────────────────────────────────────────── */
const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    iconBg: "rgba(59,130,246,0.10)", iconColor: "#3b82f6",
    badgeBg: "#eff6ff", badgeColor: "#2563eb", badgeBorder: "#bfdbfe",
    label: "Thông tin",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "rgba(245,158,11,0.10)", iconColor: "#f59e0b",
    badgeBg: "#fffbeb", badgeColor: "#d97706", badgeBorder: "#fde68a",
    label: "Cảnh báo",
  },
  critical: {
    icon: AlertCircle,
    iconBg: "rgba(239,68,68,0.10)", iconColor: "#ef4444",
    badgeBg: "#fef2f2", badgeColor: "#dc2626", badgeBorder: "#fecaca",
    label: "Nghiêm trọng",
  },
};

/* ─────────────────────────────────────────────────────────
   Skeleton loading
───────────────────────────────────────────────────────── */
function Skeleton({ h = 90 }) {
  return (
    <div style={{
      height: h, borderRadius: 14,
      background: "linear-gradient(90deg,#f0f4f8 25%,#e8ecf0 50%,#f0f4f8 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
}

/* ─────────────────────────────────────────────────────────
   COMPONENT CHÍNH
───────────────────────────────────────────────────────── */
export default function Alerts() {
  const [alerts, setAlerts]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [filter, setFilter]               = useState("all");
  const [markingAll, setMarkingAll]       = useState(false);
  const [clearingRead, setClearingRead]   = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [currentPage, setCurrentPage]     = useState(1);
  const listTopRef = useRef(null);

  // Lấy refreshUnread từ Context để cập nhật bell ở Header
  const { refreshUnread } = useAlerts();

  /* ── Tải danh sách từ API ── */
  const loadAlerts = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/alerts`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((res) => {
        const mapped = (res.data ?? []).map((a) => ({
          id:          a.AlertID,
          severity:    a.Severity,
          title:       a.Title,
          description: a.Description,
          read:        a.IsRead,
          time:        timeAgo(a.CreatedAt),
          createdAt:   a.CreatedAt,
        }));
        setAlerts(mapped);
        setCurrentPage(1); // reset về trang 1 khi load lại
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  // Reset về trang 1 khi đổi filter
  useEffect(() => { setCurrentPage(1); }, [filter]);

  /* ── Đánh dấu 1 đã đọc ── */
  const markRead = (id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    fetch(`${API_BASE}/api/alerts/${id}/read`, { method: "PUT" })
      .then((r) => { if (!r.ok) throw new Error(); refreshUnread(); })
      .catch(() => setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: false } : a))));
  };

  /* ── Đánh dấu tất cả đã đọc ── */
  const markAllRead = () => {
    setMarkingAll(true);
    fetch(`${API_BASE}/api/alerts/read-all`, { method: "PUT" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(() => { setAlerts((prev) => prev.map((a) => ({ ...a, read: true }))); refreshUnread(); })
      .catch((e) => alert("Lỗi: " + e.message))
      .finally(() => setMarkingAll(false));
  };

  /* ── Xóa 1 thông báo ── */
  const deleteAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    fetch(`${API_BASE}/api/alerts/${id}`, { method: "DELETE" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); refreshUnread(); })
      .catch(() => loadAlerts());
  };

  /* ── Xóa tất cả đã đọc ── */
  const clearReadAlerts = () => {
    setClearingRead(true);
    fetch(`${API_BASE}/api/alerts/clear-read`, { method: "DELETE" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(() => { setAlerts((prev) => prev.filter((a) => !a.read)); setCurrentPage(1); refreshUnread(); })
      .catch((e) => alert("Lỗi: " + e.message))
      .finally(() => setClearingRead(false));
  };

  /* ── Confirm dialog ── */
  const handleConfirm = () => {
    if (!confirmDialog) return;
    if (confirmDialog.type === "one")      deleteAlert(confirmDialog.id);
    if (confirmDialog.type === "read-all") clearReadAlerts();
    setConfirmDialog(null);
  };

  /* ── Lọc + phân trang ── */
  const filtered = alerts.filter((a) => {
    if (filter === "unread") return !a.read;
    if (filter === "read")   return a.read;
    return true;
  });

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(currentPage, totalPages);
  const pageStart   = (safePage - 1) * PAGE_SIZE;
  const paginated   = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const unreadCount = alerts.filter((a) => !a.read).length;

  /* ── Đổi trang + scroll lên đầu danh sách ── */
  const goToPage = (p) => {
    const clamped = Math.max(1, Math.min(p, totalPages));
    setCurrentPage(clamped);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ── Error state ── */
  if (error) return (
    <div style={{ display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
      <ErrorIcon size={48} color="#ef4444" />
      <p style={{ color: "#ef4444", fontWeight: 600, fontSize: 15 }}>
        Không thể tải dữ liệu: {error}
      </p>
      <button className="btn btn-primary btn-sm" onClick={loadAlerts}>Thử lại</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Confirm Dialog ── */}
      {confirmDialog && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "28px 32px",
            maxWidth: 400, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}>
            <div style={{ display: "flex", alignItems: "center",
                          justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10,
                              background: "rgba(239,68,68,0.10)",
                              display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={18} color="#ef4444" />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1e2a3a" }}>Xác nhận xóa</span>
              </div>
              <button onClick={() => setConfirmDialog(null)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#8a94a6", padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "#5a6478", margin: "0 0 20px", lineHeight: 1.6 }}>
              {confirmDialog.type === "one"
                ? "Bạn có chắc muốn xóa thông báo này? Hành động này không thể hoàn tác."
                : `Bạn có chắc muốn xóa tất cả ${alerts.filter(a => a.read).length} thông báo đã đọc? Hành động này không thể hoàn tác.`}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDialog(null)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #e8ecf0",
                         background: "#f4f6fb", color: "#5a6478", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Hủy
              </button>
              <button onClick={handleConfirm}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none",
                         background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600,
                         cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Trash2 size={13} /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center",
                      justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1e2a3a", margin: 0 }}>
              Cảnh báo &amp; Thông báo
            </h3>
            <p style={{ fontSize: 13, color: "#8a94a6", margin: "4px 0 0" }}>
              Theo dõi các cảnh báo và thông báo hệ thống
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Làm mới */}
            <button onClick={loadAlerts} disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                       borderRadius: 8, border: "1px solid #e8ecf0", background: "#f4f6fb",
                       color: "#5a6478", fontSize: 13, fontWeight: 600,
                       cursor: loading ? "not-allowed" : "pointer" }}>
              <RefreshCw size={14} className={loading ? "spin" : ""} />
              Làm mới
            </button>

            {/* Đánh dấu tất cả đã đọc */}
            {unreadCount > 0 && (
              <button onClick={markAllRead} disabled={markingAll}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                         borderRadius: 8, border: "1px solid #d1d5db", background: "#fff",
                         color: "#374151", fontSize: 13, fontWeight: 600,
                         cursor: markingAll ? "not-allowed" : "pointer", transition: "all 0.15s" }}
                onMouseEnter={(e) => { if (!markingAll) { e.currentTarget.style.background = "#f4f6fb"; e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#2563eb"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#374151"; }}>
                <Check size={14} />
                {markingAll ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
              </button>
            )}

            {/* Xóa đã đọc */}
            {alerts.some((a) => a.read) && (
              <button onClick={() => setConfirmDialog({ type: "read-all" })} disabled={clearingRead}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                         borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2",
                         color: "#dc2626", fontSize: 13, fontWeight: 600,
                         cursor: clearingRead ? "not-allowed" : "pointer", transition: "all 0.15s" }}
                onMouseEnter={(e) => { if (!clearingRead) { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#ef4444"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#fecaca"; }}>
                <Trash2 size={14} />
                {clearingRead ? "Đang xóa..." : "Xóa đã đọc"}
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "all",    label: "Tất cả",   count: alerts.length },
            { key: "unread", label: "Chưa đọc", count: unreadCount },
            { key: "read",   label: "Đã đọc",   count: alerts.length - unreadCount },
          ].map((tab) => {
            const active = filter === tab.key;
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
                         borderRadius: 8,
                         border: active ? "1px solid #2563eb" : "1px solid #e8ecf0",
                         background: active ? "#2563eb" : "#fff",
                         color: active ? "#fff" : "#5a6478",
                         fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                {tab.label}
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
                               minWidth: 20, height: 20, borderRadius: 10, fontSize: 11, fontWeight: 700,
                               background: active ? "rgba(255,255,255,0.25)" : "#f0f4f8",
                               color: active ? "#fff" : "#5a6478", padding: "0 5px" }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Danh sách thông báo ── */}
      <div ref={listTopRef} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          [...Array(PAGE_SIZE)].map((_, i) => <Skeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", padding: "48px 24px", background: "#fff",
                        borderRadius: 14, border: "1px solid #e8ecf0", gap: 12 }}>
            <Bell size={40} color="#d1d5db" />
            <p style={{ fontSize: 14, color: "#8a94a6", margin: 0, fontWeight: 500 }}>
              Không có cảnh báo nào
            </p>
          </div>
        ) : (
          paginated.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkRead={() => markRead(alert.id)}
              onDelete={() => setConfirmDialog({ type: "one", id: alert.id })}
            />
          ))
        )}
      </div>

      {/* ── Phân trang ── */}
      {!loading && filtered.length > PAGE_SIZE && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={goToPage}
        />
      )}

    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGINATION COMPONENT
───────────────────────────────────────────────────────── */
function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  const pageStart = (currentPage - 1) * pageSize + 1;
  const pageEnd   = Math.min(currentPage * pageSize, totalItems);

  /* Tạo danh sách số trang hiển thị (tối đa 5 nút, có dấu ...) */
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  const btnBase = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    minWidth: 36, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "1px solid #e8ecf0", background: "#fff",
    color: "#5a6478", transition: "all 0.15s",
  };

  const btnActive = { ...btnBase, background: "#2563eb", borderColor: "#2563eb", color: "#fff" };
  const btnDisabled = { ...btnBase, opacity: 0.4, cursor: "not-allowed" };

  return (
    <div style={{ display: "flex", alignItems: "center",
                  justifyContent: "space-between", flexWrap: "wrap", gap: 12,
                  padding: "16px 20px", background: "#fff",
                  borderRadius: 14, border: "1px solid #e8ecf0" }}>

      {/* Thông tin trang */}
      <span style={{ fontSize: 13, color: "#8a94a6" }}>
        Hiển thị <strong style={{ color: "#1e2a3a" }}>{pageStart}–{pageEnd}</strong> trong{" "}
        <strong style={{ color: "#1e2a3a" }}>{totalItems}</strong> thông báo
      </span>

      {/* Nút điều hướng */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>

        {/* Trang đầu */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={currentPage === 1 ? btnDisabled : btnBase}
          title="Trang đầu"
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Trang trước */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={currentPage === 1 ? btnDisabled : btnBase}
          title="Trang trước"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Số trang */}
        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`}
              style={{ minWidth: 36, textAlign: "center", color: "#8a94a6", fontSize: 13 }}>
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={p === currentPage ? btnActive : btnBase}
              onMouseEnter={(e) => { if (p !== currentPage) { e.currentTarget.style.background = "#f0f4ff"; e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#2563eb"; } }}
              onMouseLeave={(e) => { if (p !== currentPage) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e8ecf0"; e.currentTarget.style.color = "#5a6478"; } }}
            >
              {p}
            </button>
          )
        )}

        {/* Trang sau */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={currentPage === totalPages ? btnDisabled : btnBase}
          title="Trang sau"
        >
          <ChevronRight size={15} />
        </button>

        {/* Trang cuối */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={currentPage === totalPages ? btnDisabled : btnBase}
          title="Trang cuối"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ALERT CARD
───────────────────────────────────────────────────────── */
function AlertCard({ alert, onMarkRead, onDelete }) {
  const cfg  = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
  const Icon = cfg.icon;

  return (
    <div className="stat-card"
      style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 20px",
               borderLeft: alert.read ? "1px solid #e8ecf0" : "4px solid #3b82f6",
               transition: "box-shadow 0.2s, transform 0.2s" }}>

      {/* Icon severity */}
      <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={cfg.iconColor} />
      </div>

      {/* Nội dung */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#1e2a3a", lineHeight: 1.3 }}>
            {alert.title}
          </span>
          {!alert.read && (
            <span style={{ width: 8, height: 8, borderRadius: "50%",
                           background: "#3b82f6", flexShrink: 0, display: "inline-block" }} />
          )}
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                         background: cfg.badgeBg, color: cfg.badgeColor,
                         border: `1px solid ${cfg.badgeBorder}`, flexShrink: 0 }}>
            {cfg.label}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#5a6478", margin: "0 0 6px", lineHeight: 1.5 }}>
          {alert.description}
        </p>
        <span style={{ fontSize: 11, color: "#8a94a6" }}>{alert.time}</span>
      </div>

      {/* Nhóm nút */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        {!alert.read && (
          <button onClick={onMarkRead} title="Đánh dấu đã đọc"
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                     borderRadius: 8, border: "none", background: "transparent",
                     color: "#8a94a6", fontSize: 12, fontWeight: 600,
                     cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f4ff"; e.currentTarget.style.color = "#2563eb"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8a94a6"; }}>
            <Check size={13} /> Đã đọc
          </button>
        )}
        <button onClick={onDelete} title="Xóa thông báo"
          style={{ display: "flex", alignItems: "center", justifyContent: "center",
                   width: 32, height: 32, borderRadius: 8, border: "none",
                   background: "transparent", color: "#d1d5db",
                   cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#d1d5db"; }}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
