# Collaborative Draft Manager

A full-stack application for managing a shared library of AI-generated drafts, with search, pagination, and conflict-safe concurrent editing.

## Features

### Functional Features
- Create, view, edit, and delete drafts (title + content).
- List drafts with case-insensitive search across title and content.
- Server-side pagination with page/limit controls.
- Conflict-safe updates using version-based optimistic concurrency (`ETag` / `If-Match`), with a UI notice when a draft was changed by someone else.
- Optimistic UI: create/update/delete reflect instantly in the list and roll back automatically if the request fails.
- Client-side and server-side validation of draft input.
- Delete confirmation prompt.

### Non-Functional Features
- Centralized, consistent API error handling with structured JSON error responses.
- Debounced search input (300ms) to limit request volume while typing.
- Loading (skeleton), empty, and error states across list and editor views.
- Feature-based, modular codebase on both backend and frontend for maintainability.
- Component-scoped CSS with shared design tokens — no CSS framework dependency.

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Frontend | React 18 (Vite), React Router |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Joi |
| State Management | TanStack React Query (server state) |
| HTTP Client | Axios |

## Project Architecture

**Feature-Based Modular MVC** (backend):

```
Client → Route → Controller → Service → Model → Prisma → PostgreSQL
```

- **Route** (`draft.routes.js`) maps HTTP verbs/paths to controller functions only.
- **Controller** (`draft.controller.js`) validates input (Joi), reads the `If-Match` header, calls the service, and shapes the JSON response (including `ETag`).
- **Service** (`draft.service.js`) holds business logic: 404 detection, version comparison, conflict errors.
- **Model** (`draft.model.js`) is the only layer that talks to Prisma/PostgreSQL.

**Request flow:** `HTTP request → routes → controller (validate) → service (business rules) → model (DB query) → response`.

**Response flow:** DB result → model returns plain data → service shapes list/detail payloads (with `meta` for lists) → controller sets status/headers (`ETag`, `409` body) → JSON sent to client.

The frontend mirrors this with a **feature-based** structure: all draft-related pages, components, hooks, and API calls live under `frontend/src/features/drafts/`.

## Project Structure

```
collab-draft-manager/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   │   └── 20260708122734_add_draft_model/migration.sql
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── notFound.js
│   │   ├── modules/
│   │   │   └── drafts/
│   │   │       ├── draft.controller.js
│   │   │       ├── draft.model.js
│   │   │       ├── draft.query.validation.js
│   │   │       ├── draft.routes.js
│   │   │       ├── draft.service.js
│   │   │       └── draft.validation.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.jsx
│   │   │   └── Layout.jsx
│   │   ├── features/
│   │   │   └── drafts/
│   │   │       ├── components/    # DraftCard, DraftForm, DraftList, DraftListSkeleton, Notification, Pagination, SearchBar
│   │   │       ├── hooks/         # useDraft, useDrafts, useDraftMutations
│   │   │       ├── pages/         # DraftListPage, DraftEditorPage
│   │   │       └── services/
│   │   │           └── draft.api.js
│   │   ├── routes/
│   │   │   └── index.jsx
│   │   ├── services/
│   │   │   └── apiClient.js
│   │   ├── styles/
│   │   │   ├── buttons.css
│   │   │   └── tokens.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── PROJECT_ARCHITECTURE.md
│   └── PROJECT_STATUS.md
├── DESIGN.md
└── README.md
```

## Backend Workflow

1. Request hits Express (`app.js`) — CORS and JSON body parsing applied globally.
2. Route (`draft.routes.js`) dispatches to the matching controller function.
3. Controller validates the request body/query with Joi; on failure, returns `400` with field errors.
4. Controller calls the corresponding service function, forwarding the parsed `If-Match` header on updates.
5. Service applies business rules (existence check → `404`; version match check → `409`/`428`) and delegates persistence to the model.
6. Model executes the Prisma query against PostgreSQL.
7. Controller sets the `ETag` header (from `version`) and returns a consistent JSON envelope: `{ success, message, data, meta? }`.
8. Unmatched routes fall through to `notFound`; thrown errors are caught by the centralized `errorHandler`.

