from flask import Blueprint, jsonify, request
from config import get_sqlserver_connection, get_mysql_connection
import re
from datetime import date

router = Blueprint("router", __name__)

# ============================================================
# DEPARTMENTS
# ============================================================

@router.route("/api/departments", methods=["GET"])
def get_departments():
    """Lấy danh sách phòng ban từ HUMAN_2025"""
    sql = get_sqlserver_connection()
    cur = sql.cursor()
    cur.execute("SELECT DepartmentID, DepartmentName FROM Departments ORDER BY DepartmentName")
    rows = [{"DepartmentID": r[0], "DepartmentName": r[1]} for r in cur.fetchall()]
    return jsonify(rows)


@router.route("/api/departments/stats", methods=["GET"])
def get_departments_stats():
    """
    Lấy phòng ban kèm thống kê:
    - Số nhân viên, trưởng phòng (PositionID=2), lương TB từ MySQL
    """
    sql = get_sqlserver_connection()
    cur = sql.cursor()

    # Phòng ban + số nhân viên + trưởng phòng (người có PositionID=2 trong phòng)
    cur.execute("""
        SELECT
            d.DepartmentID,
            d.DepartmentName,
            COUNT(e.EmployeeID)                          AS TotalEmployees,
            MAX(CASE WHEN e.PositionID = 2
                     THEN e.FullName END)                AS Manager
        FROM Departments d
        LEFT JOIN Employees e ON d.DepartmentID = e.DepartmentID
            AND e.Status != 'Inactive'
        GROUP BY d.DepartmentID, d.DepartmentName
        ORDER BY TotalEmployees DESC
    """)
    depts = []
    for r in cur.fetchall():
        depts.append({
            "DepartmentID":   r[0],
            "DepartmentName": r[1],
            "Description":    "",
            "TotalEmployees": r[2],
            "Manager":        r[3] or "Chưa có",
        })

    # Lương TB theo phòng ban từ MySQL
    my = get_mysql_connection()
    my_cur = my.cursor(dictionary=True)
    my_cur.execute("""
        SELECT ep.DepartmentID,
               AVG(s.NetSalary) AS AvgSalary
        FROM salaries s
        JOIN employees_payroll ep ON s.EmployeeID = ep.EmployeeID
        WHERE s.SalaryMonth = (SELECT MAX(SalaryMonth) FROM salaries)
        GROUP BY ep.DepartmentID
    """)
    salary_map = {r["DepartmentID"]: float(r["AvgSalary"] or 0)
                  for r in my_cur.fetchall()}

    for d in depts:
        d["AvgSalary"] = salary_map.get(d["DepartmentID"], 0)

    return jsonify({"status": "success", "data": depts})


@router.route("/api/departments/<int:dept_id>/employees", methods=["GET"])
def get_department_employees(dept_id):
    """
    Lấy danh sách nhân viên của 1 phòng ban cụ thể.
    Kết hợp thông tin từ HUMAN_2025 + lương tháng gần nhất từ payroll_2026.
    """
    sql = get_sqlserver_connection()
    cur = sql.cursor()
    cur.execute("""
        SELECT
            e.EmployeeID,
            e.FullName,
            e.Gender,
            e.Email,
            e.PhoneNumber,
            e.HireDate,
            e.Status,
            p.PositionName
        FROM Employees e
        LEFT JOIN Positions p ON e.PositionID = p.PositionID
        WHERE e.DepartmentID = ?
          AND e.Status != 'Inactive'
        ORDER BY p.PositionID, e.FullName
    """, dept_id)

    employees = []
    for r in cur.fetchall():
        employees.append({
            "EmployeeID":   r[0],
            "FullName":     r[1],
            "Gender":       r[2],
            "Email":        r[3],
            "PhoneNumber":  r[4],
            "HireDate":     str(r[5]) if r[5] else "",
            "Status":       r[6],
            "PositionName": r[7] or "—",
        })

    if not employees:
        return jsonify({"status": "success", "data": [], "dept_id": dept_id})

    # Lấy lương tháng gần nhất từ MySQL
    emp_ids = [e["EmployeeID"] for e in employees]
    my = get_mysql_connection()
    my_cur = my.cursor(dictionary=True)
    fmt_ids = ",".join(["%s"] * len(emp_ids))
    my_cur.execute(f"""
        SELECT s.EmployeeID, s.NetSalary, s.BaseSalary
        FROM salaries s
        WHERE s.EmployeeID IN ({fmt_ids})
          AND s.SalaryMonth = (SELECT MAX(SalaryMonth) FROM salaries)
    """, emp_ids)
    salary_map = {r["EmployeeID"]: r for r in my_cur.fetchall()}

    for e in employees:
        sal = salary_map.get(e["EmployeeID"])
        e["NetSalary"]  = float(sal["NetSalary"])  if sal else 0
        e["BaseSalary"] = float(sal["BaseSalary"]) if sal else 0

    return jsonify({"status": "success", "data": employees, "dept_id": dept_id})


@router.route("/api/departments/sync", methods=["POST"])
def sync_departments():
    """Đồng bộ toàn bộ phòng ban từ HUMAN_2025 → payroll_2026"""
    sql = get_sqlserver_connection()
    my  = get_mysql_connection()
    cur = sql.cursor()
    cur.execute("SELECT DepartmentID, DepartmentName FROM Departments")
    depts = cur.fetchall()

    my_cur = my.cursor()
    synced = 0
    try:
        for d in depts:
            my_cur.execute("""
                INSERT INTO departments_payroll (DepartmentID, DepartmentName)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE DepartmentName = VALUES(DepartmentName),
                                        SyncedAt = CURRENT_TIMESTAMP
            """, (d[0], d[1]))
            synced += 1
        my.commit()
    except Exception as e:
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({"status": "success", "synced_count": synced})


# ============================================================
# POSITIONS
# ============================================================

@router.route("/api/positions", methods=["GET"])
def get_positions():
    """Lấy danh sách chức vụ từ HUMAN_2025"""
    sql = get_sqlserver_connection()
    cur = sql.cursor()
    cur.execute("SELECT PositionID, PositionName FROM Positions ORDER BY PositionName")
    rows = [{"PositionID": r[0], "PositionName": r[1]} for r in cur.fetchall()]
    return jsonify(rows)


