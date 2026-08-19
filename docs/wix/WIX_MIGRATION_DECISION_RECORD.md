# Wix Migration Decision Record

**Decision ID:** `EC-WIX-002`  
**Date:** 2026-08-19 EDT  
**Status:** Approved planning decision; no Wix implementation mutation authorized by this record  
**Target:** `My Site 6` (`4a20e429-d686-4f4d-8282-13454219024a`)

## Decision

> **The managed Evercrafted application remains the governed source of truth and primary runtime. Wix is a deliberately staged future port target, not an immediate replacement for the multi-tenant engine.**

The port is therefore **capability-by-capability**, not a data or presentation lift-and-shift. Wix-native services may own public editorial presentation, Store commerce, member identity, CMS configuration, and explicitly approved site automations. The managed engine continues to own canonical tenant data, authorization evidence, durable job semantics, subscription/usage enforcement, S3 asset access, typed API contracts, and owner-only administration until an equivalent Wix implementation is deployed and negatively tested.

This decision prevents three unsafe substitutions: treating Store or Member identity as workspace authorization, exposing tenant CMS collections directly to browser code, and treating a Wix Automation as a durable external-work or recovery worker.

## Evidence base and constraints

The live target audit confirms that the 17 collection manifest is present in one complete CMS page and that all collection-level reads and writes are administrator-only. It also confirms the presence of Wix Stores, Members Area, Forms, Invoices, Velo availability, and three active Wix Forms notification automations. The audit does not verify live Velo deployment, member-role enforcement, Harmony editor access, Store payment configuration, or page architecture; those remain delivery gates rather than assumptions.

The decision scope covers every manifest identifier: `evercrafted-organizations`, `evercrafted-workspaces`, `evercrafted-workspace-memberships`, `evercrafted-workspace-invitations`, `evercrafted-projects`, `evercrafted-assets`, `evercrafted-asset-versions`, `evercrafted-review-requests`, `evercrafted-deliveries`, `evercrafted-notifications`, `evercrafted-audit-events`, `evercrafted-background-jobs`, `evercrafted-plans`, `evercrafted-workspace-entitlements`, `evercrafted-feature-flags`, `evercrafted-leads`, and `evercrafted-integration-connections`.

Wix data collections support offset paging and collection-level permissions, while Wix Stores collections are system collections with fixed permissions. Member Management provides a member lifecycle and profile capabilities, but the workspace role model remains an Evercrafted-specific policy to be implemented server-side in Velo. The Wix Secrets API stores encrypted values for backend use and must not be used from frontend code.[1] [2] [3] [4]

| Decision constraint | Governing outcome |
|---|---|
| Three independent experiences are required | Evercrafted public/commerce, Client SaaS, and Personal retain independent route groups, layouts, navigation, and authorization boundaries. |
| No invented user-generated content | No reviews, ratings, testimonials, customer claims, or fabricated catalog facts are introduced during any Wix work. |
| Current Wix live state is a future port target | No visual/page, commerce, member, Velo, CMS, or automation mutation is implied by this decision record. |
| Managed runtime is validated | The React/tRPC/Drizzle application continues as the operational source of truth while Wix capabilities are implemented, verified, and formally cut over. |

## Capability decisions

