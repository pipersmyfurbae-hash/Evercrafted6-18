# Render Package Contract — Checkpoint D

**Work item:** `EC-CORRECT-009`  
**Scope:** Immutable render package, client package approval, and manual provider-neutral handoff intent only.

> A render package is a versioned evidence manifest. It tells a future renderer what must be preserved from the approved Recipe and simplified Blueprint; it does not call a renderer, generate an image, add an inventory claim, reserve materials, charge a client, or publish an outcome.

## Required gates

| Gate | Required state | Result |
|---|---|---|
| Package preparation | Latest Recipe is `locked`; its Blueprint is `ready`; both belong to the same project and no stale dependency exists | Immutable package snapshot with Recipe, Blueprint, source-role hierarchy, and style/atmosphere boundaries |
| Client package approval | Package is current and `draft` | Append-only `wreath` stage approval and package `approved` state |
| Manual handoff request | Package is current and `approved` | Non-secret, provider-neutral handoff intent with an auditable requester and status; no provider call or automatic job |
| Render result | Later controlled upload/review checkpoint | Explicitly out of scope: no image, render asset, provider result, QC, publication, checkout, delivery, or Lookbook is created here |

The package preserves the approved Recipe and Blueprint versions, memory/Essence/Story references available through their upstream provenance, four selected reference family snapshots, hierarchy notes, and an explicit renderer rule: **visualize the approved design without redesigning it or inventing materials**. It deliberately omits quantity, SKU, vendor, supplier cost, stock, reservation, geometry, construction, provider credential, provider task identifier, price, payment, checkout, and publication data.

## Stale history

Changing a Tray selection stales its locked Recipe, simplified Blueprint, and every dependent render package/handoff. The records remain immutable history with an explanatory stale reason. A replacement package may only derive from a newly locked Recipe and current Blueprint; no prior handoff is silently reused.

## Manual provider boundary

“Request manual handoff” records a human-operation intent. It is not an API call, background job, cost preflight, provider configuration, prompt submission, or result upload. A future provider adapter must validate the same package identity and current-status gate, record its non-secret task reference, preserve failure/retry history, and require a separately approved artifact review path.

## References

[1]: `EVERCRAFTED_DEVELOPER_MASTER_HANDOFF.md`, §§8 and 14 — user-supplied render contract and Checkpoint D directive, audited 2026-08-19.
