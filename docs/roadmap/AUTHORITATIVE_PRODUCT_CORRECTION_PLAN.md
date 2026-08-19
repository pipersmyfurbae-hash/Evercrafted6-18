# Authoritative Product Correction Plan

**Decision ID:** `EC-CORRECT-001`  
**Status:** Approved product direction; implementation begins with Checkpoint A only  
**Source:** User-supplied master handoff and source packages, summarized in `docs/architecture/AUTHORITATIVE_PRODUCT_HANDOFF_INVENTORY.md`

## 1. Correction statement

The current managed application has a sound governed foundation—authentication, workspace/role policy, asset metadata, version history, reviews, delivery records, audit logging, subscriptions, and owner-only controls—but it frames the product as a generic client-workspace SaaS. That is not the Evercrafted product.

> **Evercrafted is a guided memory-to-wreath design system.** Its client journey is **Memory → Essence → Story → Guided Florals → Recipe → Blueprint → Render → Outcome**. Its public entry points are Create From a Memory, Signature Wreath Collection, and Evercrafted Studio. The systems share governed data and authorization, but they do not share one generic workflow or visual shell.

The correction preserves validated backend controls. It replaces inaccurate public wording and the generic Studio framing with a staged implementation of the supplied product contract. No working engine is discarded solely to reproduce a supplied UI.

## 2. Current-versus-target reconciliation

| Area | Current managed state | Authoritative target | Correction decision |
|---|---|---|---|
| Public SaaS conversion | Generic private-workspace narrative, stages, capabilities, and access | Memory-led Wreath Creation, Signature Wreath Collection, Moodoor/Studio entry, verified pricing and How It Works | Replace public information architecture and copy; retain secure sign-in and membership infrastructure. |
| Client workspace | Generic projects, assets, reviews, delivery, notifications, settings | Guided customer journey with one meaningful decision at a time and persistent Memory Thread | Add a dedicated guided Wreath Creation route group rather than forcing customer flow into generic project controls. |
| Moodoor Studio | Generic project stage, file upload, review, delivery, provider-neutral handoff | Creator/operator render upload → analysis → package → publication, with advanced inventory, Blueprint, ECR, provenance, and production tools | Restore Moodoor as a separate creator/operator experience; keep technical intelligence outside Guided Mode. |
| Wreath Creation | No dedicated customer path | Memory, Essence approval, Story approval, curated floral roles, recipe lock, Blueprint, render, outcome | Implement checkpointed guided stages with approval and dependency gates. |
| Signature Wreaths | Generic editorial/commerce foundations | Discover, view Wreath, read Essence/Story, purchase or personalize | Restore a distinct public collection later; customization opens a new Memory Thread. |
| Upload and analysis | Generic governed asset upload | Moodoor source-render upload, safe analysis, persisted package, provenance, controlled publication | Reintroduce a hardened separate workflow; do not treat every workspace asset as a Moodoor render. |
| Pricing | Billing model scaffolding but no customer-facing product model | Verified commission, product, and access model only | Present a non-claiming pricing/access shell first; connect actual price/provider data only after approval. |

## 3. Route and experience architecture

| Route group | Experience | Audience | Initial status |
|---|---|---|---|
| `/create` | Wreath Creation entry | Public/customer | Build in Checkpoint A. Starts a private draft only after sign-in or approved handoff. |
| `/create/:projectId/:stage` | Guided Wreath Creation | Authorized customer/project member | Build in Checkpoint A with Memory, Essence, Story, Florals, Recipe, Blueprint, Wreath, and Outcome framing. |
| `/how-it-works` | Public product explanation | Public | Replace generic SaaS explanation with the exact guided journey and privacy/approval boundaries. |
| `/pricing` | Product and commission/access information | Public | Build a verified-information shell; no invented price, availability, or subscription claims. |
| `/signature-wreaths` | Signature Wreath Collection | Public/customer | Restore in a later public-commerce increment; “Personalize with my memory” begins a new Wreath Creation project. |
| `/moodoor` | Moodoor upload and package entry | Authenticated creator/operator | Restore only after Checkpoint A; distinct upload/analysis/package language. |
| `/moodoor/runs/:id` | Package authoring and provenance | Authorized creator/operator | Restore with persisted run, source render, analysis, artifact, and publication state. |
| `/studio/*` | Advanced internal workbench | Owner/authorized operator | Evolve from the supplied Moodoor source after the creator flow is stable; no generic client dashboard treatment. |
| `/app` and `/projects` | Existing managed workspace infrastructure | Authorized members | Retain as supporting infrastructure; no longer describe as the primary Evercrafted customer product. |

## 4. Checkpoint A — Guided Journey Shell

Checkpoint A is the only build increment authorized before visual and behavior review. It establishes the customer-facing guided shell but does **not** claim inventory curation, recipe generation, Blueprint completion, rendering, payment, or publication is live.

### 4.1 Data model additions

