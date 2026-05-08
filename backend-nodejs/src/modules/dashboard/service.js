import { querySQL, getPool } from "../../config/mssql.js";
import { db } from "../../config/mysql.js";

export async function getAll() {
    const employees = await querySQL(`
    SELECT e.EmployeeID, e.FullName, e.Status,
           d.DepartmentName,
           p.PositionName
    FROM Employees e
    JOIN Departments d ON e.DepartmentID = d.DepartmentID
    JOIN Positions p ON e.PositionID = p.PositionID
  `);
    console.log(employees);
    const [salaries] = await db.execute("SELECT * FROM salaries");
    const [attendance] = await db.execute("SELECT * FROM attendance");

    return employees.map(e => {
        const salary = salaries.find(s => s.EmployeeID == e.EmployeeID);
        const att = attendance.find(a => a.EmployeeID == e.EmployeeID);

        const alerts = [];

        if (att?.AbsentDays > 3) alerts.push("Absent too much");
        if (salary?.Bonus > 2000000) alerts.push("High bonus");

        return {
            ...e,
            status: e.Status,
            salary,
            attendance: att,
            alerts
        };
    });
}

// ---------------------------------------------------------
// 1. Quản lý Thông tin Nhân viên (Đồng bộ MSSQL & MySQL)
// ---------------------------------------------------------

export async function searchEmployees(keyword) {
    const pool = await getPool();
    const result = await pool.request()
        .input("keyword", `%${keyword}%`)
        .query(`
            SELECT e.EmployeeID, e.FullName, e.Status, d.DepartmentName, p.PositionName, e.DepartmentID, e.PositionID
            FROM Employees e
            LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
            LEFT JOIN Positions p ON e.PositionID = p.PositionID
            WHERE e.FullName LIKE @keyword
        `);
    const employees = result.recordset;

    const [salaries] = await db.execute("SELECT * FROM salaries");
    const [attendance] = await db.execute("SELECT * FROM attendance");

    return employees.map(e => {
        const salary = salaries.find(s => s.EmployeeID == e.EmployeeID);
        const att = attendance.find(a => a.EmployeeID == e.EmployeeID);
        const alerts = [];
        if (att?.AbsentDays > 3) alerts.push("Absent too much");
        if (salary?.Bonus > 2000000) alerts.push("High bonus");

        return {
            ...e,
            Status: e.Status,
            salary,
            attendance: att,
            alerts
        };
    });
}

export async function createEmployee(data) {
    console.log("Creating employee with data:", data);
    const { FullName, DepartmentID, PositionID, Status } = data;
    const pool = await getPool();

    const DateOfBirth =
        data.DateOfBirth && data.DateOfBirth.trim()
            ? data.DateOfBirth
            : "2000-01-01";

    const HireDate =
        data.HireDate && data.HireDate.trim()
            ? data.HireDate
            : new Date().toISOString().split("T")[0];

    const timestamp = Date.now();
    const defaultEmail = `employee_${timestamp}@company.vn`;
    const defaultPhone = `0${Math.floor(100000000 + Math.random() * 900000000)}`;

    console.log("Inserting into MSSQL...");
    const result = await pool.request()
        .input("FullName", FullName)
        .input("DepartmentID", DepartmentID)
        .input("PositionID", PositionID)
        .input("DateOfBirth", DateOfBirth)
        .input("HireDate", HireDate)
        .input("Status", Status || 'Đang làm việc')
        .input("Email", defaultEmail)
        .input("PhoneNumber", defaultPhone)
        .input("Gender", "Nam")
        .query(`
            INSERT INTO Employees 
                (FullName, DepartmentID, PositionID, DateOfBirth, HireDate, Status, Email, PhoneNumber, Gender)
            OUTPUT INSERTED.EmployeeID
            VALUES 
                (@FullName, @DepartmentID, @PositionID, @DateOfBirth, @HireDate, @Status, @Email, @PhoneNumber, @Gender)
        `);

    const employeeId = result.recordset[0].EmployeeID;
    console.log("MSSQL inserted, EmployeeID:", employeeId);

    console.log("Inserting into MySQL...");
    await db.execute(`
        INSERT INTO employees_payroll (EmployeeID, FullName, DepartmentID, PositionID, Status)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            FullName=VALUES(FullName),
            DepartmentID=VALUES(DepartmentID),
            PositionID=VALUES(PositionID),
            Status=VALUES(Status)
    `, [employeeId, FullName, DepartmentID, PositionID, Status || 'Đang làm việc']);
    console.log("MySQL inserted successfully");

    return {
        EmployeeID: employeeId,
        FullName,
        DepartmentID,
        PositionID,
        DateOfBirth,
        HireDate,
        Status: Status || 'Đang làm việc'
    };
}
export async function updateEmployee(id, data) {
    console.log("Updating employee with ID:", id, "Data:", data);
    const { FullName, DepartmentID, PositionID, Status } = data;
    const pool = await getPool();

    await pool.request()
        .input("id", parseInt(id))
        .input("FullName", FullName)
        .input("DepartmentID", DepartmentID)
        .input("PositionID", PositionID)
        .input("Status", Status)
        .query(`
            UPDATE Employees
            SET FullName = @FullName,
                DepartmentID = @DepartmentID,
                PositionID = @PositionID,
                Status = @Status
            WHERE EmployeeID = @id
        `);

    await db.execute(`
        UPDATE employees_payroll
        SET FullName = ?,
            DepartmentID = ?,
            PositionID = ?,
            Status = ?
        WHERE EmployeeID = ?
    `, [FullName, DepartmentID, PositionID, Status, parseInt(id)]);

    return { EmployeeID: id, ...data };
}

