import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, LayoutDashboard, X } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const KelasScreen = () => {
  const { kelas, guru, mapel, tahunPelajaran, pengampuAktif, fetchPengampu, addPengampu, deletePengampu, addKelas, deleteKelas, updateKelas } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nama, setNama] = useState('');
  
  // Pengampu Modal State
  const [showPengampuModal, setShowPengampuModal] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [pengampuForm, setPengampuForm] = useState({ guruId: '', mapelId: '' });

  const tahunAktif = tahunPelajaran.find(t => t.isActive);

  useEffect(() => {
    if (showPengampuModal && selectedKelas) {
      fetchPengampu(selectedKelas.id);
    }
  }, [showPengampuModal, selectedKelas, fetchPengampu]);

  const handleOpenPengampu = (item) => {
    setSelectedKelas(item);
    setShowPengampuModal(true);
  };

  const handleAddPengampu = async (e) => {
    e.preventDefault();
    if (pengampuForm.guruId && pengampuForm.mapelId && tahunAktif) {
      const success = await addPengampu({
        guruId: pengampuForm.guruId,
        mapelId: pengampuForm.mapelId,
        kelasId: selectedKelas.id
      });
      if (success) {
        setPengampuForm({ guruId: '', mapelId: '' });
      }
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
        await updateKelas(editingId, nama);
      } else {
        await addKelas(nama);
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Data Kelas & Pengampu</h1>
          <p style={{ color: 'var(--text-muted)' }}>Kelola data kelas dan tugaskan guru pengampu mata pelajaran untuk masing-masing kelas.</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddClick}>
          <Plus size={18} /> Tambah Kelas
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', border: '1px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {editingId ? 'Edit Data Kelas' : 'Tambah Data Kelas'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Nama Kelas (misal: XII RPL 1)</label>
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
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Nama Kelas</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Guru Pengampu</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Jumlah Siswa</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {kelas.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: '600', fontSize: '1.1rem', color: 'var(--primary)' }}>
                  <div className="flex items-center gap-2">
                    <LayoutDashboard size={18} /> {item.nama}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--info)20', color: 'var(--info)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '600' }}>
                    {item.jumlahPengampu} Guru Terdaftar
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div className="flex items-center gap-2 color-muted" style={{ color: 'var(--text-muted)' }}>
                    <Users size={16} /> {item.jumlahSiswa} Siswa
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div className="flex justify-end gap-2">
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      onClick={() => handleOpenPengampu(item)}
                    >
                      Kelola Pengampu
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
                        if (window.confirm('Yakin ingin menghapus kelas ini?')) deleteKelas(item.id);
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

      {showPengampuModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Kelola Pengampu: {selectedKelas?.nama}</h2>
              <button onClick={() => setShowPengampuModal(false)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            {!tahunAktif ? (
              <p style={{ color: 'var(--danger)' }}>Peringatan: Tidak ada Tahun Pelajaran yang Aktif!</p>
            ) : (
              <>
                <form onSubmit={handleAddPengampu} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-6 items-end">
                  <div className="md:col-span-2">
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Mata Pelajaran</label>
                    <select className="input" value={pengampuForm.mapelId} onChange={e => setPengampuForm({...pengampuForm, mapelId: e.target.value})} required>
                      <option value="">-- Pilih Mapel --</option>
                      {mapel.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Guru Pengampu</label>
                    <select className="input" value={pengampuForm.guruId} onChange={e => setPengampuForm({...pengampuForm, guruId: e.target.value})} required>
                      <option value="">-- Pilih Guru --</option>
                      {guru.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.6rem' }}><Plus size={18} /> Tambah</button>
                  </div>
                </form>

                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Daftar Pengampu (Tahun {tahunAktif.nama})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-hover)' }}>
                      <th style={{ padding: '0.75rem' }}>Mata Pelajaran</th>
                      <th style={{ padding: '0.75rem' }}>Guru</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pengampuAktif.length === 0 ? (
                      <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada guru pengampu di kelas ini.</td></tr>
                    ) : (
                      pengampuAktif.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.mapel?.nama}</td>
                          <td style={{ padding: '0.75rem' }}>{item.guru?.nama}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <button 
                              onClick={() => { if(window.confirm('Hapus pengampu ini?')) deletePengampu(item.id) }}
                              style={{ color: 'var(--danger)', padding: '0.25rem' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KelasScreen;
