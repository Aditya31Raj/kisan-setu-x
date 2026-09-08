# Kisan Setu Architecture

```text
React / Next.js
      |
     HTTPS
      v
API Gateway / Load Balancer / WAF
      |
      v
Node.js + Express
  |-- Authentication + CSRF
  |-- RBAC + ownership
  |-- MSP Engine
  |-- Produce
  |-- Orders + inventory reservation
  |-- Payments + idempotency
  |-- Logistics
  |-- Inputs
  |-- Grievances + disputes
  |-- Notifications
  |-- Reporting
  `-- Audit
      |
      +------ PostgreSQL
      |
      `------ Redis (rate limiting/cache/jobs)

Future integrations:
  |-- official UPI/payment provider
  |-- official eKYC provider
  |-- SMS/email provider
  `-- Python ML demand forecasting service
```

## Why each layer

- Routes: URL and middleware composition only.
- Controllers: HTTP request/response handling only.
- Services: business rules and transactions.
- Prisma: database access and relational consistency.
- Providers: replaceable external integrations.
- Middleware: cross-cutting security and validation.
- Audit service: immutable-by-application audit trail.

## Critical security decisions

- Access JWT is short-lived.
- Refresh token is long-lived, HttpOnly and rotated.
- Only a SHA-256 hash of refresh tokens is stored.
- Reuse of a refresh token revokes its token family.
- CSRF uses an HMAC-signed double-submit token.
- Amount is derived from server-owned order data.
- Inventory reservation uses a conditional atomic update inside a DB transaction.
- Role checks and ownership checks happen server-side.
- Aadhaar is not stored; only masked/provider references are supported.
- Payment provider is mocked; no UPI PIN/CVV/OTP is accepted or stored.
