# Báo cáo Nguồn Dữ liệu Hệ thống HR & Payroll

> **Dự án:** API_KETNOI_2DB_2026-REACT  
> **Ngày:** 09/05/2026  
> **Mô tả:** Hệ thống kết nối 2 database — SQL Server (HUMAN_2025) và MySQL (payroll_2026) — thông qua Flask API, hiển thị trên giao diện React.

---

## Kiến trúc tổng quan

```
SQL Server (HUMAN_2025)          MySQL (payroll_2026)
        │                                │
        └──────────── Flask API ─────────┘
                          │
                     React Frontend
```

| Thành phần | Công nghệ |
|---|---|
| Database 1 | SQL Server — HUMAN_2025 (nhân sự) |
| Database 2 | MySQL — payroll_2026 (lương, chấm công) |
| Backend | Python Flask (`backend/app.py`, `backend/router.py`) |
| Frontend | React (`frontend/src/pages/`) |

---

## Chi tiết từng trang

---

### 1. Dashboard (Tổng quan)

**File:** `frontend/src/pages/Dashboard.jsx`  
**API:** `GET /api/reports/dashboard`

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Tổng nhân viên | SQL Server — bảng `Employees` |
| Quỹ lương tháng (TotalNet, TotalBase, TotalBonus, TotalDeductions) | MySQL — bảng `salaries` |
| Tổng cổ tức | SQL Server — bảng `Dividends` |
| Lương trung bình | Tính toán: TotalNet / TotalEmployees |
| Biểu đồ cơ cấu nhân sự theo phòng ban (Pie chart) | SQL Server — bảng `Employees` JOIN `Departments` |
| Biểu đồ đánh giá năng lực phòng ban (Radar chart) | **Dữ liệu mô phỏng** — tính từ hash tên phòng ban, không lấy từ DB |
| Bảng chi tiết theo phòng ban | SQL Server — bảng `Departments` JOIN `Employees` |

---

### 2. Nhân viên

**File:** `frontend/src/pages/Employees.jsx`  
**API:** `GET /api/employees`, `GET /api/departments`, `DELETE /api/employees/:id`

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Danh sách nhân viên (tên, email, SĐT, ngày vào, trạng thái) | SQL Server — bảng `Employees` |
| Phòng ban của nhân viên | SQL Server — bảng `Departments` (JOIN) |
| Chức vụ của nhân viên | SQL Server — bảng `Positions` (JOIN) |
| Bộ lọc phòng ban | SQL Server — bảng `Departments` |
| Thống kê trạng thái (đang làm, thử việc, nghỉ phép...) | Tính toán từ dữ liệu `Employees` |

---

### 3. Thêm nhân viên

**File:** `frontend/src/pages/EmployeeAdd.jsx`  
**API:** `POST /api/employees`, `GET /api/departments`, `GET /api/positions`

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Dropdown chọn phòng ban | SQL Server — bảng `Departments` |
| Dropdown chọn chức vụ | SQL Server — bảng `Positions` |
| Khi lưu: ghi đồng thời vào 2 DB | SQL Server — bảng `Employees` + MySQL — bảng `employees_payroll` |

---

### 4. Sửa nhân viên

**File:** `frontend/src/pages/EmployeeEdit.jsx`  
**API:** `GET /api/employees/:id`, `PUT /api/employees/:id`

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Thông tin nhân viên hiện tại | SQL Server — bảng `Employees` JOIN `Departments`, `Positions` |
| Khi lưu: cập nhật đồng thời 2 DB | SQL Server — bảng `Employees` + MySQL — bảng `employees_payroll` |

---

### 5. Phòng ban & Chức vụ (Tổ chức)

**File:** `frontend/src/pages/Organization.jsx`  
**API:** `GET /api/departments/stats`, `GET /api/positions/stats`

