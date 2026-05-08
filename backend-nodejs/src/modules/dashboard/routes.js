import express from "express";
import * as svc from "./service.js";

const router = express.Router();

// 1. Quản lý nhân viên (Dashboard)
router.get("/employees", async (req, res) => {
    try {
        if (req.query.q) {
            res.json(await svc.searchEmployees(req.query.q));
        } else {
            res.json(await svc.getAll());
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/employees", async (req, res) => {
    try { 
        console.log("POST request to create employee with data:", req.body);
        res.json(await svc.createEmployee(req.body)); 
    } 
    catch (e) { 
        console.error("POST error:", e);
        res.status(500).json({ error: e.message }); 
    }
});

router.put("/employees/:id", async (req, res) => {
    try { 
        console.log("PUT request for employee ID:", req.params.id, "Body:", req.body);
        res.json(await svc.updateEmployee(req.params.id, req.body)); 
    } 
    catch (e) { 
        console.error("PUT error:", e);
        res.status(500).json({ error: e.message }); 
    }
});

router.delete("/employees/:id", async (req, res) => {
    try { 
        console.log("DELETE request for employee ID:", req.params.id);
        res.json(await svc.removeEmployee(req.params.id)); 
    } 
    catch (e) { 
        console.error("DELETE error:", e);
        res.status(500).json({ error: e.message }); 
    }
});

router.post("/employees/sync", async (req, res) => {
    try { res.json(await svc.syncEmployees()); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Quản lý tổ chức (Dashboard)
router.get("/organization", async (req, res) => {
    try { res.json(await svc.getOrganization()); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/departments/:id", async (req, res) => {
    try { res.json(await svc.updateDepartment(req.params.id, req.body.name)); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/positions/:id", async (req, res) => {
    try { res.json(await svc.updatePosition(req.params.id, req.body.name)); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/organization/sync", async (req, res) => {
    try { res.json(await svc.syncOrganization()); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;