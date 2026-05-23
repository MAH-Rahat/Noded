# Implementation Plan: NodedAlright Personal Hub

## Overview

Full-stack personal dashboard built as a FAR stack monorepo (`web/` React + TypeScript on Vercel, `api/` FastAPI Python on Render). Tasks are ordered to build incrementally: scaffolding → API foundation → frontend foundation → four modules → cross-cutting features → deployment.

## Tasks

- [x] 1. Monorepo scaffolding
  - [x] 1.1 Initialize monorepo root with `web/` and `api/` directories
    - Create root `.gitignore` covering Python, Node, and environment files
    - Create root `README.md` documenting the monorepo structure and local dev setup
    - _Requirements: 1.1 (monorepo structure per design §1.1)_

  - [x] 1.2 Scaffold `web/` Vite + React + TypeScript project
    - Run `npm create vite@latest web -- --template react-ts` inside the repo root
    - Install core dependencies: `react-router-dom`, `zustand`, `@tanstack/react-query`, `axios`, `recharts`, `react-markdown`, `remark-gfm`, `@dnd-kit/core`, `framer-motion`
    - Install font packages: `@fontsource/space-grotesk`, `@fontsource/jetbrains-mono`
    - Install PWA plugin: `vite-plugin-pwa`
    - Create `client/.env.example` with `VITE_API_URL=https://your-api.onrender.com`
    - _Requirements: 1.1, 1.7, 13.1_

  - [x] 1.3 Scaffold `api/` FastAPI Python project
    - Create `api/requirements.txt` with pinned versions: `fastapi`, `uvicorn[standard]`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `pydantic-settings`, `python-jose[cryptography]`, `passlib[bcrypt]`, `cryptography`, `apscheduler`, `pywebpush`, `slowapi`, `python-multipart`, `aiofiles`
    - Create `api/app/__init__.py`, `api/app/main.py` (empty FastAPI app), `api/app/config.py` (pydantic-settings `Settings` class)
    - Create `api/.env.example` with `DATABASE_URL`, `JWT_SECRET`, `VAULT_ENCRYPTION_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `FRONTEND_URL`
    - Initialize Alembic: `alembic init migrations` inside `api/`
    - _Requirements: 7.1, 7.5_


- [x] 2. API foundation
  - [x] 2.1 Set up async database engine and session factory
    - Implement `api/app/database.py` with SQLAlchemy 2.x async engine using `asyncpg` and a session factory
    - Wire `DATABASE_URL` from `config.py` settings
    - _Requirements: 7.4, 7.5_

  - [x] 2.2 Create all SQLAlchemy ORM models
    - Implement models in `api/app/models/`: `user.py`, `task.py`, `note.py`, `transaction.py` (+ `category.py`), `snippet.py`, `vault_session.py`, `vault_lockout.py`, `token_blocklist.py`, `password_reset_token.py`, `push_subscription.py`
    - Each model includes UUID PK, `created_at`, `updated_at` timestamps, and FK constraints as per design §4
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.4_

  - [x] 2.3 Generate and apply initial Alembic migration
    - Configure `api/migrations/env.py` to import all models and use the async engine
    - Generate initial migration with `alembic revision --autogenerate -m "initial schema"`
    - Verify migration SQL covers all tables from design §4
    - _Requirements: 7.5_

  - [x] 2.4 Implement shared response envelope and common Pydantic schemas
    - Create `api/app/schemas/common.py` with `ResponseModel[T]` generic Pydantic schema containing `status`, `data`, and `error` fields
    - Create `api/app/schemas/auth.py`, `ledger.py`, `tasks.py`, `notes.py`, `vault.py` with request/response schemas for each module
    - _Requirements: 7.2_

  - [x] 2.5 Implement JWT authentication service and middleware
    - Implement `api/app/services/auth_service.py`: `create_access_token`, `decode_token`, `hash_password`, `verify_password` using `python-jose` and `passlib[bcrypt]`
    - Implement `api/app/middleware/auth_middleware.py`: `get_current_user` FastAPI dependency that decodes JWT, checks `token_blocklist`, and returns the user or raises HTTP 401
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 16.5, 16.6_

  - [x] 2.6 Implement auth router (register, login, logout)
    - Implement `api/app/routers/auth.py` with `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`
    - Register: validate username non-empty, email format, password ≥ 8 chars; return HTTP 409 on duplicate; issue JWT on success
    - Login: verify credentials; return HTTP 401 without revealing which field is wrong; support Remember_Me extended expiry
    - Logout: add JWT `jti` to `token_blocklist`
    - _Requirements: 6.1–6.8, 16.4, 16.5_

  - [x] 2.7 Implement password reset router
    - Implement `POST /api/v1/auth/forgot-password`: generate `secrets.token_urlsafe(32)`, store SHA-256 hash in `password_reset_tokens`, always return HTTP 200
    - Implement `POST /api/v1/auth/reset-password`: validate token unexpired and unused, update password hash, mark token used; return HTTP 410 if invalid
    - Apply rate limit: 5 requests/minute per IP on forgot-password
    - _Requirements: 17.3, 17.4, 17.6, 17.7_

  - [x] 2.8 Configure FastAPI app with middleware, CORS, rate limiting, and scheduler
    - Wire all routers into `api/app/main.py` under `/api/v1/` prefix
    - Configure CORS to allow only `FRONTEND_URL`
    - Configure `slowapi` rate limiter with global 200 req/min and per-route limits for auth and vault endpoints
    - Set up `APScheduler AsyncIOScheduler` in the FastAPI lifespan context
    - _Requirements: 6.1, 7.1, 7.3_

  - [x] 2.9 Checkpoint — API foundation
    - Ensure all tests pass, ask the user if questions arise.


- [x] 3. Frontend foundation
  - [x] 3.1 Configure Vite, TypeScript, and CSS design tokens
    - Update `web/vite.config.ts` to configure `vite-plugin-pwa` with manifest values (name, icons, theme color `#0F1115`, `display: standalone`)
    - Create `web/src/styles/globals.css` with all CSS custom properties from design §8.1 (color tokens, spacing scale, border radii)
    - Create `web/src/styles/animations.css` with keyframes: shimmer, checkmark draw, skeleton sweep
    - Import both stylesheets in `web/src/main.tsx`
    - _Requirements: 1.3, 1.4, 1.5, 1.7, 13.1_

  - [x] 3.2 Implement Axios instance and TanStack Query client
    - Create `web/src/lib/api.ts`: Axios instance with `baseURL` from `VITE_API_URL`, request interceptor to inject `Authorization: Bearer <token>`, response interceptor to handle 401 by clearing auth and redirecting to `/login`
    - Create `web/src/lib/queryClient.ts`: TanStack Query client with stale time 60s default
    - _Requirements: 6.1, 7.2_

  - [x] 3.3 Implement Zustand stores
    - Create `web/src/stores/authStore.ts`: JWT, user profile, accent color, background color preference; persist JWT to localStorage when Remember_Me is set
    - Create `web/src/stores/uiStore.ts`: search overlay open state, onboarding step, notification permission state
    - Create `web/src/stores/vaultStore.ts`: vault session token and expiry timer
    - _Requirements: 6.12, 6.15, 8.10, 8.12_

  - [x] 3.4 Implement shared UI primitives
    - Create `web/src/components/ui/`: `Button.tsx` (accent-color background variant), `Input.tsx` (focus glow with accent color), `Badge.tsx` (pill shape), `Skeleton.tsx` (shimmer animation), `EmptyState.tsx` (SVG illustration + muted label)
    - _Requirements: 1.9, 1.11, 1.12, 6.11_

  - [x] 3.5 Implement routing, AuthGuard, and page shells
    - Configure React Router v6 in `web/src/App.tsx` with routes: `/`, `/login`, `/register`, `/reset-password`, `/reset-password/:token`, `/dashboard`, `/settings`
    - Implement `<AuthGuard>` component that reads JWT from `authStore` and redirects to `/login` if absent or expired
    - Create empty page shell components: `LoginPage.tsx`, `RegisterPage.tsx`, `ResetRequestPage.tsx`, `ResetFormPage.tsx`, `DashboardPage.tsx`, `SettingsPage.tsx`
    - Implement `<PageTransition>` wrapper: fade + `translateY(-8px)`, 300ms ease-out, respects `prefers-reduced-motion`
    - _Requirements: 1.10, 6.9, 6.23_

  - [x] 3.6 Implement Login and Register pages
    - Implement `<AuthCard>` in `web/src/components/auth/`: surface `#1A1C23`, max-width 400px, centered
    - Implement `<LoginForm>`: email/password inputs with accent-color focus glow, Remember_Me toggle, loading spinner on submit, error message on 401, redirect to `/dashboard` on success
    - Implement `<RegisterForm>`: username, email, password, confirm password fields; client-side validation (non-empty, email format, password ≥ 8 chars, passwords match); loading spinner; error display; redirect on success
    - Implement "Forgot password?" link and password reset request/form views
    - _Requirements: 6.9–6.24, 17.1–17.8_

  - [x] 3.7 Implement GlobalStatsBar and BentoGrid layout
    - Implement `<GlobalStatsBar>` in `web/src/components/layout/`: fixed top strip, height 48px, z-index 100; displays current date, total Notes count, Tasks completed today, account balance; skeleton loaders while fetching; search icon; gear/profile icon; logout button; offline badge
    - Implement `<BentoGrid>` and `<ModuleCard>`: 1-col mobile → 2-col tablet → 4-col desktop CSS Grid; surface `#1A1C23`, 12px border radius; module card header with title and export icon slot
    - _Requirements: 1.1, 1.2, 1.3, 1.8, 1.9, 8.1, 16.1_

  - [x] 3.8 Checkpoint — Frontend foundation
    - Ensure all tests pass, ask the user if questions arise.


