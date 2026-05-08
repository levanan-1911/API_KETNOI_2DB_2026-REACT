import express from "express";
import { syncOrganization } from "./service.js";

const router = express.Router();

router.post("/organization", async (req, res) => {
    try {
        res.json(await syncOrganization());
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

export default router;