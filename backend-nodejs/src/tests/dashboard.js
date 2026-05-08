import axios from "axios";

const API = "http://localhost:3000/api/dashboard";

// =========================
// HELPER REQUEST WRAPPER
// =========================
async function safe(label, fn) {
    try {
        console.log(`\n🚀 ${label}`);
        const res = await fn();
        console.log("✅ SUCCESS:", res.data);
        return res.data;
    } catch (err) {
        console.log("❌ ERROR:", err.response?.data || err.message);
    }
}

// =========================
// 1. DASHBOARD
// =========================
// export async function testDashboard() {
//     await safe("TEST DASHBOARD", () =>
//         axios.get(`${API}/dashboard`)
//     );
// }

// =========================
// 2. EMPLOYEES
// =========================
export async function testGetEmployees() {
    await safe("GET EMPLOYEES", () =>
        axios.get(`${API}/employees`)
    );
}

export async function testSearchEmployees() {
    await safe("SEARCH EMPLOYEES (keyword: a)", () =>
        axios.get(`${API}/employees?q=a`)
    );
}

export async function testCreateEmployee() {
    const payload = {
        FullName: "Nguyen Van A",
        DepartmentID: 1,
        PositionID: 1
    };

    return await safe("CREATE EMPLOYEE", () =>
        axios.post(`${API}/employees`, payload)
    );
}

export async function testUpdateEmployee(id) {
    const payload = {
        FullName: "Nguyen Van B",
        DepartmentID: 2,
        PositionID: 2
    };

    return await safe("UPDATE EMPLOYEE", () =>
        axios.put(`${API}/employees/${id}`, payload)
    );
}

export async function testDeleteEmployee(id) {
    await safe("DELETE EMPLOYEE", () =>
        axios.delete(`${API}/employees/${id}`)
    );
}

export async function testSyncEmployees() {
    await safe("SYNC EMPLOYEES", () =>
        axios.post(`${API}/employees/sync`)
    );
}

// =========================
// 3. ORGANIZATION
// =========================
export async function testGetOrganization() {
    await safe("GET ORGANIZATION", () =>
        axios.get(`${API}/organization`)
    );
}

export async function testUpdateDepartment() {
    await safe("UPDATE DEPARTMENT", () =>
        axios.put(`${API}/departments/1`, {
            name: "Updated Department " + Date.now()
        })
    );
}

export async function testUpdatePosition() {
    await safe("UPDATE POSITION", () =>
        axios.put(`${API}/positions/1`, {
            name: "Updated Position " + Date.now()
        })
    );
}

export async function testSyncOrganization() {
    await safe("SYNC ORGANIZATION", () =>
        axios.post(`${API}/organization/sync`)
    );
}

// =========================
// RUN ALL TESTS
// =========================
async function runAll() {
    console.log("\n=========================");
    console.log("🧪 START FULL API TEST");
    console.log("=========================");

    // await testDashboard();

    await testGetEmployees();
    await testSearchEmployees();

    // const created = await testCreateEmployee();
    // const id = created?.EmployeeID;

    // if (id) {
    // } else {
    //     console.log("⚠️ Skip update/delete because create failed");
    // }
    // await testDeleteEmployee(id);
    await testUpdateEmployee(id);

    // await testSyncEmployees();

    // await testGetOrganization();
    // await testUpdateDepartment();
    // await testUpdatePosition();
    // await testSyncOrganization();

    console.log("\n=========================");
    console.log("🏁 TEST DONE");
    console.log("=========================");
}

runAll();