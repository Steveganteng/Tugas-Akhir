import React, { useEffect, useState } from "react";
import { clearAuthState, getAuthState, getHomePathForRole, ROLE_ADMIN } from "../../lib/auth";

const NAV_ITEMS = [
  { key: "dashboard", href: "/admin", label: "Dashboard" },
  { key: "restock", href: "/admin/restock", label: "Restock" },
  { key: "report", href: "/admin/report", label: "Laporan" },
  { key: "users", href: "/admin/users", label: "Manajemen User" },
];

export default function AdminLayout({ activeNav, pageTitle, pageSubtitle, children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const auth = getAuthState();
    if (!auth.isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    if (auth.role !== ROLE_ADMIN) {
      window.location.href = getHomePathForRole(auth.role);
      return;
    }

    setIsAuthorized(true);
  }, []);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="admin-page">
      <style>{`
        .admin-page {
          min-height: 100vh;
          background: #030712;
          color: #e5e7eb;
          font-family: 'Segoe UI', Tahoma, system-ui, sans-serif;
        }

        .admin-wrapper {
          display: flex;
          width: 100%;
          min-height: 100vh;
        }

        .admin-sidebar {
          width: 260px;
          background: #0d1117;
          color: #dbeafe;
          min-height: 100vh;
          padding: 20px;
          box-sizing: border-box;
          border-right: 1px solid #161b22;
          flex-shrink: 0;
        }

        .admin-sidebar h2 {
          margin-top: 12px;
          margin-bottom: 0;
          font-size: 18px;
          color: #f9fafb;
        }

        .admin-sidebar .muted {
          color: #9ca3af;
          font-size: 13px;
        }

        .admin-nav {
          margin-top: 20px;
          display: grid;
          gap: 8px;
        }

        .admin-nav a {
          display: block;
          padding: 10px 12px;
          color: #9ca3af;
          text-decoration: none;
          border-radius: 8px;
          background: transparent;
          border: 1px solid transparent;
        }

        .admin-nav a:hover {
          background: #111827;
          color: #dbeafe;
          border-color: #1f2937;
        }

        .admin-nav a.active {
          background: #1e3a8a;
          color: #dbeafe;
          border-color: #2563eb;
          font-weight: 700;
        }

        .admin-main-container {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .admin-topbar {
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

        .admin-content {
          flex: 1;
          padding: 24px;
        }

        .admin-shell {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          gap: 16px;
        }

        .admin-page-header h1 {
          margin: 0;
          font-size: 36px;
          color: #f9fafb;
        }

        .admin-page-header p {
          margin: 6px 0 0;
          color: #9ca3af;
          font-size: 18px;
        }

        .admin-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .admin-card,
        .admin-panel {
          background: #0d1117;
          border: 1px solid #161b22;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .admin-card {
          padding: 18px;
        }

        .admin-panel {
          padding: 18px;
        }

        .admin-card .label {
          font-size: 12px;
          color: #9ca3af;
        }

        .admin-card .value {
          margin-top: 8px;
          font-size: 38px;
          font-weight: 800;
          color: #f9fafb;
        }

        .admin-panel-title {
          margin: 0;
          font-size: 34px;
          color: #f9fafb;
        }

        .admin-panel-subtitle {
          margin: 6px 0 12px;
          color: #9ca3af;
          font-size: 18px;
        }

        .admin-input,
        .admin-select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #1f2937;
          background: #111827;
          color: #e5e7eb;
          border-radius: 10px;
          padding: 11px 12px;
          outline: none;
          font-size: 16px;
        }

        .admin-input::placeholder {
          color: #6b7280;
        }

        .admin-input:focus,
        .admin-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
        }

        .admin-inline-form {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .admin-btn {
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
        }

        .admin-btn-primary {
          border: none;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
        }

        .admin-btn-secondary {
          border: 1px solid #1f2937;
          background: #111827;
          color: #dbeafe;
        }

        .admin-btn-danger {
          border: 1px solid #7f1d1d;
          background: #450a0a;
          color: #fecaca;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          color: #e5e7eb;
          margin-top: 12px;
        }

        .admin-table thead th {
          text-align: left;
          font-size: 13px;
          color: #9ca3af;
          border-bottom: 1px solid #161b22;
          padding: 10px 6px;
        }

        .admin-table td {
          padding: 12px 6px;
          border-bottom: 1px solid #161b22;
        }

        @media (max-width: 860px) {
          .admin-wrapper {
            flex-direction: column;
          }

          .admin-sidebar {
            width: 100%;
            min-height: auto;
          }

          .admin-topbar {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .admin-content {
            padding: 16px;
          }

          .admin-page-header h1 {
            font-size: 30px;
          }

          .admin-page-header p {
            font-size: 16px;
          }

          .admin-panel-title {
            font-size: 28px;
          }
        }
      `}</style>

      <div className="admin-wrapper">
        <aside className="admin-sidebar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 28 }}>💊</div>
            <div>
              <div className="muted">KLINIK DEL</div>
              <h2>Admin Dashboard</h2>
            </div>
          </div>

          <nav className="admin-nav">
            {NAV_ITEMS.map((item) => (
              <a key={item.key} href={item.href} className={activeNav === item.key ? "active" : ""}>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="admin-main-container">
          <header className="admin-topbar">
            <div style={{ fontWeight: 700 }}>Admin — Sistem Inventory Obat</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg,#0ea5e9,#0284c7)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  A
                </div>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 700 }}>Admin</div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>admin@apotek.local</div>
                </div>
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

          <main className="admin-content">
            <div className="admin-shell">
              {(pageTitle || pageSubtitle) && (
                <section className="admin-page-header">
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
