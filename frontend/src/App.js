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
import PayrollCalc     from "./pages/PayrollCalc";
import Departments    from "./pages/Departments";
import Attendance     from "./pages/Attendance";
import Admin          from "./pages/Admin";

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
                  <Route path="/profile"                 element={<Profile     title="Trang cá nhân"/>} />
                  <Route path="/reports"                 element={<Reports     title="báo cáo"/>} />
                  <Route path="/alerts"                  element={<Alerts      title="thông báo" />} />
                  <Route path="/payroll-calc"            element={<PayrollCalc />} />
                  <Route path="/departments"             element={<Departments />} />
                  <Route path="/attendance"              element={<Attendance />} />
                  <Route path="/admin"                   element={<Admin />} />
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
