# Personal Command Experience Specification

**Status:** Approved implementation draft; not yet applied in Wix  
**Access:** Explicit platform owner only through the dedicated Velo policy contract.

## Purpose

Personal is a private command experience for the platform owner. It is not a client workspace, public brand site, or generic administration page. It concentrates private priorities, cross-workspace oversight, integration status, audit activity, and restricted operations in one quiet environment.

## Page Structure

| Route | Page title | Primary modules | Empty state |
|---|---|---|---|
| `/personal/overview` | Command | Priority strip, cross-workspace pulse, recent activity, job health, integration pulse | “Your command view will surface activity once workspaces and operations are active.” |
| `/personal/projects` | Private Projects | Personal project list, milestones, notes, status filter, creation action | “No private projects yet. Start with a focused initiative.” |
| `/personal/integrations` | Integrations | Provider connection state, last verified time, unresolved attention states, audit links | “No connections are configured. Add only providers with an approved purpose and owner.” |
| `/personal/operations` | Operations | Background jobs, retry/dead-letter state, platform events, operational filters | “No queued work requires attention.” |
| `/personal/admin` | Administration | Tenant health, plans, entitlements, feature flags, audited support controls | “No administrative action is currently required.” |

## Layout and Tone

The Personal rail is compact and private: command, projects, integrations, operations, and administration. The top bar carries owner identity, a global private search entry, and system status only. The layout uses a charcoal navigation surface, parchment main surface, restrained borders, and small mineral status indicators. It does not use commerce imagery, client promotional calls to action, sales language, or brand storytelling.

## Authorization and Data Rules

Every route checks the explicit platform-owner secret through `evercraftedPersonal.web.js`. The Personal page must show a generic access-denied state rather than disclosing whether a protected resource exists. Data returns are policy-specific: cross-workspace summaries, system health, and audit activity are acceptable; raw tenant content should be shown only where the owner has an operational reason and the query is recorded as an audit event.

## Initial UI Copy

**Overview title:** Command

**Overview subtitle:** A private view of what is moving, what needs attention, and what should remain in view.

**Integrations subtitle:** Connections are useful only when their purpose, access, and record are clear.

**Operations subtitle:** Keep work recoverable, visible, and appropriately bounded.

**Administration warning:** Administrative actions affect platform behavior. Every sensitive action is recorded.
