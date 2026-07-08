# Collaborative Draft Manager — Design Document

## 1. Overall Approach

**Objective.** Provide a shared workspace where multiple users can create, browse, search, and edit a library of AI-generated drafts (~1,200 records) without silently overwriting each other's changes.

**Strategy.** The system is a two-tier application: an Express + Prisma + PostgreSQL REST API, and a React SPA consuming it via React Query. The core engineering challenge — concurrent edits to the same draft — is solved with optimistic concurrency control (version number + `ETag`/`If-Match`) rather than locking, keeping the backend stateless and horizontally scalable.

**Why this architecture.** A single relational table (`Draft`) with a version counter, searched and paginated at the database level, is the simplest design that satisfies the functional requirements (CRUD, conflict-safe updates, search, pagination) without introducing infrastructure (message queues, WebSocket servers, external search engines) that the problem doesn't call for.

**Backend workflow.** Requests enter through `draft.routes.js`, are validated and shaped in `draft.controller.js` (Joi schemas), delegate business rules to `draft.service.js` (404 detection, version comparison), and only `draft.model.js` talks to Prisma/PostgreSQL. Errors thrown anywhere in the chain are forwarded to a single `errorHandler` middleware.

**Frontend workflow.** Each page (`DraftListPage`, `DraftEditorPage`) reads/writes through React Query hooks (`useDrafts`, `useDraft`, `useCreateDraft`, `useUpdateDraft`, `useDeleteDraft`), which call a feature-local `draft.api.js` built on a shared Axios instance. Mutations apply optimistic cache updates and roll back on error, including on a 409 version conflict.

## 2. Architecture

**Backend — Feature-Based Modular MVC:**

```
Client
  ↓
Routes        (draft.routes.js)
  ↓
Controllers   (draft.controller.js — parse, validate, shape response)
  ↓
Services      (draft.service.js — business rules, conflict detection)
  ↓
Models        (draft.model.js — Prisma queries only)
  ↓
Prisma
  ↓
PostgreSQL
```

Cross-cutting concerns (`cors`, `express.json`, `notFound`, centralized `errorHandler`) are wired once in `app.js`. The `drafts` module is self-contained under `src/modules/drafts/`; empty `src/services/` and `src/utils/` directories are reserved for future cross-module logic but currently hold no code.

**Frontend — Feature-Based Architecture:**

```
src/
  App.jsx / main.jsx        — root wiring, providers (QueryClientProvider, BrowserRouter)
  routes/                   — route table
  components/               — shared shell (Layout)
  services/apiClient.js     — single Axios instance
  features/drafts/
    pages/                  — DraftListPage, DraftEditorPage
    components/             — DraftList, DraftCard, SearchBar, Pagination, DraftForm, Notification, DraftListSkeleton
    hooks/                  — useDrafts, useDraft, useDraftMutations
    services/draft.api.js   — HTTP calls + React Query key factory
```

No HTTP logic lives in components; all requests are isolated in `draft.api.js`, consumed only through hooks.

## 3. Major Design Decisions

| Decision | Why |
|---|---|
| **Express + React** | Minimal, well-understood stack; no framework overhead needed for a single-resource CRUD app. |
| **PostgreSQL** | Relational fit for a structured `Draft` entity; native `ILIKE`-style case-insensitive search and reliable row versioning (`version` column) without extra tooling. |
| **Prisma ORM** | Type-safe query builder, migration management, and a single `schema.prisma` as source of truth for the schema. |
| **React Query** | Handles server-state caching, refetching, and cache invalidation declaratively; `keepPreviousData` gives smooth pagination without manual loading-state juggling. |
| **Axios** | Simple interceptor-friendly HTTP client; used to attach the `If-Match` header per-request. |
| **Feature-based architecture (both tiers)** | Keeps all draft-related code (routes/controllers/services/models on the backend; pages/components/hooks/services on the frontend) colocated, so the codebase scales by feature rather than by technical layer sprawl. |
| **Modular MVC on the backend** | Clear separation between request parsing (controller), business rules (service), and persistence (model) keeps each file single-purpose and testable in isolation. |
| **Optimistic Concurrency Control** | Avoids DB-level locks and long-held transactions; conflicts are detected cheaply via a version compare and surfaced to the client as a 409. |
| **`contains` + `mode: insensitive` search** | Adequate for ~1,200 rows; avoids operating a separate search engine for a dataset this small. |
| **Offset pagination (`skip`/`take`)** | Simple, supports arbitrary page jumps (page 1, 2, 3…) which the UI's numbered pagination control requires; dataset size doesn't warrant cursor pagination. |

