import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { CSRF_COOKIE, CSRF_HEADER } from '../utils/constants.js';
import { errors } from '../utils/errors.js';

const safe = new Set(['GET', 'HEAD', 'OPTIONS']);
const sign = (x) => crypto.createHmac('sha256', env.CSRF_SECRET).update(x).digest('hex');

export function issueCsrfToken(_req, res) {
  const isProd = env.NODE_ENV === 'production';
  const nonce = crypto.randomBytes(32).toString('hex');
  const token = `${nonce}.${sign(nonce)}`;
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isProd ? true : env.COOKIE_SECURE,
    sameSite: isProd ? 'none' : env.COOKIE_SAME_SITE,
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/'
  });
  return token;
}

export function csrfProtection(req, _res, next) {
  if (!env.CSRF_ENABLED || safe.has(req.method)) return next();
  const c = req.cookies?.[CSRF_COOKIE],
    h = req.get(CSRF_HEADER);
  if (!c || !h || c !== h) return next(errors.forbidden('CSRF validation failed'));
  const [nonce, mac] = c.split('.');
  if (!nonce || !mac || mac !== sign(nonce)) return next(errors.forbidden('CSRF validation failed'));
  next();
}
