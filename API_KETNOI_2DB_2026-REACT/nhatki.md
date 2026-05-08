# Nhật ký thay đổi dự án – HR & Payroll Dashboard

---

## [2026-05-05] – Khởi tạo nhật ký

### Tổng quan dự án
- **Backend**: Python Flask, port 5000
- **Frontend**: React + Bootstrap, port 3000
- **Database 1**: SQL Server – `HUMAN_2025` (4 bảng: Employees, Departments, Positions, Dividends)
- **Database 2**: MySQL – `payroll_2026` (5 bảng: employees_payroll, departments_payroll, positions_payroll, salaries, attendance)
- **Database 3**: SQL Server – `AuthDB` (9 bảng: Users, Roles, Users_Roles, Permissions, Role_Permissions, Modules, Functions, Function_Permissions, Audit_Log)

---

## [2026-05-05] – Hoàn thiện backend/router.py

### Thêm mới
| API | Method | Mô tả |
|-----|--------|-------|
| `/api/positions` | GET | Lấy danh sách chức vụ từ HUMAN_2025 |
| `/api/employees/<id>` | GET | Lấy chi tiết 1 nhân viên |
| `/api/employees` | POST | Thêm nhân viên + đồng bộ MySQL (2-DB transaction) |
| `/api/employees/<id>` | PUT | Cập nhật nhân viên + đồng bộ MySQL |
| `/api/employees/<id>` | DELETE | Xóa nhân viên + đồng bộ MySQL (check Dividends) |

### Đã có sẵn
- GET `/api/employees` – danh sách nhân viên
- GET `/api/departments` – danh sách phòng ban

---

## [2026-05-05] – Hoàn thiện frontend/src/pages/EmployeeEdit.jsx

### Thay đổi
- Thêm đầy đủ các field: DateOfBirth, Gender, PhoneNumber, Email, HireDate
- Thêm dropdown Department (gọi `/api/departments`)
- Thêm dropdown Position (gọi `/api/positions`)
- Thêm dropdown Status (Active / Inactive)
- Thêm hàm `convertDate()` để chuyển định dạng ngày GMT → YYYY-MM-DD cho input[type=date]

---

## [2026-05-05] – Tạo frontend/src/services/api.js

### Thêm mới
- Tạo axios instance dùng chung với `baseURL: http://localhost:5000/api`

---

## [2026-05-05] – Cập nhật backend/config.py

### Thay đổi
- Thêm hàm `get_authdb_connection()` để kết nối SQL Server – AuthDB
- Giữ nguyên `get_sqlserver_connection()` (HUMAN_2025) và `get_mysql_connection()` (payroll_2026)

---

## [2026-05-05] – Cập nhật backend/router.py (lần 2 – đầy đủ theo DB thực tế)

### Thêm mới theo cấu trúc DB thực tế
| API | Method | DB | Mô tả |
|-----|--------|----|-------|
| `/api/departments/sync` | POST | HUMAN→MySQL | Đồng bộ phòng ban |
| `/api/positions/sync` | POST | HUMAN→MySQL | Đồng bộ chức vụ |
| `/api/payroll` | GET | MySQL | Danh sách lương, filter theo `?month=YYYY-MM` |
| `/api/salary/<id>/details` | GET | MySQL+HUMAN | Chi tiết lương + cổ tức gộp 2 DB |
| `/api/salary/<id>/history` | GET | MySQL | Lịch sử lương theo nhân viên |
| `/api/salary/<id>` | PUT | MySQL | Cập nhật lương (tính lại NetSalary) |
| `/api/attendance` | GET | MySQL | Chấm công, filter `?emp_id=&month=` |
| `/api/reports/dashboard` | GET | HUMAN+MySQL | KPI tổng hợp cho Dashboard |

### Ghi chú kỹ thuật
- `salaries.NetSalary` không phải computed column → tính thủ công: `NetSalary = BaseSalary + Bonus - Deductions`
- `attendance.AttendanceMonth` là kiểu `date` (YYYY-MM-DD)
- `salaries.SalaryMonth` là kiểu `date` (YYYY-MM-DD)
- Tất cả thao tác ghi đều dùng 2-DB transaction với rollback

