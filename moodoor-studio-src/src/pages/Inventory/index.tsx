import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Inventory, InventorySpecies } from '../../types/inventory';
import type { PageProps } from '../../types/page';
import { seasonsOf } from '../../types/inventory';
import { complete, describeError, extractJson } from '../../lib/claude';
import { loadInventory, saveInventory } from '../../lib/inventory';
import {
  TAGGING_SYSTEM,
  applyTags,
  describeForTagging,
  importInventory,
  mergeSources,
  taggableSpecies,
  taggingRequest,
  untaggedSpecies,
  type LoadedSource,
  type TagResult,
} from '../../lib/inventoryImport';
import {
  archiveSession,
  awaitTurn,
  createSession,
  ensureEnvironment,
  listAgents,
  sendMessage,
  type ManagedAgent,
} from '../../lib/managedAgents';
import { getTaggerAgent, setTaggerAgent } from '../../lib/storage';
import Topbar from '../../components/Topbar';
import './inventory.css';

/** Batch size for the tagging pass — enough context per call, few enough calls. */
const TAG_BATCH = 40;

export default function InventoryPage({ hasKey, onOpenSettings }: PageProps) {
  const [sources, setSources] = useState<LoadedSource[]>([]);
  const [active, setActive] = useState<Inventory | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'material' | 'base' | 'finished' | 'untagged'>('all');
  const [tagging, setTagging] = useState('');

  // Managed Agent tagging
  const [agents, setAgents] = useState<ManagedAgent[]>([]);
  const [agentId, setAgentId] = useState(getTaggerAgent);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentNote, setAgentNote] = useState('');
  /** Tag only what's missing, or have the agent redo everything. */
  const [scope, setScope] = useState<'gaps' | 'all'>('gaps');
  // A few hundred items is several minutes of work; a run that can't be stopped
  // is indistinguishable from one that has hung.
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const fileInput = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    loadInventory()
      .then(setActive)
      .catch(() => {});
    return () => window.clearTimeout(toastTimer.current);
  }, []);

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3200);
  }, []);

  /** Pending register: every file loaded so far, folded into one. */
  const pending = useMemo(() => (sources.length ? mergeSources(sources) : null), [sources]);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    const added: LoadedSource[] = [];
    const failures: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const { inventory, report } = importInventory(text, file.name);
        added.push({ label: file.name, inventory, report });
      } catch (err) {
        failures.push(`${file.name}: ${(err as Error).message}`);
      }
    }

    if (added.length) {
      setSources((prev) => [...prev.filter((p) => !added.some((a) => a.label === p.label)), ...added]);
      say(`${added.length} file${added.length === 1 ? '' : 's'} read.`);
    }
    if (failures.length) setError(failures.join('\n'));
    if (fileInput.current) fileInput.current.value = '';
  };

  /** Load the agents already defined in the Console, so one can be picked. */
  const loadAgents = async () => {
    setAgentsLoading(true);
    setAgentNote('');
    setError('');
    try {
      const list = await listAgents();
      setAgents(list);
      if (!list.length) setAgentNote('No agents on this account — the built-in tagger will be used.');
      else {
        // Pre-select the obvious one so a first-time click is one step, not two.
        const tagger = list.find((a) => /tag/i.test(a.name));
        if (!agentId && tagger) {
          setAgentId(tagger.id);
          setTaggerAgent(tagger.id);
        }
        setAgentNote(`${list.length} agent${list.length === 1 ? '' : 's'} found.`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAgentsLoading(false);
    }
  };

  const chooseAgent = (id: string) => {
    setAgentId(id);
    setTaggerAgent(id);
  };

  /** Ask Claude for tags on anything the files left blank. */
  const tagGaps = async () => {
    if (!pending) return;
    const missing =
      scope === 'all' ? taggableSpecies(pending.inventory) : untaggedSpecies(pending.inventory);
    if (!missing.length) {
      say('Nothing to tag — every item already carries tags and a season.');
      return;
    }

    setError('');
    cancelRef.current = { cancelled: false };
    let tagged = pending.inventory;
    const collected: TagResult[] = [];
    const batches = Math.ceil(missing.length / TAG_BATCH);
    const label = (i: number) =>
      `Tagging ${i + 1}–${Math.min(i + TAG_BATCH, missing.length)} of ${missing.length}…`;

    try {
      if (agentId) {
        // One session for the whole job. A session is stateful, so the agent
        // keeps its own context across batches instead of re-establishing it —
        // and one container is provisioned rather than one per batch.
        const agent = agents.find((a) => a.id === agentId);
        setTagging('Starting a session…');
        const env = await ensureEnvironment();
        const session = await createSession(agentId, env.id, 'Moodoor inventory tagging');
        const seenIds = new Set<string>();

        try {
          for (let i = 0; i < missing.length; i += TAG_BATCH) {
            if (cancelRef.current.cancelled) throw new Error('Cancelled.');
            const n = Math.floor(i / TAG_BATCH) + 1;
            setTagging(`${label(i)} · batch ${n} of ${batches} (${agent?.name ?? 'agent'})`);
            await sendMessage(session.id, taggingRequest(missing.slice(i, i + TAG_BATCH), n, batches));
            const reply = await awaitTurn(session.id, { seenIds, signal: cancelRef.current });
            const arr = extractJsonArray(reply);
            if (!arr.length) {
              // The agent's own system prompt may shape output we can't read.
              // Show what came back rather than reporting a silent success.
              throw new Error(
                `${agent?.name ?? 'The agent'} replied without a JSON array this app could read. It said:\n\n${reply.slice(0, 600) || '(nothing)'}`,
              );
            }
            collected.push(...arr);
          }
        } finally {
          await archiveSession(session.id);
        }
      } else {
        for (let i = 0; i < missing.length; i += TAG_BATCH) {
          if (cancelRef.current.cancelled) throw new Error('Cancelled.');
          setTagging(`${label(i)} · batch ${Math.floor(i / TAG_BATCH) + 1} of ${batches}`);
          const text = await complete(TAGGING_SYSTEM, describeForTagging(missing.slice(i, i + TAG_BATCH)));
          const arr = extractJsonArray(text);
          if (!arr.length) {
            throw new Error(`The tagger replied without a readable JSON array. It said:\n\n${text.slice(0, 600) || '(nothing)'}`);
          }
          collected.push(...arr);
        }
      }
      tagged = applyTags(pending.inventory, collected);

      // Fold the result back into the sources so the merge stays the truth.
      setSources([
        {
          label: sources.map((s) => s.label).join(' + '),
          inventory: tagged,
          report: {
            ...sources[0].report,
            total: tagged.species.length,
            warnings: [
              `${collected.length} item${collected.length === 1 ? '' : 's'} tagged by ${agents.find((a) => a.id === agentId)?.name ?? 'the built-in tagger'} — inferred, not verified. Review before you build on them.`,
            ],
            errors: [],
          },
        },
      ]);
      say(`${collected.length} item${collected.length === 1 ? '' : 's'} tagged.`);
    } catch (err) {
      const message = describeError(err);
      if (/cancelled/i.test(message) && collected.length) {
        // Don't discard batches that already succeeded.
        setSources((prev) =>
          prev.length
            ? [{ ...prev[0], label: prev.map((x) => x.label).join(' + '), inventory: applyTags(pending.inventory, collected) }]
            : prev,
        );
        say(`Stopped — ${collected.length} item${collected.length === 1 ? '' : 's'} tagged before you cancelled.`);
      } else {
        setError(message);
      }
    } finally {
      setTagging('');
    }
  };

  const activate = () => {
    if (!pending) return;
    saveInventory(pending.inventory);
    setActive(pending.inventory);
    say(`Register active — ${pending.inventory.species.filter((s) => s.sku_count > 0).length} selectable materials.`);
  };

  const revert = () => {
    // Clearing the cache and reloading is what puts the built-in canon back.
    saveInventory(null as unknown as Inventory);
    try {
      localStorage.removeItem('moodoor_inventory_cache');
    } catch {
      /* memory copy is already cleared */
    }
    window.location.reload();
  };

  const shown = pending?.inventory ?? active;
  const rows = useMemo(() => {
    const all = shown?.species ?? [];
    const q = search.trim().toLowerCase();
    return all
      .filter((s) => {
        if (filter === 'material') return s.sku_count > 0;
        if (filter === 'base') return s.item_class === 'base';
        if (filter === 'finished') return s.item_class === 'finished';
        if (filter === 'untagged') return !(s.emotion_tags ?? []).length && !s.primary_emotion;
        return true;
      })
      .filter((s) => !q || s.species.toLowerCase().includes(q) || s.canon_id.toLowerCase().includes(q))
      .slice(0, 400);
  }, [shown, search, filter]);

  const totals = useMemo(() => summarize(pending?.inventory ?? active), [pending, active]);
  const untaggedCount = pending ? untaggedSpecies(pending.inventory).length : 0;
  const taggableCount = pending ? taggableSpecies(pending.inventory).length : 0;
  const scopeCount = scope === 'all' ? taggableCount : untaggedCount;

  return (
    <>
      <Topbar
        step="inventory"
        badge="Studio · Inventory"
        subtitle="registers → tagged gaps → real stock"
        hasKey={hasKey}
        onOpenSettings={onOpenSettings}
      />

      <div className="inv-body mv-scroll">
        <div className="inv-head">
          <h1>Inventory</h1>
          <p>
            Everything the engine builds with comes from here. Upload one file or several — they
            merge into a single register. Bases and finished goods are kept but never picked as
            stems, and anything without emotion tags or a season can be tagged by Claude before you
            activate it.
          </p>
        </div>

        <div
          className="inv-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void addFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInput.current?.click()}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            multiple
            hidden
            onChange={(e) => void addFiles(e.target.files)}
          />
          <strong>Drop JSON files here</strong>
          <span>or click to choose — you can add several, one supplier at a time</span>
        </div>

        {error && <pre className="inv-err">{error}</pre>}

        {sources.length > 0 && (
          <section className="inv-sources">
            <div className="inv-label">Loaded ({sources.length})</div>
            {sources.map((s) => (
              <div className="inv-source" key={s.label}>
                <span className="inv-source-name">{s.label}</span>
                <span className="inv-source-counts">
                  {s.report.materials} materials · {s.report.bases} bases · {s.report.finished}{' '}
                  finished
                </span>
                <button
                  className="inv-remove"
                  onClick={() => setSources((prev) => prev.filter((p) => p.label !== s.label))}
                >
                  Remove
                </button>
              </div>
            ))}
            {!!pending?.collisions.length && (
              <div className="inv-warn">
                {pending.collisions.length} id collision
                {pending.collisions.length === 1 ? '' : 's'} across files — the later file wins:{' '}
                {pending.collisions.slice(0, 4).join('; ')}
                {pending.collisions.length > 4 ? ' …' : ''}
              </div>
            )}
          </section>
        )}

        {totals && (
          <section className="inv-stats">
            <Stat n={totals.selectable} label="Selectable" />
            <Stat n={totals.bases} label="Bases" />
            <Stat n={totals.finished} label="Finished" />
            <Stat n={totals.roles.focal ?? 0} label="Focal" />
            <Stat n={Object.keys(totals.seasons).length} label="Seasons" />
          </section>
        )}

        {totals && (
          <section className="inv-seasons">
            {(['spring', 'summer', 'fall', 'winter', 'year-round'] as const).map((s) => (
              <span key={s} className={`inv-season${totals.seasons[s] ? '' : ' empty'}`}>
                {s} · {totals.seasons[s] ?? 0}
              </span>
            ))}
          </section>
        )}

        {sources.flatMap((s) => s.report.warnings).length > 0 && (
          <section className="inv-notes">
            <div className="inv-label">Worth knowing before you build on this</div>
            <ul>
              {[...new Set(sources.flatMap((s) => s.report.warnings))].map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </section>
        )}

        {sources.flatMap((s) => s.report.errors).length > 0 && (
          <section className="inv-notes bad">
            <div className="inv-label">Rows that did not make it</div>
            <ul>
              {[...new Set(sources.flatMap((s) => s.report.errors))].slice(0, 12).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </section>
        )}

        {pending && (
          <section className="inv-agent">
            <div className="inv-label">Tagging</div>

            <div className="inv-scope">
              <button
                className={`inv-chip${scope === 'gaps' ? ' active' : ''}`}
                onClick={() => setScope('gaps')}
              >
                Only what's missing · {untaggedCount}
              </button>
              <button
                className={`inv-chip${scope === 'all' ? ' active' : ''}`}
                onClick={() => setScope('all')}
              >
                Re-tag everything · {taggableCount}
              </button>
            </div>

            <p className="inv-agent-note">
              {untaggedCount === 0
                ? 'Every item already carries emotion tags and a season, so nothing is missing. Re-tagging is still worth it if those came from a script rather than a look at the product — your file flags some as inferred.'
                : `${untaggedCount} item${untaggedCount === 1 ? '' : 's'} arrived without tags or a season.`}
            </p>

            <div className="inv-agent-row">
              <select
                className="inv-fsel"
                value={agentId}
                onChange={(e) => chooseAgent(e.target.value)}
                disabled={!agents.length}
              >
                <option value="">Built-in tagger (this app's own prompt)</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {typeof a.model === 'string' ? ` · ${a.model}` : a.model?.id ? ` · ${a.model.id}` : ''}
                  </option>
                ))}
              </select>
              <button
                className="inv-ghost"
                onClick={() => void loadAgents()}
                disabled={agentsLoading || !hasKey}
                title={hasKey ? '' : 'Add an API key under Settings first'}
              >
                {agentsLoading ? 'Loading…' : agents.length ? 'Reload' : 'Load my agents'}
              </button>
            </div>
            <p className="inv-agent-note">
              {agentNote ||
                'Your Console agents can do this instead — they carry their own instructions. Load them to pick one.'}
            </p>
          </section>
        )}

        {pending && (
          <section className="inv-actions">
            <button className="inv-primary" onClick={activate}>
              Use this register →
            </button>
            <button
              className="inv-secondary"
              onClick={() => void tagGaps()}
              disabled={!!tagging || !scopeCount || !hasKey}
              title={hasKey ? '' : 'Add an API key under Settings first'}
            >
              {tagging ||
                (scopeCount
                  ? `${scope === 'all' ? 'Re-tag' : 'Tag'} ${scopeCount} with ${agents.find((a) => a.id === agentId)?.name ?? 'the built-in tagger'}${scopeCount > TAG_BATCH ? ` · ${Math.ceil(scopeCount / TAG_BATCH)} batches` : ''}`
                  : 'Nothing to tag')}
            </button>
            {tagging ? (
              <button className="inv-ghost" onClick={() => (cancelRef.current.cancelled = true)}>
                Stop
              </button>
            ) : (
              <button className="inv-ghost" onClick={() => setSources([])}>
                Clear
              </button>
            )}
          </section>
        )}

        {shown && (
          <section className="inv-table-wrap">
            <div className="inv-toolbar">
              <input
                className="inv-search"
                placeholder="Search name or id…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {(['all', 'material', 'base', 'finished', 'untagged'] as const).map((f) => (
                <button
                  key={f}
                  className={`inv-chip${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
              <span className="inv-active-label">
                {pending ? 'Previewing upload' : `Active: ${active?.source_label ?? 'built-in EFS-1.0 canon'}`}
              </span>
            </div>

            <div className="inv-table mv-scroll">
              <table>
                <thead>
                  <tr>
                    <th />
                    <th>Item</th>
                    <th>Colour</th>
                    <th>Role</th>
                    <th>Season</th>
                    <th>Reads as</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <Row key={s.canon_id} s={s} />
                  ))}
                </tbody>
              </table>
              {rows.length === 400 && <div className="inv-more">Showing the first 400 — filter to narrow.</div>}
            </div>
          </section>
        )}

        <section className="inv-revert">
          <button className="inv-ghost" onClick={revert}>
            Revert to the built-in canon
          </button>
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="inv-stat-n">{n}</div>
      <div className="inv-stat-l">{label}</div>
    </div>
  );
}

function Row({ s }: { s: InventorySpecies }) {
  const sku = s.skus[0];
  const tags = (s.emotion_tags ?? []).length
    ? (s.emotion_tags ?? []).join(', ')
    : [s.primary_emotion, s.secondary_emotion].filter(Boolean).join(', ');
  return (
    <tr className={s.sku_count > 0 ? '' : 'muted'}>
      <td>
        <span className="inv-swatch" style={{ background: sku?.hex ?? '#ccc' }} />
      </td>
      <td>
        <span className="inv-name">{s.species}</span>
        {s.item_class && s.item_class !== 'material' && (
          <span className="inv-class">{s.item_class}</span>
        )}
        {!!s.needs_review?.length && (
          <span className="inv-review" title={s.needs_review.join(', ')}>
            unverified
          </span>
        )}
      </td>
      <td>{sku?.color_name}</td>
      <td>{s.sku_count > 0 ? sku?.primary_role : '—'}</td>
      <td>{seasonsOf(s).join(', ') || '—'}</td>
      <td className="inv-tags">{tags || <span className="inv-missing">untagged</span>}</td>
      <td>{sku?.price ? `$${sku.price.toFixed(2)}` : '—'}</td>
    </tr>
  );
}

function summarize(inv: Inventory | null) {
  if (!inv) return null;
  const roles: Record<string, number> = {};
  const seasons: Record<string, number> = {};
  let selectable = 0;
  let bases = 0;
  let finished = 0;

  for (const s of inv.species ?? []) {
    if (s.item_class === 'base') bases += 1;
    else if (s.item_class === 'finished') finished += 1;
    if (s.sku_count > 0) {
      selectable += 1;
      const role = s.skus[0]?.primary_role ?? 'secondary';
      roles[role] = (roles[role] ?? 0) + 1;
      for (const season of seasonsOf(s)) seasons[season] = (seasons[season] ?? 0) + 1;
    }
  }
  return { selectable, bases, finished, roles, seasons };
}

/**
 * Pull the tag array out of a reply.
 *
 * Returns empty rather than throwing: a Managed Agent runs on a system prompt
 * this app has never seen, so an unparseable reply is an expected outcome, and
 * the caller shows the operator what actually came back. A generic parse error
 * here would hide exactly the information needed to fix the agent.
 */
function extractJsonArray(raw: string): TagResult[] {
  const text = raw.replace(/```(?:json)?/gi, '').trim();
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');

  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as TagResult[];
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* fall through to the wrapped-object shape */
    }
  }

  // Some replies wrap the array in an object.
  try {
    const obj = extractJson<{ items?: TagResult[]; results?: TagResult[] }>(text);
    return obj.items ?? obj.results ?? [];
  } catch {
    return [];
  }
}
