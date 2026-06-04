import React from "react";
import AdminLayout from "./AdminLayout";

export default function AdminDashboard() {
  return (
    <AdminLayout activeNav="dashboard" pageTitle="Dashboard Admin" pageSubtitle="Ringkasan cepat kondisi inventory obat.">
      <section className="admin-grid" style={{ marginBottom: 20 }}>
        <div className="admin-card">
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Total Stok Obat</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>1,245</div>
        </div>
        <div className="admin-card">
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Stok Rendah</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>12</div>
        </div>
        <div className="admin-card">
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Request Pending</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>8</div>
        </div>
        <div className="admin-card">
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Stok Habis</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>2</div>
        </div>
      </section>

      <section className="admin-panel" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700 }}>Obat dengan Stok Rendah</div>
                <div>
            <a href="#restock" onClick={(e)=>{e.preventDefault(); window.location.hash='restock';}} className="admin-btn admin-btn-primary" style={{ textDecoration: "none" }}>Buat Request</a>
                </div>
              </div>

        <table className="admin-table">
                <thead>
                  <tr style={{ textAlign: 'left', color: '#9ca3af' }}>
                    <th style={{ padding: '8px 6px' }}>Nama Obat</th>
                    <th style={{ padding: '8px 6px' }}>Stok Saat Ini</th>
                    <th style={{ padding: '8px 6px' }}>Threshold</th>
                    <th style={{ padding: '8px 6px' }}>Status</th>
                    <th style={{ padding: '8px 6px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 6px' }}><strong>Paracetamol 500mg</strong></td>
                    <td style={{ padding: '8px 6px' }}>45 box</td>
                    <td style={{ padding: '8px 6px' }}>100 box</td>
                    <td style={{ padding: '8px 6px', color: '#fca5a5' }}>Rendah</td>
              <td style={{ padding: '8px 6px' }}><button className="admin-btn admin-btn-primary" style={{ padding: '6px 10px' }}>Detail</button></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 6px' }}><strong>Amoxicillin 500mg</strong></td>
                    <td style={{ padding: '8px 6px' }}>12 box</td>
                    <td style={{ padding: '8px 6px' }}>50 box</td>
                    <td style={{ padding: '8px 6px', color: '#fecaca' }}>Kritis</td>
              <td style={{ padding: '8px 6px' }}><button className="admin-btn admin-btn-primary" style={{ padding: '6px 10px' }}>Detail</button></td>
                  </tr>
                </tbody>
              </table>
      </section>
    </AdminLayout>
  );
}