@router.route("/api/positions/stats", methods=["GET"])
def get_positions_stats():
    """
    Lấy chức vụ kèm thống kê:
    - Số nhân viên đang giữ chức vụ, lương TB từ MySQL
    - Cấp bậc suy ra từ PositionID (1=cao nhất)
    """
    sql = get_sqlserver_connection()
    cur = sql.cursor()

    cur.execute("""
        SELECT
            p.PositionID,
            p.PositionName,
            COUNT(e.EmployeeID) AS TotalEmployees
        FROM Positions p
        LEFT JOIN Employees e ON p.PositionID = e.PositionID
            AND e.Status != 'Inactive'
        GROUP BY p.PositionID, p.PositionName
        ORDER BY p.PositionID
    """)
    positions = []
    for r in cur.fetchall():
        positions.append({
            "PositionID":     r[0],
            "PositionName":   r[1],
            "Description":    "",
            "TotalEmployees": r[2],
            "Level":          r[0],
        })

    # Lương TB theo chức vụ từ MySQL
    my = get_mysql_connection()
    my_cur = my.cursor(dictionary=True)
    my_cur.execute("""
        SELECT ep.PositionID,
               AVG(s.NetSalary) AS AvgSalary
        FROM salaries s
        JOIN employees_payroll ep ON s.EmployeeID = ep.EmployeeID
        WHERE s.SalaryMonth = (SELECT MAX(SalaryMonth) FROM salaries)
        GROUP BY ep.PositionID
    """)
    salary_map = {r["PositionID"]: float(r["AvgSalary"] or 0)
                  for r in my_cur.fetchall()}

    for p in positions:
        p["AvgSalary"] = salary_map.get(p["PositionID"], 0)

    return jsonify({"status": "success", "data": positions})


@router.route("/api/positions/sync", methods=["POST"])
def sync_positions():
    """Đồng bộ toàn bộ chức vụ từ HUMAN_2025 → payroll_2026"""
    sql = get_sqlserver_connection()
    my  = get_mysql_connection()
    cur = sql.cursor()
    cur.execute("SELECT PositionID, PositionName FROM Positions")
    positions = cur.fetchall()

    my_cur = my.cursor()
    synced = 0
    try:
        for p in positions:
            my_cur.execute("""
                INSERT INTO positions_payroll (PositionID, PositionName)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE PositionName = VALUES(PositionName),
                                        SyncedAt = CURRENT_TIMESTAMP
            """, (p[0], p[1]))
            synced += 1
        my.commit()
    except Exception as e:
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({"status": "success", "synced_count": synced})


# ============================================================
# EMPLOYEES – GET ALL
# ============================================================

@router.route("/api/employees", methods=["GET"])
def get_employees():
    """Lấy danh sách nhân viên (JOIN Departments + Positions)"""
    sql = get_sqlserver_connection()
    cur = sql.cursor()
    cur.execute("""
        SELECT
            e.EmployeeID,
            e.FullName,
            e.Gender,
            e.PhoneNumber,
            e.Email,
            e.HireDate,
            e.Status,
            d.DepartmentID,
            d.DepartmentName,
            p.PositionID,
            p.PositionName
        FROM Employees e
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Positions   p ON e.PositionID   = p.PositionID
        ORDER BY e.EmployeeID
    """)
    rows = []
    for r in cur.fetchall():
        rows.append({
            "EmployeeID":     r[0],
            "FullName":       r[1],
            "Gender":         r[2],
            "PhoneNumber":    r[3],
            "Email":          r[4],
            "HireDate":       str(r[5]) if r[5] else "",
            "Status":         r[6],
            "DepartmentID":   r[7],
            "Department":     r[8],
            "PositionID":     r[9],
            "Position":       r[10],
        })
    return jsonify(rows)


# ============================================================
# EMPLOYEES – GET BY ID
# ============================================================

@router.route("/api/employees/<int:emp_id>", methods=["GET"])
def get_employee_detail(emp_id):
    """Lấy chi tiết 1 nhân viên theo ID"""
    sql = get_sqlserver_connection()
    cur = sql.cursor()
    cur.execute("""
        SELECT
            e.EmployeeID,
            e.FullName,
            e.DateOfBirth,
            e.Gender,
            e.PhoneNumber,
            e.Email,
            e.HireDate,
            e.Status,
            d.DepartmentID,
            d.DepartmentName,
            p.PositionID,
            p.PositionName
        FROM Employees e
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Positions   p ON e.PositionID   = p.PositionID
        WHERE e.EmployeeID = ?
    """, emp_id)
    r = cur.fetchone()
    if not r:
        return jsonify({"msg": "Employee not found"}), 404
    return jsonify({
        "EmployeeID":     r[0],
        "FullName":       r[1],
        "DateOfBirth":    str(r[2]) if r[2] else "",
        "Gender":         r[3],
        "PhoneNumber":    r[4],
        "Email":          r[5],
        "HireDate":       str(r[6]) if r[6] else "",
        "Status":         r[7],
        "DepartmentID":   r[8],
        "DepartmentName": r[9],
        "PositionID":     r[10],
        "PositionName":   r[11],
    })


# ============================================================
# EMPLOYEES – POST (Thêm mới + đồng bộ 2 DB)
# ============================================================

