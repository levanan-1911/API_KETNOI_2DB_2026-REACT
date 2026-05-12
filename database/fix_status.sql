-- ============================================================
-- Fix: Chuẩn hóa cột Status trong bảng Employees
-- Chuyển tất cả về tiếng Anh: Active / OnLeave / Inactive
-- ============================================================

USE HUMAN_2025;
GO

-- Xem trước khi sửa
SELECT Status, COUNT(*) AS SoLuong
FROM Employees
GROUP BY Status
ORDER BY Status;
GO

-- Chuẩn hóa
UPDATE Employees SET Status = 'Active'   WHERE Status IN (N'Đang làm việc', N'Thử việc', N'Thực tập');
UPDATE Employees SET Status = 'OnLeave'  WHERE Status IN (N'Nghỉ phép');
UPDATE Employees SET Status = 'Inactive' WHERE Status IN (N'Đã nghỉ việc', N'Đã nghỉ');
GO

-- Kiểm tra sau khi sửa
SELECT Status, COUNT(*) AS SoLuong
FROM Employees
GROUP BY Status
ORDER BY Status;
GO

PRINT 'Chuẩn hóa Status hoàn tất!';
GO
