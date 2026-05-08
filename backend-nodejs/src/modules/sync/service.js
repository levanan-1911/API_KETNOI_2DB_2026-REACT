import { querySQL } from "../../config/mssql.js";
import { db } from "../../config/mysql.js";
import { withLock } from "../../core/lock.js";

export async function syncOrganization() {
    return withLock(async () => {

        const deps = await querySQL("SELECT * FROM Departments");
        const pos = await querySQL("SELECT * FROM Positions");

        for (const d of deps) {
            await db.execute(`
        INSERT INTO departments_payroll (DepartmentID, DepartmentName)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE DepartmentName=VALUES(DepartmentName)
      `, [d.DepartmentID, d.DepartmentName]);
        }

        for (const p of pos) {
            await db.execute(`
        INSERT INTO positions_payroll (PositionID, PositionName)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE PositionName=VALUES(PositionName)
      `, [p.PositionID, p.PositionName]);
        }

        return { ok: true };
    });
}