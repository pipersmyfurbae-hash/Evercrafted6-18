# Evercrafted Wix-Native Blueprint

**Status:** Approved foundation  
**Target Wix site:** `4a20e429-d686-4f4d-8282-13454219024a`  
**Created:** 2026-08-17  
**Source template:** Home Goods Store (Cosy), `0840bbce-80b1-48d6-8dec-3f6084f213e7`  
**Composition reference:** Interior Design Company (Elegant), `dff23900-3567-4130-93ad-d933e91318d1`

## 1. Product and Design Decision

Evercrafted will use the new Wix site as its customer-facing and operational home. Wix Stores supplies the commerce foundation, Wix Members supplies authenticated identity, Wix CMS collections store the product domain, Velo modules enforce application policy, and Wix Automations or external delivery endpoints handle delayed work. The original full-stack implementation remains a migration reference and governance record; the Wix-native implementation becomes the production experience.

The chosen hybrid preserves the commerce-ready information architecture of the Home Goods template while replacing its visual personality with a quieter, architectural editorial composition inspired by the Interior Design template. The result is not a copy of either template. It is a new Evercrafted system with commercial utility, portfolio-scale imagery, and a calm luxury cadence.

## 2. Hybrid Editorial Layout

| Template source | Retained structural strength | Evercrafted transformation |
|---|---|---|
| Home Goods Store (Cosy) | Store, catalog, product, cart, checkout, and account journeys | Replace cosy promotional blocks with sparse collection narratives, masonry product curation, and editorial product provenance |
| Interior Design Company (Elegant) | Large portfolio imagery, visual storytelling, and project sequence | Introduce asymmetric hero crops, project/editorial transitions, full-bleed architectural bands, and restrained case-study modules |

The public homepage will begin with a high-impact visual scene and an unhurried statement of purpose. The first scroll introduces the Evercrafted operating ecosystem through an asymmetric split layout: one side gives concise, serif-led editorial language; the other shows an architectural image or working studio scene. The middle of the page moves between product collections, Studio work, client outcomes, and a member-entry callout. Commerce content should read as considered curation rather than a product grid pushed above the fold.

| Page / area | Layout direction | Primary visitor action |
|---|---|---|
| Home | Full-bleed visual hero, asymmetric project story, collection curation, Studio proof, member portal entry | Explore the ecosystem or start a workspace |
| Platform | Editorial modules explaining workspace, project, review, and delivery capabilities | Enter the member experience |
| Moodoor Studio | Portfolio-led project scenes, review/delivery narrative, client collaboration modules | Explore Studio or request access |
| Shop / collections | Quiet filter rail, large product imagery, generous negative space, provenance detail | Browse a curated catalog |
| Product | Gallery-led product story, material/detail facts, cross-sells, restrained purchase panel | Add to cart or save to a project |
| Journal / projects | Dynamic interior-design-style editorial cards and case-study sequence | View a project or inquiry path |
| About / contact | Architectural brand story, high-touch service and lead capture | Submit an inquiry |
| Member dashboard | Functional dashboard shell with a composed editorial header and dense-but-calm task modules | Work inside the ecosystem |

### Design system

| Token | Direction |
|---|---|
| Palette | Warm limestone `#E9E1D4`, bone `#F6F2EA`, smoke `#C9C1B5`, graphite `#1E252B`, forest `#4E6B5C`, oxidized clay `#B96038` |
| Display type | High-contrast serif for editorial headlines and collection names |
| UI type | Compact humanist sans-serif for navigation, commerce data, forms, and dashboards |
| Spacing | Generous horizontal margins, long vertical pacing, 8-point internal system, compressed utility controls |
| Image treatment | Architectural crops, tactile detail, low-saturation warmth, framing rather than decoration |
| Motion | Subtle opacity/translate reveals below 300ms; no decorative looping movement; reduced-motion alternative |
| Accessibility | Clear body contrast, persistent focus states, semantic heading order, labels on controls, keyboard-operable navigation, and non-image equivalents for primary calls to action |

### Verified template audit and transformation map

