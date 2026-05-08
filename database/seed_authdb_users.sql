-- ============================================================
-- Cập nhật PasswordHash thật cho AuthDB.Users
-- Chạy sau khi đã tạo AuthDB bằng AuthDB.sql
-- ============================================================
USE AuthDB;
GO

-- Xóa hash placeholder, thay bằng hash thật (werkzeug scrypt)
-- admin / Admin@123
UPDATE Users SET PasswordHash = 'scrypt:32768:8:1$jM9U3lfC3FuYB884$4c508f7342543f7dd2995d9637c60b348de19d53d7d3c1e7c511c95276753cac36d667e4786427a626ea954f2c73af9b940780d79c9e5604006eb3876570a2e0'
WHERE Username = 'admin';

-- hr_manager / Hr@123
UPDATE Users SET PasswordHash = 'scrypt:32768:8:1$Mhu1eOFc09K6ynUu$7636787470275c30e1cf38df8313252261d6d94af769091de3692a4e0da701bb3adcf270f6581a828af4d92df5922ebe776f429c54f88a0acc5f8ecdc71e0cff'
WHERE Username = 'hr_manager';

-- payroll_manager / Payroll@123
UPDATE Users SET PasswordHash = 'scrypt:32768:8:1$CMa8M1D1AxYcGwe7$9c47e088f135957e56c3fcbcf897724af7548668d050354b39d9222430b8f8756fb890e163601decabe20eff1ef8120efa867566026ed6803b3eefb35960a6d5'
WHERE Username = 'payroll_manager';

-- employee / Emp@123
UPDATE Users SET PasswordHash = 'scrypt:32768:8:1$GQ3Ms6dvF4JfWTpk$8715e683e4212fa95d298bffe54bd6d52bbbf7416f6782dcd7e6bd229c04e43727860f155184c5bf39e3c6663fe0e6a3771f2c575e5c70505265c95358f4d1e6'
WHERE Username = 'employee';

GO

-- Kiểm tra kết quả
SELECT u.UserID, u.Username, u.FullName, u.Email, u.IsActive, r.RoleName
FROM Users u
LEFT JOIN Users_Roles ur ON u.UserID = ur.UserID
LEFT JOIN Roles r ON ur.RoleID = r.RoleID;
GO

PRINT 'Tài khoản demo:';
PRINT '  admin           / Admin@123';
PRINT '  hr_manager      / Hr@123';
PRINT '  payroll_manager / Payroll@123';
PRINT '  employee        / Emp@123';
GO
