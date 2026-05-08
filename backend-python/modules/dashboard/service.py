import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from config import query_mssql, execute_mssql, get_mssql_pool, query_mysql, execute_mysql
from datetime import datetime
import random


async def get_all():
    employees = query_mssql("""
        SELECT e.EmployeeID, e.FullName, e.Status,
               d.DepartmentName,
               p.PositionName,
               e.DepartmentID, e.PositionID
        FROM Employees e
        JOIN Departments d ON e.DepartmentID = d.DepartmentID
        JOIN Positions p ON e.PositionID = p.PositionID
    """)
    
    salaries = query_mysql("SELECT * FROM salaries")
    attendance = query_mysql("SELECT * FROM attendance")
    
    result = []
    for e in employees:
        salary = next((s for s in salaries if s['EmployeeID'] == e['EmployeeID']), None)
        att = next((a for a in attendance if a['EmployeeID'] == e['EmployeeID']), None)
        
        alerts = []
        if att and att.get('AbsentDays', 0) > 3:
            alerts.append("Absent too much")
        if salary and salary.get('Bonus', 0) > 2000000:
            alerts.append("High bonus")
        
        result.append({
            **e,
            'status': e['Status'],
            'salary': salary,
            'attendance': att,
            'alerts': alerts
        })
    
    return result


async def search_employees(keyword: str):
    pool = get_mssql_pool()
    cursor = pool.cursor(as_dict=True)
    cursor.execute("""
        SELECT e.EmployeeID, e.FullName, e.Status, d.DepartmentName, p.PositionName, e.DepartmentID, e.PositionID
        FROM Employees e
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Positions p ON e.PositionID = p.PositionID
        WHERE e.FullName LIKE %s
    """, (f'%{keyword}%',))
    employees = cursor.fetchall()
    pool.commit()
    
    salaries = query_mysql("SELECT * FROM salaries")
    attendance = query_mysql("SELECT * FROM attendance")
    
    result = []
    for e in employees:
        salary = next((s for s in salaries if s['EmployeeID'] == e['EmployeeID']), None)
        att = next((a for a in attendance if a['EmployeeID'] == e['EmployeeID']), None)
        
        alerts = []
        if att and att.get('AbsentDays', 0) > 3:
            alerts.append("Absent too much")
        if salary and salary.get('Bonus', 0) > 2000000:
            alerts.append("High bonus")
        
        result.append({
            **e,
            'Status': e['Status'],
            'salary': salary,
            'attendance': att,
            'alerts': alerts
        })
    
    return result


