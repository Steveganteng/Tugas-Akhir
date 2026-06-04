import { searchDrugs, adjustDrugStock, getDrugById } from "./drugStore";

const STORAGE_KEYS = {
  progress: "restock-progress",
  inputResults: "restock-input-results",
  history: "restock-history-records",
  requests: "restock-requests",
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

function getProgressKey(item) {
  if (!item) {
    return null;
  }

  return item.drugId || item.id || item.name || null;
}

function resolveDrugReference({ drugId, namaObat }) {
  if (drugId) {
    const byId = getDrugById(drugId);
    if (byId) {
      return byId;
    }
  }

  const matches = searchDrugs(namaObat || "");
  if (matches.length === 0) {
    return null;
  }

  const exactMatch = matches.find((drug) => drug.nama.toLowerCase() === String(namaObat || "").toLowerCase());
  return exactMatch || matches[0];
}

function normalizeInputRecord(record) {
  const drug = resolveDrugReference(record);
  if (!drug) {
    return record;
  }

  return {
    ...record,
    drugId: record.drugId || drug.id,
    namaObat: record.namaObat || drug.nama,
  };
}

function normalizeHistoryRecord(record) {
  const drug = resolveDrugReference(record);
  if (!drug) {
    return record;
  }

  return {
    ...record,
    drugId: record.drugId || drug.id,
    namaObat: record.namaObat || drug.nama,
  };
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
    const nextKey = getProgressKey(item);
    const legacyKey = item.name;
    accumulator[nextKey] = savedProgress[nextKey] ?? savedProgress[legacyKey] ?? {
      fulfilledQty: 0,
      confirmedAt: null,
      lastRestockAt: null,
    };
    return accumulator;
  }, {});
}

export function updateDashboardProgress({ itemName, itemId, fulfilledQty, targetRestok }) {
  const nextProgress = readJson(STORAGE_KEYS.progress, {});
  const now = new Date().toISOString();
  const progressKey = itemId || itemName;

  const previousProgress = readJson(STORAGE_KEYS.progress, {});
  const previousFulfilled = previousProgress[progressKey]?.fulfilledQty ?? previousProgress[itemName]?.fulfilledQty ?? 0;

  nextProgress[progressKey] = {
    fulfilledQty,
    confirmedAt: fulfilledQty >= targetRestok ? now : null,
    lastRestockAt: now,
  };

  if (itemName && progressKey !== itemName && previousProgress[itemName]) {
    delete nextProgress[itemName];
  }

  writeJson(STORAGE_KEYS.progress, nextProgress);

  // Synchronize change with master drug store when possible (use name match)
  try {
    const delta = fulfilledQty - previousFulfilled;
    if (delta !== 0) {
      const matches = searchDrugs(itemName);
      const matched = matches && matches.length > 0 ? matches[0] : null;
      if (matched) {
        adjustDrugStock(matched.id, delta);
      }
    }
  } catch (e) {
    // ignore sync errors
  }

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
  const savedResults = readJson(STORAGE_KEYS.inputResults, []);
  if (!Array.isArray(savedResults) || savedResults.length === 0) {
    return [];
  }

  const normalizedResults = savedResults.map((record) => normalizeInputRecord(record));
  const changed = normalizedResults.some((record, index) => record.drugId !== savedResults[index]?.drugId || record.namaObat !== savedResults[index]?.namaObat);
  if (changed) {
    saveInputResults(normalizedResults);
  }

  return normalizedResults;
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

    // Synchronize with master drug store. Prefer `drugId` when available,
    // fallback to name-matching for older records.
    try {
      let targetDrugId = updatedItem.drugId;
      let matched = null;
      if (!targetDrugId) {
        const matches = searchDrugs(updatedItem.namaObat);
        matched = matches && matches.length > 0 ? matches[0] : null; // use first fuzzy match
        if (matched) targetDrugId = matched.id;
      }

      if (targetDrugId) {
        const newQty = updatedItem.isRestocked ? updatedItem.restockedQty : 0;
        const deltaForMaster = newQty - previousQty;
        if (deltaForMaster !== 0) {
          adjustDrugStock(targetDrugId, deltaForMaster);
        }

        // if we matched by name and original item lacked drugId, persist it for future reliability
        if (matched && !updatedItem.drugId) {
          const updatedResultsWithId = nextResults.map((it) => (it.id === updatedItem.id ? { ...it, drugId: matched.id } : it));
          saveInputResults(updatedResultsWithId);
        }
      }
    } catch (e) {
      // ignore errors from drug store synchronization
    }

    const restockedQty = updatedItem.isRestocked ? updatedItem.restockedQty : 0;
    const historyRecord = {
      id: updatedItem.id,
      source: "input",
      sourceId: updatedItem.id,
      tanggal: (updatedItem.restockedAt || updatedItem.submittedAt || new Date().toISOString()).slice(0, 10),
      namaObat: updatedItem.namaObat,
      drugId: updatedItem.drugId ?? null,
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
    const normalizedHistory = savedHistory.map((record) => normalizeHistoryRecord(record));
    const changed = normalizedHistory.some((record, index) => record.drugId !== savedHistory[index]?.drugId || record.namaObat !== savedHistory[index]?.namaObat);
    if (changed) {
      saveHistoryRecords(normalizedHistory);
    }

    return normalizedHistory;
  }

  const seededHistory = cloneFallback(SAMPLE_HISTORY);
  writeJson(STORAGE_KEYS.history, seededHistory);
  return seededHistory;
}