- [x] 4. Ledger module
  - [x] 4.1 Implement Ledger API (transactions, categories, summary)
    - Implement `api/app/routers/ledger.py` and `api/app/services/ledger_service.py`
    - `GET /api/v1/ledger/transactions`: paginated, sorted by date desc, requires auth
    - `POST /api/v1/ledger/transactions`: validate amount (non-zero numeric), category_id (FK exists), date; return HTTP 422 on invalid
    - `DELETE /api/v1/ledger/transactions/{id}`: remove record, enforce user ownership
    - `GET /api/v1/ledger/categories`, `POST /api/v1/ledger/categories`, `PATCH /api/v1/ledger/categories/{id}`: CRUD for categories including `budget_limit`
    - `GET /api/v1/ledger/summary`: return monthly totals (income, expenses, burn rate) for chart data
    - _Requirements: 2.1–2.4, 2.8, 7.1, 7.2, 14.2_

  - [x] 4.2 Implement Ledger chart components
    - Implement `web/src/components/charts/DonutChart.tsx`: Recharts PieChart with `innerRadius`; each category segment in distinct color; over-budget segments use red fill
    - Implement `web/src/components/charts/BarChart.tsx`: Recharts BarChart with side-by-side income/expense bars per calendar month
    - Implement `web/src/components/charts/Sparkline.tsx`: compact Recharts LineChart, no axes, renders 6 data points per category
    - _Requirements: 2.5, 2.6, 2.9, 2.10, 2.12, 14.6_

  - [x] 4.3 Implement LedgerCard and TransactionList
    - Implement `web/src/components/ledger/LedgerCard.tsx`: renders DonutChart, BarChart, and TransactionList; Count_Up_Animation on mount for balance/income/expenses totals
    - Implement `web/src/components/ledger/TransactionList.tsx`: displays amount (JetBrains Mono), category, date; green tint rows for income, red tint for expenses; Sparkline per category row; delete action with optimistic update
    - Implement `web/src/components/ledger/BudgetProgressBar.tsx`: horizontal bar per category; color shifts to warning at 80%, danger at 100%; warning/over-budget badge on LedgerCard header
    - Wire TanStack Query mutations with optimistic updates and rollback for create/delete
    - _Requirements: 2.5–2.13, 14.3–14.5_

  - [ ]* 4.4 Write unit tests for Ledger service
    - Test transaction validation (missing amount, invalid category, missing date → HTTP 422)
    - Test monthly summary calculation correctness
    - Test budget limit persistence and retrieval
    - _Requirements: 2.2, 2.3, 14.2_

