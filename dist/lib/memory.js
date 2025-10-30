import { LRUCache } from 'lru-cache';
const MAX_SESSIONS = parseInt(process.env.MEMORY_MAX_SESSIONS || '500', 10);
const MEMORY_TURNS = parseInt(process.env.MEMORY_TURNS || '10', 10);
export const memory = new LRUCache({
    max: MAX_SESSIONS,
    ttl: 1000 * 60 * 60 * 6, // 6 heures
});
export function addTurn(sessionId, role, content) {
    if (!sessionId)
        return;
    const turns = memory.get(sessionId) || [];
    turns.push({ role, content, ts: Date.now() });
    const trimmed = turns.slice(-MEMORY_TURNS);
    memory.set(sessionId, trimmed);
}
export function getContext(sessionId) {
    if (!sessionId)
        return '';
    const turns = memory.get(sessionId) || [];
    if (!turns.length)
        return '';
    const lines = turns.map((t) => `${t.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${t.content}`);
    return lines.join('\n');
}
