# Source Inventory and Disposition

> **Audit status:** Verified against the managed root application and the preserved `moodoor-studio-src/` source tree on 2026-08-19. The managed Evercrafted application is the implementation runtime and source of truth.

| Source | Runtime and structure | Routes or functions observed | Data and API boundary | Disposition |
|---|---|---|---|---|
| Managed Evercrafted application | React 19, Tailwind 4, Express 4, tRPC 11, Drizzle/MySQL, Manus OAuth, S3 metadata | Editorial public routes, Client conversion routes, protected workspace, Studio, Admin, Personal | Typed tRPC procedures, tenant-scoped repository helpers, versioned schema/migrations, S3-backed assets | **Active implementation source of truth** |
| Preserved Moodoor Studio source | Standalone React source under `moodoor-studio-src/src`; no managed server or schema in its preserved root | Hash-routed brief composer, prompt library/composer, inventory, and settings | Browser-local storage; static `moodoor-inventory.json`; direct browser-side model client | **Reference-only port source; not imported or executed by the managed runtime** |

## Preserved Moodoor Studio audit

The preserved Moodoor `App.tsx` exposes three hash-driven views: a brief generator, prompt library/composer, and inventory. It contains reusable product concepts—brief composition, prompt validation, inventory-aware selection, geometry, placement, and recipe logic—that informed the managed Studio workflow vocabulary.

The legacy implementation intentionally remains outside the governed runtime. It routes with `window.location.hash`, maintains library/configuration and inventory cache state in browser local storage, and uses a viewer-supplied direct model key through a browser-enabled SDK client. Those patterns do not meet the managed platform’s tenant isolation, server-side authorization, audit, secret-handling, S3 metadata, or durable-job requirements.

| Legacy capability | Managed disposition | Required condition before any port |
|---|---|---|
| Brief/composer workflow | Concept incorporated into governed Studio creation/review/delivery flow | Any detailed generator must use an approved server-side integration and typed policy boundary |
| Prompt library/validation | Reference only | Persist as tenant-scoped records with audit and role policy; do not use local storage as the source of truth |
| Inventory canon | Reference-only data artifact | Validate provenance, commercial rights, prices/availability, and tenant/business model before import; no automatic catalog or commerce use |
| Direct model client | Rejected | Never expose an operator key to the browser; use a reviewed server-side integration if separately approved |
| Hash routing and local persistence | Rejected | Use managed application route groups, tRPC, database state, and S3 metadata as appropriate |

## Audit conclusion

The managed project and preserved Moodoor source are both present and now inventoried. The Moodoor directory is retained as an auditable reference artifact; it is not a deployable sub-application, source of tenant truth, production inventory, or provider integration. No legacy code is executed or imported by the managed application.
