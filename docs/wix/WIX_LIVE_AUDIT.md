# Wix Live Audit — Target Site

> **Audit date:** 2026-08-19 EDT. This was a read-only audit of Wix site `4a20e429-d686-4f4d-8282-13454219024a`; no page, CMS, app, permission, Velo, automation, Store, member, or content mutation was made.

## Site context

| Area | Observed state | Disposition |
|---|---|---|
| Target | `My Site 6` (`4a20e429-d686-4f4d-8282-13454219024a`), published and on the Wix Free plan | Preserved as the future Wix port target, not the managed application runtime. |
| Editor and code | Odeditor; Velo enabled | The previous Harmony page/editor workflow is not represented by the available site-management API. No visual editor mutation was attempted. |
| Locale | English, United States, America/Chicago, USD | Retained as site configuration context. |
| Installed products | Wix Stores Catalog V3, Wix Members Area, Wix Forms, Wix Invoices, Promote SEO | Stores/Members are installed. Store catalog, checkout, member flows, and Evercrafted-specific automations remain deferred pending verified business configuration and a supported editor/deployment path. |
| Current integrations | Only the installed Wix products above were exposed in this read-only context | No external provider, secret, payment credential, or Velo deployment was observed or changed. |

## CMS audit and source-of-truth mapping

The versioned manifest contains **17** intended administrator-only collections. A consistent, ID-and-permissions-only read with `paging.limit=1000` and `paging.offset=0` returned `count: 17`, `offset: 0`, `total: 17`, and `tooManyToCount: false`. It therefore resolves the earlier first-page discrepancy: `evercrafted-workspaces`, `evercrafted-workspace-memberships`, and `evercrafted-workspace-invitations` exist; no CMS creation or restoration operation is required. All **17** returned collections have `ADMIN` permissions for insert, update, remove, and read.

| Reconciled administrator-only collection IDs | Manifest disposition |
|---|---|
| `evercrafted-organizations`, `evercrafted-workspaces`, `evercrafted-workspace-memberships`, `evercrafted-workspace-invitations` | Present; workspace identity, relationship, and invitation refinements remain subject to the approved Velo policy path. |
| `evercrafted-projects`, `evercrafted-assets`, `evercrafted-asset-versions` | Present; workspace/project/asset references and slug metadata remain pending native Wix metadata verification. |
| `evercrafted-review-requests`, `evercrafted-deliveries`, `evercrafted-notifications`, `evercrafted-audit-events`, `evercrafted-background-jobs` | Present; workflow, operational, and audit records remain administrator-only until Velo policy evidence exists. |
| `evercrafted-plans`, `evercrafted-workspace-entitlements`, `evercrafted-feature-flags` | Present; commercial and feature administration remain restricted. |
| `evercrafted-leads`, `evercrafted-integration-connections` | Present; public-form intake and integration metadata are not exposed to members. |

## Automation and integration audit

The read-only automation query returned the installed-app automation inventory. It includes Wix preinstalled notifications from installed products. A subsequent origin-filtered query returned exactly **three** active `APPLICATION` automations: `New submission received for Mailing list 1`, `New submission received for Contact Form`, and `New submission received for Mailing list`. These are form-submission email notifications associated with Wix Forms; they are not Evercrafted operational automations. The same filtered query returned no `USER` origin automation, and no automation was created, activated, updated, archived, or deleted.

| Audit boundary | Observed result | Consequence |
|---|---|---|
| Form submission notifications | Three active application-origin Wix Forms notifications | Preserve as current site behavior; do not repurpose them for workspace, member, billing, delivery, job-recovery, or Personal-command events. |
| Evercrafted automation design | No Evercrafted operational automation was observed | Remains deferred under `EC-WIX-008` pending the migration decision record, editor/deployment access, and a reviewed external-execution boundary. |
| External integrations and credentials | No external provider, secret, payment credential, or Velo deployment was exposed by the site context | Retain the managed project as the governed engine and configure any future Wix integration only through an approved, documented path. |

## Control conclusions

The live collection response confirms that all manifest CMS collection-level permissions are administrator-only, which preserves the policy baseline documented in `wix-config/evercrafted-cms-manifest.json`. The audit does **not** prove Velo member/role/tenant policy, editor availability, deployed Velo modules, Store payment configuration, member access behavior, or live page architecture. Those remain explicitly deferred and must not be inferred from this audit.

No template-provided reviews, ratings, testimonials, product claims, or customer content were read, created, or modified during the audit.

## Method sources

The audit used Wix's documented collection-listing and automation-query methods as read-only requests. The collection endpoint provides offset paging and returns paging metadata; the automation query supports paging, filtering, and origin inspection.[1] [2]

## References

[1]: https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/list-data-collections "Wix Data Collections: List Data Collections"
[2]: https://dev.wix.com/docs/api-reference/business-management/automations/automations/automations-v2/query-automations "Wix Automations: Query Automations"
