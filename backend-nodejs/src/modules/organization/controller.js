import * as svc from "./service.js";
import { syncOrganization } from "../sync/service.js";

export async function getDepartments(req, res) {
    res.json(await svc.getDepartments());
}

export async function getPositions(req, res) {
    res.json(await svc.getPositions());
}

export async function updateDepartment(req, res) {
    await svc.updateDepartment(req.params.id, req.body.name);
    await syncOrganization();
    res.json({ ok: true });
}

export async function updatePosition(req, res) {
    await svc.updatePosition(req.params.id, req.body.name);
    await syncOrganization();
    res.json({ ok: true });
}