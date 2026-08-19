# Evercrafted Canonical Data Dictionary

> **Verification status:** Verified against `drizzle/schema.ts` and the generated Drizzle artifacts through `0006_secret_ironclad` on 2026-08-19. The migration ledger is the application-history companion to this dictionary.

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
| `memoryEntries` | Tenant/project | Versioned client-provided source memory for Guided Wreath Creation | Private memory body and chosen visibility; never silently repurposed as public content | `0004_certain_blonde_phantom` |
| `essenceProfiles` | Tenant/project | Versioned, client-reviewable interpretation of a memory before Story or material selection | Grounding evidence, unsupported-claim flags, generation source, approval state | `0004_certain_blonde_phantom` |
| `memoryStories` | Tenant/project | Versioned Memory Story and abstract Design Signals linked to an approved Essence source | Story body, grounding evidence, unsupported-claim flags, generation source, approval state; no direct inventory or construction data | `0004_certain_blonde_phantom` |
| `guidedStageStates` | Tenant/project | Current guided Wreath stage and explicit dependency block reason | Stage navigation and block explanation; never a client-side-only authority | `0004_certain_blonde_phantom` |
| `stageApprovals` | Tenant/project | Append-only decision for a particular version of an Essence or Story artifact | Decision note, actor, entity/version relationship | `0004_certain_blonde_phantom` |
| `memoryThreadEvents` | Tenant/project | Expandable source-to-interpretation provenance trail across guided stages | Source type/version, direct-source marker, concise event summary | `0004_certain_blonde_phantom` |
| `memoryConsents` | Tenant/project | Separately revocable consent and visibility setting for memory, story, wreath image, Lookbook, marketing, and anonymous improvement | Consent decision, visibility, decision/revocation time; no implied publishing permission | `0004_certain_blonde_phantom` |
| `botanicalReferenceCatalog` | Platform reference | Curated botanical-family capability catalog for Guided Florals | Family-level capabilities and reference provenance only; no SKU, vendor, stock, quantity, price, reservation, or checkout data | `0005_amusing_tarot` |
| `guidedFloralRoleSets` | Tenant/project | Versioned role-first Floral snapshot bound to approved Essence and Story versions | Abstract source signals and catalog version; keeps selection context traceable | `0005_amusing_tarot` |
| `guidedFloralCandidates` | Tenant/project | Transparent rank-ordered reference-family candidates for each floral role | Match evidence and tension notes; no availability, vendor, SKU, or commercial fact | `0005_amusing_tarot` |
| `guidedWreathTraySelections` | Tenant/project | One persisted customer selection per required role in My Wreath Tray | Selected reference family, actor, and optional rationale; not a recipe, build instruction, or material reservation | `0005_amusing_tarot` |
| `guidedFloralCompatibilityReports` | Tenant/project | Latest explainable completion, warning, and blocking checks for a Floral role snapshot | Compatibility check outcomes only; does not evaluate construction, geometry, or inventory feasibility | `0005_amusing_tarot` |
| `guidedWreathRecipes` | Tenant/project | Immutable versioned snapshot of a passing Tray, tied to one role-set version | Compatibility snapshot, lock actor/time, stale state/reason; no inventory reservation, quantity, material order, or commercial transaction | `0006_secret_ironclad` |
| `guidedWreathRecipeItems` | Tenant/project | Role-preserving snapshot of selected reference families within a locked Recipe | Candidate/catalog references, family/name/rationale snapshot; no SKU, vendor, stock, quantity, price, or substitute | `0006_secret_ironclad` |
| `guidedWreathBlueprints` | Tenant/project | Simplified versioned role hierarchy derived only from a locked Recipe | Hierarchy, derivation notes, source recipe, stale state/reason; no geometry, BOM, construction, render, provider, publication, or delivery instruction | `0006_secret_ironclad` |
| `auditLogs` | Tenant/platform | Append-only security and business-action record | Actor/target metadata minimized | Foundation |
| `leads` | Platform | Consent-based public interest submission | Email, optional name, stated interest | Foundation |

## Data governance rules

Every tenant-bound record must preserve its workspace relationship, and repository procedures must apply tenant/role policy before data access. Files are stored in S3 with metadata only in the database. Payment data, provider credentials, and customer-generated reviews, ratings, testimonials, or endorsements are outside this schema and fixture model.

Each persistent change requires a schema update, generated Drizzle migration, SQL review, managed application, journal/snapshot artifact, ledger entry, repository policy, deterministic test evidence, and this dictionary update. Guided Wreath data adds a stricter rule: a client’s memory is private source material by default; an interpretation or Story must retain its source/approval version; sharing a wreath never implies consent to publish the memory. The Guided Florals catalog is capability reference data, not commercial inventory: a saved tray selection never reserves, prices, orders, substitutes, or exposes material supply. A Recipe lock is an immutable passing-Tray snapshot, while a simplified Blueprint is derived hierarchy only; a selection change marks downstream Recipe/Blueprint records stale rather than overwriting their provenance.