## Frontend Workflow

**React flow:** `main.jsx` wraps the app in `QueryClientProvider` and `BrowserRouter`; `App.jsx` renders `Layout` around the routed pages (`routes/index.jsx`).

**React Query flow:** Each screen calls a feature hook (`useDrafts`, `useDraft`) which runs a `useQuery` keyed via the centralized `draftKeys` factory. Mutations (`useCreateDraft`, `useUpdateDraft`, `useDeleteDraft`) apply optimistic updates in `onMutate` (snapshotting prior cache state), roll back in `onError`, and invalidate the relevant queries in `onSettled` so the UI reconciles with the server (including picking up the new `version` after a save, or the latest state after a 409).

**API flow:** All HTTP calls are isolated in `draft.api.js`, built on a single shared Axios instance (`services/apiClient.js`) whose `baseURL` comes from `VITE_API_BASE_URL`. No component or hook calls Axios directly.

## Database Design

**`Draft` model** (`prisma/schema.prisma`, mapped to table `drafts`):

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (String) | Primary key, `default(uuid())` |
| `title` | VarChar(255) | Required |
| `content` | Text (String) | Required |
| `version` | Integer | Default `1`; incremented on each update, drives optimistic concurrency |
| `createdAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Auto-updated on every change |

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/drafts` | Create a draft |
| GET | `/api/v1/drafts` | List drafts (search, pagination, sorted by `updatedAt` desc) |
| GET | `/api/v1/drafts/:id` | Get a single draft |
| PUT | `/api/v1/drafts/:id` | Update a draft (requires `If-Match` header) |
| DELETE | `/api/v1/drafts/:id` | Delete a draft |

## Concurrency Control

Optimistic concurrency via a `version` counter:

- `GET`/write responses set `ETag: "<version>"`.
- `PUT` requires `If-Match: "<version>"`; missing → `428 Precondition Required`.
- If the header's version doesn't match the row's current `version` → `409 Conflict` with `{ success: false, message, currentVersion }`, and no write occurs.
- On match, the update is applied and `version` increments by 1.
- The frontend sends the version from its cached copy of the draft and, on `409`, shows a conflict notice with the server's current version while refetching the latest draft.

## Search & Pagination

- **Search:** `search` query param matches `title` OR `content`, case-insensitively (Prisma `contains` + `mode: insensitive`).
- **Pagination:** `page` (default 1) and `limit` (default 10, max 50) map to Prisma `skip`/`take`; total count is fetched in parallel (`Promise.all`) and returned as `{ page, limit, total, totalPages }`.
- **Sorting:** results are always ordered by `updatedAt DESC`.

## Environment Variables

**Backend** (`backend/.env.example`):
```
DATABASE_URL=
PORT=
NODE_ENV=
```

**Frontend** (`frontend/.env.example`):
```
VITE_API_BASE_URL=
```

## Installation

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

## Running the Project

**Backend:**
```bash
cd backend
npm install
npm run dev
```
Runs on `http://localhost:5000` by default (or the `PORT` set in `.env`).

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs on the Vite dev server (default `http://localhost:5173`), proxying API calls to `VITE_API_BASE_URL` (defaults to `/api/v1` if unset).

Before first run, apply the Prisma migration against your `DATABASE_URL`:
```bash
cd backend
npx prisma migrate deploy
```

## Assumptions

- A single trusted actor uses the system — no authentication/authorization is implemented.
- `DATABASE_URL` points to a reachable PostgreSQL instance; migrations must be applied before first use.
- Dataset scale (~1,200 records) justifies relational `contains` search over a dedicated search engine.

## Future Improvements

- Add authentication and per-user draft ownership.
- Add automated (unit/integration) test coverage.
- Explore real-time presence/collaboration to reduce edit conflicts.

## License

MIT
