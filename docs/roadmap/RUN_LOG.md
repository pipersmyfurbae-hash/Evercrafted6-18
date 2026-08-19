# Evercrafted Execution Run Log

## Run EC-RUN-0001 — Governance initialization and project foundation

**Date:** 2026-08-17 EDT  
**Status:** `IN_PROGRESS`  
**Work items:** `EC-P01-GOV-001`, `EC-P00-INV-001`  
**Objective:** Initialize the full-stack project, establish mandatory governance artifacts, create the code-verifiable delivery checklist, and begin the project/source baseline audit.

| Field | Current record |
|---|---|
| Project foundation | Full-stack React, Express, tRPC, Drizzle, MySQL/TiDB, Manus OAuth, and S3 helper scaffold initialized |
| Planned artifacts | Governance records, domain/data records, risk/dependency records, test/release records, and execution checklist |
| Source audit state | Project scaffold audit is complete; connected GitHub source has not yet been mirrored into the project workspace, so legacy source capability mapping is blocked |
| Database state | Template has `drizzle/schema.ts`, `drizzle.config.ts`, an initial `users` schema, and an empty migration directory; canonical tenant schema has not been created |
| API state | `server/routers.ts` exposes `system` plus typed `auth.me` and `auth.logout`; `protectedProcedure` and `adminProcedure` are available in the tRPC core |
| UI state | `client/src/App.tsx` only registers the public home and 404 routes; a reusable authenticated `DashboardLayout` component exists but contains placeholder navigation |
| Tests executed | Template health reports no current TypeScript/LSP errors; baseline public-page visual capture completed; automated build/type/test execution remains pending |
| Documentation state | Governance record suite initialized in this run |
| GitHub state | Pending repository working-copy synchronization and validation; no unverified push is claimed |
| Known blocker | Full source-program file audit requires the selected GitHub repository working copy to be available in the project workspace |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Created | `todo.md` | Code-verifiable feature and governance checklist |
| Created | `docs/roadmap/MASTER_ROADMAP.md` | Active phase and work-item status |
| Created | `docs/roadmap/RUN_LOG.md` | Immutable run history |
| Created | `docs/roadmap/CHANGE_REGISTER.md` | Source-controlled scope-change record |
| Created | `docs/architecture/CAPABILITY_MATRIX.md` | Capability and migration disposition mapping |
| Created | `docs/architecture/DATA_DICTIONARY.md` | Canonical persistence record |
| Created | `docs/migration/MIGRATION_LEDGER.md` | Legacy/source migration tracking |
| Created | `docs/security/RISK_REGISTER.md` | Initial risk record |
| Created | `docs/operations/DEPENDENCY_REGISTER.md` | Integration and provider inventory |
| Created | `docs/quality/TEST_MATRIX.md` | Requirement-to-evidence matrix |
| Created | `docs/releases/RELEASE_CHECKLIST.md` | Release readiness controls |
| Created | `docs/adr/ADR-0001-hybrid-asynchronous-processing.md` | User-approved durable-job and heavy-media processing decision |
| Updated | `drizzle/schema.ts` | Canonical foundation model plus public lead record |
| Created | `drizzle/migrations/0000_ever_engine_foundation.sql` | Versioned additive Ever Engine foundation migration |
| Created | `drizzle/migrations/0001_public_leads.sql` | Versioned additive public lead-capture migration |
| Updated | `server/db.ts` | Tenant-scoped workspace, project, asset, invitation, notification, audit, lead, and job repository operations |
| Updated | `server/routers.ts` | Typed workspace, project, asset, Studio, notification, job, support, and lead contracts |
| Created | `server/jobs.ts` | Durable job recovery and provider-neutral heavy-media boundary |
| Updated | `server/_core/index.ts` | Authenticated scheduled job recovery endpoint |
| Updated | `client/src/App.tsx` | Public, workspace, Studio, notification, settings, personal, and administration routes |
| Created/updated | `client/src/pages/` | Branded public and authenticated product surfaces |
| Updated | `client/src/components/DashboardLayout.tsx` | Context-safe product navigation |
| Created | `docs/wix/WIX_NATIVE_BLUEPRINT.md` | Selected template layout, hybrid editorial direction, Wix-native build sequence, CMS model, member dashboard architecture, and configuration evidence |

### Verified scaffold audit findings

| Area | Verified finding | Impact on delivery |
|---|---|---|
| Web/API stack | React client, Express server, tRPC API, Drizzle/MySQL configuration, and Manus OAuth are initialized | The requested typed API and versioned schema requirements can be implemented natively without a framework change |
| Identity | The starter user model supports `user` and `admin`; protected and administrator middleware are present | Workspace-scoped roles, personal provisioning, owner-only policy, and support auditing must be added as a shared extension, not as UI-only checks |
| Persistence | The starter schema contains only `users`; no business schema migrations have been generated | Canonical tenant entities and the complete database-as-code suite are the next technical foundation slice |
| Storage/jobs | Server helper files for storage and notifications, plus a heartbeat framework file, are present | Tenant policy and reliable job records/orchestration require dedicated design and implementation before use |
| UI | The public home is a placeholder and the reusable dashboard shell has placeholder routes | Public marketing, onboarding, workspace, Studio, personal, and administration experiences must be built from the requested product model |
| Source-program audit | Legacy files are not present in this working project | The capability matrix must remain provisional; no legacy feature will be declared migrated until its source is directly inspected |

### Implemented increment evidence

