-- =====================================================
-- DATABASE: AuthDB (Hệ thống phân quyền RBAC)
-- Dùng cho: Integrated HR & Payroll Dashboard System
-- Tác giả: Group 2 - System Integration Practices
-- Ngày tạo: 2026-04-14
-- Phiên bản: SQL Server
-- =====================================================

-- Tạo database (nếu chưa tồn tại)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AuthDB')
BEGIN
    CREATE DATABASE AuthDB;
END
GO

USE AuthDB;
GO

-- =====================================================
-- 1. Bảng Users (Người dùng)
-- =====================================================
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    IsActive BIT DEFAULT 1,
    LastLogin DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL
);
GO

-- =====================================================
-- 2. Bảng Roles (Vai trò)
-- =====================================================
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- =====================================================
-- 3. Bảng Modules (Module chức năng)
-- =====================================================
CREATE TABLE Modules (
    ModuleID INT IDENTITY(1,1) PRIMARY KEY,
    ModuleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL,
    Icon NVARCHAR(50) NULL,
    SortOrder INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- =====================================================
-- 4. Bảng Functions (Chức năng cụ thể)
-- =====================================================
CREATE TABLE Functions (
    FunctionID INT IDENTITY(1,1) PRIMARY KEY,
    ModuleID INT NOT NULL,
    FunctionName NVARCHAR(50) NOT NULL,
    Route NVARCHAR(100) NULL,
    Description NVARCHAR(255) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ModuleID) REFERENCES Modules(ModuleID) ON DELETE CASCADE
);
GO

-- =====================================================
-- 5. Bảng Permissions (Quyền hạn)
-- =====================================================
CREATE TABLE Permissions (
    PermissionID INT IDENTITY(1,1) PRIMARY KEY,
    PermissionName NVARCHAR(50) NOT NULL UNIQUE,
    Resource NVARCHAR(50) NOT NULL,
    Action NVARCHAR(20) NOT NULL,
    Description NVARCHAR(255) NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- =====================================================
-- 6. Bảng Users_Roles (Liên kết User - Role)
-- =====================================================
CREATE TABLE Users_Roles (
    UserRoleID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    RoleID INT NOT NULL,
    AssignedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE,
    CONSTRAINT UQ_User_Role UNIQUE (UserID, RoleID)
);
GO

-- =====================================================
-- 7. Bảng Role_Permissions (Liên kết Role - Permission)
-- =====================================================
CREATE TABLE Role_Permissions (
    RolePermID INT IDENTITY(1,1) PRIMARY KEY,
    RoleID INT NOT NULL,
    PermissionID INT NOT NULL,
    GrantedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE,
    FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID) ON DELETE CASCADE,
    CONSTRAINT UQ_Role_Permission UNIQUE (RoleID, PermissionID)
);
GO

-- =====================================================
-- 8. Bảng Function_Permissions (Liên kết Function - Permission)
-- =====================================================
CREATE TABLE Function_Permissions (
    FuncPermID INT IDENTITY(1,1) PRIMARY KEY,
    FunctionID INT NOT NULL,
    PermissionID INT NOT NULL,
    FOREIGN KEY (FunctionID) REFERENCES Functions(FunctionID) ON DELETE CASCADE,
    FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID) ON DELETE CASCADE,
    CONSTRAINT UQ_Function_Permission UNIQUE (FunctionID, PermissionID)
);
GO

-- =====================================================
-- 9. Bảng Audit_Log (Nhật ký hoạt động)
-- =====================================================
CREATE TABLE Audit_Log (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL,
    Action NVARCHAR(100) NOT NULL,
    Resource NVARCHAR(100) NOT NULL,
    ResourceID NVARCHAR(50) NULL,
    Details NVARCHAR(MAX) NULL,
    IPAddress NVARCHAR(45) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE SET NULL
);
GO

-- =====================================================
-- =====================================================
-- INSERT DỮ LIỆU MẪU (SEED DATA)
-- =====================================================
-- =====================================================

