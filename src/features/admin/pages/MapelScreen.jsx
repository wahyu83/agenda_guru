import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Upload, BookOpen } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import Papa from 'papaparse';

const MapelScreen = () => {
  const { mapel, addMapel, deleteMapel, updateMapel, importMapel } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nama, setNama] = useState('');
  const fileInputRef = useRef(null);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.data && results.data.length > 0) {
            await importMapel(results.data);
            alert(`${results.data.length} data mata pelajaran berhasil diimpor!`);
          }
        }
      });
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setNama(item.nama);
    setShowForm(true);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setNama('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nama) {
      if (editingId) {
        await updateMapel(editingId, nama);
      } else {
        await addMapel(nama);
      }
      setShowForm(false);
      setEditingId(null);
      setNama('');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Mata Pelajaran</h1>
          <p style={{ color: 'var(--text-muted)' }}>Kelola data mata pelajaran yang ada di sekolah.</p>
          <p style={{ color: 'var(--info)', fontSize: '0.75rem', marginTop: '0.25rem' }}>* Untuk Import CSV, pastikan menggunakan header: <b>nama</b></p>
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
            <Plus size={18} /> Tambah Mapel
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', border: '1px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {editingId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Nama Mata Pelajaran</label>
              <input 
                type="text" 
                className="input" 
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required 
              />
            </div>
            <div className="flex gap-2 justify-end mt-2">
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
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>No</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Nama Mata Pelajaran</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {mapel.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{index + 1}</td>
                <td style={{ padding: '1rem', fontWeight: '500' }}>
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} color="var(--primary)" />
                    {item.nama}
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div className="flex justify-end gap-2">
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
                        if (window.confirm('Yakin ingin menghapus mapel ini?')) deleteMapel(item.id);
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

export default MapelScreen;