| Area | Evidence | Result |
|---|---|---|
| Database foundation | Applied migrations and direct schema verification query | Fifteen Ever Engine tables plus the public `leads` table are present in the managed database |
| Typed API | Development server type check after workspace, Studio, asset, invitation, job, lead, support, and owner routes | No TypeScript or LSP errors after restart |
| Public surface | Root-route visual review | Branded marketing, sign-in, product positioning, pricing intent, and lead-capture form render successfully |
| Authenticated surface | Visual review of `/app`, `/projects`, `/studio`, `/me`, and `/admin` | Personal workspace provisioning, project state, Studio shell, owner access view, and admin surface render in the authenticated preview |
| Hybrid jobs | ADR-0001 plus `/api/scheduled/recover-jobs` implementation | Durable record and recovery handler are implemented; production scheduling waits for checkpoint and publish |
| Studio review/delivery | Applied `0002_studio_reviews_delivery.sql`, database query, typed router, and Studio UI review | `reviewRequests` and `deliveries` tables verified; review, response, delivery-preparation, and auditable workflow controls render in Studio |
| Workspace journeys | Typed router and visual route review | Public product/pricing, personal provisioning entry, invitation acceptance, workspace switcher, search, project detail, notifications, and settings render with explicit empty/error states |
| Restricted controls | Visual review of `/admin` and `/me` | Admin policy surface shows tenant, plan, entitlement, flag, queue-health, and support-audit controls; owner surface shows auditable cross-workspace overview |
| Asset access | Typed asset download mutation | Workspace authorization is checked before a signed object-store URL is issued and an audit event is written |
| Wix isolated site | Authorized template creation | New Wix site `4a20e429-d686-4f4d-8282-13454219024a` was created from the selected Home Goods Store template; Wix Stores V3, Members Area, Forms, Invoices, and Velo are present |
| Wix CMS foundation | Direct Wix CMS API collection creation | All 17 Evercrafted collection definitions returned HTTP 200 with their expected collection identifiers and administrator-only baseline permissions |
| Wix CMS refinement | Verified Wix field-update API | 23 of 26 production field-type refinements succeeded; the three slug fields remain text pending required Wix slug metadata; no collection records exist |
| Wix collection audit | Verified Wix collection listing API | Exactly 17 expected Evercrafted collections are present; each has administrator-only insert/read/update/remove permissions and no unexpected custom collections were returned |
| Velo dashboard contract | Repository Velo source using verified Wix SDK patterns | Tenant-scoped dashboard service contract added; deployment and end-to-end role verification remain pending because editor code controls are not exposed |
| Wix relationship refinement | API-spec request | Deferred without mutation after a temporary Wix connector timeout prevented verification of reference-field metadata |
| Three-experience correction | User-approved architecture revision | Replaced the prior merged public/member model with separate Evercrafted, Client SaaS, and Personal route/layout/dashboard plans sharing one governed engine; no template visual edit has been applied |
| Client SaaS public layer | User-approved scope clarification | Added a standalone public SaaS conversion group—landing, How It Works, capabilities, outcomes, pricing/access, and sign-in—separate from both Evercrafted commerce and protected workspace routes |
| Three-experience visual system | Architecture and design artifact | Defined independent Evercrafted editorial/commerce, Client SaaS public/workspace, and Personal command visual systems; source-template colors, typography, and merged layout are excluded |
| Harmony editor access | User-reported session error plus sandbox loading-canvas evidence | Live visual editing is blocked; source template is frozen and no visual page mutation is claimed |
| Personal owner policy | Repository Velo source plus syntax-only check | Separate server-side Personal resolver created; requires a Wix backend secret and deployment before it becomes live |
| Three-experience page-ready content | Repository copy and dashboard specifications | Prepared separated Evercrafted editorial/commerce copy, Client SaaS public conversion copy, and Personal command specification; no template content or testimonials were altered in Wix |
| Project-first visual verification | Desktop render review of `/`, `/client`, `/app`, and `/personal` | Evercrafted editorial public, Client SaaS conversion, Client workspace, and Personal command render as separate layouts; Personal no longer inherits the Client workspace navigation |
| Project-first test run | `pnpm test` | All 4 Vitest files and 10 tests passed, including restored Wix shared-engine contract assertions for CMS, Client policy, and Personal policy artifacts |

## Run EC-RUN-0002 — Project-first editorial routes and experience-boundary validation

**Date:** 2026-08-19 EDT  
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`  
**Work items:** `EC-3X-015`, `EC-PROJECT-004`, `EC-PROJECT-005`, `EC-PROJECT-006`, `EC-PROJECT-007`  
**Objective:** Restore missing Wix policy-reference coverage, finish the project-first editorial route set, and prove that Client workspace and Personal command navigation remain distinct.

| Area | Evidence | Result |
|---|---|---|
| Wix engine contract | `server/test/wix.engine.contract.test.ts` and `pnpm test` | CMS strategy/security, 17 unique collection IDs, public-lead isolation, and distinct Client/Personal Velo artifacts are covered by 4 passing assertions. |
| Editorial public routes | `EvercraftedPages.tsx`, `NotFound.tsx`, `App.tsx`, route contract test | Added dedicated collection detail, journal article, account/sign-in, privacy, terms, and editorial 404 states without user-generated claims or unverified catalogue availability. |
| Experience boundary | `DashboardLayout.tsx`, `PersonalLayout.tsx`, navigation contract test | Client sidebar no longer exposes Personal; Personal layout no longer exposes a Client workspace return; Personal continues using owner-only tRPC access and explicit denied-state copy. |
| Automated validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 6 Vitest files / 15 tests, TypeScript check, and production build. Build produced a non-blocking client-chunk-size advisory. |
| Visual validation | Desktop at 1280×720 and mobile at 375×812 | Editorial detail/account/legal/404, Client conversion, Client shell loading, and Personal command capture as intended with distinct visual systems. |
| Client sign-in gap closure | Dedicated `/client/sign-in`, route contract, desktop capture, and full validation rerun | Client sign-in state now provides separate access-copy and OAuth handoff; final validation passes at 7 Vitest files / 17 tests, TypeScript check, and production build. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Created | `server/test/wix.engine.contract.test.ts` | Regression coverage for Wix shared-engine manifest and policy reference artifacts. |
| Created | `server/editorial.routes.contract.test.ts` | Route and no-fabricated-claims contract for editorial public pages. |
| Created | `server/experience.navigation.contract.test.ts` | Client/Personal navigation and Personal data-contract boundary coverage. |
| Updated | `client/src/App.tsx` | Registers account, sign-in, legal, collection-detail, and journal-article routes. |
| Updated | `client/src/pages/EvercraftedPages.tsx` | Implements dedicated editorial public-page states and approved content safeguards. |
| Updated | `client/src/pages/NotFound.tsx` | Replaces generic dashboard 404 with Evercrafted editorial 404. |
| Updated | `client/src/components/DashboardLayout.tsx` | Removes Personal from Client workspace navigation. |
| Updated | `client/src/components/PersonalLayout.tsx` | Removes Client workspace navigation from Personal command. |
| Updated | `client/src/pages/ClientLanding.tsx` | Adds a Client-only `/client/sign-in` access state with protected-access guidance and OAuth handoff. |
| Created | `server/client.signin.routes.contract.test.ts` | Confirms dedicated Client sign-in registration and separation from the editorial account path. |

### GitHub synchronization

The reconciled source history and validated unified-platform increment were pushed to `pipersmyfurbae-hash/Evercrafted6-18` on `main` successfully. The synchronization commit is `936da2a` (`chore: reconcile existing Evercrafted source history`); it includes platform commit `ae3c539` (`feat: establish three-experience Evercrafted platform`) and preserves the pre-existing Evercrafted design records and `moodoor-studio-src` history.

## Run EC-RUN-0003 — Protected-workspace router policy coverage

**Date:** 2026-08-19 EDT  
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`  
**Work items:** `EC-P10-TEST-001`, `EC-P03-IAM-001`, `EC-P03-AUTHZ-001`, `EC-P05-PROFILE-001`  
**Objective:** Add deterministic typed-router evidence for the protected workspace without adding test data to the production database.

