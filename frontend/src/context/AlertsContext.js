import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:5000";

/* ─────────────────────────────────────────────────────────
   Context: chia sẻ unreadCount toàn app
   - Header dùng để hiển thị badge trên bell
   - Alerts.jsx dùng để cập nhật khi đọc/xóa thông báo
───────────────────────────────────────────────────────── */
const AlertsContext = createContext({
  unreadCount: 0,
  refreshUnread: () => {},
});

export function AlertsProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  /* Gọi API lấy số thông báo chưa đọc */
  const refreshUnread = useCallback(() => {
    fetch(`${API_BASE}/api/alerts?filter=unread`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((res) => setUnreadCount(res.unread_count ?? 0))
      .catch(() => {}); // silent fail – không ảnh hưởng UI
  }, []);

  /* Tự động poll mỗi 60 giây */
  useEffect(() => {
    refreshUnread();
    const timer = setInterval(refreshUnread, 60_000);
    return () => clearInterval(timer);
  }, [refreshUnread]);

  return (
    <AlertsContext.Provider value={{ unreadCount, refreshUnread }}>
      {children}
    </AlertsContext.Provider>
  );
}

/* Hook tiện dụng */
export function useAlerts() {
  return useContext(AlertsContext);
}
