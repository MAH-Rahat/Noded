# Design Document

## Introduction

This document describes the technical design for NodedAlright Personal Hub — a full-stack personal dashboard built as a monolith using FastAPI (Python), PostgreSQL, and React + TypeScript. It covers system architecture, monorepo structure, frontend and backend design, database schema, API design, security, PWA configuration, and the UI design system.

The stack is a **FAR stack** (FastAPI + React) — a Python full-stack monorepo with a decoupled frontend and backend deployed to separate services.

---

## 1. System Architecture

### 1.1 Monorepo Structure

The project lives in a single Git repository with two top-level packages:

```
noded/
├── client/                     ← React + TypeScript SPA (deploys to Vercel)
├── server/                     ← FastAPI Python backend (deploys to Render)
├── .gitignore
└── README.md
```

- `client/` — Vercel detects this as the frontend. Set "Root Directory" to `client` in Vercel project settings.
- `server/` — Render detects this as a Python web service. Set "Root Directory" to `server` in Render service settings.

This is the standard convention for decoupled monorepos in the FAR stack ecosystem. `web` and `api` are universally understood, deployment-tool-friendly names.

### 1.2 Deployment Targets

| Package | Platform | Build command | Output |
|---|---|---|---|
| `client/` | Vercel | `vite build` | Static SPA → Vercel CDN |
| `server/` | Render | `uvicorn main:app` | Python web service |

The frontend calls the backend via the `VITE_API_URL` environment variable set in Vercel (pointing to the Render service URL). CORS on the backend is locked to the Vercel deployment URL.

### 1.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                     Browser / PWA                   │
│  React + TypeScript SPA  ·  Service Worker Cache    │
│  Hosted on Vercel CDN                               │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS / REST JSON
                     │ (VITE_API_URL → Render URL)
┌────────────────────▼────────────────────────────────┐
│              FastAPI Application (Render)           │
│  Routers  ·  Services  ·  Background Jobs           │
│  JWT Auth  ·  Rate Limiter (slowapi)                │
└────────────────────┬────────────────────────────────┘
                     │ asyncpg / SQLAlchemy async
