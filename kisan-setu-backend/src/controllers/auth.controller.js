import * as s from '../services/auth.service.js';
import { success } from '../utils/response.js';
import { env } from '../config/env.js';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../utils/constants.js';
import { issueCsrfToken } from '../middleware/csrf.js';

const isProd = env.NODE_ENV === 'production';
const base = {
  httpOnly: true,
  secure: isProd ? true : env.COOKIE_SECURE,
  sameSite: isProd ? 'none' : env.COOKIE_SAME_SITE,
  domain: env.COOKIE_DOMAIN || undefined
};

function set(res, x) {
  res.cookie(ACCESS_COOKIE, x.accessToken, { ...base, maxAge: 900000 });
  res.cookie(REFRESH_COOKIE, x.refreshToken, {
    ...base,
    maxAge: 2592000000,
    path: '/api/v1/auth'
  });
}

function clean(x) {
  const token = x.accessToken;
  delete x.accessToken;
  delete x.refreshToken;
  delete x.refreshTokenId;
  return { ...x, token, accessToken: token };
}

export async function register(req, res) {
  const x = await s.register(req.body, req);
  set(res, x);
  issueCsrfToken(req, res);
  return success(res, clean(x), 'Registration successful', 201);
}

export async function login(req, res) {
  const x = await s.login(req.body, req);
  set(res, x);
  issueCsrfToken(req, res);
  return success(res, clean(x), 'Login successful');
}

export async function refresh(req, res) {
  const x = await s.refresh(req.cookies?.[REFRESH_COOKIE], req);
  set(res, x);
  return success(res, clean(x), 'Token refreshed');
}

export async function logout(req, res) {
  await s.logout(req.cookies?.[REFRESH_COOKIE]);
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, { ...base, path: '/api/v1/auth' });
  return success(res, null, 'Logged out');
}

export async function me(req, res) {
  return success(res, await s.me(req.user.id));
}

export async function changePassword(req, res) {
  await s.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword, req);
  return success(res, null, 'Password changed');
}

export async function forgotPassword(req, res) {
  return success(res, await s.forgotPassword(req.body.identifier, req), 'If the account exists, reset instructions will be sent');
}

export async function resetPassword(req, res) {
  await s.resetPassword(req.body.resetToken, req.body.newPassword);
  return success(res, null, 'Password reset');
}

export function csrf(req, res) {
  return success(res, { token: issueCsrfToken(req, res) }, 'CSRF token issued');
}
