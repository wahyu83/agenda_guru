import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import { JENIS_OPTIONS, bobotForMapel } from '../../../lib/nilai';

const NilaiScreen = () => {
  const { tugasId } = useParams();
  const navigate = useNavigate();
  const { user, tugasGuru, siswaKelasAktif, fetchSiswaKelas, saveNilai, bobotNilai, fetchBobotNilai, saveBobotNilai } = useAppStore();

  const currentTugas = tugasGuru.find(t => t.id === parseInt(tugasId));

  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];
  const minDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [siswa, setSiswa] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [tanggal, setTanggal] = useState(maxDate);
  const [jenis, setJenis] = useState('tugas');
  const [deskripsi, setDeskripsi] = useState('');
  const [showBobot, setShowBobot] = useState(false);
  const [bobotOverride, setBobotOverride] = useState(null);
  const [savingBobot, setSavingBobot] = useState(false);

  useEffect(() => {
    if (currentTugas?.kelasId) {
      fetchSiswaKelas(currentTugas.kelasId);
    }
  }, [currentTugas, fetchSiswaKelas]);

  useEffect(() => {
    if (user?.id) fetchBobotNilai(user.id);
  }, [user, fetchBobotNilai]);

  const bobot = bobotOverride ?? bobotForMapel(bobotNilai, currentTugas?.mapel?.id);
  const totalBobot = Object.values(bobot).reduce((a, b) => a + (parseInt(b) || 0), 0);

  const handleSaveBobot = async () => {
    if (!user?.id || !currentTugas?.mapel?.id) return;
    setSavingBobot(true);
    try {
      await saveBobotNilai({
        guruId: user.id,
        mapelId: currentTugas.mapel.id,
        bobotTugas: parseInt(bobot.tugas) || 0,
        bobotUlangan: parseInt(bobot.ulangan) || 0,
        bobotMid: parseInt(bobot.mid) || 0,
        bobotSemester: parseInt(bobot.semester) || 0,
      });
      setBobotOverride(null);
      alert('Bobot nilai berhasil disimpan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan bobot nilai.');
    } finally {
      setSavingBobot(false);
    }
  };

  useEffect(() => {
    if (siswaKelasAktif.length > 0) {
      const formatted = siswaKelasAktif.map(s => ({
        id: null,
        siswaId: s.id,
        enrollmentId: s.enrollmentId || 0,
        nama: s.nama,
        nis: s.nis,
        nilai: '',
      }));
      setSiswa(formatted);
    }
  }, [siswaKelasAktif]);

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
      await saveNilai(parseInt(tugasId), dataNilai);
      alert('Nilai berhasil disimpan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan nilai.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/guru')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Input Nilai</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {currentTugas ? `${currentTugas.kelas?.nama} - ${currentTugas.mapel?.nama}` : 'Memuat data...'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem', overflowX: 'auto' }}>
        <button onClick={() => navigate(`/guru/agenda/${tugasId}`)} style={{ flex: '1 0 auto', padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>
          Agenda
        </button>
        <button onClick={() => navigate(`/guru/absensi/${tugasId}`)} style={{ flex: '1 0 auto', padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>
          Absensi
        </button>
        <button style={{ flex: '1 0 auto', padding: '0.75rem', border: 'none', background: 'none', borderBottom: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
          Nilai
        </button>
        <button onClick={() => navigate(`/guru/rencana/${tugasId}`)} style={{ flex: '1 0 auto', padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>
          Rencana
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Tanggal</label>
            <input type="date" className="input w-full" value={tanggal} min={minDate} max={maxDate} onChange={(e) => setTanggal(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Jenis</label>
            <select className="input w-full" value={jenis} onChange={(e) => setJenis(e.target.value)}>
              {JENIS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Deskripsi (Judul Tugas/Ulangan/Mid/Semester)</label>
          <input type="text" className="input w-full" placeholder="Contoh: Bab 3 - Trigonometri" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
        </div>

        <div className="card" style={{ padding: '0.75rem' }}>
          <button type="button" onClick={() => setShowBobot(!showBobot)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>Bobot Penilaian (mapel ini)</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{showBobot ? 'Tutup' : 'Atur'}</span>
          </button>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Berlaku untuk semua kelas yang Anda ampu pada mapel ini. Total saat ini: <b style={{ color: totalBobot === 100 ? 'var(--secondary)' : 'var(--warning)' }}>{totalBobot}%</b>
          </p>
          {showBobot && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {JENIS_OPTIONS.map((o) => (
                <div key={o.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ flex: 1, fontSize: '0.8rem' }}>{o.label}</label>
                  <input
                    type="number" min="0" max="100" className="input"
                    value={bobot[o.value]}
                    onChange={(e) => setBobotOverride({ ...bobot, [o.value]: e.target.value })}
                    style={{ width: '80px', textAlign: 'center', padding: '0.4rem', fontSize: '0.8rem' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>%</span>
                </div>
              ))}
              {totalBobot !== 100 && (
                <p style={{ fontSize: '0.7rem', color: 'var(--warning)' }}>Catatan: total bobot sebaiknya 100%.</p>
              )}
              <button type="button" onClick={handleSaveBobot} disabled={savingBobot} className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
                {savingBobot ? 'Menyimpan...' : 'Simpan Bobot'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <input type="text" className="input w-full" placeholder="Cari siswa..." style={{ paddingLeft: '2.5rem' }}
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      <div className="flex flex-col gap-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {siswa.filter(s => s.nama.toLowerCase().includes(search.toLowerCase())).map((s) => (
          <div key={s.siswaId} className="card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontWeight: '600', fontSize: '0.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nama}</h4>
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
        {siswa.length === 0 && (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada siswa terdaftar di kelas ini.</div>
        )}
      </div>

      <div className="flex gap-2" style={{ marginTop: '1rem', paddingBottom: '4rem' }}>
        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex-1" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
          <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Nilai'}
        </button>
      </div>
    </div>
  );
};

export default NilaiScreen;
