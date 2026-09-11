import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, RefreshCw, QrCode, Users, CheckCircle2, Clock, AlertTriangle, Trash2, ExternalLink } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const KARTU_PER_HALAMAN = 8;

const printCss = `
@media print {
  @page { size: A4 portrait; margin: 8mm; }
  html, body { background: #fff !important; }
  .admin-sidebar, .admin-header, .no-print, .bottom-nav, .mobile-header { display: none !important; }
  .admin-layout { display: block !important; height: auto !important; overflow: visible !important; }
  .admin-main { overflow: visible !important; }
  .admin-content { overflow: visible !important; padding: 0 !important; }
  .kartu-print-area, .kartu-print-area * { visibility: visible !important; }
  .kartu-print-area {
    padding: 0 !important;
    margin: 0 !important;
    background: #fff !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    overflow: visible !important;
  }
  .kartu-page {
    box-shadow: none !important;
    margin: 0 auto !important;
    border: none !important;
    page-break-after: always;
    break-after: page;
  }
  .kartu-page:last-child { page-break-after: auto; break-after: auto; }
}
.kartu-page {
  width: 194mm;
  height: 277mm;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(4, 1fr);
  gap: 3mm;
  margin: 0 auto 12px auto;
  background: #fff;
  box-sizing: border-box;
}
.kartu-siswa {
  border: 0.4mm solid #333;
  border-radius: 2mm;
  padding: 3mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  box-sizing: border-box;
}
.kartu-header { display: flex; align-items: center; justify-content: center; gap: 1.5mm; margin-bottom: 0.5mm; }
.kartu-logo { width: 7mm; height: 7mm; object-fit: contain; flex-shrink: 0; }
.kartu-school { font-size: 2.6mm; font-weight: 700; text-transform: uppercase; color: #333; letter-spacing: 0.2mm; }
.kartu-label { font-size: 2.2mm; color: #777; margin-bottom: 1mm; }
.kartu-qr { width: 34mm; height: 34mm; margin: 1mm 0; }
.kartu-nama { font-size: 3.8mm; font-weight: 700; line-height: 1.15; }
.kartu-meta { font-size: 2.8mm; color: #555; margin-top: 0.5mm; }
`;

