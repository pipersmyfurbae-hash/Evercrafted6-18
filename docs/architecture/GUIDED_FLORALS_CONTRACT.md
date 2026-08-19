# Guided Florals and My Wreath Tray Contract

**Product checkpoint:** `EC-CORRECT-007`  
**Scope:** Checkpoint B of the authorized Evercrafted Wreath Creation journey  
**Authoritative reference:** User-supplied Moodoor role orchestration, botanical qualification, selection, and inventory-source modules.

## Purpose

Guided Florals is the bridge between an approved Memory Story and a future Recipe. It gives a customer a small, understandable set of **role-first** botanical possibilities and a persistent **My Wreath Tray**. It does not create a recipe, reserve an item, expose vendor data, select an SKU, calculate a price, promise availability, or generate an arrangement.

> A floral role is a visual job—not an unreviewed material commitment. The first selection is always a **primary focal**; a later role supports, connects, directs, accents, or carries greenery movement without becoming a second focal event.

## Source and catalog boundary

The supplied Moodoor source contains botanical capability fixtures. Checkpoint B imports their family-level names and capability vocabulary into a platform-managed **reference catalog**, not into a storefront inventory. Every catalog item carries a source version and `reference_fixture` provenance, while availability remains `unverified`. It exposes no source SKU, vendor, unit cost, stock count, product price, or purchase claim.

| Catalog family | Customer-visible role potential | Availability statement |
|---|---|---|
| Peony, Hydrangea | Primary focal | Reference family only; no live availability claim |
| Ranunculus | Supporting floral | Reference family only; no live availability claim |
| Delphinium, Thistle | Directional or textural accent | Reference family only; no live availability claim |
| Eucalyptus, Ruscus, Fern | Greenery movement | Reference family only; no live availability claim |

## Role contract

| Role key | Customer-facing purpose | Visual constraint | Required in Checkpoint B |
|---|---|---|---|
| `PRIMARY_FOCAL` | Gives the approved emotional center one concentrated visual anchor | It is the only dominant floral role | Yes |
| `SUPPORTING_FLORAL` | Frames the focal presence without becoming a second focal event | Moderate scale and clustered or nested relationship | Yes |
| `DIRECTIONAL_ACCENT` | Carries movement outward or creates a measured directional release | Restrained, line/spray-like, and not overfilled | Yes |
| `GREENERY_MOVEMENT` | Builds the movement field around the floral hierarchy | Branching, trailing, or lifting movement; no geometry | Yes |

Role labels, requirement descriptions, and candidate explanations are persisted with the project so a future Recipe can distinguish the original approved customer selection from a later material or build record.

## Candidate and compatibility contract

Candidate ranking is deterministic and explainable. A candidate begins with its permitted role category, then receives positive evidence from overlapping form, movement, surface, and palette-direction vocabulary in the approved Essence/Story. The response exposes the matching evidence and any tension; it must not present a numerical score as a prediction of beauty, quality, stock, or purchase readiness.

| Compatibility check | Result | Effect |
|---|---|---|
| More than one dominant role | `blocked` | The tray cannot advance. |
| No primary focal selected | `blocked` | The tray cannot advance. |
| Fewer than two distinct botanical families | `warning` | The customer may continue after seeing the repetition warning. |
| Missing one of the four required roles | `blocked` | The tray remains incomplete. |
| Directional accent and greenery both have no movement evidence | `warning` | The tray explains that movement will need review in the Recipe/Blueprint phase. |
| Candidate provenance is not `reference_fixture` or `vetted` | `blocked` | The candidate is excluded. |

## State transitions and authorization

The candidate service may run only when the latest project Story is approved and the caller is an active authorized workspace member with a role other than `viewer`. Candidate sets are snapshots tied to a particular approved Essence/Story version. Selecting a candidate writes a tenant-scoped tray selection and an audit/thread event; it never changes the catalog item or another project’s tray.

Once all required roles are selected and no blocking compatibility error remains, the project stage advances to `recipe` with status `blocked` and the explicit message: **“Your Wreath Tray is ready. Recipe lock is the next reviewed product checkpoint.”** The Recipe, Blueprint, Wreath, and Outcome stages remain non-actionable in Checkpoint B.

## Explicit non-goals

Checkpoint B does not use a model to invent floral names or choose material. It does not persist vendors, SKU data, stock, quantities, pricing, checkout state, recipe proportions, green-pocket geometry, construction instructions, image/render prompts, provider jobs, or publication eligibility. It also does not expose a global reference catalog as a cross-workspace customer data surface.