| Area | Evidence | Result |
|---|---|---|
| Personal workspace provisioning | `server/workspace.router.policy.test.ts` | `workspace.bootstrap` calls personal-workspace provisioning before returning the caller’s workspace list. |
| Role policy | Typed `workspace.canManage` calls | A member is allowed to manage; a viewer receives `FORBIDDEN`. |
| Tenant isolation | Typed `project.list` negative path | A caller with no workspace membership receives `FORBIDDEN` before the project-list repository helper is invoked. |
| Profile audit | Typed `profile.update` call | Profile update passes caller identity to the repository helper and emits the expected audit event. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 8 Vitest files / 21 tests, TypeScript check, and production build. The existing non-blocking client-chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Created | `server/workspace.router.policy.test.ts` | Deterministic tRPC-caller policy coverage using mocked repository seams; no production database fixtures. |
| Updated | `docs/quality/TEST_MATRIX.md` | Records router-level provisioning, tenant-isolation, role-policy, and profile-audit evidence. |
| Updated | `docs/roadmap/CHANGE_REGISTER.md` | Records the authorization-test coverage increment. |
| Updated | `todo.md` | Marks EC-P10-TEST-001 complete based on the requested coverage categories. |

### GitHub synchronization

The protected-workspace test increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `b886c29` (`test: cover protected workspace router policies`).

## Run EC-RUN-0004 — Authenticated profile-management completion

**Date:** 2026-08-19 EDT  
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`  
**Work items:** `EC-P05-PROFILE-001`, `EC-P05-APP-001`  
**Objective:** Complete the Client workspace profile-management form with explicit operational states, typed persistence, and identity-cache refresh.

| Area | Evidence | Result |
|---|---|---|
| Loading and recovery | `client/src/pages/Profile.tsx` | Profile loading state and profile-query retry control are explicit. |
| Form behavior | `client/src/pages/Profile.tsx` | Name and optional email validation, pending submit state, mutation error state, and success announcement are explicit and keyboard-submittable. |
| Identity coherence | Typed profile mutation plus `utils.auth.me.invalidate()` | The signed-in identity cache is invalidated after a successful profile update; server writes a profile audit record. |
| Regression coverage | `server/profile.page.contract.test.ts` and existing profile router test | UI-state contract and typed update/audit behavior are covered. |
| Browser review | Anonymous `/profile` preview | Protected route resolves to the existing Client sign-in state without exposing profile information. Authenticated form state is covered by the component contract and typed mutation test. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 9 Vitest files / 23 tests, TypeScript check, and production build. The existing non-blocking client-chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Updated | `client/src/pages/Profile.tsx` | Accessible profile form with loading, retry, validation, pending, error, and success states. |
| Created | `server/profile.page.contract.test.ts` | Regression checks for profile UX states and identity-cache invalidation. |
| Updated | `docs/quality/TEST_MATRIX.md` | Records profile-management evidence. |
| Updated | `todo.md` | Marks completed profile and Client workspace shell work. |

### GitHub synchronization

The profile-management increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `63d07f4` (`feat: complete profile management states`).

## Run EC-RUN-0005 — Shared accessibility foundation

**Date:** 2026-08-19 EDT  
**Status:** `VALIDATED FOUNDATION — FULL JOURNEY AUDIT IN PROGRESS`  
**Work item:** `EC-P10-A11Y-001`  
**Objective:** Add a consistent keyboard-navigation foundation without overstating completion of the full accessibility program.

| Area | Evidence | Result |
|---|---|---|
| Keyboard navigation | Reusable `SkipLink` component and `main-content` targets | Editorial home, editorial detail pages, Client conversion, Client workspace, and Personal command expose a skip-to-content route. |
| Visible focus | Global `:focus-visible` token | Keyboard focus receives a consistent ring and offset across semantic links and controls. |
| Regression test | `server/accessibility.contract.test.ts` | 2 assertions verify the shared skip mechanism, visible focus treatment, and target wiring. |
| Visual review | Desktop captures of `/`, `/client`, and `/personal` | Accessibility additions do not disrupt the distinct visual systems. |
| Validation | `pnpm check`, `pnpm test`, `pnpm build` | Passed: 10 Vitest files / 25 tests, TypeScript check, and production build. The existing non-blocking client-chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Created | `client/src/components/SkipLink.tsx` | Shared keyboard skip-navigation control. |
| Created | `server/accessibility.contract.test.ts` | Regression coverage for implemented accessibility wiring. |
| Updated | `client/src/index.css` | Defines a visible global keyboard focus treatment. |
| Updated | `client/src/pages/Home.tsx`, `client/src/pages/ClientLanding.tsx`, `client/src/pages/EvercraftedPages.tsx` | Adds skip-link and semantic main target to public surfaces. |
| Updated | `client/src/components/DashboardLayout.tsx`, `client/src/components/PersonalLayout.tsx` | Adds skip-link and semantic main target to protected surfaces. |

### GitHub synchronization

The shared accessibility foundation was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `650ac6a` (`feat: add shared accessibility foundation`).

## Run EC-RUN-0006 — Provider-neutral Studio publishing handoff

**Date:** 2026-08-19 EDT  
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`  
**Work items:** `EC-P06-PUB-001`, `EC-P06-UX-001`  
**Objective:** Introduce a governed publishing handoff without enabling an external provider.

| Area | Evidence | Result |
|---|---|---|
| Durable handoff record | `queueDeliveryPublishingHandoff` in `server/db.ts` | A ready delivery creates or reuses an idempotent `studio.provider_handoff` background job keyed by delivery. |
| Auditability | Shared audit-log write | Queuing records `studio.delivery.publish_handoff.queued` with an explicit `unconfigured` provider marker. |
| Authorization | Typed Studio tRPC mutation and role test | Only workspace-management roles can queue a delivery handoff; a viewer receives `FORBIDDEN` before the handoff repository helper is invoked. |
| Studio controls | `StudioPublishingHandoff.tsx` | Ready deliveries show a queue action, job confirmation, no-provider notice, and mutation error state. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 11 Vitest files / 27 tests, TypeScript check, and production build. Studio preview reached the protected-shell loading state; the role and workflow behavior are covered by deterministic typed-router tests. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Created | `client/src/components/StudioPublishingHandoff.tsx` | Client-visible durable-handoff control with explicit provider-neutral status. |
| Created | `server/studio.publishing.router.test.ts` | Member success and viewer-denial typed-router coverage. |
| Updated | `server/db.ts`, `server/routers.ts` | Idempotent job creation, audit write, and role-protected typed mutation. |
| Updated | `client/src/pages/Studio.tsx` | Adds the handoff control to the selected Studio project. |
| Updated | `todo.md` | Marks provider-neutral Studio publishing and the completed Studio shell flow. |

