# Evercrafted Database Runbook

## Database-as-code controls

The authoritative schema is `drizzle/schema.ts`. Every schema change requires a generated/reviewed migration in `drizzle/migrations/`, a corresponding record in `DATA_DICTIONARY.md`, a migration-ledger update when existing data is touched, fixture/seed review, test evidence, and synchronized source control documentation.

## Applied foundation

The additive `0000_ever_engine_foundation.sql` migration created the current multi-tenant operational tables. `0001_public_leads.sql` created the public marketing-interest table. Direct database verification confirmed that the expected foundation and lead tables are present. No destructive migration has been applied.

## Environment and recovery rules

Use isolated local/test/staging databases for development. Do not run seed utilities against a production database without an approved change record. Before production schema work, verify backup/recovery posture, review migration ordering, document non-reversible operations, rehearse in staging, and define post-deployment integrity queries. File bytes remain in object storage; the database stores governed metadata and storage keys only.

## Scheduled recovery operations

The durable job-recovery handler is mounted at `/api/scheduled/recover-jobs`. It must be deployed before a managed periodic trigger is created. The handler requires an authenticated cron caller and is idempotent: stale running jobs are requeued if they retain attempts or marked failed if their maximum attempt count is exhausted. Do not use in-process intervals or timers.
