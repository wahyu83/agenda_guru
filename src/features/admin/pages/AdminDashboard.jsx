import React, { useEffect } from 'react';
import { Users, BookOpen, GraduationCap, CalendarCheck } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const StatCard = ({ title, value, icon, color }) => (
  <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ padding: '1rem', backgroundColor: `${color}20`, color: color, borderRadius: 'var(--radius-lg)' }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>{title}</h3>
      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0.25rem 0' }}>{value}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { guru, siswa, mapel, laporanAgenda, fetchMasterData, fetchLaporanAgenda } = useAppStore();

  useEffect(() => {
    fetchMasterData();
    fetchLaporanAgenda();
  }, [fetchMasterData, fetchLaporanAgenda]);

  const totalGuru = guru.length;
  const totalSiswa = siswa.length;
  const totalMapel = mapel.length;

  const today = new Date().toISOString().split('T')[0];
  const agendaHariIni = laporanAgenda.filter(agenda => {
    const agendaDate = new Date(agenda.tanggal).toISOString().split('T')[0];
    return agendaDate === today;
  }).length;

  const recentAgendas = laporanAgenda.slice(0, 5); // Take top 5

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Ringkasan sistem Agenda guru SMKN 1 Arahan.</p>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        <StatCard title="Total Guru" value={totalGuru} icon={<Users size={28} />} color="var(--primary)" />
        <StatCard title="Total Siswa" value={totalSiswa.toLocaleString('id-ID')} icon={<GraduationCap size={28} />} color="var(--secondary)" />
        <StatCard title="Mata Pelajaran" value={totalMapel} icon={<BookOpen size={28} />} color="var(--warning)" />
        <StatCard title="Agenda Hari Ini" value={`${agendaHariIni} Terisi`} icon={<CalendarCheck size={28} />} color="var(--info)" />
      </div>

      <div className="card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Aktivitas Pengisian Agenda Terbaru</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>Waktu</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>Guru</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>Kelas</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>Mata Pelajaran</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAgendas.length > 0 ? recentAgendas.map((agenda, i) => (
                <tr key={agenda.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem' }}>{formatTime(agenda.last_modified || agenda.tanggal)}</td>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>{agenda.pengampu?.guru?.nama || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{agenda.pengampu?.kelas?.nama || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{agenda.pengampu?.mapel?.nama || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary-hover)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '600' }}>
                      {agenda.status_sync === 'synced' ? 'Tersinkron' : 'Belum Sinkron'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada aktivitas agenda terbaru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