#### Tab Phòng ban

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Tên phòng ban | SQL Server — bảng `Departments` |
| Số nhân viên | SQL Server — bảng `Employees` (COUNT) |
| Trưởng phòng | SQL Server — `Employees` WHERE `PositionID = 2` |
| Lương trung bình | MySQL — bảng `salaries` JOIN `employees_payroll` |

#### Tab Chức vụ

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Tên chức vụ | SQL Server — bảng `Positions` |
| Cấp bậc | Lấy từ `PositionID` (1 = cấp 1, 2 = cấp 2...) |
| Số nhân viên | SQL Server — bảng `Employees` (COUNT) |
| Lương trung bình | MySQL — bảng `salaries` JOIN `employees_payroll` |

---

### 6. Bảng lương

**File:** `frontend/src/pages/Payroll.jsx`  
**API:** `GET /api/payroll?month=YYYY-MM`, `GET /api/payroll/months`, `GET /api/employees`, `PUT /api/salary/:id`

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Danh sách tháng có dữ liệu | MySQL — bảng `salaries` (DISTINCT SalaryMonth) |
| Lương cơ bản, thưởng, khấu trừ, thực nhận | MySQL — bảng `salaries` |
| Tên nhân viên, phòng ban, chức vụ | MySQL — bảng `employees_payroll` JOIN `departments_payroll`, `positions_payroll` |
| Nhân viên chưa có lương tháng này | SQL Server — bảng `Employees` (so sánh với danh sách đã có lương trong MySQL) |
| Tổng quỹ lương (footer) | Tính toán từ dữ liệu MySQL |

---

### 7. Chi tiết lương

**File:** `frontend/src/pages/SalaryDetail.jsx`  
**API:** `GET /api/salary/:id/details`, `GET /api/salary/:id/history`

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Thông tin nhân viên (tên, phòng ban, chức vụ) | MySQL — bảng `employees_payroll` JOIN `departments_payroll`, `positions_payroll` |
| Chi tiết lương tháng (lương CB, thưởng, khấu trừ, thực nhận) | MySQL — bảng `salaries` |
| Lịch sử lương (biểu đồ + bảng) | MySQL — bảng `salaries` (toàn bộ lịch sử theo EmployeeID) |
| Cổ tức (danh sách + tổng) | SQL Server — bảng `Dividends` |

---

### 8. Chấm công & Nghỉ phép

**File:** `frontend/src/pages/Attendance.jsx`  
**API:** `GET /api/attendance/detail`, `GET /api/leave-requests`, `PUT /api/attendance/:id`, `POST /api/leave-requests`, `PUT /api/leave-requests/:id`

#### Tab Chấm công

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Ngày làm việc, nghỉ phép, vắng mặt, tăng ca | MySQL — bảng `attendance` |
| Tên nhân viên, phòng ban, chức vụ | MySQL — bảng `employees_payroll` JOIN `departments_payroll`, `positions_payroll` |
| Bộ lọc phòng ban | SQL Server — bảng `Departments` |

#### Tab Nghỉ phép

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Danh sách yêu cầu nghỉ phép (tên, ngày, lý do, trạng thái) | MySQL — bảng `leave_requests` |
| Dropdown chọn nhân viên khi tạo yêu cầu | SQL Server — bảng `Employees` |

---

### 9. Báo cáo

**File:** `frontend/src/pages/Reports.jsx`  
**API:** `GET /api/employees`, `GET /api/departments/stats`, `GET /api/payroll?month=`, `GET /api/payroll/months`, `GET /api/reports/dividend`

#### Tab Nhân sự

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Tổng nhân viên, phân loại trạng thái | SQL Server — bảng `Employees` |
| Biểu đồ nhân viên theo phòng ban | SQL Server — bảng `Departments` JOIN `Employees` |
| Biểu đồ tỷ lệ trạng thái (Pie chart) | SQL Server — bảng `Employees` |
| Bảng chi tiết phòng ban (số NV, trưởng phòng, lương TB) | SQL Server + MySQL (lương TB từ `salaries`) |
| Xuất CSV | Dữ liệu từ SQL Server |