┌────────────────────▼────────────────────────────────┐
│           PostgreSQL (Render managed DB)            │
│  All user data, encrypted Vault ciphertext,         │
│  push subscriptions, budget limits, onboarding state│
└─────────────────────────────────────────────────────┘
```

Key decisions:
- Monolith over microservices — the feature set is cohesive and a single team owns it; operational simplicity wins.
- FastAPI chosen for async support, automatic OpenAPI docs, and Pydantic validation.
- SQLAlchemy 2.x async ORM with asyncpg driver for non-blocking DB access.
- Alembic for versioned migrations.
- APScheduler (AsyncIOScheduler) embedded in the FastAPI process for the Rollover_Job and push notification dispatcher.
- Web Push dispatched via the `pywebpush` library.

---

## 2. Frontend Architecture (`client/`)

### 2.1 Directory Structure

```
client/
├── public/
│   ├── icons/                  ← PWA icons (192, 512, maskable)
│   └── robots.txt
├── src/
│   ├── assets/                 ← Static SVGs, illustrations
│   ├── components/
│   │   ├── ui/                 ← Shared primitives (Button, Input, Badge, Skeleton)
│   │   ├── charts/             ← DonutChart, BarChart, Sparkline, RadialProgressRing
│   │   ├── layout/             ← BentoGrid, ModuleCard, GlobalStatsBar
│   │   ├── auth/               ← AuthCard, LoginForm, RegisterForm
│   │   ├── ledger/             ← LedgerCard, TransactionList, BudgetProgressBar
│   │   ├── tasks/              ← RoutineRelayCard, TaskRow, HeatmapCalendar, StreakCounter
│   │   ├── notes/              ← CanvasCard, NoteCard, NoteEditor
│   │   ├── vault/              ← VaultCard, SnippetCard, VaultUnlockModal
│   │   └── overlays/           ← SearchOverlay, OnboardingOverlay, PageTransition
│   ├── hooks/                  ← useCountUp, useTaskStateMachine, useVaultSession
│   ├── lib/
│   │   ├── api.ts              ← Axios instance with auth interceptors
│   │   └── queryClient.ts      ← TanStack Query client config
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ResetRequestPage.tsx
│   │   ├── ResetFormPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── SettingsPage.tsx
│   ├── stores/
│   │   ├── authStore.ts        ← Zustand: JWT, user profile, theme prefs
│   │   ├── uiStore.ts          ← Zustand: search open, onboarding step
│   │   └── vaultStore.ts       ← Zustand: vault session token + expiry
│   ├── styles/
│   │   ├── globals.css         ← CSS custom properties (design tokens)
│   │   └── animations.css      ← Keyframes (shimmer, checkmark, count-up)
│   ├── types/                  ← Shared TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example                ← VITE_API_URL=https://your-api.onrender.com
```

### 2.2 Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript | Type safety, ecosystem |
| Build tool | Vite | Fast HMR, native ESM, PWA plugin |
| Routing | React Router v6 | File-based-style nested routes |
| State management | Zustand | Minimal boilerplate, no context hell |
| Server state | TanStack Query v5 | Caching, background refetch, optimistic updates |
| Charts | Recharts | Composable, React-native, accessible |
| Markdown | react-markdown + remark-gfm | Lightweight, extensible |
| Drag and drop | @dnd-kit/core | Accessible, modern |
| Styling | CSS Modules + CSS custom properties | Zero runtime, theme via variables |
| PWA | vite-plugin-pwa (Workbox) | Manifest + service worker generation |
| HTTP client | Axios (instance with interceptors) | Centralized auth header injection |

### 2.3 Route Structure

```
/                   → redirect to /dashboard (if authed) or /login
/login              → Login_Page
/register           → Register_Page
/reset-password     → Password reset request view
/reset-password/:token → Password reset form
/dashboard          → Main Bento_Grid layout (protected)
/settings           → Settings page (protected)
```

All protected routes are wrapped in an `<AuthGuard>` component that reads the JWT from Zustand/localStorage and redirects to `/login` if absent or expired.

### 2.4 Component Tree (Dashboard)

```
<App>
  <AuthProvider>          ← Zustand auth store + token refresh logic
    <Router>
      <GlobalStatsBar />  ← Fixed top strip
      <SearchOverlay />   ← Portal, conditionally rendered
      <Routes>
        <Route path="/dashboard">
          <BentoGrid>
            <LedgerCard />
            <RoutineRelayCard />
            <CanvasCard />
            <VaultCard />
          </BentoGrid>
        </Route>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetRequestPage />} />
        <Route path="/reset-password/:token" element={<ResetFormPage />} />
      </Routes>
      <OnboardingOverlay /> ← Portal, shown once after registration
    </Router>
  </AuthProvider>
</App>
```

### 2.5 State Management

Two layers:

1. **Zustand stores** (client-only, persisted to localStorage where needed):
   - `authStore` — JWT, user profile, accent color, background preference
   - `uiStore` — search overlay open state, onboarding step, notification permission state
   - `vaultStore` — vault session token, expiry timer

2. **TanStack Query** (server state):
   - One query key namespace per module: `['ledger']`, `['tasks']`, `['notes']`, `['vault']`
   - Mutations use `onMutate` optimistic updates + `onError` rollback for all CRUD operations
   - Stale time: 60 seconds for most queries; 0 for vault (always fresh)

### 2.6 Task State Machine

Implemented as a plain TypeScript object (no external library needed):

```typescript
type TaskState = 'pending' | 'completed' | 'delayed';

