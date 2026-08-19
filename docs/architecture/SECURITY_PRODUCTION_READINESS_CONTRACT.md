# Checkpoint E — Security and Production-Readiness Contract

## Scope

Checkpoint E hardens the shared Ever Engine without enabling a payment processor, renderer, provider, checkout, inventory reservation, publication, delivery, or external webhook source. Its controls govern the existing multi-tenant platform and establish safe configuration boundaries for later approved integrations.

| Control | Required behavior | Explicit non-goal |
|---|---|---|
| Central workspace authorization | Every protected sensitive operation uses one guard to verify active membership, non-archived workspace state, applicable role, optional project ownership, and optional capability/subscription/usage policy before side effects. | UI-only authorization or cross-workspace existence disclosure. |
| Upload hardening | Base64 payloads must be canonical, bounded, allowed by media type, and match supported file signatures. Object names are canonicalized from an allow-listed type, while asset, version, and audit records are written atomically. | Storing file bytes in MySQL, accepting executable/HTML/SVG payloads, or treating client file names/types as trusted. |
| Checkout origins | An exact platform owner may record a reviewed HTTPS origin as disabled or enabled. Later checkout work must accept only enabled origins and no origin is trusted by default. | Activating Stripe, creating a checkout session, accepting a payment, storing payment data, or exposing a public checkout endpoint. |
| Inventory privacy | Product-facing and guided Wreath records remain capability/provenance data only. Private supply, supplier, SKU, stock, cost, quantity, reservation, pricing, or provider identifiers are not exposed through public/tenant read models. | A commerce catalog, availability promise, material reservation, price quote, or checkout claim. |
| Database integrity | Version, audit, and related persistence writes use transactions; unique keys protect one origin per canonical origin and one receipt per provider event. | Destructive migrations or retroactive mutation of governed history. |
| Webhook idempotency | A provider-neutral receipt ledger accepts one event identity once and retains duplicate/rejected/processed state for a future verified event endpoint. | Receiving an unverified webhook, selecting a provider, or performing external side effects. |

## Required enforcement path

```text
Authenticated request
  → central workspace-operation guard
  → validate untrusted input
  → transaction / unique-key integrity boundary
  → scoped persistence and audit evidence
  → explicit provider-neutral response
```

## Protected data rules

The platform continues to retain uploaded bytes in S3 only. Database records retain only governed metadata, storage keys, checksums, provenance, permissions, and audit history. Configuration values are never returned by public procedures. Checkout and webhook records carry no payment credentials, payment method data, provider secret, external payload body, customer purchase, inventory reservation, or render/publication content.

## Completion criteria

Checkpoint E is complete only when the schema artifact is additive and applied, the central guard and input protections are in use at sensitive procedures, deterministic tests cover acceptance and rejection paths, TypeScript and production build pass, the managed database is verified, the governance records are synchronized, and the user reviews the deployed checkpoint before any later work begins.
