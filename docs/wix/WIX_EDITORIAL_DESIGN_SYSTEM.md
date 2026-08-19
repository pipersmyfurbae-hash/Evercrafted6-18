# Wix Editorial Design System — Evercrafted Public Experience

**Design decision:** `EC-WIX-003`  
**Status:** Approved implementation specification; not yet applied to the Wix target  
**Scope:** Evercrafted public editorial and commerce routes only  
**Target:** `My Site 6` (`4a20e429-d686-4f4d-8282-13454219024a`)

## Purpose and implementation boundary

This specification converts the approved Evercrafted design direction into a Wix-ready editorial system. It is intentionally **not** a global platform theme. Evercrafted public and commerce routes use a calm, architectural visual language; Client SaaS retains its clear operational system; Personal remains a private, dense command system. The shared engine does not imply a merged visual experience.

The current Harmony editor/session and code-deployment constraints mean this record authorizes **no live page, theme, font, Store, CMS, Member, Velo, or content mutation**. It is the exact implementation target for a later verified editor or supported page-management path.

> The approved hybrid retains the two reference templates’ **compositional dynamics**—image cadence, asymmetric narrative transitions, and considered commerce placement—while explicitly rejecting their colors, typography, promotional voice, and testimonial treatment.

## 1. Editorial tokens

The palette is neutral-first. Color is used to establish material depth and information hierarchy, not to create promotional urgency.

| Token | Value | Intended application | Prohibited use |
|---|---:|---|---|
| `ec-bone` | `#F6F3EE` | Main page field, calm navigation surface, light editorial cards | Disabled text or low-contrast fine print |
| `ec-limestone` | `#E6E0D6` | Section changes, filters, quiet utility surfaces | Full-screen promotional color blocks |
| `ec-stone` | `#BEB3A4` | Rules, inactive controls, metadata separation | Primary body copy on bone |
| `ec-smoked-oak` | `#6B5A4A` | Material annotation, selected subtle accents | Primary call-to-action fill |
| `ec-graphite` | `#23211F` | Headlines, body copy, primary navigation, active controls | Large uninterrupted dark marketing fields |
| `ec-mineral` | `#50645B` | Restrained selected-state or informational accent | Revenue/discount urgency, decorative gradients |
| `ec-paper` | `#FFFEFB` | Form fields, product specification panels, modal content | Detached card mosaics that fragment the page |

Primary body text must use `ec-graphite` on `ec-bone` or `ec-paper`. Every text/background pairing must be checked at its rendered size against the WCAG contrast criterion; normal-size text requires a contrast ratio of at least 4.5:1.[1]

## 2. Typography and information hierarchy

Evercrafted uses a high-contrast editorial serif only as a display instrument and a quiet sans-serif for reading, navigation, product facts, forms, and commerce utility. The final Wix font selection must be confirmed in the editor against available licensing and rendering behavior; this system specifies the role, proportion, and fallback behavior rather than assuming a font is currently enabled.

| Role | Preferred character | Scale and treatment | Usage boundaries |
|---|---|---|---|
| Display serif | High-contrast, bookish, measured; target reference is the managed application’s Newsreader treatment | `clamp(2.6rem, 5.6vw, 6rem)`, 0.94–1.02 line height, minimal tracking | H1, occasional H2, image-band captions; never dense product metadata or buttons |
| Editorial sans | Humanist, calm, highly legible | 1rem base, 1.55–1.7 line height, normal tracking | Body, narrative decks, forms, utility navigation |
| Navigation sans | Same family with medium weight | 0.75–0.9rem, 0.08–0.14em tracking for labels | Header, filters, metadata, utility links |
| Specification sans | Same family with tabular numeral support where available | 0.82–0.95rem, 1.4 line height | Dimensions, material notes, cart and checkout facts |

All-caps text is reserved for small section labels and should never carry essential instructions. Body copy must remain sentence case and readable at mobile zoom. Template headline fonts, oversized promotional weights, and novelty display faces are excluded.

## 3. Layout, rhythm, and compositional dynamics

The page system should feel assembled from rooms and pauses rather than stacked campaign modules. It uses a 12-column desktop grid, a six-column tablet grid, and a four-column mobile grid. Horizontal gutters are 32–48 px on desktop, 20–24 px on tablet, and 16–20 px on mobile. The max editorial content width is 1440 px; long reading text is constrained to 620–720 px.

| Rhythm token | Value | Applied to |
|---|---:|---|
| `space-1` | 8 px | Inline icon/label spacing, fine rules |
| `space-2` | 16 px | Form label groups, compact card internals |
| `space-3` | 24 px | Navigation groups, product metadata groups |
| `space-4` | 40 px | Section-intro spacing, medium cards |
| `space-5` | 64 px | Standard public section padding |
| `space-6` | 96 px | Major narrative transition |
| `space-7` | 144 px | Hero-to-story and story-to-collection transitions on desktop |

The public home sequence is: a quiet header; an image-led opening; an editorial split story; curated collections; a Studio or journal narrative interval; product curation placed after context; a consent-aware contact path; and a sparse editorial footer. No block may be inserted solely to imitate the template’s sale, countdown, social-proof, or card-grid cadence.

