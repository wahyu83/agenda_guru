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

  const periodeLabel = `(${dariTanggal || '-'} s/d ${sampaiTanggal || '-'})`;
  const kelasLabel = selectedKelas ? ` - ${kelas.find(k => String(k.id) === String(selectedKelas))?.nama || ''}` : '';
  const statusLabel = selectedStatus ? ` - ${selectedStatus === 'terlambat' ? 'Terlambat' : 'Hadir'}` : '';
  const title = `Laporan Absensi Siswa ${periodeLabel}${kelasLabel}${statusLabel}`;
  const filename = `Laporan_Absensi${sampaiTanggal ? '_' + sampaiTanggal : ''}`;

  const columns = [
    { header: 'No', key: 'no' },
    { header: 'Tanggal', key: 'tanggal' },
    { header: 'Nama', key: 'nama' },
    { header: 'NIS', key: 'nis' },
    { header: 'Kelas', key: 'kelas' },
    { header: 'Status', key: 'status' },
    { header: 'Jam Masuk', key: 'jamMasuk' },
    { header: 'Keterangan', key: 'keterangan' }
  ];

  const rows = absensiHarianLaporan.map((a, i) => ({ ...a, no: i + 1 }));

  const downloadCSV = () => {
    const csvRows = [];
    csvRows.push([settings.namaSekolah]);
    csvRows.push([settings.alamat]);
    csvRows.push([]);
    csvRows.push([title]);
    csvRows.push([]);
    csvRows.push(columns.map(c => c.header));
    rows.forEach(item => csvRows.push(columns.map(c => item[c.key] !== undefined ? item[c.key] : '')));
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
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [43, 62, 80], fontSize: 8 },
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
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-hover)' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 'bold' }}>Pratinjau ({rekap.total})</h3>
        </div>
        {rekap.total === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data absensi untuk filter ini.</p>
        ) : (
          <div className="flex flex-col">
            {absensiHarianLaporan.map((a, i) => (
              <div key={i} className="flex justify-between items-center" style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{a.nama}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{a.nis} · {a.kelas}</span>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{a.tanggal} · {a.jamMasuk}</p>
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