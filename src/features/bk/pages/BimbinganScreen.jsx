import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Save, Users } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const BimbinganScreen = () => {
  const { user, siswa, kelas, bkBimbingan, fetchBkBimbingan, createBkBimbingan, updateBkBimbingan, deleteBkBimbingan, fetchMasterData } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [form, setForm] = useState({
    judul: '', topik: '', materi: '', tanggal: new Date().toISOString().slice(0, 10), kelasId: '', pesertaIds: []
  });

  useEffect(() => {
    if (kelas.length === 0 || siswa.length === 0) {
      fetchMasterData();
    }
    fetchBkBimbingan();
  }, [fetchBkBimbingan, fetchMasterData, kelas.length, siswa.length]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ judul: '', topik: '', materi: '', tanggal: new Date().toISOString().slice(0, 10), kelasId: '', pesertaIds: [] });
    setShowForm(false);
  };

  const siswaDiKelas = selectedKelas
    ? siswa.filter((s) => s.enrollment?.some((e) => e.kelasId === parseInt(selectedKelas)))
    : siswa;

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      judul: item.judul,
      topik: item.topik,
      materi: item.materi || '',
      tanggal: item.tanggal?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      kelasId: item.kelasId ? String(item.kelasId) : '',
      pesertaIds: (item.peserta || []).map((p) => p.siswaId)
    });
    setSelectedKelas(item.kelasId ? String(item.kelasId) : '');
    setShowForm(true);
  };

  const handleTogglePeserta = (id) => {
    setForm((f) => ({
      ...f,
      pesertaIds: f.pesertaIds.includes(id) ? f.pesertaIds.filter((p) => p !== id) : [...f.pesertaIds, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul || !form.topik || !form.tanggal) {
      alert('Judul, topik, dan tanggal wajib diisi.');
      return;
    }
    const payload = {
      konselorId: user.id,
      judul: form.judul,
      topik: form.topik,
      materi: form.materi,
      tanggal: form.tanggal,
      kelasId: form.kelasId || null,
      pesertaIds: form.pesertaIds
    };
    try {
      if (editingId) {
        await updateBkBimbingan(editingId, payload);
      } else {
        await createBkBimbingan(payload);
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Bimbingan Kelompok</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Bimbingan klasikal / kelompok untuk siswa.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setSelectedKelas(''); setShowForm(true); }}>
          <Plus size={16} /> Tambah
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--warning)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
              <Users size={18} style={{ color: 'var(--warning)', verticalAlign: 'middle', marginRight: '0.5rem' }} />
              {editingId ? 'Edit Bimbingan' : 'Tambah Bimbingan'}
            </h2>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Judul Kegiatan</label>
                <input type="text" className="input" placeholder="Judul bimbingan" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} required />
              </div>
              <div>
                <label className="label">Tanggal</label>
                <input type="date" className="input" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Topik</label>
              <input type="text" className="input" placeholder="Topik bimbingan" value={form.topik} onChange={(e) => setForm({ ...form, topik: e.target.value })} required />
            </div>
            <div>
              <label className="label">Materi</label>
              <textarea className="input" rows="3" placeholder="Materi bimbingan (opsional)..." value={form.materi} onChange={(e) => setForm({ ...form, materi: e.target.value })} />
            </div>
            <div>
              <label className="label">Filter Kelas</label>
              <select className="input" value={selectedKelas} onChange={(e) => { setSelectedKelas(e.target.value); setForm((f) => ({ ...f, pesertaIds: [] })); }}>
                <option value="">Semua Siswa</option>
                {kelas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
            {siswaDiKelas.length > 0 && (
              <div>
                <label className="label">Peserta ({form.pesertaIds.length} terpilih)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  {siswaDiKelas.map((s) => {
                    const checked = form.pesertaIds.includes(s.id);
                    return (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={checked} onChange={() => handleTogglePeserta(s.id)} />
                        {s.nama}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary"><Save size={16} /> Simpan</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {bkBimbingan.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada bimbingan tercatat.</p>
        ) : (
          <div className="flex flex-col">
            {bkBimbingan.map((item) => (
              <div key={item.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <span style={{ fontWeight: '600' }}>{item.judul}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.kelas?.nama || 'Umum'}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {new Date(item.tanggal).toLocaleDateString('id-ID')} · {item.topik}
                    </p>
                    {item.materi && <p style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>{item.materi}</p>}
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      <Users size={12} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                      {item.peserta?.length || 0} peserta
                    </p>
                  </div>
                  <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--info)' }} onClick={() => handleEdit(item)}><Edit2 size={14} /></button>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => { if (window.confirm('Hapus bimbingan ini?')) deleteBkBimbingan(item.id); }}><Trash2 size={14} /></button>
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

export default BimbinganScreen;