- [x] 5. Routine & Relay module
  - [x] 5.1 Implement Tasks API
    - Implement `api/app/routers/tasks.py` and `api/app/services/task_service.py`
    - `GET /api/v1/tasks`: list tasks for today (or `?date=`), requires auth
    - `POST /api/v1/tasks`: validate title non-empty; return HTTP 422 on empty title
    - `PATCH /api/v1/tasks/{id}`: update state, title, sort_order, due_time
    - `DELETE /api/v1/tasks/{id}`: remove task
    - `PATCH /api/v1/tasks/reorder`: bulk update `sort_order` for drag-and-drop persistence
    - _Requirements: 3.4, 3.5, 3.9, 3.10, 7.1, 7.2_

  - [x] 5.2 Implement Rollover_Job
    - Implement `api/app/jobs/rollover_job.py`: query all tasks with `state = 'pending'` and `date < today`; bulk-update to `state = 'delayed'`; insert new `pending` copies for today; log errors with timestamp on failure
    - Register job in `main.py` lifespan with APScheduler cron at `hour=0, minute=0`
    - _Requirements: 3.7, 3.8_

  - [x] 5.3 Implement task state machine hook and RoutineRelayCard
    - Implement `web/src/hooks/useTaskStateMachine.ts`: TypeScript state machine with states `pending`, `completed`, `delayed` and valid transitions per design §2.6
    - Implement `web/src/components/tasks/TaskRow.tsx`: checkbox with accent-color toggle, animated checkmark SVG path draw (400ms, respects `prefers-reduced-motion`), clock icon + due time display when set
    - Implement `web/src/components/tasks/RoutineRelayCard.tsx`: vertical timeline layout, progress bar (accent-color fill), RadialProgressRing at top, drag-and-drop reorder via `@dnd-kit/core`, new task input
    - Wire TanStack Query mutations with optimistic updates for state changes and reorder
    - _Requirements: 3.1–3.6, 3.11, 3.13_

  - [x] 5.4 Implement HeatmapCalendar and StreakCounter
    - Implement `web/src/components/tasks/HeatmapCalendar.tsx`: CSS Grid of 30 day cells; higher intensity color when all tasks completed that day; uses accent color scale
    - Implement `web/src/components/tasks/StreakCounter.tsx`: numeric display with flame icon showing consecutive days of full completion
    - Implement `web/src/components/charts/RadialProgressRing.tsx`: SVG circle with `stroke-dashoffset` animation, accent-color fill
    - _Requirements: 3.11, 3.12, 3.14_

  - [ ]* 5.5 Write unit tests for Tasks service and Rollover_Job
    - Test task creation validation (empty title → HTTP 422)
    - Test rollover logic: pending tasks from yesterday become delayed, new pending copies created for today
    - Test reorder bulk update persists correct sort_order values
    - _Requirements: 3.7, 3.8, 3.9, 3.10_

