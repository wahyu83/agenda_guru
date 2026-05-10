import React from 'react';
import { Users, BookOpen, GraduationCap, CalendarCheck } from 'lucide-react';

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
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Ringkasan sistem Agenda guru SMKN 1 Arahan.</p>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        <StatCard title="Total Guru" value="48" icon={<Users size={28} />} color="var(--primary)" />
        <StatCard title="Total Siswa" value="1,240" icon={<GraduationCap size={28} />} color="var(--secondary)" />
        <StatCard title="Mata Pelajaran" value="24" icon={<BookOpen size={28} />} color="var(--warning)" />
        <StatCard title="Agenda Hari Ini" value="32 Terisi" icon={<CalendarCheck size={28} />} color="var(--info)" />
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
              {[1, 2, 3].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem' }}>10:45 AM</td>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>Budi Santoso, S.Pd</td>
                  <td style={{ padding: '0.75rem' }}>X RPL 1</td>
                  <td style={{ padding: '0.75rem' }}>Pemrograman Dasar</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary-hover)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '600' }}>Tersinkron</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