### Studio creation gap closure

The Studio shell now includes a workspace-scoped creation card that calls the typed `project.create` procedure and selects the new project on success. `server/studio.creation.page.contract.test.ts` verifies the typed mutation, pending/error states, and Studio entry point. The combined Studio increment now passes 12 Vitest files / 29 tests, TypeScript check, and production build.

### Studio recovery-state closure

The Studio shell now aggregates error/retry controls for workspace, project, member, asset, review, and delivery queries, plus explicit error/success feedback for stage transitions, review request/response, delivery creation, and delivery readiness. `server/studio.feedback.contract.test.ts` covers the expected UI wiring. The complete Studio increment now passes 13 Vitest files / 31 tests, TypeScript check, and production build.

### GitHub synchronization

The completed Studio workflow increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `03680b6` (`feat: complete Studio workflow handoff`).

## Run EC-RUN-0007 — Tenant-scoped asset versioning and Studio history

**Date:** 2026-08-19 EDT  
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`  
**Work items:** `EC-P04-STO-001`, `EC-P04-STO-002`  
**Objective:** Add governed asset re-upload and version-history evidence without bypassing workspace authorization or S3 metadata controls.

| Area | Evidence | Result |
|---|---|---|
| Version persistence | `createAssetVersion` and `assetVersions` unique constraint | New asset version rows are append-only, numbered per asset, and preserve the prior history while updating the current asset storage key. |
| S3 boundary | Typed `asset.uploadVersionBase64` procedure | File bytes pass through the existing storage adapter; the database stores only the resulting S3 key and current-object metadata. |
| Tenant authorization | Typed router policy test | A member can create an asset version only in their workspace; a viewer is rejected before the storage adapter is called. |
| Studio evidence | `StudioAssetVersionHistory.tsx` | Users can select a project asset, upload a revision, and see ordered version records with a current-version indicator. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 14 Vitest files / 33 tests, TypeScript check, and production build. The existing non-blocking client-chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Created | `client/src/components/StudioAssetVersionHistory.tsx` | Tenant-scoped Studio re-upload and version-history interface. |
| Created | `server/asset.version.router.test.ts` | Management-role success and viewer-denial storage policy coverage. |
| Updated | `server/db.ts`, `server/routers.ts` | Asset-version persistence, ordered history query, and typed S3-backed re-upload route. |
| Updated | `client/src/pages/Studio.tsx` | Adds the asset-history component within selected Studio projects. |
| Updated | `todo.md` | Marks governed versioning and Studio history complete. |

### Current-version badge closure

The tenant-scoped asset list now derives `currentVersionNumber` from ordered append-only version records, and the Studio asset card renders `v{asset.currentVersionNumber}` instead of a hardcoded revision. `server/asset.version.ui.contract.test.ts` verifies both the derivation and rendered dynamic value. The final asset increment passes 15 Vitest files / 35 tests, TypeScript check, and production build.

### GitHub synchronization

The governed asset-versioning increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `4cf89f8` (`feat: add governed asset version history`).

## Run EC-RUN-0008 — Studio reviewer assignment visibility

**Date:** 2026-08-19 EDT  
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`  
**Work items:** `EC-P04-WF-001`, `EC-P04-WF-002`  
**Objective:** Complete reviewer/member assignment visibility within the shared Studio workflow.

| Area | Evidence | Result |
|---|---|---|
| Reviewer selection | Existing typed `studio.requestReview` procedure and workspace-member selector | A review request can be assigned to a selected active member or left open to eligible workspace members. |
| Assignment state | `StudioReviewerAssignments.tsx` | The Studio workflow explicitly displays each request’s assigned member or open assignment state and current resolution status. |
| Policy continuity | Existing review-response handler | Assigned-reviewer restriction remains enforced in the typed workflow procedure. |
| Regression coverage | `server/studio.assignment.ui.contract.test.ts` | Verifies the Studio entry point, persisted reviewer field, and visible assigned/open-state copy. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 16 Vitest files / 36 tests, TypeScript check, and production build. The existing non-blocking client-chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Created | `client/src/components/StudioReviewerAssignments.tsx` | Clear assignee/open-state summary for Studio review records. |
| Created | `server/studio.assignment.ui.contract.test.ts` | Assignment-state regression evidence. |
| Updated | `client/src/pages/Studio.tsx` | Renders the reviewer-assignment summary alongside the selected project workflow. |
| Updated | `todo.md` | Marks shared workflow assignment and Studio assignment UI complete. |

### GitHub synchronization

The Studio reviewer-assignment increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `66a2859` (`feat: surface Studio reviewer assignments`).

## Run EC-RUN-0009 — Scheduled-recovery deployment-control closure

**Date:** 2026-08-19 EDT  
**Status:** `VALIDATED — NO HEARTBEAT TASK CREATED`  
**Work items:** `EC-P04-JOB-003`, `EC-PROJECT-012`  
**Objective:** Record the deployment prerequisite and intentional cadence decision after completing idempotent queued/retryable job claims.

| Control | Decision and evidence |
|---|---|
| Handler deployment prerequisite | Save and publish a checkpoint containing this handler before creating a Heartbeat task. The platform schedule must only call the published `/api/scheduled/recover-jobs` endpoint. |
| Cadence decision | No project-level Heartbeat schedule is configured. A recovery cadence is intentionally deferred until it is approved, rather than creating recurring execution speculatively. |
| Durable execution boundary | Recovery authenticates cron callers, requeues stale retryable jobs, fails exhausted jobs, and claims queued jobs with a status-and-attempt compare-and-swap. It does not execute a heavy-media provider or start an in-process timer. |
| Regression evidence | `server/scheduled.recovery.contract.test.ts` verifies the route, cron-only auth, recovery/claim wiring, no-timer/provider boundary, and explicit deployment/cadence record. |

| Repeated-run state evidence | `server/job.recovery.transition.test.ts` | A queued job transitions to running exactly once; a second recovery pass sees the running state and does not claim it again. A recovered queued job advances once more, while an exhausted queued job deterministically fails. |
| Final validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 19 Vitest files / 42 tests, TypeScript check, and production build. The existing non-blocking client-chunk-size advisory remains. |

### GitHub synchronization

The hardened scheduled-recovery increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `e619fe5` (`feat: harden scheduled job recovery claims`).

## Run EC-RUN-0010 — Persistent notification preferences and workflow delivery

