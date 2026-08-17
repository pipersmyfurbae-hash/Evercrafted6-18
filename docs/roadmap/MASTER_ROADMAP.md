# Evercrafted Unified Ecosystem — Master Roadmap

**Status:** Active  
**Canonical repository:** `pipersmyfurbae-hash/Evercrafted6-18`  
**Project workspace:** `/home/ubuntu/evercrafted-unified-ecosystem`  
**Execution rule:** Every run updates this roadmap, `RUN_LOG.md`, `CHANGE_REGISTER.md`, affected architecture/data/quality records, and `todo.md`. Code, tests, documentation, and database artifacts are committed and pushed together after validation.

## Product objective

Evercrafted will be a multi-tenant SaaS product family with a public product surface, personal auto-provisioned workspaces, organization workspaces, a native Moodoor Studio module, governed file and workflow operations, owner-only command controls, and restricted audited support operations. All product surfaces will consume a single typed Ever Engine; no interface may implement an independent data, authorization, entitlement, or workflow path.

## Active delivery sequence

| Phase | Scope | Status | Completion requirement |
|---|---|---|---|
| P00 | Source and project audit | `BLOCKED` | Scaffold baseline is verified; full legacy-source inventory remains blocked until the connected GitHub working copy is available in this project workspace |
| P01 | Governance, product model, and architecture | `IN_PROGRESS` | Living records are initialized; ADRs, role model, canonical data model, design direction, and release slices remain |
| P02 | Engineering and database foundation | `IN_PROGRESS` | Canonical Drizzle schema and applied migrations exist; fixtures, migration tests, CI rules, and seed conventions remain |
| P03 | Ever Engine core | `IN_PROGRESS` | Workspace provisioning, roles, memberships, tRPC contracts, and initial audit records are implemented; full policy evidence remains |
| P04 | Shared platform services | `IN_PROGRESS` | Tenant asset path, workflow events, notifications/jobs records, and hybrid recovery design are implemented; provider adapters and execution guarantees remain |
| P05 | Public site and customer workspace | `IN_PROGRESS` | Public landing, lead capture, onboarding entry, workspace/project shell, and collaboration controls are implemented; detail, search, and release evidence remain |
| P06 | Moodoor Studio | `NOT_STARTED` | Studio projects, assets, reviews, approvals, delivery, publishing, and shared collaboration |
| P07 | Commercial SaaS controls | `NOT_STARTED` | Plans, entitlements, usage, billing-provider adapter, and self-service lifecycle |
| P08 | Personal and administration controls | `NOT_STARTED` | Owner-only command center, tenant-safe administration, support audit, feature flags, and health dashboards |
| P09 | Migration and controlled beta | `NOT_STARTED` | Rehearsed data migration, rollout controls, beta evidence, and legacy transition policy |
| P10 | Production readiness | `NOT_STARTED` | Security, accessibility, performance, recovery, release candidate, and go/no-go evidence |
| P11 | Launch and ongoing governance | `NOT_STARTED` | Staged rollout, hypercare, legacy decision, and recurring roadmap discipline |

## Current work items

| Work ID | Requirement | Status | Evidence required |
|---|---|---|---|
| EC-P01-GOV-001 | Create and maintain the full documentation control set | `DONE` | Governance files and first-run record created in EC-RUN-0001; required updates remain continuous |
| EC-P00-INV-001 | Audit the initialized project and source programs | `BLOCKED` | Initial full-stack scaffold inventory complete; connected legacy source working copy remains unavailable |
| EC-P02-DB-001 | Establish database-as-code conventions | `NOT_STARTED` | Drizzle schema, migration, seed, fixture, test, data dictionary, and runbook artifacts |
| EC-P03-DATA-001 | Define canonical multi-tenant schema | `NOT_STARTED` | Approved entity model, migration, indexes, and tests |
| EC-P03-IAM-001 | Add provisioning, memberships, invitations, and roles | `NOT_STARTED` | tRPC commands, policies, tests, and onboarding integration |
| EC-P03-AUTHZ-001 | Enforce tenant and owner-only policies | `NOT_STARTED` | Negative authorization tests and audit evidence |
| EC-P05-PUB-001 | Build public Evercrafted site and onboarding | `NOT_STARTED` | Responsive implementation with tested sign-in path |
| EC-P05-APP-001 | Build SaaS workspace shell | `NOT_STARTED` | Context-safe navigation, project/search/notification/settings states |
| EC-P06-UX-001 | Build Moodoor Studio module | `NOT_STARTED` | Studio lifecycle, shared assets, reviews, approvals, and delivery |
| EC-P04-STO-001 | Add tenant-scoped S3-backed assets | `NOT_STARTED` | Storage metadata, policy, versioning, and access tests |
| EC-P04-JOB-001 | Add background job record/service framework | `NOT_STARTED` | Recoverable job state, progress, retry, and health evidence |
| EC-P08-ME-001 | Build owner-only Personal Command Center | `NOT_STARTED` | Strict owner policy, private workspace, and dashboard views |
| EC-P08-ADM-002 | Build restricted support/admin console | `NOT_STARTED` | Role restrictions, tenant-safe controls, and support audit records |
| EC-P04-JOB-002 | Adopt the tiered hybrid asynchronous-processing policy | `DONE` | ADR-0001 and durable job/recovery implementation recorded in EC-RUN-0001 |

## Required database artifacts

All persistence changes must include a Drizzle schema update, generated and reviewed migration, tenant-scoped data-access helper, migration-aware test, fixture/seed update if relevant, data-dictionary update, and migration-ledger update if legacy data is affected. Application code must not rely on untracked or manually created schema state.

## Next execution queue

1. Add database fixtures, seed conventions, migration-test evidence, and tenant-isolation/invitation lifecycle tests.
2. Complete workspace search, notifications UI, project detail, and invitation acceptance interfaces.
3. Register and deploy the scheduled job-recovery callback only after checkpoint/publish; document its platform task identifier and recovery evidence.
4. Implement provider-reviewed notification, billing/entitlement, and heavy-media adapters without bypassing the shared engine.
