import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Blueprint, FormPrompts, LibraryItem, PromptEntry } from '../../types/library';
import type { Inventory } from '../../types/inventory';
import type { PageProps } from '../../types/page';
import { RENDER_LANGUAGE_SYSTEM } from '../../data/systemPrompts';
import { complete, describeError } from '../../lib/claude';
import { loadInventory } from '../../lib/inventory';
import { buildFormPrompts, isFoliage } from '../../lib/prompts';
import {
  blueprintFromLibraryItem,
  buildHumanPrompt,
  buildMachineShotSet,
  describeBlueprintForAi,
  formCodeOptions,
  parseSections,
} from '../../lib/composer';
import {
  findLibraryItem,
  getLibrary,
  getPrompts,
  savePrompts,
  saveLibrary,
  upsertLibraryItem,
} from '../../lib/storage';
import { SHOTS, SHOT_BY_KEY, type CameraShot, type ShotKey } from '../../data/cameras';
import { PRODUCT_FORMS } from '../../data/formLanguage';
import Topbar from '../../components/Topbar';
import Validator from './Validator';
import { FORMULAS, SEASONS, TAGS } from './seed';
import './library.css';

type View = 'library' | 'detail' | 'composer';

interface Props extends PageProps {
  /** Which of the two Prompt Library steps the URL is pointing at. */
  navView: 'library' | 'composer';
  /** Increments on every nav click, including one onto the current step. */
  navTick: number;
}

/** Move by changing the URL, so the top bar's step highlight can't drift. */
function go(view: 'library' | 'composer'): void {
  const next = view === 'composer' ? '#/prompt-library/compose' : '#/prompt-library';
  if (window.location.hash === next) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else window.location.hash = next;
}

const GREENERY: CameraShot = {
  key: 'hero',
  label: 'Greenery Base',
  purpose: 'Phase 1 — the foliage-only underlayer, before any bloom is placed.',
  camera: '',
  ar: '1:1',
  verifies: false,
};

/** Tab metadata for a prompt key, falling back for the non-camera phases. */
function shotMeta(key: string): CameraShot {
  return key === 'greenery' ? GREENERY : (SHOT_BY_KEY[key] ?? GREENERY);
}

const BLUEPRINT_PLACEHOLDER =
  '{ "blueprint_id": "EC_WR_V2_XXXX", "form_code": "A1", "formula": "Crescent", "seed": 42, "emotional_tags": ["airy","calm"], "canvas": {"diameter_in":24}, "silence_arcs": [{"from_deg":82,"to_deg":168}], "clusters": [], "foliage_sweeps": [] }';

