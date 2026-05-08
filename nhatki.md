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

---

## [2026-05-07] – Tạo trang Cảnh báo & Thông báo (Alerts.jsx)

### Tài liệu tham khảo thiết kế
- Dựa theo `cb.md` – Chi tiết Giao diện & Thiết kế trang Alerts

### Ý tưởng thiết kế
- **Layout:** Card-based list, `flex column`, khoảng cách `gap: 24px` nhất quán với các trang khác
- **Header khu vực:** Tiêu đề + subtitle bên trái, nút "Đánh dấu tất cả đã đọc" bên phải (chỉ hiện khi còn thông báo chưa đọc)
- **Filter tabs:** 3 tab (Tất cả / Chưa đọc / Đã đọc) kèm badge số lượng, tab active dùng màu primary `#2563eb`
- **Alert Card:** Dùng lại class `stat-card` của dự án, bố cục `flex items-start gap-16`
  - Icon severity: hình vuông 40×40 bo góc 10px, màu nền nhạt theo severity
  - Viền dọc trái `border-left: 4px solid #3b82f6` cho thông báo **chưa đọc** (scan nhanh)
  - Chấm tròn `8×8` màu `#3b82f6` cạnh tiêu đề nếu chưa đọc
  - Badge severity nhỏ (Thông tin / Cảnh báo / Nghiêm trọng) với màu tương ứng
  - Nút ghost "Đã đọc" (icon Check) chỉ hiện khi chưa đọc
- **Severity UX:**
  | Mức độ | Icon | Màu icon | Màu nền icon |
  |--------|------|----------|--------------|
  | Thông tin | `Info` | `#3b82f6` | `rgba(59,130,246,0.10)` |
  | Cảnh báo | `AlertTriangle` | `#f59e0b` | `rgba(245,158,11,0.10)` |
  | Nghiêm trọng | `AlertCircle` | `#ef4444` | `rgba(239,68,68,0.10)` |
- **Empty state:** Icon Bell xám + text "Không có cảnh báo nào" căn giữa, padding `48px`
- **Dữ liệu:** 7 thông báo mẫu (3 chưa đọc, 4 đã đọc) – sẵn sàng thay bằng API

### File đã tạo / thay đổi
| File | Thay đổi |
|------|---------|
| `frontend/src/pages/Alerts.jsx` | **Tạo mới** – trang Cảnh báo & Thông báo hoàn chỉnh |
| `frontend/src/App.js` | Import `Alerts`, thay route `/alerts` từ Placeholder → `<Alerts />` |
| `frontend/src/components/Header.jsx` | Cập nhật title `/alerts` → "Cảnh báo & Thông báo" + subtitle mô tả |

### Tính năng đã triển khai
- [x] Hiển thị danh sách thông báo với 3 mức độ nghiêm trọng
- [x] Bộ lọc 3 tab: Tất cả / Chưa đọc / Đã đọc (kèm số lượng)
- [x] Đánh dấu từng thông báo đã đọc (nút ghost bên phải card)
- [x] Đánh dấu tất cả đã đọc (nút outline ở header)
- [x] Viền dọc trái nổi bật cho thông báo chưa đọc
- [x] Chấm tròn xanh cạnh tiêu đề khi chưa đọc
- [x] Empty state khi không có thông báo thỏa bộ lọc
- [x] Hover effect trên card và các nút
- [x] Responsive (flexWrap cho header và filter tabs)

### Việc cần làm tiếp (Alerts)
- [x] Kết nối API backend thực (`GET /api/alerts`, `PUT /api/alerts/:id/read`)
- [x] Thêm tính năng xóa thông báo
- [x] Phân trang hoặc infinite scroll khi có nhiều thông báo
- [x] Kết nối notification bell ở Header với số lượng chưa đọc thực tế

---

## [2026-05-08] – Kết nối notification bell với số lượng chưa đọc thực tế

