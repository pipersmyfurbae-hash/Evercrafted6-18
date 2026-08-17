import type { Inventory, InventorySpecies, InventorySku, PrimaryRole } from '../types/inventory';
import type { Material } from '../types/library';
import { KEYS } from './storage';

let cache: Inventory | null = null;
let inflight: Promise<Inventory> | null = null;

/**
 * The single-file build inlines the canon as a `<script type="application/json">`
 * so the app runs straight off `file://`, where `fetch` of a sibling file is
 * blocked by the browser.
 */
function embeddedInventory(): Inventory | null {
  const el = document.getElementById('inventory-data');
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as Inventory;
  } catch {
    return null;
  }
}

/**
 * Load the EFS-1.0 canon. Cached in memory for the session and in localStorage
 * across sessions, because the Operator Console decrements quantities against
 * the same copy as SKUs are committed to a build.
 */
export function loadInventory(): Promise<Inventory> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const raw = localStorage.getItem(KEYS.INVENTORY_CACHE);
      if (raw) {
        cache = JSON.parse(raw) as Inventory;
        return cache;
      }
    } catch {
      /* fall through to the embedded or network copy */
    }

    const embedded = embeddedInventory();
    const data = embedded ?? ((await fetchInventory()) as Inventory);
    cache = data;
    try {
      localStorage.setItem(KEYS.INVENTORY_CACHE, JSON.stringify(data));
    } catch {
      // Inventory is ~145KB and can blow a tight quota — memory cache still holds.
    }
    return data;
  })();

  inflight.catch(() => {
    inflight = null;
  });
  return inflight;
}

async function fetchInventory(): Promise<Inventory> {
  const res = await fetch('./moodoor-inventory.json');
  if (!res.ok) throw new Error(`Inventory unavailable (${res.status}).`);
  return (await res.json()) as Inventory;
}

/** Whatever has already been loaded, for synchronous prompt builders. */
export function peekInventory(): Inventory | null {
  return cache;
}

export function saveInventory(inv: Inventory): void {
  cache = inv;
  try {
    localStorage.setItem(KEYS.INVENTORY_CACHE, JSON.stringify(inv));
  } catch {
    /* memory cache still holds */
  }
}

/** In-stock species only — nothing with `sku_count: 0` is ever selectable. */
export function availableSpecies(inv: Inventory): InventorySpecies[] {
  return (inv.species ?? []).filter((s) => s.sku_count > 0);
}

/** Canon species carried at zero stock, reported when a recipe names one. */
export function registerGapSpecies(inv: Inventory): InventorySpecies[] {
  return (inv.species ?? []).filter((s) => s.sku_count === 0);
}

export interface Pick {
  species: InventorySpecies;
  sku: InventorySku;
}

/**
 * Pick one in-stock SKU, preferring the requested role. Falls back to the full
 * pool rather than returning nothing — a recipe with a missing tier is worse
 * than one whose focal came from an adjacent role.
 */
export function pickSku(inv: Inventory, opts?: { role?: PrimaryRole }): Pick | null {
  const avail = availableSpecies(inv);
  if (!avail.length) return null;

  const role = opts?.role;
  const pool = role ? avail.filter((s) => s.skus.some((k) => k.primary_role === role)) : avail;
  const list = pool.length ? pool : avail;
  const species = list[Math.floor(Math.random() * list.length)];

  const ofRole = role ? species.skus.filter((k) => k.primary_role === role) : species.skus;
  const skus = ofRole.length ? ofRole : species.skus;
  const sku = skus[Math.floor(Math.random() * skus.length)];

  return { species, sku };
}

/** Flatten a pick into the denormalized Material a LibraryItem carries. */
export function materialFromPick(pick: Pick, qty = 1): Material {
  return {
    sku: pick.sku.sku,
    species: pick.species.species,
    canon_id: pick.species.canon_id,
    color_name: pick.sku.color_name,
    primary_hex: pick.sku.hex,
    price: pick.sku.price,
    primary_role: pick.sku.primary_role,
    qty,
  };
}