-- =====================================================
-- 1. Insert Modules
-- =====================================================
INSERT INTO Modules (ModuleName, Description, Icon, SortOrder) VALUES
(N'Dashboard', N'Tổng quan hệ thống, hiển thị KPI và biểu đồ', N'dashboard', 1),
(N'Employee', N'Quản lý thông tin nhân viên, hồ sơ, hợp đồng', N'people', 2),
(N'Payroll', N'Quản lý lương, thưởng, khấu trừ, bảng lương', N'payments', 3),
(N'Attendance', N'Quản lý chấm công, nghỉ phép, ngày công', N'calendar_today', 4),
(N'Organization', N'Quản lý phòng ban, chức vụ, cơ cấu tổ chức', N'business', 5),
(N'Report', N'Báo cáo và phân tích dữ liệu HR-Payroll', N'bar_chart', 6),
(N'Alert', N'Cảnh báo thông minh và thông báo hệ thống', N'notifications', 7),
(N'Admin', N'Quản trị hệ thống, người dùng, phân quyền', N'admin_settings', 8);
GO

-- =====================================================
-- 2. Insert Functions
-- =====================================================
-- Dashboard (ModuleID = 1)
INSERT INTO Functions (ModuleID, FunctionName, Route, Description) VALUES
(1, N'ViewDashboard', N'/dashboard', N'Xem trang tổng quan'),
(1, N'ViewKPIs', N'/dashboard/kpis', N'Xem các chỉ số KPI');

-- Employee (ModuleID = 2)
INSERT INTO Functions (ModuleID, FunctionName, Route, Description) VALUES
(2, N'ViewEmployeeList', N'/employees', N'Xem danh sách nhân viên'),
(2, N'SearchEmployee', N'/employees/search', N'Tìm kiếm nhân viên'),
(2, N'AddEmployee', N'/employees/add', N'Thêm nhân viên mới'),
(2, N'EditEmployee', N'/employees/edit', N'Sửa thông tin nhân viên'),
(2, N'DeleteEmployee', N'/employees/delete', N'Xóa nhân viên'),
(2, N'ExportEmployee', N'/employees/export', N'Xuất danh sách nhân viên');

-- Payroll (ModuleID = 3)
INSERT INTO Functions (ModuleID, FunctionName, Route, Description) VALUES
(3, N'ViewPayroll', N'/payroll', N'Xem bảng lương'),
(3, N'ViewSalaryHistory', N'/payroll/history', N'Xem lịch sử lương'),
(3, N'AdjustSalary', N'/payroll/adjust', N'Điều chỉnh lương, thưởng'),
(3, N'ExportPayroll', N'/payroll/export', N'Xuất báo cáo lương');

-- Attendance (ModuleID = 4)
INSERT INTO Functions (ModuleID, FunctionName, Route, Description) VALUES
(4, N'ViewAttendance', N'/attendance', N'Xem bảng chấm công'),
(4, N'ViewLeaveRequest', N'/attendance/leave', N'Xem yêu cầu nghỉ phép'),
(4, N'ApproveLeave', N'/attendance/leave/approve', N'Duyệt nghỉ phép'),
(4, N'RejectLeave', N'/attendance/leave/reject', N'Từ chối nghỉ phép'),
(4, N'SubmitLeave', N'/attendance/leave/submit', N'Gửi yêu cầu nghỉ phép');

-- Organization (ModuleID = 5)
INSERT INTO Functions (ModuleID, FunctionName, Route, Description) VALUES
(5, N'ViewDepartment', N'/organization/departments', N'Xem danh sách phòng ban'),
(5, N'ManageDepartment', N'/organization/departments/manage', N'Quản lý phòng ban'),
(5, N'ViewPosition', N'/organization/positions', N'Xem danh sách chức vụ'),
(5, N'ManagePosition', N'/organization/positions/manage', N'Quản lý chức vụ');

-- Report (ModuleID = 6)
INSERT INTO Functions (ModuleID, FunctionName, Route, Description) VALUES
(6, N'ViewHRReport', N'/reports/hr', N'Xem báo cáo nhân sự'),
(6, N'ViewPayrollReport', N'/reports/payroll', N'Xem báo cáo lương'),
(6, N'ViewDividendReport', N'/reports/dividend', N'Xem báo cáo cổ tức'),
(6, N'ExportReport', N'/reports/export', N'Xuất báo cáo');