export default function PromptLibrary({ hasKey, onOpenSettings, navView, navTick }: Props) {
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [view, setView] = useState<View>(navView);
  const [selId, setSelId] = useState<string | null>(null);
  /** A ShotKey, or 'human' for the paste-ready prose. */
  const [pTab, setPTab] = useState<string>('hero');

  // Library filters
  const [fFormula, setFFormula] = useState('All');
  const [fSeason, setFSeason] = useState('All');
  const [fTags, setFTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  // Composer
  const [jsonInput, setJsonInput] = useState('');
  const [composerFormCode, setComposerFormCode] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [compiled, setCompiled] = useState<{
    shots: Record<string, string>;
    human: string;
  } | null>(null);
  /** A ShotKey, or 'human' for the paste-ready prose. */
  const [cTab, setCTab] = useState<string>('hero');
  const [pasteInput, setPasteInput] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  // Whole-home form path
  const [whItem, setWhItem] = useState<LibraryItem | null>(null);
  const [whPrompts, setWhPrompts] = useState<FormPrompts | null>(null);
  const [whTab, setWhTab] = useState<string>('hero');
  const [whWarning, setWhWarning] = useState('');
  const [libSearch, setLibSearch] = useState('');

  const [activeLibraryItemId, setActiveLibraryItemId] = useState<string | null>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [inv, setInv] = useState<Inventory | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const copyTimer = useRef<number | undefined>(undefined);
  const toastTimer = useRef<number | undefined>(undefined);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setPrompts(getPrompts() ?? []);
    setLibrary(getLibrary());
    // Preload the register so the prompt builders stay synchronous but can
    // still fall back to real in-stock florals for a foliage-only item.
    loadInventory()
      .then(setInv)
      .catch(() => {});
    return () => {
      window.clearTimeout(copyTimer.current);
      window.clearTimeout(toastTimer.current);
      window.clearTimeout(resetTimer.current);
    };
  }, []);

  // The URL leads; `detail` is a sub-state of the library step, so landing back
  // on that step means going back to the grid.
  useEffect(() => {
    setView(navView);
    if (navView === 'library') setSelId(null);
  }, [navView, navTick]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const persist = useCallback(
    (next: PromptEntry[]) => {
      setPrompts(next);
      if (!savePrompts(next)) showToast('Storage full — remove an entry.');
    },
    [showToast],
  );

  const copy = useCallback((text: string, key: string) => {
    void navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  /* ---- Library list ---- */

  const filtered = useMemo(
    () =>
      prompts.filter((p) => {
        if (fFormula !== 'All' && p.formula !== fFormula) return false;
        if (fSeason !== 'All' && p.season !== fSeason) return false;
        if (fTags.length && !fTags.some((t) => p.emotionalTags.includes(t))) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!p.title.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false;
        }
        return true;
      }),
    [prompts, fFormula, fSeason, fTags, search],
  );

  const sel = prompts.find((p) => p.id === selId);
  const hasFilters = fFormula !== 'All' || fSeason !== 'All' || fTags.length > 0 || search !== '';

  /**
   * Recipes handed over by the Brief Generator that have no render prompts yet.
   * The grid below only lists saved PromptEntries, so without this the operator
   * lands on a shelf that looks empty and has no way to know the work arrived.
   */
  const pending = library.filter((li) => !li.blueprint);

  const clearFilters = () => {
    setFFormula('All');
    setFSeason('All');
    setFTags([]);
    setSearch('');
  };

  const toggleTag = (t: string) =>
    setFTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  /* ---- Composer: picking an item off the shared library ---- */

  const blueprintChoices = library.filter((li) => !li.blueprint && !li.form_code);
  const wholehomeChoices = library
    .filter((li) => !li.blueprint && li.form_code)
    .filter((li) => {
      const q = libSearch.trim().toLowerCase();
      return (
        !q ||
        (li.recipe_name ?? '').toLowerCase().includes(q) ||
        (li.form_code ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (a.form_code ?? '').localeCompare(b.form_code ?? ''));

  const pickLibraryItem = (item: LibraryItem) => {
    setView('composer');
    setActiveLibraryItemId(item.id);

    // A whole-home form already carries everything the builders need, so its
    // prompts generate on the spot — no JSON paste, no AI round trip.
    if (item.form_code) {
      const { prompts: built, materials } = buildFormPrompts(item, inv);
      setWhItem(item);
      setWhPrompts(built);
      setWhTab(item.greener_only ? 'greenery' : 'hero');
      setWhWarning(
        materials.length
          ? ''
          : 'Inventory register empty — no florals available. Prompts describe greenery only.',
      );
      setJsonInput('');
      setCompiled(null);
      setAiResult('');
      setAiError('');
      return;
    }

    setWhItem(null);
    setWhPrompts(null);
    setWhWarning('');
    setJsonInput(JSON.stringify(blueprintFromLibraryItem(item), null, 2));
    setComposerFormCode('');
    setCompiled(null);
    setAiResult('');
    setAiError('');
  };

  const saveWholehomePrompts = () => {
    if (!whItem || !whPrompts) return;
    const li = (activeLibraryItemId && findLibraryItem(activeLibraryItemId)) || whItem;
    upsertLibraryItem({
      ...li,
      blueprint: {
        form_code: li.form_code ?? '',
        prompts: whPrompts,
        generated_at: new Date().toISOString(),
      },
      render_image: null,
    });

    // Also file it in the prompt archive. Without this the form path finishes
    // by writing to a record no screen lists, and step 3 stays empty for work
    // that is actually done.
    const spec = li.form_code ? PRODUCT_FORMS[li.form_code] : undefined;
    const mats = li.materials ?? [];
    persist([
      {
        id: li.id,
        title: li.recipe_name || 'Untitled form',
        subtitle: [li.form_code, spec?.name].filter(Boolean).join(' · ') || 'Whole-home form',
        formula: spec?.formula || 'Unknown',
        season: 'Draft',
        size: spec?.scale || '—',
        seed: 0,
        emotionalTags: li.emotional_tags ?? [],
        substrate: 'Grapevine',
        florals: mats.filter((m) => !isFoliage(m)).map((m) => m.species),
        foliage: mats.filter(isFoliage).map((m) => m.species),
        silenceArc: '—',
        machinePrompt: whPrompts.hero ?? '',
        humanPrompt: '',
        shots: whPrompts,
        params: `--ar ${SHOT_BY_KEY.hero.ar} --style raw --s 100 --v 7`,
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...prompts.filter((p) => p.id !== li.id),
    ]);

    setLibrary(getLibrary());
    showToast('Saved — six angles filed under Prompts, recipe updated in the shared library');
    setWhItem(null);
    setWhPrompts(null);
    setActiveLibraryItemId(null);
    go('library');
  };

  /* ---- Composer: blueprint → language layers → compiled prompt ---- */

  const generate = async () => {
    if (!jsonInput.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiResult('');
    setCompiled(null);

    let bp: Blueprint;
    try {
      bp = JSON.parse(jsonInput) as Blueprint;
    } catch {
      setAiError('Invalid JSON — check syntax.');
      setAiLoading(false);
      return;
    }

    try {
      const text = await complete(RENDER_LANGUAGE_SYSTEM, describeBlueprintForAi(bp));
      if (!text.trim()) throw new Error('empty');
      setAiResult(text);
    } catch (err) {
      setAiError(describeError(err));
    } finally {
      setAiLoading(false);
    }
  };

  /** Read the pasted JSON, with the dropdown overriding whatever form it names. */
  const parseComposerBlueprint = (): Blueprint | null => {
    try {
      const bp = JSON.parse(jsonInput) as Blueprint;
      return composerFormCode ? { ...bp, form_code: composerFormCode } : bp;
    } catch {
      return null;
    }
  };

  const compile = () => {
    const bp = parseComposerBlueprint();
    if (!bp) return;
    const secs = parseSections(aiResult);
    setCompiled({ shots: buildMachineShotSet(bp), human: buildHumanPrompt(bp, secs) });
    setCTab('hero');
  };

  const saveToLibrary = () => {
    if (!compiled) return;
    const bp = parseComposerBlueprint();
    if (!bp) return;

    const id = bp.blueprint_id || `EC_WR_V2_DRAFT_${Date.now()}`;
    const entry: PromptEntry = {
      id,
      title: `${bp.formula || 'Draft'} Blueprint`,
      subtitle: (bp.emotional_tags ?? []).join(' · ') || 'No tags',
      formula: bp.formula || 'Unknown',
      season: 'Draft',
      size: bp.canvas?.diameter_in ? `${bp.canvas.diameter_in}"` : '—',
      seed: bp.seed || 0,
      emotionalTags: bp.emotional_tags ?? [],
      substrate: 'Grapevine',
      florals: (bp.clusters ?? [])
        .flatMap((c) => (c.stems ?? []).map((st) => st.name || st.item_id))
        .filter((x): x is string => !!x),
      foliage: (bp.foliage_sweeps ?? [])
        .map((f) => f.name || f.item_id)
        .filter((x): x is string => !!x),
      silenceArc: bp.silence_arcs?.[0]
        ? `${bp.silence_arcs[0].from_deg}°–${bp.silence_arcs[0].to_deg}°`
        : '—',
      machinePrompt: compiled.shots.hero,
      humanPrompt: compiled.human,
      shots: compiled.shots,
      params: `--ar ${SHOT_BY_KEY.hero.ar} --style raw --s 100 --v 7`,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    persist([entry, ...prompts]);

    // Hand the compiled blueprint back to the shared item so Studio can pick it up.
    if (activeLibraryItemId) {
      const li = findLibraryItem(activeLibraryItemId);
      if (li) {
        upsertLibraryItem({ ...li, blueprint: entry, render_image: null });
        setLibrary(getLibrary());
      }
    }

    setJsonInput('');
    setAiResult('');
    setCompiled(null);
    setComposerFormCode('');
    go('library');
    showToast(
      `Saved to library${activeLibraryItemId ? ' · LibraryItem blueprint updated' : ''}`,
    );
    setActiveLibraryItemId(null);
  };

  /** Two-step wipe — a stray click shouldn't be able to erase the pipeline. */
  const resetAll = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    window.clearTimeout(resetTimer.current);
    saveLibrary([]);
    savePrompts([]);
    setConfirmReset(false);
    setPrompts([]);
    setLibrary([]);
    setSelId(null);
    setWhItem(null);
    setWhPrompts(null);
    setWhWarning('');
    setActiveLibraryItemId(null);
    setJsonInput('');
    setCompiled(null);
    setAiResult('');
    setAiError('');
    setLibSearch('');
    showToast('Library cleared — starting fresh');
  };

  // Entries saved before the camera layer only carry `machinePrompt`; they fall
  // back to it rather than rendering an empty box under a Hero tab.
  const activeDetailPrompt = !sel
    ? ''
    : pTab === 'human'
      ? sel.humanPrompt
      : (sel.shots?.[pTab as ShotKey] ?? sel.machinePrompt);
  const activeCompiled = compiled
    ? cTab === 'human'
      ? compiled.human
      : (compiled.shots[cTab] ?? compiled.shots.hero)
    : '';
  const activeWhPrompt = whPrompts ? ((whPrompts as Record<string, string>)[whTab] ?? '') : '';
  const isLibrarySide = view === 'library' || view === 'detail';

  return (
    <>
      <Topbar
        step={view === 'composer' ? 'compose' : 'prompts'}
        badge="Studio · Prompt Library"
        subtitle="blueprint → language layers → six camera angles → library"
        hasKey={hasKey}
        onOpenSettings={onOpenSettings}
      />

      <div className="pl-workspace">
        {isLibrarySide && (
          <aside className="pl-filters mv-scroll">
            <div className="pl-filters-inner">
              <div>
                <span className="pl-flabel">Search</span>
                <input
                  className="pl-finput"
                  placeholder="ID or title…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div>
                <span className="pl-flabel">Formula</span>
                <select
                  className="pl-fsel"
                  value={fFormula}
                  onChange={(e) => setFFormula(e.target.value)}
                >
                  {FORMULAS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="pl-flabel">Season</span>
                <select
                  className="pl-fsel"
                  value={fSeason}
                  onChange={(e) => setFSeason(e.target.value)}
                >
                  {SEASONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="pl-flabel">Tags</span>
                <div className="pl-chips">
                  {TAGS.map((t) => (
                    <button
                      key={t}
                      className={`pl-chip${fTags.includes(t) ? ' active' : ''}`}
                      onClick={() => toggleTag(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {hasFilters && (
                <button className="pl-clear" onClick={clearFilters}>
                  ✕ Clear filters
                </button>
              )}
            </div>
          </aside>
        )}

        <main className="pl-main mv-scroll">
          {view === 'library' && (
            <div>
              {pending.length > 0 && (
                <button className="pl-pending" onClick={() => go('composer')}>
                  <span className="pl-pending-n">{pending.length}</span>
                  <span className="pl-pending-body">
                    <span className="pl-pending-title">
                      {pending.length === 1
                        ? '1 recipe is waiting for its render prompts'
                        : `${pending.length} recipes are waiting for their render prompts`}
                    </span>
                    <span className="pl-pending-sub">
                      {pending
                        .slice(0, 3)
                        .map((li) => li.recipe_name || li.id)
                        .join(' · ')}
                      {pending.length > 3 ? ` · +${pending.length - 3} more` : ''}
                    </span>
                  </span>
                  <span className="pl-pending-go">Compose →</span>
                </button>
              )}

              <div className="pl-stats">
                <div>
                  <div className="pl-stat-n">{prompts.length}</div>
                  <div className="pl-stat-l">Prompts</div>
                </div>
                <div>
                  <div className="pl-stat-n">{new Set(prompts.map((p) => p.formula)).size}</div>
                  <div className="pl-stat-l">Formulas</div>
                </div>
                <div>
                  <div className="pl-stat-n">{new Set(prompts.map((p) => p.season)).size}</div>
                  <div className="pl-stat-l">Seasons</div>
                </div>
              </div>

              {filtered.length > 0 ? (
                <div className="pl-grid">
                  {filtered.map((p) => (
                    <button
                      className="pl-card"
                      key={p.id}
                      onClick={() => {
                        setSelId(p.id);
                        setPTab('hero');
                        setView('detail');
                      }}
                    >
                      <div className="pl-card-id">
                        {p.id} · Seed {p.seed}
                      </div>
                      <div className="pl-card-title">{p.title}</div>
                      <div className="pl-card-sub">{p.subtitle}</div>
                      <div className="pl-badges">
                        <span className="pl-badge">{p.formula}</span>
                        <span className="pl-badge">{p.season}</span>
                        <span className="pl-badge">{p.size}</span>
                        <span className="pl-badge sage">{p.substrate}</span>
                      </div>
                      <div className="pl-card-flor">{p.florals.join(' · ')}</div>
                      {p.silenceArc !== '—' && <div className="pl-card-sil">∅ {p.silenceArc}</div>}
                      <div className="pl-card-date">{p.createdAt}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="pl-empty">
                  <h4>{hasFilters ? 'No prompts match' : 'No render prompts yet'}</h4>
                  <p>
                    {hasFilters
                      ? 'Adjust filters or compose a new prompt.'
                      : pending.length
                        ? 'Open Compose + to turn the waiting recipes above into render prompts.'
                        : 'Generate a collection in the Brief Generator, or paste a blueprint under Compose +.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {view === 'detail' && sel && (
            <div className="pl-detail">
              <button
                className="pl-back"
                onClick={() => {
                  setView('library');
                  setSelId(null);
                }}
              >
                ← Library
              </button>
              <div className="pl-detail-id">{sel.id}</div>
              <div className="pl-detail-title">{sel.title}</div>
              <div className="pl-detail-sub">{sel.subtitle}</div>

              <div className="pl-meta-row">
                {(
                  [
                    ['Formula', sel.formula],
                    ['Season', sel.season],
                    ['Size', sel.size],
                    ['Seed', String(sel.seed)],
                    ['Silence Arc', sel.silenceArc],
                    ['Substrate', sel.substrate],
                  ] as [string, string][]
                ).map(([l, v]) => (
                  <div key={l}>
                    <div className="pl-meta-label">{l}</div>
                    <div className="pl-meta-value">{v}</div>
                  </div>
                ))}
              </div>

              <div className="pl-flabel">Florals &amp; foliage</div>
              <div className="pl-tagpills">
                {[...sel.florals, ...(sel.foliage ?? [])].map((t, i) => (
                  <span className="pl-tagpill" key={i}>
                    {t}
                  </span>
                ))}
              </div>

              <div className="pl-tabrow">
                {SHOTS.filter((sh) => sel.shots?.[sh.key] || sh.key === 'hero').map((sh) => (
                  <button
                    key={sh.key}
                    className={`pl-tab${pTab === sh.key ? ' active' : ''}`}
                    onClick={() => setPTab(sh.key)}
                  >
                    {sh.key === 'hero' && !sel.shots ? 'Machine-Facing' : sh.label}
                    {sh.verifies && sel.shots && (
                      <span className="pl-verify-dot" title="Holds the blueprint's geometry true">
                        ◆
                      </span>
                    )}
                  </button>
                ))}
                {!!sel.humanPrompt && (
                  <button
                    className={`pl-tab${pTab === 'human' ? ' active' : ''}`}
                    onClick={() => setPTab('human')}
                  >
                    Paste-Ready
                  </button>
                )}
              </div>

              <div className="pl-pbox">
                <button
                  className={`pl-copy-abs${copiedKey === `${sel.id}-${pTab}` ? ' copied' : ''}`}
                  onClick={() => copy(activeDetailPrompt, `${sel.id}-${pTab}`)}
                >
                  {copiedKey === `${sel.id}-${pTab}` ? '✓ Copied' : 'Copy'}
                </button>
                <pre>{activeDetailPrompt}</pre>
              </div>

              <div className="pl-params-row">
                <span>{sel.params}</span>
                <button
                  className={`pl-copy${copiedKey === `${sel.id}-params` ? ' copied' : ''}`}
                  onClick={() => copy(sel.params, `${sel.id}-params`)}
                >
                  {copiedKey === `${sel.id}-params` ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <div className="pl-validator">
                <div className="pl-validator-kicker">Accuracy Validator</div>
                <Validator prompt={activeDetailPrompt} />
              </div>
            </div>
          )}

          {view === 'composer' && (
            <div className="pl-composer">
              <h2>Compose render prompt</h2>
              <p>
                Pick a recipe above, or paste an EC_WR_V2 blueprint JSON. Step 1 drafts the
                expressive language layers. Step 2 compiles them into six camera angles of the same
                piece — the words naming the piece stay identical, only the camera moves.
              </p>

              <div className="pl-reset-row">
                <button
                  className={`pl-reset${confirmReset ? ' armed' : ''}`}
                  onClick={resetAll}
                >
                  {confirmReset ? 'Click again to erase everything' : 'Start over — clear library'}
                </button>
              </div>

              {wholehomeChoices.length > 0 && (
                <>
                  <div className="pl-steplabel">
                    Whole-home forms — render prompts build instantly
                  </div>
                  <input
                    className="pl-filter-input"
                    placeholder="Filter forms…"
                    value={libSearch}
                    onChange={(e) => setLibSearch(e.target.value)}
                  />
                  <div className="pl-pickrow scroll mv-scroll">
                    {wholehomeChoices.map((li) => (
                      <button className="pl-pick" key={li.id} onClick={() => pickLibraryItem(li)}>
                        <span className="code">{li.form_code}</span>
                        {li.recipe_name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {blueprintChoices.length > 0 && (
                <>
                  <div className="pl-steplabel">
                    From shared library — {blueprintChoices.length} LibraryItem
                    {blueprintChoices.length === 1 ? '' : 's'} awaiting a render
                  </div>
                  {/* All of them, scrolled — a slice would hide a second collection. */}
                  <div className="pl-pickrow scroll mv-scroll">
                    {blueprintChoices.map((li) => (
                      <button className="pl-pick" key={li.id} onClick={() => pickLibraryItem(li)}>
                        {li.recipe_name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {!whPrompts && (
                <>
                  <div className="pl-steplabel">Step 1 — Blueprint JSON</div>
                  <textarea
                    className="pl-textarea"
                    placeholder={BLUEPRINT_PLACEHOLDER}
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value);
                      setCompiled(null);
                      setAiResult('');
                      setAiError('');
                    }}
                  />

                  <div className="pl-formrow">
                    <label htmlFor="composer-form">
                      Product form (overrides form_code in the JSON above)
                    </label>
                    <select
                      id="composer-form"
                      className="pl-fsel"
                      value={composerFormCode}
                      onChange={(e) => setComposerFormCode(e.target.value)}
                    >
                      {formCodeOptions().map((fo) => (
                        <option key={fo.code} value={fo.code}>
                          {fo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pl-gen-row">
                    <button
                      className="pl-btn-gen"
                      disabled={aiLoading || !jsonInput.trim()}
                      onClick={() => void generate()}
                    >
                      {aiLoading ? '⟡ Generating…' : '⟡ Generate language layers'}
                    </button>
                    {!!aiResult && !compiled && (
                      <span className="pl-status-ok">✓ Language layers ready</span>
                    )}
                    {!!compiled && <span className="pl-status-ready">✓ Render prompt compiled</span>}
                  </div>

                  {aiError && <div className="pl-err">{aiError}</div>}
                </>
              )}

              {whPrompts && whItem && (
                <div className="pl-layer-box">
                  <div className="pl-compiled-head">
                    <h3>{whItem.recipe_name} — render prompts</h3>
                    <span className="pl-shotcount">
                      {Object.keys(whPrompts).length} angles · same subject, camera only
                    </span>
                  </div>

                  <div className="pl-tabrow">
                    {Object.keys(whPrompts).map((k) => {
                      const meta = shotMeta(k);
                      return (
                        <button
                          key={k}
                          className={`pl-tab${whTab === k ? ' active' : ''}`}
                          onClick={() => setWhTab(k)}
                        >
                          {meta.label}
                          {meta.verifies && <span className="pl-verify-dot" title="Holds the blueprint's geometry true">◆</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pl-shotnote">
                    {shotMeta(whTab).purpose}
                    {shotMeta(whTab).verifies && (
                      <span className="pl-verify-tag">
                        ◆ Verification angle — cluster degrees and the silence arc read true here
                      </span>
                    )}
                  </div>

                  {whWarning && <div className="pl-warn">{whWarning}</div>}

                  <div className="pl-pbox">
                    <button
                      className={`pl-copy-abs${copiedKey === `wh-${whTab}` ? ' copied' : ''}`}
                      onClick={() => copy(activeWhPrompt, `wh-${whTab}`)}
                    >
                      {copiedKey === `wh-${whTab}` ? '✓ Copied' : 'Copy'}
                    </button>
                    <pre>{activeWhPrompt}</pre>
                  </div>

                  <div className="pl-actions">
                    <button className="pl-save" onClick={saveWholehomePrompts}>
                      Save to shared library →
                    </button>
                    <button
                      className="pl-backlink"
                      onClick={() => {
                        setWhItem(null);
                        setWhPrompts(null);
                        setActiveLibraryItemId(null);
                      }}
                    >
                      ← Back
                    </button>
                  </div>
                </div>
              )}

              {!!aiResult && !compiled && (
                <div className="pl-layer-box">
                  <div className="pl-layer-head">
                    <span className="pl-flabel" style={{ margin: 0 }}>
                      Language layers (AI draft)
                    </span>
                    <button
                      className={`pl-copy${copiedKey === 'ai-raw' ? ' copied' : ''}`}
                      onClick={() => copy(aiResult, 'ai-raw')}
                    >
                      {copiedKey === 'ai-raw' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="pl-ailayer">
                    <pre>{aiResult}</pre>
                  </div>

                  <div className="pl-step2">
                    <div className="pl-step2-h">Step 2 — Compile</div>
                    <div className="pl-step2-p">
                      Slots the language layers into the 7-layer scaffold with structural blueprint
                      data and locked Style DNA. Outputs both machine-facing and paste-ready formats.
                    </div>
                    <button className="pl-btn-compile" onClick={compile}>
                      ⬡ Compile to render prompt →
                    </button>
                  </div>
                </div>
              )}

              {compiled && (
                <div className="pl-layer-box">
                  <div className="pl-compiled-head">
                    <h3>Render prompt</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className={`pl-copy${copiedKey === 'compiled' ? ' copied' : ''}`}
                        onClick={() => copy(activeCompiled, 'compiled')}
                      >
                        {copiedKey === 'compiled' ? '✓ Copied' : 'Copy'}
                      </button>
                      <button className="pl-save" onClick={saveToLibrary}>
                        Save to library →
                      </button>
                    </div>
                  </div>

                  <div className="pl-tabrow">
                    {SHOTS.map((sh) => (
                      <button
                        key={sh.key}
                        className={`pl-tab${cTab === sh.key ? ' active' : ''}`}
                        onClick={() => setCTab(sh.key)}
                      >
                        {sh.label}
                        {sh.verifies && (
                          <span className="pl-verify-dot" title="Holds the blueprint's geometry true">
                            ◆
                          </span>
                        )}
                      </button>
                    ))}
                    <button
                      className={`pl-tab${cTab === 'human' ? ' active' : ''}`}
                      onClick={() => setCTab('human')}
                    >
                      Paste-Ready
                    </button>
                  </div>

                  <div className="pl-shotnote">
                    {cTab === 'human'
                      ? 'Prose version of the hero frame, carrying the AI language layers verbatim.'
                      : shotMeta(cTab).purpose}
                    {cTab !== 'human' && shotMeta(cTab).verifies && (
                      <span className="pl-verify-tag">
                        ◆ Verification angle — cluster degrees and the silence arc read true here
                      </span>
                    )}
                  </div>

                  <div className="pl-pbox flush">
                    <pre>{activeCompiled}</pre>
                  </div>

                  <button className="pl-backlink" onClick={() => setCompiled(null)}>
                    ← Back to language layers
                  </button>
                </div>
              )}

              <div className="pl-paste-block">
                <h3>Validate any prompt</h3>
                <p>
                  Paste a prompt from anywhere — a past render, a draft, a collaborator's — and score
                  it independently.
                </p>
                <textarea
                  className="pl-paste-input"
                  placeholder="Paste a Midjourney prompt here…"
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                />
                {pasteInput.trim() && (
                  <div style={{ marginTop: 18 }}>
                    <Validator prompt={pasteInput} compact emptyLabel="" />
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div className="toast">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B8F67" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {toast}
        </div>
      )}
    </>
  );
}