The new site presently has a commerce header with category links, a login entry, a visual hero, a best-seller product grid, room/category sections, an artisan-sale promotional band, new-arrivals content, an origin-story block, newsletter capture, legal navigation, and template reviews. These blocks validate the selection: commerce paths are already present, while the hero and story regions provide natural insertion points for the dynamic portfolio-led Evercrafted composition.

| Existing template block | Verified current behavior | Evercrafted hybrid replacement |
|---|---|---|
| Header/category navigation | Catalog categories, member login, and shopping routes | Add Platform, Moodoor Studio, Projects/Journal, Shop, and Member Portal; retain accessible catalog/cart paths |
| Hero and best-seller grid | Large lifestyle hero with introductory text and initial product cards | Use an architectural full-bleed hero with a compact ecosystem statement; move curated product cards after a Studio/project narrative break |
| Explore-by-room categories | Commerce categories with narrative placeholders | Recast as `Workspaces`, `Studio`, and `Collections`, each with a project image, editorial microcopy, and intentional action |
| Artisan promotion and new arrivals | Sale/arrival merchandising blocks | Replace sales-led language with provenance, project curation, and thoughtfully placed release moments |
| Origin story | Brand craft text and image | Build an Evercrafted operating-system story: creative work, client trust, and craft continuity |
| Template reviews | Static template review copy | Remove before release. Evercrafted will never use invented reviews, ratings, or testimonials; this section remains absent until authentic, permissioned customer material is supplied. |
| Newsletter and legal footer | Email form and legal links | Retain a consent-aware inquiry/newsletter path and replace placeholder navigation with approved Evercrafted policies |

## 3. Native Wix Implementation Sequence

| Step | Wix-native work | Acceptance evidence |
|---|---|---|
| 1 | Rename and brand the isolated site; configure site typography, colors, global section spacing, and default buttons | Global styles match design tokens on desktop and mobile |
| 2 | Preserve Wix Stores V3 customer journeys; replace template content with Evercrafted collections, product and project language | Store, product, cart, and checkout routes remain reachable |
| 3 | Build public page map: Home, Platform, Studio, Shop, Projects/Journal, About, Contact, Legal, Sign In, and 404 | All pages have navigation and responsive states |
| 4 | Create CMS collections and permission rules defined below | Collection schema and access matrix verified in Wix CMS |
| 5 | Configure Wix Members and member metadata; create role-aware dashboard entry and private pages | Signed-out visitors are redirected from protected areas; member role controls visible only where authorized |
| 6 | Add Velo data-access modules to centralize workspace context, membership checks, audit logging, and collection queries | No protected page reads raw cross-workspace data directly |
| 7 | Build dashboard pages: Overview, Projects, Studio, Notifications, Settings, Personal Command, Administration | Empty, loading, error, and authorization states are present |
| 8 | Configure Wix Automations and external execution boundaries for lead notifications, review notices, delivery handoff, job recovery, and provider adapters | Every automation has a named trigger, owner, retry or recovery policy, and audit event |
| 9 | Add commerce entitlement policy: Stores purchase context, plan/entitlement records, and role-aware capability checks | Commerce and SaaS state are not conflated; access checks are server/data-policy enforced |
| 10 | Test role boundaries, CMS permissions, member journeys, Store flows, responsive design, and audit records; update governance files and GitHub | Test matrix, run log, migration ledger, and change register are current |

## 4. Wix CMS Collection Model

The native data model keeps all tenant-bound records explicitly scoped through a workspace reference. Velo data modules must resolve the current member and workspace before reading or mutating tenant content. Collection permissions must default to least privilege; administrative or role-changing writes must flow through backend Velo code rather than direct browser writes.

