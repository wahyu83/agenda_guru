import React, { useEffect, useMemo, useState } from 'react';
import { FileText, FileSpreadsheet, Filter, X, Download, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const todayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const LaporanAbsensi = () => {
  const { user, settings, kelas, absensiHarianLaporan, fetchAbsensiHarianLaporan, fetchMasterData } = useAppStore();
  const [dariTanggal, setDariTanggal] = useState(todayStr());
  const [sampaiTanggal, setSampaiTanggal] = useState(todayStr());
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [mode, setMode] = useState('siswa'); // 'siswa' (rekap per siswa) | 'detail' (per hari)

  useEffect(() => {
    if (kelas.length === 0) fetchMasterData();
  }, [fetchMasterData, kelas.length]);

  useEffect(() => {
    fetchAbsensiHarianLaporan({
      tanggalDari: dariTanggal,
      tanggalSampai: sampaiTanggal,
      kelasId: selectedKelas,
      status: selectedStatus
    });
  }, [dariTanggal, sampaiTanggal, selectedKelas, selectedStatus, fetchAbsensiHarianLaporan]);

  const rekap = useMemo(() => {
    const hadir = absensiHarianLaporan.filter(a => a.status === 'Hadir').length;
    const terlambat = absensiHarianLaporan.filter(a => a.status === 'Terlambat').length;
    return { hadir, terlambat, total: absensiHarianLaporan.length };
  }, [absensiHarianLaporan]);

  // Rekap per siswa: agregat kehadiran tiap siswa dalam periode
  const rekapSiswa = useMemo(() => {
    const map = new Map();
    absensiHarianLaporan.forEach(a => {
      const key = a.siswaId ?? `${a.nis}-${a.nama}`;
      if (!map.has(key)) {
        map.set(key, { nama: a.nama, nis: a.nis, kelas: a.kelas, hadir: 0, terlambat: 0, total: 0 });
      }
      const s = map.get(key);
      s.total++;
      if (a.status === 'Terlambat') s.terlambat++;
      else s.hadir++;
    });
    return Array.from(map.values()).sort((a, b) => String(a.nama).localeCompare(String(b.nama), 'id', { sensitivity: 'base' }));
  }, [absensiHarianLaporan]);

  const periodeLabel = `(${dariTanggal || '-'} s/d ${sampaiTanggal || '-'})`;
  const kelasLabel = selectedKelas ? ` - ${kelas.find(k => String(k.id) === String(selectedKelas))?.nama || ''}` : '';
  const statusLabel = selectedStatus ? ` - ${selectedStatus === 'terlambat' ? 'Terlambat' : 'Hadir'}` : '';
  const isRekapSiswa = mode === 'siswa';
  const title = isRekapSiswa
    ? `Rekap Kehadiran Per Siswa ${periodeLabel}${kelasLabel}${statusLabel}`
    : `Laporan Absensi Siswa ${periodeLabel}${kelasLabel}${statusLabel}`;
  const filename = `${isRekapSiswa ? 'Rekap_Absensi_Per_Siswa' : 'Laporan_Absensi'}${sampaiTanggal ? '_' + sampaiTanggal : ''}`;

  const columns = isRekapSiswa
    ? [
        { header: 'No', key: 'no' },
        { header: 'Nama', key: 'nama' },
        { header: 'NIS', key: 'nis' },
        { header: 'Kelas', key: 'kelas' },
        { header: 'Hadir', key: 'hadir' },
        { header: 'Terlambat', key: 'terlambat' },
        { header: 'Total', key: 'total' },
        { header: '% Hadir', key: 'persen' }
      ]
    : [
        { header: 'No', key: 'no' },
        { header: 'Tanggal', key: 'tanggal' },
        { header: 'Nama', key: 'nama' },
        { header: 'NIS', key: 'nis' },
        { header: 'Kelas', key: 'kelas' },
        { header: 'Status', key: 'status' },
        { header: 'Jam Masuk', key: 'jamMasuk' },
        { header: 'Jam Pulang', key: 'jamPulang' },
        { header: 'Keterangan', key: 'keterangan' }
      ];

  const rows = isRekapSiswa
    ? rekapSiswa.map((s, i) => ({
        ...s,
        no: i + 1,
        persen: s.total > 0 ? `${Math.round((s.hadir / s.total) * 100)}%` : '0%'
      }))
    : absensiHarianLaporan.map((a, i) => ({ ...a, no: i + 1 }));

  const totalHadir = rekapSiswa.reduce((n, s) => n + s.hadir, 0);
  const totalTerlambat = rekapSiswa.reduce((n, s) => n + s.terlambat, 0);
  const grandTotal = totalHadir + totalTerlambat;
  const footRow = isRekapSiswa
    ? [['TOTAL', '', '', '', String(totalHadir), String(totalTerlambat), String(grandTotal), grandTotal > 0 ? `${Math.round((totalHadir / grandTotal) * 100)}%` : '0%']]
    : [];

  const downloadCSV = () => {
    const csvRows = [];
    csvRows.push([settings.namaSekolah]);
    csvRows.push([settings.alamat]);
    csvRows.push([]);
    csvRows.push([title]);
    csvRows.push([]);
    csvRows.push(columns.map(c => c.header));
    rows.forEach(item => csvRows.push(columns.map(c => item[c.key] !== undefined ? item[c.key] : '')));
    footRow.forEach(r => csvRows.push(r));
    const csv = '\uFEFF' + Papa.unparse(csvRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const loadLogoDataUrl = async () => {
    if (!settings.logoPath) return null;
    try {
      const res = await fetch(settings.logoPath);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const downloadPDF = async () => {
    try {
      const logoDataUrl = await loadLogoDataUrl();
      const doc = new jsPDF('landscape');
      const hasLogo = !!(settings.logoPath && logoDataUrl);
      const textX = hasLogo ? 34 : 148;
      const align = hasLogo ? 'left' : 'center';
      if (hasLogo) {
        try { doc.addImage(logoDataUrl, 'PNG', 14, 8, 16, 16); } catch { /* abaikan */ }
      }
      doc.setFontSize(16);
      doc.text(settings.namaSekolah, textX, 15, { align });
      doc.setFontSize(10);
      doc.text(settings.alamat, textX, 22, { align });
      doc.line(14, 25, 283, 25);
      doc.setFontSize(14);
      doc.text(title, 14, 35);
      doc.setFontSize(9);
      doc.text(`Petugas: ${user?.nama || '-'}`, 14, 42);

      autoTable(doc, {
        startY: 47,
        head: [columns.map(c => c.header)],
        body: rows.map(item => columns.map(c => item[c.key])),
        ...(footRow.length > 0 ? { foot: footRow } : {}),
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [43, 62, 80], fontSize: 8 },
        footStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 }
      });
      doc.save(`${filename}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Gagal export PDF.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Laporan Absensi</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Export rekap kehadiran siswa (PDF &amp; CSV).</p>
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <label style={{ fontSize: '0.8125rem', fontWeight: '500' }}>Periode:</label>
          <input type="date" className="input" style={{ width: 'auto', fontSize: '0.8125rem' }} value={dariTanggal} onChange={(e) => setDariTanggal(e.target.value)} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>s/d</span>
          <input type="date" className="input" style={{ width: 'auto', fontSize: '0.8125rem' }} value={sampaiTanggal} onChange={(e) => setSampaiTanggal(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input" style={{ width: 'auto', minWidth: '140px', fontSize: '0.8125rem' }} value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
            <option value="">Semua Kelas</option>
            {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
          <select className="input" style={{ width: 'auto', minWidth: '130px', fontSize: '0.8125rem' }} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="hadir">Hadir</option>
            <option value="terlambat">Terlambat</option>
          </select>
          {(dariTanggal !== todayStr() || sampaiTanggal !== todayStr() || selectedKelas || selectedStatus) && (
            <button onClick={() => { setDariTanggal(todayStr()); setSampaiTanggal(todayStr()); setSelectedKelas(''); setSelectedStatus(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
              <X size={14} /> Reset
            </button>
          )}
          <button className="btn btn-secondary" style={{ padding: '0.4rem', marginLeft: 'auto' }} onClick={() => fetchAbsensiHarianLaporan({ tanggalDari: dariTanggal, tanggalSampai: sampaiTanggal, kelasId: selectedKelas, status: selectedStatus })}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Ringkasan + export */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
        {/* Pilih jenis laporan */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('siswa')}
            className={isRekapSiswa ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Rekap per Siswa
          </button>
          <button
            onClick={() => setMode('detail')}
            className={!isRekapSiswa ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Detail per Hari
          </button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2" style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: '0.8125rem' }}>Hadir: <strong>{rekap.hadir}</strong></span>
          </div>
          <div className="flex items-center gap-2" style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
            <Clock size={18} style={{ color: 'var(--warning)' }} />
            <span style={{ fontSize: '0.8125rem' }}>Terlambat: <strong>{rekap.terlambat}</strong></span>
          </div>
          <div className="flex items-center gap-2" style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
            <Download size={18} style={{ color: 'var(--info)' }} />
            <span style={{ fontSize: '0.8125rem' }}>Total: <strong>{rekap.total}</strong></span>
          </div>
          {isRekapSiswa && (
            <div className="flex items-center gap-2" style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.8125rem' }}>Jumlah Siswa: <strong>{rekapSiswa.length}</strong></span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#e74c3c' }} onClick={downloadPDF} disabled={rekap.total === 0}>
            <FileText size={16} /> Export PDF
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', color: '#27ae60', borderColor: '#27ae60' }} onClick={downloadCSV} disabled={rekap.total === 0}>
            <FileSpreadsheet size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Pratinjau sederhana */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 'bold' }}>
            {isRekapSiswa ? `Rekap per Siswa (${rekapSiswa.length})` : `Detail per Hari (${rekap.total})`}
          </h3>
        </div>
        {rekap.total === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data absensi untuk filter ini.</p>
        ) : isRekapSiswa ? (
          <div className="flex flex-col">
            {rekapSiswa.map((s, i) => {
              const persen = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0;
              return (
                <div key={i} className="flex justify-between items-center" style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{s.nama}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{s.nis} · {s.kelas}</span>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Hadir {s.hadir} · Terlambat {s.terlambat} · Total {s.total}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: persen >= 70 ? 'var(--success)20' : 'var(--danger)20', color: persen >= 70 ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                    {persen}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col">
            {absensiHarianLaporan.map((a, i) => (
              <div key={i} className="flex justify-between items-center" style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{a.nama}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{a.nis} · {a.kelas}</span>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{a.tanggal} · Masuk {a.jamMasuk} · Pulang {a.jamPulang || '-'}</p>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: a.status === 'Terlambat' ? 'var(--warning)20' : 'var(--success)20', color: a.status === 'Terlambat' ? 'var(--warning)' : 'var(--success)', fontWeight: '600' }}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LaporanAbsensi;