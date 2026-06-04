import React, { useEffect, useState } from "react";
import { loadDrugs, adjustDrugStock, getDrugById } from "../../lib/drugStore";
import { loadHistoryRecords, saveHistoryRecords } from "../../lib/restockStore";
import AdminLayout from "./AdminLayout";

export default function ReceivingAdmin() {
  const [drugs, setDrugs] = useState(() => loadDrugs());
  const [form, setForm] = useState({ drugId: '', jumlah: 0, nota: '' });

  useEffect(() => {
    // simple listener via storage event already in drugStore; reload when needed
    const handler = () => setDrugs(loadDrugs());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.drugId) return alert('Pilih obat');
    const qty = Number(form.jumlah || 0);
    if (!qty) return alert('Jumlah harus > 0');

    adjustDrugStock(form.drugId, qty);

    // add history record
    const drug = getDrugById(form.drugId) || { nama: '' };
    const history = loadHistoryRecords();
    const record = {
      id: `receiving-${Date.now()}`,
      source: 'receiving',
      sourceId: `receiving-${Date.now()}`,
      tanggal: new Date().toISOString().slice(0,10),
      namaObat: drug.nama,
      drugId: form.drugId,
      targetRestok: 0,
      jumlahRestok: qty,
      belumDirestok: 0,
      status: 'Selesai',
      restockedAt: new Date().toISOString(),
      nota: form.nota,
    };
    saveHistoryRecords([record, ...history]);

    setForm({ drugId: '', jumlah: 0, nota: '' });
    alert('Penerimaan disimpan');
  };

  return (
    <AdminLayout
      activeNav="receiving"
      pageTitle="Input Penerimaan"
      pageSubtitle="Catat penerimaan stok obat yang masuk dari pemasok."
    >
      <section className="admin-panel" style={{ maxWidth: 760 }}>
        <h2 className="admin-panel-title">Input Penerimaan Obat</h2>
        <p className="admin-panel-subtitle">Setiap penerimaan otomatis menambah stok dan masuk ke histori.</p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <select className="admin-select" value={form.drugId} onChange={e=>setForm({...form,drugId:e.target.value})}>
            <option value="">-- Pilih Obat --</option>
            {drugs.map(d=> <option key={d.id} value={d.id}>{d.nama} (Stok: {d.stok})</option>)}
          </select>
          <input className="admin-input" type="number" placeholder="Jumlah diterima" value={form.jumlah} onChange={e=>setForm({...form,jumlah:e.target.value})} />
          <input className="admin-input" placeholder="No. Nota / PO" value={form.nota} onChange={e=>setForm({...form,nota:e.target.value})} />
          <div><button type="submit" className="admin-btn admin-btn-primary">Simpan Penerimaan</button></div>
        </form>
      </section>
    </AdminLayout>
  );
}
