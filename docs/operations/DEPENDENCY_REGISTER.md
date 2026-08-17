# Evercrafted Dependency Register

| Dependency | Purpose | Data handled | Authentication | Criticality | Current state |
|---|---|---|---|---|---|
| Manus OAuth | Authenticated user session and identity | User identity metadata | Managed OAuth | High | Present in template |
| MySQL/TiDB database | Relational tenant and platform metadata | Platform/user/workspace records | Managed environment connection | Critical | Present in template |
| S3-compatible storage | User file bytes and asset delivery | Tenant-owned files; metadata stored separately | Server-side storage helpers | High | Template helper available; tenant policy pending |
| tRPC | Typed internal API contracts | Validated request/response data | Session-aware server context | High | Present in template |
| GitHub repository | Source, governance history, and review trail | Source/documentation only; no secrets | Connected account integration | High | Working-copy synchronization pending |

No billing, external AI/media, email, analytics, or publishing provider is selected yet. Such integrations require a dependency-register entry, an architecture decision, documented secret handling, tests, and an approved implementation scope before activation.
