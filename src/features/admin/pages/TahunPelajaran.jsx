import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const TahunPelajaran = () => {
  const { tahunPelajaran, setTahunAktif, addTahunPelajaran, deleteTahunPelajaran } = useAppStore();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nama: '', semester: 'Ganjil' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.nama) {
      await addTahunPelajaran(formData.nama, formData.semester);
      setShowForm(false);
      setFormData({ nama: '', semester: 'Ganjil' });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Tahun Pelajaran</h1>
          <p style={{ color: 'var(--text-muted)' }}>Kelola data tahun pelajaran dan atur tahun pelajaran aktif.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Tambah Tahun Pelajaran
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', border: '1px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Tambah Tahun Pelajaran</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Tahun Pelajaran (misal: 2025/2026)</label>
              <input 
                type="text" 
                className="input" 
                value={formData.nama}
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Semester</label>
              <select 
                className="input" 
                value={formData.semester}
                onChange={(e) => setFormData({...formData, semester: e.target.value})}
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
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
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Tahun Pelajaran</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tahunPelajaran.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{item.nama}</td>
                <td style={{ padding: '1rem' }}>
                  {item.isActive ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary-hover)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '600' }}>
                      <CheckCircle size={14} /> Aktif
                    </span>
                  ) : (
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '500' }}>
                      Tidak Aktif
                    </span>
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div className="flex justify-end gap-2">
                    {!item.isActive && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => setTahunAktif(item.id)}
                      >
                        Jadikan Aktif
                      </button>
                    )}
                    <button className="btn btn-secondary" style={{ padding: '0.5rem', color: 'var(--info)' }}>
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.5rem', color: 'var(--danger)' }}
                      onClick={() => {
                        if (window.confirm('Yakin ingin menghapus data ini?')) deleteTahunPelajaran(item.id)
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

export default TahunPelajaran;
