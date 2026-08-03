import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Clock, Save, X } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const JamPelajaranScreen = () => {
  const { jamPelajaran, fetchJamPelajaran, saveJamPelajaran, updateJamPelajaran, deleteJamPelajaran } = useAppStore();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ jamKe: '', mulai: '', selesai: '' });

  useEffect(() => {
    fetchJamPelajaran();
  }, [fetchJamPelajaran]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ jamKe: '', mulai: '', selesai: '' });
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({ jamKe: String(item.jamKe), mulai: item.mulai, selesai: item.selesai });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jamKe || !form.mulai || !form.selesai) return;

    try {
      if (editingId) {
        await updateJamPelajaran(editingId, form);
      } else {
        await saveJamPelajaran(form);
      }
      resetForm();
      fetchJamPelajaran();
    } catch (err) {
      alert('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Jam Pelajaran</h1>
        <p style={{ color: 'var(--text-muted)' }}>Atur mapping Jam ke- (periode) ke waktu mulai dan selesai yang sebenarnya.</p>
      </div>

      {/* Form */}
      <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--primary)', marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} style={{ color: 'var(--primary)' }} />
          {editingId ? 'Edit Jam Pelajaran' : 'Tambah Jam Pelajaran'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 120px', minWidth: '100px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Jam ke-</label>
              <input
                type="number"
                className="input"
                min="1"
                max="20"
                value={form.jamKe}
                onChange={(e) => setForm({ ...form, jamKe: e.target.value })}
                placeholder="1"
                required
              />
            </div>
            <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Mulai</label>
              <input
                type="time"
                className="input"
                value={form.mulai}
                onChange={(e) => setForm({ ...form, mulai: e.target.value })}
                required
              />
            </div>
            <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Selesai</label>
              <input
                type="time"
                className="input"
                value={form.selesai}
                onChange={(e) => setForm({ ...form, selesai: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Simpan
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                <X size={16} /> Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-hover)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', width: '60px' }}>No</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', width: '100px' }}>Jam ke-</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Mulai</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Selesai</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right', width: '120px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {jamPelajaran.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Belum ada data jam pelajaran. Silakan tambahkan.
                </td>
              </tr>
            ) : (
              jamPelajaran.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--primary)' }}>Jam ke-{item.jamKe}</td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{item.mulai}</td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{item.selesai}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem', color: 'var(--info)' }}
                        title="Edit"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem', color: 'var(--danger)' }}
                        title="Hapus"
                        onClick={() => {
                          if (window.confirm('Yakin ingin menghapus jam pelajaran ini?')) {
                            deleteJamPelajaran(item.id).then(() => fetchJamPelajaran());
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JamPelajaranScreen;