### Kiến trúc
Dùng **React Context** (`AlertsContext`) để chia sẻ `unreadCount` toàn app — tránh prop drilling qua Layout.

### File tạo mới: `frontend/src/context/AlertsContext.js`
- `AlertsProvider` – bọc toàn app, quản lý `unreadCount`
- `refreshUnread()` – gọi `GET /api/alerts?filter=unread` lấy số chưa đọc
- **Auto-poll mỗi 60 giây** – tự động cập nhật badge mà không cần user thao tác
- `useAlerts()` – hook tiện dụng để dùng trong bất kỳ component nào

### Cập nhật `frontend/src/App.js`
- Import `AlertsProvider`
- Bọc `<Layout>` trong `<AlertsProvider>` để toàn bộ cây component có thể dùng context

### Cập nhật `frontend/src/components/Header.jsx`
**Bell button:**
- Dùng `useAlerts()` lấy `unreadCount` từ context
- **Badge số** hiển thị trên bell:
  - Hiện khi `unreadCount > 0`
  - Hiển thị số thực tế, tối đa "99+"
  - Màu đỏ `#ef4444`, border trắng 2px
  - Kích thước tự động: 16px (1 chữ số) / 18px (2+ chữ số)
- Click bell → toggle **dropdown mini**

**Dropdown mini (mới):**
- Header: "Thông báo" + badge "X chưa đọc" màu đỏ nhạt
- Nội dung: thông báo số lượng chưa đọc (hoặc empty state nếu = 0)
- Footer: nút "Xem tất cả thông báo →" → navigate `/alerts`
- Tự đóng khi: click ra ngoài (`mousedown` listener) hoặc chuyển trang

### Cập nhật `frontend/src/pages/Alerts.jsx`
- Import `useAlerts` từ context
- Gọi `refreshUnread()` sau mỗi thao tác:
  - `markRead(id)` → refresh sau khi PUT thành công
  - `markAllRead()` → refresh sau khi PUT thành công
  - `deleteAlert(id)` → refresh sau khi DELETE thành công
  - `clearReadAlerts()` → refresh sau khi DELETE thành công

### Luồng dữ liệu
```
AlertsProvider (App.js)
  ├── Header.jsx  → useAlerts() → hiển thị badge + dropdown
  └── Alerts.jsx  → useAlerts() → gọi refreshUnread() sau thao tác
```

### File đã thay đổi
| File | Thay đổi |
|------|---------|
| `frontend/src/context/AlertsContext.js` | **Tạo mới** – Context, Provider, hook `useAlerts` |
| `frontend/src/App.js` | Bọc app trong `<AlertsProvider>` |
| `frontend/src/components/Header.jsx` | Badge số trên bell, dropdown mini, navigate to /alerts |
| `frontend/src/pages/Alerts.jsx` | Gọi `refreshUnread()` sau mỗi thao tác đọc/xóa |

---

## [2026-05-08] – Thêm phân trang cho trang Alerts

### Chiến lược
- Dùng **phân trang client-side** (load 1 lần, phân trang trên frontend)
- `PAGE_SIZE = 5` thông báo mỗi trang
- Reset về trang 1 khi đổi filter hoặc load lại dữ liệu

### Frontend – cập nhật Alerts.jsx

**Import thêm:** `useRef`, `ChevronLeft`, `ChevronRight`, `ChevronsLeft`, `ChevronsRight`

**State mới:**
- `currentPage` – trang hiện tại (mặc định 1)
- `listTopRef` – ref để scroll về đầu danh sách khi đổi trang

**Logic phân trang:**
- `filtered` → lọc theo tab (all/unread/read)
- `totalPages = Math.ceil(filtered.length / PAGE_SIZE)`
- `paginated = filtered.slice(pageStart, pageStart + PAGE_SIZE)` – chỉ render trang hiện tại
- `goToPage(p)` – đổi trang + `scrollIntoView` về đầu danh sách

