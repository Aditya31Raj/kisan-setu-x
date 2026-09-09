import * as s from '../services/logistics.service.js';
import {success} from '../utils/response.js';

export const list = async (req, res) => success(res, await s.list(req.user.id, req.user.role, req.query));
export const create = async (req, res) => success(res, await s.create(req.user.id, req.body, req), 'Logistics created', 201);
export const getOne = async (req, res) => success(res, await s.get(req.user.id, req.user.role, req.params.id));
export const updateStatus = async (req, res) => success(res, await s.status(req.user.id, req.user.role, req.params.id, req.body, req), 'Logistics updated');

