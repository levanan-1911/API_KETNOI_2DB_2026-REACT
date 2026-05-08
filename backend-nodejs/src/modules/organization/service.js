import { db } from "../../config/mysql.js";
import { getPool } from "../../config/mssql.js";

export async function getDepartments() {
    const [rows] = await db.execute("SELECT * FROM departments_payroll");
    return rows;
}

export async function getPositions() {
    const [rows] = await db.execute("SELECT * FROM positions_payroll");
    return rows;
}

export async function updateDepartment(id, name) {
    const pool = await getPool();

    await pool.request()
        .input("id", id)
        .input("name", name)
        .query(`
      UPDATE Departments
      SET DepartmentName = @name
      WHERE DepartmentID = @id
    `);
}

export async function updatePosition(id, name) {
    const pool = await getPool();

    await pool.request()
        .input("id", id)
        .input("name", name)
        .query(`
      UPDATE Positions
      SET PositionName = @name
      WHERE PositionID = @id
    `);
}