### Approved compositional patterns

| Pattern | Intended result | Constraints |
|---|---|---|
| Full-bleed architectural opening | A patient visual entry with a concise craft statement | One primary image, descriptive alt text, copy remains readable without image context |
| Asymmetric editorial split | Image and narrative move at different widths to create a project-story rhythm | Maintain source order and a single-column mobile order; no text overlay that compromises contrast |
| Image band | Creates a material or spatial pause between content chapters | Use only authentic approved architectural, craft, product, or project imagery |
| Curated product interval | Reintroduces commerce after editorial context | Three or fewer visible feature cards at a time; no discount-first language, false scarcity, or ratings |
| Narrow provenance column | Grounds objects in source, material, and use | Product claims must be approved and verifiable; omit unknown facts rather than inventing them |

## 4. Components and interaction rules

The header carries only the Evercrafted wordmark, public editorial navigation, Store/cart utility where configured, and Account. It must not expose Client workspace rail controls, workspace switching, Personal routes, or internal administration. The footer carries Journal, support, contact, policies, account, and approved social or brand utilities; it excludes operational-client navigation.

| Component | Required treatment | Accessibility and behavior |
|---|---|---|
| Primary action | Graphite text or fill used sparingly; simple verb-led label | Visible focus ring, minimum 44 px touch target, no ambiguous icon-only purchase action |
| Secondary action | Text link with directional cue; no button-shaped imitation | Underline or clear focus-state differentiation; keyboard reachable |
| Product card | Art-directed media, concise name, approved material/specification data, restrained cart entry | Image alt describes content; price/availability must come from verified Store data |
| Filter/sort controls | Sparse and context-specific | Must work with keyboard and communicate selected state without color alone |
| Form | Paper surface, concise labels, privacy-appropriate purpose text | Labels remain visible; errors are programmatically associated and announced |
| Modal/drawer | Used only for necessary commerce or account tasks | Focus management, labelled close control, escape-key support |
| Empty state | Plain explanation and one next action | No fictional activity, shoppers, reviews, or claims |

## 5. Imagery, content, and commerce boundaries

Imagery must be authentic, rights-cleared, and specific to approved architectural, craft, product, project, or material subject matter. Crops should prefer natural light, texture, restraint, and room to breathe. Decorative collage, high-saturation influencer styling, artificial lifestyle excess, and unverified product detail are excluded.

No rating, star treatment, review, testimonial, customer quote, customer count, client logo claim, scarcity claim, sale timer, fabricated stock state, or invented product fact may be added. The template review block must remain absent until authentic, permissioned source material is available. Where a catalog fact, price, inventory state, or legal policy is not verified, the page should omit it or display a neutral future-data state rather than invent it.

Store features, when approved, are limited to the Evercrafted commerce journey: catalog, collection, product, cart, checkout, and customer account. A Store order never grants Client workspace membership, Client SaaS capability, Personal access, or platform-owner status.

## 6. Motion, responsive behavior, and accessibility

Motion exists to clarify hierarchy, not to decorate the page. Section entry may use a 180–240 ms opacity and 8–16 px translation transition; controls use 120–160 ms state feedback. No auto-advancing carousel, looped ambient movement, parallax dependency, or animation from `scale(0)` is permitted. Nonessential motion is disabled for `prefers-reduced-motion`.

On mobile, the opening becomes a readable single-column sequence; large image moments retain their narrative position but use shorter vertical spans; utility navigation collapses into a labeled menu; and product cards become one or two columns only when imagery and facts remain legible. Touch controls retain at least 44 px targets. Heading levels, skip navigation, visible focus, semantic landmarks, error text, responsive image alternatives, and keyboard control are implementation requirements rather than a post-launch review item.[1]

## 7. Explicit separation matrix

| Surface or decision | Evercrafted public | Client SaaS | Personal |
|---|---|---|---|
| Primary tone | Calm, architectural, editorial | Clear, restrained, operational | Private, dense, data-led |
| Header or rail | Editorial header, Store and Account utility | Product header or authenticated workspace rail | Owner-only command rail |
| Imagery | Architectural, craft, material, approved product/project images | Process diagrams and restrained operational support | No public storytelling imagery |
| Primary information | Collections, products, journal, contact | Workflows, projects, reviews, deliveries, workspace state | Operations, private projects, integrations, audit and platform status |
| Must never appear | Workspace switcher, Client dashboard rail, Personal controls | Store catalog promotions, Personal controls | Public marketing, Store catalog, Client navigation |

## 8. Delivery checklist and current deferral

Before a Wix visual implementation can be marked complete, a supported editor or page-management path must be available; the current template review/testimonial block must be removed; the page structure must use this system only on Evercrafted public routes; verified assets and factual catalog/legal content must be supplied; desktop and mobile visual review must pass; keyboard and contrast review must pass; and the final configuration must be reflected in the repository governance records.

Until those conditions are met, this document is the approved source of design intent. It does not represent a live Wix visual edit or a release-ready public site.

## References

[1]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html "W3C WCAG 2.2: Understanding Success Criterion 1.4.3, Contrast (Minimum)"
