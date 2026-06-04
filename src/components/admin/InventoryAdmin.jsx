import React, { useEffect, useMemo, useState } from "react";
import { loadDrugs, addDrug, deleteDrug, adjustDrugStock, subscribeToDrugStore } from "../../lib/drugStore";
import AdminLayout from "./AdminLayout";

export default function InventoryAdmin() {
  const [drugs, setDrugs] = useState(() => loadDrugs());
  const [form, setForm] = useState({ nama: "", stok: 0, harga: 0, satuan: "", lokasi: "" });

  useEffect(() => subscribeToDrugStore(() => setDrugs(loadDrugs())), []);

  const summary = useMemo(() => {
    const totalItems = drugs.length;
    const totalStock = drugs.reduce((sum, item) => sum + (Number(item.stok) || 0), 0);
    const lowStockItems = drugs.filter((item) => (Number(item.stok) || 0) <= 50).length;
    const emptyItems = drugs.filter((item) => (Number(item.stok) || 0) === 0).length;

    return { totalItems, totalStock, lowStockItems, emptyItems };
  }, [drugs]);

  const lowStockDrugs = useMemo(
    () => drugs.filter((item) => (Number(item.stok) || 0) <= 50).slice().sort((a, b) => (Number(a.stok) || 0) - (Number(b.stok) || 0)),
    [drugs]
  );

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.nama) return alert("Nama obat wajib");
    addDrug({ ...form, stok: Number(form.stok || 0) });
    setForm({ nama: "", stok: 0, harga: 0, satuan: "", lokasi: "" });
  };

  return (
    <AdminLayout
      activeNav="inventory"
      pageTitle="Manajemen Stok"
      pageSubtitle="Tambah, pantau, dan kelola obat dalam tampilan yang selaras dengan dashboard."
    >
      <section className="admin-grid">
        <div className="admin-card">
          <div className="label">Total Item Obat</div>
          <div className="value">{summary.totalItems}</div>
        </div>
        <div className="admin-card">
          <div className="label">Total Stok</div>
          <div className="value">{summary.totalStock}</div>
        </div>
        <div className="admin-card">
          <div className="label">Stok Rendah</div>
          <div className="value">{summary.lowStockItems}</div>
        </div>
        <div className="admin-card">
          <div className="label">Stok Habis</div>
          <div className="value">{summary.emptyItems}</div>
        </div>
      </section>

      <section className="admin-panel">
        <h2 className="admin-panel-title">Tambah Obat</h2>
        <p className="admin-panel-subtitle">Form input mengikuti gaya panel dashboard.</p>

        <form onSubmit={handleAdd} style={{ display: "grid", gap: 10 }}>
          <input className="admin-input" placeholder="Nama obat" value={form.nama} onChange={(e)=>setForm({...form,nama:e.target.value})} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <input className="admin-input" placeholder="Stok" type="number" value={form.stok} onChange={(e)=>setForm({...form,stok:e.target.value})} />
            <input className="admin-input" placeholder="Satuan" value={form.satuan} onChange={(e)=>setForm({...form,satuan:e.target.value})} />
            <input className="admin-input" placeholder="Harga" type="number" value={form.harga} onChange={(e)=>setForm({...form,harga:e.target.value})} />
            <input className="admin-input" placeholder="Lokasi" value={form.lokasi} onChange={(e)=>setForm({...form,lokasi:e.target.value})} />
          </div>
          <div>
            <button type="submit" className="admin-btn admin-btn-primary">Tambah Obat</button>
          </div>
        </form>
      </section>

      <section className="admin-panel">
        <h2 className="admin-panel-title">Daftar Stok Obat</h2>
        <p className="admin-panel-subtitle">Daftar master obat dengan aksi cepat untuk penyesuaian stok.</p>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Stok</th>
              <th>Satuan</th>
              <th>Lokasi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {drugs.map((drug) => (
              <tr key={drug.id}>
                <td><strong>{drug.nama}</strong></td>
                <td>{drug.stok}</td>
                <td>{drug.satuan || "-"}</td>
                <td>{drug.lokasi || "-"}</td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button
                      className="admin-btn admin-btn-secondary"
                      onClick={()=>{ const delta = Number(prompt("Tambah/kurangi stok (gunakan angka negatif jika mengurangi):", "0")||0); if (delta) { adjustDrugStock(drug.id, Number(delta)); } }}
                    >
                      Adjust
                    </button>
                    <button className="admin-btn admin-btn-danger" onClick={()=>{ if (confirm("Hapus obat ini?")) deleteDrug(drug.id); }}>
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-panel">
        <h2 className="admin-panel-title">Stok Rendah</h2>
        <p className="admin-panel-subtitle">Ringkasan obat yang perlu perhatian lebih cepat.</p>

        <div style={{ display: "grid", gap: 10 }}>
          {lowStockDrugs.length > 0 ? (
            lowStockDrugs.map((drug) => (
              <div
                key={drug.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#111827",
                  border: "1px solid #1f2937",
                }}
              >
                <div>
                  <strong>{drug.nama}</strong>
                  <div style={{ color: "#9ca3af", fontSize: 13 }}>{drug.lokasi || "Lokasi belum diisi"}</div>
                </div>
                <div style={{ color: "#fca5a5", fontWeight: 800 }}>{drug.stok} stok</div>
              </div>
            ))
          ) : (
            <div style={{ color: "#9ca3af" }}>Tidak ada stok rendah saat ini.</div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
