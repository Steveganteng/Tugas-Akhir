import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";

const KEY = 'app-settings';

function loadSettings(){ try{ const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : { namaApotek: 'Apotek Del', alamat: '', telepon: '' }; } catch { return { namaApotek: 'Apotek Del', alamat: '', telepon: '' }; } }
function saveSettings(s){ localStorage.setItem(KEY, JSON.stringify(s)); window.dispatchEvent(new Event('storage')); }

export default function SettingsAdmin(){
  const [settings, setSettings] = useState(()=> loadSettings());

  useEffect(()=>{ const h=()=>setSettings(loadSettings()); window.addEventListener('storage',h); return ()=>window.removeEventListener('storage',h); },[]);

  const onSave = (e)=>{ e.preventDefault(); saveSettings(settings); alert('Pengaturan tersimpan'); };

  return (
    <AdminLayout
      activeNav="settings"
      pageTitle="Pengaturan"
      pageSubtitle="Kelola identitas dan informasi dasar sistem apotek."
    >
      <section className="admin-panel" style={{ maxWidth: 760 }}>
        <h2 className="admin-panel-title">Pengaturan Sistem</h2>
        <form onSubmit={onSave} style={{ display:'grid', gap:10 }}>
          <input className="admin-input" placeholder='Nama Apotek' value={settings.namaApotek} onChange={e=>setSettings({...settings,namaApotek:e.target.value})} />
          <input className="admin-input" placeholder='Alamat' value={settings.alamat} onChange={e=>setSettings({...settings,alamat:e.target.value})} />
          <input className="admin-input" placeholder='Telepon' value={settings.telepon} onChange={e=>setSettings({...settings,telepon:e.target.value})} />
          <button type='submit' className="admin-btn admin-btn-primary" style={{ width: "fit-content" }}>Simpan Pengaturan</button>
        </form>
      </section>
    </AdminLayout>
  );
}
