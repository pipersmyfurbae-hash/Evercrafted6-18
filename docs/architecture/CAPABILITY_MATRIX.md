# Evercrafted Capability and Overlap Matrix

## Audit status

The implementation foundation has been initialized. The connected Evercrafted Platform and `moodoor-studio-src` source trees still require direct working-copy audit before their capabilities can be classified as retained, extracted, redesigned, deferred, or retired. The entries below describe the unified target and the currently available full-stack scaffold only; they are not claims about uninspected source files.

| Capability | Target engine owner | Template/foundation status | Evercrafted source status | Moodoor source status | Planned disposition |
|---|---|---|---|---|---|
| Identity/session | `engine-authz` | `server/_core/trpc.ts` provides protected/admin procedures; OAuth user context is available | Pending audit | Pending audit | Extract/enforce shared path |
| User record | `database` | `drizzle/schema.ts` has the initial Drizzle `users` table; `server/db.ts` upserts OAuth users | Pending audit | Pending audit | Extend canonical schema |
| Workspace/organization | `engine-core`, `database` | Not implemented; typed tRPC API and Drizzle configuration are ready | Pending audit | Pending audit | New shared capability |
| Membership/RBAC | `engine-authz` | Template owner/user role only | Pending audit | Pending audit | Redesign as unified policies |
| Public site/onboarding | `apps/web` | `client/src/App.tsx` registers only a placeholder home route and 404 view | Pending audit | Not applicable/pending audit | Build shared public surface |
| Customer workspace | `apps/web`, `engine-core` | `DashboardLayout` is reusable but contains placeholder page routes | Pending audit | Pending audit | Build on shared engine |
| Studio workspace | `engine-studio` | Not implemented | Pending audit | Pending audit | Extract Studio-specific value |
| Assets/storage | `engine-content`, `storage` | Server S3 helper exists | Pending audit | Pending audit | Central tenant-scoped service |
| Workflows/review | `engine-content`, `engine-studio` | Not implemented | Pending audit | Pending audit | Shared core plus Studio extension |
| Notifications/jobs | `engine-events` | Notification and heartbeat framework files exist | Pending audit | Pending audit | Audit before extension |
| Billing/entitlements | `engine-billing` | Not implemented | Pending audit | Pending audit | Adapter and central enforcement |
| Personal command center | `apps/web`, `engine-authz` | Not implemented | Pending audit | Pending audit | Owner-only module |
| Support/administration | `apps/web`, `engine-authz` | Admin field exists in user model | Pending audit | Pending audit | Restrict, audit, and extend |

## Required source-audit evidence

For each source program, the audit must record the feature name, route/entry point, source files, data model, roles, APIs, providers, tests, customer impact, migration candidates, security sensitivity, and final disposition. No legacy behavior is considered retained until it is mapped here.
