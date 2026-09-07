import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Save, MessagesSquare } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const KonselingScreen = () => {
  const { user, siswa, bkKonseling, fetchBkKonseling, createBkKonseling, updateBkKonseling, deleteBkKonseling, kelas, fetchMasterData } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    siswaId: '', topik: '', catatan: '', tindakLanjut: '', tanggal: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    if (kelas.length === 0 || siswa.length === 0) {
      fetchMasterData();
    }
    fetchBkKonseling();
  }, [fetchBkKonseling, fetchMasterData, kelas.length, siswa.length]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ siswaId: '', topik: '', catatan: '', tindakLanjut: '', tanggal: new Date().toISOString().slice(0, 10) });
    setShowForm(false);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      siswaId: String(item.siswaId), topik: item.topik, catatan: item.catatan,
      tindakLanjut: item.tindakLanjut || '', tanggal: item.tanggal?.slice(0, 10) || new Date().toISOString().slice(0, 10)
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.siswaId || !form.topik || !form.catatan) {
      alert('Siswa, topik, dan catatan wajib diisi.');
      return;
    }
    const payload = {
      siswaId: parseInt(form.siswaId),
      konselorId: user.id,
      topik: form.topik,
      catatan: form.catatan,
      tindakLanjut: form.tindakLanjut,
      tanggal: form.tanggal
    };
    try {
      if (editingId) {
        await updateBkKonseling(editingId, payload);
      } else {
        await createBkKonseling(payload);
      }
      resetForm();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Konseling</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sesi bimbingan konseling individu.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setShowForm(true); }}>
          <Plus size={16} /> Tambah
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--info)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
              <MessagesSquare size={18} style={{ color: 'var(--info)', verticalAlign: 'middle', marginRight: '0.5rem' }} />
              {editingId ? 'Edit Konseling' : 'Tambah Konseling'}
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
                <label className="label">Topik</label>
                <input type="text" className="input" placeholder="Topik konseling" value={form.topik} onChange={(e) => setForm({ ...form, topik: e.target.value })} required />
              </div>
              <div>
                <label className="label">Tanggal</label>
                <input type="date" className="input" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Catatan</label>
              <textarea className="input" rows="4" placeholder="Catatan sesi konseling..." value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} required />
            </div>
            <div>
              <label className="label">Tindak Lanjut</label>
              <textarea className="input" rows="2" placeholder="Tindak lanjut (opsional)..." value={form.tindakLanjut} onChange={(e) => setForm({ ...form, tindakLanjut: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary"><Save size={16} /> Simpan</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {bkKonseling.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada sesi konseling tercatat.</p>
        ) : (
          <div className="flex flex-col">
            {bkKonseling.map((item) => (
              <div key={item.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <span style={{ fontWeight: '600' }}>{item.siswa?.nama}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.siswa?.nis}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.kelas || '-'}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {new Date(item.tanggal).toLocaleDateString('id-ID')} · {item.topik}
                    </p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{item.catatan}</p>
                    {item.tindakLanjut && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        <strong>Tindak lanjut:</strong> {item.tindakLanjut}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--info)' }} onClick={() => handleEdit(item)}><Edit2 size={14} /></button>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => { if (window.confirm('Hapus sesi konseling ini?')) deleteBkKonseling(item.id); }}><Trash2 size={14} /></button>
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

export default KonselingScreen;