@router.route("/api/employees", methods=["POST"])
def add_employee():
    """
    Thêm nhân viên mới:
    1. Kiểm tra email trùng
    2. INSERT HUMAN_2025 (SQL Server) → lấy EmployeeID mới
    3. INSERT employees_payroll (MySQL)
    4. Rollback cả 2 nếu có lỗi
    """
    data = request.get_json()

    full_name  = data.get("FullName", "").strip()
    dob        = data.get("DateOfBirth") or None
    gender     = data.get("Gender", "")
    phone      = data.get("PhoneNumber", "")
    email      = data.get("Email", "").strip()
    hire_date  = data.get("HireDate") or None
    dept_id    = data.get("DepartmentID") or None
    pos_id     = data.get("PositionID") or None
    status     = data.get("Status") or "Active"

    if not full_name or not email:
        return jsonify({"status": "error", "msg": "FullName và Email là bắt buộc"}), 400

    if not dept_id or not pos_id:
        return jsonify({"status": "error", "msg": "Phòng ban và Chức vụ là bắt buộc"}), 400

    # Validate số điện thoại
    if phone:
        if not re.match(r'^0\d{8,14}$', phone.strip()):
            return jsonify({"status": "error", "msg": "Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và có 9-15 chữ số)"}), 400

    # Validate ngày sinh: phải >= 18 tuổi, không tương lai
    if dob:
        try:
            dob_date = date.fromisoformat(str(dob)[:10])
            today = date.today()
            if dob_date >= today:
                return jsonify({"status": "error", "msg": "Ngày sinh không hợp lệ (không được là ngày hiện tại hoặc tương lai)"}), 400
            age = (today - dob_date).days // 365
            if age < 18:
                return jsonify({"status": "error", "msg": "Nhân viên phải đủ 18 tuổi"}), 400
            if age > 100:
                return jsonify({"status": "error", "msg": "Ngày sinh không hợp lệ"}), 400
        except ValueError:
            return jsonify({"status": "error", "msg": "Định dạng ngày sinh không hợp lệ"}), 400

    # Validate ngày vào làm: không được trong tương lai
    if hire_date:
        try:
            hire = date.fromisoformat(str(hire_date)[:10])
            if hire > date.today():
                return jsonify({"status": "error", "msg": "Ngày vào làm không được trong tương lai"}), 400
            if dob and hire <= date.fromisoformat(str(dob)[:10]):
                return jsonify({"status": "error", "msg": "Ngày vào làm phải sau ngày sinh"}), 400
        except ValueError:
            return jsonify({"status": "error", "msg": "Định dạng ngày vào làm không hợp lệ"}), 400

    sql = get_sqlserver_connection()
    cur = sql.cursor()

    # Kiểm tra email trùng
    cur.execute("SELECT COUNT(*) FROM Employees WHERE Email = ?", email)
    if cur.fetchone()[0] > 0:
        return jsonify({"status": "error", "msg": "Email đã tồn tại"}), 409

    my = get_mysql_connection()
    sql.autocommit = False
    my.start_transaction()

    try:
        # INSERT SQL Server – lấy EmployeeID mới qua OUTPUT
        cur.execute("""
            INSERT INTO Employees
                (FullName, DateOfBirth, Gender, PhoneNumber, Email,
                 HireDate, DepartmentID, PositionID, Status)
            OUTPUT INSERTED.EmployeeID
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (full_name, dob, gender, phone, email,
              hire_date, dept_id, pos_id, status))
        new_id = int(cur.fetchone()[0])

        # INSERT MySQL
        my_cur = my.cursor()
        my_cur.execute("""
            INSERT INTO employees_payroll
                (EmployeeID, FullName, DepartmentID, PositionID, Status)
            VALUES (%s, %s, %s, %s, %s)
        """, (new_id, full_name, dept_id, pos_id, status))

        sql.commit()
        my.commit()

    except Exception as e:
        sql.rollback()
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({
        "status": "success",
        "msg": f"Thêm nhân viên thành công (ID = {new_id})",
        "EmployeeID": new_id
    }), 201


# ============================================================
# EMPLOYEES – PUT (Cập nhật + đồng bộ 2 DB)
# ============================================================

@router.route("/api/employees/<int:emp_id>", methods=["PUT"])
def update_employee(emp_id):
    """
    Cập nhật nhân viên:
    1. UPDATE HUMAN_2025
    2. UPDATE employees_payroll (MySQL)
    3. Rollback cả 2 nếu có lỗi
    """
    data = request.get_json()

    full_name  = data.get("FullName", "").strip()
    dob        = data.get("DateOfBirth") or None
    gender     = data.get("Gender", "")
    phone      = data.get("PhoneNumber", "")
    email      = data.get("Email", "").strip()
    hire_date  = data.get("HireDate") or None
    dept_id    = data.get("DepartmentID") or None
    pos_id     = data.get("PositionID") or None
    status     = data.get("Status", "Active")

    if not full_name or not email:
        return jsonify({"status": "error", "msg": "FullName và Email là bắt buộc"}), 400

    if not dept_id or not pos_id:
        return jsonify({"status": "error", "msg": "Phòng ban và Chức vụ là bắt buộc"}), 400

    # Validate số điện thoại: chỉ chứa chữ số, không âm, không ký tự đặc biệt
    if phone:
        if not re.match(r'^0\d{8,14}$', phone.strip()):
            return jsonify({"status": "error", "msg": "Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và có 9-15 chữ số)"}), 400

    # Validate ngày sinh: không được trong tương lai, phải >= 18 tuổi
    if dob:
        try:
            dob_date = date.fromisoformat(str(dob)[:10])
            today = date.today()
            if dob_date >= today:
                return jsonify({"status": "error", "msg": "Ngày sinh không hợp lệ (không được là ngày hiện tại hoặc tương lai)"}), 400
            age = (today - dob_date).days // 365
            if age < 18:
                return jsonify({"status": "error", "msg": "Nhân viên phải đủ 18 tuổi"}), 400
            if age > 100:
                return jsonify({"status": "error", "msg": "Ngày sinh không hợp lệ"}), 400
        except ValueError:
            return jsonify({"status": "error", "msg": "Định dạng ngày sinh không hợp lệ"}), 400

    # Validate ngày vào làm: không được trong tương lai
    if hire_date:
        try:
            hire = date.fromisoformat(str(hire_date)[:10])
            if hire > date.today():
                return jsonify({"status": "error", "msg": "Ngày vào làm không được trong tương lai"}), 400
            if dob and hire <= date.fromisoformat(str(dob)[:10]):
                return jsonify({"status": "error", "msg": "Ngày vào làm phải sau ngày sinh"}), 400
        except ValueError:
            return jsonify({"status": "error", "msg": "Định dạng ngày vào làm không hợp lệ"}), 400

    sql = get_sqlserver_connection()
    my  = get_mysql_connection()

    # Kiểm tra email trùng với nhân viên khác
    sql_check = sql.cursor()
    sql_check.execute(
        "SELECT COUNT(*) FROM Employees WHERE Email = ? AND EmployeeID != ?",
        (email, emp_id)
    )
    if sql_check.fetchone()[0] > 0:
        return jsonify({"status": "error", "msg": "Email đã được sử dụng bởi nhân viên khác"}), 409

    sql.autocommit = False
    my.start_transaction()

    try:
        cur = sql.cursor()
        cur.execute("""
            UPDATE Employees SET
                FullName     = ?,
                DateOfBirth  = ?,
                Gender       = ?,
                PhoneNumber  = ?,
                Email        = ?,
                HireDate     = ?,
                DepartmentID = ?,
                PositionID   = ?,
                Status       = ?,
                UpdatedAt    = GETDATE()
            WHERE EmployeeID = ?
        """, (full_name, dob, gender, phone, email,
              hire_date, dept_id, pos_id, status, emp_id))

        my_cur = my.cursor()
        my_cur.execute("""
            UPDATE employees_payroll SET
                FullName     = %s,
                DepartmentID = %s,
                PositionID   = %s,
                Status       = %s,
                SyncedAt     = CURRENT_TIMESTAMP
            WHERE EmployeeID = %s
        """, (full_name, dept_id, pos_id, status, emp_id))

        sql.commit()
        my.commit()

    except Exception as e:
        sql.rollback()
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({"status": "success", "msg": "Cập nhật thành công"})


# ============================================================
# EMPLOYEES – DELETE (Xóa + đồng bộ 2 DB)
# ============================================================

@router.route("/api/employees/<int:emp_id>", methods=["DELETE"])
def delete_employee(emp_id):
    """
    Xóa nhân viên:
    1. Kiểm tra Dividends → từ chối nếu có
    2. DELETE HUMAN_2025
    3. DELETE employees_payroll + attendance + salaries (MySQL)
    4. Rollback cả 2 nếu có lỗi
    """
    sql = get_sqlserver_connection()
    my  = get_mysql_connection()

    cur = sql.cursor()

    # Kiểm tra ràng buộc Dividends
    cur.execute("SELECT COUNT(*) FROM Dividends WHERE EmployeeID = ?", emp_id)
    if cur.fetchone()[0] > 0:
        return jsonify({
            "status": "error",
            "msg": "Không thể xoá – nhân viên có dữ liệu Dividends"
        }), 400

    sql.autocommit = False
    my.start_transaction()

    try:
        cur.execute("DELETE FROM Employees WHERE EmployeeID = ?", emp_id)

        my_cur = my.cursor()
        my_cur.execute("DELETE FROM salaries          WHERE EmployeeID = %s", (emp_id,))
        my_cur.execute("DELETE FROM attendance        WHERE EmployeeID = %s", (emp_id,))
        my_cur.execute("DELETE FROM employees_payroll WHERE EmployeeID = %s", (emp_id,))

        sql.commit()
        my.commit()

    except Exception as e:
        sql.rollback()
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({"status": "success", "msg": "Xoá thành công"})


# ============================================================
# PAYROLL – GET danh sách lương
# ============================================================

@router.route("/api/payroll", methods=["GET"])
def get_payroll():
    """
    Lấy danh sách lương từ MySQL.
    Query params: ?month=YYYY-MM (ví dụ: ?month=2024-09)
    """
    month = request.args.get("month")
    my  = get_mysql_connection()
    my_cur = my.cursor(dictionary=True)

    if month:
        my_cur.execute("""
            SELECT s.SalaryID, s.EmployeeID, ep.FullName,
                   ep.DepartmentID, dp.DepartmentName,
                   ep.PositionID,  pp.PositionName,
                   s.SalaryMonth, s.BaseSalary, s.Bonus,
                   s.Deductions,  s.NetSalary,  s.CreatedAt
            FROM salaries s
            JOIN employees_payroll  ep ON s.EmployeeID   = ep.EmployeeID
            LEFT JOIN departments_payroll dp ON ep.DepartmentID = dp.DepartmentID
            LEFT JOIN positions_payroll   pp ON ep.PositionID   = pp.PositionID
            WHERE DATE_FORMAT(s.SalaryMonth, '%Y-%m') = %s
            ORDER BY s.EmployeeID
        """, (month,))
    else:
        my_cur.execute("""
            SELECT s.SalaryID, s.EmployeeID, ep.FullName,
                   ep.DepartmentID, dp.DepartmentName,
                   ep.PositionID,  pp.PositionName,
                   s.SalaryMonth, s.BaseSalary, s.Bonus,
                   s.Deductions,  s.NetSalary,  s.CreatedAt
            FROM salaries s
            JOIN employees_payroll  ep ON s.EmployeeID   = ep.EmployeeID
            LEFT JOIN departments_payroll dp ON ep.DepartmentID = dp.DepartmentID
            LEFT JOIN positions_payroll   pp ON ep.PositionID   = pp.PositionID
            ORDER BY s.SalaryMonth DESC, s.EmployeeID
        """)

    rows = my_cur.fetchall()
    for r in rows:
        if r.get("SalaryMonth"):
            r["SalaryMonthStr"] = str(r["SalaryMonth"])[:7]
            r["SalaryMonth"]    = str(r["SalaryMonth"])
        if r.get("CreatedAt"):
            r["CreatedAt"] = str(r["CreatedAt"])
    return jsonify(rows)


# ============================================================
# PAYROLL – GET chi tiết lương + cổ tức 1 nhân viên
# ============================================================

@router.route("/api/salary/<int:emp_id>/details", methods=["GET"])
def get_salary_details(emp_id):
    """
    Lấy chi tiết lương + cổ tức của 1 nhân viên.
    Query params: ?month=YYYY-MM
    """
    month = request.args.get("month")

    my = get_mysql_connection()
    my_cur = my.cursor(dictionary=True)

    if month:
        my_cur.execute("""
            SELECT s.*, ep.FullName, dp.DepartmentName, pp.PositionName
            FROM salaries s
            JOIN employees_payroll  ep ON s.EmployeeID   = ep.EmployeeID
            LEFT JOIN departments_payroll dp ON ep.DepartmentID = dp.DepartmentID
            LEFT JOIN positions_payroll   pp ON ep.PositionID   = pp.PositionID
            WHERE s.EmployeeID = %s
              AND DATE_FORMAT(s.SalaryMonth, '%Y-%m') = %s
            ORDER BY s.SalaryMonth DESC
            LIMIT 1
        """, (emp_id, month))
    else:
        my_cur.execute("""
            SELECT s.*, ep.FullName, dp.DepartmentName, pp.PositionName
            FROM salaries s
            JOIN employees_payroll  ep ON s.EmployeeID   = ep.EmployeeID
            LEFT JOIN departments_payroll dp ON ep.DepartmentID = dp.DepartmentID
            LEFT JOIN positions_payroll   pp ON ep.PositionID   = pp.PositionID
            WHERE s.EmployeeID = %s
            ORDER BY s.SalaryMonth DESC
            LIMIT 1
        """, (emp_id,))

    salary = my_cur.fetchone()
    if not salary:
        return jsonify({"msg": "Không tìm thấy dữ liệu lương"}), 404

    salary["SalaryMonthStr"] = str(salary["SalaryMonth"])[:7] if salary.get("SalaryMonth") else ""
    salary["SalaryMonth"]    = str(salary["SalaryMonth"]) if salary.get("SalaryMonth") else ""
    if salary.get("CreatedAt"):
        salary["CreatedAt"] = str(salary["CreatedAt"])

    # Cổ tức từ SQL Server
    sql = get_sqlserver_connection()
    cur = sql.cursor()
    cur.execute("""
        SELECT DividendID, DividendAmount, DividendDate
        FROM Dividends
        WHERE EmployeeID = ?
        ORDER BY DividendDate DESC
    """, emp_id)
    dividends = [
        {
            "DividendID":     r[0],
            "DividendAmount": float(r[1]),
            "DividendDate":   str(r[2]) if r[2] else ""
        }
        for r in cur.fetchall()
    ]
    total_dividend = sum(d["DividendAmount"] for d in dividends)

    return jsonify({
        "status": "success",
        "data": {
            **salary,
            "Dividends":      dividends,
            "TotalDividends": total_dividend
        }
    })


# ============================================================
# PAYROLL – GET lịch sử lương theo nhân viên
# ============================================================

@router.route("/api/salary/<int:emp_id>/history", methods=["GET"])
def get_salary_history(emp_id):
    """Lấy toàn bộ lịch sử lương của 1 nhân viên, sắp xếp mới nhất trước"""
    my = get_mysql_connection()
    my_cur = my.cursor(dictionary=True)
    my_cur.execute("""
        SELECT SalaryID, EmployeeID, SalaryMonth,
               BaseSalary, Bonus, Deductions, NetSalary, CreatedAt
        FROM salaries
        WHERE EmployeeID = %s
        ORDER BY SalaryMonth DESC
    """, (emp_id,))
    rows = my_cur.fetchall()
    for r in rows:
        r["SalaryMonthStr"] = str(r["SalaryMonth"])[:7] if r.get("SalaryMonth") else ""
        r["SalaryMonth"]    = str(r["SalaryMonth"]) if r.get("SalaryMonth") else ""
        if r.get("CreatedAt"):
            r["CreatedAt"] = str(r["CreatedAt"])
    return jsonify(rows)


# ============================================================
# PAYROLL – PUT cập nhật lương
# ============================================================

@router.route("/api/salary/<int:salary_id>", methods=["PUT"])
def update_salary(salary_id):
    """
    Cập nhật lương: BaseSalary, Bonus, Deductions.
    NetSalary = BaseSalary + Bonus - Deductions (tính lại tự động).
    """
    data        = request.get_json()
    base_salary = data.get("BaseSalary", 0)
    bonus       = data.get("Bonus", 0)
    deductions  = data.get("Deductions", 0)

    if float(base_salary) < 0 or float(bonus) < 0 or float(deductions) < 0:
        return jsonify({"status": "error", "msg": "Giá trị lương không được âm"}), 400

    net_salary = float(base_salary) + float(bonus) - float(deductions)

    my = get_mysql_connection()
    my_cur = my.cursor()
    try:
        my_cur.execute("""
            UPDATE salaries SET
                BaseSalary = %s,
                Bonus      = %s,
                Deductions = %s,
                NetSalary  = %s
            WHERE SalaryID = %s
        """, (base_salary, bonus, deductions, net_salary, salary_id))
        my.commit()
    except Exception as e:
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({"status": "success", "msg": "Cập nhật lương thành công", "NetSalary": net_salary})


# ============================================================
# ATTENDANCE – GET chấm công
# ============================================================

@router.route("/api/attendance", methods=["GET"])
def get_attendance():
    """
    Lấy dữ liệu chấm công.
    Query params: ?emp_id=1&month=YYYY-MM
    """
    emp_id = request.args.get("emp_id")
    month  = request.args.get("month")   # dạng YYYY-MM

    my = get_mysql_connection()
    my_cur = my.cursor(dictionary=True)

    query = """
        SELECT a.AttendanceID, a.EmployeeID, ep.FullName,
               a.WorkDays, a.AbsentDays, a.LeaveDays,
               a.AttendanceMonth, a.CreatedAt
        FROM attendance a
        JOIN employees_payroll ep ON a.EmployeeID = ep.EmployeeID
        WHERE 1=1
    """
    params = []

    if emp_id:
        query += " AND a.EmployeeID = %s"
        params.append(int(emp_id))
    if month:
        query += " AND DATE_FORMAT(a.AttendanceMonth, '%Y-%m') = %s"
        params.append(month)

    query += " ORDER BY a.AttendanceMonth DESC, a.EmployeeID"
    my_cur.execute(query, params)
    rows = my_cur.fetchall()

    for r in rows:
        if r.get("AttendanceMonth"):
            r["AttendanceMonth"] = str(r["AttendanceMonth"])
        if r.get("CreatedAt"):
            r["CreatedAt"] = str(r["CreatedAt"])
    return jsonify(rows)


# ============================================================
# ATTENDANCE – GET chi tiết (kèm phòng ban, OvertimeHours)
# ============================================================

@router.route("/api/attendance/detail", methods=["GET"])
def get_attendance_detail():
    """
    Lấy chấm công đầy đủ theo tháng/năm, kèm phòng ban.
    Query params: ?month=M&year=YYYY&dept_id=N
    """
    month   = request.args.get("month",   type=int)
    year    = request.args.get("year",    type=int)
    dept_id = request.args.get("dept_id", type=int)

    my = get_mysql_connection()
    my_cur = my.cursor(dictionary=True)

    query = """
        SELECT a.AttendanceID, a.EmployeeID, ep.FullName,
               ep.DepartmentID, dp.DepartmentName,
               ep.PositionID,  pp.PositionName,
               a.AttendanceMonth, a.AttendanceYear,
               a.WorkDays, a.LeaveDays, a.AbsentDays,
               a.OvertimeHours, a.Note,
               a.CreatedAt, a.UpdatedAt
        FROM attendance a
        JOIN employees_payroll  ep ON a.EmployeeID   = ep.EmployeeID
        LEFT JOIN departments_payroll dp ON ep.DepartmentID = dp.DepartmentID
        LEFT JOIN positions_payroll   pp ON ep.PositionID   = pp.PositionID
        WHERE 1=1
    """
    params = []
    if month: query += " AND a.AttendanceMonth = %s"; params.append(month)
    if year:  query += " AND a.AttendanceYear  = %s"; params.append(year)
    if dept_id: query += " AND ep.DepartmentID = %s"; params.append(dept_id)
    query += " ORDER BY dp.DepartmentName, ep.FullName"

    my_cur.execute(query, params)
    rows = my_cur.fetchall()
    for r in rows:
        r["OvertimeHours"] = float(r.get("OvertimeHours") or 0)
        if r.get("CreatedAt"): r["CreatedAt"] = str(r["CreatedAt"])
        if r.get("UpdatedAt"): r["UpdatedAt"] = str(r["UpdatedAt"])
    return jsonify({"status": "success", "data": rows})


# ============================================================
# ATTENDANCE – PUT cập nhật chấm công
# ============================================================

@router.route("/api/attendance/<int:att_id>", methods=["PUT"])
def update_attendance(att_id):
    """Cập nhật bản ghi chấm công."""
    data = request.get_json()
    my = get_mysql_connection()
    my_cur = my.cursor()
    try:
        my_cur.execute("""
            UPDATE attendance SET
                WorkDays      = %s,
                LeaveDays     = %s,
                AbsentDays    = %s,
                OvertimeHours = %s,
                Note          = %s
            WHERE AttendanceID = %s
        """, (
            data.get("WorkDays", 0),
            data.get("LeaveDays", 0),
            data.get("AbsentDays", 0),
            data.get("OvertimeHours", 0),
            data.get("Note", ""),
            att_id,
        ))
        my.commit()
    except Exception as e:
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500
    return jsonify({"status": "success", "msg": "Cập nhật chấm công thành công"})


# ============================================================
# LEAVE REQUESTS – GET danh sách
# ============================================================

@router.route("/api/leave-requests", methods=["GET"])
def get_leave_requests():
    """
    Lấy danh sách yêu cầu nghỉ phép.
    Query params: ?status=Pending&emp_id=1&month=YYYY-MM
    """
    status  = request.args.get("status")
    emp_id  = request.args.get("emp_id",  type=int)
    month   = request.args.get("month")   # YYYY-MM

    my = get_mysql_connection()
    my_cur = my.cursor(dictionary=True)

    query = """
        SELECT lr.RequestID, lr.EmployeeID, ep.FullName,
               dp.DepartmentName, pp.PositionName,
               lr.StartDate, lr.EndDate, lr.LeaveDays,
               lr.Reason, lr.Status,
               lr.ApprovedBy, lr.ApprovedAt, lr.RejectReason,
               lr.CreatedAt
        FROM leave_requests lr
        JOIN employees_payroll  ep ON lr.EmployeeID  = ep.EmployeeID
        LEFT JOIN departments_payroll dp ON ep.DepartmentID = dp.DepartmentID
        LEFT JOIN positions_payroll   pp ON ep.PositionID   = pp.PositionID
        WHERE 1=1
    """
    params = []
    if status: query += " AND lr.Status = %s";     params.append(status)
    if emp_id: query += " AND lr.EmployeeID = %s"; params.append(emp_id)
    if month:  query += " AND DATE_FORMAT(lr.StartDate, '%Y-%m') = %s"; params.append(month)
    query += " ORDER BY lr.CreatedAt DESC"

    my_cur.execute(query, params)
    rows = my_cur.fetchall()
    for r in rows:
        for f in ["StartDate", "EndDate", "ApprovedAt", "CreatedAt"]:
            if r.get(f): r[f] = str(r[f])
    return jsonify({"status": "success", "data": rows})


# ============================================================
# LEAVE REQUESTS – POST tạo mới
# ============================================================

@router.route("/api/leave-requests", methods=["POST"])
def create_leave_request():
    """Tạo yêu cầu nghỉ phép mới."""
    data     = request.get_json()
    emp_id   = data.get("EmployeeID")
    start    = data.get("StartDate")
    end      = data.get("EndDate")
    days     = data.get("LeaveDays", 1)
    reason   = data.get("Reason", "")

    if not emp_id or not start or not end:
        return jsonify({"status": "error", "msg": "Thiếu thông tin bắt buộc"}), 400

    my = get_mysql_connection()
    my_cur = my.cursor()
    try:
        my_cur.execute("""
            INSERT INTO leave_requests
                (EmployeeID, StartDate, EndDate, LeaveDays, Reason, Status)
            VALUES (%s, %s, %s, %s, %s, 'Pending')
        """, (emp_id, start, end, days, reason))
        my.commit()
        new_id = my_cur.lastrowid
    except Exception as e:
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500
    return jsonify({"status": "success", "msg": "Tạo yêu cầu thành công", "RequestID": new_id}), 201


# ============================================================
# LEAVE REQUESTS – PUT duyệt / từ chối
# ============================================================

@router.route("/api/leave-requests/<int:req_id>", methods=["PUT"])
def update_leave_request(req_id):
    """
    Duyệt hoặc từ chối yêu cầu nghỉ phép.
    Body: { action: 'approve'|'reject', RejectReason: '...' }
    """
    data         = request.get_json()
    action       = data.get("action")          # 'approve' | 'reject'
    reject_reason= data.get("RejectReason", "")

    if action not in ("approve", "reject"):
        return jsonify({"status": "error", "msg": "action phải là approve hoặc reject"}), 400

    new_status = "Approved" if action == "approve" else "Rejected"
    my = get_mysql_connection()
    my_cur = my.cursor()
    try:
        my_cur.execute("""
            UPDATE leave_requests SET
                Status       = %s,
                ApprovedAt   = CASE WHEN %s = 'Approved' THEN NOW() ELSE NULL END,
                RejectReason = %s
            WHERE RequestID = %s
        """, (new_status, new_status, reject_reason, req_id))
        my.commit()
    except Exception as e:
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500
    return jsonify({"status": "success", "msg": f"{'Đã duyệt' if action == 'approve' else 'Đã từ chối'} yêu cầu"})

@router.route("/api/reports/dashboard", methods=["GET"])
def get_dashboard():
    """
    Dữ liệu tổng hợp cho Dashboard:
    - Tổng nhân viên, theo phòng ban (SQL Server)
    - Tổng quỹ lương tháng gần nhất (MySQL)
    - Tổng cổ tức (SQL Server)
    """
    sql = get_sqlserver_connection()
    cur = sql.cursor()

    # Tổng nhân viên
    cur.execute("SELECT COUNT(*) FROM Employees WHERE Status != 'Inactive'")
    total_employees = cur.fetchone()[0]

    # Nhân viên theo phòng ban
    cur.execute("""
        SELECT d.DepartmentName, COUNT(e.EmployeeID) AS Total
        FROM Departments d
        LEFT JOIN Employees e ON d.DepartmentID = e.DepartmentID
            AND e.Status != 'Inactive'
        GROUP BY d.DepartmentID, d.DepartmentName
        ORDER BY Total DESC
    """)
    by_dept = [{"DepartmentName": r[0], "Total": r[1]} for r in cur.fetchall()]

    # Tổng cổ tức
    cur.execute("SELECT ISNULL(SUM(DividendAmount), 0) FROM Dividends")
    total_dividends = float(cur.fetchone()[0])

    # Tổng quỹ lương tháng gần nhất (MySQL)
    my = get_mysql_connection()
    my_cur = my.cursor(dictionary=True)
    my_cur.execute("""
        SELECT SalaryMonth,
               SUM(BaseSalary) AS TotalBase,
               SUM(Bonus)      AS TotalBonus,
               SUM(Deductions) AS TotalDeductions,
               SUM(NetSalary)  AS TotalNet
        FROM salaries
        WHERE SalaryMonth = (SELECT MAX(SalaryMonth) FROM salaries)
        GROUP BY SalaryMonth
    """)
    payroll_summary = my_cur.fetchone()
    if payroll_summary and payroll_summary.get("SalaryMonth"):
        payroll_summary["SalaryMonth"] = str(payroll_summary["SalaryMonth"])[:7]

    return jsonify({
        "status": "success",
        "data": {
            "TotalEmployees":  total_employees,
            "ByDepartment":    by_dept,
            "TotalDividends":  total_dividends,
            "PayrollSummary":  payroll_summary or {}
        }
    })


# ============================================================
# PAYROLL – GET danh sách tháng có dữ liệu lương
# ============================================================

# ============================================================
# PAYROLL – POST tạo bản ghi lương mới
# ============================================================

@router.route("/api/payroll/create", methods=["POST"])
def create_salary():
    """
    Tạo hoặc cập nhật bản ghi lương.
    Body: { EmployeeID, SalaryMonth (YYYY-MM-DD), BaseSalary, Bonus, Deductions, NetSalary }
    """
    data        = request.get_json()
    emp_id      = data.get("EmployeeID")
    salary_month= data.get("SalaryMonth")   # YYYY-MM-DD
    base_salary = float(data.get("BaseSalary",  0))
    bonus       = float(data.get("Bonus",       0))
    deductions  = float(data.get("Deductions",  0))
    net_salary  = float(data.get("NetSalary",   base_salary + bonus - deductions))

    if not emp_id or not salary_month:
        return jsonify({"status": "error", "msg": "EmployeeID và SalaryMonth là bắt buộc"}), 400

    my = get_mysql_connection()
    my_cur = my.cursor()
    try:
        my_cur.execute("""
            INSERT INTO salaries (EmployeeID, SalaryMonth, BaseSalary, Bonus, Deductions, NetSalary)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                BaseSalary = VALUES(BaseSalary),
                Bonus      = VALUES(Bonus),
                Deductions = VALUES(Deductions),
                NetSalary  = VALUES(NetSalary)
        """, (emp_id, salary_month, base_salary, bonus, deductions, net_salary))
        my.commit()
    except Exception as e:
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({"status": "success", "msg": "Lưu lương thành công"}), 201


@router.route("/api/payroll/months", methods=["GET"])
def get_payroll_months():
    """Lấy danh sách tháng có dữ liệu lương (để populate dropdown)"""
    my = get_mysql_connection()
    my_cur = my.cursor()
    my_cur.execute("""
        SELECT DISTINCT DATE_FORMAT(SalaryMonth, '%Y-%m') AS month
        FROM salaries
        ORDER BY month DESC
    """)
    months = [r[0] for r in my_cur.fetchall()]
    return jsonify(months)


# ============================================================
# REPORTS – Báo cáo cổ tức
# ============================================================

@router.route("/api/reports/dividend", methods=["GET"])
def get_dividend_report():
    """
    Báo cáo cổ tức theo năm.
    Query params: ?year=2024
    """
    year = request.args.get("year")
    sql  = get_sqlserver_connection()
    cur  = sql.cursor()

    if year:
        cur.execute("""
            SELECT
                e.EmployeeID,
                e.FullName,
                d.DepartmentName,
                p.PositionName,
                COUNT(dv.DividendID)        AS TotalRecords,
                SUM(dv.DividendAmount)      AS TotalAmount,
                MIN(dv.DividendDate)        AS FirstDate,
                MAX(dv.DividendDate)        AS LastDate
            FROM Dividends dv
            JOIN Employees    e ON dv.EmployeeID    = e.EmployeeID
            LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
            LEFT JOIN Positions   p ON e.PositionID   = p.PositionID
            WHERE YEAR(dv.DividendDate) = ?
            GROUP BY e.EmployeeID, e.FullName, d.DepartmentName, p.PositionName
            ORDER BY TotalAmount DESC
        """, int(year))
    else:
        cur.execute("""
            SELECT
                e.EmployeeID,
                e.FullName,
                d.DepartmentName,
                p.PositionName,
                COUNT(dv.DividendID)        AS TotalRecords,
                SUM(dv.DividendAmount)      AS TotalAmount,
                MIN(dv.DividendDate)        AS FirstDate,
                MAX(dv.DividendDate)        AS LastDate
            FROM Dividends dv
            JOIN Employees    e ON dv.EmployeeID    = e.EmployeeID
            LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
            LEFT JOIN Positions   p ON e.PositionID   = p.PositionID
            GROUP BY e.EmployeeID, e.FullName, d.DepartmentName, p.PositionName
            ORDER BY TotalAmount DESC
        """)

    rows = []
    for r in cur.fetchall():
        rows.append({
            "EmployeeID":     r[0],
            "FullName":       r[1],
            "DepartmentName": r[2],
            "PositionName":   r[3],
            "TotalRecords":   r[4],
            "TotalAmount":    float(r[5]) if r[5] else 0,
            "FirstDate":      str(r[6]) if r[6] else "",
            "LastDate":       str(r[7]) if r[7] else "",
        })

    # Tổng cộng
    grand_total = sum(r["TotalAmount"] for r in rows)

    return jsonify({
        "status": "success",
        "year":        year or "all",
        "data":        rows,
        "GrandTotal":  grand_total
    })



# ============================================================
# SEED – Batch insert lương + chấm công (dùng cho script seed)
# POST /api/seed/payroll-attendance
# ============================================================

@router.route("/api/seed/payroll-attendance", methods=["POST"])
def seed_payroll_attendance():
    """
    Batch insert lương + chấm công cho nhiều nhân viên nhiều tháng.
    Dùng bởi script database/seed_via_api.py.
    Body: { "records": [ { EmployeeID, SalaryMonth (YYYY-MM-DD),
                            BaseSalary, Bonus, Deductions,
                            WorkDays, LeaveDays, AbsentDays, OvertimeHours }, ... ] }
    SalaryMonth dạng DATE: '2025-05-01', '2025-06-01', ...
    """
    data    = request.get_json()
    records = data.get("records", [])

    if not records:
        return jsonify({"status": "error", "msg": "Không có dữ liệu"}), 400

    my     = get_mysql_connection()
    my_cur = my.cursor()

    inserted_salary     = 0
    inserted_attendance = 0
    skipped             = 0

    try:
        for r in records:
            emp_id        = r["EmployeeID"]
            salary_month  = r["SalaryMonth"]   # YYYY-MM-DD
            attend_month  = int(r["AttendanceMonth"])
            attend_year   = int(r["AttendanceYear"])
            base_s        = r["BaseSalary"]
            bonus         = r["Bonus"]
            deduct        = r["Deductions"]
            work_d        = r["WorkDays"]
            leave_d       = r["LeaveDays"]
            absent        = r["AbsentDays"]
            overtime      = r["OvertimeHours"]

            # Insert lương — bỏ qua nếu đã tồn tại (IGNORE)
            my_cur.execute("""
                INSERT IGNORE INTO salaries
                    (EmployeeID, SalaryMonth, BaseSalary, Bonus, Deductions)
                VALUES (%s, %s, %s, %s, %s)
            """, (emp_id, salary_month, base_s, bonus, deduct))
            if my_cur.rowcount > 0:
                inserted_salary += 1
            else:
                skipped += 1

            # Insert chấm công — bỏ qua nếu đã tồn tại
            my_cur.execute("""
                INSERT IGNORE INTO attendance
                    (EmployeeID, AttendanceMonth, AttendanceYear,
                     WorkDays, LeaveDays, AbsentDays, OvertimeHours)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (emp_id, attend_month, attend_year, work_d, leave_d, absent, overtime))
            if my_cur.rowcount > 0:
                inserted_attendance += 1

        my.commit()

    except Exception as e:
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({
        "status":               "success",
        "inserted_salary":      inserted_salary,
        "inserted_attendance":  inserted_attendance,
        "skipped":              skipped,
        "total_records":        len(records),
    })


