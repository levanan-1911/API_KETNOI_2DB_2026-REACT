import sql from "mssql";

const config = {
    user: "sa",
    password: "123456",
    server: "localhost",
    database: "HUMAN_2025",
    port: 1433,
    options: {
        trustServerCertificate: true
    }
};

let pool;

export async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

export async function querySQL(query) {
    const pool = await sql.connect(config);
    const result = await pool.request().query(query);
    return result.recordset;
}