| Evercrafted engine capability | Current authoritative system | Wix-native mapping | Decision and acceptance gate |
|---|---|---|---|
| Editorial brand pages, collections, journal, contact, legal, and 404 | Managed editorial route group | Wix page system, CMS-backed public content, Forms | **Port when editor access is supported.** Apply the approved warm-stone editorial system only to Evercrafted public routes; remove template promotions and reviews before release. No dynamic page/page-layout mutation occurs until Harmony or an equivalent supported path is verified. |
| Public lead capture | Managed public lead contract and `evercrafted-leads` model | Wix Forms plus restricted `evercrafted-leads` backend/CMS pathway | **Hybrid.** Preserve existing Wix Forms notifications as site behavior. Tag and authorize any future Client SaaS access request separately; do not expose lead records to members or reuse generic form notifications as tenant workflow automation. |
| Store catalog, cart, checkout, customer purchase journey | No live managed commerce provider configured | Wix Stores and Wix eCommerce purchase flow | **Wix-native once business settings are verified.** Store catalog and checkout remain public-commerce concerns. They must not grant Client SaaS workspace membership, Personal access, or SaaS entitlements by inference.[2] [3] |
| Client member identity and sign-in | Manus OAuth in managed runtime | Wix Members Area and Member Management | **Wix-native identity candidate; Velo policy required.** A signed-in Wix Member ID may identify a caller but is not sufficient for workspace access. The backend resolver must verify an active `evercrafted-workspace-memberships` record and a permitted role before every tenant read or mutation.[4] |
| Workspace, organization, membership, invitation, project, asset, review, delivery, notification, audit, job, plan, entitlement, feature-flag, lead, and integration metadata | Managed Drizzle/MySQL canonical data model | Seventeen namespaced `evercrafted-*` Wix CMS collections | **Port schema exists; tenant use deferred.** The live collection baseline is administrator-only. Retain that baseline until Velo-backed member, workspace, role, and owner negative-path tests pass. No direct browser collection query is an acceptable tenant authorization boundary.[1] |
| Reference fields, lookup behavior, indexes, and native slugs | Managed relational schema | Wix CMS metadata and field configuration | **Deferred.** Promote temporary text relationship/slug fields only after the exact Wix metadata request schema and a reversible migration plan are verified. Do not infer field shapes or replace URL strategy prematurely. |
| Client SaaS protected workspace | Managed DashboardLayout, typed tRPC router, and tenant policy | Separate Wix protected page group and `evercraftedDashboard.web.js` backend policy artifact | **Prepared but not deployed.** Deploy only through an available supported Velo-code path, then demonstrate signed-out denial, inactive-member denial, cross-workspace denial, role denial, and authorized member success. |
| Personal command center and restricted administration | Exact `OWNER_OPEN_ID` policy in the managed engine | Separate Wix Personal route group and `evercraftedPersonal.web.js` resolver | **Prepared but not deployed.** Create `EVERCRAFTED_PLATFORM_OWNER_MEMBER_ID` only in Wix Secrets Manager; resolve and compare it in backend code. Workspace ownership alone must be denied. The secret must never be placed in CMS, frontend code, or repository history.[5] |
| Typed API contracts | tRPC procedures and server-side tests | Velo backend web methods and documented service contracts | **Hybrid/deferred.** Treat Velo methods as a separately tested API boundary rather than a copy of tRPC. Each ported method requires caller-derived identity, input validation, role/tenant checks before repository access, audit write for sensitive actions, and negative-path coverage. |
| S3-backed assets and versioned delivery | Managed S3 storage helpers, signed-access policy, and `assetVersions` records | Wix Media reference metadata plus approved external object storage where necessary | **Managed engine remains authoritative.** The CMS may retain a media reference only after Velo authorization. Do not make Wix Media URLs or browser-supplied object references a cross-tenant access mechanism. |
| Durable background jobs, retry recovery, heavy-media handoff, and webhook recovery | Managed durable job ledger, idempotent recovery, service contracts, and telemetry | Wix Automation for event notices; explicit external/provider worker for durable or heavy work | **Split by responsibility.** Wix Automations may handle approved user-facing site events. They do not replace idempotent job claims, dead-letter state, media processing, external webhooks, or scheduled recovery. Existing Forms notifications remain untouched; Evercrafted operational automation is deferred pending an execution-boundary design.[6] |
| In-app notification preferences and delivery | Managed notification records and recipient policy | Wix Automations, Wix email/notification capabilities, CMS notification metadata | **Deferred hybrid.** Do not migrate recipient-specific notification policy until membership resolver, role checks, audit events, and delivery preference evidence are in place. |
| Plans, subscriptions, usage, capabilities, and billing | Managed subscription/entitlement/usage model | Public Wix marketing content; later approved payment/provider integration | **Managed engine remains authoritative.** Wix Store purchase data and SaaS entitlement data are separate domains. No plan, access, payment, or quota claim is ported until legal product language, provider configuration, and server-side entitlement enforcement are approved. |
| Integration configuration and secrets | Managed non-secret control records; no active provider credentials | Wix Secrets Manager plus non-secret status metadata | **Backend-only future mapping.** Store encrypted credentials only in Secrets Manager and reference them from backend code. CMS may hold provider status/external reference but never a secret value.[5] |
| Governance and release evidence | GitHub, Drizzle migrations, test matrix, run log, change register | Repository mirrors of Wix code/configuration/validation plus documented site audit | **Mandatory hybrid control.** Every Wix mutation must be mirrored in repository evidence and require an updated test matrix, run log, change register, todo state, and GitHub synchronization. |