- [x] 6. Canvas module
  - [x] 6.1 Implement Notes API
    - Implement `api/app/routers/notes.py` and `api/app/services/note_service.py`
    - `GET /api/v1/notes`: list all notes, pinned first, requires auth
    - `POST /api/v1/notes`: validate body non-empty; return HTTP 422 on empty body
    - `GET /api/v1/notes/{id}`, `PATCH /api/v1/notes/{id}` (title, body, tag_label, tag_color, pinned), `DELETE /api/v1/notes/{id}`
    - Enforce max 3 pinned notes per user: return HTTP 422 with descriptive error when limit exceeded
    - Persist raw markdown to `TEXT` column without transformation
    - _Requirements: 4.5–4.8, 4.13, 4.14, 7.1, 7.2, 15.2, 15.4_

  - [x] 6.2 Implement CanvasCard and NoteCard grid
    - Implement `web/src/components/notes/NoteCard.tsx`: displays first two lines as preview snippet; Note_Tag colored dot indicator; word count and reading time (200 wpm); pin icon on pinned notes; pin action control; delete action
    - Implement `web/src/components/notes/CanvasCard.tsx`: grid view of NoteCards; pinned notes rendered first; empty state illustration when no notes; export menu in card header
    - Client-side pin limit guard: display inline error and do not submit if already 3 pinned notes
    - _Requirements: 4.1, 4.10–4.12, 15.1, 15.3, 15.5, 15.6_

  - [x] 6.3 Implement full-screen NoteEditor with live markdown preview
    - Implement `web/src/components/notes/NoteEditor.tsx`: full-screen writing mode triggered by clicking a note; fade out BentoGrid, render only editor; `react-markdown` + `remark-gfm` for real-time preview; JetBrains Mono in code blocks; tag assignment UI; exit returns to grid with fade-in transition
    - Wire auto-save with TanStack Query mutation and debounce
    - _Requirements: 4.2–4.4, 4.9, 4.14_

  - [ ]* 6.4 Write unit tests for Notes service
    - Test note creation validation (empty body → HTTP 422)
    - Test pin limit enforcement (4th pin attempt → HTTP 422)
    - Test pinned notes appear first in list response
    - _Requirements: 4.7, 15.4_

