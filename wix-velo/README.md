# Evercrafted Velo Service Layer

`backend/evercraftedDashboard.web.js` is the first Wix-site Velo service contract for the member dashboard. It uses documented Wix web methods, authenticated member retrieval, and CMS data queries. It must be added to the Wix site’s backend code area as a `.web.js` file once the editor exposes code controls or a supported code-deployment path is available.

The module intentionally uses `Permissions.SiteMember` only for member-facing methods. It resolves the current member on the server and checks the matching active `evercrafted-workspace-memberships` record before it reads tenant-bound data. No API accepts a caller-supplied member identifier.

The current secure CMS permissions remain administrator-only. That is correct during this transition: Velo web methods are the planned policy boundary, and direct browser collection reads/writes remain unavailable. Before live dashboard pages are connected, test these negative cases: signed-out invocation; unrelated member/workspace pair; archived workspace; viewer/client access to administrative operations; and owner/admin access to workspace operations.

The source module is an auditable repository artifact, not confirmation that it has been deployed into Wix. Deployment, member-page binding, and end-to-end role tests remain tracked in `todo.md`.

`backend/evercraftedPersonal.web.js` is a deliberately separate Personal command service. It requires a Wix secret named `EVERCRAFTED_PLATFORM_OWNER_MEMBER_ID` whose value is the authorized Wix Member ID. The module compares the server-resolved current member to that secret and never treats a workspace `owner` role as authority to view Personal information. The secret must be created through Wix Secrets Manager when the owner member identity is verified; its value must never be placed in CMS collections, repository files, page code, or frontend output.