## Sequenced port gates

The port sequence follows governance dependencies, not visual convenience. A gate may begin only when all gate preconditions are satisfied.

| Gate | Required preconditions | Completion evidence | Deferred work kept out of scope |
|---|---|---|---|
| G1 — Foundation preservation | Current live audit; 17 CMS collections retained administrator-only; template frozen | Live audit contract and configuration manifest remain green | Page restyling, direct member data access, live Velo deployment |
| G2 — Data metadata refinement | Verified reference/slug/index request schemas and rollback path | Field-by-field configuration evidence and no-loss review | Production tenant content migration |
| G3 — Identity and policy deployment | Supported Velo code path; platform-owner secret supplied and securely configured | Client/Personal negative paths plus authorized paths; backend audit evidence | Browser-side tenant enforcement or owner inference from workspace role |
| G4 — Protected workspaces | G3 passes; workspace context/role resolver is live | Member-scoped client dashboard, tenant boundary tests, and deliberate error states | Store/checkout grants to SaaS workspaces |
| G5 — Editorial and commerce presentation | Supported editor/page-management access; verified approved content and legal/catalog data | Separate Evercrafted route group, template testimonial removal, accessible public page review, Store flow test | Invented catalog claims, customer proof, or merged Client/Personal navigation |
| G6 — Automations and external execution | Named trigger, owner, data boundary, retry/recovery design, and audit policy | Tested event contract, safe failure path, and external-provider/worker boundary | In-process timers, untracked provider calls, or repurposing Forms notifications as workflow control |
| G7 — Commercial cutover | Approved billing provider, legal plan/access language, server-side entitlement policy | Separate commerce and SaaS entitlement test evidence | Equating a Store order with tenant or Personal authorization |

## Explicit non-decisions

This record does not authorize a data migration, a production cutover, a Wix automation creation, an editor mutation, a Store payment configuration, a member role change, an external integration, a secret creation, or a Velo deployment. It also does not change the current managed application’s routes, database, tRPC contracts, authentication, storage policy, or billing state.

## Required verification before any future cutover

Before any capability changes from `deferred` to `implemented`, its implementation must demonstrate both a permitted path and meaningful negative paths. At minimum, public visitors must not receive tenant data; signed-out and inactive members must not receive client data; a member from another workspace must not receive tenant data; a workspace owner who is not the configured platform owner must not receive Personal data; secret values must not appear in browser code, repository files, or CMS records; and a failed external task must preserve an auditable, recoverable status.

## References

[1]: https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/list-data-collections "Wix Data Collections: List Data Collections"
[2]: https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/introduction "Wix eCommerce API: Introduction"
[3]: https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/wix-app-collections/wix-stores-collections "Wix Stores Collections"
[4]: https://dev.wix.com/docs/api-reference/crm/members-contacts/members/member-management/introduction "Wix Member Management: Introduction"
[5]: https://dev.wix.com/docs/api-reference/business-management/secrets/introduction "Wix Secrets API: Introduction"
[6]: https://dev.wix.com/docs/api-reference/business-management/automations/automations/automations-v2/query-automations "Wix Automations: Query Automations"