- [x] 7. Vault module
  - [x] 7.1 Implement Vault API with Fernet encryption
    - Implement `api/app/services/vault_service.py`: Fernet encryption/decryption using `VAULT_ENCRYPTION_KEY` env var; never log or store plaintext
    - Implement `api/app/routers/vault.py`:
      - `POST /api/v1/vault/authenticate`: verify PIN/password with bcrypt; create `vault_sessions` record (15-min expiry); return session token; enforce lockout after 5 failed attempts (HTTP 429, 10-min lock) using `vault_lockouts` table
      - `GET /api/v1/vault/snippets`, `POST /api/v1/vault/snippets`, `PATCH /api/v1/vault/snippets/{id}`, `DELETE /api/v1/vault/snippets/{id}`: all require valid vault session token; encrypt on write, decrypt on read
    - Apply rate limit: 5 requests/minute per user on `/vault/authenticate`
    - _Requirements: 5.3–5.10, 5.13, 7.1, 7.2_

  - [x] 7.2 Implement VaultCard and SnippetCard
    - Implement `web/src/components/vault/VaultUnlockModal.tsx`: PIN/password input prompt; renders when vault is locked; shows lockout countdown when locked out
    - Implement `web/src/components/vault/SnippetCard.tsx`: Snippet_Type_Icon (key for `api_key`, lock for `password`, ID card for `personal_id`); Category_Badge pill; reveal/copy action
    - Implement `web/src/components/vault/VaultCard.tsx`: locked state shows no snippet content; unlocked state renders SnippetCard grid; session expiry timer via `vaultStore`; auto-lock on expiry
    - _Requirements: 5.1, 5.2, 5.4, 5.11, 5.12_

  - [x] 7.3 Implement vault session management hook
    - Implement `web/src/hooks/useVaultSession.ts`: manages session token and expiry in `vaultStore`; sets a `setTimeout` to lock the vault at expiry; clears session on logout
    - _Requirements: 5.3, 5.4_

  - [ ]* 7.4 Write unit tests for Vault service
    - Test Fernet encrypt/decrypt round-trip: decrypted output equals original plaintext
    - Test lockout: 5 failed attempts triggers HTTP 429 and sets `locked_until`
    - Test vault session expiry: expired session token rejected
    - _Requirements: 5.3, 5.5, 5.6, 5.8_

- [x] 8. Checkpoint — All four modules
  - Ensure all tests pass, ask the user if questions arise.


