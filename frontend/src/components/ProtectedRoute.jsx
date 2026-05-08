/**
 * ProtectedRoute.jsx
 * Bảo vệ các route cần đăng nhập.
 * Nếu chưa auth → redirect về /login.
 * Trong khi kiểm tra token → hiển thị loading spinner.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "#f4f6fb", flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 40, height: 40,
          border: "3px solid #e8ecf0",
          borderTopColor: "#2563eb",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <p style={{ color: "#8a94a6", fontSize: 13, margin: 0 }}>Đang xác thực...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
