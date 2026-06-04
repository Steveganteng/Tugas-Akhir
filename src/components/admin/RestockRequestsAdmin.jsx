import React, { useEffect, useState } from "react";
import { loadRequests, addRequest, updateRequest, deleteRequest, subscribeToAdminStore } from "../../lib/adminStore";
import AdminLayout from "./AdminLayout";

export default function RestockRequestsAdmin() {
  const [requests, setRequests] = useState(() => loadRequests());
  const [form, setForm] = useState({ namaObat: "", jumlah: 0 });

  useEffect(() => subscribeToAdminStore(() => setRequests(loadRequests())), []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.namaObat) return alert('Nama obat wajib');
    addRequest({ namaObat: form.namaObat, jumlah: Number(form.jumlah || 0) });
    setForm({ namaObat: '', jumlah: 0 });
  };

  return (
    <AdminLayout
      activeNav="restock"
      pageTitle="Request Re-stock"
      pageSubtitle="Kelola permintaan restok dari unit layanan."
    >
      <section className="admin-panel">
        <h2 className="admin-panel-title">Buat Request Re-stock</h2>
        <p className="admin-panel-subtitle">Tambah permintaan baru lalu approve/re-open sesuai proses.</p>
        <form onSubmit={handleAdd} className="admin-inline-form">
          <input className="admin-input" placeholder="Nama obat" value={form.namaObat} onChange={e=>setForm({...form,namaObat:e.target.value})} />
          <input className="admin-input" placeholder="Jumlah" type="number" value={form.jumlah} onChange={e=>setForm({...form,jumlah:e.target.value})} />
          <button type="submit" className="admin-btn admin-btn-primary">Buat Request</button>
        </form>
      </section>

      <section className="admin-panel">
        <h2 className="admin-panel-title">Daftar Request</h2>
        <table className="admin-table">
          <thead><tr><th>No</th><th>Nama Obat</th><th>Jumlah</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {requests.map((r, idx) => (
              <tr key={r.id}>
                <td>{idx+1}</td>
                <td>{r.namaObat}</td>
                <td>{r.jumlah}</td>
                <td>{r.status}</td>
                <td>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <button className="admin-btn admin-btn-secondary" onClick={()=>updateRequest(r.id,{ status: r.status === 'pending' ? 'approved' : 'pending' })}>{r.status === 'pending' ? 'Approve' : 'Re-open'}</button>
                    <button className="admin-btn admin-btn-danger" onClick={()=>deleteRequest(r.id)}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminLayout>
  );
}
