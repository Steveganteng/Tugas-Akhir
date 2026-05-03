import { useState } from "react";
import Sidebar from './Sidebar.jsx';
const cardStyle = {
  background: "#0d1117",
  border: "1px solid #161b22",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
};

const pageStyle = {
  minHeight: "100vh",
  background: "#030712",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  color: "#e5e7eb",
  display: "flex",
  gap: "8px",
};

// Data dummy untuk historis upload
const UPLOAD_HISTORY = [
  {
    id: 1,
    filename: "pengeluaran_obat_januari.csv",
    uploadedAt: "2024-01-15T14:30:00",
    recordsCount: 245,
    status: "Berhasil",
  },
  {
    id: 2,
    filename: "pengeluaran_obat_februari.csv",
    uploadedAt: "2024-02-10T10:15:00",
    recordsCount: 318,
    status: "Berhasil",
  },
  {
    id: 3,
    filename: "pengeluaran_obat_maret.csv",
    uploadedAt: "2024-03-05T16:45:00",
    recordsCount: 156,
    status: "Berhasil",
  },
];

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DrugExpenditure() {
  const [uploadHistory, setuploadHistory] = useState(UPLOAD_HISTORY);
  const [uploadModal, setUploadModal] = useState({
    open: false,
    dragActive: false,
    files: null,
    error: "",
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setUploadModal((prev) => ({ ...prev, dragActive: true }));
    } else if (e.type === "dragleave") {
      setUploadModal((prev) => ({ ...prev, dragActive: false }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadModal((prev) => ({ ...prev, dragActive: false }));

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFiles(files);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFiles(files);
    }
  };

  const validateAndSetFiles = (files) => {
    const file = files[0];
    const allowedTypes = ["text/csv", "application/vnd.ms-excel"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setUploadModal((prev) => ({
        ...prev,
        error: "Format file harus CSV. File yang dipilih: " + file.type,
        files: null,
      }));
      return;
    }

    if (file.size > maxSize) {
      setUploadModal((prev) => ({
        ...prev,
        error: `Ukuran file terlalu besar. Maksimal 10MB, file Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        files: null,
      }));
      return;
    }

    setUploadModal((prev) => ({
      ...prev,
      files: [file],
      error: "",
    }));
  };

  const handleUpload = async () => {
    if (!uploadModal.files || uploadModal.files.length === 0) {
      setUploadModal((prev) => ({
        ...prev,
        error: "SilakanPilih File terlebih dahulu",
      }));
      return;
    }

    const file = uploadModal.files[0];

    // SimulasiUpload
    try {
      // Di sini bisa menambahkan logic untukUpload ke server
      const newRecord = {
        id: uploadHistory.length + 1,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        recordsCount: Math.floor(Math.random() * 500) + 100,
        status: "Berhasil",
      };

      setuploadHistory((prev) => [newRecord, ...prev]);
      setUploadModal({
        open: false,
        dragActive: false,
        files: null,
        error: "",
      });

      // Show success toast/alert
      alert("File berhasil diupload!");
    } catch (error) {
      setUploadModal((prev) => ({
        ...prev,
        error: "Gagal mengupload file. Silakan coba lagi.",
      }));
    }
  };

  const closeuploadModal = () => {
    setUploadModal({
      open: false,
      dragActive: false,
      files: null,
      error: "",
    });
  };

  return (
    <div style={pageStyle}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: "clamp(24px, 2.5vw, 32px)",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%" }}>
          <header style={{ marginBottom: 24 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(28px, 3.2vw, 38px)",
                fontWeight: 700,
                color: "#f9fafb",
              }}
            >
             Upload Pengeluaran Obat
            </h1>
           
          </header>

          {/*Upload History Table */}
          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, color: "#f9fafb" }}>
                HistorisUpload
              </h2>
              <button
                onClick={() =>
                  setUploadModal({
                    open: true,
                    dragActive: false,
                    files: null,
                    error: "",
                  })
                }
                style={{
                  border: "1px solid #2563eb",
                  background: "#1e40af",
                  color: "#dbeafe",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#1e3a8a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#1e40af";
                }}
              >
               Upload File
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 560,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #1f2937" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "14px 12px",
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      Nama File
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "14px 12px",
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      TanggalUpload
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "14px 12px",
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      Jumlah Record
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "14px 12px",
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uploadHistory.map((item) => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #0f151e" }}
                    >
                      <td
                        style={{
                          padding: "14px 12px",
                          fontWeight: 600,
                          color: "#e5e7eb",
                          fontSize: 14,
                        }}
                      >
                        {item.filename}
                      </td>
                      <td
                        style={{
                          padding: "14px 12px",
                          color: "#9ca3af",
                          fontSize: 14,
                        }}
                      >
                        {formatDateTime(item.uploadedAt)}
                      </td>
                      <td
                        style={{
                          padding: "14px 12px",
                          textAlign: "right",
                          color: "#9ca3af",
                          fontSize: 14,
                        }}
                      >
                        {item.recordsCount} record
                      </td>
                      <td
                        style={{
                          padding: "14px 12px",
                          color: "#4ade80",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {uploadHistory.length === 0 && (
              <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
                Belum ada file yang diupload.
              </p>
            )}
          </section>
        </div>
      </main>

      {/*Upload Modal */}
      {uploadModal.open && (
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
              width: "min(600px, 100%)",
              background: "linear-gradient(180deg, #0f172a 0%, #0b1220 100%)",
              border: "1px solid #1e293b",
              borderRadius: 16,
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.45)",
              padding: 32,
            }}
          >
            <h3
              style={{ margin: 0, fontSize: 28, color: "#f8fafc", marginBottom: 8 }}
            >
             Upload File Pengeluaran
            </h3>
            <p
              style={{
                margin: "0 0 24px 0",
                color: "#94a3b8",
                fontSize: 15,
                lineHeight: 1.5,
              }}
            >
              Drag and drop file CSV atau klik tombolPilih File di bawah.
            </p>

            {/* Drag and Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: "2px dashed",
                borderColor: uploadModal.dragActive ? "#2563eb" : "#475569",
                borderRadius: 8,
                padding: 32,
                textAlign: "center",
                background: uploadModal.dragActive ? "rgba(37, 99, 235, 0.1)" : "rgba(71, 85, 105, 0.05)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                marginBottom: 16,
              }}
            >
              
              <p
                style={{
                  margin: "0 0 8px 0",
                  color: "#e2e8f0",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {uploadModal.files ? uploadModal.files[0].name : "Drag file di sini atau klik untuk pilih"}
              </p>
              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                  fontSize: 13,
                }}
              >
                Format: CSV, Maksimal: 10MB
              </p>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                style={{
                  display: "none",
                }}
                id="fileInput"
              />
            </div>

            {/* Error Message */}
            {uploadModal.error && (
              <div
                style={{
                  background: "#5f2c2c",
                  border: "1px solid #a52a2a",
                  color: "#fecaca",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                {uploadModal.error}
              </div>
            )}

            {/* File Info */}
            {uploadModal.files && (
              <div
                style={{
                  background: "#1e3a5f",
                  border: "1px solid #2563eb",
                  color: "#dbeafe",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                <strong>File yang dipilih:</strong> {uploadModal.files[0].name}
                <br />
                <strong>Ukuran:</strong>{" "}
                {(uploadModal.files[0].size / 1024).toFixed(2)} KB
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: 12,
              }}
            >
              <label
                htmlFor="fileInput"
                style={{
                  flex: 1,
                  display: "inline-block",
                  border: "1px solid #475569",
                  background: "#1e293b",
                  color: "#cbd5e1",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#334155";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#1e293b";
                }}
              >
               Pilih File
              </label>

              <button
                onClick={handleUpload}
                style={{
                  flex: 1,
                  border: "1px solid #2563eb",
                  background: "#1e40af",
                  color: "#dbeafe",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#1e3a8a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#1e40af";
                }}
              >
               Upload
              </button>

              <button
                onClick={closeuploadModal}
                style={{
                  flex: 1,
                  border: "1px solid #475569",
                  background: "#1e293b",
                  color: "#cbd5e1",
                  borderRadius: 8,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#334155";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#1e293b";
                }}
              >
               Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


