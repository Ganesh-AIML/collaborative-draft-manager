## Current Phase
Phase 8 — UI / UX Modernization (Completed)

## Completed Tasks
✓ Modern SaaS-style dashboard UI (Notion/Linear/Vercel-inspired)
✓ Component-scoped CSS files (no global stylesheet, no CSS framework)
✓ Design tokens (colors, radius, shadow, spacing) in `styles/tokens.css`
✓ Modern draft cards with content preview, version badge, hover elevation
✓ Rounded search bar with CSS-only icon
✓ Centered pagination with highlighted current page, disabled invalid states
✓ Empty state with CSS illustration + Create Draft action
✓ Skeleton loading state (no spinners)
✓ Centered card-based editor layout with inline validation
✓ Modern success/error/conflict notifications (auto-dismiss on success)
✓ Responsive layout (desktop, tablet, mobile)
✓ No backend, API contract, or React Query logic changes
✓ Project bootstrap
✓ PostgreSQL + Prisma
✓ Draft schema
✓ CRUD APIs
✓ Validation
✓ Optimistic concurrency (ETag + If-Match)
✓ Search (title/content, case-insensitive, partial match)
✓ Pagination (DB-level, skip/take, parallel count)
✓ Query param validation (page/limit/search)
✓ Sorting by updatedAt DESC
✓ Frontend feature-based structure (drafts feature: pages/components/hooks/services)
✓ draft.api.js — isolated HTTP layer (getDrafts, getDraft, createDraft, updateDraft, deleteDraft)
✓ React Query hooks — useDrafts, useDraft, useCreateDraft, useUpdateDraft, useDeleteDraft
✓ DraftListPage — search + pagination + navigation
✓ DraftEditorPage — create/edit/delete, shared DraftForm
✓ SearchBar (300ms debounce), Pagination, DraftList, DraftCard, DraftForm
✓ Routing: `/`, `/drafts/new`, `/drafts/:id`
✓ Loading, empty, and error states
✓ Delete confirmation (browser confirm)
✓ Client-side validation (empty title/content)

## Remaining Tasks
- Optimistic UI with rollback (Phase 9)
- Integration testing (Phase 10)
- Unit/e2e testing (Phase 11)
- Documentation refinement (Phase 12)

## Current Architecture Snapshot
Backend API contract complete: CRUD + concurrency + search + pagination live at /api/v1/drafts. Frontend now fully wired to this contract via draft.api.js — list, view, create, edit, and delete flows work end-to-end. No optimistic updates or rollback yet.

## Technical Decisions
- Search uses Prisma `contains`/`insensitive` — no external search engine, per scale (~1200 records) this is sufficient
- Count + data fetch run concurrently via Promise.all for efficiency
- totalPages computed as Math.ceil(total/limit), 0 when no results
- Draft version (returned in body, not just ETag header) is carried in React Query cache and sent back as `If-Match` on update, avoiding header parsing on the client
- Query keys centralized in a `draftKeys` factory inside draft.api.js — hooks import it rather than redefining key arrays
- Debounce implemented locally in SearchBar (setTimeout/clearTimeout) — no new dependency added for a single 300ms debounce
- Single DraftForm reused for both create and edit to avoid duplicated form logic