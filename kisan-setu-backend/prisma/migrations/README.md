# Migration policy

The Prisma schema is the source of truth. Generate the initial migration after configuring DATABASE_URL:

```bash
npx prisma migrate dev --name init
```

Then production deployment uses:

```bash
npx prisma migrate deploy
```

The ZIP intentionally does not contain a hand-written migration generated against an unknown PostgreSQL environment.
