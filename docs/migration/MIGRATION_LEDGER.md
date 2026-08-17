# Evercrafted Migration Ledger

## Current status

No legacy data has been inspected, imported, transformed, or modified. No production migration is authorized by this record. The initialized template contains a baseline user model; canonical SaaS entities will be created with versioned Drizzle migrations only after source audit and architecture approval.

| Ledger ID | Source | Target | Transformation | Validation | Rollback/compatibility | Status |
|---|---|---|---|---|---|---|
| EC-MIG-0001 | Template `users` record | Canonical platform user identity | Preserve OAuth identity and extend via additive schema migration where possible | Fresh-install and upgrade migration tests; row-count and uniqueness checks | Document generated migration limitation before apply | `PLANNED` |
| EC-MIG-0005 | Ever Engine foundation | Workspace, membership, invitation, project, asset, workflow, notification, job, entitlement, flag, and audit tables | Additive table creation in `0000_ever_engine_foundation.sql` | Direct schema query confirmed 15 foundation tables | Additive migration; no legacy data transformed | `APPLIED` |
| EC-MIG-0006 | Moodoor Studio review and delivery | `reviewRequests` and `deliveries` | Additive table creation in `0002_studio_reviews_delivery.sql` | Direct schema query confirmed both tables | Additive migration; no legacy data transformed | `APPLIED` |
| EC-MIG-0004 | Public marketing interest form | `leads` | Store normalized email and optional stated interest with duplicate-safe update | Unique-email constraint and public tRPC contract tests pending | Additive table creation; no legacy data affected | `APPLIED: 0001_public_leads.sql` |
| EC-MIG-0002 | Evercrafted Platform source data | Pending audit | Pending source-to-target mapping | Pending | Pending | `BLOCKED: source audit` |
| EC-MIG-0003 | Moodoor Studio source data and assets | Pending audit | Pending source-to-target and S3 reference mapping | Pending | Pending | `BLOCKED: source audit` |

## Mandatory migration evidence

Every migration must record source scope, target tables, transformation code, sensitive-data handling, pre/post counts, integrity checks, exceptions, dry-run evidence, backup/reference point, deployment order, rollback limitation, and Git commit identifier.
