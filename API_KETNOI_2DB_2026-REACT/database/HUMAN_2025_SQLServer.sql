-- ============================================================
-- DATABASE: HUMAN_2025 (SQL Server)
-- Hệ thống quản lý nhân sự chính (Master Data)
-- ============================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'HUMAN_2025')
    DROP DATABASE HUMAN_2025;
GO

CREATE DATABASE HUMAN_2025;
GO

USE HUMAN_2025;
GO

-- ============================================================
-- 1. BẢNG DEPARTMENTS – Phòng ban
-- ============================================================
CREATE TABLE Departments (
    DepartmentID    INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentName  NVARCHAR(100)   NOT NULL,
    Description     NVARCHAR(255)   NULL,
    CreatedAt       DATETIME        DEFAULT GETDATE(),
    UpdatedAt       DATETIME        DEFAULT GETDATE()
);
GO

-- ============================================================
-- 2. BẢNG POSITIONS – Chức vụ
-- ============================================================
CREATE TABLE Positions (
    PositionID      INT IDENTITY(1,1) PRIMARY KEY,
    PositionName    NVARCHAR(100)   NOT NULL,
    Description     NVARCHAR(255)   NULL,
    CreatedAt       DATETIME        DEFAULT GETDATE(),
    UpdatedAt       DATETIME        DEFAULT GETDATE()
);
GO

-- ============================================================
-- 3. BẢNG EMPLOYEES – Nhân viên
-- ============================================================
CREATE TABLE Employees (
    EmployeeID      INT IDENTITY(1,1) PRIMARY KEY,
    FullName        NVARCHAR(100)   NOT NULL,
    DateOfBirth     DATE            NULL,
    Gender          NVARCHAR(10)    NULL,          -- Nam / Nữ / Khác
    PhoneNumber     NVARCHAR(20)    NULL,
    Email           NVARCHAR(100)   NOT NULL UNIQUE,
    HireDate        DATE            NULL,
    DepartmentID    INT             NULL,
    PositionID      INT             NULL,
    Status          NVARCHAR(20)    DEFAULT 'Active',  -- Active / Inactive
    CreatedAt       DATETIME        DEFAULT GETDATE(),
    UpdatedAt       DATETIME        DEFAULT GETDATE(),

    CONSTRAINT FK_Emp_Dept FOREIGN KEY (DepartmentID)
        REFERENCES Departments(DepartmentID),
    CONSTRAINT FK_Emp_Pos  FOREIGN KEY (PositionID)
        REFERENCES Positions(PositionID)
);
GO

-- ============================================================
-- 4. BẢNG DIVIDENDS – Cổ tức nhân viên
-- Dùng để kiểm tra ràng buộc khi xóa nhân viên
-- ============================================================
CREATE TABLE Dividends (
    DividendID      INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID      INT             NOT NULL,
    Year            INT             NOT NULL,       -- Năm chia cổ tức
    Amount          DECIMAL(18,2)   NOT NULL DEFAULT 0,
    Note            NVARCHAR(255)   NULL,
    CreatedAt       DATETIME        DEFAULT GETDATE(),

    CONSTRAINT FK_Div_Emp FOREIGN KEY (EmployeeID)
        REFERENCES Employees(EmployeeID)
);
GO

-- ============================================================
-- 5. BẢNG SYNC_LOG – Ghi log đồng bộ 2 DB
-- Theo tài liệu API Integration Plan (Section 4.4.3)
-- ============================================================
CREATE TABLE SYNC_LOG (
    LogID           INT IDENTITY(1,1) PRIMARY KEY,
    APIName         NVARCHAR(100)   NOT NULL,       -- Tên API gọi
    ActionType      NVARCHAR(20)    NOT NULL,       -- INSERT / UPDATE / DELETE
    EmployeeID      INT             NULL,
    ErrorMessage    NVARCHAR(500)   NULL,
    RollbackFlag    BIT             DEFAULT 0,      -- 1 = đã rollback
    CreatedAt       DATETIME        DEFAULT GETDATE(),
    Resolved        BIT             DEFAULT 0       -- 1 = đã xử lý
);
GO

