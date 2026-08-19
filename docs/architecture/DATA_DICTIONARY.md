# Evercrafted Canonical Data Dictionary

> **Verification status:** Verified against `drizzle/schema.ts` and the generated Drizzle artifacts through `0003_messy_gambit` on 2026-08-19. The migration ledger is the application-history companion to this dictionary.

| Entity | Scope | Purpose and primary relationship | Sensitive or controlled data | Migration state |
|---|---|---|---|---|
| `users` | Platform | OAuth-synchronized identity; referenced by ownership, membership, audit, notifications, and control review records | Email, open identifier, login metadata | Foundation |
| `organizations` | Tenant | Team container owned by a platform user; may parent organization workspaces | Organization profile data | Foundation |
| `workspaces` | Tenant/personal | Personal or organization work container; canonical boundary for member work | Workspace configuration | Foundation |
| `workspaceMemberships` | Tenant | User-to-workspace role and active/suspended membership relationship | Role and lifecycle state | Foundation |
| `workspaceInvitations` | Tenant | Bounded invitation to a workspace role before active membership | Invitation email, token hash, expiry | Foundation |
| `projects` | Tenant | Work and Studio project within a workspace | Project-provided content | Foundation |
| `assets` | Tenant | S3 metadata pointer linked to workspace/project | File name and provenance; file bytes remain in S3 | Foundation |
| `assetVersions` | Tenant | Immutable governed version record for an asset | Storage key and source metadata | Foundation |
| `workflowEvents` | Tenant | Append-only project/asset transition record | Optional operational note | Foundation |
| `reviewRequests` | Tenant | Workflow approval or changes-request record; not a customer rating or testimonial entity | Request/response notes, assigned identities | Foundation |
| `deliveries` | Tenant | Provider-neutral delivery preparation and publication state | Destination type/reference; no provider credentials | Foundation |
| `notifications` | Tenant/user | Recipient-scoped in-app notification and optional action URL | Notification text | Foundation |
| `notificationPreferences` | User | Persisted in-app and future email delivery preference | Delivery preference only; no provider configuration | `0001_romantic_rocket_raccoon` |
| `backgroundJobs` | Tenant/platform | Durable idempotent job, retry, recovery, and progress state | Payload references; no embedded secrets | Foundation |
| `plans` | Platform | Controlled product/package reference data | No payment data | Foundation |
| `workspaceSubscriptions` | Tenant | Provider-neutral subscription lifecycle associated with a plan | Provider identifier placeholder; no credentials or payment events | `0002_deep_the_phantom` |
| `workspaceUsage` | Tenant | Period-bucketed metric counter for governed operations | Usage quantities only | `0002_deep_the_phantom` |
| `workspaceEntitlements` | Tenant | Evaluated capability and optional usage-limit record | Capability status only | Foundation |
| `featureFlags` | Platform/tenant | Global or workspace-scoped feature switch | Flag description and scope | Foundation |
| `platformIntegrationControls` | Platform | Exact-owner managed non-secret readiness and enablement intent | Review note and reviewer identity; never credentials/tokens | `0003_messy_gambit` |
| `auditLogs` | Tenant/platform | Append-only security and business-action record | Actor/target metadata minimized | Foundation |
| `leads` | Platform | Consent-based public interest submission | Email, optional name, stated interest | Foundation |

## Data governance rules

Every tenant-bound record must preserve its workspace relationship, and repository procedures must apply tenant/role policy before data access. Files are stored in S3 with metadata only in the database. Payment data, provider credentials, and customer-generated reviews, ratings, testimonials, or endorsements are outside this schema and fixture model.

Each persistent change requires a schema update, generated Drizzle migration, SQL review, managed application, journal/snapshot artifact, ledger entry, repository policy, deterministic test evidence, and this dictionary update.
