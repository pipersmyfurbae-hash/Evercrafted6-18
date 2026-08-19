# Canonical Test Fixture Convention

The shared Ever Engine uses **deterministic, non-persisted fixtures** only for contract tests. The fixture graph starts with users, an organization, a workspace, and membership records; every operational record must carry the same workspace identifier. These fixtures are not database seeds and must never run against production or managed tenant data.

| Fixture category | Permitted purpose | Prohibited content |
|---|---|---|
| Identity and tenancy | Role, membership, invitation, workspace, and organization policy tests | Real identities, email addresses, access tokens, or customer data |
| Operations | Project, asset, job, plan, entitlement, and integration-state contract tests | Provider credentials, payment data, real storage locations, or webhook payloads |
| Content safety | Structural product and workflow state | Customer reviews, ratings, testimonials, endorsements, or simulated user-generated feedback |

`drizzle/seeds/seedPlans.ts` remains a separate controlled reference-data seed for development or staging. Every schema change follows the versioned Drizzle flow: update `schema.ts`, generate the migration, review SQL, apply only the reviewed migration through the managed database path, record the result in `MIGRATION_LEDGER.md`, and retain the generated journal and snapshot artifacts. `migration.artifact.contract.test.ts` verifies that relationship continuously.
