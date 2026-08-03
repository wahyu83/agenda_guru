import React, { useEffect, useMemo } from 'react';
import { useAppStore } from '../../lib/store';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const PiketScreen = () => {
  const { user, jadwalPiket, jamPelajaran, fetchJadwalPiket, savePiket, fetchJamPelajaran } = useAppStore();

  useEffect(() => {
    fetchJadwalPiket();
    fetchJamPelajaran();
  }, [fetchJadwalPiket, fetchJamPelajaran]);

  const jamMap = useMemo(() => {
    const m = {};
    jamPelajaran.forEach(jp => { m[jp.jamKe] = `${jp.mulai} - ${jp.selesai}`; });
    return m;
  }, [jamPelajaran]);

  const grouped = useMemo(() => {
    const map = {};
    jadwalPiket.forEach(item => {
      const key = item.jamKe;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return Object.entries(map).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  }, [jadwalPiket]);

  const today = new Date();
  const todayName = HARI[today.getDay()];
  const dateStr = `${today.getDate()} ${['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][today.getMonth()]} ${today.getFullYear()}`;

  const handleStatus = async (pengampuId, status) => {
    try {
      await savePiket({
        pengampuId,
        piketById: user.id,
        status,
        catatan: null
      });
      fetchJadwalPiket();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
  };

  if (todayName === 'Sabtu' || todayName === 'Minggu') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: '500' }}>Tidak ada jadwal mengajar hari ini</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Hari {todayName} adalah hari libur</p>
        </div>
      </div>
    );
  }

  if (jadwalPiket.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: '500' }}>Belum ada jadwal mengajar untuk hari ini</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Hubungi admin untuk mengatur jadwal pelajaran</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Pantau Kehadiran Guru</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{todayName}, {dateStr}</p>
      </div>

      {grouped.map(([jamKe, items]) => {
        const waktu = jamMap[parseInt(jamKe)] || `Jam ke-${jamKe}`;
        return (
          <div key={jamKe}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Clock size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--primary)' }}>
                Jam ke-{jamKe} ({waktu})
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map(item => {
                const status = item.piket?.status;
                const isHadir = status === 'hadir';
                const isTidakHadir = status === 'tidak_hadir';
                const isTerlambat = status === 'terlambat';
                const sudahDicek = !!status;

                return (
                  <div key={item.id} className="card" style={{
                    padding: '0.75rem 1rem',
                    borderLeft: `4px solid ${sudahDicek ? (isHadir ? 'var(--secondary)' : isTerlambat ? 'var(--warning)' : 'var(--danger)') : 'var(--border-color)'}`,
                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.mapel}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {item.kelas} &middot; {item.guru}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                      <button
                        onClick={() => handleStatus(item.id, 'hadir')}
                        style={{
                          padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-md)', border: 'none',
                          fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                          backgroundColor: isHadir ? 'var(--secondary)' : 'var(--surface-hover)',
                          color: isHadir ? 'white' : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', gap: '0.25rem'
                        }}
                      >
                        <CheckCircle size={14} /> Hadir
                      </button>
                      <button
                        onClick={() => handleStatus(item.id, 'terlambat')}
                        style={{
                          padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-md)', border: 'none',
                          fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                          backgroundColor: isTerlambat ? 'var(--warning)' : 'var(--surface-hover)',
                          color: isTerlambat ? 'white' : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', gap: '0.25rem'
                        }}
                      >
                        <Clock size={14} /> Terlambat
                      </button>
                      <button
                        onClick={() => handleStatus(item.id, 'tidak_hadir')}
                        style={{
                          padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-md)', border: 'none',
                          fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                          backgroundColor: isTidakHadir ? 'var(--danger)' : 'var(--surface-hover)',
                          color: isTidakHadir ? 'white' : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', gap: '0.25rem'
                        }}
                      >
                        <XCircle size={14} /> Tdk Hadir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PiketScreen;