#### Tab Tiền lương

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Tổng quỹ lương, lương TB, tổng thưởng, tổng khấu trừ | MySQL — bảng `salaries` |
| Biểu đồ lương CB vs Thực nhận theo nhân viên | MySQL — bảng `salaries` |
| Biểu đồ lương TB theo phòng ban | MySQL — bảng `salaries` JOIN `employees_payroll` |
| Bảng chi tiết bảng lương | MySQL — bảng `salaries` JOIN `employees_payroll`, `departments_payroll`, `positions_payroll` |
| Xuất CSV | Dữ liệu từ MySQL |

#### Tab Cổ tức

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Tổng cổ tức, số nhân viên nhận, TB mỗi người, cao nhất | SQL Server — bảng `Dividends` |
| Danh sách nhân viên nhận cổ tức (tên, phòng ban, số lần, tổng tiền) | SQL Server — bảng `Dividends` JOIN `Employees`, `Departments`, `Positions` |
| Biểu đồ top nhân viên nhận cổ tức | SQL Server — bảng `Dividends` |
| Xuất CSV | Dữ liệu từ SQL Server |

---

### 10. Báo cáo cổ tức (trang riêng)

**File:** `frontend/src/pages/DividendReport.jsx`  
**API:** `GET /api/reports/dividend?year=YYYY`

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Tổng cổ tức theo năm | SQL Server — bảng `Dividends` |
| Danh sách nhân viên nhận cổ tức | SQL Server — bảng `Dividends` JOIN `Employees`, `Departments`, `Positions` |
| Biểu đồ top nhân viên | SQL Server — bảng `Dividends` |

---

### 11. Hồ sơ cá nhân

**File:** `frontend/src/pages/Profile.jsx`  
**API:** Không gọi API

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Toàn bộ thông tin (tên, email, SĐT, phòng ban, chức vụ) | **Dữ liệu mock cứng** trong code — không lấy từ database |
| Đổi mật khẩu, cài đặt thông báo, giao diện | **Chỉ lưu trên trình duyệt (state)** — không ghi vào DB |

---

### 12. Cảnh báo & Thông báo

**File:** `frontend/src/pages/Alerts.jsx`  
**API:** Không gọi API

| Thông tin hiển thị | Nguồn dữ liệu |
|---|---|
| Toàn bộ danh sách cảnh báo | **Dữ liệu mock cứng** trong code — không lấy từ database |

---

## Tổng hợp bảng dữ liệu theo nguồn

### SQL Server — HUMAN_2025

| Bảng | Dùng ở trang |
|---|---|
| `Employees` | Nhân viên, Dashboard, Tổ chức, Báo cáo, Chấm công |
| `Departments` | Nhân viên, Tổ chức, Báo cáo, Chấm công |
| `Positions` | Nhân viên, Tổ chức, Báo cáo |
| `Dividends` | Chi tiết lương, Báo cáo cổ tức, Dashboard |

### MySQL — payroll_2026

| Bảng | Dùng ở trang |
|---|---|
| `salaries` | Bảng lương, Chi tiết lương, Dashboard, Báo cáo |
| `employees_payroll` | Bảng lương, Chi tiết lương, Chấm công |
| `departments_payroll` | Bảng lương, Chi tiết lương, Chấm công |
| `positions_payroll` | Bảng lương, Chi tiết lương, Chấm công |
| `attendance` | Chấm công |
| `leave_requests` | Chấm công (tab Nghỉ phép) |

### Dữ liệu mock (không từ DB)

| Trang | Nội dung mock |
|---|---|
| Dashboard | Biểu đồ Radar "Đánh giá năng lực phòng ban" |
| Hồ sơ cá nhân | Toàn bộ thông tin người dùng |
| Cảnh báo & Thông báo | Toàn bộ danh sách cảnh báo |

---

*Báo cáo được tạo tự động từ phân tích mã nguồn dự án.*
