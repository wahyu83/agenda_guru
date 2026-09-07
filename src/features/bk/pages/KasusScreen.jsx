import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Save, FileWarning } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const STATUS_OPTIONS = [
  { value: 'diproses', label: 'Diproses' },
  { value: 'dilanjutkan', label: 'Dilanjutkan' },
  { value: 'selesai', label: 'Selesai' }
];

const JENIS_OPTIONS = [
  'Bolos', 'Terlambat Berulang', 'Kenakalan', 'Berkelahi', 'Bullying',
  'Narkoba', 'Masalah Keluarga', 'Akademik', 'Lainnya'
];

const KasusScreen = () => {
  const { user, siswa, bkKasus, fetchBkKasus, createBkKasus, updateBkKasus, deleteBkKasus, kelas, fetchMasterData } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    siswaId: '', jenisKasus: 'Kenakalan', kronologi: '', tindakan: '', status: 'diproses', tanggal: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    if (kelas.length === 0 || siswa.length === 0) {
      fetchMasterData();
    }
    fetchBkKasus();
  }, [fetchBkKasus, fetchMasterData, kelas.length, siswa.length]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ siswaId: '', jenisKasus: 'Kenakalan', kronologi: '', tindakan: '', status: 'diproses', tanggal: new Date().toISOString().slice(0, 10) });
    setShowForm(false);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      siswaId: String(item.siswaId), jenisKasus: item.jenisKasus, kronologi: item.kronologi,
      tindakan: item.tindakan || '', status: item.status, tanggal: item.tanggal?.slice(0, 10) || new Date().toISOString().slice(0, 10)
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.siswaId || !form.kronologi) {
      alert('Siswa dan kronologi wajib diisi.');
      return;
    }
    const payload = {
      siswaId: parseInt(form.siswaId),
      konselorId: user.id,
      jenisKasus: form.jenisKasus,
      kronologi: form.kronologi,
      tindakan: form.tindakan,
      status: form.status,
      tanggal: form.tanggal
    };
    try {
      if (editingId) {
        await updateBkKasus(editingId, payload);
      } else {
        await createBkKasus(payload);
      }
      resetForm();
    } catch (err) {
      alert(err.message);
    }
  };

  const statusColor = (status) => {
    if (status === 'selesai') return 'var(--success)';
    if (status === 'dilanjutkan') return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Kasus Siswa</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Catatan kasus dan penanganan siswa.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setShowForm(true); }}>
          <Plus size={16} /> Tambah
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--primary)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
              <FileWarning size={18} style={{ color: 'var(--primary)', verticalAlign: 'middle', marginRight: '0.5rem' }} />
              {editingId ? 'Edit Kasus' : 'Tambah Kasus'}
            </h2>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="label">Siswa</label>
              <select className="input" value={form.siswaId} onChange={(e) => setForm({ ...form, siswaId: e.target.value })} required>
                <option value="">-- Pilih Siswa --</option>
                {siswa.map((s) => <option key={s.id} value={s.id}>{s.nis} - {s.nama}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Jenis Kasus</label>
                <select className="input" value={form.jenisKasus} onChange={(e) => setForm({ ...form, jenisKasus: e.target.value })}>
                  {JENIS_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tanggal</label>
                <input type="date" className="input" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Kronologi</label>
              <textarea className="input" rows="3" placeholder="Kronologi kejadian..." value={form.kronologi} onChange={(e) => setForm({ ...form, kronologi: e.target.value })} required />
            </div>
            <div>
              <label className="label">Tindakan</label>
              <textarea className="input" rows="2" placeholder="Tindakan penanganan (opsional)..." value={form.tindakan} onChange={(e) => setForm({ ...form, tindakan: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary"><Save size={16} /> Simpan</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {bkKasus.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada kasus tercatat.</p>
        ) : (
          <div className="flex flex-col">
            {bkKasus.map((item) => (
              <div key={item.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <span style={{ fontWeight: '600' }}>{item.siswa?.nama}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.siswa?.nis}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.kelas || '-'}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {new Date(item.tanggal).toLocaleDateString('id-ID')} · {item.jenisKasus}
                    </p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{item.kronologi}</p>
                    {item.tindakan && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        <strong>Tindakan:</strong> {item.tindakan}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1" style={{ flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: `${statusColor(item.status)}20`, color: statusColor(item.status), fontWeight: '600' }}>
                      {STATUS_OPTIONS.find((s) => s.value === item.status)?.label || item.status}
                    </span>
                    <div className="flex gap-1 mt-2">
                      <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--info)' }} onClick={() => handleEdit(item)}><Edit2 size={14} /></button>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => { if (window.confirm('Hapus kasus ini?')) deleteBkKasus(item.id); }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KasusScreen;