# Evercrafted Wix-Native Blueprint

**Status:** Architecture correction pending live implementation  
**Target Wix site:** `4a20e429-d686-4f4d-8282-13454219024a`  
**Created:** 2026-08-17  
**Source template:** Home Goods Store (Cosy), `0840bbce-80b1-48d6-8dec-3f6084f213e7`  
**Composition reference:** Interior Design Company (Elegant), `dff23900-3567-4130-93ad-d933e91318d1`

## 1. Corrected Product and Experience Decision

The initial template is **only a foundation**. It is not the intended Evercrafted design and it is not a merged product website. The platform will use a **single Wix backend engine** for shared identity, CMS collections, Velo policy, audit records, automations, and commerce capabilities, while presenting three distinct experiences with independent navigation, layouts, and access boundaries.

| Experience | Primary audience | Purpose | Visual character | Access boundary |
|---|---|---|---|---|
| **Evercrafted** | Public visitors, prospective buyers, and brand customers | Editorial brand, collections, commerce, journal, inquiries | Calm, architectural, high-craft editorial | Public, customer account, and Store checkout paths |
| **Client SaaS** | Prospective SaaS clients and authenticated client/workspace members | Public SaaS conversion, then projects, Moodoor Studio, assets, reviews, deliveries, notifications, and settings | Clear, restrained, operational interface | Public conversion pages; protected workspace requires active membership and role policy |
| **Personal** | Platform owner only | Private projects, cross-workspace oversight, integrations, activity, operational command | Private, composed, concise command surface | Explicit owner-only server/Velo policy |

The shared engine is a **technical foundation**, not a visual merge. Data, identity, permissions, Velo contracts, and audit behavior are shared; pages, navigation, shell layouts, content hierarchy, and dashboards are not.

The chosen hybrid retains only the **dynamic composition** of the two reference templates: asymmetry, narrative sequencing, image cadence, and an active project-to-project rhythm. It explicitly rejects the starting template’s bold color treatment and typography. No final surface will inherit those elements.

## 2. Three-Experience Layout and Visual System

| Reference source | Retained compositional strength | Explicitly not retained |
|---|---|---|
| Home Goods Store (Cosy) | Store, catalog, product, cart, checkout, and account journey structure | Its bold palette, promotional tone, font choices, testimonials, and visual identity |
| Interior Design Company (Elegant) | Large portfolio imagery, asymmetric project storytelling, and visual sequence | Its colors, type scale, and any source-brand styling |

### Evercrafted editorial brand and commerce

The Evercrafted public site is the only experience that uses the editorial hybrid. It opens with a cinematic, low-saturation hero and a concise statement of craft, then alternates asymmetrical image narratives, collections, studio journal entries, and deliberately quiet product curation. Commerce supports the brand story rather than leading it. The final page system includes Home, Collections, Product, Journal, About, Contact, Policies, Sign In, and 404.

### Client SaaS workspace

The Client SaaS experience has two intentionally connected but visually distinct layers. Its public conversion route group has a SaaS landing page, How It Works, capabilities, client outcomes, pricing/access, sign-in, and a clear protected-workspace entry. Its protected workspace route group has its own compact utility navigation, workspace switcher, project focus, and predictable page rhythm. Neither layer has the Evercrafted Store header, product-catalog promotions, or Personal controls. The protected dashboard group includes Overview, Projects, Project Detail, Moodoor Studio, Reviews, Deliveries, Notifications, Workspace Settings, and Profile.

### Personal command site

The Personal experience is a separate owner-only route group with its own private navigation and its own data summaries. It is not shown to clients or public visitors. Its pages include Command Overview, Private Projects, Cross-Workspace Activity, Integrations, Job Health, Audit History, Platform Settings, and restricted Administration.

### Design system

| Experience | Palette | Typography | Layout and motion |
|---|---|
| Evercrafted | Limestone, bone, smoked oak, and near-black neutrals; no template brights | Refined serif headlines with a quiet sans-serif UI | Generous pacing, asymmetric stories, architectural crops, restrained reveal motion |
| Client SaaS | Soft white, cloud gray, graphite, and one muted functional accent | Highly legible sans-serif with limited serif use only for page titles | Grid-based workspace, stable side navigation, rapid state feedback, no decorative motion |
| Personal | Charcoal, parchment, muted mineral gray, and subdued status accents | Compact sans-serif with reserved display emphasis | Denser command layout, private activity stream, measured data hierarchy, no public marketing elements |

All experiences require accessible contrast, persistent focus states, semantic heading order, labels, keyboard-operable controls, loading/empty/error states, and reduced-motion alternatives.

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
| 1 | Establish three independent route groups and layouts: Evercrafted public/commerce, Client SaaS, and Personal private command | No route mixes public commerce, client workspace, or owner-only controls |
| 2 | Apply the Evercrafted visual system only to the public brand/commerce group; remove template colors, fonts, promotions, and testimonials | Public Home, Collections, Products, Journal, About, Contact, Policies, Sign In, and 404 use the approved editorial system |
| 3 | Build the Client SaaS public page map: SaaS Landing, How It Works, Capabilities, Client Outcomes, Pricing/Access, and Sign In; then build the protected workspace map: Overview, Projects, Project Detail, Studio, Reviews, Deliveries, Notifications, Settings, and Profile | Prospective clients have an independent conversion path; active members reach only the workspace routes they are authorized to use |
| 4 | Create CMS collections and permission rules defined below | Collection schema and access matrix verified in Wix CMS |
| 5 | Configure Wix Members and member metadata; create role-aware Client SaaS entry and separate owner-only Personal entry | Signed-out visitors are redirected from protected areas; owner-only controls are absent for every other role |
| 6 | Add Velo data-access modules to centralize workspace context, membership checks, audit logging, and collection queries | No protected page reads raw cross-workspace data directly |
| 7 | Build the Client SaaS dashboard and the separate Personal command dashboard | Each has its own layout shell, navigation, empty/loading/error states, and authorization boundaries |
| 8 | Configure Wix Automations and external execution boundaries for lead notifications, review notices, delivery handoff, job recovery, and provider adapters | Every automation has a named trigger, owner, retry or recovery policy, and audit event |
| 9 | Add commerce entitlement policy: Stores purchase context, plan/entitlement records, and role-aware capability checks | Evercrafted commerce and Client SaaS state are not conflated; access checks are server/data-policy enforced |
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

