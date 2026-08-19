# Migration Ledger

This ledger records reviewed schema changes, generated Drizzle artifacts, managed-database application evidence, and rollback considerations for the shared Ever Engine.

| Migration | Date | Scope | Review and application evidence | Rollback consideration |
|---|---|---|---|---|
| `0000_flawless_ezekiel` | 2026-08-17 | Canonical Ever Engine baseline | Applied prior to the current increment; provides the multi-tenant workspace, Studio, asset, job, entitlement, audit, and lead foundation. | Baseline is not rolled back independently. Restore a prior checkpoint only after data-impact assessment. |
| `0001_romantic_rocket_raccoon` | 2026-08-19 | Persistent notification delivery preferences | Drizzle generated the versioned artifact. The reviewed incremental SQL creates only `notificationPreferences` with a unique user key and foreign key to `users`; it was applied successfully through the managed database migration execution path. Runtime notification helpers gate assigned-review, project-stage, and provider-handoff job delivery through the persisted in-app preference. | Drop `notificationPreferences` only after confirming no preference data is needed; notification records remain unaffected. |

> The initially generated `0001` file reproduced the historical baseline and was **not** applied. It was corrected to the reviewed incremental table creation above before execution, preventing duplicate-table operations against the active database.
