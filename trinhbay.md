# Hướng dẫn Trình bày Báo cáo Dự án

> **Dự án:** API_KETNOI_2DB_2026-REACT  
> **Môn học:** Lab 3 — Data Integration API  
> **Công nghệ:** React · Python Flask · SQL Server · MySQL

---

## PHẦN 1 — Giới thiệu dự án

### 1.1 Tên và mục tiêu
- **Tên dự án:** Hệ thống Quản lý Nhân sự & Tiền lương (HR & Payroll System)
- **Mục tiêu:** Xây dựng ứng dụng web kết nối và tích hợp dữ liệu từ 3 database khác nhau (SQL Server HUMAN_2025, SQL Server AuthDB, MySQL) thông qua một REST API trung gian, hiển thị trên giao diện React với phân quyền theo vai trò.

### 1.2 Công nghệ sử dụng

| Tầng | Công nghệ |
|---|---|
| Giao diện (Frontend) | React.js, Bootstrap, Recharts |
| API trung gian (Backend) | Python Flask, Flask-CORS |
| Database 1 | Microsoft SQL Server — HUMAN_2025 (nhân sự) |
| Database 2 | MySQL — payroll_2026 (lương, chấm công) |
| Database 3 | Microsoft SQL Server — AuthDB (phân quyền RBAC) |
| Kết nối DB | pyodbc (SQL Server), mysql-connector-python (MySQL) |
| Xác thực | JWT Token (PyJWT) |

### 1.3 Sơ đồ kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────┐
│                   REACT FRONTEND                    │
│         (Trình duyệt — localhost:3000)              │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP Request + JWT Token
                       ▼
┌─────────────────────────────────────────────────────┐
│              PYTHON FLASK BACKEND                   │
│              (localhost:5000)                       │
│         router.py · auth.py · admin.py              │
└────────┬──────────────────┬──────────────┬──────────┘
         │                  │              │
         ▼                  ▼              ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│  SQL Server  │  │      MySQL       │  │  SQL Server  │
