# Kisan Setu - Database Architecture & Management

This directory contains the central database configuration, schema definitions, seed scripts, and management utilities for the **Kisan Setu** platform.

---

## 🗄️ Database Technology Stack

- **RDBMS**: PostgreSQL 16 (Relational Database)
- **ORM / Query Builder**: [Prisma ORM](https://www.prisma.io/) v6.x
- **In-Memory Cache**: Redis 7 (Session storage & rate-limiting)

---

## 📁 Directory Structure

```
database/
├── db-control.js        # Node.js service manager for local PostgreSQL
├── schema.prisma        # Canonical Prisma data model schema
├── seed.js              # Database seeder (Admin, Farmer, Buyer demo users & products)
└── README.md            # Database documentation and operations guide
```

---

## 🚀 How to Run the Database

The database is powered by local PostgreSQL (or cloud-managed PostgreSQL on Render in production):

### Local PostgreSQL Service Management
Control your local standalone PostgreSQL instance using the unified script commands:
```bash
# Check if PostgreSQL is running and accepting connections
npm run db:status

# Start local PostgreSQL service
npm run db:start

# Stop local PostgreSQL service
npm run db:stop
```

---

## 🛠️ Database Schema & Migrations

The database models are defined in `schema.prisma`. Primary models include:

| Model | Description |
|---|---|
| `User` | Authentication accounts (Farmers, Buyers, Admins, Super Admins) |
| `FarmerProfile` | Farmer landholding, KYC, bank DBT, location |
| `BuyerProfile` | Business credentials, trade license, GSTIN, personas |
| `Crop` / `Produce` | Agricultural listings, varieties, harvesting dates, pricing & stock |
| `Order` / `OrderItem` | Purchases, quantities, unit conversions (KG/Quintal), delivery timeline |
| `Payment` / `Escrow` | Financial escrow ledger, statutory release triggers, refunds |
| `Logistics` / `Driver` | Transport booking, fleet dispatch, GPS routing |
| `Grievance` / `Dispute` | Support tickets and dispute arbitration workflow |
| `InputListing` | Certified seeds, fertilizers, government subsidized farm inputs |

### Prisma CLI Commands (Run from root or kisan-setu-backend/)
```bash
# Push schema updates directly to the connected database
npm --prefix kisan-setu-backend run prisma:migrate
# or
npm --prefix kisan-setu-backend run prisma db push

# Run database seed script
npm run db:seed

# Launch interactive visual Prisma Studio GUI in browser
npm run db:studio
```

---

## 🔐 Default Credentials (Local Development)

- **PostgreSQL URL**: `postgresql://postgres:postgres@localhost:5432/kisan_setu?schema=public`
- **Default Database**: `kisan_setu`
- **Port**: `5432`
- **Redis Port**: `6379`
