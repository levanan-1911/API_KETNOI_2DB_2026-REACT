import express from "express";
import cors from "cors";

import employeeRoutes from "./modules/employees/routes.js";
import orgRoutes from "./modules/organization/routes.js";
import dashboardRoutes from "./modules/dashboard/routes.js";
import syncRoutes from "./modules/sync/routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/employees", employeeRoutes);
app.use("/api/org", orgRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sync", syncRoutes);

export default app;