**Component mới `<Pagination />`:**
| Phần | Mô tả |
|------|-------|
| Thông tin | "Hiển thị 1–5 trong 12 thông báo" |
| Nút trang đầu | `ChevronsLeft` – về trang 1 |
| Nút trang trước | `ChevronLeft` |
| Số trang | Tối đa 7 nút, có dấu `…` khi nhiều trang |
| Nút trang sau | `ChevronRight` |
| Nút trang cuối | `ChevronsRight` |
| Active state | Nền xanh `#2563eb` cho trang hiện tại |
| Disabled state | Opacity 0.4 khi ở trang đầu/cuối |

**Thuật toán hiển thị số trang (`getPageNumbers`):**
- ≤ 7 trang: hiện tất cả
- Gần đầu (page ≤ 4): `1 2 3 4 5 … N`
- Gần cuối (page ≥ N-3): `1 … N-4 N-3 N-2 N-1 N`
- Ở giữa: `1 … p-1 p p+1 … N`

**Hành vi UX:**
- Đổi filter → reset về trang 1
- Load lại dữ liệu → reset về trang 1
- Xóa thông báo cuối trang → tự điều chỉnh `safePage = Math.min(currentPage, totalPages)`
- Phân trang chỉ hiện khi `filtered.length > PAGE_SIZE`

### File đã thay đổi
| File | Thay đổi |
|------|---------|
| `frontend/src/pages/Alerts.jsx` | Thêm phân trang client-side, component `<Pagination />`, logic `goToPage`, scroll to top |

---

## [2026-05-08] – Thêm tính năng xóa thông báo (Alerts)

### Backend – thêm 2 API mới vào router.py
| API | Method | Mô tả |
|-----|--------|-------|
| `/api/alerts/:id` | DELETE | Xóa 1 thông báo theo AlertID |
| `/api/alerts/clear-read` | DELETE | Xóa tất cả thông báo đã đọc (IsRead=1) |

### Frontend – cập nhật Alerts.jsx
**State mới:**
- `clearingRead` – loading state khi đang xóa tất cả đã đọc
- `confirmDialog` – `{ type: "one"|"read-all", id?: number } | null` – quản lý confirm dialog

**Hàm mới:**
- `deleteAlert(id)` – optimistic update (xóa khỏi UI ngay) + gọi `DELETE /api/alerts/:id`, rollback bằng `loadAlerts()` nếu lỗi
- `clearReadAlerts()` – gọi `DELETE /api/alerts/clear-read`, lọc bỏ các alert đã đọc khỏi state
- `handleConfirm()` – xử lý khi user xác nhận trong dialog

**UI mới:**
- **Confirm Dialog** (modal overlay): hiện khi xóa 1 hoặc xóa tất cả đã đọc
  - Icon Trash2 màu đỏ, nội dung mô tả hành động
  - Nút "Hủy" (xám) + nút "Xóa" (đỏ)
  - Nút X đóng dialog
- **Nút "Xóa đã đọc"** ở header (chỉ hiện khi có thông báo đã đọc)
  - Màu đỏ nhạt `#fef2f2`, border `#fecaca`
  - Hover: đậm hơn `#fee2e2`
  - Disable khi đang xóa
- **Nút xóa (Trash2)** trên mỗi AlertCard
  - Icon 32×32, màu xám nhạt mặc định
  - Hover: nền đỏ nhạt `#fef2f2`, icon đỏ `#ef4444`
  - Nằm cùng nhóm với nút "Đã đọc"

**Import thêm:** `Trash2`, `X` từ `lucide-react`

### File đã thay đổi
| File | Thay đổi |
|------|---------|
| `frontend/src/pages/Alerts.jsx` | Thêm xóa 1 alert, xóa tất cả đã đọc, confirm dialog, nút Trash2 trên card |
| `backend/router.py` | Thêm `DELETE /api/alerts/:id` và `DELETE /api/alerts/clear-read` |

---

## [2026-05-08] – Kết nối API thật cho trang Alerts

