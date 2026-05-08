-- ============================================================
-- DATABASE: payroll_2026 (MySQL)
-- Hệ thống quản lý lương và chấm công
-- ============================================================

DROP DATABASE IF EXISTS payroll_2026;
CREATE DATABASE payroll_2026
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE payroll_2026;

-- ============================================================
-- 1. BẢNG DEPARTMENTS_PAYROLL – Đồng bộ phòng ban từ HUMAN
-- Theo API-16: /departments/sync
-- ============================================================
CREATE TABLE departments_payroll (
    DepartmentID    INT             NOT NULL PRIMARY KEY,  -- Khớp với HUMAN_2025
    DepartmentName  VARCHAR(100)    NOT NULL,
    SyncedAt        DATETIME        DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. BẢNG POSITIONS_PAYROLL – Đồng bộ chức vụ từ HUMAN
-- Theo API-18: /positions/sync
-- ============================================================
CREATE TABLE positions_payroll (
    PositionID      INT             NOT NULL PRIMARY KEY,  -- Khớp với HUMAN_2025
    PositionName    VARCHAR(100)    NOT NULL,
    SyncedAt        DATETIME        DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. BẢNG EMPLOYEES_PAYROLL – Đồng bộ nhân viên từ HUMAN
-- Được tạo tự động khi thêm nhân viên mới (POST /add-employee)
-- ============================================================
CREATE TABLE employees_payroll (
    EmployeeID      INT             NOT NULL PRIMARY KEY,  -- Khớp với HUMAN_2025
    FullName        VARCHAR(100)    NOT NULL,
    DepartmentID    INT             NULL,
    PositionID      INT             NULL,
    Status          VARCHAR(20)     DEFAULT 'Active',
    SyncedAt        DATETIME        DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT FK_EmpPayroll_Dept FOREIGN KEY (DepartmentID)
        REFERENCES departments_payroll(DepartmentID),
    CONSTRAINT FK_EmpPayroll_Pos  FOREIGN KEY (PositionID)
        REFERENCES positions_payroll(PositionID)
);

-- ============================================================
-- 4. BẢNG SALARIES – Bảng lương hàng tháng
-- Theo API-08: GET /payroll, API-09: GET /salary/{id}/details
-- ============================================================
CREATE TABLE salaries (
    SalaryID        INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    EmployeeID      INT             NOT NULL,
    SalaryMonth     INT             NOT NULL,   -- Tháng: 1-12
    SalaryYear      INT             NOT NULL,   -- Năm: 2024, 2025, ...
    BaseSalary      DECIMAL(18,2)   NOT NULL DEFAULT 0,
    Bonus           DECIMAL(18,2)   DEFAULT 0,
    Deductions      DECIMAL(18,2)   DEFAULT 0,
    NetSalary       DECIMAL(18,2)   GENERATED ALWAYS AS (BaseSalary + Bonus - Deductions) STORED,
    Note            VARCHAR(255)    NULL,
    CreatedAt       DATETIME        DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT FK_Salary_Emp FOREIGN KEY (EmployeeID)
        REFERENCES employees_payroll(EmployeeID),
    CONSTRAINT UQ_Salary_EmpMonth UNIQUE (EmployeeID, SalaryMonth, SalaryYear)
);

-- ============================================================
-- 5. BẢNG ATTENDANCE – Chấm công hàng tháng
-- Theo API-12: GET /attendance
-- ============================================================
CREATE TABLE attendance (
    AttendanceID    INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    EmployeeID      INT             NOT NULL,
    AttendanceMonth INT             NOT NULL,   -- Tháng: 1-12
    AttendanceYear  INT             NOT NULL,   -- Năm
    WorkDays        INT             DEFAULT 0,  -- Số ngày làm việc thực tế
    LeaveDays       INT             DEFAULT 0,  -- Số ngày nghỉ phép đã duyệt
    AbsentDays      INT             DEFAULT 0,  -- Số ngày vắng không phép
    OvertimeHours   DECIMAL(5,2)    DEFAULT 0,  -- Giờ làm thêm
    Note            VARCHAR(255)    NULL,
    CreatedAt       DATETIME        DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT FK_Attend_Emp FOREIGN KEY (EmployeeID)
        REFERENCES employees_payroll(EmployeeID),
    CONSTRAINT UQ_Attend_EmpMonth UNIQUE (EmployeeID, AttendanceMonth, AttendanceYear)
);

-- ============================================================
-- 6. BẢNG LEAVE_REQUESTS – Yêu cầu nghỉ phép
-- Theo API-13: POST /attendance/leave
-- Theo API-14: PUT /attendance/leave/{id}
-- ============================================================
CREATE TABLE leave_requests (
    RequestID       INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    EmployeeID      INT             NOT NULL,
    StartDate       DATE            NOT NULL,
    EndDate         DATE            NOT NULL,
    LeaveDays       INT             NOT NULL DEFAULT 1,
    Reason          VARCHAR(255)    NULL,
    Status          VARCHAR(20)     DEFAULT 'Pending',  -- Pending / Approved / Rejected
    ApprovedBy      INT             NULL,               -- UserID người duyệt
    ApprovedAt      DATETIME        NULL,
    RejectReason    VARCHAR(255)    NULL,
    CreatedAt       DATETIME        DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT FK_Leave_Emp FOREIGN KEY (EmployeeID)
        REFERENCES employees_payroll(EmployeeID)
);

-- ============================================================
-- 7. BẢNG SYNC_LOG – Ghi log đồng bộ (bản sao ở MySQL)
-- Theo tài liệu API Integration Plan (Section 4.4.3)
-- ============================================================
CREATE TABLE sync_log (
    LogID           INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    APIName         VARCHAR(100)    NOT NULL,
    ActionType      VARCHAR(20)     NOT NULL,   -- INSERT / UPDATE / DELETE / SYNC
    EmployeeID      INT             NULL,
    ErrorMessage    VARCHAR(500)    NULL,
    RollbackFlag    TINYINT(1)      DEFAULT 0,  -- 1 = đã rollback
    CreatedAt       DATETIME        DEFAULT CURRENT_TIMESTAMP,
    Resolved        TINYINT(1)      DEFAULT 0   -- 1 = đã xử lý
);

-- ============================================================
-- DỮ LIỆU MẪU – Phải khớp với HUMAN_2025
-- ============================================================

-- Đồng bộ phòng ban (khớp DepartmentID với SQL Server)
INSERT INTO departments_payroll (DepartmentID, DepartmentName) VALUES
    (1, 'Phòng Kỹ thuật'),
    (2, 'Phòng Nhân sự'),
    (3, 'Phòng Kế toán'),
    (4, 'Phòng Kinh doanh'),
    (5, 'Phòng Hành chính');

-- Đồng bộ chức vụ (khớp PositionID với SQL Server)
INSERT INTO positions_payroll (PositionID, PositionName) VALUES
    (1, 'Giám đốc'),
    (2, 'Trưởng phòng'),
    (3, 'Nhân viên'),
    (4, 'Thực tập sinh'),
    (5, 'Kỹ sư phần mềm');

-- Đồng bộ nhân viên (khớp EmployeeID với SQL Server)
INSERT INTO employees_payroll (EmployeeID, FullName, DepartmentID, PositionID, Status) VALUES
    (1, 'Nguyễn Văn An',   1, 5, 'Active'),
    (2, 'Trần Thị Bình',   2, 3, 'Active'),
    (3, 'Lê Minh Cường',   3, 2, 'Active'),
    (4, 'Phạm Thị Dung',   4, 3, 'Active'),
    (5, 'Hoàng Văn Em',    1, 3, 'Active');

-- Bảng lương tháng 4/2026
INSERT INTO salaries (EmployeeID, SalaryMonth, SalaryYear, BaseSalary, Bonus, Deductions) VALUES
    (1, 4, 2026, 18000000, 2000000, 500000),
    (2, 4, 2026, 12000000, 1000000, 300000),
    (3, 4, 2026, 20000000, 3000000, 800000),
    (4, 4, 2026, 11000000,  500000, 200000),
    (5, 4, 2026, 13000000, 1500000, 400000);

-- Bảng lương tháng 3/2026
INSERT INTO salaries (EmployeeID, SalaryMonth, SalaryYear, BaseSalary, Bonus, Deductions) VALUES
    (1, 3, 2026, 18000000, 1500000, 500000),
    (2, 3, 2026, 12000000,  800000, 300000),
    (3, 3, 2026, 20000000, 2500000, 800000),
    (4, 3, 2026, 11000000,  300000, 200000),
    (5, 3, 2026, 13000000, 1000000, 400000);

-- Chấm công tháng 4/2026
INSERT INTO attendance (EmployeeID, AttendanceMonth, AttendanceYear, WorkDays, LeaveDays, AbsentDays, OvertimeHours) VALUES
    (1, 4, 2026, 22, 0, 0, 8.0),
    (2, 4, 2026, 21, 1, 0, 0.0),
    (3, 4, 2026, 22, 0, 0, 12.0),
    (4, 4, 2026, 20, 2, 0, 0.0),
    (5, 4, 2026, 22, 0, 0, 4.0);

SELECT 'payroll_2026 database created successfully!' AS Message;

-- ============================================================
-- 8. BẢNG ALERTS – Cảnh báo & Thông báo hệ thống
-- Theo API: GET /api/alerts, PUT /api/alerts/:id/read
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
    AlertID         INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Severity        VARCHAR(20)     NOT NULL DEFAULT 'info',   -- info / warning / critical
    Title           VARCHAR(255)    NOT NULL,
    Description     TEXT            NULL,
    IsRead          TINYINT(1)      NOT NULL DEFAULT 0,        -- 0 = chưa đọc, 1 = đã đọc
    CreatedAt       DATETIME        DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT CHK_Severity CHECK (Severity IN ('info', 'warning', 'critical'))
);

-- Dữ liệu mẫu cho bảng alerts
INSERT INTO alerts (Severity, Title, Description, IsRead) VALUES
    ('critical', 'Lương tháng 5/2026 chưa được duyệt',
     'Bảng lương tháng 05/2026 đã được tạo nhưng chưa có người phê duyệt. Vui lòng kiểm tra và xác nhận trước ngày 10/05.',
     0),
    ('warning', '3 nhân viên sắp hết hạn hợp đồng',
     'Nguyễn Văn A, Trần Thị B, Lê Văn C có hợp đồng hết hạn trong vòng 30 ngày tới. Cần gia hạn hoặc chấm dứt hợp đồng.',
     0),
    ('info', 'Đồng bộ dữ liệu hoàn tất',
     'Quá trình đồng bộ dữ liệu giữa HUMAN_2025 (SQL Server) và payroll_2026 (MySQL) đã hoàn tất thành công. 42 bản ghi được cập nhật.',
     0),
    ('warning', 'Tỷ lệ nghỉ phép phòng Kỹ thuật vượt ngưỡng',
     'Phòng Kỹ thuật có 6/15 nhân viên đang nghỉ phép cùng lúc (40%), vượt ngưỡng cho phép 30%. Cần điều phối lại lịch nghỉ.',
     1),
    ('info', 'Báo cáo cổ tức Q1/2026 đã sẵn sàng',
     'Báo cáo cổ tức quý 1 năm 2026 đã được tổng hợp. Tổng giá trị: 1.250.000.000 VNĐ cho 28 nhân viên đủ điều kiện.',
     1),
    ('critical', 'Lỗi kết nối cơ sở dữ liệu AuthDB',
     'Hệ thống phát hiện 2 lần kết nối thất bại đến SQL Server AuthDB trong 24 giờ qua. Kiểm tra cấu hình kết nối và trạng thái server.',
     1),
    ('info', 'Cập nhật hệ thống phiên bản 2.1.0',
     'Hệ thống HR & Payroll đã được cập nhật lên phiên bản 2.1.0. Xem chi tiết các tính năng mới và bản vá lỗi trong ghi chú phát hành.',
     1);
