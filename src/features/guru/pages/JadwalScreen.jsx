import React, { useEffect, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const JAM = Array.from({ length: 10 }, (_, i) => i + 1);

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const JadwalScreen = () => {
  const { user, jadwalGuru, fetchJadwalGuru } = useAppStore();

  useEffect(() => {
    if (user?.id) {
      fetchJadwalGuru(user.id);
    }
  }, [user, fetchJadwalGuru]);

  const today = new Date();
  const dayIdx = today.getDay();
  const todayName = dayIdx === 0 ? null : HARI[dayIdx - 1];
  const dateStr = `${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;

  const { scheduleMap, rowspans } = useMemo(() => {
    const map = {};
    const spans = {};
    jadwalGuru.forEach((item) => {
      const sampai = item.jamSampai || item.jamKe;
      const rowspan = sampai - item.jamKe + 1;
      const key = `${item.hari}-${item.jamKe}`;
      if (!map[key]) map[key] = [];
      map[key].push({ ...item, _rowspan: rowspan });

      for (let j = item.jamKe + 1; j <= sampai; j++) {
        spans[`${item.hari}-${j}`] = true;
      }
    });
    return { scheduleMap: map, rowspans: spans };
  }, [jadwalGuru]);

  const sudahDiisi = jadwalGuru.filter((j) => j.agendaHariIni).length;
  const totalJadwal = jadwalGuru.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, var(--primary), #7C3AED)' }}>
        <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
          <Calendar size={14} />
          <span>{dateStr}</span>
        </div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'white' }}>Jadwal Mengajar</h1>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', color: 'white' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{totalJadwal}</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Mapel</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', color: 'white' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{Object.keys(scheduleMap).length}</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Slot Terisi</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', color: 'white' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{sudahDiisi}</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Terisi Hari Ini</div>
          </div>
        </div>
      </div>

      {jadwalGuru.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Calendar size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
          <p>Belum ada jadwal mengajar yang ditugaskan.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--primary-light)' }}>
                  <th style={{ padding: '0.6rem 0.5rem', color: 'var(--primary)', fontWeight: '600', borderBottom: '2px solid var(--primary)', width: '50px', fontSize: '0.7rem' }}>Jam</th>
                  {HARI.map((hari) => (
                    <th
                      key={hari}
                      style={{
                        padding: '0.6rem 0.25rem',
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        borderBottom: '2px solid var(--primary)',
                        color: hari === todayName ? 'white' : 'var(--primary)',
                        backgroundColor: hari === todayName ? 'var(--primary)' : 'transparent',
                        borderRadius: hari === todayName ? 'var(--radius-sm) var(--radius-sm) 0 0' : 0
                      }}
                    >
                      {hari}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {JAM.map((jam) => (
                  <tr key={jam} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.4rem', fontWeight: '600', color: 'var(--primary)', fontSize: '0.75rem', verticalAlign: 'top', backgroundColor: 'var(--primary-light)' }}>
                      {jam}
                    </td>
                    {HARI.map((hari) => {
                      const cellKey = `${hari}-${jam}`;
                      const isConsumed = rowspans[cellKey];

                      if (isConsumed) {
                        return <td key={hari} />;
                      }

                      const items = scheduleMap[cellKey] || [];
                      const item = items[0];

                      if (!item) {
                        return <td key={hari} />;
                      }

                      return (
                        <td
                          key={hari}
                          rowSpan={item._rowspan}
                          style={{
                            verticalAlign: 'middle',
                            padding: 0,
                            background: item.agendaHariIni
                              ? 'var(--secondary-light)'
                              : 'var(--primary-light)',
                          }}
                        >
                          <div
                            style={{
                              padding: '0.4rem 0.3rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: item.agendaHariIni ? 'var(--secondary)' : 'var(--primary)',
                              textAlign: 'center',
                            }}
                          >
                            {item.kelas?.nama}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JadwalScreen;
