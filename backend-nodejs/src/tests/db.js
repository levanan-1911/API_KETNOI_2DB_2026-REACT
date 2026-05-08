import { db } from "../config/mysql.js";
import { querySQL } from "../config/mssql.js";

(async () => {
    const [rows] = await db.execute("SELECT 1 as test");
    console.log("MySQL:", rows);

    const sql = await querySQL("SELECT TOP 1 * FROM Employees");
    console.log("SQL Server:", sql);
})();