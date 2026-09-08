# API list

Base: `/api/v1`

Auth: POST `/auth/register`, POST `/auth/login`, POST `/auth/refresh`, POST `/auth/logout`, GET `/auth/me`, POST `/auth/change-password`, POST `/auth/forgot-password`, POST `/auth/reset-password`, GET `/auth/csrf`.

Farmer: GET/PATCH `/farmers/me`, GET `/farmers/me/dashboard`, GET `/farmers/me/orders`, `/payments`, `/logistics`.

Buyer: GET/PATCH `/buyers/me`, GET `/buyers/me/dashboard`.

Crops: POST/GET `/crops`, GET/PATCH/DELETE `/crops/:id`.

Produce: GET `/produce`, GET `/produce/search`, GET `/produce/:id`, POST/PATCH/DELETE `/produce/:id`.

Orders: POST/GET `/orders`, GET `/orders/:id`, PATCH `/orders/:id/status`.

Payments: POST `/payments/initiate`, POST `/payments/:id/verify`, GET `/payments/:id`, GET `/payments`.

Logistics: POST `/logistics`, GET `/logistics/:id`, PATCH `/logistics/:id/status`.

Inputs: POST/GET `/input-requests`, GET `/input-requests/:id`, POST `/input-requests/:id/approve`, `/reject`, POST `/input-requests/products`.

Grievances: POST/GET `/grievances`, GET `/grievances/:id`, POST `/grievances/:id/resolve`.

Disputes: POST/GET `/disputes`, GET `/disputes/:id`, POST `/disputes/:id/resolve`.

MSP: GET `/msp`, POST `/msp/check`, POST `/msp`.

Notifications: GET `/notifications`, PATCH `/notifications/:id/read`.

Admin: GET `/admin/dashboard`, `/farmers`, `/buyers`, `/orders`, `/payments`, `/alerts`, `/audit-logs`, `/reports`, `/users`; PATCH `/admin/users/:id`.

Reports: GET `/admin/reports/monthly`, `/admin/reports/forecast/demand`.
