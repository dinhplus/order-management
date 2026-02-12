# Inventory & Order Management

Full-stack application for managing product inventory and processing orders, built with NestJS (backend) and React + Refine (frontend).

## Features

- **Product Management**: CRUD operations for products with name, SKU, price, status, and inventory tracking
- **Order Management**: Create orders with line items, track order status through workflow (Pending → Confirmed → Shipped → Delivered)
- **Inventory Tracking**: Automatic inventory deduction on order confirmation, restoration on cancellation
- **Role-Based Access Control**:
  - **Manager**: Full access — create/edit/delete products and orders, cancel orders
  - **Warehouse Staff**: View products, view orders, update order status (except cancel)
- **Authentication**: JWT-based login with Passport
- **Pagination & Filtering**: Server-side pagination and filtering on all list endpoints
- **API Documentation**: Swagger/OpenAPI at `/api/docs`
- **Cross-Cutting Concerns**: Global error handling, request logging, response envelope, input validation

## Tech Stack

| Layer    | Technology                           |
| -------- | ------------------------------------ |
| Backend  | NestJS 11, TypeORM, PostgreSQL 15    |
| Frontend | React 18, Refine v4, Ant Design 5   |
| Auth     | JWT (Passport)                       |
| Docs     | Swagger (OpenAPI 3)                  |
| Codegen  | openapi-typescript                   |
| DevOps   | Docker, Docker Compose               |
| Runtime  | Node.js 24+ (npm workspaces)         |

---

## Quick Start

### Option A: One Command — Local Development (Recommended)

**macOS / Linux:**
> Requires: Node.js 24+, Docker (for PostgreSQL)

```bash
git clone <repo-url> && cd order-management
./start.sh
```

**Windows:**
> Requires: Node.js 24+, Docker (for PostgreSQL)

```cmd
git clone <repo-url>
cd order-management
start.bat
```

The script will automatically:
1. Check Node.js version
2. Create `backend/.env` and `frontend/.env` from `.env.example` if missing
3. Start PostgreSQL via Docker if not already running
4. Install all dependencies (npm workspaces)
5. Start backend in dev mode (port 4000) — auto-syncs DB schema + seeds data
6. Start frontend in dev mode (port 3000) — proxies `/api` to backend

Once running, open **http://localhost:3000** and login.

### Option B: Docker Compose — Full Stack in Containers (all platforms)

```bash
docker compose up --build
```

All services run in containers — no local Node.js installation needed.

### Option C: Manual Step-by-Step

<details>
<summary>Click to expand manual setup</summary>

#### 1. Prerequisites

```bash
# Install Node 24+ (via nvm)
nvm install 24 
nvm use 24

# Verify
node -v   # v24.x.x
npm -v    # 10.x.x
```

#### 2. Start PostgreSQL

```bash
# Option A: Docker (recommended)
npm run db:start

# Option B: Native PostgreSQL — create database manually
createdb order_management
```