const AbsensiQrScreen = () => {
  const {
    kelas, settings, kartuSiswa, absensiHarian, absensiHarianRekap,
    fetchMasterData, fetchKartuSiswa, fetchAbsensiHarian, fetchAbsensiHarianRekap, deleteAbsensiHarian
  } = useAppStore();
  const [selectedKelas, setSelectedKelas] = useState('');
  const [qrMap, setQrMap] = useState({});
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    if (kelas.length === 0) fetchMasterData();
  }, [fetchMasterData, kelas.length]);

  useEffect(() => {
    fetchKartuSiswa(selectedKelas);
  }, [selectedKelas, fetchKartuSiswa]);

  useEffect(() => {
    fetchAbsensiHarian(selectedKelas ? { kelasId: selectedKelas } : {});
    fetchAbsensiHarianRekap();
  }, [selectedKelas, fetchAbsensiHarian, fetchAbsensiHarianRekap]);

  // Generate QR data URL untuk tiap siswa
  useEffect(() => {
    let cancelled = false;
    const gen = async () => {
      setLoadingQr(true);
      const map = {};
      for (const s of kartuSiswa) {
        if (s.qrToken) {
          try {
            map[s.id] = await QRCode.toDataURL(s.qrToken, { width: 256, margin: 1 });
          } catch {
            // abaikan
          }
        }
      }
      if (!cancelled) { setQrMap(map); setLoadingQr(false); }
    };
    gen();
    return () => { cancelled = true; };
  }, [kartuSiswa]);

  const pages = useMemo(() => {
    const out = [];
    for (let i = 0; i < kartuSiswa.length; i += KARTU_PER_HALAMAN) {
      out.push(kartuSiswa.slice(i, i + KARTU_PER_HALAMAN));
    }
    return out;
  }, [kartuSiswa]);

  const handlePrint = () => window.print();

  const formatJam = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  };

  const statusColor = (s) => s === 'terlambat' ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="flex flex-col gap-4">
      <style>{printCss}</style>

      <div className="no-print flex flex-col gap-4">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Absensi QR Siswa</h1>
            <p style={{ color: 'var(--text-muted)' }}>Cetak kartu absensi QR (A4, 8 siswa/halaman) dan pantau kehadiran siswa hari ini.</p>
          </div>
          <div className="flex gap-2">
            <a className="btn btn-secondary" href="/scan" target="_blank" rel="noreferrer"><ExternalLink size={16} /> Halaman Scan</a>
            <button className="btn btn-primary" onClick={handlePrint} disabled={kartuSiswa.length === 0}>
              <Printer size={16} /> Cetak Kartu
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Pilih Kelas:</label>
          <select className="input" style={{ width: 'auto', minWidth: '180px' }} value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
            <option value="">Semua Siswa</option>
            {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={() => fetchKartuSiswa(selectedKelas)}><RefreshCw size={16} /> Muat Ulang</button>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <Users size={14} style={{ verticalAlign: 'middle' }} /> {kartuSiswa.length} siswa · {pages.length} halaman
            {loadingQr ? ' · membuat QR...' : ''}
          </span>
        </div>

        {/* Rekap hari ini */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
            <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hadir</p><p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{absensiHarianRekap?.hadir ?? 0}</p></div>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={24} style={{ color: 'var(--warning)' }} />
            <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Terlambat</p><p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{absensiHarianRekap?.terlambat ?? 0}</p></div>
          </div>
          <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
            <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Belum Absen</p><p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{absensiHarianRekap?.belum ?? 0}</p></div>
          </div>
        </div>

        {/* Monitoring hari ini */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Kehadiran Hari Ini ({absensiHarian.length})</h3>
            <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => { fetchAbsensiHarian(selectedKelas ? { kelasId: selectedKelas } : {}); fetchAbsensiHarianRekap(); }}>
              <RefreshCw size={14} />
            </button>
          </div>
          {absensiHarian.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada siswa yang absen hari ini.</p>
          ) : (
            <div className="flex flex-col">
              {absensiHarian.map((a) => (
                <div key={a.id} className="flex justify-between items-center" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{a.nama}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{a.nis} · {a.kelas}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: `${statusColor(a.status)}20`, color: statusColor(a.status), fontWeight: '600' }}>{a.status}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatJam(a.jamMasuk)}</span>
                    <button className="btn btn-secondary" style={{ padding: '0.3rem', color: 'var(--danger)' }} onClick={() => { if (window.confirm(`Hapus absensi ${a.nama}?`)) deleteAbsensiHarian(a.id).then(() => fetchAbsensiHarianRekap()); }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panduan */}
        <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--info)15', border: '1px solid var(--info)30' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <QrCode size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem', color: 'var(--info)' }} />
            Cetak kartu, bagikan ke siswa, lalu buka <strong>Halaman Scan</strong> di perangkat (HP/tablet) yang terhubung kamera untuk mencatat kehadiran secara mandiri.
          </p>
        </div>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginTop: '0.5rem' }}>Pratinjau Kartu</h2>
      </div>

      {/* Area cetak */}
      {kartuSiswa.length === 0 ? (
        <div className="no-print card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Tidak ada siswa untuk kelas ini.
        </div>
      ) : (
        <div className="kartu-print-area" style={{ boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-md)', overflowX: 'auto', padding: '1rem', backgroundColor: 'var(--surface-hover)' }}>
          {pages.map((pageStudents, pi) => (
            <div key={pi} className="kartu-page">
              {pageStudents.map((s) => (
                <div key={s.id} className="kartu-siswa">
                  <div className="kartu-header">
                    {settings?.logoPath && (
                      <img className="kartu-logo" src={settings.logoPath} alt="Logo" />
                    )}
                    <div className="kartu-school">{settings?.namaSekolah || 'SEKOLAH'}</div>
                  </div>
                  <div className="kartu-label">KARTU ABSENSI SISWA</div>
                  {qrMap[s.id] ? (
                    <img className="kartu-qr" src={qrMap[s.id]} alt={`QR ${s.nama}`} />
                  ) : (
                    <div className="kartu-qr" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.3mm dashed #ccc' }}>
                      <QrCode size={40} color="#ccc" />
                    </div>
                  )}
                  <div className="kartu-nama">{s.nama}</div>
                  <div className="kartu-meta">{s.kelas && s.kelas !== '-' ? s.kelas : ''}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AbsensiQrScreen;