**Date:** 2026-08-19 EDT
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`
**Work items:** `EC-P04-NOT-001`, `EC-PROJECT-013`, `EC-P02-DB-002`
**Objective:** Move notification delivery from a hardcoded status response to a schema-backed, recipient-scoped in-app foundation.

| Area | Evidence | Result |
|---|---|---|
| Persisted preferences | `notificationPreferences` schema and `0001_romantic_rocket_raccoon.sql` | Each user has persisted `inAppEnabled` and `emailEnabled` flags; in-app is the active delivery path and email remains an explicit future-provider setting. |
| Migration safety | Reviewed SQL and managed database execution | The first generated full-baseline draft was not applied. The committed migration was corrected to incremental preference-table creation and then applied successfully. |
| Workflow records | `createNotification` and `notifyWorkspaceMembers` | Assigned reviews notify the selected recipient; project stage changes notify active workspace members other than the initiating actor, respecting persisted in-app preference state. |
| Background-job record | `queueDeliveryPublishingHandoff` | The provider-neutral publishing-handoff job notifies only the authorized initiating workspace member through the same persisted preference gate; no external provider is invoked. |
| Runtime handoff policy | `server/notification.delivery.policy.test.ts` | The job event returns a candidate only for its authorized initiator when persisted in-app delivery is enabled, and returns no candidate when that preference is disabled. |
| Recipient policy | `server/notification.policy.test.ts` | Deterministically excludes the actor, deduplicates recipients, and gates in-app delivery on persisted preferences. |
| Protected UX | `Notifications.tsx` | Shows persisted delivery state, loading/retry/error/empty handling, read action, and internal action navigation. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 22 Vitest files / 49 tests, TypeScript check, and production build. The existing non-blocking client-chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Created | `drizzle/0001_romantic_rocket_raccoon.sql` | Reviewed incremental schema migration for persisted notification preferences. |
| Created | `server/notification.policy.test.ts` | Deterministic recipient-scoping and persisted-preference tests. |
| Updated | `drizzle/schema.ts`, `server/db.ts`, `server/routers.ts` | Preference persistence, typed preference API, recipient-scoped delivery gates, and project-stage fanout. |
| Updated | `client/src/pages/Notifications.tsx` | Persisted delivery-state display and recoverable notification UI. |
| Created | `docs/roadmap/MIGRATION_LEDGER.md` | Versioned migration application and review evidence. |

### GitHub synchronization

The persisted notification-delivery increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `626a9af` (`feat: persist workspace notification delivery`).

## Run EC-RUN-0011 — Durable job telemetry and provider-neutral escalation

**Date:** 2026-08-19 EDT
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`
**Work items:** `EC-P04-JOB-004`, `EC-PROJECT-015`
**Objective:** Provide measured queue health evidence so future always-on worker adoption can be based on observable durable-job demand rather than a redesign.

| Telemetry | Evidence and result |
|---|---|
| Queue latency | Calculates age of the oldest queued durable job in milliseconds. |
| Retry and dead-letter health | Counts queued/running jobs with prior attempts and failed jobs that exhausted their allowed attempts. |
| Heavy-media escalation | Classifies generic `media.*`, asset render/transcode/video-processing, and Studio provider-handoff jobs; queues older than 15 minutes or failed jobs are exposed as owner-visible escalation candidates. |
| Access boundary | Metrics appear only in the owner-only Personal command. No client workspace navigation, provider configuration, or heavy-media execution was added. |
| Regression evidence | `server/job.health.telemetry.test.ts` uses deterministic timestamps to prove queue latency, retry/dead-letter counts, provider-handoff escalation, and broader heavy-media escalation. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` passed: 23 Vitest files / 50 tests, TypeScript check, and production build. The existing non-blocking client-chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Updated | `server/db.ts` | Durable-job telemetry aggregate and provider-neutral heavy-media classification. |
| Updated | `client/src/pages/Personal.tsx` | Owner-only queue retry, dead-letter, and heavy-media attention indicators. |
| Created | `server/job.health.telemetry.test.ts` | Deterministic telemetry regression coverage. |
| Updated | `todo.md` | Marks measured job telemetry and generic heavy-media escalation complete. |

### GitHub synchronization

The durable-job telemetry increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `b5894aa` (`feat: add durable job telemetry`).

## Run EC-RUN-0012 — Persisted workspace capability enforcement

**Date:** 2026-08-19 EDT
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`
**Work items:** `EC-P07-ENT-001`, `EC-PROJECT-016`
**Objective:** Convert persisted workspace entitlement records from administrative metadata into enforced protected-operation controls while retaining the current default policy for unlisted capabilities.

| Area | Evidence | Result |
|---|---|---|
| Capability resolution | `isWorkspaceCapabilityEnabled` and `requireWorkspaceCapability` | An explicit record controls the named capability; unlisted capability names follow the documented current default policy. |
| Protected enforcement | Typed project, asset, and Studio router mutations | Management role is necessary but not sufficient when a capability is explicitly disabled. Project creation, asset upload/versioning, review, delivery, and provider-neutral handoff are gated before side effects. |
| Client visibility | Protected `workspace.entitlements` query and Settings card | Workspace members can inspect enabled/disabled records, but entitlement administration remains restricted to the existing administrator controls. |
| Regression evidence | `server/entitlement.policy.test.ts` | Proves explicit `project.create` disablement returns `FORBIDDEN` before project creation and confirms an unlisted capability follows the default policy. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 24 Vitest files / 52 tests, TypeScript check, and production build. The existing non-blocking client-chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Updated | `server/db.ts`, `server/routers.ts` | Persisted capability resolution, protected capability gate, and client-safe entitlement query. |
| Updated | `client/src/pages/Settings.tsx` | Client workspace capability visibility. |
| Created | `server/entitlement.policy.test.ts` | Typed-router enforcement regression coverage. |
| Updated | `todo.md` | Tracks the completed enforcement milestone separately from remaining plan/subscription/usage work. |

### GitHub synchronization

The entitlement-enforcement increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `de981de` (`feat: enforce workspace entitlements`).

## Run EC-RUN-0013 — Owner-only Personal projects and integration readiness

**Date:** 2026-08-19 EDT
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`
**Work items:** `EC-P08-ME-001`, `EC-PROJECT-017`
**Objective:** Extend the private Personal command without merging Client workspace data or enabling unapproved external integrations.

| Area | Evidence | Result |
|---|---|---|
| Owner policy | `ownerProcedure` and typed Personal overview contract | The command remains available only to the exact configured platform owner. |
| Private projects | Personal-workspace bootstrap plus scoped project listing | The owner sees projects from only their personal workspace, distinct from platform-wide activity and client membership surfaces. |
| Integration readiness | Returned non-secret readiness descriptors | Publishing provider and external email remain explicitly unconfigured; cron-authenticated job recovery is ready but cadence remains deferred. No credentials or provider operations are exposed. |
| Regression evidence | `server/personal.command.contract.test.ts` | Verifies personal-workspace project retrieval and provider-neutral readiness state through the owner-only tRPC caller. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 25 Vitest files / 53 tests, TypeScript check, and production build. The existing non-blocking client-chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Updated | `server/routers.ts` | Owner-only Personal overview adds scoped private projects and integration readiness. |
| Updated | `client/src/pages/Personal.tsx` | Renders private projects and integration readiness in the separate Personal layout. |
| Created | `server/personal.command.contract.test.ts` | Owner-policy regression coverage for new Personal overview data. |
| Updated | `todo.md` | Marks the focused Personal command extension complete. |

### GitHub synchronization

The Personal command increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `a7e7682` (`feat: extend personal command overview`).

### Next actions

The next actions are to refine the Wix CMS foundation with production field types, references, indexes, and Velo data-access policy; transform the hybrid template while removing all template testimonial content; build the custom member dashboard; then complete the remaining test, payment/provider, scheduler, and legacy-source audit work.

## Run EC-RUN-0014 — Restricted administration and support-console completion

**Date:** 2026-08-19 EDT
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`
**Work item:** `EC-P08-ADM-002`
**Objective:** Complete the administrator-restricted operations surface without exposing provider credentials, impersonating users, or bypassing tenant authorization.

