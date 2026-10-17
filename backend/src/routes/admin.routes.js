import {Router} from 'express';
import * as c from '../controllers/admin.controller.js';
import {authenticate} from '../middleware/authenticate.js';
import {authorize} from '../middleware/authorize.js';
import {adminLimiter} from '../middleware/rateLimiter.js';
import {csrfProtection} from '../middleware/csrf.js';

const r = Router();
r.use(authenticate, adminLimiter, authorize('PRAKHAND_ADMIN', 'SUPER_ADMIN'));

r.get('/dashboard', c.dashboard);
r.get('/farmers', c.farmers);
r.get('/buyers', c.buyers);
r.get('/orders', c.orders);
r.get('/payments', c.payments);
r.get('/alerts', c.alerts);
r.get('/audit-logs', c.auditLogs);
r.get('/reports', c.dashboard);
r.get('/users', c.users);
r.patch('/users/:id', authorize('PRAKHAND_ADMIN', 'SUPER_ADMIN'), csrfProtection, c.updateUser);

export default r;