# ============================================================
# ML ALERTS – Cảnh báo thông minh từ Isolation Forest
# GET /api/alerts
# ============================================================

@router.route("/api/alerts", methods=["GET"])
def get_alerts():
    """
    Chạy ML pipeline (Isolation Forest) trên dữ liệu lương + chấm công,
    trả về danh sách cảnh báo có nghĩa nghiệp vụ.
    """
    try:
        import sys, os
        sys.path.insert(0, os.path.dirname(__file__))
        from ml.alerts import generate_alerts
        alerts = generate_alerts()
        return jsonify({
            "status": "success",
            "count":  len(alerts),
            "data":   alerts,
        })
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500


# ============================================================
# DEPARTMENT PERFORMANCE – Điểm năng lực thực từ dữ liệu DB
# GET /api/departments/performance
# ============================================================

@router.route("/api/departments/performance", methods=["GET"])
def get_department_performance():
    """
    Tính điểm năng lực thực tế cho từng phòng ban (0-100) dựa trên:
    - Hiệu suất:  NetSalary / BaseSalary * 100 (tỷ lệ lương thực nhận)
    - Chấm công:  WorkDays / 22 * 100 (tỷ lệ ngày làm)
    - Chi phí:    100 - (Deductions / BaseSalary * 100) (khấu trừ thấp = tốt)
    - Tăng trưởng: % tăng lương TB so tháng trước (chuẩn hóa 0-100)
    - Năng động:  % nhân viên có OvertimeHours > 0
    """
    my  = get_mysql_connection()
    cur = my.cursor(dictionary=True)

    # Lấy 2 tháng gần nhất
    cur.execute("""
        SELECT DISTINCT DATE_FORMAT(SalaryMonth, '%Y-%m') AS m
        FROM salaries
        ORDER BY m DESC
        LIMIT 2
    """)
    months = [r["m"] for r in cur.fetchall()]
    if not months:
        return jsonify({"status": "success", "data": []})

    latest = months[0]
    prev   = months[1] if len(months) > 1 else months[0]

    # Lương tháng hiện tại theo phòng ban
    cur.execute("""
        SELECT
            ep.DepartmentID,
            dp.DepartmentName,
            AVG(s.BaseSalary)                                   AS AvgBase,
            AVG(s.Deductions)                                   AS AvgDed,
            AVG(s.BaseSalary + s.Bonus - s.Deductions)          AS AvgNet,
            COUNT(s.EmployeeID)                                 AS EmpCount
        FROM salaries s
        JOIN employees_payroll  ep ON s.EmployeeID   = ep.EmployeeID
        LEFT JOIN departments_payroll dp ON ep.DepartmentID = dp.DepartmentID
        WHERE DATE_FORMAT(s.SalaryMonth, '%Y-%m') = %s
        GROUP BY ep.DepartmentID, dp.DepartmentName
    """, (latest,))
    latest_sal = {r["DepartmentID"]: r for r in cur.fetchall()}

    # Lương tháng trước theo phòng ban
    cur.execute("""
        SELECT ep.DepartmentID,
               AVG(s.BaseSalary + s.Bonus - s.Deductions) AS AvgNet
        FROM salaries s
        JOIN employees_payroll ep ON s.EmployeeID = ep.EmployeeID
        WHERE DATE_FORMAT(s.SalaryMonth, '%Y-%m') = %s
        GROUP BY ep.DepartmentID
    """, (prev,))
    prev_sal = {r["DepartmentID"]: float(r["AvgNet"] or 0) for r in cur.fetchall()}

    # Chấm công tháng hiện tại theo phòng ban
    cur.execute("""
        SELECT
            ep.DepartmentID,
            AVG(a.WorkDays)                                     AS AvgWork,
            AVG(a.AbsentDays)                                   AS AvgAbsent,
            SUM(CASE WHEN a.OvertimeHours > 0 THEN 1 ELSE 0 END) AS OTCount,
            COUNT(a.EmployeeID)                                 AS Total
        FROM attendance a
        JOIN employees_payroll ep ON a.EmployeeID = ep.EmployeeID
        WHERE a.AttendanceMonth = MONTH(%s) AND a.AttendanceYear = YEAR(%s)
        GROUP BY ep.DepartmentID
    """, (latest + "-01", latest + "-01"))
    attend = {r["DepartmentID"]: r for r in cur.fetchall()}

    # Tổng hợp điểm
    result = []
    for dept_id, sal in latest_sal.items():
        avg_base = float(sal["AvgBase"] or 1)
        avg_ded  = float(sal["AvgDed"]  or 0)
        avg_net  = float(sal["AvgNet"]  or 0)
        prev_net = prev_sal.get(dept_id, avg_net)

        att = attend.get(dept_id, {})
        avg_work  = float(att.get("AvgWork",   20) or 20)
        ot_count  = int(att.get("OTCount",      0) or 0)
        total_att = int(att.get("Total",         1) or 1)

        # Tính điểm từng trục (0-100)
        score_hieu_suat  = min(100, round(avg_net / avg_base * 100, 1)) if avg_base > 0 else 50
        score_cham_cong  = min(100, round(avg_work / 22 * 100, 1))
        score_chi_phi    = min(100, max(0, round(100 - (avg_ded / avg_base * 100), 1))) if avg_base > 0 else 50
        growth_pct       = ((avg_net - prev_net) / prev_net * 100) if prev_net > 0 else 0
        score_tang_truong= min(100, max(0, round(50 + growth_pct * 2, 1)))  # 50 = baseline
        score_nang_dong  = min(100, round(ot_count / total_att * 100, 1)) if total_att > 0 else 0

        result.append({
            "DepartmentID":   dept_id,
            "DepartmentName": sal["DepartmentName"] or f"Phòng {dept_id}",
            "HieuSuat":       score_hieu_suat,
            "ChamCong":       score_cham_cong,
            "ChiPhi":         score_chi_phi,
            "TangTruong":     score_tang_truong,
            "NangDong":       score_nang_dong,
            "AvgNet":         round(avg_net),
            "EmpCount":       int(sal["EmpCount"] or 0),
        })

    result.sort(key=lambda x: x["DepartmentName"])
    return jsonify({"status": "success", "data": result, "month": latest})


