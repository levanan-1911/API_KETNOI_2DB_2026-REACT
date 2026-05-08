# Database Design – HR & Payroll System

## Tổng quan kiến trúc

```
HUMAN_2025 (SQL Server)          payroll_2026 (MySQL)
─────────────────────            ─────────────────────
Departments          ──sync──►   departments_payroll
Positions            ──sync──►   positions_payroll
Employees            ──sync──►   employees_payroll
Dividends                        salaries
Users                            attendance
SYNC_LOG                         leave_requests
AUDIT_LOG                        sync_log
```

---

## SQL Server – HUMAN_2025 (Master Data)

| Bảng | Mô tả |
|------|-------|
| `Departments` | Danh mục phòng ban |
| `Positions` | Danh mục chức vụ |
| `Employees` | Hồ sơ nhân viên (bảng chính) |
| `Dividends` | Cổ tức nhân viên theo năm |
| `Users` | Tài khoản đăng nhập (JWT Auth) |
| `SYNC_LOG` | Log đồng bộ 2 DB |
| `AUDIT_LOG` | Nhật ký hoạt động người dùng |

---

## MySQL – payroll_2026

| Bảng | Mô tả |
|------|-------|
| `departments_payroll` | Đồng bộ từ HUMAN (DepartmentID phải khớp) |
| `positions_payroll` | Đồng bộ từ HUMAN (PositionID phải khớp) |
| `employees_payroll` | Đồng bộ từ HUMAN (EmployeeID phải khớp) |
| `salaries` | Bảng lương hàng tháng (BaseSalary, Bonus, Deductions, NetSalary) |
| `attendance` | Chấm công hàng tháng (WorkDays, LeaveDays, AbsentDays) |
| `leave_requests` | Yêu cầu nghỉ phép (Pending/Approved/Rejected) |
| `sync_log` | Log đồng bộ phía MySQL |

---

## Quy tắc đồng bộ (Sync Rules)

### Thêm nhân viên (POST /api/employees)
1. INSERT vào `Employees` (SQL Server) → lấy `EmployeeID` mới
2. INSERT vào `employees_payroll` (MySQL) với cùng `EmployeeID`
3. Nếu MySQL lỗi → **rollback** SQL Server + ghi `SYNC_LOG`

### Cập nhật nhân viên (PUT /api/employees/{id})
1. UPDATE `Employees` (SQL Server)
2. UPDATE `employees_payroll` (MySQL)
3. Nếu một bên lỗi → **rollback** cả 2 + ghi `SYNC_LOG`

### Xóa nhân viên (DELETE /api/employees/{id})
1. Kiểm tra `Dividends` (SQL Server) → nếu có → **từ chối xóa**
2. Kiểm tra `salaries` (MySQL) → nếu có → **từ chối xóa**
3. DELETE `Employees` (SQL Server)
4. DELETE `employees_payroll`, `attendance`, `salaries` (MySQL)

### Đồng bộ Phòng ban / Chức vụ
- POST `/api/departments/sync` → sync `Departments` → `departments_payroll`
- POST `/api/positions/sync` → sync `Positions` → `positions_payroll`

---

## Cách chạy script

```bash
# SQL Server
sqlcmd -S localhost -U sa -i database/HUMAN_2025_SQLServer.sql

# MySQL
mysql -u root -p < database/PAYROLL_2026_MySQL.sql
```
