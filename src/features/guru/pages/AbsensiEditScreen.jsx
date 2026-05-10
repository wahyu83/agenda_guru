import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const AbsensiEditScreen = () => {
  const { absensiId } = useParams();
  const navigate = useNavigate();
  const { fetchDetailAbsensi, updateAbsensi } = useAppStore();
  
  const [absensiHeader, setAbsensiHeader] = useState(null);
  const [siswa, setSiswa] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const data = await fetchDetailAbsensi(absensiId);
        setAbsensiHeader(data);
        
        // Format for UI
        const formatted = data.siswaDetail.map(detail => ({
          id: detail.id, // This is the AbsensiSiswa ID!
          siswaId: detail.siswa.id,
          nama: detail.siswa.nama,
          nis: detail.siswa.nis,
          status: detail.status
        }));
        setSiswa(formatted);
      } catch (err) {
        alert('Gagal memuat detail absensi');
        navigate('/guru/riwayat');
      }
    };
    loadDetail();
  }, [absensiId, fetchDetailAbsensi, navigate]);

  const updateStatus = (id, newStatus) => {
    setSiswa(siswa.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAbsensi(absensiId, { dataAbsensi: siswa });
      alert('Perubahan absensi berhasil disimpan!');
      navigate('/guru/riwayat');
    } catch (error) {
      alert('Gagal menyimpan perubahan absensi.');
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

  if (!absensiHeader) return <div className="p-4 text-center text-muted">Memuat data...</div>;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header specific to inner page */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/guru/riwayat')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Edit Absensi</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {absensiHeader.pengampu?.kelas?.nama} - {absensiHeader.pengampu?.mapel?.nama} | {new Date(absensiHeader.tanggal).toLocaleDateString('id-ID')}
          </p>
        </div>
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
                <h4 style={{ fontWeight: '600', fontSize: '0.875rem' }}>{s.nama}</h4>
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
      
      <div style={{ position: 'fixed', bottom: '70px', right: '1rem', zIndex: 20 }}>
        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex items-center gap-2" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-lg)' }}>
          <Save size={20} /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
};

export default AbsensiEditScreen;