| Collection | Purpose | Core fields | Access rule |
|---|---|---|---|
| `Organizations` | Shared customer/team container | `name`, `slug`, `status`, `ownerMemberId`, `createdAt` | Backend/admin only for writes; members see only related organization data |
| `Workspaces` | Personal or organization work context | `name`, `slug`, `kind`, `organizationId`, `ownerMemberId`, `isArchived` | Read requires active membership |
| `WorkspaceMemberships` | Member-to-workspace role relationship | `workspaceId`, `memberId`, `role`, `status`, `invitedEmail`, `joinedAt` | Backend-authorized; never public |
| `WorkspaceInvitations` | Invitation lifecycle | `workspaceId`, `email`, `role`, `tokenHash`, `expiresAt`, `status` | Backend-only token handling and writes |
| `Projects` | Shared customer and Studio work | `workspaceId`, `name`, `slug`, `status`, `description`, `leadMemberId`, `createdAt` | Active workspace members only |
| `Assets` | Metadata pointer to Wix Media or approved external object | `workspaceId`, `projectId`, `mediaRef`, `name`, `mimeType`, `sizeBytes`, `currentVersionId`, `status` | Active workspace members only; media links issued through policy-aware backend flow |
| `AssetVersions` | Immutable asset history | `assetId`, `workspaceId`, `versionNumber`, `mediaRef`, `note`, `createdByMemberId` | Active workspace members only |
| `ReviewRequests` | Studio review and approval cycle | `workspaceId`, `projectId`, `assetId`, `assignedMemberId`, `status`, `requestNote`, `responseNote`, `resolvedAt` | Workspace members; assignment/response policy enforced in Velo |
| `Deliveries` | Provider-neutral delivery and publish handoff | `workspaceId`, `projectId`, `status`, `destinationType`, `destinationRef`, `handoffJobId` | Workspace members; publishing changes backend-only |
| `Notifications` | In-app and delivery-ready notices | `memberId`, `workspaceId`, `type`, `title`, `body`, `readAt`, `createdAt` | Recipient only |
| `AuditEvents` | Append-only business and security record | `workspaceId`, `actorMemberId`, `action`, `targetType`, `targetId`, `metadata`, `createdAt` | Backend writes; owner/admin read policy |
| `BackgroundJobs` | Durable job/retry ledger | `workspaceId`, `jobType`, `status`, `idempotencyKey`, `attempts`, `maxAttempts`, `payloadRef`, `runAfter`, `progress` | Backend only; dashboard exposes policy-filtered status |
| `Plans` | Product packaging configuration | `slug`, `name`, `description`, `isActive` | Admin writes; public read only for active marketing fields |
| `WorkspaceEntitlements` | Tenant capability state | `workspaceId`, `planId`, `capability`, `isEnabled`, `usageLimit` | Backend/admin write; workspace users read evaluated access only |
| `FeatureFlags` | Scoped rollout configuration | `key`, `workspaceId`, `isEnabled`, `description`, `expiresAt` | Admin backend only |
| `Leads` | Public contact and inquiry capture | `name`, `email`, `interest`, `source`, `status`, `createdAt` | Form/backend writes; restricted operations read |
| `IntegrationConnections` | Provider configuration metadata | `workspaceId`, `provider`, `status`, `externalRef`, `lastCheckedAt` | No credentials in CMS; admin backend only |

## 5. Custom Member Dashboard Structure

The dashboard is a private Wix member area with custom pages. A Velo backend resolver establishes the authenticated member’s active workspace and membership role before rendering every tenant-bound module.

| Route concept | Purpose | Role access | Main modules |
|---|---|---|---|
| `/member/overview` | Workspace operating summary | Active members | Workspace switcher, activity, project pulse, review queue, notifications |
| `/member/projects` | Project directory and project detail | Active members | Search, status filters, project cards, project narrative, activity log |
| `/member/studio` | Moodoor Studio workroom | Role-dependent | Asset library, versions, request review, assigned review queue, delivery handoff |
| `/member/notifications` | In-app communication center | Recipient | Unread/read state, links to related work |
| `/member/settings` | Workspace and membership controls | Owner/admin as appropriate | Members, invitations, roles, workspace configuration |
| `/member/profile` | Personal identity and preferences | Signed-in member | Profile, contact details, notification preferences |
| `/member/personal` | Owner-only Personal Command Center | Configured platform owner | Cross-workspace overview, private projects, integration health, audit activity |
| `/member/admin` | Restricted operations | Platform administrators | Tenant health, feature flags, plans, entitlements, jobs, audited support access |

