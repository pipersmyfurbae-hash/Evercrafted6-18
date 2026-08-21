# Controlled Revision and Comparison Contract — Checkpoint F

**Work item:** `EC-CORRECT-011`  
**Scope:** Read-only render-package comparison and a controlled client revision-request record for the Guided Wreath journey.

> Checkpoint F lets a customer see how saved, immutable Render Package versions relate and record why an approved package should not continue to a manual handoff. It does not alter a package, redesign a Recipe or Blueprint, call a renderer, generate an image, or create a commercial Outcome.

## Comparison boundary

The comparison read model exposes only project-scoped Render Package provenance: package/version/status, Recipe and Blueprint version references, retained role-family snapshot, hierarchy notes, and the explicit exclusions already present in the render manifest. It may compare two package snapshots by source version and role-family name.

It never exposes raw memory beyond the existing authorized journey, supplier data, proprietary scoring, quantity, SKU, vendor, cost, stock, reservation, geometry, construction instructions, provider credentials/tasks, image bytes, pricing, checkout, order, delivery, Lookbook, or publication data.

## Controlled revision request

| Gate | Required state | Result |
|---|---|---|
| Revision request | The selected Render Package is current and `approved` | One append-only revision-request record with concise customer reason, actor, time, and source package/version. |
| Manual handoff after request | A revision request is still `requested` | Blocked. The customer must resolve the design direction through the existing source-safe Guided Florals → Recipe → Blueprint path. |
| Source selection revision | An upstream saved Tray selection changes | Existing Recipe, Blueprint, Render Package, handoff, and related revision request become immutable `stale` history with the same explanatory reason. |
| Replacement package | A later current Recipe/Blueprint exists after the controlled upstream path | A separate later checkpoint/package flow; this checkpoint never mutates or silently replaces an approved package. |

The request is a review decision, not an instruction to a provider. It cannot silently substitute a reference family or amend source artifacts. A future controlled revision workflow may introduce an explicitly approved replacement artifact only after the client revisits the existing source-safe selections and all downstream provenance gates pass again.

## Explicit exclusions

Checkpoint F does **not** configure or call a rendering provider, upload or review render output, reserve materials, expose inventory, set price or availability, initiate checkout, create an order, fulfil a commission, deliver a product, publish a Lookbook/library item, create derivative/Signature personalization, or unlock Outcome.

## References

[1]: `AUTHORITATIVE_PRODUCT_CORRECTION_PLAN.md`, §6–7 — approved follow-on checkpoint and non-negotiable safeguards.  
[2]: `AUTHORITATIVE_PRODUCT_HANDOFF_INVENTORY.md`, Guided and Studio separation / Render workflow conditions — controlled revisions and version history remain in Guided Mode while provider and production complexity stays in Studio.  
[3]: `RENDER_PACKAGE_CONTRACT.md` — immutable package provenance, stale history, and provider-neutral handoff constraints.
