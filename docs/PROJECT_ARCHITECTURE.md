# PROJECT_ARCHITECTURE.md

## Project Overview
Collaborative Draft Manager — shared library of AI-generated drafts with safe concurrent editing.

## Scope
Track A Full-Stack Assessment. Draft CRUD, concurrency-safe updates, search+pagination, optimistic UI.

## Business Goal
Enable teams to edit shared AI-drafted content without lost updates, with responsive UI.

## Functional Requirements
- Draft CRUD
- Version/ETag-based concurrency control
- Search + pagination (~1200 records)
- Optimistic UI with rollback

## Non-Functional Requirements
- Consistency under concurrent writes
- Scalable search/pagination
- Clean validated API contract

## High-Level Architecture
Feature-Based Modular MVC backend, Feature-Based frontend. Draft feature is self-contained module.

## Request Flow
Client → Route → Controller → Service → Model/DB → Response

## Planned Modules
- drafts (core)
- core (config/db/errors)
- auth (future phase)

## Planned Folder Structure
See project structure section (Phase 0 deliverable).

## Database Schema

### Draft Entity
| Field     | Type     | Constraints                        |
|-----------|----------|-------------------------------------|
| id        | UUID     | Primary Key, default uuid()         |
| title     | String   | Required, max 255 chars             |
| content   | String   | Required                            |
| version   | Integer  | Default 1, used for optimistic concurrency |
| createdAt | DateTime | Auto-set on creation                |
| updatedAt | DateTime | Auto-updated on change              |

## Validation Strategy
Joi schemas defined per operation (create/update), isolated in draft.validation.js.
No route/controller integration yet — validation wiring deferred to Phase 3.


## Draft Request Flow
Client → draft.routes.js → draft.controller.js (validate + parse)
→ draft.service.js (business logic) → draft.model.js (Prisma) → DB
Response bubbles back through same chain; errors forwarded to centralized errorHandler.

## CRUD Endpoints
POST   /api/v1/drafts        Create draft
GET    /api/v1/drafts        List drafts (no pagination yet)
GET    /api/v1/drafts/:id    Get draft by id
PUT    /api/v1/drafts/:id    Update draft (no version check yet)
DELETE /api/v1/drafts/:id    Delete draft

## Module Responsibilities
- draft.routes.js: route → controller mapping only
- draft.controller.js: request parsing, validation trigger, response shaping, error forwarding
- draft.service.js: all business logic, 404 detection
- draft.model.js: Prisma-only persistence operations

## ETag Strategy
GET /api/v1/drafts/:id returns header `ETag: "<version>"` reflecting Draft.version.

## If-Match Workflow
PUT /api/v1/drafts/:id requires header `If-Match: "<version>"`.
- Missing header → 428 Precondition Required
- Header version ≠ DB version → 409 Conflict, response includes currentVersion, no write performed
- Header version = DB version → update proceeds

## Version Lifecycle
version starts at 1 (creation). Each successful update increments version by 1 and returns new ETag.

## Conflict Handling
409 response body:
{ "success": false, "message": "Draft has been modified by another user.", "currentVersion": <n> }
Client must refetch latest draft before retrying.

## Search Strategy
Case-insensitive partial match on title OR content via Prisma `contains` + `mode: insensitive`. No full-text/external search engine.

## Pagination Strategy
DB-level pagination via Prisma `skip`/`take`. Count query run in parallel with data query (Promise.all). No in-memory slicing.

## Query Parameters (GET /api/v1/drafts)
- page (default 1, min 1)
- limit (default 10, min 1, max 50)
- search (optional string, matches title/content)
Sorted by updatedAt DESC.

## Response Metadata
{ page, limit, total, totalPages } returned alongside data array.


# PROJECT_ARCHITECTURE.md

## Project Overview
Collaborative Draft Manager — shared library of AI-generated drafts with safe concurrent editing.

## Scope
Track A Full-Stack Assessment. Draft CRUD, concurrency-safe updates, search+pagination, optimistic UI.

## Business Goal
Enable teams to edit shared AI-drafted content without lost updates, with responsive UI.

## Functional Requirements
- Draft CRUD
- Version/ETag-based concurrency control
- Search + pagination (~1200 records)
- Optimistic UI with rollback

## Non-Functional Requirements
- Consistency under concurrent writes
- Scalable search/pagination
- Clean validated API contract

## High-Level Architecture
Feature-Based Modular MVC backend, Feature-Based frontend. Draft feature is self-contained module.

## Request Flow
Client → Route → Controller → Service → Model/DB → Response

## Planned Modules
- drafts (core)
- core (config/db/errors)
- auth (future phase)

## Planned Folder Structure
See project structure section (Phase 0 deliverable).

## Database Schema

### Draft Entity
| Field     | Type     | Constraints                        |
|-----------|----------|-------------------------------------|
| id        | UUID     | Primary Key, default uuid()         |
| title     | String   | Required, max 255 chars             |
| content   | String   | Required                            |
| version   | Integer  | Default 1, used for optimistic concurrency |
| createdAt | DateTime | Auto-set on creation                |
| updatedAt | DateTime | Auto-updated on change              |

## Validation Strategy
Joi schemas defined per operation (create/update), isolated in draft.validation.js. Wired directly into draft.controller.js — every write and list request validated before reaching the service layer.


