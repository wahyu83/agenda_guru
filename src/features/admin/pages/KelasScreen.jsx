import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, LayoutDashboard, X, Check, Undo2 } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const KelasScreen = () => {
  const { kelas, guru, mapel, tahunPelajaran, pengampuAktif, fetchPengampu, addPengampu, updatePengampu, deletePengampu, addKelas, deleteKelas, updateKelas, setWaliKelas } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nama, setNama] = useState('');
  
  // Pengampu Modal State
  const [showPengampuModal, setShowPengampuModal] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [pengampuForm, setPengampuForm] = useState({ guruId: '', mapelId: '', hari: 'Senin', jamKe: '1', jamSampai: '1' });
  const [editingPengampuId, setEditingPengampuId] = useState(null);

  const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const JAM_KE = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

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
      if (editingPengampuId) {
        const success = await updatePengampu(editingPengampuId, {
          guruId: pengampuForm.guruId,
          mapelId: pengampuForm.mapelId,
          hari: pengampuForm.hari,
          jamKe: pengampuForm.jamKe,
          jamSampai: pengampuForm.jamSampai
        });
        if (success) {
          setEditingPengampuId(null);
          setPengampuForm({ guruId: '', mapelId: '', hari: 'Senin', jamKe: '1', jamSampai: '1' });
        }
      } else {
        const success = await addPengampu({
          guruId: pengampuForm.guruId,
          mapelId: pengampuForm.mapelId,
          kelasId: selectedKelas.id,
          hari: pengampuForm.hari,
          jamKe: pengampuForm.jamKe,
          jamSampai: pengampuForm.jamSampai
        });
        if (success) {
          setPengampuForm({ guruId: '', mapelId: '', hari: 'Senin', jamKe: '1', jamSampai: '1' });
        }
      }
    }
  };

  const handleEditPengampu = (item) => {
    setEditingPengampuId(item.id);
    setPengampuForm({
      guruId: item.guruId.toString(),
      mapelId: item.mapelId.toString(),
      hari: item.hari,
      jamKe: item.jamKe.toString(),
      jamSampai: item.jamSampai.toString()
    });
  };

  const handleCancelEditPengampu = () => {
    setEditingPengampuId(null);
    setPengampuForm({ guruId: '', mapelId: '', hari: 'Senin', jamKe: '1', jamSampai: '1' });
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
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Wali Kelas</th>
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
                  {item.waliKelas ? (
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--success)20', color: 'var(--success)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '600' }}>
                      {item.waliKelas.nama}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Belum ditentukan</span>
                  )}
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
                <form onSubmit={handleAddPengampu} className="grid grid-cols-1 md:grid-cols-8 gap-2 mb-6 items-end">
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
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Hari</label>
                    <select className="input" value={pengampuForm.hari} onChange={e => setPengampuForm({...pengampuForm, hari: e.target.value})} required>
                      {HARI.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Jam Ke</label>
                    <select className="input" value={pengampuForm.jamKe} onChange={e => setPengampuForm({...pengampuForm, jamKe: e.target.value, jamSampai: Math.max(parseInt(e.target.value), parseInt(pengampuForm.jamSampai)).toString()})} required>
                      {JAM_KE.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Sampai</label>
                    <select className="input" value={pengampuForm.jamSampai} onChange={e => setPengampuForm({...pengampuForm, jamSampai: e.target.value})} required>
                      {JAM_KE.filter(j => parseInt(j) >= parseInt(pengampuForm.jamKe)).map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                  <div>
                    {editingPengampuId && (
                      <button type="button" className="btn btn-secondary w-full" style={{ padding: '0.6rem' }} onClick={handleCancelEditPengampu}>
                        <Undo2 size={18} />
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.6rem', marginTop: editingPengampuId ? '0.25rem' : 0 }}>
                      {editingPengampuId ? <><Check size={18} /> Simpan</> : <><Plus size={18} /> Tambah</>}
                    </button>
                  </div>
                </form>

                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Daftar Pengampu (Tahun {tahunAktif.nama})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-hover)' }}>
                      <th style={{ padding: '0.75rem' }}>Mata Pelajaran</th>
                      <th style={{ padding: '0.75rem' }}>Guru</th>
                      <th style={{ padding: '0.75rem' }}>Hari</th>
                      <th style={{ padding: '0.75rem' }}>Jam</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pengampuAktif.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada guru pengampu di kelas ini.</td></tr>
                    ) : (
                      pengampuAktif.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: editingPengampuId === item.id ? 'var(--info)10' : 'transparent' }}>
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.mapel?.nama}</td>
                          <td style={{ padding: '0.75rem' }}>{item.guru?.nama}</td>
                          <td style={{ padding: '0.75rem' }}>{item.hari}</td>
                          <td style={{ padding: '0.75rem' }}>{item.jamKe === item.jamSampai ? item.jamKe : `${item.jamKe}-${item.jamSampai}`}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <div className="flex justify-end gap-1">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEditPengampu(item); }}
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem', color: 'var(--info)', display: 'flex', alignItems: 'center' }}
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => { if(window.confirm('Hapus pengampu ini?')) deletePengampu(item.id) }}
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem', color: 'var(--danger)', display: 'flex', alignItems: 'center' }}
                                title="Hapus"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}

            {/* Wali Kelas Assignment */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Wali Kelas</h3>
              <div className="flex gap-2 items-end">
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Pilih Guru sebagai Wali Kelas</label>
                  <select 
                    className="input" 
                    value={selectedKelas?.waliKelasId || ''}
                    onChange={async (e) => {
                      const val = e.target.value;
                      await setWaliKelas(selectedKelas.id, val || null);
                      setSelectedKelas({ ...selectedKelas, waliKelasId: val ? parseInt(val) : null });
                    }}
                  >
                    <option value="">-- Tidak Ada --</option>
                    {guru.map(g => <option key={g.id} value={g.id}>{g.nama} ({g.nip || '-'})</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelasScreen;
