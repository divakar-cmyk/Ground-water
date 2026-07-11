# Real-Time Groundwater Resource Evaluation System

A full-stack web application for monitoring DWLR (Digital Water Level Recorder) stations, analyzing groundwater depletion trends, generating alerts, and exporting reports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Zustand |
| Backend | Express.js (Node.js), Knex.js, node-cron, JWT, bcrypt |
| Database | SQLite (default) — switchable to PostgreSQL/MySQL via `.env` |
| Simulator | Standalone Node.js script |

---

## Project Structure

```
/backend
  /src
    /controllers    — Route handler logic
    /db             — Knex config + seed script
    /jobs           — node-cron scheduled analysis job
    /middleware     — JWT auth middleware
    /routes         — Express routers
    /services       — analysis.service.js, alert.service.js
    app.js          — Express entry point
  /simulator
    dwlrSimulator.js
  .env
  .env.example
  package.json

/frontend
  /src
    /components     — Shared UI components
    /context        — Zustand auth store
    /pages          — Page components
    /services       — Axios API instance
    App.jsx
    main.jsx
  index.html
  tailwind.config.js
  vite.config.js
  package.json

/database
  schema.sql        — Table definitions (SQLite dialect)
  seed.sql          — Station seed data
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Copy and configure environment variables:

```bash
cp .env.example .env
```

**`.env` key settings:**

```env
PORT=5000
JWT_SECRET=change_this_to_a_long_random_secret
DB_CLIENT=sqlite3
DB_CONNECTION=./groundwater.sqlite
ANALYSIS_CRON_INTERVAL=* * * * *   # every minute (use 0 * * * * for hourly in production)

# Optional SMTP for email alerts
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
```
## What I've Done

- Implemented a **registration page** (`frontend/src/pages/Register.jsx`) and wired it into the routing (`App.jsx`). Added navigation link from login.
- Fixed login authentication and displayed proper error messages for invalid credentials.
- Created end‑to‑end **user registration flow** demo (see `user_registration_flow_*.webp` artifact).
- Verified the full flow with an automated browser sub‑agent, confirming that a new user can register, login, and reach the dashboard.
- Documented the data pipeline: ingestion (`POST /api/readings`), analysis (`node‑cron`), and forecasting logic.
- Added explanations about the **synthetic DWLR simulator** and how to switch to real‑world sensor readings.
- Updated the README with clear **Quick Start** instructions and environment variable explanations.

```

Initialize the database and seed data (runs automatically on first start, or manually):

```bash
npm run seed
```

Start the backend server:

```bash
npm start
# or for development with auto-restart:
npx nodemon src/app.js
```

The API will be available at `http://localhost:5000`.

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

The Vite dev server proxies `/api` requests to `http://localhost:5000` automatically.

---

### 3. DWLR Simulator

With the backend running, open a third terminal:

```bash
cd backend
# Normal simulation (5-second interval, all stations)
node simulator/dwlrSimulator.js

# Custom interval (3 seconds)
node simulator/dwlrSimulator.js --interval 3000

# Trigger critical depletion demo on station_id 4 (DWLR-402)
node simulator/dwlrSimulator.js --critical 4

# Critical mode with faster interval
node simulator/dwlrSimulator.js --critical 4 --interval 2000
```

The simulator POSTs readings to `http://localhost:5000/api/readings`. Watch the backend console for cron analysis runs and alert triggers.

---

## Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@gov.env | admin123 |
| Researcher | researcher@gov.env | researcher123 |
| Viewer | viewer@gov.env | viewer123 |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user (role defaults to `viewer`; admin token required to set other roles) |
| POST | `/api/auth/login` | Login, returns JWT |

### Stations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/stations` | Any | List all stations with latest trend status |
| GET | `/api/stations/:id` | Any | Station detail + latest reading |
| POST | `/api/stations` | Admin | Create station |
| PUT | `/api/stations/:id` | Admin | Update station / thresholds |

### Readings & Trends
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/readings` | None | Ingest DWLR reading (used by simulator) |
| GET | `/api/stations/:id/readings?range=30d` | Any | Historical readings (`7d`, `30d`, `90d`, `all`) |
| GET | `/api/stations/:id/trend` | Any | Latest trend + 30/60/90-day linear forecast |

### Alerts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/alerts?status=unresolved&severity=critical` | Any | Filterable alert list |
| PUT | `/api/alerts/:id/resolve` | Researcher/Admin | Mark alert resolved |

### Dashboard & Reports
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/summary` | Any | Aggregated overview stats |
| GET | `/api/reports?stationIds=1,2&from=2024-01-01&to=2024-01-31&format=csv` | Researcher/Admin | Export CSV or print-PDF |

---

## Business Logic

### Ingestion Validation
- Rejects missing fields, values outside `0–300m`, duplicate `(station_id, recorded_at)` pairs
- Flags statistical outliers (>3 std deviations from last 10 readings) as `data_quality = 'anomalous'`

### Scheduled Analysis (node-cron)
- Runs per `ANALYSIS_CRON_INTERVAL` (default: every minute for demo)
- Computes 24-reading moving average and monthly decline rate per station
- Classifies status: `normal` → `warning` (within 15% of limits) → `critical` (exceeds limits)
- Inserts row into `trend_analysis`

### Alert Generation
- Triggered after each analysis run
- Creates alert only if no unresolved alert of the same type already exists (deduplication)
- Sends email via nodemailer if SMTP is configured; falls back to console log

### Forecasting
- Linear regression (OLS) over last 30 non-anomalous readings
- Projects water level at +30, +60, +90 days
- Exposed via `GET /api/stations/:id/trend` and plotted as dashed line in TrendChart

---

## Switching to PostgreSQL / MySQL

Update `.env`:

```env
DB_CLIENT=pg
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secret
DB_DATABASE=groundwater
```

Then run the schema manually:

```bash
psql -U postgres -d groundwater -f database/schema.sql
npm run seed
```

For MySQL, change `DB_CLIENT=mysql2` and install `npm install mysql2`.

---

## Production Notes

- Set `JWT_SECRET` to a cryptographically random 64-character string
- Set `ANALYSIS_CRON_INTERVAL=0 * * * *` (hourly) or `*/15 * * * *` (every 15 min)
- Set `FRONTEND_ORIGIN` in backend `.env` to your deployed frontend URL for CORS
- Use a process manager like PM2: `pm2 start src/app.js --name groundwater-api`
