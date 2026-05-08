import { testEmployees } from "./employees.js";
import { testOrg } from "./org.js";
import { testDashboard } from "./dashboard.js";
import { testSync } from "./sync.js";

(async () => {
    try {
        console.log("🚀 RUN ALL TESTS");

        // await testEmployees();
        // await testOrg();
        // await testSync();
        await testDashboard();

        console.log("\n🎉 ALL TEST DONE");
    } catch (err) {
        console.error("❌ TEST ERROR:", err.response?.data || err.message);
    }
})();