import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const NilaiEditScreen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchNilaiSession, updateNilaiBatch, fetchSiswaKelas, siswaKelasAktif, tugasGuru } = useAppStore();

  const pengampuId = searchParams.get('pengampuId');
  const tanggal = searchParams.get('tanggal');
  const jenis = searchParams.get('jenis') || 'tugas';
  const deskripsi = searchParams.get('deskripsi') || '';
  const kelasId = searchParams.get('kelasId');

  const currentTugas = tugasGuru.find(t => t.id === parseInt(pengampuId));

  const [siswa, setSiswa] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (kelasId) {
          await fetchSiswaKelas(parseInt(kelasId));
        }
        const existing = await fetchNilaiSession(pengampuId, tanggal, jenis, deskripsi);
        const existingMap = {};
        (existing || []).forEach(n => { existingMap[n.siswaId] = n; });

        // Wait for siswaKelasAktif to be populated
        const siswaData = await (async () => {
          if (kelasId) {
            const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
            const res = await fetch(`${API_BASE}/guru/siswa-kelas/${kelasId}`);
            return await res.json();
          }
          return [];
        })();

        const formatted = (siswaData || []).map(s => {
          const ex = existingMap[s.id];
          return {
            siswaId: s.id,
            enrollmentId: s.enrollmentId || 0,
            nama: s.nama,
            nis: s.nis,
            nilai: ex ? ex.nilai : '',
          };
        });
        setSiswa(formatted);
      } catch (err) {
        console.error(err);
        alert('Gagal memuat data nilai');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [pengampuId, tanggal, jenis, deskripsi, kelasId, fetchNilaiSession, fetchSiswaKelas]);

  const updateNilai = (siswaId, val) => {
    setSiswa(siswa.map(s => s.siswaId === siswaId ? { ...s, nilai: val } : s));
  };

  const handleSave = async () => {
    const dataNilai = siswa
      .filter(s => s.nilai !== '' && !isNaN(parseFloat(s.nilai)))
      .map(s => ({
        siswaId: s.siswaId,
        enrollmentId: s.enrollmentId,
        jenis,
        nilai: parseFloat(s.nilai),
        tanggal,
        deskripsi,
      }));

    if (dataNilai.length === 0) {
      alert('Tidak ada nilai yang diisi.');
      return;
    }

    setIsSaving(true);
    try {
      await updateNilaiBatch(pengampuId, dataNilai);
      alert('Nilai berhasil disimpan!');
      navigate('/guru/riwayat');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan nilai.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-4 text-center text-muted">Memuat data...</div>;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/guru/riwayat')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Edit Nilai</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {currentTugas ? `${currentTugas.kelas?.nama} - ${currentTugas.mapel?.nama}` : `Tugas ID: ${pengampuId}`}
            {' | '}{new Date(tanggal).toLocaleDateString('id-ID')}
            {' | '}{jenis === 'ulangan' ? 'Ulangan Harian' : 'Tugas'}
            {deskripsi ? ` - ${deskripsi}` : ''}
          </p>
        </div>
      </div>

      <div className="flex gap-2" style={{ padding: '0.5rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jenis:</span>
        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: jenis === 'ulangan' ? 'var(--warning)' : 'var(--info)' }}>
          {jenis === 'ulangan' ? 'Ulangan Harian' : 'Tugas'}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>|</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tanggal:</span>
        <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{new Date(tanggal).toLocaleDateString('id-ID')}</span>
        {deskripsi && (
          <>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>|</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{deskripsi}</span>
          </>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <input type="text" className="input w-full" placeholder="Cari siswa..." style={{ paddingLeft: '2.5rem' }}
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      <div className="flex flex-col gap-2" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
        {siswa.filter(s => s.nama.toLowerCase().includes(search.toLowerCase())).map((s) => (
          <div key={s.siswaId} className="card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{s.nama}</h4>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.nis}</p>
            </div>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="0-100"
              value={s.nilai}
              onChange={(e) => updateNilai(s.siswaId, e.target.value)}
              className="input"
              style={{ width: '80px', textAlign: 'center', padding: '0.5rem', fontSize: '0.875rem' }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', paddingBottom: '5rem' }}>
        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary w-full flex items-center justify-center gap-2"
          style={{ padding: '1rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}>
          <Save size={20} /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
};

export default NilaiEditScreen;
