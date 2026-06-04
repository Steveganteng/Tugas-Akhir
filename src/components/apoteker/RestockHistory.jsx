import { useEffect, useMemo, useState } from "react";
import { clearAuthState, getAuthState, getHomePathForRole, ROLE_APOTEKER, ROLE_ADMIN } from "../../lib/auth";
import { loadHistoryRecords, subscribeToRestockStore, saveHistoryRecords, SAMPLE_HISTORY } from "../../lib/restockStore";
import { loadDrugs, subscribeToDrugStore } from "../../lib/drugStore";
import ProfileCard from "./ProfileCard";
import ApotekerLayout from "./ApotekerLayout";

function normalizeRestockRow(input, indexLabel) {
  const jumlah = Number(input.jumlahRestok);
  if (Number.isNaN(jumlah)) {
    throw new Error(`Jumlah restok tidak valid pada ${indexLabel}.`);
  }

  const rawStatus = String(input.status || "").trim();
  const lowerStatus = rawStatus.toLowerCase();
  const isParsial = lowerStatus.includes("parsial");

  const hasTarget = input.targetRestok !== undefined && input.targetRestok !== null && String(input.targetRestok).trim() !== "";
  if (isParsial && !hasTarget) {
    throw new Error(`Data parsial pada ${indexLabel} wajib memiliki targetRestok.`);
  }

  const target = hasTarget ? Number(input.targetRestok) : jumlah;
  if (Number.isNaN(target) || target < jumlah) {
    throw new Error(`targetRestok tidak valid pada ${indexLabel}. Nilai target tidak boleh lebih kecil dari jumlahRestok.`);
  }

  const remaining = Math.max(0, target - jumlah);

  return {
    tanggal: input.tanggal || "-",
    namaObat: input.namaObat || "-",
    jumlahRestok: jumlah,
    targetRestok: target,
    belumDirestok: remaining,
    status: remaining > 0 ? "Parsial" : "Selesai",
  };
}

function buildDisplayRow(item) {
  const jumlah = Number(item.jumlahRestok) || 0;
  const targetCandidate = Number(item.targetRestok);
  const target = Number.isFinite(targetCandidate) && targetCandidate > 0 ? targetCandidate : jumlah;
  const remaining = Math.max(0, target - jumlah);

  return {
    ...item,
    jumlahRestok: jumlah,
    targetRestok: target,
    belumDirestok: remaining,
    status: remaining > 0 ? "Parsial" : "Selesai",
  };
}

function resolveMasterDrug(item, drugs) {
  if (!item) {
    return null;
  }

  if (item.drugId) {
    const byId = drugs.find((drug) => drug.id === item.drugId);
    if (byId) {
      return byId;
    }
  }

  const needle = String(item.namaObat || "").toLowerCase();
  const exact = drugs.find((drug) => drug.nama.toLowerCase() === needle);
  if (exact) {
    return exact;
  }

  return drugs.find((drug) => drug.nama.toLowerCase().includes(needle)) || null;
}


