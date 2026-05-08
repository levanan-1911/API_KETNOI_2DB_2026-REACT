import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute  from "./components/ProtectedRoute";
import Layout          from "./components/Layout";
import Login           from "./pages/Login";
import Dashboard       from "./pages/Dashboard";
import Employees       from "./pages/Employees";
import EmployeeAdd     from "./pages/EmployeeAdd";
import EmployeeEdit    from "./pages/EmployeeEdit";
import Payroll         from "./pages/Payroll";
import SalaryDetail    from "./pages/SalaryDetail";
import DividendReport  from "./pages/DividendReport";
import Profile         from "./pages/Profile";
import Reports         from "./pages/Reports";
import Alerts          from "./pages/Alerts";

const Placeholder = ({ title }) => (
  <div style={{ display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                minHeight: 400, gap: 12 }}>
    <div style={{ fontSize: 48 }}>🚧</div>
    <h4 style={{ color: "#1e2a3a", fontWeight: 700 }}>{title}</h4>
    <p style={{ color: "#8a94a6", fontSize: 13 }}>Tính năng đang được phát triển</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected – bọc trong Layout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/"                        element={<Dashboard />} />
                  <Route path="/employees"               element={<Employees />} />
                  <Route path="/employees/add"           element={<EmployeeAdd />} />
                  <Route path="/employees/:id"           element={<EmployeeEdit />} />
                  <Route path="/payroll"                 element={<Payroll />} />
                  <Route path="/salary/:id/details"      element={<SalaryDetail />} />
                  <Route path="/reports/dividend"        element={<DividendReport />} />
                  <Route path="/profile"                 element={<Profile />} />
                  <Route path="/reports"                 element={<Reports />} />
                  <Route path="/alerts"                  element={<Alerts />} />
                  <Route path="/payroll-calc"            element={<Placeholder title="Tính lương" />} />
                  <Route path="/departments"             element={<Placeholder title="Phòng ban & Chức vụ" />} />
                  <Route path="/attendance"              element={<Placeholder title="Chấm công & Nghỉ phép" />} />
                  <Route path="/admin"                   element={<Placeholder title="Quản trị hệ thống" />} />
                  <Route path="*"                        element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
