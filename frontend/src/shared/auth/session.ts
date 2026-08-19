'use client';

export type Session = { token: string; user: { id: string; name: string; email: string; role: string } };
const key = 'tashkent-invest.session';
const eventName = 'tashkent-invest:session';
export function readSession(): Session | null { try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as Session : null; } catch { return null; } }
export function writeSession(session: Session) { window.localStorage.setItem(key, JSON.stringify(session)); window.dispatchEvent(new Event(eventName)); }
export function clearSession() { window.localStorage.removeItem(key); window.dispatchEvent(new Event(eventName)); }
export { eventName as sessionEventName };
