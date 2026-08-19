# Guided Recipe and Blueprint Contract — Checkpoint C

**Work item:** `EC-CORRECT-008`  
**Status:** Approved for implementation after user review of Checkpoint B  
**Scope:** Recipe lock and simplified Blueprint foundation only

## Transaction boundary

> A Recipe is a versioned, immutable record of a **passing** My Wreath Tray snapshot. It is not an inventory reservation, purchase order, material order, construction instruction, or render request.

Recipe lock is allowed only when the current project has one latest `guidedFloralRoleSets` record, exactly one persisted Tray selection for each required role from that same role set, a compatibility report with outcome `pass`, and approved provenance for every selected reference family. A compatibility `warning` is deliberately not sufficient: the customer must resolve it or return to Florals before an immutable Recipe can be created.

The lock transaction must read the latest role set, current compatibility report, and selection snapshot, then write the Recipe, its role-preserving items, a Recipe stage approval, stage state, Memory Thread event, and audit record atomically. A failure produces no partially locked Recipe.

## Simplified Blueprint boundary

The Blueprint compiles only an approved Recipe snapshot. It is a customer-readable hierarchy summary that preserves the primary focal, supporting floral, directional accent, and greenery movement roles and their selected reference families. It describes **what the locked hierarchy contains** and explicitly identifies what has not yet been determined.

| Blueprint includes | Blueprint does not include |
|---|---|
| Locked Recipe version and source role-set version | SKU, vendor, price, stock, reservation, availability, or order data |
| Selected reference family and role hierarchy | Exact quantity, stem count, BOM, material substitution, or inventory resolution |
| Plain-language hierarchy and movement notes | Geometry, polar coordinates, clock positions, clusters, pockets, insertion behavior, depth, or build sequence |
| Derived-at timestamp, actor, and source provenance | ECR, renderer instructions, render prompt, provider task, render asset, publication, checkout, or delivery |

This preserves the supplied Blueprint system’s key principles—deterministic derivation, revision, approval, and stale provenance—while intentionally stopping before the full physical `MOODOOR_BP_V1` compiler and its inventory-resolved geometry.[1]

## Invalidation and history

Any future modification to a Tray selection after Recipe lock invalidates every non-stale Recipe and Blueprint derived from that role set. Existing records remain immutable history and are marked `stale` with a human-readable reason; they are never edited in place or silently recompiled. The next Recipe lock must create a new version from the new passing snapshot, and a new simplified Blueprint may then derive only from that new locked version.

Changing Essence, Story, or Floral role-set version is likewise treated as a downstream invalidation boundary in future checkpoints. Checkpoint C implements the selection-driven stale transition now and retains version/provenance fields for the broader dependency graph.

## Customer stages

| Stage | Customer action | Preconditions | Result |
|---|---|---|---|
| Florals | Resolve each role and compatibility feedback | Approved Essence and Story | Passing Tray snapshot |
| Recipe | Lock the passing Tray | Exactly four roles, no blocked or warning check, same latest role set | Immutable Recipe version |
| Blueprint | Generate the simplified Blueprint | Current locked, non-stale Recipe | Versioned hierarchy summary |
| Wreath / Outcome | Read the explicit next-step boundary | Future checkpoint approval required | No render, provider, order, or publication action |

## References

[1]: `moodoor/docs/BLUEPRINT_SCHEMA.md` — user-supplied source contract, audited 2026-08-19.
