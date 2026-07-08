import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Trash2, Edit3, Save, BookOpen } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const RencanaScreen = () => {
  const { tugasId } = useParams();
  const navigate = useNavigate();
  const { tugasGuru, fetchRencanaPertemuan, createRencanaPertemuan, updateRencanaPertemuan, deleteRencanaPertemuan } = useAppStore();

  const currentTugas = tugasGuru.find(t => t.id === parseInt(tugasId));

  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [judul, setJudul] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [langkahLangkah, setLangkahLangkah] = useState('');

  useEffect(() => {
    if (tugasId) {
      loadData();
    }
  }, [tugasId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRencanaPertemuan(parseInt(tugasId));
      setList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setJudul('');
    setTanggal('');
    setLangkahLangkah('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setJudul(item.judul);
    setTanggal(item.tanggal ? new Date(item.tanggal).toISOString().split('T')[0] : '');
    setLangkahLangkah(item.langkahLangkah || '');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!judul.trim()) {
      alert('Judul pertemuan wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        pengampuId: parseInt(tugasId),
        judul: judul.trim(),
        langkahLangkah: langkahLangkah.trim(),
        tanggal: tanggal || null
      };

      if (editingId) {
        await updateRencanaPertemuan(editingId, payload);
        alert('Rencana pertemuan berhasil diupdate!');
      } else {
        await createRencanaPertemuan(payload);
        alert('Rencana pertemuan berhasil disimpan!');
      }
      resetForm();
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan rencana pertemuan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus rencana pertemuan ini?')) {
      try {
        await deleteRencanaPertemuan(id);
        loadData();
      } catch (err) {
        alert('Gagal menghapus rencana pertemuan');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/guru')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Rencana Pertemuan</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {currentTugas ? `${currentTugas.kelas?.nama} - ${currentTugas.mapel?.nama}` : 'Memuat data...'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => navigate(`/guru/agenda/${tugasId}`)}
          style={{ flex: '1 0 auto', padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}
        >
          Agenda
        </button>
        <button
          onClick={() => navigate(`/guru/absensi/${tugasId}`)}
          style={{ flex: '1 0 auto', padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}
        >
          Absensi
        </button>
        <button
          onClick={() => navigate(`/guru/nilai/${tugasId}`)}
          style={{ flex: '1 0 auto', padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}
        >
          Nilai
        </button>
        <button
          style={{ flex: '1 0 auto', padding: '0.75rem', border: 'none', background: 'none', borderBottom: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: '600', whiteSpace: 'nowrap' }}
        >
          Rencana
        </button>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} /> {showForm ? 'Tutup Form' : 'Tambah Rencana'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ padding: '1rem' }}>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="label">Judul Pertemuan</label>
              <input
                type="text"
                className="input"
                placeholder="Contoh: Pertemuan 1 - Pendahuluan"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Tanggal Rencana (Opsional)</label>
              <input
                type="date"
                className="input"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Langkah-langkah Pembelajaran</label>
              <textarea
                className="input"
                rows="6"
                placeholder="Tuliskan langkah-langkah pembelajaran secara rinci..."
                value={langkahLangkah}
                onChange={(e) => setLangkahLangkah(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="btn btn-secondary">Batal</button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                <Save size={16} /> {isSaving ? 'Menyimpan...' : (editingId ? 'Update' : 'Simpan')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data...</div>
      ) : list.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
          <p>Belum ada rencana pertemuan.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((item) => (
            <div key={item.id} className="card" style={{ padding: '1rem' }}>
              <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--primary)' }}>
                    {item.judul}
                  </h3>
                  {item.tanggal && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Tanggal: {formatDate(item.tanggal)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2" style={{ flexShrink: 0, marginLeft: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-info hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-danger hover:opacity-80 transition-colors bg-transparent border-none cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {item.langkahLangkah && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: '600' }}>Langkah-langkah:</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-color)', whiteSpace: 'pre-wrap' }}>
                    {item.langkahLangkah}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RencanaScreen;
