import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Save, CheckSquare } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const AgendaScreen = () => {
  const { tugasId } = useParams();
  const navigate = useNavigate();
  const { tugasGuru, saveAgendaOnline } = useAppStore();
  
  const currentTugas = tugasGuru.find(t => t.id === parseInt(tugasId));

  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [materi, setMateri] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!materi || !deskripsi) {
      alert('Materi dan deskripsi wajib diisi!');
      return;
    }
    
    setIsSaving(true);
    try {
      await saveAgendaOnline({
        pengampuId: parseInt(tugasId),
        tanggal,
        materi,
        deskripsi,
        catatan
      });
      alert('Agenda berhasil disimpan!');
      navigate('/guru');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan agenda.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header specific to inner page */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/guru')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Isi Agenda</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {currentTugas ? `${currentTugas.kelas?.nama} - ${currentTugas.mapel?.nama}` : 'Memuat data tugas...'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
        <button 
          style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', borderBottom: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: '600' }}
        >
          Agenda
        </button>
        <button 
          onClick={() => navigate(`/guru/absensi/${tugasId}`)}
          style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500' }}
        >
          Absensi
        </button>
        <button 
          onClick={() => navigate(`/guru/nilai/${tugasId}`)}
          style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500' }}
        >
          Nilai
        </button>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <form className="flex flex-col gap-4" onSubmit={handleSave}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              <Calendar size={16} /> Tanggal
            </label>
            <input 
              type="date" 
              className="input" 
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Materi Pokok</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Masukkan materi yang diajarkan" 
              value={materi}
              onChange={(e) => setMateri(e.target.value)}
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Deskripsi / Kegiatan</label>
            <textarea 
              className="input" 
              rows="4" 
              placeholder="Jelaskan detail kegiatan belajar mengajar" 
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              required
            ></textarea>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Catatan Tambahan (Opsional)</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Catatan khusus" 
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.75rem' }} disabled={isSaving}>
            <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Agenda'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgendaScreen;
