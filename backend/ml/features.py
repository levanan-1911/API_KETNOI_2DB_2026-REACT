"""
features.py
===========
Trích xuất features từ MySQL để đưa vào ML model.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pandas as pd
from config import get_mysql_connection


def load_salary_features() -> pd.DataFrame:
    """
    Trả về DataFrame với các features lương theo nhân viên × tháng:
    - net_salary, base_salary, bonus, deductions
    - net_change_pct: % thay đổi NetSalary so tháng trước
    - deduction_ratio: deductions / base_salary
    """
    my  = get_mysql_connection()
    cur = my.cursor(dictionary=True)
    cur.execute("""
        SELECT
            s.EmployeeID,
            ep.FullName,
            ep.DepartmentID,
            ep.PositionID,
            ep.Status,
            DATE_FORMAT(s.SalaryMonth, '%Y-%m') AS month,
            s.SalaryMonth                        AS month_date,
            s.BaseSalary,
            s.Bonus,
            s.Deductions,
            (s.BaseSalary + s.Bonus - s.Deductions) AS NetSalary
        FROM salaries s
        JOIN employees_payroll ep ON s.EmployeeID = ep.EmployeeID
        ORDER BY s.EmployeeID, s.SalaryMonth
    """)
    rows = cur.fetchall()
    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df["BaseSalary"]  = df["BaseSalary"].astype(float)
    df["Bonus"]       = df["Bonus"].astype(float)
    df["Deductions"]  = df["Deductions"].astype(float)
    df["NetSalary"]   = df["NetSalary"].astype(float)

    # % thay đổi NetSalary so tháng trước (theo từng nhân viên)
    df = df.sort_values(["EmployeeID", "month_date"])
    df["prev_net"] = df.groupby("EmployeeID")["NetSalary"].shift(1)
    df["net_change_pct"] = (
        (df["NetSalary"] - df["prev_net"]) / df["prev_net"].replace(0, 1) * 100
    ).fillna(0)

    # Tỷ lệ khấu trừ
    df["deduction_ratio"] = (
        df["Deductions"] / df["BaseSalary"].replace(0, 1)
    ).fillna(0)

    return df


def load_attendance_features() -> pd.DataFrame:
    """
    Trả về DataFrame với features chấm công:
    - absent_days, leave_days, work_days, overtime_hours
    - absent_ratio: absent / (work + absent)
    """
    my  = get_mysql_connection()
    cur = my.cursor(dictionary=True)
    cur.execute("""
        SELECT
            a.EmployeeID,
            ep.FullName,
            ep.DepartmentID,
            ep.Status,
            a.AttendanceMonth  AS month_num,
            a.AttendanceYear   AS year_num,
            a.WorkDays,
            a.LeaveDays,
            a.AbsentDays,
            a.OvertimeHours
        FROM attendance a
        JOIN employees_payroll ep ON a.EmployeeID = ep.EmployeeID
        ORDER BY a.EmployeeID, a.AttendanceYear, a.AttendanceMonth
    """)
    rows = cur.fetchall()
    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df["WorkDays"]     = df["WorkDays"].astype(float)
    df["LeaveDays"]    = df["LeaveDays"].astype(float)
    df["AbsentDays"]   = df["AbsentDays"].astype(float)
    df["OvertimeHours"]= df["OvertimeHours"].astype(float)

    total = df["WorkDays"] + df["AbsentDays"]
    df["absent_ratio"] = (df["AbsentDays"] / total.replace(0, 1)).fillna(0)

    return df