## 5. Custom Dashboard Structure

The Client SaaS public conversion layer, Client SaaS protected workspace, and Personal experience are separate Wix route groups. A Velo backend resolver establishes the authenticated member’s active workspace and role before rendering tenant-bound Client SaaS modules. A separate owner resolver gates every Personal route and does not infer owner access from client workspace membership.

### Client SaaS dashboard

| Route concept | Purpose | Role access | Main modules |
|---|---|---|---|
| `/client/overview` | Workspace operating summary | Active members | Workspace switcher, activity, project pulse, review queue, notifications |
| `/client/projects` and `/client/projects/{id}` | Project directory and project detail | Active members | Search, filters, project cards, narrative, activity log |
| `/client/studio` | Moodoor Studio workroom | Role-dependent | Asset library, versions, assigned review queue, delivery handoff |
| `/client/notifications` | In-app communication center | Recipient | Unread/read state and related-work links |
| `/client/settings` | Workspace and membership controls | Owner/admin as appropriate | Members, invitations, roles, workspace configuration |
| `/client/profile` | Personal identity and preferences | Signed-in member | Profile, contact details, notification preferences |

### Client SaaS public conversion pages

| Route concept | Purpose | Primary action |
|---|---|---|
| `/client` | Explain the client SaaS promise and workspace outcome | Explore how it works or sign in |
| `/client/how-it-works` | Explain onboarding, workspace, review, delivery, and support flow | Begin access conversation |
| `/client/capabilities` | Explain project, Studio, review, delivery, notification, and governance capabilities | Compare workflow fit |
| `/client/outcomes` | Describe documented product outcomes and operating model without invented testimonials or ratings | Request access or continue evaluating |
| `/client/access` | Present pricing/access model and identity entry | Sign in or request access |

### Personal command dashboard

| Route concept | Purpose | Role access | Main modules |
|---|---|---|---|
| `/personal/overview` | Private operating summary | Explicit platform owner only | Cross-workspace activity, private projects, integration pulse, queue health |
| `/personal/projects` | Owner private project workspace | Explicit platform owner only | Personal projects, notes, milestones, saved work |
| `/personal/integrations` | Private connection and provider oversight | Explicit platform owner only | Integration status, audit history, provider configuration boundary |
| `/personal/operations` | Internal operational command | Explicit platform owner only | Jobs, incidents, audit events, platform controls |
| `/personal/admin` | Restricted administration | Explicit platform owner/admin policy | Tenant health, feature flags, plans, entitlements, audited support actions |

### Dashboard visual patterns

The Client SaaS dashboard is a precise operational workspace: restrained neutral surfaces, a compact utility rail, stable page titles, clear tables and filters, and no public-commerce elements. The Personal command dashboard is denser, more private, and data-led, with an owner-only activity stream and operational panels. Neither dashboard inherits the Evercrafted public editorial hero, catalog, or promotional layout.

### Velo service contract

The repository now contains `wix-velo/backend/evercraftedDashboard.web.js`, a **Client SaaS** web-method service contract based on documented `Permissions.SiteMember`, authenticated current-member lookup, and `@wix/data` query patterns. It exposes workspace discovery, member-scoped workspace overview, and owner/admin workspace operations. Each method derives the member identity on the server, verifies an active membership before tenant-bound reads, and never trusts a member identifier supplied by the caller. It does not grant access to the Personal command experience; that requires a separate explicit platform-owner resolver. The companion `wix-velo/README.md` defines its deployment and test boundary.

This source is intentionally not marked as live Wix code: the authenticated visual editor does not currently expose its code controls to the automation session, and no direct code-deployment endpoint has been verified. It remains the ready-to-deploy policy artifact for the next editor-access or supported code-deployment increment.

### Current platform constraints

The next CMS refinement requires Wix reference-field metadata. The verification request for that schema encountered a temporary connector timeout after earlier field refinement calls succeeded. No relationship field was created from an inferred request shape. Reference fields, native slug metadata, indexing, and live Velo deployment remain blocked until the Wix documentation/API connection returns a verified schema response.

## 6. Current Site Foundation

The isolated Wix site is published at the Wix-generated URL supplied at creation. Its initial configuration includes Wix Stores Catalog V3, Wix Members Area, Wix Forms, Wix Invoices, Velo, USD currency, US locale, and America/Chicago time zone. These are foundation facts for the migration audit; the site is not yet branded or populated with production catalog, Client SaaS, or Personal command data. The visible source template remains unchanged and is not an approved final design.

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

On 2026-08-17, the user also reported an error when attempting to interact with the editor session. No exact error text was supplied. The source template is therefore frozen: no live template page, font, color, review, product, or navigation mutation may be represented as complete until a stable Harmony editor session or documented supported alternative is available.
