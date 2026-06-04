import React, { useEffect, useState } from "react";
import { getAuthState, getAuthProfile, setAuthProfile, clearAuthState, ROLE_APOTEKER } from "../../lib/auth";
import ApotekerLayout from "./ApotekerLayout";

export default function Profile() {
  const [auth, setAuth] = useState(() => getAuthState());
  const [profile, setProfile] = useState(() => getAuthProfile() || { fullName: "", email: "", phone: "" });

  useEffect(() => {
    const state = getAuthState();
    if (!state.isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    setAuth(state);
    setProfile(getAuthProfile() || { fullName: state.username || "", email: "", phone: "" });
  }, []);

  const handleLogout = () => {
    if (window.confirm("Anda yakin ingin logout?")) {
      clearAuthState();
      window.location.href = "/login";
    }
  };

  const handleSave = () => {
    const next = { ...profile };
    setAuthProfile(next);
    alert("Profil disimpan.");
  };

  const handleBack = () => {
    window.location.href = "/";
  };

  if (!auth.isAuthenticated) return null;

  return (
    <ApotekerLayout activeNav="profile" pageTitle="Profil" pageSubtitle="Kelola identitas akun yang sedang masuk.">
      <section className="apoteker-panel" style={{ width: "min(100%, 520px)" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: 999, background: "linear-gradient(135deg,#06b6d4,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800 }}>
            {auth.username ? auth.username.charAt(0).toUpperCase() : "A"}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{auth.username || "-"}</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>{auth.role === ROLE_APOTEKER ? "Apoteker" : auth.role || "Pengguna"}</div>
          </div>
        </div>

        <div style={{ marginTop: 18, color: "#9ca3af" }}>
          <p style={{ margin: 0 }}>Halaman profil ini menunjukkan peran akun yang sedang masuk.</p>
          <p style={{ marginTop: 8 }}>Peran Anda: <strong style={{ color: "#e5e7eb" }}>{auth.role}</strong></p>

          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            <label style={{ fontSize: 13, color: "#cbd5e1" }}>Nama Lengkap</label>
            <input className="apoteker-input" value={profile.fullName} readOnly />

            <label style={{ fontSize: 13, color: "#cbd5e1" }}>Email</label>
            <input className="apoteker-input" value={profile.email} readOnly />

            <label style={{ fontSize: 13, color: "#cbd5e1" }}>Telepon</label>
            <input className="apoteker-input" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />

            
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={handleBack} className="apoteker-btn apoteker-btn-secondary">Kembali</button>
            <button onClick={handleSave} className="apoteker-btn apoteker-btn-primary">Simpan</button>
            <button onClick={handleLogout} className="apoteker-btn apoteker-btn-danger">Logout</button>
          </div>
        </div>
      </section>
    </ApotekerLayout>
  );
}