function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RestockHistory() {
  const [historicalData, setHistoricalData] = useState(() => loadHistoryRecords());
  const [error, setError] = useState(null);
  const [drugs, setDrugs] = useState(() => loadDrugs());
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    status: "all",
    drugName: "",
  });
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");

  useEffect(() => {
    const authState = getAuthState();
    if (!authState.isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    if (authState.role && authState.role !== ROLE_APOTEKER && authState.role !== ROLE_ADMIN) {
      window.location.href = getHomePathForRole(authState.role);
      return;
    }

    setIsAuthorized(true);

    try {
      setHistoricalData(loadHistoryRecords());
      setError(null);
    } catch (e) {
      console.error("Error loading history records:", e);
      setError(String(e?.message || e));
    }

    return subscribeToRestockStore(() => {
      try {
        setHistoricalData(loadHistoryRecords());
        setError(null);
      } catch (e) {
        console.error("Error loading history records (subscribe):", e);
        setError(String(e?.message || e));
      }
    });
  }, []);

  useEffect(() => {
    setDrugs(loadDrugs());

    return subscribeToDrugStore(() => {
      setDrugs(loadDrugs());
    });
  }, []);

  const handleLogout = () => {
    if (window.confirm('Anda yakin ingin logout?')) {
      clearAuthState();
      window.location.href = '/login';
    }
  };

  const statusOptions = useMemo(
    () => [...new Set(historicalData.map((item) => item.status).filter(Boolean))],
    [historicalData]
  );

  const filteredData = useMemo(() => {
    return historicalData.filter((item) => {
      const itemDate = new Date(item.tanggal);
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
      const toDate = filters.toDate ? new Date(filters.toDate) : null;

      if (fromDate && !Number.isNaN(itemDate.getTime()) && itemDate < fromDate) {
        return false;
      }

      if (toDate && !Number.isNaN(itemDate.getTime())) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        if (itemDate > endDate) {
          return false;
        }
      }

      if (filters.status !== "all" && item.status.toLowerCase() !== filters.status.toLowerCase()) {
        return false;
      }

      if (filters.drugName.trim()) {
        const needle = filters.drugName.trim().toLowerCase();
        if (!item.namaObat.toLowerCase().includes(needle)) {
          return false;
        }
      }

      return true;
    });
  }, [historicalData, filters]);

  const displayRows = useMemo(
    () =>
      filteredData.map((item) => {
        const masterDrug = resolveMasterDrug(item, drugs);
        return {
          ...buildDisplayRow(item),
          drugId: item.drugId || masterDrug?.id || null,
          masterNamaObat: masterDrug?.nama || item.namaObat,
          masterStok: masterDrug?.stok ?? null,
        };
      }),
    [filteredData, drugs]
  );

  const summary = useMemo(() => {
    const totalUnit = displayRows.reduce((sum, item) => sum + item.jumlahRestok, 0);
    const totalRecords = displayRows.length;
    const totalDrugs = new Set(displayRows.map((item) => item.namaObat)).size;

    return { totalUnit, totalRecords, totalDrugs };
  }, [displayRows]);

  const exportHistoricalData = () => {
    const headers = ["tanggal","namaObat","drugId","targetRestok","jumlahRestok","belumDirestok","status"];
    const rows = historicalData.map((item) =>
      headers
        .map((h) => {
          const v = item[h] ?? "";
          return `"${String(v).replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historis-restok-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reseedHistory = () => {
    try {
      saveHistoryRecords(SAMPLE_HISTORY);
      const reloaded = loadHistoryRecords();
      setHistoricalData(reloaded);
      setError(null);
    } catch (e) {
      console.error("Failed to reseed history:", e);
      setError(String(e?.message || e));
    }
  };

  const clearHistory = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("restock-history-records");
      }
      const reloaded = loadHistoryRecords();
      setHistoricalData(reloaded);
      setError(null);
    } catch (e) {
      console.error("Failed to clear history:", e);
      setError(String(e?.message || e));
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setActiveQuickFilter("custom");
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ fromDate: "", toDate: "", status: "all", drugName: "" });
    setActiveQuickFilter("all");
  };

  const applyQuickFilter = (key) => {
    const today = new Date();
    const todayText = toInputDate(today);

    if (key === "today") {
      setFilters((prev) => ({
        ...prev,
        fromDate: todayText,
        toDate: todayText,
      }));
      setActiveQuickFilter("today");
      return;
    }

    if (key === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6);
      setFilters((prev) => ({
        ...prev,
        fromDate: toInputDate(weekAgo),
        toDate: todayText,
      }));
      setActiveQuickFilter("week");
      return;
    }

    if (key === "month") {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setFilters((prev) => ({
        ...prev,
        fromDate: toInputDate(firstDayOfMonth),
        toDate: todayText,
      }));
      setActiveQuickFilter("month");
      return;
    }

    if (key === "selesai") {
      setFilters((prev) => ({ ...prev, status: "Selesai" }));
      setActiveQuickFilter("selesai");
      return;
    }

    if (key === "parsial") {
      setFilters((prev) => ({ ...prev, status: "Parsial" }));
      setActiveQuickFilter("parsial");
      return;
    }

    resetFilters();
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <ApotekerLayout
      activeNav="history"
      pageTitle="Histori Restok Obat"
      pageSubtitle="Halaman ini menampilkan jumlah obat yang sudah direstok dan mendukung ekspor data historis."
    >
      <div style={{ width: "100%", maxWidth: 1440, margin: "0 auto" }}>
          <header style={{ marginBottom: 16 }}>
            <h1 style={{ margin: 0, fontSize: "clamp(22px, 2.5vw, 30px)", color: "#f9fafb" }}>Histori Restok Obat</h1>
            <p style={{ marginTop: 8, color: "#9ca3af", fontSize: 14 }}>
              Halaman ini menampilkan jumlah obat yang sudah direstok dan mendukung ekspor data historis.
            </p>
          </header>

          {/* Visible debug / error panel to help diagnose empty page */}
          {error ? (
            <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: "#2b0f18", border: "1px solid #58151b", color: "#fecaca" }}>
              <strong>Terjadi kesalahan saat memuat histori:</strong>
              <div style={{ marginTop: 8, fontSize: 13 }}>{error}</div>
            </div>
          ) : null}

          <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: "#071124", border: "1px solid #102030", color: "#9ca3af" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb" }}>Debug: Data Historis</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Records in memory: <strong style={{ color: "#e5e7eb" }}>{Array.isArray(historicalData) ? historicalData.length : String(historicalData)}</strong></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={reseedHistory} style={{ background: "#0ea5e9", color: "#011827", padding: "8px 10px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>Re-seed sample data</button>
                <button onClick={clearHistory} style={{ background: "transparent", border: "1px solid #1f2937", color: "#d1d5db", padding: "8px 10px", borderRadius: 8, cursor: "pointer" }}>Clear history</button>
              </div>
            </div>

            <details style={{ marginTop: 12, color: "#cbd5e1" }}>
              <summary style={{ cursor: "pointer" }}>Preview raw history (click to expand)</summary>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, fontSize: 12, color: "#cbd5e1", maxHeight: 260, overflow: "auto" }}>{JSON.stringify(historicalData, null, 2)}</pre>
            </details>
          </div>

          <section
            style={{
              background: "#0d1117",
              border: "1px solid #161b22",
              borderRadius: 14,
              padding: 18,
              marginBottom: 16,
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => exportHistoricalData()}
                style={{
                  border: "1px solid #0369a1",
                  background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                  color: "#ecfeff",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Export Data Historis (Excel/CSV)
              </button>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Ekspor data historis saat ini ke file CSV (dapat dibuka dengan Excel).
              </span>
            </div>
          </section>

          <section
            style={{
              background: "#0d1117",
              border: "1px solid #161b22",
              borderRadius: 14,
              padding: 18,
              marginBottom: 16,
              display: "grid",
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 17, color: "#f9fafb" }}>Filter Data Historis</h2>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => applyQuickFilter("today")}
                style={{
                  border: "1px solid",
                  borderColor: activeQuickFilter === "today" ? "#0369a1" : "#1f2937",
                  background: activeQuickFilter === "today" ? "#0c4a6e" : "#111827",
                  color: activeQuickFilter === "today" ? "#bae6fd" : "#cbd5e1",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => applyQuickFilter("week")}
                style={{
                  border: "1px solid",
                  borderColor: activeQuickFilter === "week" ? "#0369a1" : "#1f2937",
                  background: activeQuickFilter === "week" ? "#0c4a6e" : "#111827",
                  color: activeQuickFilter === "week" ? "#bae6fd" : "#cbd5e1",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => applyQuickFilter("month")}
                style={{
                  border: "1px solid",
                  borderColor: activeQuickFilter === "month" ? "#0369a1" : "#1f2937",
                  background: activeQuickFilter === "month" ? "#0c4a6e" : "#111827",
                  color: activeQuickFilter === "month" ? "#bae6fd" : "#cbd5e1",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => applyQuickFilter("selesai")}
                style={{
                  border: "1px solid",
                  borderColor: activeQuickFilter === "selesai" ? "#14532d" : "#1f2937",
                  background: activeQuickFilter === "selesai" ? "#052e16" : "#111827",
                  color: activeQuickFilter === "selesai" ? "#bbf7d0" : "#cbd5e1",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Status Selesai
              </button>
              <button
                type="button"
                onClick={() => applyQuickFilter("parsial")}
                style={{
                  border: "1px solid",
                  borderColor: activeQuickFilter === "parsial" ? "#92400e" : "#1f2937",
                  background: activeQuickFilter === "parsial" ? "#422006" : "#111827",
                  color: activeQuickFilter === "parsial" ? "#fde68a" : "#cbd5e1",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Status Parsial
              </button>
              <button
                type="button"
                onClick={() => applyQuickFilter("all")}
                style={{
                  border: "1px solid",
                  borderColor: activeQuickFilter === "all" ? "#475569" : "#1f2937",
                  background: activeQuickFilter === "all" ? "#1e293b" : "#111827",
                  color: "#e2e8f0",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Reset Cepat
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: 10,
                alignItems: "end",
              }}
            >
              <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#9ca3af" }}>
                Dari Tanggal
                <input
                  type="date"
                  name="fromDate"
                  value={filters.fromDate}
                  onChange={handleFilterChange}
                  style={{ background: "#111827", color: "#f9fafb", border: "1px solid #1f2937", borderRadius: 8, padding: "9px 10px" }}
                />
              </label>

              <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#9ca3af" }}>
                Sampai Tanggal
                <input
                  type="date"
                  name="toDate"
                  value={filters.toDate}
                  onChange={handleFilterChange}
                  style={{ background: "#111827", color: "#f9fafb", border: "1px solid #1f2937", borderRadius: 8, padding: "9px 10px" }}
                />
              </label>

              <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#9ca3af" }}>
                Status
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  style={{ background: "#111827", color: "#f9fafb", border: "1px solid #1f2937", borderRadius: 8, padding: "9px 10px" }}
                >
                  <option value="all">Semua Status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#9ca3af" }}>
                Nama Obat
                <input
                  type="text"
                  name="drugName"
                  value={filters.drugName}
                  onChange={handleFilterChange}
                  placeholder="Cari nama obat"
                  style={{ background: "#111827", color: "#f9fafb", border: "1px solid #1f2937", borderRadius: 8, padding: "9px 10px" }}
                />
              </label>

              <button
                type="button"
                onClick={resetFilters}
                style={{
                  border: "1px solid #1f2937",
                  background: "#111827",
                  color: "#d1d5db",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Reset Filter
              </button>
            </div>
          </section>

          <section
            style={{
              background: "#0d1117",
              border: "1px solid #161b22",
              borderRadius: 14,
              padding: 18,
              marginBottom: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>Jumlah Obat Direstok</div>
              <div style={{ fontSize: 30, color: "#4ade80", fontWeight: 800 }}>{summary.totalUnit} unit</div>
            </div>
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>Jumlah Transaksi</div>
              <div style={{ fontSize: 30, color: "#60a5fa", fontWeight: 800 }}>{summary.totalRecords}</div>
            </div>
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>Jenis Obat Direstok</div>
              <div style={{ fontSize: 30, color: "#facc15", fontWeight: 800 }}>{summary.totalDrugs}</div>
            </div>
          </section>

          <section
            style={{
              background: "#0d1117",
              border: "1px solid #161b22",
              borderRadius: 14,
              padding: 18,
              overflowX: "auto",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 19, color: "#f9fafb" }}>Data Historis Restok</h2>
            <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse", marginTop: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1f2937" }}>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Tanggal</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Nama Obat</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Master</th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Target Restok</th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Jumlah Direstok</th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Belum Direstok</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {historicalData.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "14px 8px", color: "#6b7280" }}>
                      Belum ada data historis.
                    </td>
                  </tr>
                )}
                {historicalData.length > 0 && filteredData.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "14px 8px", color: "#6b7280" }}>
                      Tidak ada data yang sesuai filter.
                    </td>
                  </tr>
                )}
                {displayRows.map((item, idx) => (
                  <tr key={`${item.namaObat}-${item.tanggal}-${idx}`} style={{ borderBottom: "1px solid #0f151e" }}>
                    <td style={{ padding: "10px 8px", color: "#9ca3af" }}>{item.tanggal}</td>
                    <td style={{ padding: "10px 8px", color: "#e5e7eb", fontWeight: 600 }}>{item.namaObat}</td>
                    <td style={{ padding: "10px 8px", color: "#9ca3af" }}>
                      {item.masterNamaObat}
                      {item.masterStok !== null ? <div style={{ fontSize: 11, color: "#6b7280" }}>Stok master: {item.masterStok}</div> : null}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#93c5fd", fontWeight: 700 }}>
                      {item.targetRestok}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#4ade80", fontWeight: 700 }}>
                      {item.jumlahRestok}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: item.belumDirestok > 0 ? "#facc15" : "#4ade80", fontWeight: 700 }}>
                      {item.belumDirestok}
                    </td>
                    <td style={{ padding: "10px 8px", color: item.belumDirestok > 0 ? "#facc15" : "#4ade80", fontWeight: 600 }}>
                      {item.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }} />
            <ProfileCard />
          </div>
        </div>
    </ApotekerLayout>
  );
}
