import { LRUCache } from 'lru-cache';

type Turn = { role: 'user' | 'assistant', content: string, ts: number };
type Session = Turn[];

const MAX_SESSIONS = parseInt(process.env.MEMORY_MAX_SESSIONS || '500', 10);
const MEMORY_TURNS = parseInt(process.env.MEMORY_TURNS || '10', 10);

export const memory = new LRUCache<string, Session>({
  max: MAX_SESSIONS,
  ttl: 1000 * 60 * 60 * 6, // 6 heures
});

export function addTurn(sessionId: string, role: Turn['role'], content: string) {
  if (!sessionId) return;
  const turns = memory.get(sessionId) || [];
  turns.push({ role, content, ts: Date.now() });
  const trimmed = turns.slice(-MEMORY_TURNS);
  memory.set(sessionId, trimmed);
}

export function getContext(sessionId?: string): string {
  if (!sessionId) return '';
  const turns = memory.get(sessionId) || [];
  if (!turns.length) return '';
  const lines = turns.map((t: Turn) => `${t.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${t.content}`);
  return lines.join('\n');
}