### Thay đổi frontend/src/pages/Alerts.jsx
- **Xóa** toàn bộ dữ liệu mẫu `INITIAL_ALERTS` (hardcode)
- **Thêm** `useEffect` + `useCallback` để gọi `GET /api/alerts` khi mount
- **Thêm** hàm `loadAlerts()` – fetch dữ liệu, map field backend → UI:
  - `AlertID` → `id`
  - `Severity` → `severity`
  - `Title` → `title`
  - `Description` → `description`
  - `IsRead` → `read`
  - `CreatedAt` → tính `time` qua helper `timeAgo()`
- **Thêm** helper `timeAgo(dateStr)` – chuyển timestamp → "5 phút trước", "Hôm qua"...
- **Thêm** skeleton loading (4 placeholder cards khi đang tải)
- **Thêm** error state với nút "Thử lại"
- **Cập nhật** `markRead(id)`:
  - Optimistic update (cập nhật UI ngay lập tức)
  - Gọi `PUT /api/alerts/:id/read`
  - Rollback nếu API lỗi
- **Cập nhật** `markAllRead()`:
  - Gọi `PUT /api/alerts/read-all`
  - State `markingAll` để disable nút khi đang xử lý
- **Thêm** nút "Làm mới" (RefreshCw icon) với animation spin

### Thay đổi backend/router.py (đã thêm trước đó)
| API | Method | Mô tả |
|-----|--------|-------|
| `/api/alerts` | GET | Lấy danh sách alerts, filter `?filter=all\|unread\|read` |
| `/api/alerts/:id/read` | PUT | Đánh dấu 1 alert đã đọc |
| `/api/alerts/read-all` | PUT | Đánh dấu tất cả alerts đã đọc |

### Thay đổi database/PAYROLL_2026_MySQL.sql (đã thêm trước đó)
- Thêm bảng `alerts` với các cột: `AlertID`, `Severity`, `Title`, `Description`, `IsRead`, `CreatedAt`, `UpdatedAt`
- Thêm 7 bản ghi mẫu (3 chưa đọc, 4 đã đọc)

### File đã thay đổi
| File | Thay đổi |
|------|---------|
| `frontend/src/pages/Alerts.jsx` | Kết nối API thật, thêm loading/error state, optimistic update |
| `backend/router.py` | Thêm 3 API: GET /alerts, PUT /alerts/:id/read, PUT /alerts/read-all |
| `database/PAYROLL_2026_MySQL.sql` | Thêm bảng `alerts` + dữ liệu mẫu |

---

## Việc cần làm tiếp theo


- [x] Cài `recharts` + `lucide-react` cho frontend

---

## [2026-05-08] – Kiểm tra thư viện recharts + lucide-react

### Kết quả kiểm tra
Cả hai thư viện **đã được cài sẵn** trong `node_modules`, không cần cài thêm.

| Thư viện | Version trong package.json | Version thực tế (node_modules) | Trạng thái |
|----------|---------------------------|-------------------------------|------------|
| `lucide-react` | `^1.14.0` | `1.14.0` | ✅ Đã cài |
| `recharts` | `^3.8.1` | `3.8.1` | ✅ Đã cài |

### Sử dụng trong dự án
- **`lucide-react`**: dùng trong Sidebar, Header, Dashboard, Alerts, Payroll, SalaryDetail, DividendReport, Profile
- **`recharts`**: dùng trong Dashboard (PieChart, RadarChart), SalaryDetail (AreaChart)

### Không cần thay đổi file nào
Thư viện đã có sẵn, chỉ cần chạy `npm install` nếu clone repo mới về máy khác.
- [ ] Tạo trang Dashboard với dữ liệu thật từ `/api/reports/dashboard`
- [ ] Cập nhật Sidebar thêm link Dashboard, Payroll, Attendance
- [ ] Tích hợp JWT Auth (AuthDB)
- [ ] Trang Payroll (xem/sửa lương)
- [ ] Trang Attendance (xem chấm công)
