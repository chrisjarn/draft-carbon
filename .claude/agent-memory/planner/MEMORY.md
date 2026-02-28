# Planner Agent Memory

## Project State (as of 2026-02-28)
- Monorepo: Turborepo + Bun + Biome + TypeScript strict
- 9 DB tables in packages/db, 8 tRPC routers (dashboard not registered)
- Working pages: auth, capacity, hiring, wfp, fy-planning, admin
- Stub page: carbonites (backend complete, frontend placeholder)
- Dead files: carbonite.ts (singular router), header.tsx, user-menu.tsx, mode-toggle.tsx

## Key Duplication Issues
- RBAC: WRITE_ROLES/canWrite/assertWriter duplicated in 6 routers + 5 pages + sidebar
- Type cast: `(session.user as { role?: string }).role` appears in every router and page
- UI components: DetailSection/DetailRow duplicated in carbonites.tsx + hiring.tsx
- Format helpers: fmtDollar/fmt duplicated in fy-planning.tsx + wfp.tsx

## Established Patterns
- tRPC queries: `useQuery(trpc.router.procedure.queryOptions(input))`
- tRPC mutations: `useMutation(trpc.router.procedure.mutationOptions({onSuccess, onError}))`
- Page layout: sticky header + filter bar + scrollable content
- Dialogs: form state synced from `initial` prop, `set` helper, `grid grid-cols-2 gap-3`
- Detail sheets: Sheet + ScrollArea + DetailSection/DetailRow
- Badges: border-{color}-500/40 bg-{color}-500/10 text-{color}-400
- RBAC: sidebar filtering by rank, in-page canWrite() check, server-side assertWriter()

## File Path Reference
- App router: `/Users/chrisuttam/projects/carbon-wfp-deploy/packages/api/src/routers/index.ts`
- DB schema: `/Users/chrisuttam/projects/carbon-wfp-deploy/packages/db/src/schema/`
- Web routes: `/Users/chrisuttam/projects/carbon-wfp-deploy/apps/web/src/routes/_app/`
- Legacy reference: `/Users/chrisuttam/projects/carbon-wfp-deploy/legacy/public/index.html`