## Draft Request Flow
Client → draft.routes.js → draft.controller.js (validate + parse)
→ draft.service.js (business logic) → draft.model.js (Prisma) → DB
Response bubbles back through same chain; errors forwarded to centralized errorHandler.

## CRUD Endpoints
POST   /api/v1/drafts        Create draft
GET    /api/v1/drafts        List drafts (no pagination yet)
GET    /api/v1/drafts/:id    Get draft by id
PUT    /api/v1/drafts/:id    Update draft (no version check yet)
DELETE /api/v1/drafts/:id    Delete draft

## Module Responsibilities
- draft.routes.js: route → controller mapping only
- draft.controller.js: request parsing, validation trigger, response shaping, error forwarding
- draft.service.js: all business logic, 404 detection
- draft.model.js: Prisma-only persistence operations

## ETag Strategy
GET /api/v1/drafts/:id returns header `ETag: "<version>"` reflecting Draft.version.

## If-Match Workflow
PUT /api/v1/drafts/:id requires header `If-Match: "<version>"`.
- Missing header → 428 Precondition Required
- Header version ≠ DB version → 409 Conflict, response includes currentVersion, no write performed
- Header version = DB version → update proceeds

## Version Lifecycle
version starts at 1 (creation). Each successful update increments version by 1 and returns new ETag.

## Conflict Handling
409 response body:
{ "success": false, "message": "Draft has been modified by another user.", "currentVersion": <n> }
Client must refetch latest draft before retrying.

## Search Strategy
Case-insensitive partial match on title OR content via Prisma `contains` + `mode: insensitive`. No full-text/external search engine.

## Pagination Strategy
DB-level pagination via Prisma `skip`/`take`. Count query run in parallel with data query (Promise.all). No in-memory slicing.

## Query Parameters (GET /api/v1/drafts)
- page (default 1, min 1)
- limit (default 10, min 1, max 50)
- search (optional string, matches title/content)
Sorted by updatedAt DESC.

## Response Metadata
{ page, limit, total, totalPages } returned alongside data array.

## Frontend Architecture
Feature-Based React Architecture. Draft feature self-contained under `frontend/src/features/drafts/`.

## Frontend Folder Structure
frontend/src/
- features/drafts/pages/ — DraftListPage.jsx, DraftEditorPage.jsx
- features/drafts/components/ — DraftList, DraftCard, SearchBar, Pagination, DraftForm
- features/drafts/hooks/ — useDrafts.js, useDraft.js, useDraftMutations.js
- features/drafts/services/ — draft.api.js
- services/apiClient.js — shared axios instance (baseURL from VITE_API_BASE_URL, default `/api/v1`)
- routes/index.jsx — route table
- components/Layout.jsx — shared shell

## Component Hierarchy
App → Layout → AppRoutes
- `/` → DraftListPage → SearchBar + DraftList (→ DraftCard×N) + Pagination
- `/drafts/new`, `/drafts/:id` → DraftEditorPage → DraftForm

## API Integration
All HTTP calls isolated in `draft.api.js` (feature-local), built on the shared `apiClient` axios instance. No HTTP logic in components or hooks.
- getDrafts({ page, limit, search }) → GET /drafts
- getDraft(id) → GET /drafts/:id
- createDraft(payload) → POST /drafts
- updateDraft({ id, data, version }) → PUT /drafts/:id, sends `If-Match: "<version>"`
- deleteDraft(id) → DELETE /drafts/:id

## React Query Usage
Query key factory `draftKeys` (in draft.api.js) is the single source of truth — no duplicated key literals.
- `useDrafts` — list query, keyed by `{ page, limit, search }`, uses `placeholderData: keepPreviousData` for smooth pagination.
- `useDraft` — single-draft query, keyed by id, disabled when id absent (create mode).
- `useDraftMutations.js` — `useCreateDraft`, `useUpdateDraft`, `useDeleteDraft`; each invalidates `draftKeys.lists()` (and `draftKeys.detail(id)` for update) on success.
No optimistic updates/rollback yet — deferred to next phase.

## Routing
- `/` — DraftListPage
- `/drafts/new` — DraftEditorPage (create mode)
- `/drafts/:id` — DraftEditorPage (edit mode)

## Frontend Styling Architecture (Phase 8)
Plain CSS only — no Tailwind/Bootstrap/UI kit, no new dependencies.

- `styles/tokens.css` — global design tokens (color palette, radius, shadow, spacing, font stack), imported once in `main.jsx`.
- `styles/buttons.css` — shared `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger` classes reused across pages.
- Each component/page owns a co-located CSS file imported directly into its `.jsx` (e.g. `DraftCard.jsx` → `DraftCard.css`), so styles stay scoped and no single giant stylesheet exists.
- `Notification.jsx` (+ `Notification.css`) — new presentational component for success/error/conflict messages, replacing raw `<p className="error-state">` text; supports `autoDismiss` for the success case.
- `DraftListSkeleton.jsx` (+ `.css`) — CSS-only shimmer skeleton shown while `useDrafts`/`useDraft` are loading, replacing the previous "Loading..." text.
- Empty state, pagination, search bar, and form inputs restyled in place; no changes to component props/behavior, only markup/classNames needed to hook up the new styles.
- All existing hooks, services, React Query cache logic, routing, and API contracts are unchanged.