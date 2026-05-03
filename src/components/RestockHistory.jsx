import { useEffect, useMemo, useState } from "react";
import Sidebar from './Sidebar.jsx';
import { loadHistoryRecords, subscribeToRestockStore } from "../lib/restockStore";

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

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RestockHistory() {
  const [historicalData, setHistoricalData] = useState(() => loadHistoryRecords());
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    status: "all",
    drugName: "",
  });
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");

  useEffect(() => {
    setHistoricalData(loadHistoryRecords());

    return subscribeToRestockStore(() => {
      setHistoricalData(loadHistoryRecords());
    });
  }, []);

  const handleLogout = () => {
    if (window.confirm('Anda yakin ingin logout')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('rememberMe');
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

  const displayRows = useMemo(() => filteredData.map((item) => buildDisplayRow(item)), [filteredData]);

  const summary = useMemo(() => {
    const totalUnit = displayRows.reduce((sum, item) => sum + item.jumlahRestok, 0);
    const totalRecords = displayRows.length;
    const totalDrugs = new Set(displayRows.map((item) => item.namaObat)).size;

    return { totalUnit, totalRecords, totalDrugs };
  }, [displayRows]);

  const exportHistoricalData = () => {
    const headers = ["tanggal","namaObat","targetRestok","jumlahRestok","belumDirestok","status"];
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

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "clamp(12px, 1.4vw, 20px)", overflowY: "auto" }}>
        <div style={{ width: "100%" }}>
          <header style={{ marginBottom: 16 }}>
            <h1 style={{ margin: 0, fontSize: "clamp(22px, 2.5vw, 30px)", color: "#f9fafb" }}>Histori Restok Obat</h1>
            
          </header>

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
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Target Restok</th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Jumlah Direstok</th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Belum Direstok</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {historicalData.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "14px 8px", color: "#6b7280" }}>
                      Belum ada data historis.
                    </td>
                  </tr>
                )}
                {historicalData.length > 0 && filteredData.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "14px 8px", color: "#6b7280" }}>
                      Tidak ada data yang sesuai filter.
                    </td>
                  </tr>
                )}
                {displayRows.map((item, idx) => (
                  <tr key={`${item.namaObat}-${item.tanggal}-${idx}`} style={{ borderBottom: "1px solid #0f151e" }}>
                    <td style={{ padding: "10px 8px", color: "#9ca3af" }}>{item.tanggal}</td>
                    <td style={{ padding: "10px 8px", color: "#e5e7eb", fontWeight: 600 }}>{item.namaObat}</td>
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
        </div>
      </main>
    </div>
  );
}






