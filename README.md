# Chillist

A simple plan management app built with React, TypeScript, and Tailwind CSS.
`chillist_mvp_specs_v_1.md` – full product specification for the MVP.

## Setup

### Install dependencies

- Run `npm install`.

### Configure environment variables

Copy the provided example and adjust as needed. The example binds the mock server to `0.0.0.0` (suitable for production containers); your local `.env` can keep `localhost` instead.

- Duplicate the template with `cp .env.example .env`.

Key variables:

- `MOCK_SERVER_HOST`: host binding for the dev mock server (`0.0.0.0` in the example; set `localhost` for local-only).
- `MOCK_SERVER_PORT`: port for the dev mock server (`3333`).

## Running Locally

### Start the Vite dev server

- `npm run dev`

### Run unit tests

- `npm run test`

### Type check

- `npm run typecheck`

### Build for production

- `npm run build`

## Mock Data Toolkit

### Watch mock dataset with Nodemon

Use the lightweight mock loader to validate JSON fixtures and preview dataset summaries while developing against the planned API contract.

- `npm run mock:watch`

This spins up Nodemon with `tsx`, reloading whenever files in `api/mock-data.json` or `api/mock.ts` change. You will see console output similar to:

```
[mock] dataset loaded { plans: 1, participants: 3, items: 10 }
```

Update the JSON payloads, save, and Nodemon will automatically re-run and print the refreshed counts, making it easy to iterate on future route shapes.

### Run the mock API server

Expose the JSON dataset over Fastify while you prototype the frontend against REST endpoints.

- `npm run mock:server`

The server watches the same `api/` sources and reloads on change. By default it listens on `http://localhost:3333`; use the routes below to interact:

- `GET /plans`
- `POST /plans`
- `PATCH /plan/:planId`
- `DELETE /plan/:planId`
- `GET /plan/:planId`
- `GET /plan/:planId/participants`
- `POST /plan/:planId/participants`
- `GET /participants/:participantId`
- `PATCH /participants/:participantId`
- `DELETE /participants/:participantId`
- `GET /plan/:planId/items`
- `POST /plan/:planId/items`
- `GET /items/:itemId`
- `PATCH /items/:itemId`
- `DELETE /items/:itemId`

All write operations update `api/mock-data.json`, so you can keep iterating with realistic data.

## Linting & Husky

### Manual linting and formatting

- `npm run lint`
- `npm run lint:fix`

### Husky pre-commit hooks

Every commit triggers Husky, which runs:

1. `npm run typecheck` – fails on TypeScript errors.
2. ESLint + Prettier on staged files (`lint-staged`).
3. `npm run test:run` – executes unit tests in CI mode.

Fix any reported issues before committing; Husky will block the commit if a step fails.

### Recommended manual checks before commit

- `npm run typecheck`
- `npm run lint:fix`
- `npm run test:run`

## Working with Git

### Branch strategy

**Never push directly to `main`.** Always branch for your work.

- `git checkout -b feature/your-feature-name`
- Make changes, then `git add .`
- Commit with a Conventional Commit message, for example `git commit -m "feat: add new feature"`
- `git push origin feature/your-feature-name`

Open a Pull Request for review once your branch is pushed.

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` – New feature
- `fix:` – Bug fix
- `docs:` – Documentation changes
- `refactor:` – Code refactoring
- `test:` – Adding or updating tests
- `chore:` – Maintenance tasks

## Tailwind CSS Customization

This project uses Tailwind CSS v4 with the Vite plugin. **No `tailwind.config.js` file is needed.**

To customize Tailwind (colors, fonts, breakpoints, etc.), edit `src/index.css`:

```css
@import 'tailwindcss';

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #10b981;
  --font-family-display: 'Inter', sans-serif;
  --breakpoint-3xl: 1920px;
}
```

See [Tailwind CSS v4 documentation](https://tailwindcss.com/docs) for more customization options.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Vitest + React Testing Library
- ESLint + Prettier
- Husky (pre-commit hooks)



