import React, { useEffect, useState } from "react";
import { loadHistoryRecords } from "../../lib/restockStore";
import AdminLayout from "./AdminLayout";

function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(',')];
  for (const r of rows) {
    lines.push(keys.map(k=>`"${String(r[k] ?? '')}"`).join(','));
  }
  return lines.join('\n');
}

export default function ReportsAdmin() {
  const [history, setHistory] = useState(() => loadHistoryRecords());

  useEffect(() => {
    const onStorage = () => setHistory(loadHistoryRecords());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleExport = () => {
    const csv = toCSV(history);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'restock-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout
      activeNav="report"
      pageTitle="Laporan"
      pageSubtitle="Lihat histori restok dan export data untuk kebutuhan audit."
    >
      <section className="admin-panel">
        <h2 className="admin-panel-title">Laporan & Export</h2>
        <p className="admin-panel-subtitle">Unduh data histori restok ke format CSV.</p>
        <div style={{ marginTop: 12 }}>
          <button className="admin-btn admin-btn-primary" onClick={handleExport}>Export CSV</button>
        </div>
      </section>

      <section className="admin-panel">
        <h2 className="admin-panel-title">Histori Re-stock</h2>
        <table className="admin-table">
          <thead><tr><th>Tanggal</th><th>Nama Obat</th><th>Jumlah</th><th>Status</th></tr></thead>
          <tbody>
            {history.map(h=> (
              <tr key={h.id}><td>{h.tanggal}</td><td>{h.namaObat}</td><td>{h.jumlahRestok}</td><td>{h.status}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminLayout>
  );
}
