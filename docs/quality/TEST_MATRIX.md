# Evercrafted Test Matrix

| Requirement area | Primary work IDs | Evidence type | Current status |
|---|---|---|---|
| Governance-document consistency | EC-P01-GOV-001 | File presence, cross-link review, run-log update | `DONE: EC-RUN-0001` |
| Project baseline | EC-P00-INV-001 | Build, type-check, unit test, route/component review | `PARTIAL: scaffold route/component review and visual capture complete; source audit and automated checks pending` |
| Schema contracts and reference artifacts | EC-P02-DB-001, EC-P03-DATA-001 | Drizzle schema export test, migration table verification, seed/fixture review | `IN_PROGRESS: contract test, seed, fixture, and database runbook added; Vitest command evidence pending` |
| Tenant isolation | EC-P03-AUTHZ-001 | Unit and integration negative tests | `NOT_STARTED` |
| Workspace provisioning and roles | EC-P03-IAM-001 | tRPC caller tests and onboarding flow test | `NOT_STARTED` |
| Drizzle schema/migrations | EC-P02-DB-001, EC-P03-DATA-001 | Fresh-install and upgrade migration tests | `NOT_STARTED` |
| Asset access and versioning | EC-P04-STO-001 | Policy/repository tests and storage adapter tests | `NOT_STARTED` |
| Studio review and delivery | EC-P06-UX-001 | End-to-end role/project/asset workflow tests | `NOT_STARTED` |
| Owner-only command controls | EC-P08-ME-001 | Negative authorization and UI routing tests | `NOT_STARTED` |
| Audited support access | EC-P08-ADM-002 | Role, reason, audit-log, and expiry tests | `NOT_STARTED` |
| Hybrid asynchronous processing | EC-P04-JOB-001 through EC-P04-JOB-004 | Durable job state, idempotency, stale-job recovery, cron handler, health telemetry, and provider-boundary tests | `IN_PROGRESS: durable schema and handler implemented; scheduled deployment and recovery test pending` |
| Studio review and delivery isolation | EC-P04-WF-001, EC-P06-UX-001 | Workspace/project/asset boundary tests; assigned-reviewer response test; delivery preparation test | `IN_PROGRESS: typed handlers, database schema, and visual UI evidence complete; automated negative-path tests pending` |
| Asset signed-access policy | EC-P04-STO-001 | Workspace membership check, asset ownership check, signed URL issuance, and audit-record test | `IN_PROGRESS: typed handler implemented; automated authorization test pending` |
| Wix shared-engine contract | EC-3X-011, EC-3X-012, EC-3X-015 | CMS manifest uniqueness and public/tenant separation; Client membership policy artifact; Personal owner-policy artifact | `PASS: 2026-08-19, 4 contract assertions passed within 10 passing Vitest tests` |
| Editorial public routes | EC-PROJECT-005, EC-PROJECT-007 | Dedicated collection detail, journal article, account/sign-in, legal, and editorial 404 route contract | `PASS: 2026-08-19, 2 route/copy assertions passed within 17 passing Vitest tests; desktop and mobile visual review completed` |
| Three-experience navigation boundary | EC-PROJECT-004, EC-PROJECT-006 | Client sidebar and Personal layout source contract; owner data-contract and access-denied state | `PASS: 2026-08-19, 3 navigation/security assertions passed within 17 passing Vitest tests; desktop and mobile visual review completed` |
| Client SaaS sign-in | EC-PROJECT-006, EC-PROJECT-008 | Dedicated `/client/sign-in` route, Client-only access state, OAuth handoff, and route contract | `PASS: 2026-08-19, 2 contract assertions passed within 17 passing Vitest tests; desktop visual review completed` |
| Accessibility and responsive UX | EC-P10-A11Y-001 | Keyboard, semantic, contrast, and screen-size review | `NOT_STARTED` |
