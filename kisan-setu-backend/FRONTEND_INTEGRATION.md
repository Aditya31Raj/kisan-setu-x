# Frontend integration

Use `withCredentials: true` (Axios) or `credentials: 'include'` (fetch).

// FRONTEND CHANGE REQUIRED:
// Authentication is cookie based. Do not store access/refresh tokens in localStorage.

1. GET `/api/v1/auth/csrf` before state-changing auth requests.
2. Send `X-CSRF-Token` on POST/PATCH/DELETE protected by CSRF middleware.
3. Login with `/auth/login`, then call `/auth/me` for role/profile.
4. Refresh with `/auth/refresh`; the server rotates the refresh token.
5. Logout with `/auth/logout` and clear frontend state.
6. Route UI by role: FARMER, BUYER, PRAKHAND_ADMIN, SUPER_ADMIN. Backend remains authoritative.
7. Never send trusted payment amount; backend calculates it.
8. Never store password, Aadhaar, UPI PIN, CVV or refresh token in frontend state.
9. Use pagination parameters `page` and `limit` for lists.
10. Display backend `requestId` when reporting technical support issues.