| Entity family | Purpose | Initial fields and guarantees |
|---|---|---|
| `memoryEntries` | Client memory captured once per project | `projectId`, body, source version, privacy/consent references, author, timestamps; tenant-scoped. |
| `essenceProfiles` | Client-readable interpretation | Emotional center, atmosphere, movement, visual tension, palette direction, expression/avoidance, source grounding, generation source, version, approval state. |
| `memoryStories` | Grounded Memory Story and internal Design Signals | Story excerpt/body, source citations to memory fragments, unsupported-claim flags, structured signals, version, approval state. |
| `guidedStageStates` | Save/resume and stage navigation | Project, current stage, completion/blocked state, dependency explanation, timestamps; no blind client-side progression. |
| `stageApprovals` | Immutable approval decisions | Project, stage, version/reference, decision, comment, actor, timestamp; supports review, correction, and audit. |
| `memoryThreadEvents` | Expandable provenance trail | Stage, source entity/version, summary, direct-source flag, actor, timestamp. |
| `memoryConsents` | Separate privacy choices | Memory, story, wreath image, Lookbook, marketing, anonymous improvement, visibility state, revocation metadata. |

Every project-scoped procedure must use the central tenant and role guard. Existing `projects`, `assets`, audit records, S3 helpers, membership policy, and versioned storage are retained; no uploaded memory or render byte is stored directly in the database.

### 4.2 Guided UI contract

| Stage | Customer sees | Required action | Boundary |
|---|---|---|---|
| Memory | A calm free-writing field, optional prompts, privacy choice, explicit save | Save memory once | No forced repetition; no generated fact presented as source. |
| Essence | “Your Essence” summary: emotional center, atmosphere, movement, palette, expression, avoidances | “This feels true” or “Let me adjust it” | Unapproved Essence blocks Story generation. |
| Story | Meaningful excerpt, expandable full story, visible source-grounded details, interpretation distinction | Approve or correct story | Story cannot select flowers, inventory, roles, or geometry. |
| Florals | A clearly marked coming-next/progress stage in Checkpoint A | Continue only when later capability exists | Do not show fake candidates or claim real inventory curation. |
| Recipe | A clearly marked dependency-gated stage | Not actionable in A | No recipe lock until curated role persistence exists. |
| Blueprint | Simplified placeholder with dependency explanation | Not actionable in A | No generated composition or greenery claims. |
| Wreath | Render/outcome preview with dependency explanation | Not actionable in A | No paid render, provider task, or invented outcome. |
| Outcome | Commission/purchase/save future state | Not actionable in A | No price, checkout, reservation, or availability claim. |

### 4.3 Source-grounding behavior

The first engine improvement is a deterministic source-grounding validator. It records which memory fragments support a proposed Essence/Story statement, distinguishes interpretation from direct fact, flags unsupported factual claims, and blocks approval when a material unsupported biographical claim is detected. Any unavailable AI or analysis provider yields a labelled `fallback`/`awaiting_approval` result; it never silently advances the project.

Checkpoint A initially permits a customer to enter and persist their own Memory, and permits a deliberately marked draft Essence/Story review state. It must not fabricate sample memories, floral recommendations, people, losses, events, locations, or wreath construction. A generated Story may be enabled only after an approved source-grounded generator and test fixture set are ready.

## 5. Moodoor upload restoration plan

Moodoor is restored separately from customer Wreath Creation. Its entry is **render → upload → analyze → package → publish**, based on the supplied `StoriesStudio` and `studioPipeline` references. It requires a dedicated source-render entity, safe image inspection, distinct territory/memory context, persisted analysis, source/generation provenance, package artifacts, and an explicit publication approval.

The generic `Studio.tsx` asset/review/delivery controls are not deleted. They are supporting governed infrastructure, but they cease to be branded as the primary Moodoor workflow. In the restored Moodoor flow, a source render is an approved upload type with MIME, decoded-byte, signature, dimensions, ownership, and project-context checks. Analysis output remains reviewable, versioned, and separated from public publication; a package cannot become a Signature Wreath/Lookbook/library item by default.

## 6. Follow-on checkpoints

| Checkpoint | Deliverable | Explicit gate before next checkpoint |
|---|---|---|
| A | Guided Journey Shell, grounding/approval/provenance foundation, navigation, save/resume, accessible stages | Working visual walkthrough and approval. |
| B | Inventory Weaver, sanitized 3–6 candidates per role, adaptive explanations, My Wreath Tray, compatibility and draft persistence | Real inventory boundary, role/selection/ownership tests, approval. |
| C | Transactional Recipe lock, `RECIPE_INCOMPLETE`, deterministic Blueprint, greenery pockets, buildability gating | Recipe-only inputs, version/invalidation tests, approval. |
| D | Immutable render manifest, manual provider workflow, upload/review/version history, Design Meaning, purchase/commission outcome | Provider/cost/availability policy review and approval. |
| E | Authorization hardening, upload/artifact security, consent, checkout origin, database integrity, fallback tracking | Security and operational evidence. |
| F–H | Comparison support, controlled revision/history, uniqueness, derivative/Signature personalization | Separate approvals at each completed visual increment. |

## 7. Non-negotiable safeguards

The correction must not expose proprietary inventory scoring, supplier data, raw ECR/Blueprint geometry, internal production controls, or another workspace’s work to customers. It must not invent memories, stories, customer testimonials, products, prices, inventory states, ratings, or commercial claims. It must not silently substitute selected florals, treat a Store purchase as workspace authorization, use a generic asset upload as an approved render, or allow a renderer to invent a design outside the locked recipe and approved Blueprint.

## 8. Acceptance decision

This plan authorizes source reconciliation and Checkpoint A implementation only. The resulting working Guided Journey Shell must be presented for review before the Inventory/Florals, Recipe/Blueprint, Render/Outcome, Moodoor upload, Signature Wreath, or public pricing increments proceed.
