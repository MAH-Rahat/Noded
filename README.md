# NodedAlright

> A premium personal command center — tasks, notes, finances, and an encrypted vault in one sleek mobile-first dashboard.

Built on the **FAR stack** (FastAPI + React): a Python backend, a TypeScript frontend, and PostgreSQL — deployed as a decoupled monorepo.

---

## Project Structure

```
noded/
├── client/          ← React + TypeScript SPA  →  deploys to Vercel
├── server/          ← FastAPI Python backend  →  deploys to Render
├── .gitignore
└── README.md
```

- **`client/`** — Vite-powered React SPA. Set "Root Directory" to `client` in your Vercel project settings.
- **`server/`** — FastAPI application with PostgreSQL via SQLAlchemy async + asyncpg. Set "Root Directory" to `server` in your Render service settings.

---

## Features

| Module | Description |
|---|---|
| **The Ledger** | Financial dashboard with line graph, donut chart, bar chart, budget limits, and sparklines |
| **Routine & Relay** | Daily task tracker with radial progress ring, heatmap calendar, streak counter, and drag-and-drop |
| **The Canvas** | Distraction-free markdown notes with live preview, tags, pinning, and full-screen writing mode |
| **The Vault** | Fernet-encrypted storage for API keys, passwords, and personal IDs — PIN-protected |

**Plus:** Global search, data export (CSV + ZIP), push notifications, PWA (installable + offline), onboarding flow, and full auth (register, login, forgot password).

---

## Design System

- **Layout:** Mobile-first Bento Box Grid
- **Colors:** Deep Gunmetal `#0F1115` background · Matte Dark Gray `#1A1C23` cards · Single accent color (Electric Blue / Neon Green / Violet Purple — user-selectable)
- **Fonts:** Space Grotesk (UI) · JetBrains Mono (numbers & code)

---

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+

### Frontend (`client/`)

```bash
cd client
npm install
cp .env.example .env.local   # set VITE_API_URL=http://localhost:8000
npm run dev                  # http://localhost:5173
```

### Backend (`server/`)

```bash
cd server
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # fill in DATABASE_URL, JWT_SECRET, etc.
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

---

## Environment Variables

### `client/.env.local`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (`http://localhost:8000` locally, Render URL in production) |

### `server/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL asyncpg connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `VAULT_ENCRYPTION_KEY` | 32-byte base64 Fernet key for vault encryption |
| `VAPID_PRIVATE_KEY` | VAPID private key for Web Push |
| `VAPID_PUBLIC_KEY` | VAPID public key (sent to browser) |
| `VAPID_CLAIMS_EMAIL` | Email for VAPID claims |
| `FRONTEND_URL` | Allowed CORS origin (your Vercel URL) |

---

## Deployment

### Frontend → Vercel

1. Connect repo to a new Vercel project
2. Set **Root Directory** to `client`
3. Add `VITE_API_URL` env var pointing to your Render service URL

### Backend → Render

1. Connect repo to a new Render Web Service
2. Set **Root Directory** to `server`
3. `server/render.yaml` handles build/start commands automatically
4. Provision a managed PostgreSQL database named `noded-alright-db`
5. Set remaining env vars in the Render dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Build | Vite + vite-plugin-pwa |
| State | Zustand + TanStack Query v5 |
| Charts | Recharts |
| Styling | CSS Modules + CSS custom properties |
| Backend | FastAPI (Python 3.11+) |
| ORM | SQLAlchemy 2.x async |
| DB driver | asyncpg |
| Migrations | Alembic |
| Auth | python-jose (JWT) + passlib (bcrypt) |
| Encryption | cryptography (Fernet) |
| Jobs | APScheduler |
| Push | pywebpush |
| Rate limiting | slowapi |
