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

const LaporanPiket = () => {
  const { user, settings, kelas, laporanPiketList, laporanIzinList, fetchLaporanPiketList, fetchLaporanIzinList, fetchMasterData } = useAppStore();
  const [dariTanggal, setDariTanggal] = useState('');
  const [sampaiTanggal, setSampaiTanggal] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');

  useEffect(() => {
    if (kelas.length === 0) fetchMasterData();
  }, [fetchMasterData, kelas.length]);

  useEffect(() => {
    fetchLaporanPiketList({ tanggalDari: dariTanggal, tanggalSampai: sampaiTanggal });
  }, [dariTanggal, sampaiTanggal, fetchLaporanPiketList]);

  useEffect(() => {
    fetchLaporanIzinList({ tanggalDari: dariTanggal, tanggalSampai: sampaiTanggal, kelasId: selectedKelas });
  }, [dariTanggal, sampaiTanggal, selectedKelas, fetchLaporanIzinList]);

  const availableMonths = useMemo(() => {
    const months = new Set();
    [...laporanPiketList, ...laporanIzinList].forEach(item => {
      if (item.tanggal) {
        const d = new Date(item.tanggal);
        months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    return Array.from(months).sort();
  }, [laporanPiketList, laporanIzinList]);

  const formatMonthLabel = (key) => {
    if (!key) return 'Semua';
    const [y, m] = key.split('-');
    return `${MONTHS[parseInt(m) - 1]} ${y}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
  };

  const periodLabel = `(${formatDate(dariTanggal)} s/d ${formatDate(sampaiTanggal)})`;
  const kelasLabel = selectedKelas ? ` - Kelas ${kelas.find(k => String(k.id) === String(selectedKelas))?.nama || ''}` : '';

  // --- CSV ---
  const downloadCSV = (filename, rows) => {
    const csv = '\uFEFF' + Papa.unparse(rows);
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

  const exportCSV = (kind) => {
    let rows = [];
    const title = kind === 'piket' ? 'Laporan Kehadiran Guru di Kelas' : 'Laporan Izin Siswa';
    rows.push([settings.namaSekolah]);
    rows.push([settings.alamat]);
    rows.push([]);
    rows.push([title + ' ' + periodLabel + kelasLabel]);
    rows.push([]);
    if (kind === 'piket') {
      rows.push(['No', 'Tanggal', 'Guru', 'NIP', 'Kelas', 'Mapel', 'Jam Ke', 'Status', 'Catatan', 'Petugas']);
      laporanPiketList.forEach((p, i) => rows.push([i + 1, formatDate(p.tanggal), p.guru, p.nip, p.kelas, p.mapel, p.jamKe, p.status, p.catatan, p.petugas]));
    } else {
      rows.push(['No', 'Tanggal', 'Nama Siswa', 'NIS', 'Kelas', 'Jenis Izin', 'Jam', 'Alasan', 'Status', 'Petugas']);
      laporanIzinList.forEach((iz, i) => rows.push([i + 1, formatDate(iz.tanggal), iz.nama, iz.nis, iz.kelas, iz.jenisIzin, iz.jam, iz.alasan, iz.status, iz.petugas]));
    }
    downloadCSV(`Laporan_Piket_${kind === 'piket' ? 'Kehadiran' : 'Izin'}${sampaiTanggal ? '_' + sampaiTanggal : ''}`, rows);
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
    const title = kind === 'piket' ? 'Laporan Kehadiran Guru di Kelas' : 'Laporan Izin Siswa';
    const filename = `Laporan_Piket_${kind === 'piket' ? 'Kehadiran' : 'Izin'}${sampaiTanggal ? '_' + sampaiTanggal : ''}`;
    try {
      const logoDataUrl = await loadLogoDataUrl();
      const doc = new jsPDF('landscape');
      const hasLogo = !!(settings.logoPath && logoDataUrl);
      const textX = hasLogo ? 34 : 148;
      const align = hasLogo ? 'left' : 'center';
      if (hasLogo) {
        try { doc.addImage(logoDataUrl, 'PNG', 14, 8, 16, 16); } catch (e) {}
      }
      doc.setFontSize(16);
      doc.text(settings.namaSekolah, textX, 15, { align });
      doc.setFontSize(10);
      doc.text(settings.alamat, textX, 22, { align });
      doc.line(14, 25, 283, 25);
      doc.setFontSize(14);
      doc.text(title + ' ' + periodLabel + kelasLabel, 14, 35);
      doc.setFontSize(9);
      doc.text(`Petugas Piket: ${user?.nama || '-'}`, 14, 42);

      const columns = kind === 'piket'
        ? [
            { header: 'No', key: 'no' }, { header: 'Tanggal', key: 'tanggal' }, { header: 'Guru', key: 'guru' },
            { header: 'NIP', key: 'nip' }, { header: 'Kelas', key: 'kelas' }, { header: 'Mapel', key: 'mapel' },
            { header: 'Jam Ke', key: 'jamKe' }, { header: 'Status', key: 'status' }, { header: 'Catatan', key: 'catatan' }, { header: 'Petugas', key: 'petugas' }
          ]
        : [
            { header: 'No', key: 'no' }, { header: 'Tanggal', key: 'tanggal' }, { header: 'Nama Siswa', key: 'nama' },
            { header: 'NIS', key: 'nis' }, { header: 'Kelas', key: 'kelas' }, { header: 'Jenis Izin', key: 'jenisIzin' },
            { header: 'Jam', key: 'jam' }, { header: 'Alasan', key: 'alasan' }, { header: 'Status', key: 'status' }, { header: 'Petugas', key: 'petugas' }
          ];

      const data = kind === 'piket'
        ? laporanPiketList.map((p, i) => ({ ...p, no: i + 1, tanggal: formatDate(p.tanggal) }))
        : laporanIzinList.map((iz, i) => ({ ...iz, no: i + 1, tanggal: formatDate(iz.tanggal) }));

      autoTable(doc, {
        startY: 47,
        head: [columns.map(c => c.header)],
        body: data.map(item => columns.map(c => item[c.key])),
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

  const statusColor = (s) => {
    if (s === 'Hadir') return 'var(--success)';
    if (s === 'Terlambat') return 'var(--warning)';
    if (s === 'Tidak Hadir') return 'var(--danger)';
    if (s === 'Disetujui') return 'var(--success)';
    if (s === 'Ditolak') return 'var(--danger)';
    return 'var(--text-muted)';
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Laporan Guru Piket</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Export rekap kehadiran guru di kelas dan izin siswa.</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Periode:</label>
          <input type="date" className="input" style={{ width: 'auto', fontSize: '0.875rem' }} value={dariTanggal} onChange={(e) => setDariTanggal(e.target.value)} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>s/d</span>
          <input type="date" className="input" style={{ width: 'auto', fontSize: '0.875rem' }} value={sampaiTanggal} onChange={(e) => setSampaiTanggal(e.target.value)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Kelas (Izin):</label>
          </div>
          <select className="input" style={{ width: 'auto', minWidth: '140px', fontSize: '0.875rem' }} value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
            <option value="">Semua Kelas</option>
            {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
          {(dariTanggal || sampaiTanggal || selectedKelas) && (
            <button onClick={() => { setDariTanggal(''); setSampaiTanggal(''); setSelectedKelas(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
              <X size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Kehadiran Guru di Kelas</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Rekap status kehadiran guru dari catatan piket. ({laporanPiketList.length})</p>
          </div>
          <div className="flex gap-2 mt-auto">
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#e74c3c' }} onClick={() => exportPDF('piket')}>
              <FileText size={16} /> PDF
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', color: '#27ae60', borderColor: '#27ae60' }} onClick={() => exportCSV('piket')}>
              <FileSpreadsheet size={16} /> CSV
            </button>
          </div>
          {laporanPiketList.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              {['Hadir','Terlambat','Tidak Hadir'].map(s => {
                const c = laporanPiketList.filter(p => p.status === s).length;
                if (c === 0) return null;
                return (
                  <span key={s} style={{ fontSize: '0.75rem', color: statusColor(s), fontWeight: '600' }}>
                    {s}: {c}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Izin Siswa</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Rekap permohonan izin masuk/keluar siswa. ({laporanIzinList.length})</p>
          </div>
          <div className="flex gap-2 mt-auto">
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#e74c3c' }} onClick={() => exportPDF('izin')}>
              <FileText size={16} /> PDF
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', color: '#27ae60', borderColor: '#27ae60' }} onClick={() => exportCSV('izin')}>
              <FileSpreadsheet size={16} /> CSV
            </button>
          </div>
          {laporanIzinList.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              {['Diajukan','Disetujui','Ditolak'].map(s => {
                const c = laporanIzinList.filter(p => p.status === s).length;
                if (c === 0) return null;
                return (
                  <span key={s} style={{ fontSize: '0.75rem', color: statusColor(s), fontWeight: '600' }}>
                    {s}: {c}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview - sederhana */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-hover)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>
            <Download size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Pratinjau Data
          </h3>
        </div>
        {laporanPiketList.length === 0 && laporanIzinList.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data untuk periode yang dipilih.</p>
        ) : (
          <div className="flex flex-col gap-3" style={{ padding: '1rem' }}>
            {laporanPiketList.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Kehadiran Guru ({laporanPiketList.length})</h4>
                <div className="flex flex-col gap-2">
                  {laporanPiketList.map((p, i) => (
                    <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      <div className="flex justify-between items-center flex-wrap gap-1">
                        <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{i + 1}. {p.guru}</span>
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: `${statusColor(p.status)}20`, color: statusColor(p.status), fontWeight: '600' }}>{p.status}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {formatDate(p.tanggal)} · {p.kelas} · {p.mapel} · Jam ke-{p.jamKe} {p.catatan && p.catatan !== '-' ? `· ${p.catatan}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {laporanIzinList.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Izin Siswa ({laporanIzinList.length})</h4>
                <div className="flex flex-col gap-2">
                  {laporanIzinList.map((iz, i) => (
                    <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      <div className="flex justify-between items-center flex-wrap gap-1">
                        <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{i + 1}. {iz.nama}</span>
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: `${statusColor(iz.status)}20`, color: statusColor(iz.status), fontWeight: '600' }}>{iz.status}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {formatDate(iz.tanggal)} · {iz.jenisIzin} · {iz.jam} · {iz.kelas}
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

export default LaporanPiket;