- [x] 9. Search
  - [x] 9.1 Implement Search API
    - Implement `api/app/routers/search.py` and `api/app/services/` search logic
    - `GET /api/v1/search?q={query}`: search note titles, task titles, and transaction categories simultaneously using SQL `ILIKE` or full-text search; return results grouped by module; requires auth
    - Optimize with appropriate DB indexes on `notes.title`, `tasks.title`, `categories.name`
    - _Requirements: 9.4, 9.5, 9.9_

  - [x] 9.2 Implement SearchOverlay component
    - Implement `web/src/components/overlays/SearchOverlay.tsx`: rendered as a React portal; backdrop blur; focused text input on open; results grouped by Notes / Tasks / Transactions sections; empty state message when no results; click result navigates to item and closes overlay; Escape key closes overlay
    - Wire `Cmd+K` / `Ctrl+K` keyboard shortcut in `App.tsx` to toggle `uiStore.searchOpen`
    - Wire search icon in `GlobalStatsBar` to open overlay
    - _Requirements: 9.1–9.8_

- [x] 10. Data export
  - [x] 10.1 Implement export endpoints
    - Implement `api/app/routers/export.py` and `api/app/services/export_service.py`
    - `GET /api/v1/notes/export`: package all user notes as individual `.md` files into a ZIP archive using `zipfile`; return as `application/zip` response
    - `GET /api/v1/ledger/export`: serialize all user transactions to CSV (date, amount, category, type, budget_limit); return as `text/csv` response
    - _Requirements: 10.2, 10.5, 14.7_

  - [x] 10.2 Implement Export_Menu in module card headers
    - Implement `<ExportMenu>` dropdown component in `web/src/components/ui/`
    - Add export menu to `CanvasCard` header and `LedgerCard` header
    - Show loading indicator on trigger during export request; show error message in card on failure; trigger browser file download on success
    - _Requirements: 10.1, 10.3, 10.4, 10.6, 10.7, 10.8_

- [x] 11. Settings page
  - [x] 11.1 Implement Settings API endpoints
    - Implement `api/app/routers/settings.py`
    - `GET /api/v1/settings/profile`: return user profile + accent_color + background_color + onboarding_completed + session login time + token expiry
    - `PATCH /api/v1/settings/profile`: validate and update display name and email; return HTTP 409 on duplicate email
    - `PATCH /api/v1/settings/password`: verify current password hash; update to new hash; return HTTP 401 if current password wrong
    - `PATCH /api/v1/settings/preferences`: persist accent_color and background_color to DB
    - _Requirements: 8.2–8.8, 8.13, 16.7_

  - [x] 11.2 Implement SettingsPage component
    - Implement `web/src/pages/SettingsPage.tsx`: editable display name and email fields; change-password section (current, new, confirm); client-side validation (new password ≥ 8 chars, passwords match)
    - Implement Accent_Color selector: three swatches (Electric Blue `#3B82F6`, Neon Green `#22C55E`, Violet Purple `#8B5CF6`); on select, update `--color-accent` CSS custom property on `:root` and persist via API
    - Implement background color toggle (`#000000` vs `#0F1115`); on select, update `--color-bg` CSS custom property and persist via API
    - Display current Notification_Permission state; display session login time and token expiry
    - _Requirements: 8.1–8.13, 11.6, 16.7_

- [x] 12. Notifications and reminders
  - [x] 12.1 Implement push subscription API and dispatcher job
    - Implement `api/app/routers/notifications.py`: `POST /api/v1/notifications/subscribe` (save push subscription), `DELETE /api/v1/notifications/subscribe` (remove subscription)
    - Implement `api/app/jobs/push_dispatcher.py`: poll every 60s for tasks where `due_time` is within the next 60s and `notified = false`; send push via `pywebpush` with VAPID keys; mark `notified = true`
    - Register dispatcher in `main.py` lifespan with APScheduler interval job
    - _Requirements: 11.3, 11.4, 11.8_

  - [x] 12.2 Implement push notification subscription on frontend
    - On first login, call `Notification.requestPermission()` and store result in `uiStore`
    - If permission granted, call `PushManager.subscribe()` with VAPID public key and POST subscription to `/api/v1/notifications/subscribe`
    - Display due time (clock icon + formatted time) on task rows where `due_time` is set
    - _Requirements: 11.1, 11.5, 11.7_

