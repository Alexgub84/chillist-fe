# Chillist Frontend

React app for trip and event planning with shared checklists, participant coordination, invite links, and auth-aware ownership flows.

## README-first Workflow for Cursor

Use this order for every task:

1. Read this `README.md` first.
2. Read `../chillist-docs/rules/frontend.md` for strict minimal rules.
3. Identify only the files relevant to the task using the maps below.
4. Open those files only (avoid scanning unrelated folders).
5. If detail is missing, then open the linked deep docs in `chillist-docs`.

This keeps context minimal and avoids repeating known mistakes.

## Quick Start

```bash
npm install
cp .env.example .env
npm run mock:server
npm run dev
```

## App Overview

- Core domain: plans, participants, items, invite sharing, ownership and permissions
- Frontend stack: React 19 + TypeScript + Vite + TanStack Router + React Query + Zod
- API model: backend-owned OpenAPI contract, consumed by frontend
- Testing layers: unit (`Vitest`), integration (`Vitest`), E2E (`Playwright`)

## Route Map

Primary route files live in `src/routes/`:

- `__root.tsx`: app shell, providers, layout
- `index.lazy.tsx`: landing page
- `plans.lazy.tsx`: plans list
- `create-plan.tsx`: create plan screen route definition
- `plan.$planId.tsx` + `plan.$planId.lazy.tsx`: plan detail route + UI
- `manage-participants.$planId.tsx` + `manage-participants.$planId.lazy.tsx`: owner-only participant management route
- `items.$planId.tsx` + `items.$planId.lazy.tsx`: items-focused route + UI
- `invite.$planId.$inviteToken.tsx` + `invite.$planId.$inviteToken.lazy.tsx`: public invite route + page logic
- `signin.tsx` + `signin.lazy.tsx`: sign-in route (search validation + UI)
- `signup.tsx` + `signup.lazy.tsx`: sign-up route (search validation + UI)
- `complete-profile.lazy.tsx`: post-auth profile completion
- `admin.last-updated.tsx` + `admin.last-updated.lazy.tsx`: admin-only changelog page
- `about.lazy.tsx`, `not-found.lazy.tsx`, `ErrorPage.tsx`: supporting screens

Generated route tree:

- `src/routeTree.gen.ts` (generated, do not edit manually)

## Folder Map

- `src/routes/`: route-level composition and page entry points
- `src/components/`: UI components and shared primitives
- `src/hooks/`: data and behavior hooks per domain (`usePlan`, `useInvitePlan`, `useUpdateItem`, etc.)
- `src/core/`: API clients, request helpers, schemas, auth error bus, shared core logic
- `src/contexts/`: app providers (`AuthProvider`, `LanguageProvider`)
- `src/i18n/`: i18n setup and locale files
- `src/data/`: static data (`common-items`, changelog, taxonomies)
- `api/`: local Fastify mock server and mock data
- `tests/`: unit, integration, and E2E tests
- `scripts/`: utility scripts (screenshots, data enrichment)

## How To Find Files Fast

### Auth UI and Auth State

- Routes: `src/routes/signin.tsx`, `src/routes/signin.lazy.tsx`, `src/routes/signup.tsx`, `src/routes/signup.lazy.tsx`, `src/routes/complete-profile.lazy.tsx`
- Auth context: `src/contexts/AuthProvider.tsx`
- Auth hook: `src/contexts/useAuth.ts`, auth modal: `src/components/AuthErrorModal.tsx`
- Supabase + token use: `src/lib/supabase.ts`, `src/core/api.ts`, `src/core/api-client.ts`

### Plan Detail and Owner-only Actions

- Route/page: `src/routes/plan.$planId.lazy.tsx`
- Manage Participants (owner-only): `src/routes/manage-participants.$planId.lazy.tsx`
- Main view components: `src/components/Plan.tsx`, `src/components/ParticipantDetails.tsx`, `src/components/ManageParticipantsList.tsx`, `src/components/EditPlanForm.tsx`
- Item rendering and permissions: `src/components/ItemsList.tsx`, `src/components/CategorySection.tsx`, `src/components/ItemCard.tsx`

### Owner and Admin Flows

- Owner gating and edits: `src/routes/plan.$planId.lazy.tsx`, `src/components/Plan.tsx`
- Admin delete UI: `src/components/PlansList.tsx`
- Auth role detection: `src/contexts/AuthProvider.tsx`

### API Client and OpenAPI

- Primary API layer: `src/core/api.ts`
- Secondary OpenAPI fetch client: `src/core/api-client.ts`
- Generated contract types: `src/core/api.generated.ts` (never hand-edit)
- Domain schemas: `src/core/schemas/*`
- OpenAPI sync scripts: `npm run api:fetch`, `npm run api:types`, `npm run api:sync`

### Invite and Guest Flows

- Invite route: `src/routes/invite.$planId.$inviteToken.lazy.tsx`
- Invite fetch and helpers: `src/hooks/useInvitePlan.ts`, `src/core/invite.ts`, `src/core/pending-invite.ts`, `src/core/api.ts`

### Tests and Validation

- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- E2E tests and fixtures: `tests/e2e/main-flow.spec.ts`, `tests/e2e/plans.spec.ts`, `tests/e2e/fixtures.ts`
- Standard validation: `npm run typecheck && npm run lint && npm run test:unit`

### Deploy and CI

- CI workflows: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- OpenAPI fetch script: `scripts/fetch-openapi.sh`

## Standard Workflow for Adding or Editing Screens

1. Start from route file in `src/routes/`.
2. Trace imported page components in `src/components/`.
3. Trace data hooks in `src/hooks/`.
4. Trace API calls and schemas in `src/core/`.
5. Update or add tests in the matching layer (`unit`, `integration`, `e2e`).
6. Run validation before finalizing changes.

## Dev Rules (Minimal)

Task-critical rules are summarized locally in:

- [Frontend Rules](https://github.com/Alexgub84/chillist-docs/blob/main/rules/frontend.md)

If a task needs deeper background, then consult:

- [Frontend Guide](https://github.com/Alexgub84/chillist-docs/blob/main/guides/frontend.md)
- [Common Rules](https://github.com/Alexgub84/chillist-docs/blob/main/rules/common.md)
- [MVP Spec](https://github.com/Alexgub84/chillist-docs/blob/main/specs/mvp-v1.md)
- [Dev Lessons](https://github.com/Alexgub84/chillist-docs/blob/main/dev-lessons/frontend.md)

## Tech Stack

React 19, TypeScript, Vite 7, Tailwind CSS v4, TanStack Router, TanStack React Query, React Hook Form, Zod, i18next, Vitest, Playwright.
