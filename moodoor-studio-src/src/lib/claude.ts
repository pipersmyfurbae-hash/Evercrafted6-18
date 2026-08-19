import Anthropic from '@anthropic-ai/sdk';
import { getApiKey } from './storage';

export const MODEL = 'claude-opus-5';

/**
 * Non-streaming ceiling. Thinking is on by default on Claude Opus 5 and shares
 * this budget with the response, so it needs enough headroom for both a full
 * reasoning pass and an ~8KB JSON package.
 */
const MAX_TOKENS = 16000;

export class MissingApiKeyError extends Error {
  constructor() {
    super('No API key configured. Add one under Settings to generate.');
    this.name = 'MissingApiKeyError';
  }
}

/**
 * The key is supplied by the viewer and stored in their own browser, so calls
 * go straight from the page to the API. `dangerouslyAllowBrowser` is what opts
 * into that — the SDK otherwise refuses to run client-side, since in a shared
 * deployment it would expose the operator's key to every visitor.
 */
function client(): Anthropic {
  const apiKey = getApiKey();
  if (!apiKey) throw new MissingApiKeyError();
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

/** Send one system + user pair and return the concatenated text blocks. */
export async function complete(system: string, userMessage: string): Promise<string> {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: 'user', content: userMessage }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('The request was declined. Try rephrasing the brief.');
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  if (!text.trim()) throw new Error('No response text returned. Please try again.');

  if (response.stop_reason === 'max_tokens') {
    throw new Error('Response hit the token ceiling and was cut off. Try a shorter brief.');
  }
  return text;
}

/**
 * Pull the JSON object out of a completion. The system prompts ask for raw JSON,
 * but a stray fence or lead-in sentence shouldn't cost the user a full re-run.
 */
export function extractJson<T>(raw: string): T {
  let text = raw.replace(/```(?:json)?/gi, '').trim();

  if (!text.startsWith('{')) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new Error('No JSON object found in the response. Please try again.');
    }
    text = text.slice(start, end + 1);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('JSON parse error — the response may have been truncated. Try a shorter brief.');
  }
}

/** Turn any thrown value into something worth showing the operator. */
export function describeError(err: unknown): string {
  if (err instanceof MissingApiKeyError) return err.message;

  if (err instanceof Anthropic.AuthenticationError) {
    return 'That API key was rejected. Check it under Settings.';
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return 'This API key does not have access to ' + MODEL + '.';
  }
  if (err instanceof Anthropic.RateLimitError) {
    return 'Rate limited. Wait a moment and try again.';
  }
  if (err instanceof Anthropic.APIConnectionError) {
    // Opened straight off the filesystem, the browser sends `Origin: null`,
    // which some networks and proxies reject outright. Serving the file fixes it.
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
      return 'Could not reach the API. This page is open from a file, which browsers restrict — try serving the folder instead (see the README), or check your connection.';
    }
    return 'Could not reach the API. Check your connection and try again.';
  }
  if (err instanceof Anthropic.APIError) {
    return `API error (${err.status ?? 'unknown'}): ${err.message}`;
  }
  if (err instanceof Error) return err.message;
  return 'Generation failed. Please try again.';
}
