import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout          from "./components/Layout";
import Dashboard       from "./pages/Dashboard";
import Employees       from "./pages/Employees";
import EmployeeAdd     from "./pages/EmployeeAdd";
import EmployeeEdit    from "./pages/EmployeeEdit";
import Payroll         from "./pages/Payroll";
import SalaryDetail    from "./pages/SalaryDetail";
import DividendReport  from "./pages/DividendReport";

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
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />

          {/* Nhân viên */}
          <Route path="/employees"     element={<Employees />} />
          <Route path="/employees/add" element={<EmployeeAdd />} />
          <Route path="/employees/:id" element={<EmployeeEdit />} />

          {/* Lương & Thưởng */}
          <Route path="/payroll"                  element={<Payroll />} />
          <Route path="/salary/:id/details"       element={<SalaryDetail />} />
          <Route path="/reports/dividend"         element={<DividendReport />} />

          {/* Đang phát triển */}
          <Route path="/payroll-calc" element={<Placeholder title="Tính lương" />} />
          <Route path="/departments"  element={<Placeholder title="Phòng ban & Chức vụ" />} />
          <Route path="/attendance"   element={<Placeholder title="Chấm công & Nghỉ phép" />} />
          <Route path="/reports"      element={<Placeholder title="Báo cáo" />} />
          <Route path="/alerts"       element={<Placeholder title="Cảnh báo" />} />
          <Route path="/profile"      element={<Placeholder title="Hồ sơ cá nhân" />} />
          <Route path="/admin"        element={<Placeholder title="Quản trị hệ thống" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