## 4. Concurrency Strategy

Every draft carries a `version` integer, starting at `1` on creation and incremented by exactly `1` on every successful update.

- **ETag.** `GET /drafts/:id` and any successful write respond with header `ETag: "<version>"`, reflecting the row's current version.
- **If-Match.** `PUT /drafts/:id` requires an `If-Match: "<version>"` header. Missing header → `428 Precondition Required`.
- **Version comparison.** The service loads the current row, compares `If-Match` against `existing.version`. Equal → update proceeds and version increments. Not equal → **409 Conflict**, no write performed, response body includes `currentVersion` so the client can reload the latest state.
- **Lost update prevention.** Because the compare-and-increment happens inside `updateDraft` before any write, two concurrent PUTs referencing the same stale version cannot both succeed — the second one to arrive always meets the strictly-greater `existing.version` and is rejected with 409, so a slower client's write can never silently clobber a faster one.
- **Client handling.** The frontend sends the version it last read (cached from React Query, not re-parsed from headers) as `If-Match`. On 409, the editor shows a "modified by another user" notice with the server's current version and refetches the latest draft.

## 5. Search Strategy

- **`contains` matching** on `title` OR `content` (Prisma `OR` filter), so a search term matches either field.
- **Case-insensitive** via Prisma's `mode: 'insensitive'`.
- **Pagination** via `skip`/`take`, computed from validated `page`/`limit` query params (limit capped at 50).
- **Sorting** — results are always ordered by `updatedAt DESC`, so recently edited drafts surface first.
- **Why PostgreSQL over a vector database:** at ~1,200 records, a single indexed relational table with substring search comfortably meets latency needs. A vector/embedding search engine would add operational complexity (embedding pipeline, separate index, sync logic) with no meaningful benefit at this scale — that trade-off only pays off at far larger corpora or when semantic (not literal) matching is required.

## 6. Trade-offs

- **PostgreSQL `contains` search instead of Elasticsearch** — trades ranked/fuzzy relevance for zero extra infrastructure; acceptable at current record volume.
- **Simplicity over microservices** — single Express service and single React app instead of decomposed services; appropriate for one bounded resource (`Draft`).
- **Offset pagination instead of cursor-based pagination** — simpler to implement and matches a numbered-page UI, at the cost of typical offset-pagination drift under high write concurrency (acceptable at this scale).
- **No authentication or authorization** — out of scope for this assessment; the API and UI currently treat all callers as a single trusted actor.
- **No automated tests present** — `backend/tests/` exists as a placeholder directory only; correctness currently relies on manual verification.

## 7. Features Completed

- Draft CRUD (create, read one, read list, update, delete) via REST endpoints under `/api/v1/drafts`.
- Optimistic concurrency control: `version` column, `ETag` response header, `If-Match` requirement, `428`/`409` handling.
- Case-insensitive search across `title` and `content`.
- DB-level offset pagination with `page`/`limit`/`total`/`totalPages` metadata, capped and validated via Joi.
- Sorting by `updatedAt DESC`.
- Request validation (Joi) for create/update bodies and list query params.
- Centralized error handling and 404 middleware.
- React SPA with routing (`/`, `/drafts/new`, `/drafts/:id`) for list and create/edit flows.
- Debounced search input (300ms, no extra dependency).
- Numbered pagination control wired to server metadata.
- Optimistic UI updates with automatic rollback on error for create, update, and delete (via React Query `onMutate`/`onError`/`onSettled`), including rollback on 409 conflicts.
- Conflict UI: dedicated notification showing the server's current version when an update is rejected.
- Loading (skeleton), empty, and error states for list and editor views.
- Client-side required-field validation on the draft form.
- Delete confirmation via browser `confirm()`.
- Component-scoped CSS with shared design tokens and button classes; no CSS framework dependency.

## 8. Features Not Completed

- Authentication and user identity.
- User roles / permissions.
- Rich text editor (content is a plain textarea).
- Real-time collaboration (no live presence or concurrent-edit awareness beyond conflict-on-save).
- WebSockets / push updates.
- Automated testing (unit, integration, or end-to-end) — no test files exist beyond a placeholder directory.

## 9. Future Improvements

- Add authentication/authorization and per-user draft ownership.
- Introduce automated tests (API integration tests for the concurrency and search paths; component tests for the editor conflict flow).
- Consider WebSocket-based presence indicators to reduce conflict frequency before it reaches the save step.
- Evaluate cursor-based pagination if record volume grows substantially beyond the current scale.
