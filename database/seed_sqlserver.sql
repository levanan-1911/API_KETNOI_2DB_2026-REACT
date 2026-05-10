-- ============================================================
-- SEED DATA: HUMAN_2025 (SQL Server)
-- 100 nhân viên (EmployeeID 6-105) + cổ tức 40 nhân viên
-- Chạy trực tiếp trên SQL Server, không xóa dữ liệu cũ
-- ============================================================

USE HUMAN_2025;
GO

-- ============================================================
-- PHẦN 1: INSERT 100 NHÂN VIÊN
-- EmployeeID: 6 → 105
-- DepartmentID 1-5: mỗi phòng 20 người
-- PositionID 1-5: phân bổ đều trong mỗi phòng (4 người/chức vụ/phòng)
-- Status: 80 Active, 10 OnLeave, 10 Inactive
-- ============================================================

SET IDENTITY_INSERT Employees ON;
GO

INSERT INTO Employees
    (EmployeeID, FullName, DateOfBirth, Gender, PhoneNumber, Email, HireDate, DepartmentID, PositionID, Status)
VALUES
-- ===================== PHÒNG BAN 1 (DepartmentID=1) =====================
(6,   N'Nguyễn Thị Hoa',    '1985-03-12', N'Nữ',  '0901100001', 'nguyenthihoa1@company.vn',    '2018-02-05', 1, 1, 'Active'),
(7,   N'Trần Văn Bảo',      '1990-07-22', N'Nam', '0901100002', 'tranvanbao2@company.vn',       '2018-04-10', 1, 2, 'Active'),
(8,   N'Lê Thị Cẩm',        '1992-11-08', N'Nữ',  '0901100003', 'lethicam3@company.vn',         '2018-06-15', 1, 3, 'Active'),
(9,   N'Phạm Văn Dũng',     '1988-05-30', N'Nam', '0901100004', 'phamvandung4@company.vn',      '2018-08-20', 1, 4, 'Active'),
(10,  N'Hoàng Thị Oanh',    '1995-09-14', N'Nữ',  '0901100005', 'hoangthioanh5@company.vn',    '2018-10-01', 1, 5, 'Active'),
(11,  N'Vũ Minh Khoa',      '1987-01-25', N'Nam', '0901100006', 'vuminhkhoa6@company.vn',       '2019-01-07', 1, 1, 'Active'),
(12,  N'Đặng Thị Lan',      '1993-06-18', N'Nữ',  '0901100007', 'dangthilan7@company.vn',       '2019-03-12', 1, 2, 'Active'),
(13,  N'Bùi Văn Mạnh',      '1991-10-05', N'Nam', '0901100008', 'buivanmanh8@company.vn',       '2019-05-20', 1, 3, 'Active'),
(14,  N'Ngô Thị Ngọc',      '1994-02-28', N'Nữ',  '0901100009', 'ngothingoc9@company.vn',       '2019-07-15', 1, 4, 'Active'),
(15,  N'Đinh Văn Phúc',     '1989-08-17', N'Nam', '0901100010', 'dinhvanphuc10@company.vn',     '2019-09-01', 1, 5, 'Active'),
(16,  N'Trịnh Thị Quỳnh',   '1996-04-09', N'Nữ',  '0901100011', 'trinhthiquynh11@company.vn',  '2019-11-10', 1, 1, 'Active'),
(17,  N'Lý Văn Sơn',        '1986-12-22', N'Nam', '0901100012', 'lyvanson12@company.vn',        '2020-01-15', 1, 2, 'Active'),
(18,  N'Phan Thị Tâm',      '1998-07-03', N'Nữ',  '0901100013', 'phanthitam13@company.vn',      '2020-03-20', 1, 3, 'Active'),
(19,  N'Cao Văn Tuấn',      '1990-03-16', N'Nam', '0901100014', 'caovantuan14@company.vn',     '2020-05-05', 1, 4, 'OnLeave'),
(20,  N'Hồ Thị Uyên',       '1993-09-27', N'Nữ',  '0901100015', 'hothiuyen15@company.vn',       '2020-07-10', 1, 5, 'Active'),
(21,  N'Dương Văn Vinh',    '1988-11-14', N'Nam', '0901100016', 'duongvanvinh16@company.vn',    '2020-09-01', 1, 1, 'Active'),
(22,  N'Tô Thị Xuân',       '1995-05-08', N'Nữ',  '0901100017', 'tothixuan17@company.vn',       '2020-11-15', 1, 2, 'Inactive'),
(23,  N'Mai Văn Yên',       '1992-01-31', N'Nam', '0901100018', 'maivanyen18@company.vn',        '2021-02-01', 1, 3, 'OnLeave'),
(24,  N'Lưu Thị Ánh',       '1997-06-20', N'Nữ',  '0901100019', 'luuthianh19@company.vn',       '2021-04-10', 1, 4, 'Active'),
(25,  N'Kiều Văn Bình',     '1984-10-11', N'Nam', '0901100020', 'kieuvanbinh20@company.vn',     '2021-06-15', 1, 5, 'Inactive'),
-- ===================== PHÒNG BAN 2 (DepartmentID=2) =====================
(26,  N'Nguyễn Thị Châu',   '1991-02-14', N'Nữ',  '0901100021', 'nguyenthichau21@company.vn',  '2018-03-01', 2, 1, 'Active'),
(27,  N'Trần Văn Đạt',      '1987-08-25', N'Nam', '0901100022', 'tranvandat22@company.vn',      '2018-05-10', 2, 2, 'Active'),
(28,  N'Lê Thị Ếm',         '1994-12-07', N'Nữ',  '0901100023', 'lethiem23@company.vn',          '2018-07-20', 2, 3, 'Active'),
(29,  N'Phạm Văn Giang',    '1989-04-19', N'Nam', '0901100024', 'phamvangiang24@company.vn',    '2018-09-05', 2, 4, 'Active'),
(30,  N'Hoàng Thị Hằng',    '1996-10-02', N'Nữ',  '0901100025', 'hoangthihang25@company.vn',   '2018-11-15', 2, 5, 'Active'),
(31,  N'Vũ Văn Hùng',       '1990-06-13', N'Nam', '0901100026', 'vuvanhung26@company.vn',       '2019-02-01', 2, 1, 'Active'),
(32,  N'Đặng Thị Khánh',    '1993-01-28', N'Nữ',  '0901100027', 'dangthikhanh27@company.vn',   '2019-04-10', 2, 2, 'Active'),
(33,  N'Bùi Văn Long',      '1988-07-09', N'Nam', '0901100028', 'buivanlong28@company.vn',      '2019-06-20', 2, 3, 'Active'),
(34,  N'Ngô Thị Mai',       '1995-03-22', N'Nữ',  '0901100029', 'ngothimai29@company.vn',       '2019-08-05', 2, 4, 'OnLeave'),
(35,  N'Đinh Văn Nam',      '1991-09-15', N'Nam', '0901100030', 'dinhvannam30@company.vn',      '2019-10-15', 2, 5, 'Active'),
(36,  N'Trịnh Thị Oanh',    '1986-05-04', N'Nữ',  '0901100031', 'trinhthioanh31@company.vn',   '2019-12-01', 2, 1, 'Active'),
(37,  N'Lý Văn Phong',      '1998-11-17', N'Nam', '0901100032', 'lyvanphong32@company.vn',      '2020-02-10', 2, 2, 'Active'),
(38,  N'Phan Thị Quế',      '1992-07-30', N'Nữ',  '0901100033', 'phanthique33@company.vn',      '2020-04-15', 2, 3, 'Active'),
(39,  N'Cao Văn Rạng',      '1989-02-11', N'Nam', '0901100034', 'caovanrang34@company.vn',      '2020-06-01', 2, 4, 'Inactive'),
(40,  N'Hồ Thị Sen',        '1994-08-24', N'Nữ',  '0901100035', 'hothisen35@company.vn',        '2020-08-10', 2, 5, 'Active'),
(41,  N'Dương Văn Thắng',   '1987-04-06', N'Nam', '0901100036', 'duongvanthang36@company.vn',   '2020-10-20', 2, 1, 'Active'),
(42,  N'Tô Thị Thủy',       '1996-12-19', N'Nữ',  '0901100037', 'tothithuy37@company.vn',       '2021-01-05', 2, 2, 'Active'),
(43,  N'Mai Văn Toàn',      '1990-08-01', N'Nam', '0901100038', 'maivantoan38@company.vn',      '2021-03-15', 2, 3, 'OnLeave'),
(44,  N'Lưu Thị Trang',     '1993-03-14', N'Nữ',  '0901100039', 'luuthitrang39@company.vn',     '2021-05-20', 2, 4, 'Active'),
(45,  N'Kiều Văn Trung',    '1985-09-27', N'Nam', '0901100040', 'kieuvantrung40@company.vn',    '2021-07-10', 2, 5, 'Inactive'),
-- ===================== PHÒNG BAN 3 (DepartmentID=3) =====================
(46,  N'Nguyễn Văn Tuấn',   '1992-01-08', N'Nam', '0901100041', 'nguyenvantuan41@company.vn',   '2018-04-01', 3, 1, 'Active'),
(47,  N'Trần Thị Vân',      '1988-07-21', N'Nữ',  '0901100042', 'tranthivan42@company.vn',      '2018-06-10', 3, 2, 'Active'),
(48,  N'Lê Văn Việt',       '1995-11-04', N'Nam', '0901100043', 'levanviet43@company.vn',        '2018-08-20', 3, 3, 'Active'),
(49,  N'Phạm Thị Xuân',     '1990-05-17', N'Nữ',  '0901100044', 'phamthixuan44@company.vn',     '2018-10-05', 3, 4, 'Active'),
(50,  N'Hoàng Văn Yên',     '1986-01-30', N'Nam', '0901100045', 'hoangvanyen45@company.vn',     '2018-12-15', 3, 5, 'Active'),
(51,  N'Vũ Thị Ánh',        '1997-08-12', N'Nữ',  '0901100046', 'vuthianh46@company.vn',        '2019-02-20', 3, 1, 'Active'),
(52,  N'Đặng Văn Bắc',      '1991-04-25', N'Nam', '0901100047', 'dangvanbac47@company.vn',      '2019-04-05', 3, 2, 'Active'),
(53,  N'Bùi Thị Cúc',       '1994-10-08', N'Nữ',  '0901100048', 'buithicuc48@company.vn',       '2019-06-15', 3, 3, 'Active'),
(54,  N'Ngô Văn Duy',       '1989-06-21', N'Nam', '0901100049', 'ngovanduy49@company.vn',       '2019-08-01', 3, 4, 'OnLeave'),
(55,  N'Đinh Thị Dịu',      '1996-02-03', N'Nữ',  '0901100050', 'dinhthidiu50@company.vn',      '2019-10-10', 3, 5, 'Active'),
(56,  N'Trịnh Văn Đức',     '1988-08-16', N'Nam', '0901100051', 'trinhvanduc51@company.vn',     '2019-12-20', 3, 1, 'Active'),
(57,  N'Lý Thị Giang',      '1993-04-29', N'Nữ',  '0901100052', 'lythigiang52@company.vn',      '2020-02-05', 3, 2, 'Active'),
(58,  N'Phan Văn Hải',      '1990-12-12', N'Nam', '0901100053', 'phanvanhai53@company.vn',      '2020-04-10', 3, 3, 'Inactive'),
(59,  N'Cao Thị Hiền',      '1987-06-25', N'Nữ',  '0901100054', 'caothihien54@company.vn',      '2020-06-15', 3, 4, 'Active'),
(60,  N'Hồ Văn Hòa',        '1999-02-07', N'Nam', '0901100055', 'hovanhoa55@company.vn',        '2020-08-20', 3, 5, 'Active'),
(61,  N'Dương Thị Hương',   '1992-08-20', N'Nữ',  '0901100056', 'duongthihuong56@company.vn',  '2020-10-05', 3, 1, 'Active'),
(62,  N'Tô Văn Khải',       '1985-04-03', N'Nam', '0901100057', 'tovankhai57@company.vn',       '2020-12-10', 3, 2, 'Active'),
(63,  N'Mai Thị Linh',      '1998-10-16', N'Nữ',  '0901100058', 'maithilinh58@company.vn',      '2021-02-15', 3, 3, 'OnLeave'),
(64,  N'Lưu Văn Lộc',       '1991-06-29', N'Nam', '0901100059', 'luuvanloc59@company.vn',       '2021-04-20', 3, 4, 'Active'),
(65,  N'Kiều Thị Ly',       '1994-01-11', N'Nữ',  '0901100060', 'kieuthily60@company.vn',      '2021-06-05', 3, 5, 'Inactive'),
-- ===================== PHÒNG BAN 4 (DepartmentID=4) =====================
(66,  N'Nguyễn Văn Minh',   '1989-03-24', N'Nam', '0901100061', 'nguyenvanminh61@company.vn',   '2018-05-01', 4, 1, 'Active'),
(67,  N'Trần Thị Nga',      '1993-09-07', N'Nữ',  '0901100062', 'tranthinga62@company.vn',      '2018-07-10', 4, 2, 'Active'),
(68,  N'Lê Văn Nghĩa',      '1990-05-20', N'Nam', '0901100063', 'levannghia63@company.vn',      '2018-09-20', 4, 3, 'Active'),
(69,  N'Phạm Thị Nhung',    '1986-01-02', N'Nữ',  '0901100064', 'phamthinung64@company.vn',    '2018-11-05', 4, 4, 'Active'),
(70,  N'Hoàng Văn Ninh',    '1997-07-15', N'Nam', '0901100065', 'hoangvanninh65@company.vn',    '2019-01-15', 4, 5, 'Active'),
(71,  N'Vũ Thị Nụ',         '1991-03-28', N'Nữ',  '0901100066', 'vuthinu66@company.vn',         '2019-03-20', 4, 1, 'Active'),
(72,  N'Đặng Văn Phát',     '1988-11-10', N'Nam', '0901100067', 'dangvanphat67@company.vn',     '2019-05-05', 4, 2, 'Active'),
(73,  N'Bùi Thị Phương',    '1995-07-23', N'Nữ',  '0901100068', 'buithiphuong68@company.vn',   '2019-07-10', 4, 3, 'OnLeave'),
(74,  N'Ngô Văn Quân',      '1992-03-05', N'Nam', '0901100069', 'ngovanquan69@company.vn',      '2019-09-15', 4, 4, 'Active'),
(75,  N'Đinh Thị Quyên',    '1987-09-18', N'Nữ',  '0901100070', 'dinhthiquyen70@company.vn',   '2019-11-20', 4, 5, 'Active'),
(76,  N'Trịnh Văn Quý',     '1999-05-01', N'Nam', '0901100071', 'trinhvanquy71@company.vn',     '2020-01-10', 4, 1, 'Active'),
(77,  N'Lý Thị Ry',         '1993-11-14', N'Nữ',  '0901100072', 'lythiry72@company.vn',         '2020-03-15', 4, 2, 'Inactive'),
(78,  N'Phan Văn Sang',     '1990-07-27', N'Nam', '0901100073', 'phanvansang73@company.vn',     '2020-05-20', 4, 3, 'Active'),
(79,  N'Cao Thị Sim',       '1985-02-09', N'Nữ',  '0901100074', 'caothisim74@company.vn',       '2020-07-05', 4, 4, 'Active'),
(80,  N'Hồ Văn Sơn',        '1998-08-22', N'Nam', '0901100075', 'hovanson75@company.vn',        '2020-09-10', 4, 5, 'Active'),
(81,  N'Dương Thị Thi',     '1991-04-04', N'Nữ',  '0901100076', 'duongthithi76@company.vn',    '2020-11-15', 4, 1, 'Active'),
(82,  N'Tô Văn Thịnh',      '1988-12-17', N'Nam', '0901100077', 'tovanthinh77@company.vn',      '2021-01-20', 4, 2, 'Active'),
(83,  N'Mai Thị Thu',       '1996-06-30', N'Nữ',  '0901100078', 'maithithu78@company.vn',       '2021-03-05', 4, 3, 'OnLeave'),
(84,  N'Lưu Văn Tiến',      '1989-01-12', N'Nam', '0901100079', 'luuvantien79@company.vn',      '2021-05-10', 4, 4, 'Active'),
(85,  N'Kiều Thị Tú',       '1994-07-25', N'Nữ',  '0901100080', 'kieuthitu80@company.vn',      '2021-07-15', 4, 5, 'Inactive'),
-- ===================== PHÒNG BAN 5 (DepartmentID=5) =====================
(86,  N'Nguyễn Văn Tùng',   '1990-09-07', N'Nam', '0901100081', 'nguyenvantung81@company.vn',   '2018-06-01', 5, 1, 'Active'),
(87,  N'Trần Thị Tuyết',    '1987-03-20', N'Nữ',  '0901100082', 'tranthituyet82@company.vn',    '2018-08-10', 5, 2, 'Active'),
(88,  N'Lê Văn Uy',         '1994-11-02', N'Nam', '0901100083', 'levanuy83@company.vn',          '2018-10-20', 5, 3, 'Active'),
(89,  N'Phạm Thị Vui',      '1991-07-15', N'Nữ',  '0901100084', 'phamthivui84@company.vn',      '2018-12-05', 5, 4, 'Active'),
(90,  N'Hoàng Văn Vương',   '1986-03-28', N'Nam', '0901100085', 'hoangvanvuong85@company.vn',   '2019-02-15', 5, 5, 'Active'),
(91,  N'Vũ Thị Xanh',       '1998-09-10', N'Nữ',  '0901100086', 'vuthixanh86@company.vn',       '2019-04-20', 5, 1, 'Active'),
(92,  N'Đặng Văn Xuân',     '1992-05-23', N'Nam', '0901100087', 'dangvanxuan87@company.vn',     '2019-06-05', 5, 2, 'Active'),
(93,  N'Bùi Thị Yến',       '1989-01-05', N'Nữ',  '0901100088', 'buithiyen88@company.vn',       '2019-08-10', 5, 3, 'OnLeave'),
(94,  N'Ngô Văn Yên',       '1996-07-18', N'Nam', '0901100089', 'ngovanyen89@company.vn',       '2019-10-15', 5, 4, 'Active'),
(95,  N'Đinh Thị Yêu',      '1993-03-31', N'Nữ',  '0901100090', 'dinhthiyeu90@company.vn',      '2019-12-20', 5, 5, 'Active'),
(96,  N'Trịnh Văn Zin',     '1988-10-13', N'Nam', '0901100091', 'trinhvanzin91@company.vn',     '2020-02-25', 5, 1, 'Active'),
(97,  N'Lý Thị Bông',       '1995-06-26', N'Nữ',  '0901100092', 'lythibong92@company.vn',       '2020-04-10', 5, 2, 'Inactive'),
(98,  N'Phan Văn Cảnh',     '1991-02-08', N'Nam', '0901100093', 'phanvancanh93@company.vn',     '2020-06-15', 5, 3, 'Active'),
(99,  N'Cao Thị Dào',       '1987-08-21', N'Nữ',  '0901100094', 'caothidao94@company.vn',       '2020-08-20', 5, 4, 'Active'),
(100, N'Hồ Văn Đăng',       '1999-04-03', N'Nam', '0901100095', 'hovandang95@company.vn',       '2020-10-05', 5, 5, 'Active'),
(101, N'Dương Thị Đào',     '1992-12-16', N'Nữ',  '0901100096', 'duongthidao96@company.vn',    '2020-12-10', 5, 1, 'Active'),
(102, N'Tô Văn Điền',       '1985-06-29', N'Nam', '0901100097', 'tovandien97@company.vn',       '2021-02-15', 5, 2, 'Active'),
(103, N'Mai Thị Đông',      '1998-01-11', N'Nữ',  '0901100098', 'maithidong98@company.vn',      '2021-04-20', 5, 3, 'Active'),
(104, N'Lưu Văn Đức',       '1990-07-24', N'Nam', '0901100099', 'luuvanduc99@company.vn',       '2021-06-05', 5, 4, 'OnLeave'),
(105, N'Kiều Thị Đường',    '1993-03-06', N'Nữ',  '0901100100', 'kieuthiduong100@company.vn',  '2021-08-10', 5, 5, 'Inactive');
GO

