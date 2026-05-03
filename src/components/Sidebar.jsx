export default function Sidebar() {
  const handleLogout = () => {
    if (window.confirm("Anda yakin ingin logout?")) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("username");
      localStorage.removeItem("loginTime");
      localStorage.removeItem("rememberMe");
      window.location.href = "/login";
    }
  };

  return (
    <aside
      style={{
        width: "clamp(240px, 22vw, 280px)",
        background: "#0d1117",
        borderRight: "1px solid #161b22",
        padding: "24px 16px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#4b5563",
          letterSpacing: 2,
          marginBottom: 8,
        }}
      >
        KLINIK DEL
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: "#f9fafb",
          marginBottom: 16,
        }}
      >
        Prediksi Restok Obat
      </div>

      <nav style={{ display: "grid", gap: 8 }}>
        <a
          href="/"
          style={{
            textDecoration: "none",
            border: "1px solid #2563eb",
            background: "#1e3a8a",
            color: "#dbeafe",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 700,
            display: "inline-block",
          }}
        >
          Beranda
        </a>
        <a
          href="/request-by-input/"
          style={{
            textDecoration: "none",
            border: "1px solid #1f2937",
            background: "#111827",
            color: "#9ca3af",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          Rekomendasi Restok Obat
        </a>
        <a
          href="/restock-history/"
          style={{
            textDecoration: "none",
            border: "1px solid #1f2937",
            background: "#111827",
            color: "#9ca3af",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          Historis Restok
        </a>
        <a
          href="/drug-expenditure/"
          style={{
            textDecoration: "none",
            border: "1px solid #1f2937",
            background: "#111827",
            color: "#9ca3af",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          Upload Pengeluaran Obat
        </a>
        <button
          onClick={handleLogout}
          style={{
            border: "1px solid #7f1d1d",
            background: "#450a0a",
            color: "#fca5a5",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            marginTop: 8,
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#7f1d1d";
            e.target.style.color = "#fecaca";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#450a0a";
            e.target.style.color = "#fca5a5";
          }}
        >
          Logout
        </button>
      </nav>
    </aside>
  );
}

