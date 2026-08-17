# Evercrafted Security and Delivery Risk Register

| Risk ID | Risk | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| EC-RISK-0001 | Source programs have not been directly audited, so retained functionality and migration scope remain unknown. | Medium | High | Complete P00 inventory and capability matrix before extracting or retiring legacy behavior. | `OPEN` |
| EC-RISK-0002 | Tenant scope could be bypassed if UI routes or raw database access become the authorization boundary. | Medium | Critical | Central server-side policies, tenant-scoped repositories, negative integration tests, and audit records. | `OPEN` |
| EC-RISK-0003 | User content or files could be exposed across tenants. | Medium | Critical | S3 references only, server-side access checks, scoped signed URLs, asset metadata, and permission tests. | `OPEN` |
| EC-RISK-0004 | Support tooling could become an unaudited cross-tenant access path. | Medium | High | Owner/reason/time-bound support action model and audit logging; deny-by-default policies. | `OPEN` |
| EC-RISK-0005 | Unversioned database changes could break deployment or lose data. | Medium | High | Drizzle schema, generated migrations, fixtures, migration tests, ledger, and controlled deployment order. | `OPEN` |
| EC-RISK-0006 | GitHub synchronization may be blocked by branch policy, conflict, or unavailable repository working copy. | Medium | Medium | Record blockers transparently; do not claim a push until the remote result is verified. | `OPEN` |
| EC-RISK-0007 | Public lead capture collects contact information without a final published retention/opt-out policy. | Medium | Medium | Limit data to explicit fields, avoid sensitive fields, document retention/opt-out before public release, and add rate limiting before scale. | `OPEN` |