│  HUMAN_2025  │  │  payroll_2026    │  │   AuthDB     │
│              │  │                  │  │              │
│ • Employees  │  │ • salaries       │  │ • Users      │
│ • Departments│  │ • employees_pay  │  │ • Roles      │
│ • Positions  │  │ • attendance     │  │ • Permissions│
│ • Dividends  │  │ • leave_requests │  │ • Audit_Log  │
└──────────────┘  └──────────────────┘  └──────────────┘
```

---

## PHẦN 2 — Cơ sở dữ liệu

### 2.1 Database 1 — SQL Server (HUMAN_2025)
Lưu trữ thông tin **nhân sự gốc** của công ty.

| Bảng | Nội dung |
|---|---|
| `Employees` | Thông tin nhân viên: tên, ngày sinh, giới tính, email, SĐT, ngày vào làm, trạng thái |
| `Departments` | Danh sách phòng ban |
| `Positions` | Danh sách chức vụ |
| `Dividends` | Dữ liệu cổ tức của từng nhân viên |

### 2.2 Database 2 — MySQL (payroll_2026)
Lưu trữ dữ liệu **tính lương và chấm công**.

| Bảng | Nội dung |
|---|---|
| `salaries` | Lương cơ bản, thưởng, khấu trừ, thực nhận theo từng tháng |
| `employees_payroll` | Bản sao thông tin nhân viên được đồng bộ từ SQL Server |
| `departments_payroll` | Bản sao phòng ban được đồng bộ từ SQL Server |
| `positions_payroll` | Bản sao chức vụ được đồng bộ từ SQL Server |
| `attendance` | Ngày công, ngày nghỉ phép, vắng mặt, tăng ca theo tháng |
| `leave_requests` | Yêu cầu nghỉ phép của nhân viên |

### 2.3 Database 3 — SQL Server (AuthDB)
Lưu trữ dữ liệu **phân quyền RBAC và xác thực**.

| Bảng | Nội dung |
|---|---|
| `Users` | Tài khoản đăng nhập, mật khẩu hash, thông tin cá nhân |
| `Roles` | Vai trò: Admin, HR_Manager, Payroll_Manager, Employee |
| `Permissions` | Danh sách quyền hạn chi tiết |
| `Users_Roles` | Liên kết tài khoản với vai trò |
| `Role_Permissions` | Liên kết vai trò với quyền hạn |
| `Audit_Log` | Nhật ký mọi hành động trong hệ thống |

### 2.4 Lý do dùng 3 database riêng biệt
- **HUMAN_2025** là hệ thống nhân sự đã có sẵn của công ty.
- **payroll_2026** là hệ thống tính lương mới được xây dựng.
- **AuthDB** là hệ thống phân quyền độc lập, tách biệt khỏi dữ liệu nghiệp vụ.
- Ba hệ thống hoạt động độc lập nhưng được kết nối qua API — đây chính là bài toán tích hợp đa nguồn dữ liệu.

---

## PHẦN 3 — Backend API

### 3.1 Các nhóm endpoint chính

| Nhóm | Endpoint | Phương thức | Chức năng |
|---|---|---|---|
| Xác thực | `/api/auth/login` | POST | Đăng nhập, trả về JWT Token |
| Xác thực | `/api/auth/me` | GET | Lấy thông tin user hiện tại |
| Xác thực | `/api/auth/change-password` | PUT | Đổi mật khẩu |
| Xác thực | `/api/auth/profile` | PUT | Cập nhật thông tin cá nhân |
| Nhân viên | `/api/employees` | GET | Lấy danh sách nhân viên |
| Nhân viên | `/api/employees` | POST | Thêm nhân viên mới (đồng bộ 2 DB) |
| Nhân viên | `/api/employees/:id` | PUT | Cập nhật nhân viên (đồng bộ 2 DB) |
| Nhân viên | `/api/employees/:id` | DELETE | Xóa nhân viên (đồng bộ 2 DB) |
| Phòng ban | `/api/departments/stats` | GET | Phòng ban + thống kê |
| Chức vụ | `/api/positions/stats` | GET | Chức vụ + thống kê |
| Lương | `/api/payroll` | GET | Bảng lương theo tháng |
| Lương | `/api/salary/:id/details` | GET | Chi tiết lương + cổ tức |
| Lương | `/api/salary/:id/history` | GET | Lịch sử lương |
| Lương | `/api/salary/:id` | PUT | Điều chỉnh lương |
| Chấm công | `/api/attendance/detail` | GET | Chấm công theo tháng |
| Chấm công | `/api/attendance/:id` | PUT | Cập nhật chấm công |
| Nghỉ phép | `/api/leave-requests` | GET/POST | Danh sách / Tạo yêu cầu |
| Nghỉ phép | `/api/leave-requests/:id` | PUT | Duyệt / Từ chối |
| Báo cáo | `/api/reports/dashboard` | GET | Dữ liệu tổng quan |
| Báo cáo | `/api/reports/dividend` | GET | Báo cáo cổ tức |
| Quản trị | `/api/admin/users` | GET/POST | Quản lý tài khoản |
| Quản trị | `/api/admin/roles` | GET | Danh sách vai trò |
| Quản trị | `/api/admin/audit-log` | GET | Nhật ký hệ thống |

### 3.2 Cơ chế đồng bộ 2 database (điểm quan trọng nhất)

Khi **thêm nhân viên mới**, hệ thống thực hiện đồng thời:

```
Bước 1: INSERT vào SQL Server (Employees)
         → Lấy EmployeeID mới được tạo tự động
Bước 2: INSERT vào MySQL (employees_payroll)
         → Dùng EmployeeID vừa lấy được
Bước 3: Nếu cả 2 thành công → COMMIT cả 2
         Nếu 1 trong 2 lỗi  → ROLLBACK cả 2
```

Tương tự khi **sửa** hoặc **xóa** nhân viên — cả 2 database đều được cập nhật trong cùng 1 transaction.

### 3.3 Kết hợp dữ liệu từ 2 DB trong 1 màn hình

Ví dụ trang **Chức vụ** — backend thực hiện 2 truy vấn riêng rồi ghép lại:

```python
# Truy vấn 1: Lấy tên chức vụ + số nhân viên từ SQL Server
SELECT p.PositionID, p.PositionName, COUNT(e.EmployeeID)
FROM Positions p LEFT JOIN Employees e ...

