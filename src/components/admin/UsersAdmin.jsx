import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";

const KEY = 'admin-users';

function loadUsers(){
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function saveUsers(users){ localStorage.setItem(KEY, JSON.stringify(users)); window.dispatchEvent(new Event('storage')); }

export default function UsersAdmin(){
  const [users, setUsers] = useState(()=> loadUsers());
  const [form, setForm] = useState({ username: '', fullName: '', role: 'apoteker' });

  useEffect(()=>{ const h=()=>setUsers(loadUsers()); window.addEventListener('storage',h); return ()=>window.removeEventListener('storage',h); },[]);

  const addUser = (e)=>{ e.preventDefault(); if(!form.username) return alert('username required'); const next=[{ id:`u-${Date.now()}`, ...form }, ...users]; saveUsers(next); setForm({ username:'', fullName:'', role:'apoteker' }); };
  const del = (id)=>{ if(confirm('Hapus user?')){ const next=users.filter(u=>u.id!==id); saveUsers(next); } };

  return (
    <AdminLayout
      activeNav="users"
      pageTitle="Manajemen User"
      pageSubtitle="Tambah dan kelola akun admin serta apoteker."
    >
      <section className="admin-panel">
        <h2 className="admin-panel-title">Tambah User</h2>
        <form onSubmit={addUser} className="admin-inline-form">
          <input className="admin-input" placeholder='Username' value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
          <input className="admin-input" placeholder='Nama lengkap' value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} />
          <select className="admin-select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value='apoteker'>Apoteker</option><option value='admin'>Admin</option></select>
          <button type='submit' className="admin-btn admin-btn-primary">Tambah</button>
        </form>
      </section>

      <section className="admin-panel">
        <h2 className="admin-panel-title">Daftar User</h2>
        <table className="admin-table">
          <thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Aksi</th></tr></thead>
          <tbody>
            {users.map(u=> (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.fullName}</td>
                <td>{u.role}</td>
                <td><button className="admin-btn admin-btn-danger" onClick={()=>del(u.id)}>Hapus</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminLayout>
  );
}