-- Alert (ModuleID = 7)
INSERT INTO Functions (ModuleID, FunctionName, Route, Description) VALUES
(7, N'ViewAlerts', N'/alerts', N'Xem danh sách cảnh báo'),
(7, N'ViewAnniversaryAlert', N'/alerts/anniversary', N'Xem cảnh báo thâm niên'),
(7, N'ViewLeaveAlert', N'/alerts/leave', N'Xem cảnh báo nghỉ phép'),
(7, N'ViewSalaryAlert', N'/alerts/salary', N'Xem cảnh báo chênh lệch lương');

-- Admin (ModuleID = 8)
INSERT INTO Functions (ModuleID, FunctionName, Route, Description) VALUES
(8, N'ManageUsers', N'/admin/users', N'Quản lý người dùng'),
(8, N'ManageRoles', N'/admin/roles', N'Quản lý vai trò'),
(8, N'ManagePermissions', N'/admin/permissions', N'Quản lý quyền hạn'),
(8, N'ViewAuditLog', N'/admin/audit-log', N'Xem nhật ký hệ thống');
GO

-- =====================================================
-- 3. Insert Roles
-- =====================================================
INSERT INTO Roles (RoleName, Description) VALUES
(N'Admin', N'Quản trị viên hệ thống - Toàn quyền truy cập và quản lý'),
(N'HR_Manager', N'Trưởng phòng Nhân sự - Quản lý nhân viên, tổ chức, báo cáo nhân sự'),
(N'Payroll_Manager', N'Trưởng phòng Tiền lương - Quản lý lương, chấm công, báo cáo tài chính'),
(N'Employee', N'Nhân viên - Xem thông tin cá nhân, lương, chấm công, gửi nghỉ phép');
GO

-- =====================================================
-- 4. Insert Permissions
-- =====================================================
INSERT INTO Permissions (PermissionName, Resource, Action, Description) VALUES
-- Employee permissions
(N'employee.read', N'employee', N'read', N'Xem thông tin nhân viên'),
(N'employee.write', N'employee', N'write', N'Thêm/sửa thông tin nhân viên'),
(N'employee.delete', N'employee', N'delete', N'Xóa thông tin nhân viên'),
(N'employee.export', N'employee', N'export', N'Xuất danh sách nhân viên'),

-- Payroll permissions
(N'payroll.read', N'payroll', N'read', N'Xem bảng lương'),
(N'payroll.write', N'payroll', N'write', N'Điều chỉnh lương, thưởng'),
(N'payroll.export', N'payroll', N'export', N'Xuất báo cáo lương'),

-- Attendance permissions
(N'attendance.read', N'attendance', N'read', N'Xem bảng chấm công'),
(N'attendance.approve', N'attendance', N'approve', N'Duyệt/Từ chối nghỉ phép'),
(N'attendance.submit', N'attendance', N'submit', N'Gửi yêu cầu nghỉ phép'),

-- Organization permissions
(N'org.read', N'organization', N'read', N'Xem phòng ban, chức vụ'),
(N'org.write', N'organization', N'write', N'Thêm/sửa/xóa phòng ban, chức vụ'),

-- Report permissions
(N'report.read', N'report', N'read', N'Xem báo cáo'),
(N'report.export', N'report', N'export', N'Xuất báo cáo'),

-- Alert permissions
(N'alert.read', N'alert', N'read', N'Xem cảnh báo'),

-- Admin permissions
(N'user.manage', N'user', N'manage', N'Quản lý người dùng'),
(N'role.manage', N'role', N'manage', N'Quản lý vai trò'),
(N'permission.manage', N'permission', N'manage', N'Quản lý quyền hạn'),
(N'audit.view', N'audit', N'view', N'Xem nhật ký hệ thống');
GO

-- =====================================================
-- 5. Insert Role_Permissions (Gán quyền cho từng vai trò)
-- =====================================================

-- Admin (RoleID = 1): Toàn bộ quyền
INSERT INTO Role_Permissions (RoleID, PermissionID)
SELECT 1, PermissionID FROM Permissions;
GO

-- HR_Manager (RoleID = 2)
INSERT INTO Role_Permissions (RoleID, PermissionID)
SELECT 2, PermissionID FROM Permissions 
WHERE PermissionName IN (
    N'employee.read', N'employee.write', N'employee.export',
    N'attendance.read', N'attendance.approve',
    N'org.read', N'org.write',
    N'report.read', N'report.export',
    N'alert.read'
);
GO