# Truy vấn 2: Lấy lương trung bình từ MySQL
SELECT ep.PositionID, AVG(s.NetSalary)
FROM salaries s JOIN employees_payroll ep ...

# Ghép 2 kết quả lại trước khi trả về cho Frontend
```

### 3.4 Hệ thống xác thực JWT

```
Đăng nhập → Backend kiểm tra AuthDB → Tạo JWT Token
                                        (chứa role + permissions)
                                              ↓
Frontend lưu token vào localStorage
                                              ↓
Mỗi request gửi kèm: Authorization: Bearer <token>
                                              ↓
Backend giải mã token → Kiểm tra quyền → Xử lý hoặc từ chối (403)
```

---

## PHẦN 4 — Phân quyền RBAC

### 4.1 Ma trận phân quyền

| Vai trò | Chức năng được phép |
|---|---|
| **Admin** | Toàn quyền — tất cả trang + quản trị hệ thống |
| **HR_Manager** | Nhân viên, Phòng ban, Chấm công, Báo cáo, Cảnh báo |
| **Payroll_Manager** | Bảng lương, Tính lương, Báo cáo |
| **Employee** | Dashboard, Lương của tôi, Chấm công của tôi, Hồ sơ |

### 4.2 Cách hoạt động trên Frontend

- **`ProtectedRoute`** — chặn người chưa đăng nhập, redirect về `/login`
- **`RoleRoute`** — kiểm tra role trước khi render trang, hiện trang 403 nếu không đủ quyền
- **`Sidebar`** — tự động lọc menu theo role, Employee chỉ thấy 4 mục

### 4.3 Liên kết tài khoản ↔ nhân viên

Tài khoản trong `AuthDB.Users` được liên kết với nhân viên trong `HUMAN_2025.Employees` thông qua **email**. Khi đăng nhập, backend tự động tìm `EmployeeID` tương ứng và trả về trong JWT — cho phép Employee xem đúng dữ liệu của chính mình.

---

## PHẦN 5 — Demo từng trang (Frontend)

### 5.1 Dashboard — Tổng quan hệ thống
- **Hiển thị:** Tổng nhân viên, quỹ lương tháng, lương trung bình, tổng cổ tức
- **Nguồn:** Nhân viên từ SQL Server · Lương từ MySQL · Cổ tức từ SQL Server
- **Biểu đồ:** Pie chart cơ cấu nhân sự · Radar chart năng lực phòng ban · Bảng chi tiết phòng ban

### 5.2 Nhân viên *(HR_Manager, Admin)*
- **Hiển thị:** Danh sách đầy đủ với tìm kiếm, lọc theo phòng ban và trạng thái
- **Nguồn:** SQL Server — bảng `Employees`, `Departments`, `Positions`
- **Chức năng:** Xem dạng bảng / dạng thẻ · Thêm · Sửa · Xóa

### 5.3 Thêm / Sửa nhân viên *(HR_Manager, Admin)*
- **Điểm nhấn:** Khi nhấn Lưu → dữ liệu được ghi **đồng thời vào cả 2 database**
- Nếu lỗi ở bất kỳ DB nào → rollback toàn bộ, không bị mất đồng bộ

### 5.4 Phòng ban & Chức vụ *(HR_Manager, Admin)*
- **Nguồn kết hợp:** Tên + số NV từ SQL Server · Lương TB từ MySQL
- **Chức năng:** Đồng bộ dữ liệu từ SQL Server sang MySQL

### 5.5 Bảng lương *(Payroll_Manager, Admin)*
- **Nguồn:** MySQL — bảng `salaries`, `employees_payroll`
- **Chức năng:** Lọc theo tháng · Điều chỉnh lương · Xem chi tiết · Phát hiện NV chưa có lương

### 5.6 Tính lương tự động *(Payroll_Manager, Admin)*
- Tính lương theo ngày công thực tế, tăng ca (hệ số 1.5x)
- Bảo hiểm: BHXH 8%, BHYT 1.5%, BHTN 1%
- Thuế TNCN lũy tiến **7 bậc** (5% → 35%)
- Giảm trừ bản thân 11 triệu, người phụ thuộc 4.4 triệu/người

### 5.7 Chi tiết lương *(Payroll_Manager, Admin)*
- **Nguồn kết hợp:** Lương từ MySQL · Cổ tức từ SQL Server
- Biểu đồ biến động lương theo thời gian

### 5.8 Chấm công & Nghỉ phép *(HR_Manager, Admin)*
- **Tab Chấm công:** Ngày làm, nghỉ phép, vắng mặt, tăng ca — từ MySQL
- **Tab Nghỉ phép:** Tạo, duyệt, từ chối yêu cầu — từ MySQL

### 5.9 Báo cáo *(HR_Manager, Payroll_Manager, Admin)*
- **Tab Nhân sự:** Biểu đồ + bảng phòng ban · Xuất CSV
- **Tab Tiền lương:** Biểu đồ lương CB vs Thực nhận · Xuất CSV
- **Tab Cổ tức:** Thống kê theo năm · Top nhân viên · Xuất CSV

### 5.10 Lương của tôi *(Employee)*
- Tự động lấy dữ liệu lương của chính mình theo `EmployeeID`
- Hiển thị lương tháng hiện tại, cổ tức, biểu đồ biến động, lịch sử lương
- **Không thể xem lương của người khác**

### 5.11 Chấm công của tôi *(Employee)*
- Xem ngày công, nghỉ phép, vắng mặt, tăng ca của chính mình
- Tạo yêu cầu nghỉ phép trực tiếp
- Xem lịch sử các yêu cầu đã tạo và trạng thái duyệt

### 5.12 Hồ sơ cá nhân *(Tất cả)*
- Lấy thông tin thật từ `AuthDB.Users` qua `GET /api/auth/me`
- Chỉnh sửa tên, email, SĐT → ghi vào database thật
- Đổi mật khẩu → xác minh mật khẩu cũ, hash mật khẩu mới, ghi audit log

### 5.13 Quản trị hệ thống *(Admin)*
- Quản lý tài khoản người dùng (thêm, sửa, xóa, gán role)
- Xem nhật ký `Audit_Log` — ghi lại mọi hành động

---

## PHẦN 6 — Tính năng nổi bật

### 6.1 Đồng bộ 2 database tự động
Mọi thao tác thêm/sửa/xóa nhân viên đều cập nhật **cả SQL Server lẫn MySQL** trong cùng một lần gọi API với transaction an toàn — rollback đồng thời nếu có lỗi.

### 6.2 Phân quyền RBAC hoàn chỉnh
4 vai trò với quyền hạn khác nhau, kiểm soát cả **route** (backend từ chối 403) lẫn **giao diện** (sidebar lọc menu, trang hiện 403 nếu truy cập trực tiếp).

### 6.3 Kết hợp dữ liệu từ nhiều nguồn
Nhiều màn hình ghép dữ liệu từ cả 3 database trong một lần tải trang — minh chứng cho khả năng tích hợp đa nguồn.

### 6.4 Tính lương tự động theo quy định
Công thức tính lương đầy đủ: ngày công thực tế, tăng ca, bảo hiểm, thuế TNCN lũy tiến 7 bậc.

### 6.5 Xuất báo cáo CSV
Hỗ trợ xuất 3 loại báo cáo: nhân sự, tiền lương, cổ tức.

---

## PHẦN 7 — Kết luận

### 7.1 Những gì đã làm được
- Kết nối và tích hợp thành công 3 database (SQL Server HUMAN_2025, MySQL payroll_2026, SQL Server AuthDB)
- Xây dựng REST API đầy đủ CRUD với đồng bộ dữ liệu 2 chiều và transaction an toàn
- Hệ thống phân quyền RBAC hoàn chỉnh với JWT Token — 4 vai trò, kiểm soát cả backend lẫn frontend
- Trang Hồ sơ cá nhân kết nối database thật, đổi mật khẩu ghi audit log
- Employee xem được lương và chấm công của chính mình, không thể xem người khác
- Tính lương tự động với công thức đầy đủ theo quy định Việt Nam
- Giao diện React hiển thị dữ liệu thực, có biểu đồ trực quan, xuất CSV

### 7.2 Hạn chế hiện tại
- Biểu đồ **Radar "Đánh giá năng lực phòng ban"** trên Dashboard dùng dữ liệu mô phỏng (chưa có dữ liệu thực)
- Trang **Cảnh báo** dùng dữ liệu mock — chưa kết nối database thật
- Kết quả tính lương tự động **cần xác nhận thủ công** trước khi lưu vào database
- Liên kết tài khoản ↔ nhân viên dựa trên **email phải khớp** giữa AuthDB và HUMAN_2025

### 7.3 Hướng phát triển tiếp theo
- Lưu kết quả tính lương tự động trực tiếp vào database sau khi xác nhận
- Kết nối trang Cảnh báo với dữ liệu thực (hợp đồng sắp hết hạn, NV chưa chấm công...)
- Thêm cột `EmployeeID` vào `AuthDB.Users` để liên kết chắc chắn hơn
- Triển khai lên server thật với ngrok hoặc cloud hosting

---

## Lưu ý khi demo trực tiếp

1. **Khởi động backend trước:**
   ```bash
   cd backend
   python app.py
   ```

2. **Sau đó khởi động frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Các tài khoản demo:**

   | Tài khoản | Mật khẩu | Vai trò | Thấy gì |
   |---|---|---|---|
   | `admin` | `Admin@123` | Admin | Toàn bộ hệ thống |
   | `hr_manager` | *(mật khẩu DB)* | HR_Manager | Nhân viên, Phòng ban, Chấm công, Báo cáo |
   | `payroll_manager` | *(mật khẩu DB)* | Payroll_Manager | Lương, Tính lương, Báo cáo |
   | `employee` | *(mật khẩu DB)* | Employee | Dashboard, Lương của tôi, Chấm công của tôi, Hồ sơ |

4. **Demo điểm nổi bật — đồng bộ 2 DB:**
   - Thêm 1 nhân viên mới → vào Bảng lương kiểm tra nhân viên đó đã xuất hiện trong MySQL

5. **Demo phân quyền:**
   - Đăng nhập `employee` → chỉ thấy 4 mục trong sidebar
   - Thử truy cập `/employees` trực tiếp → hiện trang 403

6. **Demo báo cáo:**
   - Vào trang Báo cáo → xuất CSV → mở file để thấy dữ liệu thực

---

*Tài liệu trình bày được tạo từ phân tích mã nguồn dự án API_KETNOI_2DB_2026-REACT*
Giảm trừ bản thân — 11 triệu/tháng
Mỗi người đi làm được tự động trừ 11 triệu khỏi thu nhập trước khi tính thuế, bất kể ai.

Ý nghĩa: Nhà nước thừa nhận mỗi người cần ít nhất 11 triệu/tháng để sống — phần đó không đánh thuế.

Giảm trừ người phụ thuộc — 4.4 triệu/người/tháng
Nếu bạn đang nuôi người khác (con nhỏ, bố mẹ già không có thu nhập...) thì được trừ thêm 4.4 triệu cho mỗi người phụ thuộc đó.

Ví dụ cụ thể
Nhân viên lương 20 triệu/tháng, có 1 con nhỏ (1 người phụ thuộc):

Thu nhập gộp:              20,000,000 đ
- Bảo hiểm (9.5%):        - 1,900,000 đ
- Giảm trừ bản thân:      - 11,000,000 đ
- Giảm trừ người phụ thuộc: - 4,400,000 đ
─────────────────────────────────────────
Thu nhập chịu thuế:         2,700,000 đ
Thuế TNCN (5%):               135,000 đ
Nếu không có con, thu nhập chịu thuế sẽ là 7,100,000 đ → thuế cao hơn.

Tóm lại: càng nhiều người phụ thuộc → thu nhập chịu thuế càng thấp → đóng thuế càng ít. Đây là chính sách của nhà nước để hỗ trợ người có gánh nặng gia đình.
