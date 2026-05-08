-- ============================================================
-- SEED DATA: Chấm công & Nghỉ phép tháng 5/2026
-- Database: payroll_2026 (MySQL)
-- ============================================================

USE payroll_2026;

-- ============================================================
-- CHẤM CÔNG THÁNG 5/2026
-- Tháng 5/2026 có 22 ngày làm việc (trừ T7, CN)
-- ============================================================
INSERT INTO attendance (EmployeeID, AttendanceMonth, AttendanceYear, WorkDays, LeaveDays, AbsentDays, OvertimeHours, Note)
VALUES
    (1, 5, 2026, 22, 0, 0,  10.0, 'Hoàn thành tốt'),
    (2, 5, 2026, 20, 2, 0,   0.0, 'Nghỉ phép 2 ngày'),
    (3, 5, 2026, 21, 0, 1,  16.0, 'Vắng 1 ngày không phép'),
    (4, 5, 2026, 22, 0, 0,   0.0, NULL),
    (5, 5, 2026, 19, 1, 2,   4.5, 'Vắng 2 ngày')
ON DUPLICATE KEY UPDATE
    WorkDays      = VALUES(WorkDays),
    LeaveDays     = VALUES(LeaveDays),
    AbsentDays    = VALUES(AbsentDays),
    OvertimeHours = VALUES(OvertimeHours),
    Note          = VALUES(Note);

-- ============================================================
-- YÊU CẦU NGHỈ PHÉP (tháng 5/2026)
-- ============================================================
INSERT INTO leave_requests (EmployeeID, StartDate, EndDate, LeaveDays, Reason, Status, ApprovedAt, RejectReason)
VALUES
    -- Đã duyệt
    (2, '2026-05-05', '2026-05-06', 2, 'Việc gia đình',          'Approved', '2026-05-04 08:30:00', NULL),
    (4, '2026-05-12', '2026-05-12', 1, 'Khám sức khoẻ định kỳ', 'Approved', '2026-05-10 09:00:00', NULL),
    -- Chờ duyệt
    (1, '2026-05-19', '2026-05-20', 2, 'Du lịch cùng gia đình',  'Pending',  NULL, NULL),
    (5, '2026-05-26', '2026-05-26', 1, 'Việc cá nhân',           'Pending',  NULL, NULL),
    -- Từ chối
    (3, '2026-05-08', '2026-05-09', 2, 'Nghỉ dưỡng bệnh',        'Rejected', NULL, 'Không đủ ngày phép còn lại');

SELECT 'Seed attendance & leave_requests tháng 5/2026 thành công!' AS Message;
