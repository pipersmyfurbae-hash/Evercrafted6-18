# Evercrafted Shared Engine and Three-Experience Architecture

**Status:** Approved architecture; live Wix page implementation pending  
**Target site:** `4a20e429-d686-4f4d-8282-13454219024a`  
**Scope:** Evercrafted public brand and commerce, Client SaaS public conversion and protected workspace, and Personal owner-only command.

## Architecture Principle

The Wix CMS, Wix Members, Velo services, automations, audit model, and commerce configuration form **one shared engine**. The engine does not dictate a common interface. Each experience has an independent page group, navigation shell, visual system, and authorization boundary. A visitor must never encounter the Client SaaS or Personal information architecture while browsing Evercrafted commerce, and a Client SaaS member must never gain Personal access because they belong to a workspace.

| Experience | Public entry | Protected entry | Source of access truth | Explicit exclusions |
|---|---|---|---|---|
| Evercrafted | Brand, collections, journal, shop, contact | Customer account/checkout where applicable | Store/customer identity and public CMS content | No client operational controls, no Personal navigation |
| Client SaaS | SaaS landing, How It Works, capabilities, outcomes, access | Workspace overview, projects, Studio, reviews, deliveries, notifications, settings | Wix Member ID + active `WorkspaceMemberships` record + Velo role policy | No Store merchandising shell, no Personal operational data |
| Personal | None | Private command and administration | Explicit platform-owner policy verified in Velo; never inferred from workspace role | No public entry, no client-side access, no generic member visibility |

## Route and Layout Separation

The final Wix information architecture uses three route groups. Exact Wix page slugs will be configured only when the Harmony editor exposes page controls or a supported page-management capability is verified.

| Route group | Layout shell | Navigation | Pages |
|---|---|---|---|
| Evercrafted public | Editorial header, curated footer, commerce-aware page frame | Home, Collections, Journal, About, Contact, Shop, Account | Brand and commerce pages only |
| Client SaaS public | Product-marketing header, concise footer, access-focused calls to action | SaaS landing, How It Works, Capabilities, Outcomes, Access, Sign In | Conversion pages only |
| Client SaaS protected | Workspace rail, workspace switcher, account/profile control | Overview, Projects, Studio, Reviews, Deliveries, Notifications, Settings, Profile | Active members only |
| Personal protected | Private command rail, owner identity, operational status strip | Overview, Private Projects, Integrations, Operations, Admin | Explicit platform owner only |

## Shared Data Ownership

| Domain record | Engine source | Evercrafted visibility | Client SaaS visibility | Personal visibility |
|---|---|---|---|---|
| Store product/catalog data | Wix Stores V3 | Public commerce pages | None, unless a later entitlement experience explicitly links it | Read-only operational summary when needed |
| Public inquiry/leads | `evercrafted-leads` | Public form writes through approved form/backend flow | Public SaaS access request may create a tagged lead | Owner/admin operational read only |
| Workspaces and memberships | `evercrafted-workspaces`, `evercrafted-workspace-memberships`, invitations | Never rendered in public brand pages | Active workspace members only through Velo resolver | Cross-workspace owner summary only |
| Projects, assets, reviews, deliveries | Tenant-scoped Evercrafted CMS collections | Never public by default | Velo-authorized active workspace members | Owner scope only through dedicated private resolver |
| Notifications and audit events | Tenant-scoped CMS collections | No public exposure | Recipient/member or workspace role scope | Owner/admin operation scope |
| Plans, entitlements, feature flags | Shared commercial/operational collections | Public marketing reads only after explicit policy | Evaluated capability results only | Owner/admin management controls |

## Identity and Authorization Flow

1. A public visitor stays in the Evercrafted or Client SaaS public route group and receives no tenant data.
2. A person signing into Client SaaS resolves to a Wix Member identity.
3. The Velo service obtains the authenticated member identity server-side, finds an active workspace membership, validates the requested workspace, and then returns only workspace-scoped records.
4. Owner/admin workspace actions require a role check in addition to the active membership check.
5. Personal routes require a separate explicit platform-owner assertion. A workspace `owner` role is insufficient and does not grant Personal access.
6. Every sensitive change writes an audit event. Background work and provider operations remain backend-only.

The repository contains `wix-velo/backend/evercraftedPersonal.web.js` as the Personal route service contract. It resolves the current Wix member on the server, obtains the configured owner member ID from the backend-only `EVERCRAFTED_PLATFORM_OWNER_MEMBER_ID` secret, and rejects all nonmatching members. Its syntax check passes. Creating the secret, deploying the service, and testing the actual Wix role boundary remain pending; no owner identifier has been committed or placed in a CMS collection.

## Design Separation

The Evercrafted public experience is the only experience that uses the editorial hybrid: asymmetrical composition, larger image scenes, a calm material palette, and deliberate narrative pacing. The Client SaaS experience is functional, neutral, and conversion-led; it uses quick navigation, clear product explanation, and operational dashboard layouts. The Personal command experience is private, dense, and data-led. The source template’s vivid colors and bold typography are rejected across all three experiences.

## Delivery Gates

Before any page is published as complete, the implementation must demonstrate that public routes do not disclose tenant data, Client SaaS routes require active membership, Personal routes reject non-owners, client and Personal navigation do not appear in Evercrafted public pages, and the template review block is removed without adding any invented reviews, ratings, or testimonials.
