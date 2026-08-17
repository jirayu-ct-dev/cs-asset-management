# Repository Guidelines

## Project Structure

This is a Nuxt 4 modular monolith. Keep Vue pages, layouts, components, composables, and Tailwind entry styles in `app/`. Put Nitro API handlers, middleware, and business services in `server/`; shared Zod schemas and domain types belong in `shared/`. Database models, migrations, and seed data live in `prisma/`. Use `tests/` for Vitest and Playwright coverage. Deployment and operations are defined by `Dockerfile`, `compose*.yaml`, and `scripts/{backup,restore}.sh`.

## Working Principles

Apply these Karpathy-inspired rules with judgment:

1. State material assumptions and ambiguity before implementation.
2. Choose the smallest solution that satisfies the requirement; avoid speculative features and single-use abstractions.
3. Make surgical changes. Match existing patterns and do not refactor unrelated code.
4. Define `step → verification`, then loop until the relevant check passes. Reproduce bugs with tests before fixing them when practical.

## Development Commands

- `pnpm dev` — start Nuxt with HMR; run PostgreSQL with `docker compose up -d db`.
- `pnpm lint` — run Nuxt-aware ESLint.
- `pnpm typecheck` — check strict TypeScript and Vue templates.
- `pnpm test` — run Vitest unit/integration tests.
- `pnpm test:e2e` — run Playwright browser tests.
- `pnpm build` — build the production Nitro server.
- `pnpm db:migrate` / `pnpm db:seed` — migrate or seed the development database.

Before handoff, run lint, typecheck, tests, Prisma validation, and build. Do not ignore a failing gate.

## Code and UI Style

Use TypeScript strict mode, two-space indentation, UTF-8, LF endings, and arrow functions for project functions and handlers. Use `PascalCase` for Vue components/types and `camelCase` for values. Validate every API input with Zod and enforce state transitions inside database transactions.

Style templates primarily with Tailwind utilities directly in `class`, for example `<div class="flex gap-4 p-4">`. Keep `app/assets/css/main.css` limited to imports, tokens, and genuinely global rules. Configure Nuxt UI colors and component defaults centrally in `app/app.config.ts`. Do not disable action buttons: keep them clickable, check the precondition in an arrow handler, show a Toast explaining why the action cannot run, and return without calling the API.

## Tests, Commits, and Security

Name tests by behavior, such as `rejects a duplicate active loan`. Cover success, validation, authorization, concurrency, and rollback paths. Use Conventional Commits such as `feat: add inspection snapshot workflow`. PRs must describe the problem, verification commands, migrations/environment changes, and include screenshots for UI work. Never commit `.env`, uploads, backups, reports, secrets, or real personal data; update `.env.example` for new configuration.