# ============================================================
# GLOBAL SEARCH – Tìm kiếm nhân viên toàn hệ thống
# GET /api/search?q=keyword
# ============================================================

@router.route("/api/search", methods=["GET"])
def global_search():
    """
    Tìm kiếm nhân viên theo tên, email, mã NV, phòng ban.
    Query params: ?q=keyword (tối thiểu 2 ký tự)
    Trả về tối đa 10 kết quả.
    """
    q = request.args.get("q", "").strip()
    if len(q) < 2:
        return jsonify({"status": "success", "data": []})

    sql = get_sqlserver_connection()
    cur = sql.cursor()

    like = f"%{q}%"
    cur.execute("""
        SELECT TOP 10
            e.EmployeeID,
            e.FullName,
            e.Email,
            e.Status,
            d.DepartmentName,
            p.PositionName
        FROM Employees e
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Positions   p ON e.PositionID   = p.PositionID
        WHERE
            e.FullName       LIKE ?  OR
            e.Email          LIKE ?  OR
            d.DepartmentName LIKE ?  OR
            CAST(e.EmployeeID AS NVARCHAR) LIKE ?
        ORDER BY
            CASE WHEN e.Status = 'Active' THEN 0 ELSE 1 END,
            e.FullName
    """, (like, like, like, like))

    rows = []
    for r in cur.fetchall():
        rows.append({
            "EmployeeID":     r[0],
            "FullName":       r[1],
            "Email":          r[2],
            "Status":         r[3],
            "DepartmentName": r[4] or "—",
            "PositionName":   r[5] or "—",
        })

    return jsonify({"status": "success", "data": rows, "query": q})
