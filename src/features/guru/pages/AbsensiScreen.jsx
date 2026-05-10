import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const AbsensiScreen = () => {
  const { tugasId } = useParams();
  const navigate = useNavigate();
  const { tugasGuru, siswaKelasAktif, fetchSiswaKelas, saveAbsensiOnline } = useAppStore();
  
  const currentTugas = tugasGuru.find(t => t.id === parseInt(tugasId));
  
  const [siswa, setSiswa] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (currentTugas?.kelasId) {
      fetchSiswaKelas(currentTugas.kelasId);
    }
  }, [currentTugas, fetchSiswaKelas]);

  useEffect(() => {
    if (siswaKelasAktif.length > 0) {
      const formatted = siswaKelasAktif.map(s => ({
        id: s.id,
        nama: s.nama,
        nis: s.nis,
        status: 'Hadir' // Default status
      }));
      setSiswa(formatted);
    }
  }, [siswaKelasAktif]);

  const updateStatus = (id, newStatus) => {
    setSiswa(siswa.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAbsensiOnline({
        pengampuId: parseInt(tugasId),
        tanggal: tanggal,
        dataAbsensi: siswa
      });
      alert('Absensi berhasil disimpan!');
      navigate('/guru');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan absensi.');
    } finally {
      setIsSaving(false);
    }
  };

  const statusColors = {
    'Hadir': { bg: 'var(--success)', text: 'white' },
    'Sakit': { bg: 'var(--info)', text: 'white' },
    'Izin': { bg: 'var(--warning)', text: 'white' },
    'Alpa': { bg: 'var(--danger)', text: 'white' },
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header specific to inner page */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/guru')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Isi Absensi</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {currentTugas ? `${currentTugas.kelas?.nama} - ${currentTugas.mapel?.nama}` : 'Memuat data...'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
        <button 
          onClick={() => navigate(`/guru/agenda/${tugasId}`)}
          style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500' }}
        >
          Agenda
        </button>
        <button 
          style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', borderBottom: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: '600' }}
        >
          Absensi
        </button>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Tanggal Pertemuan</label>
        <input 
          type="date" 
          className="input w-full" 
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          required 
        />
      </div>

      <div style={{ position: 'relative' }}>
        <input 
          type="text" 
          className="input w-full" 
          placeholder="Cari siswa..." 
          style={{ paddingLeft: '2.5rem' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      <div className="flex flex-col gap-3" style={{ paddingBottom: '2rem' }}>
        {siswa.filter(s => s.nama.toLowerCase().includes(search.toLowerCase())).map((s) => (
          <div key={s.id} className="card" style={{ padding: '1rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
              <div>
                <h4 style={{ fontWeight: '600', fontSize: '0.875rem' }}>{s.nama || s.kelas}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIS: {s.nis}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['Hadir', 'Sakit', 'Izin', 'Alpa'].map(status => (
                <button
                  key={status}
                  onClick={() => updateStatus(s.id, status)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0',
                    border: '1px solid',
                    borderColor: s.status === status ? statusColors[status].bg : 'var(--border-color)',
                    backgroundColor: s.status === status ? statusColors[status].bg : 'transparent',
                    color: s.status === status ? statusColors[status].text : 'var(--text-muted)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.75rem',
                    fontWeight: s.status === status ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', display: 'flex', justifyContent: 'flex-end', padding: '0 1rem', pointerEvents: 'none', zIndex: 30 }}>
        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary" style={{ pointerEvents: 'auto', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-lg)' }}>
          <Save size={20} /> {isSaving ? 'Menyimpan...' : 'Simpan Absensi'}
        </button>
      </div>
    </div>
  );
};

export default AbsensiScreen;
