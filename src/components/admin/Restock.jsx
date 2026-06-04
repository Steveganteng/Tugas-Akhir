import React, { useEffect, useState } from "react";
import { getAuthState, getHomePathForRole, ROLE_ADMIN } from "../../lib/auth";
import { loadRestockRequests, approveRestockRequest, rejectRestockRequest, subscribeToRestockStore } from "../../lib/restockStore";
import AdminLayout from "./AdminLayout";

export default function Restock() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [requests, setRequests] = useState(() => loadRestockRequests());
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [approvalQty, setApprovalQty] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const authState = getAuthState();
    if (!authState.isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    if (authState.role !== ROLE_ADMIN) {
      window.location.href = getHomePathForRole(authState.role);
      return;
    }

    setIsAuthorized(true);

    return subscribeToRestockStore(() => {
      setRequests(loadRestockRequests());
    });
  }, []);

  const openApproveDialog = (request) => {
    setSelectedRequest(request);
    setActionType("approve");
    setApprovalQty(String(request.jumlahRestok));
    setReason("");
    setError("");
  };

  const openRejectDialog = (request) => {
    setSelectedRequest(request);
    setActionType("reject");
    setApprovalQty("");
    setReason("");
    setError("");
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setApprovalQty("");
    setReason("");
    setError("");
  };

  const submitApproval = () => {
    if (!selectedRequest) return;

    const qty = Number(approvalQty);
    if (Number.isNaN(qty) || qty < 0) {
      setError("Jumlah approval harus angka yang valid.");
      return;
    }

    if (qty > selectedRequest.jumlahRestok) {
      setError(`Jumlah tidak boleh melebihi ${selectedRequest.jumlahRestok} unit.`);
      return;
    }

    try {
      approveRestockRequest(selectedRequest.id, qty, reason);
      setRequests(loadRestockRequests());
      closeDialog();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitRejection = () => {
    if (!selectedRequest) return;

    if (!reason.trim()) {
      setError("Alasan penolakan harus diisi.");
      return;
    }

    try {
      rejectRestockRequest(selectedRequest.id, reason);
      setRequests(loadRestockRequests());
      closeDialog();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const renderRequestTable = (tableRequests, showActions = true) => {
    if (tableRequests.length === 0) {
      return (
        <div style={{ padding: "12px", color: "#9ca3af", textAlign: "center" }}>
          Belum ada request.
        </div>
      );
    }

    return (
      <div style={{ overflowX: "auto" }}>
        <table className="admin-table" style={{ width: "100%" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1f2937" }}>
              <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, color: "#9ca3af" }}>Tanggal</th>
              <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, color: "#9ca3af" }}>Nama Obat</th>
              <th style={{ textAlign: "right", padding: "12px 8px", fontSize: 13, color: "#9ca3af" }}>Jumlah</th>
              <th style={{ textAlign: "right", padding: "12px 8px", fontSize: 13, color: "#9ca3af" }}>Target</th>
              <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, color: "#9ca3af" }}>Catatan</th>
              {showActions && <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 13, color: "#9ca3af" }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {tableRequests.map(req => (
              <tr key={req.id} style={{ borderBottom: "1px solid #0f151e" }}>
                <td style={{ padding: "12px 8px", color: "#9ca3af", fontSize: 13 }}>{req.tanggal}</td>
                <td style={{ padding: "12px 8px", fontWeight: 600, color: "#e5e7eb", fontSize: 14 }}>{req.namaObat}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", color: "#9ca3af", fontSize: 14 }}>{req.jumlahRestok}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", color: "#9ca3af", fontSize: 14 }}>{req.targetRestok}</td>
                <td style={{ padding: "12px 8px", color: "#9ca3af", fontSize: 13 }}>{req.notes || "-"}</td>
                {showActions && (
                  <td style={{ padding: "12px 8px", display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => openApproveDialog(req)}
                      className="admin-btn admin-btn-primary"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                    >
                      Terima
                    </button>
                    <button
                      type="button"
                      onClick={() => openRejectDialog(req)}
                      className="admin-btn admin-btn-danger"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                    >
                      Tolak
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AdminLayout
      activeNav="restock"
      pageTitle="Restock"
      pageSubtitle="Kelola request restock dari apoteker"
    >
      <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <section className="admin-panel" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20, color: "#f9fafb" }}>Request Restock (Pending)</h2>
            <span style={{ color: "#6b7280", fontSize: 14 }}>{pendingRequests.length} request</span>
          </div>
          {renderRequestTable(pendingRequests, true)}
        </section>

        <section className="admin-panel" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20, color: "#f9fafb" }}>Request Diterima</h2>
            <span style={{ color: "#6b7280", fontSize: 14 }}>{approvedRequests.length} request</span>
          </div>
          {renderRequestTable(approvedRequests, false)}
        </section>

        <section className="admin-panel" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20, color: "#f9fafb" }}>Request Ditolak</h2>
            <span style={{ color: "#6b7280", fontSize: 14 }}>{rejectedRequests.length} request</span>
          </div>
          {renderRequestTable(rejectedRequests, false)}
        </section>
      </div>

      {selectedRequest && (
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
              width: "min(500px, 100%)",
              background: "linear-gradient(180deg, #0f172a 0%, #0b1220 100%)",
              border: "1px solid #1e293b",
              borderRadius: 16,
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.45)",
              padding: 32,
            }}
          >
            {actionType === "approve" ? (
              <>
                <h3 style={{ margin: 0, fontSize: 24, color: "#f8fafc", marginBottom: 12 }}>Terima Request</h3>
                <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
                  <strong style={{ color: "#e2e8f0" }}>{selectedRequest.namaObat}</strong>
                  <br />
                  Permintaan: {selectedRequest.jumlahRestok} unit
                  <br />
                  Target: {selectedRequest.targetRestok} unit
                </p>

                <label style={{ display: "grid", gap: 8, fontSize: 14, color: "#94a3b8", marginBottom: 16 }}>
                  Jumlah Yang Diterima
                  <input
                    type="number"
                    min="0"
                    max={selectedRequest.jumlahRestok}
                    value={approvalQty}
                    onChange={(e) => {
                      setApprovalQty(e.target.value);
                      setError("");
                    }}
                    style={{
                      background: "#0b1324",
                      color: "#f8fafc",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      padding: "12px",
                      fontSize: 16,
                      fontWeight: 700,
                      outline: "none",
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 8, fontSize: 14, color: "#94a3b8", marginBottom: 16 }}>
                  Alasan Penerimaan (Opsional)
                  <textarea
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setError("");
                    }}
                    style={{
                      background: "#0b1324",
                      color: "#f8fafc",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      padding: "12px",
                      fontSize: 14,
                      outline: "none",
                      resize: "vertical",
                      minHeight: 80,
                    }}
                    placeholder="Masukkan alasan penerimaan..."
                  />
                </label>
              </>
            ) : (
              <>
                <h3 style={{ margin: 0, fontSize: 24, color: "#f8fafc", marginBottom: 12 }}>Tolak Request</h3>
                <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
                  <strong style={{ color: "#e2e8f0" }}>{selectedRequest.namaObat}</strong>
                  <br />
                  Permintaan: {selectedRequest.jumlahRestok} unit
                </p>

                <label style={{ display: "grid", gap: 8, fontSize: 14, color: "#94a3b8", marginBottom: 16 }}>
                  Alasan Penolakan
                  <textarea
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setError("");
                    }}
                    style={{
                      background: "#0b1324",
                      color: "#f8fafc",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      padding: "12px",
                      fontSize: 14,
                      outline: "none",
                      resize: "vertical",
                      minHeight: 100,
                    }}
                    placeholder="Masukkan alasan penolakan..."
                  />
                </label>
              </>
            )}

            {error && (
              <div
                style={{
                  background: "#3f0f0f",
                  border: "1px solid #7f1d1d",
                  color: "#fca5a5",
                  borderRadius: 8,
                  padding: "12px",
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={closeDialog}
                style={{
                  border: "1px solid #334155",
                  background: "#111827",
                  color: "#cbd5e1",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={actionType === "approve" ? submitApproval : submitRejection}
                style={{
                  border: actionType === "approve" ? "1px solid #14532d" : "1px solid #7f1d1d",
                  background: actionType === "approve" ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#f0f9ff",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {actionType === "approve" ? "Terima Request" : "Tolak Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