| Area | Evidence | Result |
|---|---|---|
| Tenant and commercial controls | Existing typed `admin` router plus `Admin.tsx` | Administrators can inspect tenant scope, set scoped flags, inspect or set workspace entitlements, and create controlled plan records. Every mutation writes an audit action. |
| Job and integration health | Typed `job.health` plus new `admin.integrationHealth` query | The console displays durable queue telemetry and three non-secret provider-boundary descriptors: publishing unconfigured, external email unconfigured, and cron-authenticated recovery ready with cadence deferred. |
| Audited support boundary | `admin.recordSupportAccess` | Support requires an administrator, an explicit workspace, and a 10+ character reason; it appends a `support.access.requested` audit record and does not impersonate a member or grant cross-tenant data access. |
| Regression evidence | `server/admin.console.policy.test.ts` | A non-administrator is rejected before workspace data is queried; integration readiness is administrator-only; an allowed support action records the expected scoped audit payload. |
| Recovery and UI evidence | `Admin.tsx` plus `server/admin.console.ui.contract.test.ts` | The console shows oldest queue age, retrying jobs, dead-letter jobs, and heavy-media/provider-handoff escalation counts, with loading, retry, error, empty, success, and unauthorized states. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build`, authenticated `/admin` review | Passed: 27 Vitest files / 58 tests, TypeScript check, production build, and visual review of the populated administrator console. The build retains the existing non-blocking client chunk-size advisory. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Updated | `server/routers.ts` | Adds the administrator-only, non-secret integration readiness descriptor contract. |
| Updated | `client/src/pages/Admin.tsx` | Displays complete job telemetry and integration readiness alongside tenant, feature-flag, entitlement, plan, and audited-support controls, with recoverable query and mutation states. |
| Created | `server/admin.console.policy.test.ts`, `server/admin.console.ui.contract.test.ts` | Deterministic administrator denial, readiness visibility, support-audit, telemetry-display, and UI-state regression coverage. |
| Updated | `docs/quality/TEST_MATRIX.md`, `docs/roadmap/CHANGE_REGISTER.md`, `todo.md` | Records completion state and test evidence. |

### GitHub synchronization

The completed restricted administration-console increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `5456c43` (`feat: complete restricted administration console`).

## Run EC-RUN-0015 — Provider-neutral subscription and usage foundation

**Date:** 2026-08-19 EDT
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`
**Work item:** `EC-P07-ENT-001`
**Objective:** Complete the plan, subscription, entitlement, and usage model foundation without activating a payment provider or collecting payment data.

