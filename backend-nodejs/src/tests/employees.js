import axios from "axios";

const API = "http://localhost:3000/api/employees";

export async function testEmployees() {
    console.log("\n👥 TEST EMPLOYEES");

    // GET ALL
    const all = await axios.get(API);
    console.log("✅ GET ALL:", all.data);

    // SEARCH
    const search = await axios.get(`${API}/search?q=Tran`);
    console.log("✅ SEARCH:", search.data);

    // DELETE
    // const result = await axios.delete(`${API}/11`);
    // console.log("✅ DELETE:", result.data);

    // // CREATE
    // await axios.post(API, {
    //     FullName: "Test User",
    //     DepartmentID: 1,
    //     PositionID: 1,
    //     Status: "Test"
    // });
    // console.log("✅ CREATE OK");

    // // UPDATE
    // await axios.put(`${API}/1`, {
    //     FullName: "Updated Name",
    //     DepartmentID: 1,
    //     PositionID: 1,
    //     Status: "Updated"
    // });
    // console.log("✅ UPDATE OK");
}