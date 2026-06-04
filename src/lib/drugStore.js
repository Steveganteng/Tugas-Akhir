const STORAGE_KEYS = {
  drugs: "drug-master-data",
};

const DRUG_EVENT = "drug-store:change";

export const SAMPLE_DRUGS = [
  {
    id: "drug-001",
    nama: "Paracetamol 500mg",
    stok: 120,
    harga: 1500,
    satuan: "tablet",
    lokasi: "Rak A1",
    createdAt: "2026-04-01T10:00:00.000Z",
  },
  {
    id: "drug-002",
    nama: "Amoxicillin 500mg",
    stok: 80,
    harga: 8500,
    satuan: "kapsul",
    lokasi: "Rak A2",
    createdAt: "2026-04-01T10:00:00.000Z",
  },
  {
    id: "drug-003",
    nama: "Cetirizine 10mg",
    stok: 66,
    harga: 3500,
    satuan: "tablet",
    lokasi: "Rak B1",
    createdAt: "2026-04-01T10:00:00.000Z",
  },
  {
    id: "drug-004",
    nama: "ORS / Oralit",
    stok: 40,
    harga: 2500,
    satuan: "sachet",
    lokasi: "Rak C1",
    createdAt: "2026-04-01T10:00:00.000Z",
  },
  {
    id: "drug-005",
    nama: "Ibuprofen 400mg",
    stok: 72,
    harga: 2000,
    satuan: "tablet",
    lokasi: "Rak A3",
    createdAt: "2026-04-01T10:00:00.000Z",
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
  window.dispatchEvent(new Event(DRUG_EVENT));
}

function cloneFallback(value) {
  return JSON.parse(JSON.stringify(value));
}

export function subscribeToDrugStore(onChange) {
  if (!canUseStorage()) {
    return () => {};
  }

  const handleChange = () => onChange();

  window.addEventListener(DRUG_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(DRUG_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function loadDrugs() {
  const savedDrugs = readJson(STORAGE_KEYS.drugs, null);

  if (Array.isArray(savedDrugs) && savedDrugs.length > 0) {
    return savedDrugs;
  }

  const seededDrugs = cloneFallback(SAMPLE_DRUGS);
  writeDrugs(seededDrugs);
  return seededDrugs;
}

export function writeDrugs(drugs) {
  writeJson(STORAGE_KEYS.drugs, drugs);
}

export function addDrug(drug) {
  const drugs = loadDrugs();
  const newDrug = {
    ...drug,
    id: drug.id || `drug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: drug.createdAt || new Date().toISOString(),
  };
  drugs.unshift(newDrug);
  writeDrugs(drugs);
  return newDrug;
}

export function updateDrug(drugId, updates) {
  const drugs = loadDrugs();
  const index = drugs.findIndex((d) => d.id === drugId);

  if (index === -1) {
    throw new Error(`Drug with id ${drugId} not found`);
  }

  drugs[index] = {
    ...drugs[index],
    ...updates,
    id: drugs[index].id,
    createdAt: drugs[index].createdAt,
  };

  writeDrugs(drugs);
  return drugs[index];
}

export function adjustDrugStock(drugId, delta) {
  const drugs = loadDrugs();
  const index = drugs.findIndex((d) => d.id === drugId);

  if (index === -1) {
    throw new Error(`Drug with id ${drugId} not found`);
  }

  const current = Number(drugs[index].stok) || 0;
  const next = Math.max(0, current + Number(delta));

  drugs[index] = {
    ...drugs[index],
    stok: next,
  };

  writeDrugs(drugs);
  return drugs[index];
}

export function deleteDrug(drugId) {
  const drugs = loadDrugs();
  const nextDrugs = drugs.filter((d) => d.id !== drugId);
  writeDrugs(nextDrugs);
  return nextDrugs;
}

export function getDrugById(drugId) {
  const drugs = loadDrugs();
  return drugs.find((d) => d.id === drugId) || null;
}

export function searchDrugs(query) {
  const drugs = loadDrugs();
  const lowerQuery = query.toLowerCase();

  return drugs.filter(
    (drug) =>
      drug.nama.toLowerCase().includes(lowerQuery) ||
      drug.satuan.toLowerCase().includes(lowerQuery) ||
      drug.lokasi.toLowerCase().includes(lowerQuery)
  );
}

export function getLowStockDrugs(threshold = 50) {
  const drugs = loadDrugs();
  return drugs.filter((d) => d.stok <= threshold).sort((a, b) => a.stok - b.stok);
}