| Area | Evidence | Result |
|---|---|---|
| Versioned lifecycle schema | `drizzle/schema.ts` and `0002_deep_the_phantom.sql` | Adds `workspaceSubscriptions` with trialing/active/past-due/paused/canceled/expired state, plan linkage, non-secret provider placeholders, and lifecycle dates; adds monthly `workspaceUsage` counters keyed by workspace, metric, and period. |
| Managed database application | Reviewed additive SQL plus information-schema query | The migration applied successfully. Verification returned `workspaceSubscriptions` with 11 columns and `workspaceUsage` with 8 columns; no test data was inserted. |
| Authorization and audit | Typed `workspace.commercialOverview`, `admin.listWorkspaceSubscriptions`, and `admin.assignWorkspaceSubscription` procedures | Any active workspace member can read only their workspace’s plan, entitlement, and usage state. Only an administrator can view lifecycle history or create a provider-neutral subscription record; assignment writes an audit event. |
| Enforced lifecycle and quotas | Existing protected capability gate | Every governed capability now additionally denies a latest lifecycle status other than `trialing` or `active`. An explicit entitlement `usageLimit` checks the current UTC monthly metric before side effects and returns `FORBIDDEN` when exhausted. No subscription record preserves the documented unmanaged default policy. |
| Usage foundation | `incrementWorkspaceUsage` after protected success paths | Successful project creation, asset upload/versioning, Studio review, delivery creation, and publishing handoff record tenant-scoped current-period metrics. Denied operations have no usage side effect. |
| Client visibility | `Settings.tsx` | Client workspace settings render loading, retry/error, empty, current lifecycle, billing-provider-unconfigured, and current-period usage states without exposing commercial administration. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build`, authenticated `/settings` and `/admin` review | Passed: 29 Vitest files / 66 tests, TypeScript check, production build, applied migration verification, and visual review. The existing non-blocking client chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Updated | `drizzle/schema.ts`, `drizzle/meta/*` | Canonical lifecycle and usage schema plus generated Drizzle metadata. |
| Created | `drizzle/0002_deep_the_phantom.sql` | Reviewed and applied additive subscription/usage migration. |
| Updated | `server/db.ts`, `server/routers.ts` | Provider-neutral lifecycle/usage repository helpers, lifecycle/usage-limit protected gate, commercial overview, administrator lifecycle assignment/history, audit record, and governed-operation usage counters. |
| Updated | `client/src/pages/Settings.tsx`, `client/src/pages/Admin.tsx` | Member-visible commercial state plus restricted lifecycle assignment/history controls. |
| Created/updated | `server/subscription.lifecycle.policy.test.ts`, `server/usage.period.contract.test.ts`, `server/entitlement.policy.test.ts`, `server/asset.version.router.test.ts`, `server/studio.publishing.router.test.ts`, `server/admin.console.ui.contract.test.ts` | Lifecycle authorization, audit, tenant isolation, UTC period, Settings/Admin UI, lifecycle/usage-limit denial, and successful-operation usage assertions. |
| Updated | `docs/quality/TEST_MATRIX.md`, `docs/roadmap/MIGRATION_LEDGER.md`, `docs/roadmap/CHANGE_REGISTER.md`, `todo.md` | Completion, migration, and validation evidence. |

### GitHub synchronization

The completed subscription, usage, and entitlement increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `f42c567` (`feat: complete subscription usage entitlements`).

## Run EC-RUN-0016 — Workspace identity lifecycle assurance

**Date:** 2026-08-19 EDT
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`
**Work items:** `EC-P03-IAM-001`, `EC-P03-AUTHZ-001`
**Objective:** Complete deterministic acceptance and negative-path evidence for personal provisioning, organization workspaces, invitations, memberships, role administration, tenant isolation, and the exact platform-owner boundary.

| Area | Evidence | Result |
|---|---|---|
| Personal and organization workspaces | Existing bootstrap policy plus `workspace.lifecycle.acceptance.test.ts` | Personal bootstrap provisions before listing member spaces. Organization creation passes the authenticated caller as the initial owner. |
| Invitation lifecycle | Typed caller acceptance tests plus `isWorkspaceInvitationAcceptable` | An administrator can create/list a role-scoped invitation; an authenticated user accepts a bounded token; an active client member can read workspace member state. Revoked, previously accepted, and expired invitations are invalidated by the shared predicate. A member or client is rejected before invitation administration writes. |
| Role lifecycle | Typed caller acceptance and negative tests | An owner or administrator can update a member role; a non-administrator is rejected before the role repository write. An inactive membership is rejected before member data is queried. |
| Cross-surface negative authorization | `authorization.surface.negative.test.ts` | A viewer is denied asset upload and Studio review before storage/workflow calls; a client is denied invitations; a non-administrator is denied tenant overview and support-audit creation before repository actions. |
| Owner-only boundary | Exact owner procedure test | A caller who might otherwise own a workspace but does not match `OWNER_OPEN_ID` receives `FORBIDDEN` from the Personal command before any command-center data action. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 31 Vitest files / 76 tests, TypeScript check, and production build. The existing non-blocking client chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Created | `server/workspace.lifecycle.acceptance.test.ts`, `server/authorization.surface.negative.test.ts` | Deterministic organization, invitation-state, membership, role, exact-owner, and cross-surface negative-path coverage. |
| Updated | `server/db.ts` | Extracts the invitation validity predicate used by invitation acceptance and its lifecycle tests. |
| Updated | `docs/quality/TEST_MATRIX.md`, `docs/roadmap/CHANGE_REGISTER.md`, `todo.md` | Completes IAM and authorization work-item evidence. |

### GitHub synchronization

The workspace identity lifecycle assurance increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `c0191fa` (`test: complete workspace identity assurance`).

## Run EC-RUN-0017 — Owner-only Personal command completion

**Date:** 2026-08-19 EDT
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`
**Work item:** `EC-P08-ME-001`
**Objective:** Complete the private Personal command experience with exact-owner operational controls while preserving separate Client workspace boundaries.

| Area | Evidence | Result |
|---|---|---|
| Private project control | Typed `personal.createPrivateProject` procedure and `Personal.tsx` | Only the exact platform owner can create a project. The procedure resolves the owner’s personal workspace, checks `project.create` capability and lifecycle/usage policy, records usage after success, and writes `personal.project.created`. |
| Personal operations dashboard | Existing Personal overview and authenticated visual review | The separate Personal layout shows verified owner state, cross-workspace count and activity, queue/retry/dead-letter/heavy-media signals, private projects, and integration readiness. Client workspace navigation remains excluded. |
| Integration controls | `platformIntegrationControls`, `personal.updateIntegrationControl`, and UI | The exact owner can persist non-secret status (`unconfigured`, `reviewed`, `ready`, or `disabled`), enablement intent, and an operational note for publishing, email, or recovery. Each update appends `personal.integration.control_updated`; it cannot store credentials, invoke providers, or modify client workspace access. |
| Dashboard resilience | `Personal.tsx` | The owner dashboard now provides main-overview loading, error/retry, and empty states for recent workspaces, activity, private projects, and integration controls. |
| Migration evidence | `0003_messy_gambit` and information-schema query | The additive migration applied successfully. Verification returned the expected 9 persisted fields in `platformIntegrationControls`; no test data was inserted. |
| Regression evidence | `personal.command.contract.test.ts`, `personal.command.ui.contract.test.ts` | Covers personal-workspace project scope, capability/usage/audit side effects, persisted integration control update/audit, loading/error/retry/empty UI states, and existing exact-owner denial coverage. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build`, authenticated `/personal` review | Passed: 32 Vitest files / 81 tests, TypeScript check, production build, applied migration verification, and visual review. The existing non-blocking client chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Updated | `drizzle/schema.ts`, `drizzle/meta/*`, `drizzle/0003_messy_gambit.sql` | Defines, generates, and applies the persisted non-secret integration-control state. |
| Updated | `server/db.ts`, `server/routers.ts` | Adds persisted integration-control helpers, Personal overview state, and exact-owner integration-control update/audit contract. |
| Updated | `client/src/pages/Personal.tsx` | Adds private projects plus persisted control editing and main dashboard loading/error/retry/empty states. |
| Updated/created | `server/personal.command.contract.test.ts`, `server/personal.command.ui.contract.test.ts` | Protects owner-only project, usage, audit, integration-control, and UI recovery contracts. |
| Updated | `docs/quality/TEST_MATRIX.md`, `docs/roadmap/MIGRATION_LEDGER.md`, `docs/roadmap/CHANGE_REGISTER.md`, `todo.md` | Records completion, migration, and validation evidence. |

### GitHub synchronization

The persisted Personal integration-control increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `a458db5` (`feat: persist personal integration controls`).

## Run EC-RUN-0018 — Full accessibility and responsive journey verification

**Date:** 2026-08-19 EDT
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`
**Work item:** `EC-P10-A11Y-001`
**Objective:** Complete keyboard, semantic, status, recovery, motion, and mobile verification across all implemented experience routes.

| Area | Evidence | Result |
|---|---|---|
| Public keyboard navigation | `Product.tsx`, `Pricing.tsx`, `NotFound.tsx`, existing editorial/Client routes | Every implemented public shell now has a skip link, `main-content` target, and an explicitly named navigation landmark. |
| Protected forms and status | `Settings.tsx`, `Admin.tsx`, Studio and Personal components | Invitation controls have explicit accessible names. Client, Studio, Admin, and Personal retain loading, error, retry, status/live, and authorization-denial affordances under their distinct layouts. |
| Focus and motion | `index.css` | Global `:focus-visible` treatment remains visible. A `prefers-reduced-motion: reduce` rule suppresses nonessential transitions and animations. |
| Automated contract evidence | `accessibility.contract.test.ts`, `accessibility.journey.contract.test.ts` | Six assertions cover shared and route-level landmarks, form names, alerts/status, Personal recovery, focus, and reduced motion. |
| Responsive visual review | Mobile captures for `/`, `/client`, `/settings`, `/studio`, `/admin`, `/personal`, `/product`, and `/pricing` | Primary public and protected layouts retain readable controls, complete information hierarchy, and no clipped action areas at 375 px width. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 33 Vitest files / 85 tests, TypeScript check, and production build. The existing non-blocking client chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Updated | `client/src/pages/Product.tsx`, `client/src/pages/Pricing.tsx`, `client/src/pages/NotFound.tsx` | Adds shared skip links, main targets, and unique public navigation labels. |
| Updated | `client/src/pages/Settings.tsx`, `client/src/index.css` | Adds explicit invitation-form names, alert semantics, and reduced-motion behavior. |
| Created | `server/accessibility.journey.contract.test.ts` | Locks in public/protected route, status, form, focus, and motion accessibility evidence. |
| Updated | `docs/quality/TEST_MATRIX.md`, `docs/roadmap/CHANGE_REGISTER.md`, `todo.md` | Records completion and validation evidence. |

## Run EC-RUN-0019 — Accessibility assurance completion

**Date:** 2026-08-19 EDT
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`
**Work item:** `EC-P10-A11Y-001`
**Objective:** Close the outstanding full-route keyboard/state and contrast evidence gaps after the initial accessibility pass.

| Area | Evidence | Result |
|---|---|---|
| Complete route inventory | `accessibility.route-inventory.test.ts` | Covers all registered editorial, Client public, protected workspace, Studio, Notifications, Settings, Profile, Admin, Personal, invitation, and fallback routes. It verifies shared workspace main-landmark ownership and independently checks Personal, invitation, and fallback states. |
| Keyboard behavior | `skip-link.behavior.test.ts` in a browser-like test environment | An actual Tab then Enter interaction on the shared skip link moves focus to `main-content` and updates the fragment. This replaces source-only assurance for that critical navigation behavior. |
| Semantic and recovery corrections | `Notifications.tsx`, `Invite.tsx` | Notifications no longer nests a second main landmark inside `DashboardLayout`. Invitation acceptance has a unique heading, main target, loading live region, success status, and explicit error alert. |
| Contrast evidence | `contrast.tokens.test.ts` | Implements relative-luminance contrast computation against the actual OKLCH semantic tokens and direct Evercrafted, Client, administration, and Personal surface pairs. All asserted normal-text pairs meet or exceed 4.5:1. |
| Visual review | Mobile primary-route and desktop editorial/invitation captures | Reviewed `/`, Client public, Settings, Studio, Admin, Personal, editorial secondary routes, and invitation acceptance. Controls remain readable and no clipped action area was observed at the tested viewports. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 36 Vitest files / 91 tests, TypeScript check, and production build. The existing non-blocking client chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Updated | `client/src/components/SkipLink.tsx` | Transfers keyboard focus into the main landmark after skip activation. |
| Updated | `client/src/pages/Notifications.tsx`, `client/src/pages/Invite.tsx` | Corrects nested landmark and completes invitation heading/status/alert semantics. |
| Added | `server/skip-link.behavior.test.ts`, `server/contrast.tokens.test.ts`, `server/accessibility.route-inventory.test.ts` | Provides browser-like keyboard behavior, executable contrast, and all-route semantic inventory evidence. |
| Updated | `package.json`, `pnpm-lock.yaml` | Adds browser-test utilities used exclusively for verifiable accessibility interaction testing. |
| Updated | `docs/quality/TEST_MATRIX.md`, `docs/roadmap/CHANGE_REGISTER.md`, `todo.md` | Records full accessibility completion evidence. |

### GitHub synchronization

The completed accessibility assurance increment was pushed successfully to `pipersmyfurbae-hash/Evercrafted6-18` on `main` at commit `7d900da` (`test: complete accessibility assurance`).

## Run EC-RUN-0020 — Database-as-code and canonical fixture completion

**Date:** 2026-08-19 EDT
**Status:** `VALIDATED — GITHUB SYNCHRONIZATION PENDING`
**Work items:** `EC-P02-DB-001`, `EC-P03-DATA-001`
**Objective:** Complete automated migration-artifact and canonical multi-tenant data evidence without producing persisted customer-like test data.

| Area | Evidence | Result |
|---|---|---|
| Canonical fixture graph | `server/test/canonicalFixtures.ts` | Defines deterministic, non-persisted users, organization, workspace, active memberships, invitation, project, asset, workflow event, internal approval request, delivery, notification/preference, queued job, plan, entitlement, feature flag, audit, and integration-control state. Every tenant-bound record carries the same canonical workspace relationship. |
| Fixture safety | `canonical.fixture.contract.test.ts` and `DATA_FIXTURE_CONVENTION.md` | Fixtures contain operational structure only. Internal approval-request state is explicitly distinct from customer-generated ratings or testimonials. Fixtures prohibit customer-generated testimonials, ratings, customer content, payment data, provider credentials, and production-like identity data. |
| Dictionary evidence | `DATA_DICTIONARY.md` and `data.dictionary.contract.test.ts` | The current dictionary is verified against `drizzle/schema.ts`, lists all persisted entity families and migrations through `0003_messy_gambit`, and is protected by a deterministic contract test. |
| Migration integrity | `migration.artifact.contract.test.ts` | Reconciles the 4 root generated SQL migrations against Drizzle journal entries, numbered snapshots, and migration-ledger records; requires reviewable create/alter statements and rejects `DROP TABLE` and `TRUNCATE TABLE`. |
| Existing database practice | `schema.ts`, `seedPlans.ts`, `MIGRATION_LEDGER.md` | The canonical schema, reviewed managed-database migrations, repository helpers, and controlled development/staging reference plan seed now have both a documented convention and automated artifact evidence. |
| Validation | `pnpm test`, `pnpm check`, `pnpm build` | Passed: 39 Vitest files / 96 tests, TypeScript check, and production build. The existing non-blocking client chunk-size advisory remains. |

### Affected-file inventory

| Status | Path | Purpose |
|---|---|---|
| Added | `server/test/canonicalFixtures.ts`, `server/canonical.fixture.contract.test.ts`, `server/data.dictionary.contract.test.ts` | Provides and verifies non-persisted canonical multi-tenant test data and schema-aligned dictionary coverage. |
| Added | `server/migration.artifact.contract.test.ts` | Locks migration, journal, snapshot, ledger, and additive-SQL integrity evidence. |
| Updated | `docs/architecture/DATA_DICTIONARY.md`; added `docs/quality/DATA_FIXTURE_CONVENTION.md` | Verifies every canonical entity family, documents safe fixture/seed boundaries, and records the Drizzle migration workflow. |
| Updated | `docs/quality/TEST_MATRIX.md`, `docs/roadmap/CHANGE_REGISTER.md`, `todo.md` | Records the completed data-governance evidence. |