-- Payroll_Manager (RoleID = 3)
INSERT INTO Role_Permissions (RoleID, PermissionID)
SELECT 3, PermissionID FROM Permissions 
WHERE PermissionName IN (
    N'payroll.read', N'payroll.write', N'payroll.export',
    N'attendance.read',
    N'report.read', N'report.export',
    N'alert.read'
);
GO

-- Employee (RoleID = 4)
INSERT INTO Role_Permissions (RoleID, PermissionID)
SELECT 4, PermissionID FROM Permissions 
WHERE PermissionName IN (
    N'employee.read', N'payroll.read', N'attendance.read', N'attendance.submit'
);
GO

-- =====================================================
-- 6. Insert Function_Permissions (Gán quyền cho chức năng)
-- =====================================================

-- Employee functions (FunctionID 3-8)
-- Lấy FunctionID tương ứng với tên FunctionName
INSERT INTO Function_Permissions (FunctionID, PermissionID)
SELECT f.FunctionID, p.PermissionID
FROM Functions f, Permissions p
WHERE (f.FunctionName = N'ViewEmployeeList' AND p.PermissionName = N'employee.read')
   OR (f.FunctionName = N'SearchEmployee' AND p.PermissionName = N'employee.read')
   OR (f.FunctionName = N'AddEmployee' AND p.PermissionName = N'employee.write')
   OR (f.FunctionName = N'EditEmployee' AND p.PermissionName = N'employee.write')
   OR (f.FunctionName = N'DeleteEmployee' AND p.PermissionName = N'employee.delete')
   OR (f.FunctionName = N'ExportEmployee' AND p.PermissionName = N'employee.export');
GO

-- Payroll functions (FunctionID 9-12)
INSERT INTO Function_Permissions (FunctionID, PermissionID)
SELECT f.FunctionID, p.PermissionID
FROM Functions f, Permissions p
WHERE (f.FunctionName = N'ViewPayroll' AND p.PermissionName = N'payroll.read')
   OR (f.FunctionName = N'ViewSalaryHistory' AND p.PermissionName = N'payroll.read')
   OR (f.FunctionName = N'AdjustSalary' AND p.PermissionName = N'payroll.write')
   OR (f.FunctionName = N'ExportPayroll' AND p.PermissionName = N'payroll.export');
GO

-- Attendance functions (FunctionID 13-17)
INSERT INTO Function_Permissions (FunctionID, PermissionID)
SELECT f.FunctionID, p.PermissionID
FROM Functions f, Permissions p
WHERE (f.FunctionName = N'ViewAttendance' AND p.PermissionName = N'attendance.read')
   OR (f.FunctionName = N'ViewLeaveRequest' AND p.PermissionName = N'attendance.read')
   OR (f.FunctionName = N'ApproveLeave' AND p.PermissionName = N'attendance.approve')
   OR (f.FunctionName = N'RejectLeave' AND p.PermissionName = N'attendance.approve')
   OR (f.FunctionName = N'SubmitLeave' AND p.PermissionName = N'attendance.submit');
GO

-- Organization functions (FunctionID 18-21)
INSERT INTO Function_Permissions (FunctionID, PermissionID)
SELECT f.FunctionID, p.PermissionID
FROM Functions f, Permissions p
WHERE (f.FunctionName = N'ViewDepartment' AND p.PermissionName = N'org.read')
   OR (f.FunctionName = N'ManageDepartment' AND p.PermissionName = N'org.write')
   OR (f.FunctionName = N'ViewPosition' AND p.PermissionName = N'org.read')
   OR (f.FunctionName = N'ManagePosition' AND p.PermissionName = N'org.write');
GO

-- Report functions (FunctionID 22-25)
INSERT INTO Function_Permissions (FunctionID, PermissionID)
SELECT f.FunctionID, p.PermissionID
FROM Functions f, Permissions p
WHERE (f.FunctionName = N'ViewHRReport' AND p.PermissionName = N'report.read')
   OR (f.FunctionName = N'ViewPayrollReport' AND p.PermissionName = N'report.read')
   OR (f.FunctionName = N'ViewDividendReport' AND p.PermissionName = N'report.read')
   OR (f.FunctionName = N'ExportReport' AND p.PermissionName = N'report.export');
GO

