# GymOS

A multi-tenant Gym Management SaaS for Egyptian gyms — covers members, membership plans, subscriptions, attendance tracking, and expiry alerts.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/gym-saas run dev` — run the frontend (port 19918)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + shadcn/ui + wouter + TanStack Query
- API: Express 5 (artifacts/api-server)
- Auth: Replit Auth (OIDC + PKCE, cookie sessions in PostgreSQL)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- API spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/gym.ts` (gym tables), `lib/db/src/schema/auth.ts` (sessions/users)
- Auth routes: `artifacts/api-server/src/routes/auth.ts`
- Feature routes: `artifacts/api-server/src/routes/` (members, plans, subscriptions, attendance, dashboard, tenants)
- Frontend pages: `artifacts/gym-saas/src/pages/`
- Auth web hook: `lib/replit-auth-web/src/use-auth.ts`

## Architecture decisions

- **Multi-tenant from day one**: every business table has `tenant_id` scoped to the authenticated user's gym. All route handlers resolve `tenant_id` from the session user's `owner_id` before touching data.
- **Tenant = gym**: one user owns one gym. Tenant creation happens on first login via the onboarding screen.
- **Server-enforced tenancy**: all DB queries filter by `tenant_id` server-side. No client-side filtering is trusted.
- **Auto-computed end_date**: subscription `end_date` is calculated server-side from `plan.duration_days + start_date` on creation.
- **Session storage in PostgreSQL**: auth sessions are stored in the `sessions` table (not in-memory), surviving server restarts.

## Product

- **Dashboard**: total members, active/expired subscriptions, expiring in 7 days, today's attendance
- **Members**: searchable + paginated list, create/edit/delete, member detail with history
- **Plans**: monthly/quarterly/yearly or custom plans with price + duration
- **Subscriptions**: create, filter by status, update status (active/expired/cancelled)
- **Attendance**: fast check-in by member search, today's log
- **Expiry tracking**: dedicated page with tabs for Today / 3 Days / 7 Days / Already Expired

## User preferences

- No mobile app features
- No AI features
- Smallest sellable MVP for first 5 paying gyms

## Gotchas

- Subscriptions `pricePaid` and plans `price` are stored as Postgres `numeric` — always serialize to `Number()` in route handlers before returning JSON.
- Always restart the API server workflow after editing backend files (it builds with esbuild).
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before touching frontend or backend types.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
