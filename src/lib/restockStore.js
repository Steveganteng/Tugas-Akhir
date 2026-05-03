const STORAGE_KEYS = {
  progress: "restock-progress",
  inputResults: "restock-input-results",
  history: "restock-history-records",
};

const RESTOCK_EVENT = "restock-store:change";

export const SAMPLE_HISTORY = [
  {
    id: "seed-paracetamol",
    source: "seed",
    sourceId: "seed-paracetamol",
    tanggal: "2026-04-12",
    namaObat: "Paracetamol 500mg",
    targetRestok: 120,
    jumlahRestok: 120,
    belumDirestok: 0,
    status: "Selesai",
    restockedAt: "2026-04-12T08:00:00.000Z",
  },
  {
    id: "seed-amoxicillin",
    source: "seed",
    sourceId: "seed-amoxicillin",
    tanggal: "2026-04-14",
    namaObat: "Amoxicillin 500mg",
    targetRestok: 150,
    jumlahRestok: 75,
    belumDirestok: 75,
    status: "Parsial",
    restockedAt: "2026-04-14T09:15:00.000Z",
  },
  {
    id: "seed-oralit",
    source: "seed",
    sourceId: "seed-oralit",
    tanggal: "2026-04-16",
    namaObat: "ORS / Oralit",
    targetRestok: 56,
    jumlahRestok: 56,
    belumDirestok: 0,
    status: "Selesai",
    restockedAt: "2026-04-16T10:30:00.000Z",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson(key, fallback) {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (rawValue === null) {
      return fallback;
    }

    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(RESTOCK_EVENT));
}

function cloneFallback(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeStatus(status, targetRestok, jumlahRestok) {
  const remaining = Math.max(0, targetRestok - jumlahRestok);
  if (status) {
    return status;
  }

  return remaining > 0 ? "Parsial" : "Selesai";
}

function formatRestockStatus(restockedQty, recommendedQty) {
  if (restockedQty <= 0) {
    return "Perlu restok";
  }

  if (restockedQty < recommendedQty) {
    return `Parsial (${restockedQty}/${recommendedQty})`;
  }

  return `Selesai (${restockedQty}/${recommendedQty})`;
}

function upsertHistoryRecord(record) {
  const history = loadHistoryRecords();
  const nextHistory = history.filter((item) => item.source !== record.source || item.sourceId !== record.sourceId);
  nextHistory.unshift(record);
  writeJson(STORAGE_KEYS.history, nextHistory);
  return nextHistory;
}

export function subscribeToRestockStore(onChange) {
  if (!canUseStorage()) {
    return () => {};
  }

  const handleChange = () => onChange();

  window.addEventListener(RESTOCK_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(RESTOCK_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function loadDashboardProgress(defaultItems = []) {
  const savedProgress = readJson(STORAGE_KEYS.progress, {});

  return defaultItems.reduce((accumulator, item) => {
    accumulator[item.name] = savedProgress[item.name] ?? {
      fulfilledQty: 0,
      confirmedAt: null,
      lastRestockAt: null,
    };
    return accumulator;
  }, {});
}

export function updateDashboardProgress({ itemName, fulfilledQty, targetRestok }) {
  const nextProgress = readJson(STORAGE_KEYS.progress, {});
  const now = new Date().toISOString();

  nextProgress[itemName] = {
    fulfilledQty,
    confirmedAt: fulfilledQty >= targetRestok ? now : null,
    lastRestockAt: now,
  };

  writeJson(STORAGE_KEYS.progress, nextProgress);

  const historyRecord = {
    id: `${itemName}-${now}`,
    source: "dashboard",
    sourceId: `${itemName}-${now}`,
    tanggal: now.slice(0, 10),
    namaObat: itemName,
    targetRestok,
    jumlahRestok: fulfilledQty,
    belumDirestok: Math.max(0, targetRestok - fulfilledQty),
    status: normalizeStatus(null, targetRestok, fulfilledQty),
    restockedAt: now,
  };

  upsertHistoryRecord(historyRecord);
  return nextProgress;
}

export function adjustDashboardProgress({ itemName, delta }) {
  const nextProgress = readJson(STORAGE_KEYS.progress, {});
  const currentProgress = nextProgress[itemName] ?? {
    fulfilledQty: 0,
    confirmedAt: null,
    lastRestockAt: null,
  };
  const fulfilledQty = Math.max(0, currentProgress.fulfilledQty + delta);
  const now = new Date().toISOString();

  nextProgress[itemName] = {
    fulfilledQty,
    confirmedAt: fulfilledQty > 0 ? now : null,
    lastRestockAt: now,
  };

  writeJson(STORAGE_KEYS.progress, nextProgress);
  return nextProgress;
}

export function resetDashboardProgress({ itemName, targetRestok }) {
  return updateDashboardProgress({ itemName, fulfilledQty: 0, targetRestok });
}

export function loadInputResults() {
  return readJson(STORAGE_KEYS.inputResults, []);
}

export function saveInputResults(results) {
  writeJson(STORAGE_KEYS.inputResults, results);
}

export function addInputResult(result) {
  const nextResults = [result, ...loadInputResults()];
  saveInputResults(nextResults);
  return nextResults;
}

export function setInputResultRestock(resultId, restockQty) {
  const currentResults = loadInputResults();
  const existingItem = currentResults.find((item) => item.id === resultId);

  const nextResults = currentResults.map((item) => {
    if (item.id !== resultId) {
      return item;
    }

    const nextIsRestocked = restockQty > 0;
    const restockedAt = nextIsRestocked ? new Date().toISOString() : null;

    return {
      ...item,
      isRestocked: nextIsRestocked,
      restockedQty: nextIsRestocked ? restockQty : 0,
      restockedAt,
      status: nextIsRestocked ? formatRestockStatus(restockQty, item.rekomendasiRestok) : "Perlu restok",
    };
  });

  saveInputResults(nextResults);

  const updatedItem = nextResults.find((item) => item.id === resultId);
  if (updatedItem) {
    const previousQty = existingItem?.restockedQty ?? 0;
    const progressDelta = updatedItem.isRestocked ? updatedItem.restockedQty : -previousQty;
    adjustDashboardProgress({ itemName: updatedItem.namaObat, delta: progressDelta });

    const restockedQty = updatedItem.isRestocked ? updatedItem.restockedQty : 0;
    const historyRecord = {
      id: updatedItem.id,
      source: "input",
      sourceId: updatedItem.id,
      tanggal: (updatedItem.restockedAt || updatedItem.submittedAt || new Date().toISOString()).slice(0, 10),
      namaObat: updatedItem.namaObat,
      targetRestok: updatedItem.targetStok,
      jumlahRestok: restockedQty,
      belumDirestok: Math.max(0, updatedItem.targetStok - restockedQty),
      status: updatedItem.isRestocked
        ? formatRestockStatus(restockedQty, updatedItem.rekomendasiRestok)
        : normalizeStatus(null, updatedItem.targetStok, restockedQty),
      restockedAt: updatedItem.restockedAt,
    };

    upsertHistoryRecord(historyRecord);
  }

  return nextResults;
}

export function loadHistoryRecords() {
  const savedHistory = readJson(STORAGE_KEYS.history, null);

  if (Array.isArray(savedHistory) && savedHistory.length > 0) {
    return savedHistory;
  }

  const seededHistory = cloneFallback(SAMPLE_HISTORY);
  writeJson(STORAGE_KEYS.history, seededHistory);
  return seededHistory;
}

export function saveHistoryRecords(records) {
  writeJson(STORAGE_KEYS.history, records);
}