-- Alert functions (FunctionID 26-29)
INSERT INTO Function_Permissions (FunctionID, PermissionID)
SELECT f.FunctionID, p.PermissionID
FROM Functions f, Permissions p
WHERE (f.FunctionName IN (N'ViewAlerts', N'ViewAnniversaryAlert', N'ViewLeaveAlert', N'ViewSalaryAlert')
   AND p.PermissionName = N'alert.read');
GO

-- Admin functions (FunctionID 30-33)
INSERT INTO Function_Permissions (FunctionID, PermissionID)
SELECT f.FunctionID, p.PermissionID
FROM Functions f, Permissions p
WHERE (f.FunctionName = N'ManageUsers' AND p.PermissionName = N'user.manage')
   OR (f.FunctionName = N'ManageRoles' AND p.PermissionName = N'role.manage')
   OR (f.FunctionName = N'ManagePermissions' AND p.PermissionName = N'permission.manage')
   OR (f.FunctionName = N'ViewAuditLog' AND p.PermissionName = N'audit.view');
GO

-- =====================================================
-- 7. Insert Users mẫu
-- =====================================================
-- Lưu ý: PasswordHash là mã hash của 'admin123' (dùng bcrypt)
-- Trong thực tế, bạn nên dùng thư viện bcrypt để tạo hash
INSERT INTO Users (Username, Email, PasswordHash, FullName, IsActive) VALUES
(N'admin', N'admin@companyx.com', N'$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrJ6r2sGqM7YqZJ6qZJ6qZJ6qZJ6q', N'Quản trị viên hệ thống', 1),
(N'hr_manager', N'hr@companyx.com', N'$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrJ6r2sGqM7YqZJ6qZJ6qZJ6qZJ6q', N'Trưởng phòng Nhân sự', 1),
(N'payroll_manager', N'payroll@companyx.com', N'$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrJ6r2sGqM7YqZJ6qZJ6qZJ6qZJ6q', N'Trưởng phòng Tiền lương', 1),
(N'employee', N'employee@companyx.com', N'$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrJ6r2sGqM7YqZJ6qZJ6qZJ6qZJ6q', N'Nhân viên', 1);
GO

-- =====================================================
-- 8. Insert Users_Roles (Gán vai trò cho người dùng)
-- =====================================================
INSERT INTO Users_Roles (UserID, RoleID) VALUES
(1, 1),  -- admin -> Admin
(2, 2),  -- hr_manager -> HR_Manager
(3, 3),  -- payroll_manager -> Payroll_Manager
(4, 4);  -- employee -> Employee
GO

-- =====================================================
-- 9. Insert Audit_Log mẫu (dữ liệu demo)
-- =====================================================
INSERT INTO Audit_Log (UserID, Action, Resource, ResourceID, Details, IPAddress) VALUES
(1, N'LOGIN_SUCCESS', N'Auth', N'1', N'Đăng nhập thành công', N'192.168.1.100'),
(1, N'CREATE', N'User', N'5', N'Tạo người dùng mới: employee2', N'192.168.1.100'),
(2, N'VIEW', N'Employee', N'10', N'Xem thông tin nhân viên ID=10', N'192.168.1.101'),
(2, N'UPDATE', N'Employee', N'10', N'Cập nhật thông tin nhân viên', N'192.168.1.101'),
(3, N'VIEW', N'Payroll', N'25', N'Xem bảng lương tháng 03/2026', N'192.168.1.102'),
(3, N'UPDATE', N'Salary', N'25', N'Điều chỉnh lương nhân viên ID=25', N'192.168.1.102'),
(4, N'VIEW', N'Employee', N'4', N'Xem thông tin cá nhân', N'192.168.1.103'),
(4, N'SUBMIT', N'Leave', N'L001', N'Gửi yêu cầu nghỉ phép', N'192.168.1.103');
GO

-- =====================================================
-- =====================================================
-- CÂU LỆNH KIỂM TRA VÀ HIỂN THỊ KẾT QUẢ
-- =====================================================
-- =====================================================

PRINT '=== DATABASE AuthDB CREATED SUCCESSFULLY ===';
GO

