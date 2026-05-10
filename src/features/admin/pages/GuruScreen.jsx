import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Upload, KeyRound } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import Papa from 'papaparse';

const GuruScreen = () => {
  const { guru, addGuru, deleteGuru, updateGuru, importGuru, resetPassword } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nama: '', nip: '', username: '', password: '' });
  const fileInputRef = useRef(null);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.data && results.data.length > 0) {
            await importGuru(results.data);
            alert(`${results.data.length} data guru berhasil diimpor!`);
          }
        }
      });
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setFormData({ nama: item.nama, nip: item.nip, username: item.username, password: '' });
    setShowForm(true);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({ nama: '', nip: '', username: '', password: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.nama && formData.username) {
      if (editingId) {
        await updateGuru(editingId, { 
          nama: formData.nama, 
          nip: formData.nip || '-', 
          username: formData.username,
          password: formData.password 
        });
      } else {
        await addGuru({ 
          nama: formData.nama, 
          nip: formData.nip || '-', 
          username: formData.username,
          password: formData.password 
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ nama: '', nip: '', username: '', password: '' });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Data Guru</h1>
          <p style={{ color: 'var(--text-muted)' }}>Kelola data guru, tambah, edit, atau import dari CSV.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleImport} 
          />
          <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
            <Upload size={18} /> Import CSV
          </button>
          <button className="btn btn-primary" onClick={handleAddClick}>
            <Plus size={18} /> Tambah Guru
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', border: '1px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {editingId ? 'Edit Data Guru' : 'Tambah Data Guru'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Nama Lengkap</label>
              <input 
                type="text" 
                className="input" 
                value={formData.nama}
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>NIP / NUPTK</label>
              <input 
                type="text" 
                className="input" 
                value={formData.nip}
                onChange={(e) => setFormData({...formData, nip: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Username Login</label>
              <input 
                type="text" 
                className="input" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password Login</label>
              <input 
                type="password" 
                className="input" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Kosongkan untuk default (guru123)"
              />
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end mt-2">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: '1rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-hover)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>NIP / NUPTK</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Nama Lengkap</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Username</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {guru.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.nip}</td>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{item.nama}</td>
                <td style={{ padding: '1rem' }}>{item.username}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div className="flex justify-end gap-2">
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.5rem', color: 'var(--warning)' }} 
                      title="Reset Password ke 123456"
                      onClick={async () => {
                        if(window.confirm(`Yakin ingin mereset password ${item.nama} menjadi 123456?`)) {
                          try {
                            await resetPassword(item.id);
                            alert(`Password ${item.nama} berhasil direset menjadi 123456`);
                          } catch (err) {
                            alert(err.message);
                          }
                        }
                      }}
                    >
                      <KeyRound size={16} />
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.5rem', color: 'var(--info)' }} 
                      title="Edit"
                      onClick={() => handleEditClick(item)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.5rem', color: 'var(--danger)' }} 
                      title="Hapus"
                      onClick={() => {
                        if (window.confirm('Yakin ingin menghapus guru ini?')) deleteGuru(item.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuruScreen;