### Dashboard visual pattern

The dashboard retains the editorial brand but deliberately shifts toward operational clarity. A slim graphite navigation rail holds the workspace switcher and member identity. The main surface uses warm stone backgrounds, white content cards, serif page headings, and compact sans-serif metadata. Large dashboard numbers are treated like magazine statistics; task lists remain compact and unmistakably functional. The Studio page is the most visual member surface, pairing a large selected project image with review and delivery panels.

## 6. Current Site Foundation

The isolated Wix site is published at the Wix-generated URL supplied at creation. Its initial configuration includes Wix Stores Catalog V3, Wix Members Area, Wix Forms, Wix Invoices, Velo, USD currency, US locale, and America/Chicago time zone. These are foundation facts for the migration audit; the site is not yet branded or populated with production catalog, member, or SaaS data.

### Configured Wix CMS foundation

On 2026-08-17, all 17 planned Evercrafted CMS collections were created successfully on the target site: `evercrafted-organizations`, `evercrafted-workspaces`, `evercrafted-workspace-memberships`, `evercrafted-workspace-invitations`, `evercrafted-projects`, `evercrafted-assets`, `evercrafted-asset-versions`, `evercrafted-review-requests`, `evercrafted-deliveries`, `evercrafted-notifications`, `evercrafted-audit-events`, `evercrafted-background-jobs`, `evercrafted-plans`, `evercrafted-workspace-entitlements`, `evercrafted-feature-flags`, `evercrafted-leads`, and `evercrafted-integration-connections`.

Each collection has an explicit baseline field set matching the model above and uses backend/administrator-only read and write permissions. This deliberately prevents direct client-side cross-tenant access while the Velo authorization layer is built. The next collection pass will add typed field refinements, relationship-aware lookup/reference behavior where supported, indexes, Velo data-access modules, and role-filtered dashboard queries.

On the first refinement pass, 23 field updates succeeded: business timestamps are now `DATETIME`; state flags are `BOOLEAN`; byte counts, version numbers, job counts, progress, and usage limits are `NUMBER`; and invitation/lead email values are `EMAIL`. The `slug` fields for organizations, workspaces, and projects remain `TEXT` temporarily because Wix requires additional slug metadata for a `SLUG` field. No records exist in the collections, and no business data was lost. Slug metadata, relationship/reference fields, lookup behavior, indexes, and Velo authorization modules remain explicit follow-up work.

### Verified collection audit

The Wix collection inventory confirms exactly 17 Evercrafted CMS collections, each with the expected collection identifier, an 8–13 field initial structure, and `ADMIN` access for insert, read, update, and remove operations. This administrator-only baseline is intentional: member pages must not directly query tenant records until the Velo backend resolver and role policies are implemented. The audit confirms no unexpected custom collections are present on the isolated site.

## 7. Governance Update Rules

Every change to a Wix page, CMS collection, permission rule, Velo module, automation, commerce setting, or native integration must have a matching entry in `RUN_LOG.md`, `CHANGE_REGISTER.md`, `CAPABILITY_MATRIX.md`, `DATA_DICTIONARY.md`, `MIGRATION_LEDGER.md`, `TEST_MATRIX.md`, and `todo.md` when applicable. Wix configuration cannot be pushed to GitHub directly, so the repository will retain exported code, declarative collection specifications, screenshots, test evidence, and a configuration manifest as the auditable mirror.

## 8. Editor Access Record

The authorized user completed Wix sign-in in the opened editor session on 2026-08-17. The visual editor loaded, but its rendered controls were not exposed to the current automation view. The authoritative Wix connection remains available for site inventory and context, while the CMS documentation/API connection is being retried. No unreviewed page-content changes, product changes, or template testimonial changes have been made through the editor in this run.

After sign-in, the editor session resolves to its animated loading canvas rather than accessible page-edit controls. This means the live template visual transformation, member-page setup, and mandatory testimonial removal are documented but not yet executed. CMS API work remains independently available and is the active configuration path until the visual editor provides editable controls or a supported page-management route is verified.
