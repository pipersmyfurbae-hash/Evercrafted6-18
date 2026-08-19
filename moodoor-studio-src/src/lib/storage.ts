import type { LibraryItem, PromptEntry } from '../types/library';

/**
 * Shared persistence for the Moodoor pipeline. Every tool page reads and
 * patches the same records under these keys, so a brief generated in one screen
 * is pickable in the next without any manual hand-off.
 */
export const KEYS = {
  /** Mutable copy of moodoor-inventory.json (qty decremented as SKUs are committed). */
  INVENTORY_CACHE: 'moodoor_inventory_cache',
  /** LibraryItem[] — the spine shared by Brief Generator, Prompt Library and Studio. */
  LIBRARY: 'moodoor_library_items',
  /** PromptEntry[] — the Prompt Library's own archive. */
  PROMPTS: 'moodoor_prompt_library',
  /** CollectionSet[] published to the storefront by the Collection Engine. */
  COLLECTIONS: 'moodoor_collections',
  /** The viewer's own Anthropic API key. Never leaves this browser. */
  API_KEY: 'moodoor_api_key',
  /** Which engine version wrote the stored records. */
  SCHEMA: 'moodoor_schema_version',
  /** Managed Agent id used for the inventory tagging pass, when one is chosen. */
  TAGGER_AGENT: 'moodoor_tagger_agent',
} as const;

/**
 * Bumped when stored records stop matching what the engine now produces. The
 * camera layer changed every render prompt, so prompts saved by an earlier
 * build describe a shot the engine no longer builds — keeping them would mean
 * a library where two entries claim the same format and only one is true.
 * Recipes and prompts are cleared on the bump; the API key is not.
 */
const SCHEMA_VERSION = '2-cameras';

/** Returns true when this load cleared stale records. Safe to call repeatedly. */
export function migrateStorage(): boolean {
  try {
    if (localStorage.getItem(KEYS.SCHEMA) === SCHEMA_VERSION) return false;
    const had = !!(localStorage.getItem(KEYS.LIBRARY) || localStorage.getItem(KEYS.PROMPTS));
    localStorage.removeItem(KEYS.LIBRARY);
    localStorage.removeItem(KEYS.PROMPTS);
    localStorage.setItem(KEYS.SCHEMA, SCHEMA_VERSION);
    return had;
  } catch {
    return false;
  }
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Quota exceeded, or storage disabled (private mode / blocked cookies).
    return false;
  }
}

export function getLibrary(): LibraryItem[] {
  return read<LibraryItem[]>(KEYS.LIBRARY) ?? [];
}

export function saveLibrary(items: LibraryItem[]): boolean {
  return write(KEYS.LIBRARY, items);
}

/** Merge a patch onto an existing item by id, or unshift it if it's new. */
export function upsertLibraryItem(item: LibraryItem): LibraryItem[] {
  const items = getLibrary();
  const i = items.findIndex((x) => x.id === item.id);
  if (i >= 0) items[i] = { ...items[i], ...item };
  else items.unshift(item);
  saveLibrary(items);
  return items;
}

/**
 * Prepend a freshly generated batch, newest collection first. Reports whether
 * the write landed — storage can be unavailable (private browsing, blocked
 * cookies, a full quota), and a caller that claims "saved" regardless is lying.
 */
export function addLibraryItems(newItems: LibraryItem[]): {
  items: LibraryItem[];
  saved: boolean;
} {
  const items = [...newItems, ...getLibrary()];
  return { items, saved: saveLibrary(items) };
}

export function findLibraryItem(id: string): LibraryItem | undefined {
  return getLibrary().find((x) => x.id === id);
}

export function getPrompts(): PromptEntry[] | null {
  return read<PromptEntry[]>(KEYS.PROMPTS);
}

export function savePrompts(prompts: PromptEntry[]): boolean {
  return write(KEYS.PROMPTS, prompts);
}

/** The chosen tagging agent, or '' for the built-in prompt. */
export function getTaggerAgent(): string {
  try {
    return localStorage.getItem(KEYS.TAGGER_AGENT) ?? '';
  } catch {
    return '';
  }
}

export function setTaggerAgent(id: string): void {
  try {
    if (id) localStorage.setItem(KEYS.TAGGER_AGENT, id);
    else localStorage.removeItem(KEYS.TAGGER_AGENT);
  } catch {
    /* the choice just won't persist */
  }
}

export function getApiKey(): string {
  return localStorage.getItem(KEYS.API_KEY) ?? '';
}

export function setApiKey(key: string): void {
  if (key) localStorage.setItem(KEYS.API_KEY, key);
  else localStorage.removeItem(KEYS.API_KEY);
}

let idSeq = 0;
export function newId(prefix: string): string {
  idSeq += 1;
  return `${prefix}_${Date.now().toString(36)}${idSeq}`;
}
