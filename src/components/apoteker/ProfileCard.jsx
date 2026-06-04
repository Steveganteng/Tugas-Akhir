import React from "react";
import { getAuthState, getAuthProfile } from "../../lib/auth";

export default function ProfileCard() {
  const auth = getAuthState();
  const profile = getAuthProfile() || { fullName: "-", email: "-", phone: "-", clinic: "-" };

  if (!auth.isAuthenticated) return null;

  return (
    <aside style={{ marginTop: 16, background: "#071124", border: "1px solid #102030", borderRadius: 12, padding: 16, maxWidth: 480 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#021026" }}>
          {String(auth.username || "A").charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#e5e7eb" }}>{profile.fullName || auth.username}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{auth.role}</div>
        </div>
      </div>

      <div style={{ marginTop: 12, color: "#9ca3af", fontSize: 13 }}>
        <div>Email: <span style={{ color: "#e5e7eb" }}>{profile.email || '-'}</span></div>
        <div>Telepon: <span style={{ color: "#e5e7eb" }}>{profile.phone || '-'}</span></div>
        <div>Klinik: <span style={{ color: "#e5e7eb" }}>{profile.clinic || '-'}</span></div>
      </div>

      <div style={{ marginTop: 12 }}>
        <a href="/profile" style={{ textDecoration: "none", border: "1px solid #1f2937", background: "#111827", color: "#d1d5db", padding: "8px 10px", borderRadius: 8, fontWeight: 700 }}>Edit Profil</a>
      </div>
    </aside>
  );
}
