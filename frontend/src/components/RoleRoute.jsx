/**
 * RoleRoute.jsx
 * Bảo vệ route theo role/permission.
 * - roles: mảng role được phép, ví dụ ["Admin","HR_Manager"]
 * - permission: chuỗi permission cụ thể, ví dụ "payroll.read"
 * Nếu không có quyền → hiển thị trang 403
 */
import { useAuth } from "../contexts/AuthContext";

function Forbidden({ requiredRoles }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: 400, gap: 16, textAlign: "center",
    }}>
      <div style={{ fontSize: 56 }}>🔒</div>
      <h4 style={{ color: "#1e2a3a", fontWeight: 700, margin: 0 }}>
        Không có quyền truy cập
      </h4>
      <p style={{ color: "#8a94a6", fontSize: 13, margin: 0, maxWidth: 320 }}>
        Tài khoản của bạn không có quyền xem trang này.
        {requiredRoles && (
          <><br />Yêu cầu vai trò: <strong>{requiredRoles.join(", ")}</strong></>
        )}
      </p>
    </div>
  );
}

export default function RoleRoute({ children, roles = [], permission = null }) {
  const { user, hasRole, hasPermission } = useAuth();

  // Admin luôn có toàn quyền
  if (user?.role === "Admin") return children;

  // Kiểm tra theo permission cụ thể
  if (permission && !hasPermission(permission)) {
    return <Forbidden requiredRoles={roles} />;
  }

  // Kiểm tra theo role
  if (roles.length > 0 && !hasRole(...roles)) {
    return <Forbidden requiredRoles={roles} />;
  }

  return children;
}
