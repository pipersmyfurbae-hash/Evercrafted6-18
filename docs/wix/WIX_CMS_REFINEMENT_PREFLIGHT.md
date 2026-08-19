# Wix CMS Refinement Preflight

**Date:** 2026-08-19 EDT  
**Target site:** `4a20e429-d686-4f4d-8282-13454219024a`  
**Status:** Read-only preflight complete; no CMS field mutation made in this record.

## Verified preconditions

All 17 `evercrafted-*` collections returned `totalCount: 0` through a consistent, read-only item-count request. The current schema inventory confirms that every planned relationship candidate is currently a `TEXT` field and that the organization, workspace, and project `slug` fields are currently `TEXT`. Since Wix does not migrate existing values when a field type changes, the empty-data condition is a mandatory precondition for any type conversion.[1] [2]

| Refinement family | Verified target fields |
|---|---|
| Slugs | `evercrafted-organizations.slug`, `evercrafted-workspaces.slug`, `evercrafted-projects.slug` |
| Organization relationship | `evercrafted-workspaces.organizationId` → `evercrafted-organizations` |
| Workspace relationships | `workspaceId` in memberships, invitations, projects, assets, asset versions, review requests, deliveries, notifications, audit events, background jobs, workspace entitlements, feature flags, and integration connections → `evercrafted-workspaces` |
| Project relationships | `evercrafted-assets.projectId`, `evercrafted-review-requests.projectId`, and `evercrafted-deliveries.projectId` → `evercrafted-projects` |
| Asset relationships | `evercrafted-asset-versions.assetId` and `evercrafted-review-requests.assetId` → `evercrafted-assets` |
| Asset-version relationship | `evercrafted-assets.currentVersionId` → `evercrafted-asset-versions` |
| Job relationship | `evercrafted-deliveries.handoffJobId` → `evercrafted-background-jobs` |
| Plan relationship | `evercrafted-workspace-entitlements.planId` → `evercrafted-plans` |

## Documented mutation shape

Wix's non-destructive field patch endpoint is `PATCH /wix-data/v2/collections/{dataCollectionId}/patch-field`. A patch requires a field object containing its existing `key`. For a `REFERENCE` field, the API schema requires `typeMetadata.reference.referencedCollectionId`. `SLUG` is listed as a supported field type and does not require complex type metadata. The administrator-only collection permission baseline remains unchanged by the planned field-level updates.[1]

The planned mutation must stop and preserve error evidence if the zero-record precondition, expected `TEXT` source type, or documented response shape is not met. It must make no permission changes and must be followed by an ID/type read-back for all expected fields.

## Harmony compatibility outcome

The zero-record and source-type preconditions were satisfied, but the target site rejected the documented native-field transitions before applying them. The field patch operation rejected the reference payload with `WDE0075` unsupported update-mask paths. The documented full-field update fallback then returned `WDE0080`: `REFERENCE` is not supported for this Harmony site. No reference conversion was applied.

The same documented full-field fallback accepted the `SLUG` type as a concept but rejected the organization's empty `slug` conversion with `WDE0075: Slug metadata not provided for slug field`. The published update-field schema exposes the `SLUG` enum but does not expose the required Harmony slug-metadata object, and the documentation search did not return a verified Harmony-specific request shape. No slug conversion was applied.

| Refinement target | Verified state after attempts | Decision |
|---|---|---|
| 22 relationship candidates | Remain `TEXT`; all 17 collections retain `ADMIN` insert, read, update, and remove permissions | **Deferred.** Do not infer an alternate `REFERENCE` payload or relax collection permissions. Revisit only when Wix provides a supported Harmony relationship-field path. |
| Organization, workspace, and project slug candidates | Remain `TEXT` pending verified Harmony slug metadata | **Deferred.** Do not infer metadata or alter the established URL strategy. Revisit only with an official request schema or an available supported editor/configuration path. |

The failed requests were validation rejections and created no CMS records, no field conversion, and no permission change. The versioned manifest intentionally continues to label these targets as `TEXT_PENDING_REFERENCE` and `TEXT_PENDING_SLUG_METADATA`.

## References

[1]: https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/patch-data-collection-field "Wix CMS: Patch Data Collection Field"
[2]: https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/count-data-items "Wix CMS: Count Data Items"
[3]: https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/update-data-collection-field "Wix CMS: Update Data Collection Field"
[4]: https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/get-data-collection "Wix CMS: Get Data Collection"