-- Kiểm tra số lượng bản ghi trong từng bảng
SELECT 'Modules' AS TableName, COUNT(*) AS RecordCount FROM Modules
UNION ALL
SELECT 'Functions', COUNT(*) FROM Functions
UNION ALL
SELECT 'Roles', COUNT(*) FROM Roles
UNION ALL
SELECT 'Permissions', COUNT(*) FROM Permissions
UNION ALL
SELECT 'Users', COUNT(*) FROM Users
UNION ALL
SELECT 'Users_Roles', COUNT(*) FROM Users_Roles
UNION ALL
SELECT 'Role_Permissions', COUNT(*) FROM Role_Permissions
UNION ALL
SELECT 'Function_Permissions', COUNT(*) FROM Function_Permissions
UNION ALL
SELECT 'Audit_Log', COUNT(*) FROM Audit_Log;
GO

-- Hiển thị danh sách Modules
PRINT '=== DANH SÁCH MODULES ===';
SELECT ModuleID, ModuleName, Description, Icon, SortOrder FROM Modules ORDER BY SortOrder;
GO

-- Hiển thị danh sách Roles
PRINT '=== DANH SÁCH ROLES ===';
SELECT RoleID, RoleName, Description FROM Roles;
GO

-- Hiển thị danh sách Users và Roles của họ
PRINT '=== DANH SÁCH USERS VÀ ROLES ===';
SELECT u.UserID, u.Username, u.FullName, u.Email, u.IsActive, r.RoleName
FROM Users u
LEFT JOIN Users_Roles ur ON u.UserID = ur.UserID
LEFT JOIN Roles r ON ur.RoleID = r.RoleID;
GO

-- Hiển thị danh sách Permissions theo Role
PRINT '=== QUYỀN CỦA TỪNG VAI TRÒ ===';
SELECT r.RoleName, p.PermissionName, p.Resource, p.Action
FROM Roles r
JOIN Role_Permissions rp ON r.RoleID = rp.RoleID
JOIN Permissions p ON rp.PermissionID = p.PermissionID
ORDER BY r.RoleName, p.Resource, p.Action;
GO

-- Hiển thị Audit Log
PRINT '=== NHẬT KÝ HỆ THỐNG (AUDIT LOG) ===';
SELECT TOP 10 LogID, UserID, Action, Resource, ResourceID, Details, IPAddress, CreatedAt
FROM Audit_Log
ORDER BY CreatedAt DESC;
GO

-- =====================================================
-- STORED PROCEDURE: Kiểm tra quyền của User
-- =====================================================
CREATE OR ALTER PROCEDURE sp_CheckUserPermission
    @Username NVARCHAR(50),
    @Resource NVARCHAR(50),
    @Action NVARCHAR(20)
AS
BEGIN
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM Users u
            JOIN Users_Roles ur ON u.UserID = ur.UserID
            JOIN Role_Permissions rp ON ur.RoleID = rp.RoleID
            JOIN Permissions p ON rp.PermissionID = p.PermissionID
            WHERE u.Username = @Username 
              AND u.IsActive = 1
              AND p.Resource = @Resource 
              AND p.Action = @Action
        ) THEN 1 
        ELSE 0 
    END AS HasPermission;
END;
GO

-- =====================================================
-- STORED PROCEDURE: Lấy danh sách chức năng theo Role
-- =====================================================
CREATE OR ALTER PROCEDURE sp_GetFunctionsByRole
    @RoleName NVARCHAR(50)
AS
BEGIN
    SELECT DISTINCT f.FunctionID, f.FunctionName, f.Route, f.Description, m.ModuleName, m.Icon
    FROM Roles r
    JOIN Role_Permissions rp ON r.RoleID = rp.RoleID
    JOIN Function_Permissions fp ON rp.PermissionID = fp.PermissionID
    JOIN Functions f ON fp.FunctionID = f.FunctionID
    JOIN Modules m ON f.ModuleID = m.ModuleID
    WHERE r.RoleName = @RoleName
    ORDER BY m.SortOrder, f.FunctionID;
END;
GO

-- =====================================================
-- KIỂM TRA STORED PROCEDURE
-- =====================================================
PRINT '=== KIỂM TRA sp_CheckUserPermission ===';
EXEC sp_CheckUserPermission 'hr_manager', 'employee', 'write';
EXEC sp_CheckUserPermission 'employee', 'payroll', 'write';
GO

PRINT '=== KIỂM TRA sp_GetFunctionsByRole ===';
EXEC sp_GetFunctionsByRole 'HR_Manager';
GO

PRINT '=== SCRIPT HOÀN TẤT ===';