# Linux Distro Repository

An authenticated repository for browsing and maintaining Linux distribution records, with a CachyOS-inspired operator interface.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — signs repository session cookies

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/linux-distro-repository/` — Vite frontend, shell, login, repository, and admin editor screens
- `artifacts/api-server/src/routes/` — health, authentication, distro CRUD, and repository summary endpoints
- `artifacts/api-server/src/lib/session.ts` — signed HttpOnly session cookies and password verification
- `lib/db/src/schema/` — users and distro tables
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `artifacts/linux-distro-repository/src/index.css` — deep-space/cyan visual theme

## Architecture decisions

- The app uses the workspace's managed PostgreSQL database and Drizzle schema rather than introducing a second database service.
- Admin and read-only roles are enforced in both the UI and API; UI hiding is not treated as authorization.
- Sessions are signed, HttpOnly cookies backed by an in-memory session map for the preview runtime.
- User-uploaded images are validated client-side and persisted as image references/data URLs in the distro record.

## Product

- Sign in as `admin` or `user`, browse seeded Linux distro records, search/filter by status, inspect repository health, and view recent additions.
- Admins can register, edit, delete, and attach optional JPG/PNG/WEBP imagery up to 2 MB.
- Regular users receive a read-only repository view and backend mutations are rejected with 403.

## User preferences

- The requested experience is Linux desktop-inspired with dark glass panels, deep-space atmosphere, cyan glow, and terminal-like controls.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