#### 3. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env if your PostgreSQL credentials differ from defaults
```

Default `.env` values:

```
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=order_management
JWT_SECRET=super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1d
```

#### 4. Install Dependencies

```bash
# From project root — installs both backend & frontend
cd ..
npm install
```

#### 5. Start Backend

```bash
npm run dev:backend
```

On first startup, the backend will:
- Auto-create all database tables (TypeORM `synchronize: true`)
- Seed 2 users + 5 sample products

#### 6. Start Frontend (in another terminal)

```bash
npm run dev:frontend
```

</details>

---

## Accessing the Application

| Service  | URL                                 |
| -------- | ----------------------------------- |
| Frontend | http://localhost:3000                |
| API      | http://localhost:4000/api            |
| Swagger  | http://localhost:4000/api/docs       |

### Login Credentials

| Username  | Password      | Role            |
| --------- | ------------- | --------------- |
| `manager` | `password123` | Manager         |
| `staff`   | `password123` | Warehouse Staff |

### Seed Data

The backend automatically seeds on first startup (when the DB is empty):
- **2 users**: `manager` (Manager), `staff` (Warehouse Staff)
- **5 products**: Wireless Mouse, Mechanical Keyboard, USB-C Hub, Monitor Stand, Webcam HD

---

## Available Scripts

Run from the project root:

| Command                | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `./start.sh` (macOS/Linux) | Start everything locally (DB + backend + frontend) |
| `start.bat` (Windows)  | Start everything locally (DB + backend + frontend) |
| `docker compose up --build` | Start full stack via Docker Compose (all OS)  |
| `npm run dev`          | Same as `./start.sh` / `start.bat`                 |
| `npm run dev:backend`  | Start backend only (port 4000)                    |
| `npm run dev:frontend` | Start frontend only (port 3000)                   |
| `npm run build`        | Build both backend and frontend                    |
| `npm test`             | Run backend unit tests                             |
| `npm run test:cov`     | Run tests with coverage report                     |
| `npm run lint`         | Lint both backend and frontend                     |
| `npm run db:start`     | Start PostgreSQL via Docker                        |
| `npm run db:stop`      | Stop PostgreSQL container                          |
| `npm run db:reset`     | Remove and recreate PostgreSQL container           |
| `npm run docker:up`    | Start full stack via Docker Compose                |
| `npm run docker:down`  | Stop Docker Compose services                       |
| `npm run docker:reset` | Reset Docker Compose (delete volumes + rebuild)    |
| `npm run generate:spec` | Generate `openapi.json` from backend Swagger metadata |
| `npm run generate:types` | Generate spec + frontend TypeScript types        |

### Migration Scripts (backend)

| Command                | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `npm run migration:generate -- src/database/migrations/Name` | Auto-generate migration from entity changes |
| `npm run migration:create -- src/database/migrations/Name`   | Create empty migration (manual SQL)         |
| `npm run migration:run`    | Run pending migrations                          |
| `npm run migration:revert` | Rollback last migration                         |
| `npm run migration:show`   | Show migration status                           |

---

## Project Structure

```
order-management/
├── start.sh                 # Startup script (macOS/Linux) — local dev
├── start.bat                # Startup script (Windows) — local dev
├── start-docker.sh          # Startup with Docker Compose (macOS/Linux)
├── start-docker.bat         # Startup with Docker Compose (Windows)
├── docker-compose.yml       # Full-stack containerized setup
├── package.json             # Root workspace config & scripts
├── openapi.json             # Generated OpenAPI spec (gitignored)
├── .nvmrc                   # Node version (24)
│
├── backend/                 # NestJS API server
│   ├── .env.example         # Environment template
│   ├── src/
│   │   ├── main.ts              # App entry (bootstrap + seed)
│   │   ├── generate-openapi.ts  # OpenAPI spec exporter
│   │   ├── common/          # Shared: guards, filters, interceptors, decorators
│   │   ├── database/
│   │   │   ├── data-source.ts   # TypeORM CLI datasource config
│   │   │   ├── migrations/      # TypeORM migrations
│   │   │   └── seeds/           # Seed script (users + products)
│   │   └── modules/
│   │       ├── auth/        # Login, JWT, guards, strategies
│   │       ├── users/       # User entity & service
│   │       ├── products/    # Product CRUD
│   │       └── orders/      # Order CRUD + status workflow
│   └── test/                # E2E tests
│
└── frontend/                # React + Refine SPA
    ├── src/
    │   ├── App.tsx          # Refine app configuration
    │   ├── authProvider.ts  # JWT auth integration
    │   ├── dataProvider.ts  # API data provider
    │   ├── interfaces/
    │   │   ├── api.d.ts     # Generated types from OpenAPI (committed)
    │   │   └── index.ts     # Re-exports + custom types (IUser, ILoginResponse)
    │   └── pages/           # Login, Products, Orders pages
    └── nginx.conf           # Production reverse proxy config
