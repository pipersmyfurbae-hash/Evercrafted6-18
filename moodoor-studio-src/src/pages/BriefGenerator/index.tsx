import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BriefMode, GeneratedPackage } from '../../types/collection';
import type { LibraryItem } from '../../types/library';
import type { PageProps } from '../../types/page';
import { SYSTEM, WHOLEHOME_SYSTEM } from '../../data/systemPrompts';
import { complete, describeError, extractJson } from '../../lib/claude';
import { loadInventory } from '../../lib/inventory';
import { buildLibraryItems, buildWholehomeLibraryItems } from '../../lib/recipes';
import { addLibraryItems } from '../../lib/storage';
import Topbar from '../../components/Topbar';
import { PHASE_TEXT, TABS, WH_TABS, buildViewModel } from './viewModel';
import {
  CollectionPanel,
  ContinuityPanel,
  CrossSellPanel,
  HierarchyPanel,
  LibraryDrawer,
  ReleasePanel,
  RenderPanel,
  WholehomePanel,
} from './panels';
import './brief.css';

type Screen = 'input' | 'loading' | 'error' | 'results';

const MODES: [BriefMode, string][] = [
  ['bespoke', 'Bespoke client request'],
  ['collection', 'Mood / theme collection'],
  ['wholehome', 'Whole-home collection'],
];

const PLACEHOLDERS: Record<BriefMode, string> = {
  bespoke: 'e.g. Something cozy for our front door this fall — sage and rust, around 20 inches.',
  wholehome:
    'e.g. Large traditional home, grand entry with staircase, hosting for the holidays, farmhouse kitchen.',
  collection:
    'e.g. Late winter — the last cold before warmth arrives. Pale greens, aged paper, the weight of something almost finished.',
};

const LABELS: Record<BriefMode, string> = {
  bespoke: 'Raw client request',
  wholehome: 'Whole-home intent',
  collection: 'Collection Brief',
};

const CTA: Record<BriefMode, string> = {
  bespoke: 'Normalize & Generate',
  wholehome: 'Select & Generate',
  collection: 'Generate Collection',
};

/** Mode-specific framing wrapped around the operator's own words. */
function userMessage(mode: BriefMode, brief: string): string {
  if (mode === 'wholehome') {
    return `Select and generate a whole-home Evercrafted collection package for this intent: ${brief}`;
  }
  if (mode === 'bespoke') {
    return `Normalize this raw client memory/request into a structured brief (resolve sizing spec, palette, flag ambiguities), then generate a single-order collection package (still use the full 8-product hierarchy schema, but focus hierarchy items 1-2 as the bespoke deliverable and the rest as optional cross-sell) for: ${brief}`;
  }
  return `Generate a complete collection intelligence package for this brief: ${brief}`;
}