SET IDENTITY_INSERT Employees OFF;
GO

PRINT 'Đã insert 100 nhân viên (EmployeeID 6-105) thành công.';
GO

-- ============================================================
-- PHẦN 2: INSERT CỔ TỨC (DIVIDENDS)
-- 40 nhân viên ngẫu nhiên (EmployeeID 6-105)
-- Năm 2024: 20 nhân viên | Năm 2025: 20 nhân viên
-- Số tiền: 2,000,000 - 15,000,000 VNĐ
-- DividendID bắt đầu từ 4 (đã có 3 bản ghi mẫu)
-- ============================================================

SET IDENTITY_INSERT Dividends ON;
GO

INSERT INTO Dividends (DividendID, EmployeeID, Year, Amount, Note) VALUES
-- ===================== NĂM 2024 (20 nhân viên) =====================
(4,  6,   2024,  8500000.00, N'Cổ tức năm 2024'),
(5,  9,   2024,  5200000.00, N'Cổ tức năm 2024'),
(6,  12,  2024, 11000000.00, N'Cổ tức năm 2024'),
(7,  15,  2024,  3800000.00, N'Cổ tức năm 2024'),
(8,  18,  2024,  7600000.00, N'Cổ tức năm 2024'),
(9,  21,  2024,  9300000.00, N'Cổ tức năm 2024'),
(10, 26,  2024,  4500000.00, N'Cổ tức năm 2024'),
(11, 29,  2024, 12500000.00, N'Cổ tức năm 2024'),
(12, 33,  2024,  6700000.00, N'Cổ tức năm 2024'),
(13, 37,  2024,  2800000.00, N'Cổ tức năm 2024'),
(14, 41,  2024, 10200000.00, N'Cổ tức năm 2024'),
(15, 46,  2024,  5900000.00, N'Cổ tức năm 2024'),
(16, 50,  2024, 14000000.00, N'Cổ tức năm 2024'),
(17, 54,  2024,  3200000.00, N'Cổ tức năm 2024'),
(18, 58,  2024,  7100000.00, N'Cổ tức năm 2024'),
(19, 62,  2024,  9800000.00, N'Cổ tức năm 2024'),
(20, 67,  2024,  4100000.00, N'Cổ tức năm 2024'),
(21, 72,  2024, 13500000.00, N'Cổ tức năm 2024'),
(22, 78,  2024,  6300000.00, N'Cổ tức năm 2024'),
(23, 83,  2024,  8900000.00, N'Cổ tức năm 2024'),
-- ===================== NĂM 2025 (20 nhân viên) =====================
(24, 7,   2025,  9700000.00, N'Cổ tức năm 2025'),
(25, 11,  2025,  5500000.00, N'Cổ tức năm 2025'),
(26, 16,  2025, 12000000.00, N'Cổ tức năm 2025'),
(27, 20,  2025,  3500000.00, N'Cổ tức năm 2025'),
(28, 24,  2025,  7800000.00, N'Cổ tức năm 2025'),
(29, 27,  2025, 10500000.00, N'Cổ tức năm 2025'),
(30, 31,  2025,  4800000.00, N'Cổ tức năm 2025'),
(31, 35,  2025, 15000000.00, N'Cổ tức năm 2025'),
(32, 40,  2025,  6200000.00, N'Cổ tức năm 2025'),
(33, 44,  2025,  2500000.00, N'Cổ tức năm 2025'),
(34, 48,  2025, 11500000.00, N'Cổ tức năm 2025'),
(35, 53,  2025,  5000000.00, N'Cổ tức năm 2025'),
(36, 57,  2025,  8200000.00, N'Cổ tức năm 2025'),
(37, 61,  2025, 13000000.00, N'Cổ tức năm 2025'),
(38, 66,  2025,  3900000.00, N'Cổ tức năm 2025'),
(39, 71,  2025,  7400000.00, N'Cổ tức năm 2025'),
(40, 76,  2025,  9100000.00, N'Cổ tức năm 2025'),
(41, 81,  2025, 14500000.00, N'Cổ tức năm 2025'),
(42, 87,  2025,  6800000.00, N'Cổ tức năm 2025'),
(43, 93,  2025,  2000000.00, N'Cổ tức năm 2025');
GO

SET IDENTITY_INSERT Dividends OFF;
GO

PRINT 'Đã insert 40 bản ghi cổ tức (20 năm 2024 + 20 năm 2025) thành công.';
GO

-- ============================================================
-- KIỂM TRA KẾT QUẢ SAU KHI SEED
-- ============================================================
SELECT 'Tổng nhân viên'        AS [Thống kê], COUNT(*) AS [Số lượng] FROM Employees
UNION ALL
SELECT 'Nhân viên Active',       COUNT(*) FROM Employees WHERE Status = 'Active'
UNION ALL
SELECT 'Nhân viên OnLeave',      COUNT(*) FROM Employees WHERE Status = 'OnLeave'
UNION ALL
SELECT 'Nhân viên Inactive',     COUNT(*) FROM Employees WHERE Status = 'Inactive'
UNION ALL
SELECT 'Tổng bản ghi cổ tức',   COUNT(*) FROM Dividends
UNION ALL
SELECT 'Cổ tức năm 2024',        COUNT(*) FROM Dividends WHERE Year = 2024
UNION ALL
SELECT 'Cổ tức năm 2025',        COUNT(*) FROM Dividends WHERE Year = 2025;
GO

PRINT 'Seed data HUMAN_2025 hoàn tất!';
GO