const transitions: Record<TaskState, TaskState[]> = {
  pending:   ['completed', 'delayed'],
  completed: ['pending'],
  delayed:   ['pending', 'completed'],
};
```

The Rollover_Job on the backend drives `pending → delayed` transitions at midnight. The frontend drives `pending ↔ completed` via checkbox interaction.

---

## 3. Backend Architecture (`server/`)

### 3.1 Directory Structure

```
server/
├── app/
│   ├── main.py                 ← FastAPI app factory, lifespan, middleware
│   ├── config.py               ← Settings via pydantic-settings
│   ├── database.py             ← Async engine, session factory
│   ├── models/                 ← SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── task.py
│   │   ├── note.py
│   │   ├── transaction.py
│   │   ├── snippet.py
│   │   └── ...
│   ├── schemas/                ← Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── ledger.py
│   │   ├── tasks.py
│   │   ├── notes.py
│   │   ├── vault.py
│   │   └── common.py           ← ResponseModel[T] envelope
│   ├── routers/
│   │   ├── auth.py
│   │   ├── ledger.py
│   │   ├── tasks.py
│   │   ├── notes.py
│   │   ├── vault.py
│   │   ├── settings.py
│   │   ├── search.py
│   │   ├── export.py
│   │   └── notifications.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── ledger_service.py
│   │   ├── task_service.py
│   │   ├── note_service.py
│   │   ├── vault_service.py
│   │   ├── push_service.py
│   │   └── export_service.py
│   ├── jobs/
│   │   ├── rollover_job.py     ← Midnight task rollover
│   │   └── push_dispatcher.py  ← Due-task notification polling
│   └── middleware/
│       ├── auth_middleware.py  ← JWT validation dependency
│       └── rate_limit.py       ← slowapi limiter
├── migrations/                 ← Alembic versions
│   ├── env.py
│   └── versions/
├── tests/
├── alembic.ini
├── requirements.txt
├── render.yaml                 ← Render deployment config
└── .env.example                ← DATABASE_URL, JWT_SECRET, VAULT_ENCRYPTION_KEY, etc.
```

### 3.2 Render Deployment Config (`server/render.yaml`)

```yaml
services:
  - type: web
    name: noded-alright-api
    runtime: python
    buildCommand: pip install -r requirements.txt && alembic upgrade head
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: noded-alright-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: VAULT_ENCRYPTION_KEY
        sync: false
      - key: VAPID_PRIVATE_KEY
        sync: false
      - key: FRONTEND_URL
        sync: false

databases:
  - name: noded-alright-db
    plan: free
```

### 3.3 FastAPI App Setup

```python
# app/main.py (outline)
from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(rollover_job, 'cron', hour=0, minute=0)
    scheduler.add_job(push_dispatcher, 'interval', minutes=1)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(ledger_router, prefix="/api/v1/ledger")
