import * as service from "./service.js";

/**
 * CREATE
 */
export const create = async (req, res, next) => {
    try {
        const result = await service.create(req.body);
        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err); // 👈 QUAN TRỌNG để tránh ECONNRESET/crash
    }
};

/**
 * GET ALL
 */
export const getAll = async (req, res, next) => {
    try {
        const result = await service.getAll();
        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * SEARCH
 */
export const search = async (req, res, next) => {
    try {
        const { q } = req.query;
        const result = await service.search(q);
        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const result = await service.update(req.params.id, req.body);
        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        const result = await service.remove(req.params.id);
        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
};