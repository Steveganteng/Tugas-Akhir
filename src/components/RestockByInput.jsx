import { useEffect, useMemo, useState } from "react";
import Sidebar from './Sidebar.jsx';
import {
  addInputResult,
  loadInputResults,
  subscribeToRestockStore,
  setInputResultRestock,
} from "../lib/restockStore";

const formBase = {
  namaObat: "",
  stokSaatIni: "",
  kebutuhanPerMinggu: "",
  leadTimeMinggu: "1",
  safetyStockPersen: "20",
};

function hitungRekomendasi(input) {
  const stok = Number(input.stokSaatIni);
  const kebutuhan = Number(input.kebutuhanPerMinggu);
  const leadTime = Number(input.leadTimeMinggu);
  const safetyPersen = Number(input.safetyStockPersen);

  const kebutuhanSelamaLeadTime = Math.ceil(kebutuhan * leadTime);
  const safetyStockUnit = Math.ceil((kebutuhanSelamaLeadTime * safetyPersen) / 100);
  const targetStok = kebutuhanSelamaLeadTime + safetyStockUnit;
  const rekomendasiRestok = Math.max(0, targetStok - stok);

  return {
    id: `${input.namaObat}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    namaObat: input.namaObat,
    stok,
    kebutuhan,
    leadTime,
    safetyPersen,
    kebutuhanSelamaLeadTime,
    safetyStockUnit,
    targetStok,
    rekomendasiRestok,
    status: rekomendasiRestok > 0 ? "Perlu restok" : "Stok aman",
  };
}

function validateInput(form) {
  if (!form.namaObat.trim()) {
    return "Nama obat wajib diisi.";
  }

  const fields = ["stokSaatIni", "kebutuhanPerMinggu", "leadTimeMinggu", "safetyStockPersen"];
  const invalid = fields.some((key) => Number(form[key]) < 0 || Number.isNaN(Number(form[key])));

  if (invalid) {
    return "Semua input angka harus bernilai 0 atau lebih.";
  }

  if (Number(form.leadTimeMinggu) === 0) {
    return "Lead time minimal 1 minggu.";
  }

  return "";
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getPreviewRestockStatus(quantity, recommendedQuantity) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return "Perlu restok";
  }

  if (quantity < recommendedQuantity) {
    return `Parsial (${quantity}/${recommendedQuantity})`;
  }

  return `Selesai (${quantity}/${recommendedQuantity})`;
}

export default function RestockByInput() {
  const [form, setForm] = useState(formBase);
  const [hasil, setHasil] = useState(() => loadInputResults());
  const [error, setError] = useState("");
  const [restockDialog, setRestockDialog] = useState({
    open: false,
    item: null,
    quantity: "",
    mode: "set", // 'set' = initial confirm, 'add' = add more to partial
    error: "",
  });

  const hasilDirestok = useMemo(() => hasil.filter((item) => item.isRestocked), [hasil]);

  const totalRestok = useMemo(
    () => hasil.reduce((sum, item) => sum + item.rekomendasiRestok, 0),
    [hasil]
  );

  useEffect(() => {
    setHasil(loadInputResults());

    return subscribeToRestockStore(() => {
      setHasil(loadInputResults());
    });
  }, []);

  useEffect(() => {
    if (!restockDialog.open || !restockDialog.item) {
      return;
    }

    const freshItem = hasil.find((item) => item.id === restockDialog.item.id);
    if (!freshItem) {
      setRestockDialog({ open: false, item: null, quantity: "", error: "" });
      return;
    }

    setRestockDialog((prev) => ({
      ...prev,
      item: freshItem,
      quantity: prev.quantity || String(freshItem.rekomendasiRestok),
    }));
  }, [hasil, restockDialog.open, restockDialog.item]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const applySubmission = () => {
    setError("");

    const validationError = validateInput(form);
    if (validationError) {
      setError(validationError);
      return false;
    }

    const rekomendasi = hitungRekomendasi(form);
    const now = new Date().toISOString();

    setHasil(
      addInputResult({
        ...rekomendasi,
        isRestocked: false,
        restockedAt: null,
        submittedAt: now,
      })
    );

    setForm((prev) => ({ ...formBase, safetyStockPersen: prev.safetyStockPersen }));
    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    applySubmission();
  };

  const handleToggleRestock = (id) => {
    const target = hasil.find((item) => item.id === id);
    if (!target) {
      return;
    }

    // If already restocked fully, offer cancel
    if (target.isRestocked && (target.restockedQty ?? 0) >= (target.rekomendasiRestok ?? 0)) {
      if (!window.confirm(`Batalkan status restok untuk ${target.namaObat}`)) {
        return;
      }

      setError("");
      setHasil(setInputResultRestock(id, 0));
      return;
    }

    // If partially restocked, open modal in 'add' mode to add more
    if (target.isRestocked && (target.restockedQty ?? 0) > 0 && (target.restockedQty ?? 0) < (target.rekomendasiRestok ?? 0)) {
      const remaining = (target.rekomendasiRestok ?? 0) - (target.restockedQty ?? 0);
      setRestockDialog({
        open: true,
        item: target,
        quantity: String(remaining),
        mode: "add",
        error: "",
      });
      return;
    }

    // Otherwise (not restocked yet), open modal to set restock amount
    setRestockDialog({
      open: true,
      item: target,
      quantity: String(target.restockedQty ?? target.rekomendasiRestok ?? 0),
      mode: "set",
      error: "",
    });
  };

  const closeRestockDialog = () => {
    setRestockDialog({ open: false, item: null, quantity: "", error: "" });
  };

  const submitRestockDialog = () => {
    if (!restockDialog.item) {
      closeRestockDialog();
      return;
    }

    const quantity = Number(restockDialog.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setRestockDialog((prev) => ({
        ...prev,
        error: "Jumlah restok harus lebih besar dari 0.",
      }));
      return;
    }

    const recommended = restockDialog.item.rekomendasiRestok ?? 0;
    const existing = restockDialog.item.restockedQty ?? 0;

    if (restockDialog.mode === "add") {
      const remaining = recommended - existing;
      if (quantity > remaining) {
        setRestockDialog((prev) => ({
          ...prev,
          error: `Jumlah melebihi sisa kebutuhan (${remaining} unit).`,
        }));
        return;
      }

      const newQty = existing + quantity;
      setError("");
      setHasil(setInputResultRestock(restockDialog.item.id, newQty));
      closeRestockDialog();
      return;
    }

    // mode === 'set'
    if (quantity > recommended) {
      setRestockDialog((prev) => ({
        ...prev,
        error: `Jumlah melebihi rekomendasi (${recommended} unit).`,
      }));
      return;
    }

    setError("");
    setHasil(setInputResultRestock(restockDialog.item.id, quantity));
    closeRestockDialog();
  };

  const handleLogout = () => {
    if (window.confirm('Anda yakin ingin logout')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('rememberMe');
      window.location.href = '/login';
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#e5e7eb", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "clamp(12px, 1.4vw, 20px)", overflowY: "auto" }}>
        <div style={{ width: "100%" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(22px, 2.5vw, 30px)", color: "#f9fafb" }}>Rekomendasi Restok Obat</h1>
          
          <form
            onSubmit={handleSubmit}
            style={{
              marginTop: 20,
              background: "#0d1117",
              border: "1px solid #161b22",
              borderRadius: 12,
              padding: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 12,
            }}
          >
            <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#9ca3af" }}>
              Nama Obat
              <input
                name="namaObat"
                value={form.namaObat}
                onChange={handleChange}
                placeholder="Contoh: Paracetamol 500mg"
                style={{ background: "#111827", color: "#f9fafb", border: "1px solid #1f2937", borderRadius: 8, padding: "9px 10px" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#9ca3af" }}>
              Stok Saat Ini
              <input
                type="number"
                min="0"
                name="stokSaatIni"
                value={form.stokSaatIni}
                onChange={handleChange}
                style={{ background: "#111827", color: "#f9fafb", border: "1px solid #1f2937", borderRadius: 8, padding: "9px 10px" }}
              />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#9ca3af" }}>
              Kebutuhan per Minggu
              <input
                type="number"
                min="0"
                name="kebutuhanPerMinggu"
                value={form.kebutuhanPerMinggu}
                onChange={handleChange}
                style={{ background: "#111827", color: "#f9fafb", border: "1px solid #1f2937", borderRadius: 8, padding: "9px 10px" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#9ca3af" }}>
              Lead Time (Minggu)
              <input
                type="number"
                min="1"
                name="leadTimeMinggu"
                value={form.leadTimeMinggu}
                onChange={handleChange}
                style={{ background: "#111827", color: "#f9fafb", border: "1px solid #1f2937", borderRadius: 8, padding: "9px 10px" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#9ca3af" }}>
              Safety Stock (%)
              <input
                type="number"
                min="0"
                name="safetyStockPersen"
                value={form.safetyStockPersen}
                onChange={handleChange}
                style={{ background: "#111827", color: "#f9fafb", border: "1px solid #1f2937", borderRadius: 8, padding: "9px 10px" }}
              />
            </label>

            <div style={{ display: "grid", gap: 8, alignItems: "end" }}>
              <button
                type="submit"
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#052e16",
                  fontWeight: 700,
                }}
              >
                Hitung Rekomendasi
              </button>
            </div>

            {error && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  background: "#3f0f0f",
                  border: "1px solid #7f1d1d",
                  color: "#fca5a5",
                  borderRadius: 8,
                  padding: "9px 10px",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
          </form>

          <section style={{ marginTop: 16, background: "#0d1117", border: "1px solid #161b22", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase" }}>Total Rekomendasi Restok</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "#4ade80", marginTop: 4 }}>{totalRestok} unit</div>
          </section>

          <section style={{ marginTop: 16, background: "#0d1117", border: "1px solid #161b22", borderRadius: 12, padding: 16, overflowX: "auto" }}>
            <h2 style={{ margin: 0, fontSize: 18, color: "#f9fafb" }}>Hasil Rekomendasi</h2>
            <table style={{ width: "100%", minWidth: 740, borderCollapse: "collapse", marginTop: 10 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1f2937" }}>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Nama Obat</th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Stok</th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Demand/Minggu</th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Target Stok</th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Rekomendasi Restok</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Konfirmasi</th>
                </tr>
              </thead>
              <tbody>
                {hasil.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "14px 8px", color: "#6b7280" }}>
                      Belum ada hasil. Masukkan data obat terlebih dahulu.
                    </td>
                  </tr>
                )}
                {hasil.map((item, idx) => (
                  <tr key={item.id || `${item.namaObat}-${idx}`} style={{ borderBottom: "1px solid #0f151e", opacity: item.isRestocked ? 0.75 : 1 }}>
                    <td style={{ padding: "10px 8px", color: "#e5e7eb", fontWeight: 600 }}>{item.namaObat}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#9ca3af" }}>{item.stok}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#9ca3af" }}>{item.kebutuhan}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#9ca3af" }}>{item.targetStok}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#fbbf24", fontWeight: 700 }}>
                      {item.rekomendasiRestok}
                    </td>
                    <td style={{ padding: "10px 8px", color: item.isRestocked ? "#4ade80" : item.rekomendasiRestok > 0 ? "#fbbf24" : "#4ade80", fontWeight: 600 }}>
                      {item.status}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleRestock(item.id)}
                        style={{
                          border: "1px solid",
                          borderColor: item.isRestocked ? "#14532d" : "#92400e",
                          background: item.isRestocked ? "#052e16" : "#422006",
                          color: item.isRestocked ? "#86efac" : "#fcd34d",
                          borderRadius: 8,
                          padding: "7px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {item.isRestocked && (item.restockedQty ?? 0) > 0 && (item.restockedQty ?? 0) < (item.rekomendasiRestok ?? 0) ? "Tambah"
                          : item.isRestocked ? "Batalkan"
                          : "Konfirmasi"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {restockDialog.open && restockDialog.item && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(3, 7, 18, 0.72)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: "min(520px, 100%)",
                  background: "linear-gradient(180deg, #0f172a 0%, #0b1220 100%)",
                  border: "1px solid #1e293b",
                  borderRadius: 16,
                  boxShadow: "0 24px 48px rgba(0, 0, 0, 0.45)",
                  padding: 24,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 22, color: "#f8fafc" }}>Jumlah Restok</h3>
                <p style={{ margin: "10px 0 14px", color: "#94a3b8", fontSize: 15, lineHeight: 1.5 }}>
                  Masukkan jumlah yang benar-benar akan direstok untuk <strong style={{ color: "#e2e8f0" }}>{restockDialog.item.namaObat}</strong>.
                  <br />
                  {restockDialog.mode === "add" ? (<>Sisa kebutuhan: {(restockDialog.item.rekomendasiRestok ?? 0) - (restockDialog.item.restockedQty ?? 0)} unit. (saat ini sudah direstok {restockDialog.item.restockedQty ?? 0} unit)</>
                  ) : (
                    <>Rekomendasi: {restockDialog.item.rekomendasiRestok} unit.</>
                  )}
                </p>

                <label style={{ display: "grid", gap: 8, fontSize: 14, color: "#94a3b8" }}>
                  Jumlah direstok
                  <input
                    type="number"
                    min="1"
                    max={restockDialog.mode === "add" ? (restockDialog.item.rekomendasiRestok ?? 0) - (restockDialog.item.restockedQty ?? 0) : restockDialog.item.rekomendasiRestok}
                    value={restockDialog.quantity}
                    onChange={(event) =>
                      setRestockDialog((prev) => ({
                        ...prev,
                        quantity: event.target.value,
                        error: "",
                      }))
                    }
                    style={{
                      background: "#0b1324",
                      color: "#f8fafc",
                      border: "1px solid #334155",
                      borderRadius: 10,
                      padding: "14px 14px",
                      fontSize: 18,
                      fontWeight: 700,
                      outline: "none",
                    }}
                  />
                </label>

                <div
                  style={{
                    marginTop: 12,
                    border: "1px solid #1f2937",
                    background: "#0f172a",
                    borderRadius: 10,
                    padding: "10px 12px",
                    color: "#cbd5e1",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Status preview: {getPreviewRestockStatus(Number(restockDialog.quantity), restockDialog.item.rekomendasiRestok)}
                </div>

                {restockDialog.error && (
                  <div
                    style={{
                      marginTop: 12,
                      background: "#3f0f0f",
                      border: "1px solid #7f1d1d",
                      color: "#fca5a5",
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 14,
                    }}
                  >
                    {restockDialog.error}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={closeRestockDialog}
                    style={{
                      border: "1px solid #334155",
                      background: "#111827",
                      color: "#cbd5e1",
                      borderRadius: 10,
                      padding: "11px 18px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={submitRestockDialog}
                    style={{
                      border: "1px solid #0369a1",
                      background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                      color: "#f0f9ff",
                      borderRadius: 10,
                      padding: "11px 18px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          )}

          <section style={{ marginTop: 16, background: "#0d1117", border: "1px solid #161b22", borderRadius: 12, padding: 16, overflowX: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: "#f9fafb" }}>Detail Obat Yang Sudah Direstok</h2>
              <span style={{ color: "#6b7280", fontSize: 13 }}>{hasilDirestok.length} obat terkonfirmasi</span>
            </div>

            {hasilDirestok.length === 0 ? (
              <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>Belum ada obat yang dikonfirmasi sudah direstok.</p>
            ) : (
              <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1f2937" }}>
                    <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Nama Obat</th>
                    <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Stok Awal</th>
                    <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Kebutuhan/Minggu</th>
                    <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Target Stok</th>
                    <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Jumlah Direstok</th>
                    <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>Waktu Konfirmasi</th>
                  </tr>
                </thead>
                <tbody>
                  {hasilDirestok.map((item) => (
                    <tr key={`done-${item.id}`} style={{ borderBottom: "1px solid #0f151e" }}>
                      <td style={{ padding: "10px 8px", color: "#e5e7eb", fontWeight: 600 }}>{item.namaObat}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", color: "#9ca3af" }}>{item.stok}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", color: "#9ca3af" }}>{item.kebutuhan}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", color: "#9ca3af" }}>{item.targetStok}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", color: "#4ade80", fontWeight: 700 }}>{item.restockedQty ?? 0}</td>
                      <td style={{ padding: "10px 8px", color: "#9ca3af" }}>{formatDateTime(item.restockedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}







