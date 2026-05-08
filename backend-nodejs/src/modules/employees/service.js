import { db } from "../../config/mysql.js";

/**
 * CREATE EMPLOYEE (FIXED)
 */
export const create = async (data) => {
    const { FullName, DepartmentID, PositionID, Status } = data;

    // 1. generate EmployeeID (KHÔNG cần sửa DB)
    const [rows] = await db.query(
        "SELECT MAX(EmployeeID) AS maxId FROM employees_payroll"
    );

    const employeeID = (rows[0].maxId || 0) + 1;

    // 2. insert full fields including EmployeeID
    const sql = `
    INSERT INTO employees_payroll 
    (EmployeeID, FullName, DepartmentID, PositionID, Status)
    VALUES (?, ?, ?, ?, ?)
  `;

    await db.query(sql, [
        employeeID,
        FullName,
        DepartmentID,
        PositionID,
        Status,
    ]);

    return {
        EmployeeID: employeeID,
        ...data,
    };
};

/**
 * GET ALL EMPLOYEES
 */
export const getAll = async () => {
    const [rows] = await db.query("SELECT * FROM employees_payroll");
    return rows;
};

/**
 * SEARCH EMPLOYEE
 */
export const search = async (keyword) => {
    const [rows] = await db.query(
        `
    SELECT * FROM employees_payroll
    WHERE FullName LIKE ?
    `,
        [`%${keyword}%`]
    );

    return rows;
};

export const update = async (id, data) => {
    const { FullName, DepartmentID, PositionID, Status } = data;

    const sql = `
        UPDATE employees_payroll
        SET FullName = ?,
            DepartmentID = ?,
            PositionID = ?,
            Status = ?
        WHERE EmployeeID = ?
    `;

    await db.query(sql, [
        FullName,
        DepartmentID,
        PositionID,
        Status,
        id,
    ]);

    return {
        EmployeeID: id,
        ...data,
    };
};

export const remove = async (id) => {
    const sql = `
        DELETE FROM employees_payroll
        WHERE EmployeeID = ?
    `;

    const [result] = await db.query(sql, [id]);

    return {
        success: true,
        deletedId: id,
        affectedRows: result.affectedRows
    };
};