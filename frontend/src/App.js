import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute  from "./components/ProtectedRoute";
import RoleRoute       from "./components/RoleRoute";
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
import Departments     from "./pages/Departments";
import Attendance      from "./pages/Attendance";
import Admin           from "./pages/Admin";
import MySalary        from "./pages/MySalary";
import MyAttendance    from "./pages/MyAttendance";



/* ── Ma trận phân quyền ──────────────────────────────────
   Admin          : toàn quyền (RoleRoute tự bypass)
   HR_Manager     : nhân viên, phòng ban, chấm công, báo cáo, cảnh báo
   Payroll_Manager: lương, tính lương, báo cáo
   Employee       : dashboard, hồ sơ, lương của mình, chấm công của mình
   ─────────────────────────────────────────────────────── */
const HR_ROLES      = ["Admin", "HR_Manager"];
const PAYROLL_ROLES = ["Admin", "Payroll_Manager"];
const MGMT_ROLES    = ["Admin", "HR_Manager", "Payroll_Manager"];
const ALL_ROLES     = ["Admin", "HR_Manager", "Payroll_Manager", "Employee"];

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
                  {/* Tất cả role */}
                  <Route path="/"               element={<Dashboard />} />
                  <Route path="/profile"        element={<Profile />} />

                  {/* Tất cả role — xem lương + chấm công của chính mình */}
                  <Route path="/my-salary"      element={<RoleRoute roles={ALL_ROLES}><MySalary /></RoleRoute>} />
                  <Route path="/my-attendance"  element={<RoleRoute roles={ALL_ROLES}><MyAttendance /></RoleRoute>} />

                  {/* HR_Manager + Admin */}
                  <Route path="/employees"      element={<RoleRoute roles={HR_ROLES}><Employees /></RoleRoute>} />
                  <Route path="/employees/add"  element={<RoleRoute roles={HR_ROLES}><EmployeeAdd /></RoleRoute>} />
                  <Route path="/employees/:id"  element={<RoleRoute roles={HR_ROLES}><EmployeeEdit /></RoleRoute>} />
                  <Route path="/departments"    element={<RoleRoute roles={HR_ROLES}><Departments /></RoleRoute>} />
                  <Route path="/attendance"     element={<RoleRoute roles={HR_ROLES}><Attendance /></RoleRoute>} />
                  <Route path="/alerts"         element={<RoleRoute roles={MGMT_ROLES}><Alerts title="thông báo" /></RoleRoute>} />

                  {/* Payroll_Manager + Admin */}
                  <Route path="/payroll"        element={<RoleRoute roles={PAYROLL_ROLES}><Payroll /></RoleRoute>} />
                  <Route path="/payroll-calc"   element={<RoleRoute roles={PAYROLL_ROLES}><PayrollCalc /></RoleRoute>} />
                  <Route path="/salary/:id/details" element={<RoleRoute roles={PAYROLL_ROLES}><SalaryDetail /></RoleRoute>} />

                  {/* HR + Payroll + Admin */}
                  <Route path="/reports"        element={<RoleRoute roles={MGMT_ROLES}><Reports title="báo cáo" /></RoleRoute>} />
                  <Route path="/reports/dividend" element={<RoleRoute roles={MGMT_ROLES}><DividendReport /></RoleRoute>} />

                  {/* Admin only */}
                  <Route path="/admin"          element={<RoleRoute roles={["Admin"]}><Admin /></RoleRoute>} />

                  <Route path="*"               element={<Navigate to="/" replace />} />
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
