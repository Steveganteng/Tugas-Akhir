const STORAGE_KEY = "admin-requests";
const EVENT = "admin-store:change";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson(key, fallback) {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeToAdminStore(onChange) {
  if (!canUseStorage()) return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function loadRequests() {
  const saved = readJson(STORAGE_KEY, null);
  if (Array.isArray(saved)) return saved;
  return [];
}

export function addRequest(req) {
  const next = [
    {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      ...req,
    },
    ...loadRequests(),
  ];
  writeJson(STORAGE_KEY, next);
  return next[0];
}

export function updateRequest(id, updates) {
  const items = loadRequests().map((r) => (r.id === id ? { ...r, ...updates } : r));
  writeJson(STORAGE_KEY, items);
  return items.find((r) => r.id === id) || null;
}

export function deleteRequest(id) {
  const items = loadRequests().filter((r) => r.id !== id);
  writeJson(STORAGE_KEY, items);
  return items;
}
