# ADR-0001: Tiered Hybrid Asynchronous Processing

**Status:** Accepted  
**Date:** 2026-08-17  
**Decision source:** User-approved architecture choice in EC-RUN-0001

## Context

Evercrafted requires notifications, webhook retries, asset/media processing, Studio progress tracking, and eventual heavy creative operations. A single request-only execution path would lose recovery capability, while a continuously running worker would impose persistent operating cost before demonstrated workload requires it.

## Decision

The platform will use a tiered hybrid design. Short, bounded work remains request-driven and writes durable audit/event records. Retryable and delayed work is first persisted to `backgroundJobs` with an idempotency key, status, progress, attempts, and maximum-attempt policy. A cron-authenticated scheduled recovery endpoint requeues stale work or marks exhausted jobs as failed without processing heavy media inside the HTTP handler. Heavy-media processing is represented by a provider-neutral interface; a dedicated processor is selected only after provider, security, cost, and workload review. A continuous worker can later consume the same durable job records without changing client or domain contracts.

## Consequences

The system avoids in-process timers and preserves work across instance restarts. The scheduled recovery endpoint must be deployed and explicitly scheduled before production retry guarantees are claimed. Provider-specific media generation, transcoding, email delivery, and publishing remain deferred until their adapter/secret/data-handling decisions are approved.
