import { useEffect, useRef, useState } from "react";
import { clearAuthState, getAuthState, getHomePathForRole, ROLE_APOTEKER, ROLE_ADMIN } from "../../lib/auth";
import { createRestockRequest, subscribeToRestockStore } from "../../lib/restockStore";
import { loadDrugs } from "../../lib/drugStore";
import ApotekerLayout from "./ApotekerLayout";

export default function RestockByInput() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [drugs, setDrugs] = useState(() => loadDrugs());
  const [manual, setManual] = useState({ tanggal: new Date().toISOString().slice(0,10), drugId: '', namaObat: '', jumlahRestok: '', targetRestok: '', notes: '' });

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
    // ensure drug list is fresh
    setDrugs(loadDrugs());

    return subscribeToRestockStore(() => {
      setDrugs(loadDrugs());
    });
  }, []);

  const submitManual = (e) => {
    e && e.preventDefault();
    const name = manual.namaObat || (manual.drugId ? (drugs.find(d=>d.id===manual.drugId)?.nama || '') : '');
    if (!name) return alert('Nama obat wajib diisi.');
    const jumlah = Number(manual.jumlahRestok) || 0;
    if (jumlah <= 0) return alert('Jumlah harus lebih besar dari 0.');

    const target = Number(manual.targetRestok) || jumlah;
    
    try {
      createRestockRequest({
        tanggal: manual.tanggal,
        drugId: manual.drugId || null,
        namaObat: name,
        jumlahRestok: jumlah,
        targetRestok: target,
        notes: manual.notes,
      });
      window.dispatchEvent(new Event('restock-store:change'));
      alert('Request restock berhasil dikirim ke admin untuk approval.');
      setManual({ tanggal: new Date().toISOString().slice(0,10), drugId: '', namaObat: '', jumlahRestok: '', targetRestok: '', notes: '' });
    } catch (err) {
      alert('Gagal membuat request: ' + (err.message || err));
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <ApotekerLayout
      activeNav="input"
      pageTitle="Pengeluaran & Request Restok"
      pageSubtitle="Ajukan request restok obat untuk persetujuan admin."
    >
      <div style={{ marginTop: 0 }}>
        <section className="apoteker-panel">
          <h3 className="apoteker-panel-title">Ajukan Request Restok</h3>
          <form onSubmit={submitManual} style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input type="date" value={manual.tanggal} onChange={(e)=>setManual({...manual,tanggal:e.target.value})} className="apoteker-input" style={{ maxWidth: 180 }} />
              <select value={manual.drugId} onChange={(e)=>setManual({...manual,drugId:e.target.value, namaObat: ''})} className="apoteker-select" style={{ minWidth: 260 }}>
                <option value="">-- Pilih dari master / ketik manual --</option>
                {drugs.map(d => <option key={d.id} value={d.id}>{d.nama} (Stok: {d.stok})</option>)}
              </select>
              <input placeholder="Nama obat (manual)" value={manual.namaObat} onChange={(e)=>setManual({...manual,namaObat:e.target.value, drugId: ''})} className="apoteker-input" style={{ minWidth: 220 }} />
              <input placeholder="Jumlah yang dibutuhkan" type="number" value={manual.jumlahRestok} onChange={(e)=>setManual({...manual,jumlahRestok:e.target.value})} className="apoteker-input" style={{ width: 200 }} />
              <input placeholder="Target restok (opsional)" type="number" value={manual.targetRestok} onChange={(e)=>setManual({...manual,targetRestok:e.target.value})} className="apoteker-input" style={{ width: 220 }} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input placeholder="Catatan (opsional)" value={manual.notes} onChange={(e)=>setManual({...manual,notes:e.target.value})} className="apoteker-input" style={{ minWidth: 300, flex: 1 }} />
              <button type="submit" className="apoteker-btn apoteker-btn-primary">Kirim Request</button>
            </div>
          </form>
        </section>
      </div>
    </ApotekerLayout>
  );
}