# ... remaining routers
```

### 3.4 Response Envelope

All endpoints return:

```json
{
  "status": "success" | "error",
  "data": { ... } | null,
  "error": null | { "code": "...", "message": "..." }
}
```

A shared `ResponseModel[T]` generic Pydantic schema enforces this shape.

### 3.4 Background Jobs

**Rollover_Job** (runs at 00:00 server time):
1. Query all Tasks with `state = 'pending'` and `date < today`.
2. Bulk-update those records to `state = 'delayed'`.
3. Insert new `pending` copies for today for each affected user.
4. On failure: log error with timestamp; APScheduler retries on next scheduled run.

**Push_Dispatcher** (runs every 60 seconds):
1. Query Tasks where `due_time <= now + 60s` and `due_time > now - 60s` and `notified = false`.
2. For each Task, look up the user's push subscription.
3. Call `pywebpush` to send the notification.
4. Mark `notified = true` on the Task record.

---

## 4. Database Schema

All tables include `id` (UUID primary key), `created_at`, and `updated_at` timestamps unless noted.

### 4.1 users

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| username | VARCHAR(50) UNIQUE NOT NULL | |
| email | VARCHAR(255) UNIQUE NOT NULL | |
| password_hash | VARCHAR(255) NOT NULL | bcrypt |
| accent_color | VARCHAR(20) DEFAULT 'electric_blue' | |
| background_color | VARCHAR(10) DEFAULT '#0F1115' | |
| onboarding_completed | BOOLEAN DEFAULT false | |
| vault_pin_hash | VARCHAR(255) | bcrypt, nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 4.2 tasks

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| title | VARCHAR(500) NOT NULL | |
| state | VARCHAR(20) NOT NULL | pending / completed / delayed |
| date | DATE NOT NULL | the day this task belongs to |
| sort_order | INTEGER NOT NULL | drag-and-drop order |
| due_time | TIMESTAMPTZ | nullable |
| notified | BOOLEAN DEFAULT false | push sent flag |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 4.3 notes

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| title | VARCHAR(500) NOT NULL | |
| body | TEXT NOT NULL | raw markdown |
| tag_label | VARCHAR(100) | nullable |
| tag_color | VARCHAR(20) | nullable |
| pinned | BOOLEAN DEFAULT false | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 4.4 categories

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| name | VARCHAR(100) NOT NULL | |
| color | VARCHAR(20) | hex or named color |
| budget_limit | NUMERIC(12,2) | nullable monthly limit |
| created_at | TIMESTAMPTZ | |

### 4.5 transactions

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| category_id | UUID FK → categories.id | |
| amount | NUMERIC(12,2) NOT NULL | |
| type | VARCHAR(10) NOT NULL | income / expense |
| date | DATE NOT NULL | |
| description | VARCHAR(500) | nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 4.6 snippets (Vault)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| label | VARCHAR(255) NOT NULL | display name |
| ciphertext | TEXT NOT NULL | Fernet-encrypted content |
| snippet_type | VARCHAR(20) NOT NULL | api_key / password / personal_id |
| category_label | VARCHAR(100) | nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 4.7 vault_sessions

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| session_token | VARCHAR(255) UNIQUE NOT NULL | |
| expires_at | TIMESTAMPTZ NOT NULL | now + 15 min |
| created_at | TIMESTAMPTZ | |

### 4.8 vault_lockouts

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id UNIQUE | |
| failed_attempts | INTEGER DEFAULT 0 | |
| locked_until | TIMESTAMPTZ | nullable |

### 4.9 token_blocklist

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| jti | VARCHAR(255) UNIQUE NOT NULL | JWT ID claim |
| expires_at | TIMESTAMPTZ NOT NULL | for cleanup |
| created_at | TIMESTAMPTZ | |

### 4.10 password_reset_tokens

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| token_hash | VARCHAR(255) UNIQUE NOT NULL | SHA-256 of raw token |
| expires_at | TIMESTAMPTZ NOT NULL | now + 1 hour |
| used | BOOLEAN DEFAULT false | |
| created_at | TIMESTAMPTZ | |

### 4.11 push_subscriptions

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| endpoint | TEXT NOT NULL | |
| p256dh | TEXT NOT NULL | |
| auth | TEXT NOT NULL | |
| created_at | TIMESTAMPTZ | |

---

## 5. API Design

All endpoints are prefixed `/api/v1/`. Protected endpoints require `Authorization: Bearer <JWT>`.

### 5.1 Auth

| Method | Path | Description |
|---|---|---|
| POST | /auth/register | Create user, return JWT |
| POST | /auth/login | Validate credentials, return JWT |
| POST | /auth/logout | Add JWT to blocklist |
| POST | /auth/forgot-password | Generate reset token, send email |
| POST | /auth/reset-password | Validate token, update password |

### 5.2 Ledger

| Method | Path | Description |
|---|---|---|
| GET | /ledger/transactions | Paginated list, sorted by date desc |
| POST | /ledger/transactions | Create transaction |
| DELETE | /ledger/transactions/{id} | Delete transaction |
| GET | /ledger/categories | List categories with budget limits |
| POST | /ledger/categories | Create category |
| PATCH | /ledger/categories/{id} | Update name, color, or budget_limit |
| GET | /ledger/summary | Monthly totals for charts |
| GET | /ledger/export | CSV download |

### 5.3 Tasks

| Method | Path | Description |
|---|---|---|
| GET | /tasks | List tasks for today (or ?date=) |
| POST | /tasks | Create task |
| PATCH | /tasks/{id} | Update state, title, order, due_time |
| DELETE | /tasks/{id} | Delete task |
| PATCH | /tasks/reorder | Bulk update sort_order |

### 5.4 Notes

| Method | Path | Description |
|---|---|---|
| GET | /notes | List all notes (pinned first) |
| POST | /notes | Create note |
| GET | /notes/{id} | Get single note |
| PATCH | /notes/{id} | Update title, body, tag, pinned |
| DELETE | /notes/{id} | Delete note |
| GET | /notes/export | ZIP download |

### 5.5 Vault

| Method | Path | Description |
|---|---|---|
| POST | /vault/authenticate | Verify PIN, return vault session token |
| GET | /vault/snippets | List snippets (requires vault session) |
| POST | /vault/snippets | Create snippet |
| PATCH | /vault/snippets/{id} | Update snippet |
| DELETE | /vault/snippets/{id} | Delete snippet |

### 5.6 Settings & Profile

| Method | Path | Description |
|---|---|---|
| GET | /settings/profile | Get user profile + preferences |
| PATCH | /settings/profile | Update display name, email |
| PATCH | /settings/password | Change password |
| PATCH | /settings/preferences | Update accent color, background color |

### 5.7 Search

| Method | Path | Description |
|---|---|---|
| GET | /search?q={query} | Search notes, tasks, transactions |

### 5.8 Notifications

| Method | Path | Description |
|---|---|---|
| POST | /notifications/subscribe | Save push subscription |
| DELETE | /notifications/subscribe | Remove push subscription |

---

## 6. Security Design

### 6.1 JWT Authentication

- Tokens signed with HS256 using a secret from environment variable `JWT_SECRET`.
- Payload includes: `sub` (user UUID), `jti` (UUID for blocklist), `exp`, `iat`.
- Expiry: 24 hours standard; 30 days when Remember_Me is enabled (separate claim).
- Every protected request passes through a FastAPI dependency `get_current_user` that:
  1. Decodes and verifies the JWT signature and expiry.
  2. Checks `jti` against the `token_blocklist` table.
  3. Returns the user record or raises HTTP 401.

### 6.2 Vault Encryption

- Fernet symmetric encryption (AES-128-CBC + HMAC-SHA256) via the `cryptography` library.
- Encryption key stored in environment variable `VAULT_ENCRYPTION_KEY` (32-byte base64 URL-safe string).
- Key is never written to the database or logged.
- Vault session tokens are random 32-byte hex strings stored as-is in `vault_sessions`; they are short-lived (15 min) and scoped to a single user.

### 6.3 Password Hashing

- bcrypt with work factor 12 for user passwords and vault PINs.
- Password reset tokens: raw token is a `secrets.token_urlsafe(32)` value; only its SHA-256 hash is stored in the database.

### 6.4 Rate Limiting

- `slowapi` (Starlette-compatible) applied globally and per-route:
  - `/auth/login`: 10 requests / minute per IP
  - `/auth/forgot-password`: 5 requests / minute per IP
  - `/vault/authenticate`: 5 requests / minute per user (feeds into lockout logic)
  - Global default: 200 requests / minute per IP

### 6.5 Input Validation

- All request bodies validated by Pydantic schemas before reaching service layer.
- SQL injection prevented by SQLAlchemy ORM parameterized queries (no raw string interpolation).
- CORS configured to allow only the frontend origin in production.

### 6.6 Email Enumeration Prevention

- `/auth/forgot-password` always returns HTTP 200 with a generic success message regardless of whether the email exists.

---

## 7. PWA Design

### 7.1 Web App Manifest (`manifest.webmanifest`)

```json
{
  "name": "NodedAlright",
  "short_name": "NodedAlright",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F1115",
  "theme_color": "#0F1115",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

The `theme_color` is updated dynamically via the `<meta name="theme-color">` tag when the user changes their background color preference (JS updates the meta tag; the manifest itself is static).

### 7.2 Service Worker Strategy (Workbox via vite-plugin-pwa)

| Asset type | Strategy | Details |
|---|---|---|
| App Shell (HTML, JS, CSS, fonts) | CacheFirst | Precached on SW install, versioned |
| API requests | NetworkFirst | Falls back to cache on offline; 3s timeout |
| Images / icons | CacheFirst | Long TTL |

Offline behavior:
- Read API calls: return cached response with a stale indicator.
- Write API calls: return a synthetic offline error response; the frontend displays the "you are offline" message.
- The Global_Stats_Bar renders a small offline badge (e.g., a grey dot with "Offline" label) when `navigator.onLine === false`.

### 7.3 Push Notifications

- Frontend calls `PushManager.subscribe()` with the VAPID public key from the backend.
- Subscription object (`endpoint`, `p256dh`, `auth`) is POSTed to `/api/v1/notifications/subscribe`.
- Backend stores it in `push_subscriptions`.
- `push_dispatcher` job uses `pywebpush` with the VAPID private key (env var `VAPID_PRIVATE_KEY`) to send notifications.

---

## 8. UI / Design System

### 8.1 Color Tokens

```css
:root {
  --color-bg:           #0F1115;   /* default page background */
  --color-surface:      #1A1C23;   /* card / module background */
  --color-surface-2:    #22252E;   /* elevated surface (modals, dropdowns) */
  --color-border:       #2A2D38;   /* subtle dividers */
  --color-text-primary: #F0F0F0;   /* headings, labels */
  --color-text-muted:   #8A8F9E;   /* secondary text, placeholders */
  --color-accent:       #3B82F6;   /* Electric Blue (default) */
  --color-success:      #22C55E;   /* income rows, success states */
  --color-danger:       #EF4444;   /* expense rows, errors, over-budget */
  --color-warning:      #F59E0B;   /* 80% budget warning */
}
```

Accent color variants (user-selectable):
- Electric Blue: `#3B82F6`
- Neon Green: `#22C55E`
- Violet Purple: `#8B5CF6`

### 8.2 Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / headings | Space Grotesk | 700 | 1.5rem – 2rem |
| UI labels / body | Space Grotesk | 400–500 | 0.875rem – 1rem |
| Numbers / code | JetBrains Mono | 400 | 0.875rem – 1rem |

Fonts loaded via `@fontsource` packages (bundled, no external CDN dependency for offline support).

### 8.3 Spacing & Radius

- Base spacing unit: 4px (0.25rem). Scale: 4, 8, 12, 16, 24, 32, 48px.
- Card border radius: 12px (`--radius-card`).
- Input / button border radius: 8px (`--radius-input`).
- Pill / badge border radius: 9999px.

### 8.4 Component Inventory

| Component | Notes |
|---|---|
| `<BentoGrid>` | CSS Grid, 1-col mobile → 2-col tablet → 4-col desktop |
| `<ModuleCard>` | Surface color, rounded corners, header with title + export icon |
| `<GlobalStatsBar>` | Fixed top, z-index 100, height 48px |
| `<AuthCard>` | Centered, max-width 400px, surface-2 background |
| `<SearchOverlay>` | Portal, backdrop blur, grouped results |
| `<OnboardingOverlay>` | Portal, 4-step stepper, skip button |
| `<SkeletonLoader>` | Animated shimmer via CSS keyframes |
| `<EmptyState>` | SVG illustration + muted label |
| `<DonutChart>` | Recharts PieChart with innerRadius |
| `<BarChart>` | Recharts BarChart, side-by-side bars |
| `<Sparkline>` | Recharts LineChart, no axes, compact |
| `<RadialProgressRing>` | SVG circle with stroke-dashoffset animation |
| `<HeatmapCalendar>` | CSS Grid of colored day cells |
| `<StreakCounter>` | Numeric display with flame icon |
| `<CountUpAnimation>` | Custom hook using requestAnimationFrame |
| `<PageTransition>` | Framer Motion or CSS transition wrapper |
| `<BudgetProgressBar>` | Horizontal bar, color shifts at 80% / 100% |
| `<PinIcon>` | Shown on pinned Note cards |
| `<OfflineBadge>` | Shown in GlobalStatsBar when offline |

### 8.5 Animation Principles

- Page transitions: fade + translateY(-8px), 300ms ease-out.
- Checkmark micro-animation: SVG path draw, 400ms.
- Count-up: linear easing, 800ms from 0 to final value on mount.
- Skeleton shimmer: CSS `@keyframes` gradient sweep, 1.5s infinite.
- All animations respect `prefers-reduced-motion: reduce` — motion is disabled when the user has this preference set.

---

## 9. Key Technical Decisions

### Monolith over microservices
The feature set is tightly coupled (search spans all modules, export touches multiple tables, the rollover job needs DB access). A monolith avoids distributed transaction complexity and is simpler to deploy on a single VPS or container.

### APScheduler embedded in FastAPI
Avoids a separate Celery + Redis stack. For the scale of a personal hub (one user or a small number of users), APScheduler's AsyncIOScheduler running inside the FastAPI process is sufficient and eliminates operational overhead.

### TanStack Query for server state
Provides optimistic updates, background refetching, and cache invalidation out of the box. Combined with Zustand for purely client-side state, this avoids Redux boilerplate while keeping server and client state cleanly separated.

### Fernet for Vault encryption
Fernet is authenticated encryption (AES-128-CBC + HMAC-SHA256). It prevents both tampering and decryption without the key. The key lives only in the environment, never in the database or source code.

### Token blocklist for logout
JWTs are stateless by design, but logout requires server-side invalidation. A `token_blocklist` table keyed on `jti` (JWT ID) provides this. A nightly cleanup job removes expired entries to keep the table small.

### vite-plugin-pwa (Workbox)
Generates the service worker and manifest automatically from Vite config. Workbox's precaching handles App Shell versioning and cache busting on deploy. NetworkFirst for API calls ensures fresh data when online while gracefully degrading offline.

### CSS Modules + CSS custom properties
Zero runtime cost compared to CSS-in-JS. Theme switching (accent color, background color) is achieved by updating CSS custom properties on `:root` via JavaScript — no re-render of the component tree required.
