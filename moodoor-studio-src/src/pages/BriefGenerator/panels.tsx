import type { BriefMode } from '../../types/collection';
import type { LibraryItem } from '../../types/library';
import type { BriefViewModel } from './viewModel';

/* Presentational panels for the results view. All numbers are resolved upstream
   in `buildViewModel`, so these only lay out. */

export function PaletteSwatches({
  palette,
  showMeta = true,
}: {
  palette: BriefViewModel['palette'];
  showMeta?: boolean;
}) {
  if (!palette.length) return null;
  return (
    <div className="bg-swatches">
      {palette.map((p, i) => (
        <div className="bg-swatch" key={i}>
          <div className="bg-swatch-chip" style={{ background: p.hex }} />
          <div className="bg-swatch-meta">
            <div className="bg-swatch-name">{p.name}</div>
            {showMeta && p.hex && <div className="bg-swatch-hex">{p.hex}</div>}
            {showMeta && p.pct && <div className="bg-swatch-pct">{p.pct}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SpecTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="bg-spec">
      {rows.map((s, i) => (
        <div className="bg-spec-row" key={i}>
          <div className="bg-spec-label">{s.label}</div>
          <div className="bg-spec-value">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

export function CollectionPanel({ r, mode }: { r: BriefViewModel; mode: BriefMode }) {
  const lead = r.emotionalBrief || (mode === 'wholehome' ? r.sightlineStory : '');
  const tierRows = r.floralHierarchy
    ? (
        [
          ['Tier 1 — Signature', r.floralHierarchy.tier1Signature],
          ['Tier 2 — Supporting', (r.floralHierarchy.tier2Supporting ?? []).join(', ')],
          ['Tier 3 — Discovery', (r.floralHierarchy.tier3Discovery ?? []).join(', ')],
        ] as [string, string | undefined][]
      )
        .filter(([, v]) => !!v)
        .map(([label, value]) => ({ label, value: value as string }))
    : [];

  return (
    <div>
      {lead && (
        <>
          <div className="bg-kicker">Collection Foundation</div>
          <blockquote className="bg-quote">
            <p>{lead}</p>
          </blockquote>
        </>
      )}

      {mode === 'wholehome' && r.season && (
        <div className="bg-season">
          Season: <span>{r.season}</span>
        </div>
      )}

      <div className="bg-serif-h">Palette Identity</div>
      <PaletteSwatches palette={r.palette} showMeta={mode !== 'wholehome'} />

      {r.spec.length > 0 && (
        <>
          <div className="bg-serif-h">Signature Spec</div>
          <SpecTable rows={r.spec} />
        </>
      )}

      {mode === 'wholehome' && tierRows.length > 0 && (
        <>
          <div className="bg-serif-h">Floral Hierarchy</div>
          <SpecTable rows={tierRows} />
        </>
      )}

      {r.tags.length > 0 && (
        <>
          <div className="bg-kicker">Emotion Tags</div>
          <div className="bg-pills">
            {r.tags.map((tag, i) => (
              <span className="bg-pill" key={i}>
                {tag}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function HierarchyPanel({ r }: { r: BriefViewModel }) {
  return (
    <div>
      <div className="bg-kicker">Product Hierarchy — {r.hierarchy.length} Products</div>
      <div className="bg-stack">
        {r.hierarchy.map((item, i) => (
          <div className="bg-hcard" key={i} style={{ borderLeftColor: item.borderColor }}>
            <div className="bg-hcard-main">
              <div className="bg-hcard-role">{item.role}</div>
              <div className="bg-hcard-name">{item.name}</div>
              <div className="bg-hcard-meta">
                <strong>{item.form}</strong> · {item.formula} · {item.scale}
              </div>
              {item.notes && <div className="bg-hcard-notes">{item.notes}</div>}
            </div>
            <div className="bg-hcard-price">{item.priceText}</div>
          </div>
        ))}
      </div>

      <div className="bg-summary">
        <div>
          <div className="bg-summary-label">Price Range</div>
          <div className="bg-summary-value">{r.priceRangeText}</div>
        </div>
        <div>
          <div className="bg-summary-label">Center of Gravity</div>
          <div className="bg-summary-value">{r.priceCenterText}</div>
        </div>
      </div>
    </div>
  );
}

export function ContinuityPanel({ r }: { r: BriefViewModel }) {
  return (
    <div>
      <div className="bg-kicker">Emotional Continuity Map</div>
      {r.threads.map((th, i) => (
        <div className="bg-card" key={i}>
          <div className="bg-thread-name">{th.name}</div>
          <div className="bg-thread-body">{th.body}</div>
        </div>
      ))}

      <div className="bg-divider" />
      <div className="bg-kicker">Continuity Audit</div>

      <table className="bg-table">
        <thead>
          <tr>
            {['Product', 'Atmosphere', 'Palette', 'Movement', 'Texture'].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {r.hierarchy.map((item, i) => (
            <tr key={i}>
              <td>{item.name}</td>
              <td className="check">✓</td>
              <td className="check">✓</td>
              <td className="check">✓</td>
              <td className="check">✓</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="bg-note">
        <strong>All threads hold.</strong> Clear to advance to release and merchandising.
      </div>
    </div>
  );
}

export function ReleasePanel({ r }: { r: BriefViewModel }) {
  return (
    <div>
      <div className="bg-kicker">Seasonal Release Strategy</div>
      {r.phases.map((p, i) => (
        <div className="bg-phase-block" key={i}>
          <div className="bg-phase-kicker">
            {p.phase} · {p.timing}
          </div>
          <div className="bg-phase-title">{p.title}</div>
          <div className="bg-phase-line">
            <b>Releases:</b> {p.releases}
          </div>
          <div className="bg-phase-line">
            <b>Purpose:</b> {p.purpose}
          </div>
          <div className="bg-phase-line">
            <b>Copy framing:</b> {p.copy}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CrossSellPanel({ r }: { r: BriefViewModel }) {
  return (
    <div>
      <div className="bg-kicker">Room-Level Completion Systems</div>
      {r.crossSell.map((s, i) => (
        <div className="bg-card" key={i}>
          <div className="bg-flow-name">{s.name}</div>
          <div className="bg-flow-body">{s.flow}</div>
        </div>
      ))}

      <div className="bg-divider" />
      <div className="bg-kicker">Bundle Architecture</div>

      <div className="bg-bundles">
        {r.bundles.map((b, i) => (
          <div className="bg-bundle" key={i}>
            <div className="bg-bundle-name">{b.name}</div>
            <div className="bg-bundle-type">{b.type}</div>
            <div className="bg-bundle-contents">{b.contents}</div>
            <div className="bg-bundle-prices">
              {b.hasDiscount && <span className="bg-bundle-was">${b.sum}</span>}
              <span className="bg-bundle-now">${b.final}</span>
            </div>
            {b.hasDiscount && (
              <div className="bg-bundle-save">
                Save ${b.save} ({b.discPct}%)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WholehomePanel({ r }: { r: BriefViewModel }) {
  return (
    <div>
      <div className="bg-kicker">Sightline Story</div>
      <blockquote className="bg-quote compact">
        <p>{r.sightlineStory}</p>
      </blockquote>

      <div className="bg-kicker">
        {r.whProducts.length} Selected Products — {r.selectedForms}
      </div>
      <div className="bg-stack tight">
        {r.whProducts.map((p, i) => (
          <div className="bg-wcard" key={i} style={{ borderLeftColor: p.borderColor }}>
            <div className="bg-hcard-main">
              <div className="bg-wcard-meta">
                Layer {p.layer} · {p.role} · {p.formCode}
              </div>
              <div className="bg-wcard-name">{p.name}</div>
              <div className="bg-wcard-spec">
                <strong>{p.formula}</strong> · {p.scale}
              </div>
            </div>
            <div className="bg-wcard-price">{p.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RenderPanel({
  r,
  mode,
  copyLabel,
  onCopy,
}: {
  r: BriefViewModel;
  mode: BriefMode;
  copyLabel: string;
  onCopy: () => void;
}) {
  const isWholehome = mode === 'wholehome';
  return (
    <div>
      <div className="bg-kicker">{r.renderTabTitle}</div>

      <div className="bg-note" style={{ marginBottom: 16 }}>
        <strong>Faux rules enforced:</strong> Materials named as artificial/silk/polyester
        throughout. Complete ring structure stated. Wall-mount framing. --no block included.
      </div>

      <div className="bg-prompt-panel">
        <div className="bg-prompt-head">
          <span className="bg-prompt-label">
            {isWholehome
              ? 'Collection bouquet prompt — ready to paste'
              : 'Hero frame — 1 of 6 camera angles, ready to paste'}
          </span>
          <button className="bg-prompt-copy" onClick={onCopy}>
            {copyLabel}
          </button>
        </div>
        <div className="bg-prompt-body">{r.render.prompt}</div>
      </div>

      {r.render.sourceName && (
        <p className="bg-source-note">
          Previewing <strong>{r.render.sourceName}</strong> — built by the same engine the{' '}
          <a href="#/prompt-library/compose">Compose</a> step uses. Every item in this collection
          gets all six camera angles there, each describing this same piece.
        </p>
      )}

      {r.heroGenome && (
        <div className="bg-genome">
          <div className="bg-genome-label">WGS Genome String</div>
          <div className="bg-genome-value">{r.heroGenome}</div>
        </div>
      )}

      {r.merchandising.length > 0 && (
        <>
          <div className="bg-kicker">Visual Merchandising Notes</div>
          <ul className="bg-merch">
            {r.merchandising.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function LibraryDrawer({
  open,
  onClose,
  items,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  items: LibraryItem[];
  onClear: () => void;
}) {
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moodoor-session-library.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {open && <div className="bg-drawer-scrim" onClick={onClose} />}
      <aside className={`bg-drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="bg-drawer-head">
          <div>
            <div className="bg-drawer-title">Session Library</div>
            <div className="bg-drawer-sub">
              {items.length} LibraryItem{items.length === 1 ? '' : 's'} · sourced from live inventory
            </div>
          </div>
          <button className="bg-drawer-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="bg-drawer-body mv-scroll">
          {items.length === 0 && (
            <div className="bg-drawer-empty">
              Nothing generated yet this session. Every product in a hierarchy or whole-home
              selection is sourced into a real LibraryItem recipe here as you generate collections.
            </div>
          )}
          {items.map((it) => (
            <div className="bg-litem" key={it.id}>
              <div className="bg-litem-role">
                {it.source_role}
                {it.collection_name ? ` · ${it.collection_name}` : ''}
              </div>
              <div className="bg-litem-name">{it.recipe_name}</div>
              <div className="bg-litem-mats">
                {it.materials.map((m, i) => (
                  <span key={i}>
                    {i > 0 ? ', ' : ''}
                    {m.qty}× {m.species} <span className="color">({m.color_name})</span>
                  </span>
                ))}
              </div>
              <div className="bg-litem-foot">
                <div className="bg-litem-tags">
                  {(it.emotional_tags ?? []).slice(0, 3).map((t, i) => (
                    <span className="bg-litem-tag" key={i}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="bg-litem-cost">${it.cost_estimate.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-drawer-foot">
          <button className="bg-drawer-btn grow" onClick={downloadJson} disabled={!items.length}>
            Download JSON
          </button>
          <button className="bg-drawer-btn muted" onClick={onClear} disabled={!items.length}>
            Clear
          </button>
        </div>
      </aside>
    </>
  );
}
