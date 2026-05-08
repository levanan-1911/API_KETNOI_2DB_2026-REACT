-- ============================================================
-- Cập nhật password hash cho bảng Users (HUMAN_2025)
-- Chạy script này trong SQL Server Management Studio
-- ============================================================
USE HUMAN_2025;
GO

-- admin / Admin@123
UPDATE Users SET PasswordHash = 'scrypt:32768:8:1$OFsGxWRsqpLQjDhb$904bccb3a94eb41e319ee2766dbade3e86a319f7916a4af96795866c994017b464accbea9ebd977ca12becb75d929fe95c3aca19bab3e7047f934d4b76d6f80f'
WHERE Username = 'admin';

-- hr_manager / Hr@123
UPDATE Users SET PasswordHash = 'scrypt:32768:8:1$B4Mv2tDPs9XgaKWt$8910005aa6f5f348d2bab0662144abe949b72fb48caae7013812355e476956c022f70c1aa0b1a1117dc2dbe5128c6702e9cbd412082baafa76e913cf8ed6bcc5'
WHERE Username = 'hr_manager';

-- payroll_manager / Payroll@123
UPDATE Users SET PasswordHash = 'scrypt:32768:8:1$qDPso2QFFAAEAbqc$f2ef3093fe1e740a7bec3b13af75551043b6d5b5572679622ad5869ded1eadba0114b5eaa749c517b9f127a424a1d7b4ceadfcecd9d0f971234480b2f4bdcf9e'
WHERE Username = 'payroll_manager';

-- Thêm user employee nếu chưa có / Emp@123
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'employee')
    INSERT INTO Users (Username, PasswordHash, Role)
    VALUES ('employee',
            'scrypt:32768:8:1$xasqNkiVQ2JRzzJ3$76f410f8c4234138379c1899439e1f1f1e68c5cfca035ab395bf693b0758f3f20c80485bf7344a75da247ad138b72310e9063392ed7a90d4ab4b99175d01b0d0',
            'Employee');
GO

-- Kiểm tra kết quả
SELECT UserID, Username, Role, IsActive, CreatedAt FROM Users;
GO