-- ============================================================
-- 6. BẢNG AUDIT_LOG – Nhật ký hoạt động người dùng
-- Theo tài liệu API Design (Section 6)
-- ============================================================
CREATE TABLE AUDIT_LOG (
    LogID           INT IDENTITY(1,1) PRIMARY KEY,
    UserID          INT             NULL,
    Action          NVARCHAR(50)    NOT NULL,       -- LOGIN / CREATE / UPDATE / DELETE
    Resource        NVARCHAR(50)    NULL,           -- employees / departments / ...
    ResourceID      INT             NULL,
    Details         NVARCHAR(500)   NULL,
    IPAddress       NVARCHAR(50)    NULL,
    CreatedAt       DATETIME        DEFAULT GETDATE()
);
GO

-- ============================================================
-- 7. BẢNG USERS – Tài khoản đăng nhập (JWT Auth)
-- Theo tài liệu API Design (Section 3.2)
-- ============================================================
CREATE TABLE Users (
    UserID          INT IDENTITY(1,1) PRIMARY KEY,
    Username        NVARCHAR(50)    NOT NULL UNIQUE,
    PasswordHash    NVARCHAR(255)   NOT NULL,       -- Lưu hash, không lưu plain text
    Role            NVARCHAR(30)    NOT NULL,       -- Admin / HR Manager / Payroll Manager / Employee
    EmployeeID      INT             NULL,           -- Liên kết với nhân viên (nếu có)
    IsActive        BIT             DEFAULT 1,
    CreatedAt       DATETIME        DEFAULT GETDATE(),
    LastLogin       DATETIME        NULL,

    CONSTRAINT FK_User_Emp FOREIGN KEY (EmployeeID)
        REFERENCES Employees(EmployeeID)
);
GO

-- ============================================================
-- DỮ LIỆU MẪU
-- ============================================================

-- Phòng ban
INSERT INTO Departments (DepartmentName, Description) VALUES
    (N'Phòng Kỹ thuật',     N'Bộ phận phát triển phần mềm và hạ tầng'),
    (N'Phòng Nhân sự',      N'Quản lý tuyển dụng và nhân sự'),
    (N'Phòng Kế toán',      N'Quản lý tài chính và kế toán'),
    (N'Phòng Kinh doanh',   N'Phát triển kinh doanh và bán hàng'),
    (N'Phòng Hành chính',   N'Hành chính và hậu cần');
GO

-- Chức vụ
INSERT INTO Positions (PositionName, Description) VALUES
    (N'Giám đốc',           N'Cấp quản lý cao nhất'),
    (N'Trưởng phòng',       N'Quản lý cấp phòng ban'),
    (N'Nhân viên',          N'Nhân viên thực thi'),
    (N'Thực tập sinh',      N'Nhân viên thực tập'),
    (N'Kỹ sư phần mềm',    N'Phát triển và bảo trì phần mềm');
GO

-- Nhân viên mẫu
INSERT INTO Employees (FullName, DateOfBirth, Gender, PhoneNumber, Email, HireDate, DepartmentID, PositionID, Status) VALUES
    (N'Nguyễn Văn An',      '1990-05-15', N'Nam',  '0901234567', 'nguyenvanan@companyx.com',   '2020-01-10', 1, 5, 'Active'),
    (N'Trần Thị Bình',      '1992-08-20', N'Nữ',   '0912345678', 'tranthihinh@companyx.com',   '2021-03-15', 2, 3, 'Active'),
    (N'Lê Minh Cường',      '1988-12-01', N'Nam',  '0923456789', 'leminhcuong@companyx.com',   '2019-06-01', 3, 2, 'Active'),
    (N'Phạm Thị Dung',      '1995-03-25', N'Nữ',   '0934567890', 'phamthidung@companyx.com',   '2022-09-01', 4, 3, 'Active'),
    (N'Hoàng Văn Em',       '1993-07-10', N'Nam',  '0945678901', 'hoangvanem@companyx.com',    '2021-11-20', 1, 3, 'Active');
GO

-- Cổ tức mẫu
INSERT INTO Dividends (EmployeeID, Year, Amount, Note) VALUES
    (1, 2024, 5000000,  N'Cổ tức năm 2024'),
    (2, 2024, 3000000,  N'Cổ tức năm 2024'),
    (3, 2024, 7000000,  N'Cổ tức năm 2024');
GO

-- Tài khoản admin mặc định (password: Admin@123 - đã hash SHA256 demo)
INSERT INTO Users (Username, PasswordHash, Role, EmployeeID) VALUES
    ('admin',           'hashed_Admin@123',     'Admin',            NULL),
    ('hr_manager',      'hashed_Hr@123',        'HR Manager',       2),
    ('payroll_manager', 'hashed_Payroll@123',   'Payroll Manager',  3);
GO

PRINT 'HUMAN_2025 database created successfully!';
GO
