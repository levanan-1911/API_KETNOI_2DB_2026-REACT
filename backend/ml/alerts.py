"""
alerts.py
=========
Chuyển kết quả anomaly từ ML model thành cảnh báo có nghĩa nghiệp vụ.
"""
from datetime import datetime
from .features import load_salary_features, load_attendance_features
from .model    import detect_salary_anomalies, detect_attendance_anomalies


def _time_ago(month_str: str) -> str:
    """Chuyển 'YYYY-MM' thành chuỗi thời gian tương đối."""
    try:
        dt   = datetime.strptime(month_str, "%Y-%m")
        now  = datetime.now()
        diff = (now.year - dt.year) * 12 + (now.month - dt.month)
        if diff == 0:   return "Tháng này"
        if diff == 1:   return "Tháng trước"
        if diff <= 3:   return f"{diff} tháng trước"
        return dt.strftime("%m/%Y")
    except Exception:
        return month_str


def generate_alerts() -> list[dict]:
    """
    Chạy toàn bộ pipeline ML và trả về danh sách cảnh báo.
    Mỗi cảnh báo có: id, severity, title, description, time, category
    """
    alerts = []
    alert_id = 1

    # ── 1. Anomaly lương ──────────────────────────────────────
    sal_df = load_salary_features()
    if not sal_df.empty:
        sal_df = detect_salary_anomalies(sal_df)
        anomalies = sal_df[sal_df["anomaly"]].sort_values("anomaly_score")

        for _, row in anomalies.iterrows():
            name    = row.get("FullName", f"NV #{row['EmployeeID']}")
            month   = row.get("month", "")
            net     = float(row["NetSalary"])
            change  = float(row["net_change_pct"])
            ded_r   = float(row["deduction_ratio"])
            time_s  = _time_ago(month)

            # Phân loại nguyên nhân
            if net < 0:
                severity = "critical"
                title    = f"Lương thực nhận âm: {name}"
                desc     = (
                    f"Nhân viên {name} có lương thực nhận âm "
                    f"({net:,.0f} VNĐ) tháng {month}. "
                    f"Khấu trừ chiếm {ded_r*100:.0f}% lương cơ bản. Cần kiểm tra ngay."
                )
            elif abs(change) >= 40:
                severity = "critical"
                direction = "tăng" if change > 0 else "giảm"
                title    = f"Lương {direction} đột biến: {name}"
                desc     = (
                    f"Lương của {name} {direction} {abs(change):.0f}% "
                    f"so với tháng trước (tháng {month}). "
                    f"Lương thực nhận: {net:,.0f} VNĐ. Cần xác minh."
                )
            elif abs(change) >= 20:
                severity = "warning"
                direction = "tăng" if change > 0 else "giảm"
                title    = f"Biến động lương bất thường: {name}"
                desc     = (
                    f"Lương của {name} {direction} {abs(change):.0f}% "
                    f"tháng {month}. Lương thực nhận: {net:,.0f} VNĐ."
                )
            elif ded_r >= 0.5:
                severity = "warning"
                title    = f"Khấu trừ cao bất thường: {name}"
                desc     = (
                    f"Khấu trừ của {name} chiếm {ded_r*100:.0f}% lương cơ bản "
                    f"tháng {month}. Lương thực nhận: {net:,.0f} VNĐ."
                )
            else:
                severity = "info"
                title    = f"Lương bất thường (ML): {name}"
                desc     = (
                    f"Model phát hiện bất thường trong lương của {name} "
                    f"tháng {month}. Lương thực nhận: {net:,.0f} VNĐ."
                )

            alerts.append({
                "id":          alert_id,
                "severity":    severity,
                "title":       title,
                "description": desc,
                "time":        time_s,
                "category":    "salary",
                "employeeId":  int(row["EmployeeID"]),
                "read":        False,
            })
            alert_id += 1

    # ── 2. Anomaly chấm công ──────────────────────────────────
    att_df = load_attendance_features()
    if not att_df.empty:
        att_df = detect_attendance_anomalies(att_df)
        anomalies = att_df[att_df["anomaly"]].sort_values("anomaly_score")

        for _, row in anomalies.iterrows():
            name    = row.get("FullName", f"NV #{row['EmployeeID']}")
            month   = f"{int(row['month_num']):02d}/{int(row['year_num'])}"
            absent  = int(row["AbsentDays"])
            leave   = int(row["LeaveDays"])
            work    = int(row["WorkDays"])
            ot      = float(row["OvertimeHours"])
            ratio   = float(row["absent_ratio"])

            if absent >= 8:
                severity = "critical"
                title    = f"Vắng mặt nghiêm trọng: {name}"
                desc     = (
                    f"{name} vắng {absent} ngày không phép tháng {month} "
                    f"(chỉ làm {work} ngày). Cần xử lý kỷ luật."
                )
            elif absent >= 4 or ratio >= 0.2:
                severity = "warning"
                title    = f"Vắng mặt bất thường: {name}"
                desc     = (
                    f"{name} vắng {absent} ngày tháng {month}, "
                    f"chiếm {ratio*100:.0f}% tổng ngày làm. Cần theo dõi."
                )
            elif ot >= 40:
                severity = "warning"
                title    = f"Làm thêm giờ quá nhiều: {name}"
                desc     = (
                    f"{name} làm thêm {ot:.0f} giờ tháng {month}. "
                    f"Vượt ngưỡng cho phép, cần kiểm tra sức khỏe nhân viên."
                )
            elif leave >= 15:
                severity = "info"
                title    = f"Nghỉ phép dài: {name}"
                desc     = (
                    f"{name} nghỉ phép {leave} ngày tháng {month}. "
                    f"Chỉ làm {work} ngày."
                )
            else:
                severity = "info"
                title    = f"Chấm công bất thường (ML): {name}"
                desc     = (
                    f"Model phát hiện bất thường chấm công của {name} "
                    f"tháng {month}: {work} ngày làm, {absent} ngày vắng."
                )

            alerts.append({
                "id":          alert_id,
                "severity":    severity,
                "title":       title,
                "description": desc,
                "time":        month,
                "category":    "attendance",
                "employeeId":  int(row["EmployeeID"]),
                "read":        False,
            })
            alert_id += 1

    # ── 3. Rule-based bổ sung ─────────────────────────────────
    # Phòng ban không có trưởng phòng
    try:
        from config import get_sqlserver_connection
        sql = get_sqlserver_connection()
        cur = sql.cursor()
        cur.execute("""
            SELECT d.DepartmentName
            FROM Departments d
            WHERE NOT EXISTS (
                SELECT 1 FROM Employees e
                WHERE e.DepartmentID = d.DepartmentID
                  AND e.PositionID = 2
                  AND e.Status = 'Active'
            )
        """)
        no_manager = [r[0] for r in cur.fetchall()]
        for dept in no_manager:
            alerts.append({
                "id":          alert_id,
                "severity":    "warning",
                "title":       f"Phòng ban thiếu trưởng phòng: {dept}",
                "description": f"{dept} hiện không có trưởng phòng đang hoạt động. Cần bổ nhiệm.",
                "time":        "Hiện tại",
                "category":    "hr",
                "employeeId":  None,
                "read":        False,
            })
            alert_id += 1
    except Exception:
        pass

    # Sắp xếp: critical trước, warning sau, info cuối
    order = {"critical": 0, "warning": 1, "info": 2}
    alerts.sort(key=lambda x: order.get(x["severity"], 3))

    return alerts