async def create_employee(data: dict):
    print("Creating employee with data:", data)
    full_name = data.get('FullName')
    department_id = data.get('DepartmentID')
    position_id = data.get('PositionID')
    status = data.get('Status', 'Đang làm việc')
    
    date_of_birth = data.get('DateOfBirth', '2000-01-01')
    hire_date = data.get('HireDate', datetime.now().strftime('%Y-%m-%d'))
    
    timestamp = datetime.now().timestamp()
    default_email = f'employee_{int(timestamp)}@company.vn'
    default_phone = f'0{random.randint(100000000, 999999999)}'
    
    pool = get_mssql_pool()
    cursor = pool.cursor()
    cursor.execute("""
        INSERT INTO Employees 
            (FullName, DepartmentID, PositionID, DateOfBirth, HireDate, Status, Email, PhoneNumber, Gender)
        OUTPUT INSERTED.EmployeeID
        VALUES 
            (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (full_name, department_id, position_id, date_of_birth, hire_date, status, default_email, default_phone, 'Nam'))
    
    employee_id = cursor.fetchone()[0]
    pool.commit()
    
    execute_mysql("""
        INSERT INTO employees_payroll (EmployeeID, FullName, DepartmentID, PositionID, Status)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
            FullName=VALUES(FullName),
            DepartmentID=VALUES(DepartmentID),
            PositionID=VALUES(PositionID),
            Status=VALUES(Status)
    """, (employee_id, full_name, department_id, position_id, status))
    
    return {
        'EmployeeID': employee_id,
        'FullName': full_name,
        'DepartmentID': department_id,
        'PositionID': position_id,
        'DateOfBirth': date_of_birth,
        'HireDate': hire_date,
        'Status': status
    }


async def update_employee(employee_id: int, data: dict):
    print(f"Updating employee with ID: {employee_id}, Data:", data)
    full_name = data.get('FullName')
    department_id = data.get('DepartmentID')
    position_id = data.get('PositionID')
    status = data.get('Status')
    
    pool = get_mssql_pool()
    cursor = pool.cursor()
    cursor.execute("""
        UPDATE Employees
        SET FullName = %s,
            DepartmentID = %s,
            PositionID = %s,
            Status = %s
        WHERE EmployeeID = %s
    """, (full_name, department_id, position_id, status, employee_id))
    pool.commit()
    
    execute_mysql("""
        UPDATE employees_payroll
        SET FullName = %s,
            DepartmentID = %s,
            PositionID = %s,
            Status = %s
        WHERE EmployeeID = %s
    """, (full_name, department_id, position_id, status, employee_id))
    
    return {'EmployeeID': employee_id, **data}


async def remove_employee(employee_id: int):
    print(f"Removing employee with ID: {employee_id}")
    pool = get_mssql_pool()
    cursor = pool.cursor()
    
    try:
        cursor.execute("DELETE FROM Dividends WHERE EmployeeID = %s", (employee_id,))
        pool.commit()
    except Exception as e:
        print("No Dividends records to delete or error:", str(e))
    
    cursor.execute("DELETE FROM Employees WHERE EmployeeID = %s", (employee_id,))
    pool.commit()
    
    try:
        execute_mysql("DELETE FROM attendance WHERE EmployeeID = %s", (employee_id,))
    except Exception as e:
        print("No attendance records to delete or error:", str(e))
    
    try:
        execute_mysql("DELETE FROM salaries WHERE EmployeeID = %s", (employee_id,))
    except Exception as e:
        print("No salary records to delete or error:", str(e))
    
    execute_mysql("DELETE FROM employees_payroll WHERE EmployeeID = %s", (employee_id,))
    
    return {'success': True, 'EmployeeID': employee_id}


async def sync_employees():
    employees = query_mssql("SELECT * FROM Employees")
    
    for e in employees:
        execute_mysql("""
            INSERT INTO employees_payroll (EmployeeID, FullName, DepartmentID, PositionID, Status)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                FullName=VALUES(FullName),
                DepartmentID=VALUES(DepartmentID),
                PositionID=VALUES(PositionID)
        """, (e['EmployeeID'], e['FullName'], e['DepartmentID'], e['PositionID'], 'Đang làm việc'))
    
    return {'success': True, 'message': 'Employees synced successfully'}


async def get_organization():
    departments = query_mssql("SELECT * FROM Departments")
    positions = query_mssql("SELECT * FROM Positions")
    
    mysql_depts = query_mysql("SELECT * FROM departments_payroll")
    mysql_pos = query_mysql("SELECT * FROM positions_payroll")
    
    return {
        'departments': [
            {**d, 'isSynced': any(md['DepartmentID'] == d['DepartmentID'] for md in mysql_depts)}
            for d in departments
        ],
        'positions': [
            {**p, 'isSynced': any(mp['PositionID'] == p['PositionID'] for mp in mysql_pos)}
            for p in positions
        ]
    }


async def update_department(department_id: int, name: str):
    pool = get_mssql_pool()
    cursor = pool.cursor()
    cursor.execute("""
        UPDATE Departments
        SET DepartmentName = %s
        WHERE DepartmentID = %s
    """, (name, department_id))
    pool.commit()
    return {'DepartmentID': department_id, 'DepartmentName': name}


async def update_position(position_id: int, name: str):
    pool = get_mssql_pool()
    cursor = pool.cursor()
    cursor.execute("""
        UPDATE Positions
        SET PositionName = %s
        WHERE PositionID = %s
    """, (name, position_id))
    pool.commit()
    return {'PositionID': position_id, 'PositionName': name}


async def sync_organization():
    departments = query_mssql("SELECT * FROM Departments")
    positions = query_mssql("SELECT * FROM Positions")
    
    for d in departments:
        execute_mysql("""
            INSERT INTO departments_payroll (DepartmentID, DepartmentName)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE DepartmentName=VALUES(DepartmentName)
        """, (d['DepartmentID'], d['DepartmentName']))
    
    for p in positions:
        execute_mysql("""
            INSERT INTO positions_payroll (PositionID, PositionName)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE PositionName=VALUES(PositionName)
        """, (p['PositionID'], p['PositionName']))
    
    return {'success': True, 'message': 'Organization synced successfully'}