export default function BriefGenerator({ hasKey, onOpenSettings }: PageProps) {
  const [screen, setScreen] = useState<Screen>('input');
  const [mode, setMode] = useState<BriefMode>('bespoke');
  const [brief, setBrief] = useState('');
  const [phaseCount, setPhaseCount] = useState(0);
  const [error, setError] = useState('');
  const [data, setData] = useState<GeneratedPackage | null>(null);
  const [tab, setTab] = useState('collection');
  const [copyLabel, setCopyLabel] = useState('Copy');
  const [gaps, setGaps] = useState<string[]>([]);
  const [libraryStatus, setLibraryStatus] = useState('');
  const [statusIsWarning, setStatusIsWarning] = useState(false);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [sessionLibrary, setSessionLibrary] = useState<LibraryItem[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);

  const phaseTimer = useRef<number | undefined>(undefined);

  // Warm the register early — the render preview builds synchronously off it.
  useEffect(() => {
    loadInventory().catch(() => {});
    return () => window.clearInterval(phaseTimer.current);
  }, []);

  const reset = () => {
    setScreen('input');
    setError('');
    setData(null);
    setGaps([]);
    setLibraryStatus('');
    setStatusIsWarning(false);
    setItems([]);
  };

  const generate = useCallback(async () => {
    const b = brief.trim();
    if (!b) return;

    setScreen('loading');
    setPhaseCount(0);
    window.clearInterval(phaseTimer.current);
    phaseTimer.current = window.setInterval(() => {
      setPhaseCount((p) => (p < PHASE_TEXT.length ? p + 1 : p));
    }, 900);

    const wholehome = mode === 'wholehome';

    try {
      const text = await complete(wholehome ? WHOLEHOME_SYSTEM : SYSTEM, userMessage(mode, b));
      const parsed = extractJson<GeneratedPackage>(text);

      const inv = await loadInventory().catch(() => null);
      const { items: newItems, gaps: foundGaps } = inv
        ? wholehome
          ? buildWholehomeLibraryItems(parsed, inv, b)
          : buildLibraryItems(parsed, inv, b)
        : { items: [] as LibraryItem[], gaps: [] as string[] };

      // Write through to the shared store so the Prompt Library can pick these up.
      const priorCount = sessionLibrary.length;
      const saved = newItems.length ? addLibraryItems(newItems).saved : true;

      window.clearInterval(phaseTimer.current);
      setData(parsed);
      setTab('collection');
      setGaps(foundGaps);
      setItems(newItems);
      setSessionLibrary((prev) => [...newItems, ...prev]);

      const count = newItems.length;
      const plural = count === 1 ? '' : 's';
      setLibraryStatus(
        !count
          ? 'Inventory unavailable — LibraryItems not generated.'
          : saved
            ? `${count} LibraryItem${plural} saved to the shared library — ${count + priorCount} this session. Open the Prompts tab to build their render prompts.`
            : `${count} recipe${plural} generated, but this browser blocked saving them. They are listed under Library below — download the JSON before you close this tab.`,
      );
      setStatusIsWarning(!saved && count > 0);
      setScreen('results');
    } catch (err) {
      window.clearInterval(phaseTimer.current);
      setError(describeError(err));
      setScreen('error');
    }
  }, [brief, mode, sessionLibrary.length]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') void generate();
  };

  const r = useMemo(() => (data ? buildViewModel(data, mode, items) : null), [data, mode, items]);

  const copyPrompt = () => {
    if (!r) return;
    void navigator.clipboard?.writeText(r.render.prompt).then(
      () => {
        setCopyLabel('Copied ✓');
        window.setTimeout(() => setCopyLabel('Copy'), 2200);
      },
      () => {},
    );
  };

  const tabDefs = mode === 'wholehome' ? WH_TABS : TABS;

  return (
    <>
      <Topbar
        step="brief"
        badge="Studio · Brief Generator"
        subtitle="brief → collection intelligence → 8-product system"
        hasKey={hasKey}
        onOpenSettings={onOpenSettings}
      >
        <button className="pillbtn" onClick={() => setShowLibrary(true)}>
          Library · {sessionLibrary.length} →
        </button>
      </Topbar>

      <div className="bg-body mv-scroll">
        {screen === 'input' && (
          <div className="mv-fade bg-center bg-input-screen">
            <div className="bg-input">
              <div className="bg-eyebrow">◦ Moodoor · Collection Intelligence Engine</div>
              <h1 className="bg-h1">
                Brief-to-Collection
                <br />
                Generator
              </h1>
              <p className="bg-lead">
                Paste a raw client request for a single bespoke order, or describe a season/theme for
                a full collection. Both normalize into a structured brief and generate real
                LibraryItem recipes from the inventory.
              </p>

              <div className="bg-modes">
                {MODES.map(([value, label]) => (
                  <button
                    key={value}
                    className={`bg-mode${mode === value ? ' active' : ''}`}
                    onClick={() => setMode(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <label className="bg-field-label" htmlFor="brief-input">
                {LABELS[mode]}
              </label>
              <textarea
                id="brief-input"
                className="bg-textarea"
                rows={5}
                placeholder={PLACEHOLDERS[mode]}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                onKeyDown={onKeyDown}
              />

              <button
                className="bg-generate"
                onClick={() => void generate()}
                disabled={!brief.trim()}
              >
                {CTA[mode]}
              </button>

              <p className="bg-tip">
                Tip: <code>Ctrl+Enter</code> or <code>⌘+Enter</code> to generate
              </p>
            </div>
          </div>
        )}

        {screen === 'loading' && (
          <div className="mv-fade bg-center">
            <div className="bg-loading">
              <div className="bg-spinner" />
              <div className="bg-loading-title">Building collection intelligence</div>
              <div className="bg-loading-sub">Translating brief into collection architecture</div>
              <div className="bg-phases">
                {PHASE_TEXT.map((text, i) => (
                  <div className={`bg-phase${i < phaseCount ? ' done' : ''}`} key={i}>
                    ◦ {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {screen === 'error' && (
          <div className="mv-fade bg-center bg-error-screen">
            <div className="bg-error">
              <div className="bg-error-title">Generation failed</div>
              <div className="bg-error-box">{error}</div>
              <button className="bg-retry" onClick={reset}>
                Try again
              </button>
            </div>
          </div>
        )}

        {screen === 'results' && r && (
          <div className="mv-fade">
            <div className="bg-result-head">
              <button className="bg-new" onClick={reset}>
                + New Collection
              </button>
              <div style={{ flex: 1 }}>
                <div className="bg-atmo">{r.atmo}</div>
                <div className="bg-name">{r.name}</div>
                <div className="bg-tagline">{r.tagline}</div>
              </div>
            </div>

            {gaps.length > 0 && (
              <div className="bg-banner-gap">
                ⚠ Register gap — referenced species with zero stock, substituted: {gaps.join(', ')}
              </div>
            )}

            <div className={`bg-banner-status${statusIsWarning ? ' warn' : ''}`}>
              {libraryStatus}
            </div>

            <div className="bg-tabs mv-scroll">
              {tabDefs.map(([key, label]) => (
                <button
                  key={key}
                  className={`bg-tab${tab === key ? ' active' : ''}`}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="bg-panel">
              {tab === 'collection' && <CollectionPanel r={r} mode={mode} />}
              {tab === 'hierarchy' && mode !== 'wholehome' && <HierarchyPanel r={r} />}
              {tab === 'continuity' && mode !== 'wholehome' && <ContinuityPanel r={r} />}
              {tab === 'release' && mode !== 'wholehome' && <ReleasePanel r={r} />}
              {tab === 'crosssell' && mode !== 'wholehome' && <CrossSellPanel r={r} />}
              {tab === 'wholehome' && mode === 'wholehome' && <WholehomePanel r={r} />}
              {tab === 'render' && (
                <RenderPanel r={r} mode={mode} copyLabel={copyLabel} onCopy={copyPrompt} />
              )}
            </div>
          </div>
        )}
      </div>

      <LibraryDrawer
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        items={sessionLibrary}
        onClear={() => setSessionLibrary([])}
      />
    </>
  );
}
