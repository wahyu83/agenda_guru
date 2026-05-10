import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Upload, UserPlus, CheckSquare, X } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import Papa from 'papaparse';

const SiswaScreen = () => {
  const { siswa, kelas, tahunPelajaran, addSiswa, deleteSiswa, updateSiswa, importSiswa, enrollSiswa, enrollBatchSiswa } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nama: '', nis: '' });
  
  const [selectedIds, setSelectedIds] = useState([]);
  const fileInputRef = useRef(null);
  
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState({ type: null, siswaId: null, nama: '' }); // type: 'single' | 'mass'
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [filterKelasId, setFilterKelasId] = useState('');

  const tahunAktif = tahunPelajaran.find(t => t.isActive);

  // Helper to find student's class in active year
  const getKelasAktif = (enrollments) => {
    if (!enrollments || enrollments.length === 0) return '-';
    if (!tahunAktif) return enrollments[enrollments.length - 1].kelas.nama;
    const activeEnrollment = enrollments.find(e => e.kelas.tahunPelajaranId === tahunAktif.id);
    return activeEnrollment ? activeEnrollment.kelas.nama : '-';
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.data && results.data.length > 0) {
            await importSiswa(results.data);
            alert(`${results.data.length} data siswa berhasil diimpor!`);
          }
        }
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSiswa.length && filteredSiswa.length > 0) setSelectedIds([]);
    else setSelectedIds(filteredSiswa.map(s => s.id));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleMassEnroll = () => {
    if (selectedIds.length === 0) return alert("Pilih minimal satu siswa.");
    setEnrollTarget({ type: 'mass', siswaId: null, nama: `${selectedIds.length} Siswa` });
    setSelectedKelasId('');
    setShowEnrollModal(true);
  };

  const handleSingleEnroll = (item) => {
    setEnrollTarget({ type: 'single', siswaId: item.id, nama: item.nama });
    setSelectedKelasId('');
    setShowEnrollModal(true);
  };

  const submitEnroll = async (e) => {
    e.preventDefault();
    if (!selectedKelasId) return alert("Pilih kelas tujuan.");
    
    if (enrollTarget.type === 'single') {
      await enrollSiswa(enrollTarget.siswaId, parseInt(selectedKelasId));
    } else if (enrollTarget.type === 'mass') {
      await enrollBatchSiswa(selectedIds, parseInt(selectedKelasId));
      setSelectedIds([]);
    }
    setShowEnrollModal(false);
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setFormData({ nama: item.nama, nis: item.nis });
    setShowForm(true);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({ nama: '', nis: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.nama && formData.nis) {
      if (editingId) {
        await updateSiswa(editingId, { nama: formData.nama, nis: formData.nis });
      } else {
        await addSiswa({ nama: formData.nama, nis: formData.nis });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ nama: '', nis: '' });
    }
  };

  const filteredSiswa = siswa.filter(item => {
    if (!filterKelasId) return true;
    const kelasAktif = getKelasAktif(item.enrollment);
    if (filterKelasId === 'unassigned') return kelasAktif === '-';
    
    const selectedKelas = kelas.find(k => k.id === parseInt(filterKelasId));
    return selectedKelas && kelasAktif === selectedKelas.nama;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Data Siswa & Enrollment</h1>
          <p style={{ color: 'var(--text-muted)' }}>Kelola data siswa dan daftarkan siswa ke kelas pada tahun pelajaran aktif.</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button className="btn btn-primary" onClick={handleMassEnroll} style={{ backgroundColor: 'var(--success)' }}>
              <CheckSquare size={18} /> Mutasi Massal ({selectedIds.length})
            </button>
          )}
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
            <Plus size={18} /> Tambah Siswa
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
        <div className="flex items-center gap-2">
          <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)' }}>Filter Kelas:</label>
          <select 
            className="input" 
            style={{ padding: '0.5rem', minWidth: '200px' }}
            value={filterKelasId}
            onChange={(e) => {
              setFilterKelasId(e.target.value);
              setSelectedIds([]); // reset selection on filter change
            }}
          >
            <option value="">Semua Siswa</option>
            <option value="unassigned">Belum Ada Kelas</option>
            {kelas.map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', border: '1px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {editingId ? 'Edit Data Siswa' : 'Tambah Data Siswa'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>NIS / NISN</label>
              <input 
                type="text" 
                className="input" 
                value={formData.nis}
                onChange={(e) => setFormData({...formData, nis: e.target.value})}
                required 
              />
            </div>
            <div className="flex-1 w-full">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Nama Lengkap</label>
              <input 
                type="text" 
                className="input" 
                value={formData.nama}
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
                required 
              />
            </div>
            <div className="flex gap-2">
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
              <th style={{ padding: '1rem', width: '50px' }}>
                <input type="checkbox" checked={selectedIds.length === filteredSiswa.length && filteredSiswa.length > 0} onChange={toggleSelectAll} />
              </th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>NIS / NISN</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Nama Lengkap</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Kelas (Tahun Aktif)</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredSiswa.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data siswa ditemukan.</td>
              </tr>
            ) : filteredSiswa.map((item) => {
              const kelasAktif = getKelasAktif(item.enrollment);
              return (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.nis}</td>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{item.nama}</td>
                <td style={{ padding: '1rem' }}>
                  {kelasAktif === '-' ? (
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--warning)20', color: 'var(--warning)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '600' }}>
                      Belum terdaftar di kelas
                    </span>
                  ) : (
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--success)20', color: 'var(--success)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '600' }}>
                      {kelasAktif}
                    </span>
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div className="flex justify-end gap-2">
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} 
                      title="Enrollment"
                      onClick={() => handleSingleEnroll(item)}
                    >
                      <UserPlus size={16} /> Enroll
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
                        if (window.confirm('Yakin ingin menghapus siswa ini?')) deleteSiswa(item.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {showEnrollModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '90%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Pendaftaran Kelas</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
              Pilih kelas tujuan untuk <strong>{enrollTarget.nama}</strong> pada Tahun Pelajaran aktif.
            </p>
            <form onSubmit={submitEnroll} className="flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Kelas Tujuan</label>
                <select 
                  className="input" 
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEnrollModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Enroll</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiswaScreen;
