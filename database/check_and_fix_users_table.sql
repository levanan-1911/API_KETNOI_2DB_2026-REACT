-- ============================================================
-- Kiểm tra và sửa bảng Users trong HUMAN_2025
-- ============================================================
USE HUMAN_2025;
GO

-- Bước 1: Kiểm tra bảng Users có tồn tại không
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    PRINT 'Bảng Users chưa tồn tại. Đang tạo mới...';
    
    CREATE TABLE Users (
        UserID          INT IDENTITY(1,1) PRIMARY KEY,
        Username        NVARCHAR(50)    NOT NULL UNIQUE,
        PasswordHash    NVARCHAR(255)   NOT NULL,
        Role            NVARCHAR(30)    NOT NULL,
        EmployeeID      INT             NULL,
        IsActive        BIT             DEFAULT 1,
        CreatedAt       DATETIME        DEFAULT GETDATE(),
        LastLogin       DATETIME        NULL,

        CONSTRAINT FK_User_Emp FOREIGN KEY (EmployeeID)
            REFERENCES Employees(EmployeeID)
    );
    
    PRINT 'Bảng Users đã được tạo thành công!';
END
ELSE
BEGIN
    PRINT 'Bảng Users đã tồn tại. Kiểm tra cấu trúc...';
    
    -- Kiểm tra và thêm cột Role nếu thiếu
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Role')
    BEGIN
        PRINT 'Thêm cột Role...';
        ALTER TABLE Users ADD Role NVARCHAR(30) NOT NULL DEFAULT 'Employee';
    END
    
    -- Kiểm tra và thêm cột EmployeeID nếu thiếu
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'EmployeeID')
    BEGIN
        PRINT 'Thêm cột EmployeeID...';
        ALTER TABLE Users ADD EmployeeID INT NULL;
    END
    
    -- Kiểm tra và thêm cột IsActive nếu thiếu
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'IsActive')
    BEGIN
        PRINT 'Thêm cột IsActive...';
        ALTER TABLE Users ADD IsActive BIT DEFAULT 1;
    END
    
    -- Kiểm tra và thêm cột LastLogin nếu thiếu
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'LastLogin')
    BEGIN
        PRINT 'Thêm cột LastLogin...';
        ALTER TABLE Users ADD LastLogin DATETIME NULL;
    END
    
    PRINT 'Cấu trúc bảng Users đã được cập nhật!';
END
GO

-- Bước 2: Xóa dữ liệu cũ (nếu có)
DELETE FROM Users;
GO

-- Bước 3: Thêm 4 tài khoản demo với password đã hash
INSERT INTO Users (Username, PasswordHash, Role, EmployeeID, IsActive) VALUES
    ('admin',           'scrypt:32768:8:1$OFsGxWRsqpLQjDhb$904bccb3a94eb41e319ee2766dbade3e86a319f7916a4af96795866c994017b464accbea9ebd977ca12becb75d929fe95c3aca19bab3e7047f934d4b76d6f80f',   'Admin',            NULL, 1),
    ('hr_manager',      'scrypt:32768:8:1$B4Mv2tDPs9XgaKWt$8910005aa6f5f348d2bab0662144abe949b72fb48caae7013812355e476956c022f70c1aa0b1a1117dc2dbe5128c6702e9cbd412082baafa76e913cf8ed6bcc5',   'HR Manager',       2,    1),
    ('payroll_manager', 'scrypt:32768:8:1$qDPso2QFFAAEAbqc$f2ef3093fe1e740a7bec3b13af75551043b6d5b5572679622ad5869ded1eadba0114b5eaa749c517b9f127a424a1d7b4ceadfcecd9d0f971234480b2f4bdcf9e',   'Payroll Manager',  3,    1),
    ('employee',        'scrypt:32768:8:1$xasqNkiVQ2JRzzJ3$76f410f8c4234138379c1899439e1f1f1e68c5cfca035ab395bf693b0758f3f20c80485bf7344a75da247ad138b72310e9063392ed7a90d4ab4b99175d01b0d0',   'Employee',         5,    1);
GO

-- Bước 4: Kiểm tra kết quả
SELECT UserID, Username, Role, EmployeeID, IsActive, CreatedAt FROM Users;
GO

PRINT '';
PRINT '=== HOÀN TẤT ===';
PRINT 'Tài khoản demo:';
PRINT '  admin           / Admin@123       (Admin)';
PRINT '  hr_manager      / Hr@123          (HR Manager)';
PRINT '  payroll_manager / Payroll@123     (Payroll Manager)';
PRINT '  employee        / Emp@123         (Employee)';
GO
