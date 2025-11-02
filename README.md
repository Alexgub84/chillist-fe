# Chillist

A simple plan management app built with React, TypeScript, and Tailwind CSS.

## Development

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

### Run tests

```bash
npm run test
```

### Type check

```bash
npm run typecheck
```

### Lint and format

```bash
npm run lint
npm run lint:fix
```

### Build for production

```bash
npm run build
```

## Git Workflow

### Pre-commit Hooks (Husky)

Before each commit, Husky automatically runs the following checks:

1. **TypeScript Type Check** - Ensures no type errors (`npm run typecheck`)
2. **Lint Staged Files** - Runs ESLint and Prettier on staged files only
3. **Run Tests** - Executes all unit tests (`npm run test:run`)

If any check fails, the commit will be blocked until issues are fixed.

### Before Committing

While Husky handles checks automatically, you can manually run:

```bash
# Type check
npm run typecheck

# Fix linting and formatting
npm run lint:fix

# Run tests
npm run test:run
```

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