export async function removeEmployee(id) {
    console.log("Removing employee with ID:", id);
    const pool = await getPool();

    try {
        await pool.request()
            .input("id", parseInt(id))
            .query(`
                DELETE FROM Dividends
                WHERE EmployeeID = @id
            `);
    } catch (e) {
        console.log("No Dividends records to delete or error:", e.message);
    }

    await pool.request()
        .input("id", parseInt(id))
        .query(`
            DELETE FROM Employees
            WHERE EmployeeID = @id
        `);

    try {
        await db.execute(`
            DELETE FROM attendance
            WHERE EmployeeID = ?
        `, [parseInt(id)]);
    } catch (e) {
        console.log("No attendance records to delete or error:", e.message);
    }

    try {
        await db.execute(`
            DELETE FROM salaries
            WHERE EmployeeID = ?
        `, [parseInt(id)]);
    } catch (e) {
        console.log("No salary records to delete or error:", e.message);
    }

    try {
        await db.execute(`
            DELETE FROM employees_payroll
            WHERE EmployeeID = ?
        `, [parseInt(id)]);
    } catch (e) {
        console.log("Error deleting from employees_payroll:", e.message);
    }

    return { success: true, EmployeeID: id };
}

export async function syncEmployees() {
    const pool = await getPool();
    const employees = await pool.request().query("SELECT * FROM Employees");

    for (const e of employees.recordset) {
        await db.execute(`
            INSERT INTO employees_payroll (EmployeeID, FullName, DepartmentID, PositionID, Status)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                FullName=VALUES(FullName),
                DepartmentID=VALUES(DepartmentID),
                PositionID=VALUES(PositionID)
        `, [e.EmployeeID, e.FullName, e.DepartmentID, e.PositionID, 'Đang làm việc']);
    }

    return { success: true, message: "Employees synced successfully" };
}

// ---------------------------------------------------------
// 2. Quản lý Tổ chức (Đồng bộ MSSQL & MySQL)
// ---------------------------------------------------------

export async function getOrganization() {
    const pool = await getPool();
    const depts = await pool.request().query("SELECT * FROM Departments");
    const pos = await pool.request().query("SELECT * FROM Positions");

    const [mysqlDepts] = await db.execute("SELECT * FROM departments_payroll");
    const [mysqlPos] = await db.execute("SELECT * FROM positions_payroll");

    return {
        departments: depts.recordset.map(d => ({
            ...d,
            isSynced: mysqlDepts.some(md => md.DepartmentID === d.DepartmentID)
        })),
        positions: pos.recordset.map(p => ({
            ...p,
            isSynced: mysqlPos.some(mp => mp.PositionID === p.PositionID)
        }))
    };
}

export async function updateDepartment(id, name) {
    const pool = await getPool();

    // Chỉ Update MSSQL
    await pool.request()
        .input("id", id)
        .input("name", name)
        .query(`
            UPDATE Departments
            SET DepartmentName = @name
            WHERE DepartmentID = @id
        `);

    return { DepartmentID: id, DepartmentName: name };
}

export async function updatePosition(id, name) {
    const pool = await getPool();

    // Chỉ Update MSSQL
    await pool.request()
        .input("id", id)
        .input("name", name)
        .query(`
            UPDATE Positions
            SET PositionName = @name
            WHERE PositionID = @id
        `);

    return { PositionID: id, PositionName: name };
}

export async function syncOrganization() {
    const pool = await getPool();
    const deps = await pool.request().query("SELECT * FROM Departments");
    const pos = await pool.request().query("SELECT * FROM Positions");

    for (const d of deps.recordset) {
        await db.execute(`
            INSERT INTO departments_payroll (DepartmentID, DepartmentName)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE DepartmentName=VALUES(DepartmentName)
        `, [d.DepartmentID, d.DepartmentName]);
    }

    for (const p of pos.recordset) {
        await db.execute(`
            INSERT INTO positions_payroll (PositionID, PositionName)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE PositionName=VALUES(PositionName)
        `, [p.PositionID, p.PositionName]);
    }

    return { success: true, message: "Organization synced successfully" };
}
