# TideMesh (CoastShield AI) — Backend & Database Guide

> **Role & Ownership:** P3 (Backend / Database / Infrastructure)  
> **Status:** Phase 1 Complete (Neon PostgreSQL + PostGIS + Drizzle ORM + Hono.js + Cloudflare Workers architecture)

---

## 1. Overview & Architecture

The TideMesh backend is built with:
- **API Runtime:** [Hono.js](https://hono.dev) — Cloudflare Workers-compatible, ultra-fast TypeScript web framework.
- **Database:** [Neon Serverless PostgreSQL](https://neon.tech) — Managed cloud PostgreSQL instance with branch support.
- **Geospatial Engine:** [PostGIS 3.6](https://postgis.net) — Native spatial extension for compound flood polygons, roads, facilities, and risk zones.
- **ORM & Migrations:** [Drizzle ORM](https://orm.drizzle.team) & [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) — Type-safe SQL builder using `@neondatabase/serverless` HTTP connection pooling.
- **Shared Contracts:** [Zod](https://zod.dev) schema validation in `packages/contracts/` for cross-team typed guarantees (P1, P2, P3, P4).

### Key Architectural Decisions
1. **Cloud-Hosted Only:** No local Docker container is required or allowed for the primary development database; all environments connect to cloud-hosted Neon branches.
2. **HTTP Driver:** The API connects via `@neondatabase/serverless` + `drizzle-orm/neon-http`. This is connectionless and natively executes in serverless/edge environments (Cloudflare Workers) without TCP socket exhaustion.
3. **WGS 84 (SRID 4326):** All PostGIS geometries (polygons for zones and buildings, linestrings for roads, points for facilities) standardize on **SRID 4326** (standard GPS longitude/latitude).

---

## 2. Directory Structure

```text
├── docs/
│   └── backend.md                           # This document
├── packages/
│   └── contracts/                           # Cross-team typed Zod contracts
│       ├── src/
│       │   ├── enums.ts                     # SeverityLevel, UserRole, FacilityType
│       │   ├── prediction.ts                # FloodPrediction contract
│       │   ├── impact.ts                    # FloodImpact contract
│       │   ├── priority.ts                  # ResponsePriority contract
│       │   ├── alert.ts                     # Alert contract
│       │   ├── zone.ts                      # Zone contract
│       │   ├── user.ts                      # User contract
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── services/
│   └── api/
│       ├── drizzle/                         # Generated SQL migrations
│       │   ├── 0000_nosy_storm.sql          # PostGIS extension + initial tables
│       │   └── meta/
│       ├── scripts/
│       │   ├── migrate.ts                   # Migration execution & PostGIS verification
│       │   ├── seed.ts                      # Development seed script (mock data)
│       │   └── check-postgis.ts             # Direct PostGIS & tables health checker
│       ├── src/
│       │   ├── db/
│       │   │   ├── schema.ts                # 10 CoastShield tables with PostGIS types & GIST indexes
│       │   │   └── index.ts                 # Database factory & contextual resolver
│       │   ├── middleware/
│       │   │   ├── error.middleware.ts      # Sanitized error handler (no leaked secrets)
│       │   │   └── logger.middleware.ts     # Request logger
│       │   ├── routes/
│       │   │   └── health.ts                # GET /api/v1/health & /api/v1/health/db
│       │   ├── services/
│       │   │   └── health.service.ts        # Database & PostGIS ping service
│       │   ├── schemas/
│       │   │   └── index.ts                 # Shared schemas export
│       │   └── index.ts                     # Hono application entry point
│       ├── tests/
│       │   ├── health.test.ts               # Health endpoints tests
│       │   ├── db.test.ts                   # Neon DB & PostGIS spatial query tests
│       │   ├── contracts.test.ts            # Zod validation & boundary tests
│       │   └── run-all.ts                   # Master test runner
│       ├── .env.example
│       ├── drizzle.config.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── wrangler.toml
├── .env.example
├── package.json                             # Monorepo root package.json
└── README.md
```

---

## 3. Required Tools

Ensure the following tools are installed on your workstation:
- **Node.js**: `v20+` (tested on Node v26)
- **npm**: `v10+`
- **Neon CLI** (optional for local branch management):
  ```bash
  npm i -g neon@latest
  ```

---

## 4. Neon Database Setup

### Step 1: Neon Account & Project
1. Log in or create an account at [console.neon.tech](https://console.neon.tech).
2. Create or link a Neon project. (The current project linked in this repo is `TideMesh` / `shiny-term-02882387`).
3. Ensure the project is linked in `services/api`:
   ```bash
   cd services/api
   neon link --project-id shiny-term-02882387 --branch production -y
   ```
   This automatically pulls the connection strings into `services/api/.env.local`.

### Step 2: PostGIS Extension
PostGIS 3.6 is pre-installed in Neon. The migration script automatically enables it on empty branches using:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## 5. Environment Variables

Create `.env.local` inside `services/api/` (or copy `.env.example` to `.env`):

```bash
# Pooled connection string (used by Hono API and serverless functions)
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-summer-field-b4mr995l-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Direct / unpooled connection string (used by DDL migrations)
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:YOUR_PASSWORD@ep-summer-field-b4mr995l.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Branch identifier
NEON_BRANCH="production"

# Runtime mode
NODE_ENV="development"

# Server Port (optional, defaults to 3000)
PORT=3000
```

> **Security Note:** Never commit `.env` or `.env.local` to git. Both files are strictly ignored in `.gitignore`.

---

## 6. Database Migrations

### Generate Migrations (when modifying `src/db/schema.ts`)
```bash
cd services/api
npm run db:generate
```

### Apply Migrations to Neon
To run migrations, verify PostGIS, and create all 10 CoastShield tables:
```bash
cd services/api
npm run db:migrate
```

### Seed Development Mock Data
To populate the database with development mock data (zones with PostGIS polygon boundaries, critical facilities, roads, predictions, and alerts):
```bash
cd services/api
npm run db:seed
```

---

## 7. Database Verification

### Verify PostGIS Directly
```bash
cd services/api
npm run check:postgis
```
Expected output:
```text
PostgreSQL Version: PostgreSQL 18.6 ...
PostGIS Version: 3.6 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
Public Tables Count: 13
```

---

## 8. Running the Hono API

### Local Development (with hot reload)
```bash
cd services/api
npm run dev
```
The server will start at `http://localhost:3000`.

### Health Check Endpoints

1. **API Liveness**:
   ```bash
   curl http://localhost:3000/api/v1/health
   ```
   Response (`200 OK`):
   ```json
   {
     "status": "ok",
     "service": "tidemesh-api",
     "version": "0.1.0",
     "timestamp": "2026-10-08T10:27:59.875Z"
   }
   ```

2. **Database & PostGIS Health**:
   ```bash
   curl http://localhost:3000/api/v1/health/db
   ```
   Response (`200 OK`):
   ```json
   {
     "status": "ok",
     "database": "connected",
     "postgis": "available",
     "postgisVersion": "3.6 USE_GEOS=1 USE_PROJ=1 USE_STATS=1",
     "timestamp": "2026-10-08T10:27:59.885Z"
   }
   ```

---

## 9. Running Tests

Run the full automated test suite (shared contracts validation, Neon DB connectivity, PostGIS spatial queries, and Hono route handlers):
```bash
cd services/api
npm run test
```

From repository root:
```bash
npm run test
```

Expected output:
```text
============================================================
🌊 TideMesh (CoastShield AI) — Phase 1 Backend Test Suite
============================================================

🧪 Running Shared Contracts Zod Validation Tests...
  ✅ FloodPredictionSchema validates correct payload
  ✅ FloodPredictionSchema rejects invalid probabilities and severity
  ✅ FloodImpactSchema validates correct payload
  ✅ ResponsePrioritySchema validates correct payload
  ✅ AlertSchema validates correct payload

🧪 Running Database & PostGIS Connectivity Tests...
  ✅ Neon PostgreSQL connection ping verified
  ✅ PostGIS extension verified: 3.6 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
  ✅ Schema query verified: retrieved 3 zones
  ✅ PostGIS spatial intersection verified: Coastal Memorial Hospital inside zone-b
  ✅ Flood predictions query verified: probability=0.87, severity=HIGH

🧪 Running API Health Endpoint Tests...
  ✅ GET / returns 200 with service info
  ✅ GET /api/v1/health returns 200 with status 'ok'
  ✅ GET /api/v1/health/db returns 200 with PostGIS (3.6 USE_GEOS=1 USE_PROJ=1 USE_STATS=1)

============================================================
🏁 Test Summary: 3 passed, 0 failed
============================================================
🎉 ALL PHASE 1 ACCEPTANCE TESTS PASSED!
```

---

## 10. Initial Database Tables Reference

| Table | Description | Spatial Column |
| :--- | :--- | :--- |
| `users` | System users (citizen, responder, municipality, admin) | `location` (Point, SRID 4326) |
| `zones` | Neighborhood flood intelligence zones | `geometry` (Geometry, SRID 4326, GIST index) |
| `roads` | OpenStreetMap road segments | `geometry` (Geometry, SRID 4326, GIST index) |
| `buildings` | Buildings within pilot areas | `geometry` (Geometry, SRID 4326, GIST index) |
| `critical_facilities` | Hospitals, shelters, fire stations, schools | `geometry` (Geometry, SRID 4326, GIST index) |
| `environmental_observations` | Rainfall, tide level, storm surge time series | N/A (Indexed by timestamp) |
| `flood_predictions` | Compound flood probability, onset, peak, depth | References `zones(id)` |
| `flood_impacts` | Affected population, buildings, roads count | References `flood_predictions(id)` |
| `response_priorities` | Emergency ranking score and recommended actions | References `zones(id)` |
| `alerts` | Actionable citizen & responder flood alerts | References `zones(id)` |

---

## 11. Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| `Missing DATABASE_URL configuration` | Neither `.env.local` nor `.env` was found | Run `neon link --project-id <id> -y` or copy `.env.example` to `services/api/.env.local` |
| `function postgis_version() does not exist` | PostGIS extension not enabled on branch | Run `npm run db:migrate` which automatically runs `CREATE EXTENSION IF NOT EXISTS postgis;` |
| `Cannot find module '@tidemesh/contracts'` | Workspaces not linked or contracts not built | Run `npm install` from repository root, then `npm run api:dev` |
| `Port 3000 already in use` | Another process is listening on port 3000 | Set `PORT=3001 npm run dev` |
