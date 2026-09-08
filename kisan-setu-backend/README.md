# KISAN SETU Backend

Direct Market. Fair Price. Stronger Farmers.

## Architecture

React/Next.js -> HTTPS/WAF -> Load Balancer -> Node.js/Express -> PostgreSQL + Redis

Modules: Authentication, RBAC, MSP engine, Produce, Orders, Payments, Logistics, Inputs, Grievances, Disputes, Notifications, Reports, Audit.

External provider abstractions: mock payment, mock identity/eKYC, mock notification, future Python ML forecast service.

## Run locally

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Swagger: http://localhost:5000/api-docs
Health: http://localhost:5000/health

## Docker

```bash
docker compose up --build
```

The demo compose uses `prisma db push` because the ZIP intentionally does not ship an environment-specific generated migration history. For production, generate/review a migration with `npx prisma migrate dev --name init` and deploy it with `npx prisma migrate deploy`.

## Security

- bcrypt password hashes
- short-lived access JWT
- rotated, hashed refresh tokens with family revocation on reuse
- HttpOnly cookies
- signed double-submit CSRF token
- Helmet/CORS/HPP/rate limiting
- Zod validation
- RBAC and ownership checks
- atomic inventory reservation
- server-side payment amount calculation
- payment idempotency key
- immutable audit records by application convention
- no raw Aadhaar/UPI credentials

## SIH limitations

This is not a claim of 100% production security. Production additionally needs HTTPS, cloud IAM, secrets manager, encryption at rest, backups, WAF/DDoS, monitoring, dependency/container scanning, penetration testing, vulnerability management and official payment/eKYC compliance.