export function saveHistoryRecords(records) {
  writeJson(STORAGE_KEYS.history, records);
}

// ===== Restock Requests Management =====

export function loadRestockRequests() {
  const requests = readJson(STORAGE_KEYS.requests, []);
  return Array.isArray(requests) ? requests : [];
}

export function saveRestockRequests(requests) {
  writeJson(STORAGE_KEYS.requests, requests);
}

export function createRestockRequest({ tanggal, drugId, namaObat, jumlahRestok, targetRestok, notes = '' }) {
  const now = new Date().toISOString();
  const request = {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending', // pending, approved, rejected
    tanggal: tanggal || now.slice(0, 10),
    drugId: drugId || null,
    namaObat,
    jumlahRestok: Number(jumlahRestok),
    targetRestok: Number(targetRestok) || Number(jumlahRestok),
    notes,
    requestedAt: now,
    approvedAt: null,
    approvedQty: 0,
    approvalReason: '',
    rejectedAt: null,
    rejectionReason: '',
  };

  const requests = loadRestockRequests();
  requests.unshift(request);
  saveRestockRequests(requests);
  return request;
}

export function approveRestockRequest(requestId, approvedQty, approvalReason = '') {
  const requests = loadRestockRequests();
  const request = requests.find(r => r.id === requestId);
  
  if (!request) {
    throw new Error(`Request ${requestId} tidak ditemukan`);
  }

  const now = new Date().toISOString();
  request.status = 'approved';
  request.approvedQty = Number(approvedQty);
  request.approvalReason = approvalReason;
  request.approvedAt = now;

  saveRestockRequests(requests);

  // Tambahkan ke history records
  const historyRecord = {
    id: `${request.id}-approved`,
    source: 'approval',
    sourceId: request.id,
    tanggal: request.tanggal,
    namaObat: request.namaObat,
    drugId: request.drugId,
    targetRestok: request.targetRestok,
    jumlahRestok: Number(approvedQty),
    belumDirestok: Math.max(0, request.targetRestok - Number(approvedQty)),
    status: Number(approvedQty) >= request.targetRestok ? 'Selesai' : 'Parsial',
    restockedAt: now,
    approvalReason,
  };

  const history = loadHistoryRecords();
  history.unshift(historyRecord);
  saveHistoryRecords(history);

  return request;
}

export function rejectRestockRequest(requestId, rejectionReason = '') {
  const requests = loadRestockRequests();
  const request = requests.find(r => r.id === requestId);
  
  if (!request) {
    throw new Error(`Request ${requestId} tidak ditemukan`);
  }

  const now = new Date().toISOString();
  request.status = 'rejected';
  request.rejectionReason = rejectionReason;
  request.rejectedAt = now;

  saveRestockRequests(requests);
  return request;
}
