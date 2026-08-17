# Evercrafted Canonical Data Dictionary

## Status and rule

This dictionary is the version-controlled source of record for persistent model meaning. It will be updated with every Drizzle schema migration. The current row describes only the initialized scaffold. All listed target entities are pending source audit and architecture approval before a canonical migration is generated.

| Entity | Scope | Purpose | Sensitive fields | Status |
|---|---|---|---|---|
| `users` | Platform | Authenticated identity record synchronized from the configured OAuth flow | Email, open identifier, login metadata | Existing template entity; will be extended only through migration |
| `leads` | Platform | Consent-based marketing interest record submitted from the public site | Email, optional name, stated interest | Implemented in migration `0001_public_leads.sql`; retention and opt-out policy remain required before public release |
| `organizations` | Tenant | Customer/team container for shared work | Organization profile/contact details | Implemented in foundation migration |
| `workspaces` | Tenant/personal | Personal or organization-scoped work container | Workspace configuration | Implemented in foundation migration |
| `workspaceMemberships` / `workspaceInvitations` | Tenant | User-to-workspace role and invitation lifecycle relationships | Invitation email and expiry metadata | Implemented in foundation migration |
| `projects` | Tenant | Shared work and Studio project record | Customer/project content | Implemented in foundation migration |
| `assets` / `assetVersions` | Tenant | Metadata pointers and immutable revision records; file bytes remain in S3 | File name, provenance, metadata | Implemented in foundation migration |
| `workflowEvents` | Tenant | Auditable workflow transition history | User-provided comments | Implemented in foundation migration |
| `reviewRequests` | Tenant | Studio review request and approval/changes decision record | Request and response notes, reviewer/member identifiers | Implemented in `0002_studio_reviews_delivery.sql` |
| `deliveries` | Tenant | Provider-neutral delivery-preparation and publish-status record | Destination type and optional external reference | Implemented in `0002_studio_reviews_delivery.sql`; external publishing adapter remains deferred |
| `notifications` | Tenant/user | In-app and future delivery record | Notification content | Implemented in foundation migration |
| `backgroundJobs` | Tenant/platform | Durable asynchronous job state, idempotency, recovery, retry, and progress record | Payload references; never embedded secrets | Implemented in foundation migration |
| `plans` / `workspaceEntitlements` | Platform/tenant | Commercial access configuration and evaluated capability state | Provider references; no card data | Implemented in foundation migration; provider lifecycle deferred |
| `auditLogs` | Tenant/platform | Security and business-action audit record | Actor/target metadata minimized | Implemented in foundation migration |

## Migration requirements

Each entity requires a Drizzle schema definition, tenant-scope indexes, documented lifecycle and retention behavior, a generated migration, tenant-safe repository functions, fixtures, tests, and any applicable migration-ledger mapping before use.
