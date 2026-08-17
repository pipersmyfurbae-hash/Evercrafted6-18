import { getApiKey } from './storage';

/**
 * Managed Agents, over raw HTTP.
 *
 * The bundled SDK (0.70.1) has no `beta.agents` / `beta.sessions` bindings, and
 * upgrading it to reach them would pull a far larger surface into a file the
 * operator opens by double-clicking. This is four endpoints; `fetch` is enough.
 *
 * The flow is fixed and not negotiable: an Agent is a persisted, versioned
 * config created once (they already exist in the Console); a Session references
 * one by id and is created per run. `model`, `system` and `tools` live on the
 * agent — never on the session.
 */

const BASE = 'https://api.anthropic.com';
const BETA = 'managed-agents-2026-04-01';

export interface ManagedAgent {
  id: string;
  name: string;
  model?: string | { id?: string };
  description?: string;
  version?: number;
}

export interface ManagedEnvironment {
  id: string;
  name: string;
}

export class ManagedAgentsError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ManagedAgentsError';
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = getApiKey();
  if (!key) throw new ManagedAgentsError('No API key configured. Add one under Settings.');

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': BETA,
        // The same opt-in the SDK sets for `dangerouslyAllowBrowser`; without
        // it the API rejects a request that carries a browser Origin.
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ManagedAgentsError('Could not reach the API. Check your connection.');
  }

  const text = await res.text();
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const body = JSON.parse(text) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      /* keep the status-only message */
    }
    if (res.status === 403 || res.status === 404) {
      message += ' Managed Agents is a beta surface — this key may not have access to it.';
    }
    throw new ManagedAgentsError(message, res.status);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

/** The agents already defined in the Console, newest page first. */
export async function listAgents(): Promise<ManagedAgent[]> {
  const body = await call<{ data?: ManagedAgent[] }>('/v1/agents?limit=100');
  return body.data ?? [];
}

/** Reuse an environment by name; environment names are unique, so create once. */
export async function ensureEnvironment(name = 'moodoor-studio'): Promise<ManagedEnvironment> {
  const body = await call<{ data?: ManagedEnvironment[] }>('/v1/environments?limit=100');
  const existing = (body.data ?? []).find((e) => e.name === name);
  if (existing) return existing;

  return call<ManagedEnvironment>('/v1/environments', {
    method: 'POST',
    body: JSON.stringify({
      name,
      // Tagging uses no tools, so the sandbox needs no egress of its own.
      config: { type: 'cloud', networking: { type: 'limited' } },
    }),
  });
}

interface SessionEvent {
  id?: string;
  type?: string;
  content?: { type?: string; text?: string }[];
  stop_reason?: { type?: string };
  error?: { message?: string };
}

export interface Session {
  id: string;
  status?: string;
}

export async function createSession(agentId: string, environmentId: string, title: string) {
  return call<Session>('/v1/sessions', {
    method: 'POST',
    body: JSON.stringify({ agent: agentId, environment_id: environmentId, title }),
  });
}

export async function sendMessage(sessionId: string, text: string): Promise<void> {
  await call(`/v1/sessions/${sessionId}/events`, {
    method: 'POST',
    body: JSON.stringify({
      events: [{ type: 'user.message', content: [{ type: 'text', text }] }],
    }),
  });
}

export async function archiveSession(sessionId: string): Promise<void> {
  await call(`/v1/sessions/${sessionId}/archive`, { method: 'POST' }).catch(() => {
    /* cleanup is best-effort — a stuck archive shouldn't fail the run */
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Wait for the agent to finish this turn and return everything it said.
 *
 * Polling rather than SSE: the events endpoint returns immediately and replays
 * the whole history, so a dropped connection costs nothing — where a dropped
 * stream would silently lose every event in the gap.
 *
 * The break gate is deliberate. `status_idle` alone is not "done": the session
 * also idles while waiting on a tool confirmation, which is a request for the
 * caller to act, not the end of the turn.
 */
export async function awaitTurn(
  sessionId: string,
  opts: { seenIds: Set<string>; signal?: { cancelled: boolean }; timeoutMs?: number } = {
    seenIds: new Set(),
  },
): Promise<string> {
  const { seenIds, signal, timeoutMs = 300_000 } = opts;
  const started = Date.now();
  const said: string[] = [];

  for (;;) {
    if (signal?.cancelled) throw new ManagedAgentsError('Cancelled.');
    if (Date.now() - started > timeoutMs) {
      throw new ManagedAgentsError('The agent did not finish in time.');
    }

    const body = await call<{ data?: SessionEvent[] }>(
      `/v1/sessions/${sessionId}/events?limit=1000`,
    );

    let done = false;
    for (const ev of body.data ?? []) {
      if (ev.id && seenIds.has(ev.id)) {
        // Already recorded — but terminal checks must still run, or a terminal
        // event seen on an earlier poll would never end the loop.
      } else {
        if (ev.id) seenIds.add(ev.id);
        if (ev.type === 'agent.message') {
          for (const block of ev.content ?? []) {
            if (block.type === 'text' && block.text) said.push(block.text);
          }
        }
        if (ev.type === 'session.error' && ev.error?.message) {
          throw new ManagedAgentsError(ev.error.message);
        }
      }

      if (ev.type === 'session.status_terminated') done = true;
      if (ev.type === 'session.status_idle' && ev.stop_reason?.type !== 'requires_action') {
        done = true;
      }
    }

    if (done) return said.join('\n');
    await sleep(1500);
  }
}
