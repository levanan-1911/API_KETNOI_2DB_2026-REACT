import axios from "axios";

export async function testSync() {
    console.log("\n🔄 TEST SYNC");

    const res = await axios.post("http://localhost:3000/api/sync/organization");

    console.log("✅ Sync:", res.data);
}