```

---

## API Endpoints

| Method | Path                   | Auth   | Role    | Description               |
| ------ | ---------------------- | ------ | ------- | ------------------------- |
| POST   | /api/auth/login        | Public | —       | Login                     |
| GET    | /api/auth/profile      | JWT    | Any     | Current user profile      |
| GET    | /api/products          | JWT    | Any     | List products (paginated) |
| GET    | /api/products/:id      | JWT    | Any     | Get product               |
| POST   | /api/products          | JWT    | Manager | Create product            |
| PATCH  | /api/products/:id      | JWT    | Manager | Update product            |
| DELETE | /api/products/:id      | JWT    | Manager | Delete product            |
| GET    | /api/orders            | JWT    | Any     | List orders (paginated)   |
| GET    | /api/orders/:id        | JWT    | Any     | Get order                 |
| POST   | /api/orders            | JWT    | Manager | Create order              |
| PATCH  | /api/orders/:id        | JWT    | Manager | Update order              |
| PATCH  | /api/orders/:id/status | JWT    | Any*    | Update order status       |
| DELETE | /api/orders/:id        | JWT    | Manager | Delete order              |

*Cancel requires Manager role.

Full interactive API documentation: **http://localhost:4000/api/docs**

---

## OpenAPI Type Generation

Frontend TypeScript types are auto-generated from the backend's OpenAPI (Swagger) spec using [`openapi-typescript`](https://github.com/openapi-ts/openapi-typescript). This ensures frontend data models stay in sync with the API contract.

### How It Works

```
Backend Swagger metadata
        │
        ▼
  openapi.json          ← backend generates this (generate:spec)
        │
        ▼
  api.d.ts              ← frontend generates this (generate:types)
        │
        ▼
  interfaces/index.ts   ← re-exports as IProduct, IOrder, etc.
```

### Generating Types

**Full pipeline** (from project root — generates spec then types):
```bash
npm run generate:types
```

**Frontend-only** (from local `openapi.json` already on disk):
```bash
cd frontend
npm run generate:types
```

**Frontend from deployed API** (no backend source needed):
```bash
cd frontend
# Default: http://localhost:4000/api/docs-json
npm run generate:types:remote

# Or specify a deployed URL:
API_DOCS_URL=https://api.example.com/api/docs-json npm run generate:types:remote
```

### When to Regenerate

- After adding/changing a DTO, entity, or controller response type in the backend
- After pulling backend changes that modify the API contract
- Before committing frontend code that depends on new API fields

### Generated Files

`openapi.json` is in `.gitignore` — it is regenerated locally during spec generation. `frontend/src/interfaces/api.d.ts` **is** committed so that Docker builds and fresh clones work without needing to generate types first. Re-run `npm run generate:types` after backend API changes to keep it in sync.

---

## Order Status Workflow

```
PENDING → CONFIRMED → SHIPPED → DELIVERED
   ↓          ↓
 CANCELLED  CANCELLED (restores inventory)
```

- **PENDING → CONFIRMED**: Validates and deducts inventory
- **CONFIRMED → CANCELLED**: Restores inventory (Manager only)
- **PENDING → CANCELLED**: No inventory change (Manager only)

---

## Running Tests

```bash
# Unit tests
npm test

# With coverage
npm run test:cov

# From backend directory
cd backend && npm test
```

## Troubleshooting

<details>
<summary>Port 5432 already in use</summary>

Another PostgreSQL instance is running. Either stop it or change `DB_PORT` in `backend/.env`:
```bash
# Use a different port
DB_PORT=5433
# Update db:start accordingly
docker run -d --name pg-order-mgmt -p 5433:5432 ...
```
</details>

<details>
<summary>Port 4000 or 3000 already in use</summary>

```bash
# Find and kill the process
lsof -i :4000  # or :3000
kill -9 <PID>
```
</details>

<details>
<summary>Node version mismatch</summary>

```bash
nvm install 24
nvm use 24
# or set permanently
nvm alias default 24
```
</details>

<details>
<summary>Database seed not applied</summary>

The seed runs automatically when the database is empty. To re-seed:
```bash
# Reset DB container (deletes all data)
npm run db:reset
# Then restart backend
npm run dev:backend
```
</details>

---

## Deviations & Shortcuts

- **`synchronize: true` in dev only**: TypeORM auto-syncs schema in development. Production uses migrations (`migrationsRun: true`).
- **JWT secret in `.env`**: In production, use a proper secrets manager.
- **No refresh tokens**: Single JWT with 1-day expiry. Production should implement refresh token rotation.

## Production Readiness Checklist

- [x] Replace `synchronize: true` with TypeORM migrations
- [x] Configure CORS with specific allowed origins
- [x] Implement structured logging (nestjs-pino with correlation ID)
- [x] Add rate limiting (`@nestjs/throttler` — 60 requests/minute)
- [x] Add health check endpoint (`/api/health`)
- [x] Add Helmet.js for security headers
- [ ] Implement refresh token mechanism
- [ ] Use proper secrets management (Vault, AWS Secrets Manager)
- [ ] Set up CI/CD pipeline
- [ ] Add integration/e2e tests
