// js/db.js — All localStorage read/write. Single source of truth.

const KEYS = {
  PLANS: 'plans',
  SESSIONS: 'sessions',
  SETTINGS: 'settings',
  EXERCISE_CACHE: 'exerciseCache',
  ACTIVE_SESSION: 'activeSession',
  LAST_PLAN_ID: 'lastPlanId',
};

function _get(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function _set(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function _uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Plans ──────────────────────────────────────────────────────────
export function getPlans() { return _get(KEYS.PLANS) || []; }
export function savePlan(plan) {
  const plans = getPlans();
  const idx = plans.findIndex(p => p.id === plan.id);
  if (idx >= 0) plans[idx] = plan; else plans.push(plan);
  _set(KEYS.PLANS, plans);
  return plan;
}
export function deletePlan(id) { _set(KEYS.PLANS, getPlans().filter(p => p.id !== id)); }
export function createPlanId() { return _uuid(); }

// ── Sessions ───────────────────────────────────────────────────────
export function getSessions() { return _get(KEYS.SESSIONS) || []; }
export function saveSession(session) {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session; else sessions.unshift(session);
  _set(KEYS.SESSIONS, sessions);
  return session;
}
export function deleteSession(id) { _set(KEYS.SESSIONS, getSessions().filter(s => s.id !== id)); }

// ── Settings ───────────────────────────────────────────────────────
export function getSettings() {
  return {
    theme: 'dark',
    language: 'en',
    restTimerSeconds: 90,
    weightUnit: 'kg',
    ...(_get(KEYS.SETTINGS) || {}),
  };
}
export function saveSettings(s) { _set(KEYS.SETTINGS, s); }

// ── Exercise Cache ─────────────────────────────────────────────────
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
export function getCachedEndpoint(endpoint) {
  const cache = _get(KEYS.EXERCISE_CACHE) || {};
  const entry = cache[endpoint];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL) return null;
  return entry.data;
}
export function setCachedEndpoint(endpoint, data) {
  const cache = _get(KEYS.EXERCISE_CACHE) || {};
  cache[endpoint] = { data, cachedAt: Date.now() };
  _set(KEYS.EXERCISE_CACHE, cache);
}

// ── Active Session ─────────────────────────────────────────────────
export function getActiveSession() { return _get(KEYS.ACTIVE_SESSION); }
export function setActiveSession(session) { _set(KEYS.ACTIVE_SESSION, session); }
export function clearActiveSession() { localStorage.removeItem(KEYS.ACTIVE_SESSION); }

// ── Last Plan ──────────────────────────────────────────────────────
export function getLastPlanId() { return _get(KEYS.LAST_PLAN_ID); }
export function setLastPlanId(id) { _set(KEYS.LAST_PLAN_ID, id); }

// ── Clear All ──────────────────────────────────────────────────────
export function clearAllData() { localStorage.clear(); }
