import React, { useEffect, useState } from 'react';
import { FileWarning, MessagesSquare, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const StatCard = ({ title, value, icon, color }) => (
  <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <div style={{ padding: '0.75rem', backgroundColor: `${color}20`, color, borderRadius: 'var(--radius-md)' }}>{icon}</div>
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>{title}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{value}</p>
    </div>
  </div>
);

const BkDashboard = () => {
  const { user, bkRekap, fetchBkRekap } = useAppStore();
  const [bulan, setBulan] = useState('');

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetchBkRekap(bulan);
  }, [bulan, fetchBkRekap]);

  const statusLabels = { diproses: 'Diproses', dilanjutkan: 'Dilanjutkan', selesai: 'Selesai' };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Dashboard BK</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Selamat datang, {user?.nama} — ringkasan Bimbingan Konseling.
          </p>
        </div>
        <select className="input" style={{ width: 'auto', fontSize: '0.875rem' }} value={bulan} onChange={(e) => setBulan(e.target.value)}>
          <option value="">Semua Bulan</option>
          <option value={currentMonth}>{MONTHS[parseInt(currentMonth.slice(5)) - 1]} {currentMonth.slice(0, 4)}</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        <StatCard title="Kasus Aktif" value={bkRekap?.kasusAktif ?? 0} icon={<FileWarning size={20} />} color="var(--danger)" />
        <StatCard title="Kasus Selesai" value={bkRekap?.kasusSelesai ?? 0} icon={<CheckCircle2 size={20} />} color="var(--success)" />
        <StatCard title="Sesi Konseling" value={bkRekap?.totalKonseling ?? 0} icon={<MessagesSquare size={20} />} color="var(--info)" />
        <StatCard title="Bimbingan & Peserta" value={`${bkRekap?.totalBimbingan ?? 0} / ${bkRekap?.totalPeserta ?? 0}`} icon={<Users size={20} />} color="var(--warning)" />
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Kasus per Status</h3>
        {bkRekap?.kasusPerStatus && Object.keys(bkRekap.kasusPerStatus).length > 0 ? (
          <div className="flex flex-col gap-2">
            {Object.entries(bkRekap.kasusPerStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center" style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{statusLabels[status] || status}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Belum ada data kasus.</p>
        )}
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Kasus per Kelas</h3>
        {bkRekap?.kasusPerKelas && Object.keys(bkRekap.kasusPerKelas).length > 0 ? (
          <div className="flex flex-col gap-2">
            {Object.entries(bkRekap.kasusPerKelas).map(([kelas, count]) => (
              <div key={kelas} className="flex justify-between items-center" style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{kelas}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{count} kasus</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Belum ada data kasus per kelas.</p>
        )}
      </div>

      <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--info)15', border: '1px solid var(--info)30' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={14} style={{ color: 'var(--info)' }} />
          Data e-statistik dihitung dari seluruh catatan konseling, kasus, dan bimbingan yang tercatat.
        </p>
      </div>
    </div>
  );
};

export default BkDashboard;