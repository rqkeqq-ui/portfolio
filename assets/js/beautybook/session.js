// Port of features/auth/lib/session.ts without React: localStorage session plus a change event.
export const AUTH_SESSION_STORAGE_KEY = 'beautybook.auth.session';
const AUTH_SESSION_EVENT = 'beautybook:auth-session';
const roles = ['CLIENT', 'SALON_OWNER', 'ADMIN', 'SUPER_ADMIN'];

function storage() {
  try { return globalThis.localStorage; } catch { return undefined; }
}

export function getStoredSession() {
  let raw;
  try { raw = storage()?.getItem(AUTH_SESSION_STORAGE_KEY); } catch { return undefined; }
  if (!raw) return undefined;
  try {
    const session = JSON.parse(raw);
    if (!session?.user?.id || !roles.includes(session.user.role) || !session.accessToken) throw new Error('Invalid session');
    return session;
  } catch {
    clearStoredSession();
    return undefined;
  }
}

export function storeSession(session) {
  try { storage()?.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session)); } catch { /* private mode: session lives until reload */ }
  dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function clearStoredSession() {
  try { storage()?.removeItem(AUTH_SESSION_STORAGE_KEY); } catch { /* ignore */ }
  dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function onSessionChange(listener) {
  addEventListener(AUTH_SESSION_EVENT, listener);
  addEventListener('storage', event => { if (event.key === AUTH_SESSION_STORAGE_KEY) listener(); });
}

export function getCabinetHref(role) {
  if (role === 'CLIENT') return '/account';
  if (role === 'SALON_OWNER') return '/dashboard';
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return '/admin';
  return '/search';
}
