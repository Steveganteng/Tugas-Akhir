import React, { useEffect, useState, useRef } from "react";
import { clearAuthState, getAuthState, getHomePathForRole, ROLE_APOTEKER, getAuthProfile } from "../../lib/auth";

const NAV_ITEMS = [
  { key: "dashboard", href: "/", label: "Dashboard" },
  { key: "input", href: "/restock-by-input", label: "Restock by Input" },
  { key: "history", href: "/restock-history", label: "Historis Restok" },
];

export default function ApotekerLayout({ activeNav, pageTitle, pageSubtitle, children, allowAdmin = false }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const userRef = useRef(null);

  useEffect(() => {
    const authState = getAuthState();
    if (!authState.isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    if (authState.role !== ROLE_APOTEKER && !(allowAdmin && authState.role === "admin")) {
      window.location.href = getHomePathForRole(authState.role);
      return;
    }

    setIsAuthorized(true);
  }, [allowAdmin]);

  useEffect(() => {
    function handleDocClick(e) {
      if (showProfile && userRef.current && !userRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    }

    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, [showProfile]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="apoteker-page">
      <style>{`
        .apoteker-page {
          min-height: 100vh;
          background: #030712;
          color: #e5e7eb;
          font-family: 'Segoe UI', Tahoma, system-ui, sans-serif;
        }

        .apoteker-wrapper {
          display: flex;
          width: 100%;
          min-height: 100vh;
        }

        .apoteker-sidebar {
          width: 260px;
          background: #0d1117;
          color: #dbeafe;
          min-height: 100vh;
          padding: 20px;
          box-sizing: border-box;
          border-right: 1px solid #161b22;
          flex-shrink: 0;
        }

        .apoteker-sidebar h2 {
          margin-top: 12px;
          margin-bottom: 0;
          font-size: 18px;
          color: #f9fafb;
        }

        .apoteker-sidebar .muted {
          color: #9ca3af;
          font-size: 13px;
        }

        .apoteker-nav {
          margin-top: 20px;
          display: grid;
          gap: 8px;
        }

        .apoteker-nav a {
          display: block;
          padding: 10px 12px;
          color: #9ca3af;
          text-decoration: none;
          border-radius: 8px;
          background: transparent;
          border: 1px solid transparent;
        }

        .apoteker-nav a:hover {
          background: #111827;
          color: #dbeafe;
          border-color: #1f2937;
        }

        .apoteker-nav a.active {
          background: #1e3a8a;
          color: #dbeafe;
          border-color: #2563eb;
          font-weight: 700;
        }

        .apoteker-main-container {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .apoteker-topbar {
          position: sticky;
          top: 0;
          z-index: 10;
          background: #0d1117;
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #161b22;
          color: #e5e7eb;
        }

        .apoteker-content {
          flex: 1;
          padding: 24px;
        }

        .apoteker-shell {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          display: grid;
          gap: 16px;
        }

        .apoteker-page-header h1 {
          margin: 0;
          font-size: 36px;
          color: #f9fafb;
        }

        .apoteker-page-header p {
          margin: 6px 0 0;
          color: #9ca3af;
          font-size: 18px;
        }

        .apoteker-card,
        .apoteker-panel {
          background: #0d1117;
          border: 1px solid #161b22;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
        }

        .apoteker-card {
          padding: 18px;
        }

        .apoteker-panel {
          padding: 18px;
        }

        .apoteker-card .label {
          font-size: 12px;
          color: #9ca3af;
        }

        .apoteker-card .value {
          margin-top: 8px;
          font-size: 26px;
          font-weight: 800;
          color: #f9fafb;
        }

        .apoteker-panel-title {
          margin: 0;
          font-size: 22px;
          color: #f9fafb;
        }

        .apoteker-panel-subtitle {
          margin: 6px 0 12px;
          color: #9ca3af;
          font-size: 14px;
        }

        .apoteker-input,
        .apoteker-select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #1f2937;
          background: #111827;
          color: #e5e7eb;
          border-radius: 10px;
          padding: 11px 12px;
          outline: none;
          font-size: 15px;
        }

        .apoteker-input::placeholder {
          color: #6b7280;
        }

        .apoteker-input:focus,
        .apoteker-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
        }

        .apoteker-inline-form {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .apoteker-btn {
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
        }

        .apoteker-btn-primary {
          border: none;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
        }

        .apoteker-btn-secondary {
          border: 1px solid #1f2937;
          background: #111827;
          color: #dbeafe;
        }

        .apoteker-btn-danger {
          border: 1px solid #7f1d1d;
          background: #450a0a;
          color: #fecaca;
        }

        .apoteker-table {
          width: 100%;
          border-collapse: collapse;
          color: #e5e7eb;
          margin-top: 12px;
        }

        .apoteker-table thead th {
          text-align: left;
          font-size: 13px;
          color: #9ca3af;
          border-bottom: 1px solid #161b22;
          padding: 10px 6px;
        }

        .apoteker-table td {
          padding: 12px 6px;
          border-bottom: 1px solid #161b22;
        }

        @media (max-width: 860px) {
          .apoteker-wrapper {
            flex-direction: column;
          }

          .apoteker-sidebar {
            width: 100%;
            min-height: auto;
          }

          .apoteker-topbar {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .apoteker-content {
            padding: 16px;
          }

          .apoteker-page-header h1 {
            font-size: 30px;
          }

          .apoteker-page-header p {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="apoteker-wrapper">
        <aside className="apoteker-sidebar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 28 }}>💊</div>
            <div>
              <div className="muted">KLINIK DEL</div>
              <h2>Prediksi Restok Obat</h2>
            </div>
          </div>

          <nav className="apoteker-nav">
            {NAV_ITEMS.map((item) => (
              <a key={item.key} href={item.href} className={activeNav === item.key ? "active" : ""}>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="apoteker-main-container">
          <header className="apoteker-topbar">
            <div style={{ fontWeight: 700 }}>Apoteker — Prediksi Restok Obat</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div ref={userRef} style={{ position: "relative" }}>
                <div onClick={() => setShowProfile((s) => !s)} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg,#0ea5e9,#0284c7)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                    A
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 700 }}>Apoteker</div>
                    <div style={{ color: "#9ca3af", fontSize: 12 }}>apoteker@apotek.local</div>
                  </div>
                </div>

                {showProfile && (
                  <div style={{ position: "absolute", right: 0, top: 48, background: "#0d1117", border: "1px solid #161b22", padding: 12, borderRadius: 8, minWidth: 260, zIndex: 50 }}>
                    <div style={{ fontWeight: 800, color: "#f9fafb" }}>{getAuthProfile()?.fullName || getAuthState().username || "-"}</div>
                    <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>{getAuthState().role}</div>
                    <div style={{ marginTop: 8, color: "#9ca3af", fontSize: 13 }}>Email: <span style={{ color: "#f9fafb" }}>{getAuthProfile()?.email || "-"}</span></div>
                    <div style={{ marginTop: 6, color: "#9ca3af", fontSize: 13 }}>Telepon: <span style={{ color: "#f9fafb" }}>{getAuthProfile()?.phone || "-"}</span></div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      <a href="/profile" style={{ textDecoration: "none", background: "#111827", color: "#dbeafe", padding: "8px 10px", borderRadius: 8, border: "1px solid #1f2937" }}>Edit Profil</a>
                      <button onClick={() => { if (window.confirm("Anda yakin ingin logout?")) { clearAuthState(); window.location.href = "/login"; } }} style={{ background: "transparent", border: "1px solid #1f2937", color: "#9ca3af", padding: "8px 10px", borderRadius: 8, cursor: "pointer" }}>Logout</button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (window.confirm("Anda yakin ingin logout?")) {
                    clearAuthState();
                    window.location.href = "/login";
                  }
                }}
                style={{ marginLeft: 8, background: "transparent", border: "1px solid #1f2937", color: "#9ca3af", padding: "8px 10px", borderRadius: 8, cursor: "pointer" }}
              >
                Logout
              </button>
            </div>
          </header>

          <main className="apoteker-content">
            <div className="apoteker-shell">
              {(pageTitle || pageSubtitle) && (
                <section className="apoteker-page-header">
                  {pageTitle ? <h1>{pageTitle}</h1> : null}
                  {pageSubtitle ? <p>{pageSubtitle}</p> : null}
                </section>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
