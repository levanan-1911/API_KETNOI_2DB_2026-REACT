import axios from "axios";

const API = "http://localhost:3000/api/org";

export async function testOrg() {
    console.log("\n🏢 TEST ORGANIZATION");

    const deps = await axios.get(`${API}/departments`);
    console.log("✅ Departments:", deps.data.length);

    const pos = await axios.get(`${API}/positions`);
    console.log("✅ Positions:", pos.data.length);

    await axios.put(`${API}/departments/1`, {
        name: "Phòng Nhân sự TEST"
    });
    console.log("✅ Update Department OK");

    await axios.put(`${API}/positions/1`, {
        name: "Nhân viên TEST"
    });
    console.log("✅ Update Position OK");
}