- [x] 13. Onboarding flow
  - [x] 13.1 Implement onboarding completion API
    - Add `PATCH /api/v1/settings/preferences` to also accept `onboarding_completed: bool` and persist to `users.onboarding_completed`
    - Return `onboarding_completed` in the profile response so the frontend can gate the overlay
    - _Requirements: 12.4, 12.5_

  - [x] 13.2 Implement OnboardingOverlay component
    - Implement `web/src/components/overlays/OnboardingOverlay.tsx`: 4-step modal portal rendered after registration when `onboarding_completed = false`
    - Step 1: Welcome screen with app name and tagline
    - Step 2: Module tour — highlight each BentoGrid card in sequence
    - Step 3: Prompt to create first task (renders inline task creation form)
    - Step 4: Done screen with CTA button linking to dashboard
    - Skip button on every step dismisses overlay and calls API to mark onboarding complete
    - Accent_Color highlights on active step indicators and CTA elements; dark background `#0F1115`/`#1A1C23`
    - _Requirements: 12.1–12.6_

- [x] 14. PWA configuration
  - [x] 14.1 Configure vite-plugin-pwa and service worker
    - Update `web/vite.config.ts` with full `vite-plugin-pwa` config: manifest (name, short_name, icons 192/512/maskable, theme_color `#0F1115`, background_color `#0F1115`, `display: standalone`, `start_url: /`)
    - Configure Workbox strategies: CacheFirst for App Shell (HTML, JS, CSS, fonts, icons); NetworkFirst with 3s timeout for API requests; CacheFirst with long TTL for images
    - Add PWA icons to `web/public/icons/` (192×192, 512×512, 512×512 maskable)
    - _Requirements: 13.1–13.3, 13.7_

  - [x] 14.2 Implement offline indicator and offline write guard
    - Add `<OfflineBadge>` to `<GlobalStatsBar>`: grey dot + "Offline" label, shown when `navigator.onLine === false`; listen to `online`/`offline` window events
    - In API layer (`web/src/lib/api.ts`): when `navigator.onLine === false` and request is a write (POST/PATCH/DELETE), reject with a synthetic offline error before sending
    - Display "unavailable offline" message in the relevant module card when a write is blocked
    - _Requirements: 13.4–13.6_

- [x] 15. Deployment configuration
  - [x] 15.1 Create Render deployment config for `api/`
    - Create `api/render.yaml` with service definition: `type: web`, `runtime: python`, `buildCommand: pip install -r requirements.txt && alembic upgrade head`, `startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT`
    - Define environment variables: `DATABASE_URL` (from managed DB), `JWT_SECRET` (generated), `VAULT_ENCRYPTION_KEY` (sync: false), `VAPID_PRIVATE_KEY` (sync: false), `VAPID_PUBLIC_KEY` (sync: false), `FRONTEND_URL` (sync: false)
    - Define managed PostgreSQL database: `noded-alright-db`
    - _Requirements: design §3.2_

  - [x] 15.2 Create Vercel deployment config for `web/`
    - Create `client/vercel.json` with `rewrites` rule to serve `index.html` for all non-asset paths (SPA fallback)
    - Document in `README.md`: set Vercel "Root Directory" to `client`; set `VITE_API_URL` environment variable to the Render service URL
    - _Requirements: design §1.1, §1.2_

- [x] 16. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 2.9, 3.8, 8, and 16 ensure incremental validation
- The `web/` package deploys to Vercel; the `api/` package deploys to Render — all file paths and config reflect this split
- Accent color and background color theme switching is achieved by updating CSS custom properties on `:root` — no component tree re-render required
- All animations respect `prefers-reduced-motion: reduce`