---

## [2026-05-05] – Tạo database/HUMAN_2025_SQLServer.sql

### Thêm mới
- Script tạo database HUMAN_2025 với dữ liệu mẫu
- Bao gồm: Departments, Positions, Employees, Dividends, SYNC_LOG, AUDIT_LOG, Users

---

## [2026-05-05] – Tạo database/PAYROLL_2026_MySQL.sql

### Thêm mới
- Script tạo database payroll_2026 với dữ liệu mẫu
- Bao gồm: departments_payroll, positions_payroll, employees_payroll, salaries, attendance, leave_requests, sync_log

---

## [2026-05-05] – Tạo database/README_DATABASE.md

### Thêm mới
- Tài liệu mô tả cấu trúc 3 database
- Quy tắc đồng bộ (Sync Rules) giữa HUMAN_2025 và payroll_2026
- Hướng dẫn chạy script

---

---

## [2026-05-05] – Thiết kế lại toàn bộ UI (Sidebar, Header, Layout, Dashboard)

### Cài thêm thư viện
- `lucide-react` – icon
- `recharts` – biểu đồ

### Thay đổi frontend/src/index.css
- Viết lại toàn bộ CSS: sidebar, header, layout, stat-card, content-card, table, badge, form, button
- Thêm animation `shimmer` (skeleton loading) và `spin` (loading icon)
- Responsive mobile: sidebar tự thu gọn ở màn hình < 768px

### Thay đổi frontend/src/components/Sidebar.jsx
- Thiết kế lại hoàn toàn theo tham khảo AppSidebar.md
- 10 menu items: Tổng quan, Nhân viên, Tiền lương, Tính lương, Phòng ban & Chức vụ, Chấm công & Nghỉ phép, Báo cáo, Cảnh báo, Hồ sơ cá nhân, Quản trị
- Có collapse/expand với nút ChevronLeft/Right
- Active state tự động theo URL (useLocation)
- Logo "HR & Payroll / Công ty X" ở đầu sidebar

### Thay đổi frontend/src/components/Header.jsx
- Thiết kế lại: hiển thị tiêu đề trang động theo URL
- Có search bar, notification bell (với dot đỏ), role badge, avatar
- Tự điều chỉnh `left` theo trạng thái collapsed của sidebar

### Thay đổi frontend/src/components/Layout.jsx
- Quản lý state `collapsed` cho sidebar
- Truyền `collapsed` xuống Header và Sidebar

### Tạo mới frontend/src/pages/Dashboard.jsx
- Lấy dữ liệu thật từ `GET /api/reports/dashboard`
- 4 KPI cards: Tổng nhân viên, Quỹ lương, Lương TB, Tổng cổ tức
- Pie chart: Cơ cấu nhân sự theo phòng ban (recharts)
- Bar chart: Nhân viên theo phòng ban (recharts, màu sắc theo phòng ban)
- Progress bars: Cơ cấu quỹ lương (Lương CB / Thưởng / Khấu trừ / Thực nhận)
- Bảng chi tiết phòng ban với tỷ lệ %
- Skeleton loading khi đang tải
- Error state với nút thử lại
- Nút "Làm mới" với animation spin

### Thay đổi frontend/src/App.js
- Thêm route `/` → Dashboard
- Đổi route nhân viên sang `/employees` (thay vì `/`)
- Thêm Placeholder cho 8 trang chưa xây dựng

---

## [2026-05-05] – Module Lương & Thưởng

### Backend – bổ sung 2 API mới vào router.py
| API | Method | Mô tả |
|-----|--------|-------|
| `/api/payroll/months` | GET | Danh sách tháng có dữ liệu lương (cho dropdown) |
| `/api/reports/dividend` | GET | Báo cáo cổ tức theo năm, gộp từ HUMAN_2025 |

