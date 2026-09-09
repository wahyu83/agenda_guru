import React, { useState, useEffect, useMemo } from 'react';
import { FileText, FileSpreadsheet, Filter, X, Download } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const statusLabels = { diproses: 'Diproses', dilanjutkan: 'Dilanjutkan', selesai: 'Selesai' };

const LaporanBk = () => {
  const { user, settings, kelas, bkLaporan, fetchBkLaporan, fetchMasterData } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');

  useEffect(() => {
    if (kelas.length === 0) fetchMasterData();
    fetchBkLaporan({ bulan: selectedMonth, kelasId: selectedKelas });
  }, [selectedMonth, selectedKelas, fetchBkLaporan, fetchMasterData, kelas.length]);

  const availableMonths = useMemo(() => {
    // Derive months from laporan data dates
    const months = new Set();
    [...bkLaporan.kasus, ...bkLaporan.konseling, ...bkLaporan.bimbingan].forEach(item => {
      if (item.tanggal) {
        const d = new Date(item.tanggal);
        months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    // Always include current month for selection
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    return Array.from(months).sort();
  }, [bkLaporan]);

  const formatMonthLabel = (key) => {
    if (!key) return 'Semua Bulan';
    const [y, m] = key.split('-');
    return `${MONTHS[parseInt(m) - 1]} ${y}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
  };

  const monthLabel = selectedMonth ? ` - ${formatMonthLabel(selectedMonth)}` : '';
  const kelasLabel = selectedKelas ? ` - Kelas ${kelas.find(k => String(k.id) === String(selectedKelas))?.nama || ''}` : '';

  // --- CSV EXPORT ---
  const handleDownloadCSV = (filename, csvRows) => {
    try {
      const csv = Papa.unparse(csvRows);
      const prefixed = '\uFEFF' + csv; // BOM agar karakter UTF-8 tampil benar di Excel
      const blob = new Blob([prefixed], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Error handleDownloadCSV:', err);
    }
  };

  const exportCSV = (kind) => {
    try {
      let rows = [];
      const title = kind === 'kasus' ? 'Laporan Kasus Siswa' : kind === 'konseling' ? 'Laporan Konseling Siswa' : 'Laporan Bimbingan Kelompok';
      const filename = `Laporan_BK_${kind.charAt(0).toUpperCase() + kind.slice(1)}${selectedMonth ? '_' + selectedMonth : ''}`;

    if (kind === 'kasus') {
      rows.push([settings.namaSekolah]);
      rows.push([settings.alamat]);
      rows.push([]);
      rows.push([title + monthLabel + kelasLabel]);
      rows.push([]);
      rows.push(['No', 'Tanggal', 'Nama', 'NIS', 'Kelas', 'Jenis Kasus', 'Kronologi', 'Tindakan', 'Status', 'Konselor']);
      bkLaporan.kasus.forEach((k, i) => {
        rows.push([i + 1, formatDate(k.tanggal), k.nama, k.nis, k.kelas, k.jenisKasus, k.kronologi, k.tindakan, statusLabels[k.status] || k.status, k.konselor]);
      });
    } else if (kind === 'konseling') {
      rows.push([settings.namaSekolah]);
      rows.push([settings.alamat]);
      rows.push([]);
      rows.push([title + monthLabel + kelasLabel]);
      rows.push([]);
      rows.push(['No', 'Tanggal', 'Nama', 'NIS', 'Kelas', 'Topik', 'Catatan', 'Tindak Lanjut', 'Konselor']);
      bkLaporan.konseling.forEach((c, i) => {
        rows.push([i + 1, formatDate(c.tanggal), c.nama, c.nis, c.kelas, c.topik, c.catatan, c.tindakLanjut, c.konselor]);
      });
    } else {
      rows.push([settings.namaSekolah]);
      rows.push([settings.alamat]);
      rows.push([]);
      rows.push([title + monthLabel + kelasLabel]);
      rows.push([]);
      rows.push(['No', 'Tanggal', 'Judul', 'Topik', 'Materi', 'Kelas', 'Jumlah Peserta', 'Konselor']);
      bkLaporan.bimbingan.forEach((b, i) => {
        rows.push([i + 1, formatDate(b.tanggal), b.judul, b.topik, b.materi, b.kelas, b.peserta, b.konselor]);
      });
    }
    handleDownloadCSV(filename, rows);
    } catch (err) {
      console.error('Error exportCSV:', err);
      alert('Gagal export CSV.');
    }
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
    } catch (e) {
      console.error("Gagal memuat logo:", e);
      return null;
    }
  };

  const exportPDF = async (kind) => {
    const title = kind === 'kasus' ? 'Laporan Kasus Siswa' : kind === 'konseling' ? 'Laporan Konseling Siswa' : 'Laporan Bimbingan Kelompok';
    const filename = `Laporan_BK_${kind.charAt(0).toUpperCase() + kind.slice(1)}${selectedMonth ? '_' + selectedMonth : ''}`;
    try {
      const logoDataUrl = await loadLogoDataUrl();
      const doc = new jsPDF('landscape');
      const hasLogo = !!(settings.logoPath && logoDataUrl);
      const textX = hasLogo ? 34 : 148; // center landscape
      const align = hasLogo ? 'left' : 'center';
      if (hasLogo) {
        try { doc.addImage(logoDataUrl, 'PNG', 14, 8, 16, 16); } catch (e) {}
      }
      doc.setFontSize(16);
      doc.text(settings.namaSekolah, textX, 15, { align });
      doc.setFontSize(10);
      doc.text(settings.alamat, textX, 22, { align });
      doc.line(14, 25, 283, 25); // garis penuh (A4 landscape 297mm)
      doc.setFontSize(14);
      doc.text(title + monthLabel + kelasLabel, 14, 35);
      doc.setFontSize(9);
      doc.text(`Guru BK: ${user?.nama || '-'}`, 14, 42);

      const columns = kind === 'kasus'
        ? [
            { header: 'No', key: 'no' }, { header: 'Tanggal', key: 'tanggal' }, { header: 'Nama', key: 'nama' },
            { header: 'NIS', key: 'nis' }, { header: 'Kelas', key: 'kelas' }, { header: 'Jenis Kasus', key: 'jenisKasus' },
            { header: 'Kronologi', key: 'kronologi' }, { header: 'Tindakan', key: 'tindakan' }, { header: 'Status', key: 'status' }, { header: 'Konselor', key: 'konselor' }
          ]
        : kind === 'konseling'
        ? [
            { header: 'No', key: 'no' }, { header: 'Tanggal', key: 'tanggal' }, { header: 'Nama', key: 'nama' },
            { header: 'NIS', key: 'nis' }, { header: 'Kelas', key: 'kelas' }, { header: 'Topik', key: 'topik' },
            { header: 'Catatan', key: 'catatan' }, { header: 'Tindak Lanjut', key: 'tindakLanjut' }, { header: 'Konselor', key: 'konselor' }
          ]
        : [
            { header: 'No', key: 'no' }, { header: 'Tanggal', key: 'tanggal' }, { header: 'Judul', key: 'judul' },
            { header: 'Topik', key: 'topik' }, { header: 'Materi', key: 'materi' }, { header: 'Kelas', key: 'kelas' },
            { header: 'Peserta', key: 'peserta' }, { header: 'Konselor', key: 'konselor' }
          ];

      const data = kind === 'kasus'
        ? bkLaporan.kasus.map((k, i) => ({ ...k, no: i + 1, tanggal: formatDate(k.tanggal), status: statusLabels[k.status] || k.status }))
        : kind === 'konseling'
        ? bkLaporan.konseling.map((c, i) => ({ ...c, no: i + 1, tanggal: formatDate(c.tanggal) }))
        : bkLaporan.bimbingan.map((b, i) => ({ ...b, no: i + 1, tanggal: formatDate(b.tanggal) }));

      autoTable(doc, {
        startY: 47,
        head: [columns.map(c => c.header)],
        body: data.map(item => columns.map(c => item[c.key])),
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [43, 62, 80], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        didParseCell: (hookData) => {
          const col = hookData.column.index;
          if (col === 0 || col === 1 || col === 3 || (kind === 'kasus' && col === 8)) {
            hookData.cell.styles.fontSize = 7;
          }
        }
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
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Laporan Bimbingan Konseling</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Export laporan kasus, konseling, dan bimbingan kelompok.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Bulan:</label>
        </div>
        <select className="input" style={{ width: 'auto', minWidth: '160px', fontSize: '0.875rem' }} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          <option value="">Semua Bulan</option>
          {availableMonths.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Kelas:</label>
        </div>
        <select className="input" style={{ width: 'auto', minWidth: '160px', fontSize: '0.875rem' }} value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
          <option value="">Semua Kelas</option>
          {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
        </select>
        {(selectedMonth || selectedKelas) && (
          <button onClick={() => { setSelectedMonth(''); setSelectedKelas(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
            <X size={14} /> Reset
          </button>
        )}
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Laporan Kasus Siswa</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Daftar kasus dan penanganan per siswa. ({bkLaporan.kasus.length})</p>
          </div>
          <div className="flex gap-2 mt-auto">
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#e74c3c' }} onClick={() => exportPDF('kasus')}>
              <FileText size={16} /> PDF
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', color: '#27ae60', borderColor: '#27ae60' }} onClick={() => exportCSV('kasus')}>
              <FileSpreadsheet size={16} /> CSV
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Laporan Konseling</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sesi konseling individu per siswa. ({bkLaporan.konseling.length})</p>
          </div>
          <div className="flex gap-2 mt-auto">
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#e74c3c' }} onClick={() => exportPDF('konseling')}>
              <FileText size={16} /> PDF
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', color: '#27ae60', borderColor: '#27ae60' }} onClick={() => exportCSV('konseling')}>
              <FileSpreadsheet size={16} /> CSV
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Laporan Bimbingan Kelompok</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Bimbingan klasikal dan peserta. ({bkLaporan.bimbingan.length})</p>
          </div>
          <div className="flex gap-2 mt-auto">
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#e74c3c' }} onClick={() => exportPDF('bimbingan')}>
              <FileText size={16} /> PDF
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', color: '#27ae60', borderColor: '#27ae60' }} onClick={() => exportCSV('bimbingan')}>
              <FileSpreadsheet size={16} /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* Preview table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-hover)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>
            <Download size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Pratinjau Data Laporan
          </h3>
        </div>
        {bkLaporan.kasus.length === 0 && bkLaporan.konseling.length === 0 && bkLaporan.bimbingan.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data untuk filter yang dipilih.</p>
        ) : (
          <div className="flex flex-col gap-3" style={{ padding: '1rem' }}>
            {bkLaporan.kasus.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Kasus Siswa ({bkLaporan.kasus.length})</h4>
                <div className="flex flex-col gap-2">
                  {bkLaporan.kasus.map((k, i) => (
                    <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      <div className="flex justify-between items-center flex-wrap gap-1">
                        <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{i + 1}. {k.nama}</span>
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--danger)15', color: 'var(--danger)', fontWeight: '600' }}>
                          {statusLabels[k.status] || k.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {formatDate(k.tanggal)} · {k.jenisKasus} · {k.kelas}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {bkLaporan.konseling.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Konseling ({bkLaporan.konseling.length})</h4>
                <div className="flex flex-col gap-2">
                  {bkLaporan.konseling.map((c, i) => (
                    <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      <div className="flex justify-between items-center flex-wrap gap-1">
                        <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{i + 1}. {c.nama}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(c.tanggal)}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{c.topik} · {c.kelas}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {bkLaporan.bimbingan.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Bimbingan Kelompok ({bkLaporan.bimbingan.length})</h4>
                <div className="flex flex-col gap-2">
                  {bkLaporan.bimbingan.map((b, i) => (
                    <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      <div className="flex justify-between items-center flex-wrap gap-1">
                        <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{i + 1}. {b.judul}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.peserta != null ? b.peserta : 0} peserta</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {formatDate(b.tanggal)} · {b.topik} · {b.kelas}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LaporanBk;