### Tạo mới frontend/src/pages/Payroll.jsx
- Bảng lương theo tháng (dropdown chọn tháng từ API)
- 4 summary cards: Tổng NV, Tổng lương CB, Tổng thưởng, Tổng thực nhận
- Bảng đầy đủ: Mã NV, Họ tên, Phòng ban, Chức vụ, Lương CB, Thưởng, Khấu trừ, Thực nhận
- Màu sắc: thưởng xanh lá, khấu trừ đỏ, thực nhận badge màu theo mức lương
- Nút "Chi tiết" → điều hướng `/salary/:id/details`
- Nút "Điều chỉnh" → mở Modal inline
- Modal điều chỉnh lương: nhập BaseSalary/Bonus/Deductions, preview NetSalary realtime, gọi PUT API
- Footer tổng cộng cuối bảng
- Skeleton loading, search filter

### Tạo mới frontend/src/pages/SalaryDetail.jsx
- Lấy dữ liệu từ `GET /api/salary/:id/details` + `GET /api/salary/:id/history`
- Cột trái: Avatar, thông tin NV, chi tiết lương tháng, danh sách cổ tức
- Cột phải: Area chart biến động lương (recharts), bảng lịch sử lương
- Nút quay lại `/payroll`

### Tạo mới frontend/src/pages/DividendReport.jsx
- Lấy dữ liệu từ `GET /api/reports/dividend?year=`
- Dropdown chọn năm (5 năm gần nhất)
- 4 summary cards: Tổng cổ tức, Số NV, TB mỗi NV, Cao nhất
- Bảng danh sách NV nhận cổ tức với ranking
- Horizontal progress bar top 8 NV

### Cập nhật frontend/src/App.js
- Thêm route `/payroll` → Payroll
- Thêm route `/salary/:id/details` → SalaryDetail
- Thêm route `/reports/dividend` → DividendReport

### Cập nhật frontend/src/components/Header.jsx
- Thêm title cho `/payroll`, `/salary`, `/reports/dividend`

---

## [2026-05-07] – Trang Chấm công

### Tạo mới frontend/src/pages/Attendance.jsx
- Giao diện tương tự Payroll.jsx (theo cùng phong cách thiết kế)
- 4 summary cards: Tổng nhân viên, Tổng ngày công, Tổng ngày nghỉ, Tổng ngày vắng
- Dropdown chọn tháng (12 tháng gần nhất)
- Dropdown filter theo nhân viên
- Bảng đầy đủ: Mã NV, Họ tên, Tháng, Ngày công, Ngày vắng, Ngày nghỉ, Tỷ lệ, Ghi chú
- Badge tỷ lệ chấm công với màu sắc theo mức (≥90% xanh, ≥70% vàng, <70% đỏ)
- Footer tổng cộng cuối bảng
- Skeleton loading khi đang tải
- Lấy dữ liệu từ `GET /api/attendance`

### Cập nhật frontend/src/App.js
- Thêm import Attendance
- Thay thế Placeholder cho `/attendance` bằng Attendance component

---

## [2026-05-07] – Hoàn thiện Quản lý Nhân viên & Tổ chức

### Cập nhật frontend/src/pages/Employees.jsx
- Thiết kế lại hoàn toàn theo phong cách hiện đại (tương tự Dashboard, Payroll)
- 3 summary cards: Tổng nhân viên, Hoạt động, Ngừng hoạt động
- Tìm kiếm theo tên, email, phòng ban
- Bảng đầy đủ: Mã NV, Họ tên, Phòng ban, Chức vụ, Email, Trạng thái, Thao tác
- Badge trạng thái với icon UserCheck/UserX
- Nút Sửa/Xóa
- Skeleton loading khi đang tải

### Tạo mới frontend/src/pages/Organization.jsx
- Trang quản lý Phòng ban & Chức vụ
- 2 summary cards: Tổng phòng ban, Tổng chức vụ
- Tabs chuyển đổi giữa Phòng ban và Chức vụ
- Nút Đồng bộ (gọi API sync departments/positions)
- Nút Làm mới
- Hiển thị danh sách với icon Building/Briefcase
- Skeleton loading

### Cập nhật frontend/src/App.js
- Thêm import Organization
- Thay thế Placeholder cho `/departments` bằng Organization component

---

## [2026-05-08] – Hoàn thiện Quản lý Nhân viên

### Cập nhật frontend/src/pages/EmployeeEdit.jsx
- Thiết kế lại hoàn toàn với đầy đủ các trường
- Thông tin cơ bản: Họ tên, Giới tính, Ngày sinh, Ngày vào làm, SĐT, Email
- Thông tin công việc: Phòng ban, Chức vụ, Trạng thái
- Định dạng ngày tháng (convertDate)
- Loading state khi tải dữ liệu
- Nút quay lại, hủy, lưu thay đổi
- Gọi API PUT đầy đủ các trường

### Cập nhật backend/router.py
- Xóa ràng buộc kiểm tra Dividends trước khi xóa
- Thực hiện DELETE Dividends trước khi DELETE Employees
- Vẫn giữ 2-DB transaction để rollback nếu có lỗi

### Cập nhật frontend/src/pages/Employees.jsx
- Sửa lỗi hiển thị trạng thái: hỗ trợ giá trị tiếng Việt ("Đang làm việc", "Nghỉ phép", "Thử việc")
- Thêm icon tương ứng cho mỗi trạng thái: UserCheck, Coffee, BriefcaseBusiness, UserX
- Cải thiện hàm xóa: hiện tên nhân viên trong confirm, xử lý lỗi rõ ràng
- Cập nhật tính toán tổng nhân viên hoạt động/ngừng hoạt động
- Thêm thông báo lỗi đẹp (không dùng alert() nữa)
- Thêm thông báo thành công khi xóa thành công (tự ẩn sau 5 giây)

### Cập nhật frontend/src/pages/EmployeeEdit.jsx
- Thêm các option trạng thái tiếng Việt vào dropdown
- Hiển thị icon tương ứng với trạng thái đang chọn

### Cập nhật frontend/src/pages/EmployeeAdd.jsx
- Viết lại hoàn toàn theo phong cách hiện đại (tương tự EmployeeEdit)
- Đầy đủ các trường: Họ tên, Giới tính, Ngày sinh, Ngày vào làm, SĐT, Email, Phòng ban, Chức vụ, Trạng thái
- Loading state khi tải dữ liệu
- Thông báo thành công/lỗi đẹp (không dùng alert)
- Tự điều hướng về danh sách sau 2 giây khi thêm thành công
- Nút quay lại, hủy, lưu thay đổi

### Cập nhật backend/router.py
- Cập nhật API GET /api/departments: thêm trường EmployeeCount (đếm số nhân viên trong mỗi phòng)
- Thêm API POST /api/departments - thêm phòng ban
- Thêm API PUT /api/departments/<id> - sửa phòng ban
- Thêm API DELETE /api/departments/<id> - xóa phòng ban
- Thêm API POST /api/positions - thêm chức vụ
- Thêm API PUT /api/positions/<id> - sửa chức vụ
- Thêm API DELETE /api/positions/<id> - xóa chức vụ
- Tất cả API đều đồng bộ cả 2 databases (SQL Server + MySQL) với transaction rollback

### Cập nhật frontend/src/pages/Organization.jsx
- Viết lại hoàn chỉnh với đầy đủ chức năng CRUD
- Nút "Thêm" để thêm phòng ban/chức vụ mới
- Modal thêm/sửa với design hiện đại
- Nút Sửa/Xóa cho mỗi dòng trong bảng
- Thông báo thành công/lỗi đẹp (không dùng alert)
- Tự ẩn thông báo sau 5 giây
- Loading state cho modal khi lưu
- Đồng bộ vẫn hoạt động bình thường

---

## Việc cần làm tiếp theo

 - Cài recharts + lucide-react cho frontend
 - Tạo trang Dashboard với dữ liệu thật từ /api/reports/dashboard
 - Cập nhật Sidebar thêm link Dashboard, Payroll, Attendance
 - Tích hợp JWT Auth (AuthDB)
 - Trang Payroll (xem/sửa lương)
 - Trang Attendance (xem chấm công)
