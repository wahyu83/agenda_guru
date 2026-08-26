import React, { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../../../lib/store';
import { FileText, FileSpreadsheet, Users, BookOpen, GraduationCap, Filter, X } from 'lucide-react';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WaliKelasScreen = () => {
  const { user, kelasWali, laporanKelas, fetchWaliKelas, fetchLaporanKelas } = useAppStore();
  const [selectedKelasId, setSelectedKelasId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchWaliKelas(user.id);
    }
  }, [user, fetchWaliKelas]);

  useEffect(() => {
    if (kelasWali.length > 0 && !selectedKelasId) {
      setSelectedKelasId(kelasWali[0].id);
    }
  }, [kelasWali, selectedKelasId]);

  useEffect(() => {
    if (selectedKelasId) {
      setLoading(true);
      fetchLaporanKelas(selectedKelasId).finally(() => setLoading(false));
    }
  }, [selectedKelasId, fetchLaporanKelas]);

  const selectedKelas = kelasWali.find(k => k.id === selectedKelasId);

  const availableMonths = useMemo(() => {
    const months = new Set();
    const allData = [...(laporanKelas.agenda || []), ...(laporanKelas.absensi || [])];
    allData.forEach(item => {
      if (item.tanggal) {
        const d = new Date(item.tanggal);
        months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    return Array.from(months).sort();
  }, [laporanKelas]);

  const formatMonthLabel = (key) => {
    if (!key) return 'Semua Bulan';
    const [y, m] = key.split('-');
    return `${MONTHS[parseInt(m) - 1]} ${y}`;
  };

  const isInMonth = (dateString, monthKey) => {
    if (!monthKey) return true;
    const d = new Date(dateString);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return key === monthKey;
  };

  // --- UTILITY ---
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = String(date.getFullYear()).slice(-2);
    return `${d}/${m}/${y}`;
  };

  // --- CSV EXPORT ---
  const handleExportCSV = (filename, data) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- EXPORT AGENDA ---
  const exportAgenda = (type) => {
    if (!laporanKelas.agenda || laporanKelas.agenda.length === 0) {
      alert('Tidak ada data agenda untuk kelas ini.');
      return;
    }

    const filtered = laporanKelas.agenda.filter(a => isInMonth(a.tanggal, selectedMonth));
    if (filtered.length === 0) {
      alert('Tidak ada data agenda untuk bulan yang dipilih.');
      return;
    }

    const formatted = filtered.map(a => ({
      Tanggal: formatDate(a.tanggal),
      Guru: a.pengampu?.guru?.nama,
      Mapel: a.pengampu?.mapel?.nama,
      Materi: a.materi,
      Deskripsi: a.deskripsi
    }));

    const columns = [
      { header: 'Tanggal', key: 'Tanggal' },
      { header: 'Guru', key: 'Guru' },
      { header: 'Mapel', key: 'Mapel' },
      { header: 'Materi', key: 'Materi' },
      { header: 'Deskripsi', key: 'Deskripsi' }
    ];

    const bulanLabel = selectedMonth ? ` ${formatMonthLabel(selectedMonth)}` : '';
    const title = `Jurnal Agenda Mengajar - ${selectedKelas?.nama || ''}${bulanLabel}`;
    const filename = `Agenda_Kelas_${selectedKelas?.nama || 'unknown'}${selectedMonth ? '_' + selectedMonth : ''}`;

    if (type === 'csv') {
      let csvRows = [];
      csvRows.push(['SMK NEGERI 1 ARAHAN']);
      csvRows.push(['Jl. Raya Arahan, Kabupaten Indramayu, Jawa Barat']);
      csvRows.push([]);
      csvRows.push([title]);
      csvRows.push([`Wali Kelas: ${user?.nama || '-'}`]);
      csvRows.push([]);
      csvRows.push(columns.map(c => c.header));
      formatted.forEach(item => {
        csvRows.push(columns.map(c => item[c.key] !== undefined ? item[c.key] : ''));
      });
      handleExportCSV(filename, csvRows);
    } else {
      try {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('SMK NEGERI 1 ARAHAN', 105, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text('Jl. Raya Arahan, Kabupaten Indramayu, Jawa Barat', 105, 22, { align: 'center' });
        doc.line(14, 25, 196, 25);
        doc.setFontSize(14);
        doc.text(title, 14, 35);
        doc.setFontSize(10);
        doc.text(`Wali Kelas: ${user?.nama || '-'}`, 14, 42);

        autoTable(doc, {
          startY: 47,
          head: [columns.map(c => c.header)],
          body: formatted.map(item => columns.map(c => item[c.key])),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [43, 62, 80] },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`${filename}.pdf`);
      } catch (error) {
        console.error("Export PDF Error:", error);
        alert("Terjadi kesalahan saat membuat PDF.");
      }
    }
  };

  // --- EXPORT ABSENSI ---
  const exportAbsensi = (type) => {
    if (!laporanKelas.absensi || laporanKelas.absensi.length === 0) {
      alert('Tidak ada data absensi untuk kelas ini.');
      return;
    }

    const filtered = laporanKelas.absensi.filter(s => isInMonth(s.tanggal, selectedMonth));
    if (filtered.length === 0) {
      alert('Tidak ada data absensi untuk bulan yang dipilih.');
      return;
    }

    const bulanLabel = selectedMonth ? ` ${formatMonthLabel(selectedMonth)}` : '';
    const titleText = `Laporan Rekapitulasi Absensi Siswa${bulanLabel}`;

    // Group by pengampu (mapel)
    const groups = {};
    filtered.forEach(session => {
      const pId = session.pengampuId;
      if (!groups[pId]) {
        groups[pId] = { pengampu: session.pengampu, sessions: [], siswaMap: new Map() };
      }
      groups[pId].sessions.push({
        tanggal: formatDate(session.tanggal),
        rawDate: new Date(session.tanggal).getTime(),
        details: session.siswaDetail
      });
      session.siswaDetail.forEach(d => {
        if (!groups[pId].siswaMap.has(d.siswa.id)) {
          groups[pId].siswaMap.set(d.siswa.id, d.siswa);
        }
      });
    });

    const matrices = Object.values(groups).map(group => {
      group.sessions.sort((a, b) => a.rawDate - b.rawDate);
      const dates = group.sessions.map(s => s.tanggal);
      const students = Array.from(group.siswaMap.values()).sort((a, b) => String(a.nis).localeCompare(String(b.nis), undefined, { numeric: true }));

      const matrixData = students.map((siswa, index) => {
        const row = { No: index + 1, Nama: siswa.nama };
        let h = 0, s = 0, i = 0, a = 0, t = 0;
        group.sessions.forEach(session => {
          const detail = session.details.find(d => d.siswaId === siswa.id);
          const statusChar = detail ? detail.status.charAt(0) : '-';
          row[session.tanggal] = statusChar;
          if (statusChar === 'H') h++;
          if (statusChar === 'S') s++;
          if (statusChar === 'I') i++;
          if (statusChar === 'A') a++;
          if (statusChar === 'T') t++;
        });
        row['H'] = h;
        row['S'] = s;
        row['I'] = i;
        row['A'] = a;
        row['T'] = t;
        return row;
      });

      return {
        kelas: selectedKelas?.nama || '-',
        mapel: group.pengampu.mapel.nama,
        guru: group.pengampu.guru?.nama || '-',
        dates,
        matrixData
      };
    });

    const filename = `Absensi_Kelas_${selectedKelas?.nama || 'unknown'}${selectedMonth ? '_' + selectedMonth : ''}`;

    if (type === 'csv') {
      let csvRows = [];
      matrices.forEach(m => {
        csvRows.push([titleText]);
        csvRows.push([`Kelas: ${m.kelas}    Mapel: ${m.mapel}    Guru: ${m.guru}`]);
        csvRows.push([`Wali Kelas: ${user?.nama || '-'}`]);
        csvRows.push(['Keterangan: H=Hadir, S=Sakit, I=Izin, A=Alpa, T=Terlambat']);
        csvRows.push([]);

        const headerRow = ['No', 'Nama Siswa', ...m.dates, 'H', 'S', 'I', 'A', 'T'];
        csvRows.push(headerRow);

        m.matrixData.forEach(row => {
          const dataRow = [row.No, row.Nama];
          m.dates.forEach(date => {
            dataRow.push(row[date] || '-');
          });
          dataRow.push(row.H, row.S, row.I, row.A, row.T);
          csvRows.push(dataRow);
        });

        csvRows.push([]);
        csvRows.push([]);
      });

      handleExportCSV(filename, csvRows);
    } else {
      try {
        const doc = new jsPDF('landscape');

        matrices.forEach((m, index) => {
          if (index > 0) doc.addPage();

          doc.setFontSize(14);
          doc.text(titleText, 14, 15);
          doc.setFontSize(10);
          doc.text(`Kelas: ${m.kelas}    Mapel: ${m.mapel}    Guru: ${m.guru}`, 14, 22);
          doc.text(`Wali Kelas: ${user?.nama || '-'}`, 14, 27);
          doc.text('Keterangan: H=Hadir, S=Sakit, I=Izin, A=Alpa, T=Terlambat', 14, 32);

          const columns = [
            { header: 'No', key: 'No' },
            { header: 'Nama Siswa', key: 'Nama' },
            ...m.dates.map(d => ({ header: d.split('/').join('\n'), key: d })),
            { header: 'H', key: 'H' },
            { header: 'S', key: 'S' },
            { header: 'I', key: 'I' },
            { header: 'A', key: 'A' },
            { header: 'T', key: 'T' }
          ];

          autoTable(doc, {
            startY: 37,
            theme: 'grid',
            head: [columns.map(c => c.header)],
            body: m.matrixData.map(item => columns.map(c => item[c.key] !== undefined ? item[c.key] : '')),
            styles: { fontSize: 8, cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.1 },
            headStyles: { fillColor: [43, 62, 80], halign: 'center', valign: 'bottom' },
            bodyStyles: { halign: 'center' },
            columnStyles: {
              0: { halign: 'center', cellWidth: 10 },
              1: { halign: 'left', cellWidth: 45 }
            }
          });
        });

        doc.save(`${filename}.pdf`);
      } catch (err) {
        console.error(err);
        alert('Gagal export PDF');
      }
    }
  };

  // --- EXPORT KEHADIRAN PER-SISWA ---
  const exportKehadiranSiswa = (type) => {
    if (!laporanKelas.absensi || laporanKelas.absensi.length === 0) {
      alert('Tidak ada data absensi untuk kelas ini.');
      return;
    }

    const filtered = laporanKelas.absensi.filter(s => isInMonth(s.tanggal, selectedMonth));
    if (filtered.length === 0) {
      alert('Tidak ada data absensi untuk bulan yang dipilih.');
      return;
    }

    const bulanLabel = selectedMonth ? ` ${formatMonthLabel(selectedMonth)}` : '';
    const titleText = `Laporan Kehadiran Per-Siswa${bulanLabel}`;

    const mapelMap = {};
    filtered.forEach(session => {
      const mapelId = session.pengampu?.mapel?.id;
      const mapelNama = session.pengampu?.mapel?.nama || '-';
      const guruNama = session.pengampu?.guru?.nama || '-';
      if (!mapelMap[mapelId]) {
        mapelMap[mapelId] = { nama: mapelNama, guru: guruNama, siswa: {} };
      }
      session.siswaDetail.forEach(d => {
        const sid = d.siswaId;
        if (!mapelMap[mapelId].siswa[sid]) {
          mapelMap[mapelId].siswa[sid] = { id: sid, nama: d.siswa.nama, nis: d.siswa.nis, H: 0, S: 0, I: 0, A: 0, T: 0 };
        }
        const s = d.status?.charAt(0);
        const siswa = mapelMap[mapelId].siswa[sid];
        if (s === 'H') siswa.H++;
        else if (s === 'S') siswa.S++;
        else if (s === 'I') siswa.I++;
        else if (s === 'A') siswa.A++;
        else if (s === 'T') siswa.T++;
      });
    });

    const mapelList = Object.values(mapelMap).sort((a, b) => a.nama.localeCompare(b.nama));
    const filename = `Kehadiran_Siswa_${selectedKelas?.nama || 'unknown'}${selectedMonth ? '_' + selectedMonth : ''}`;
    const kelasNama = selectedKelas?.nama || '-';

    if (type === 'csv') {
      let csvRows = [];
      csvRows.push(['SMK NEGERI 1 ARAHAN']);
      csvRows.push(['Jl. Raya Arahan, Kabupaten Indramayu, Jawa Barat']);
      csvRows.push([]);
      csvRows.push([titleText]);
      csvRows.push([`Kelas: ${kelasNama}`]);
      csvRows.push([`Wali Kelas: ${user?.nama || '-'}`]);
      csvRows.push([]);

      mapelList.forEach(mp => {
        csvRows.push([`Mapel: ${mp.nama}`]);
        csvRows.push([`Guru: ${mp.guru}`]);
        csvRows.push(['No', 'NIS', 'Nama Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat', 'Persentase', 'Status']);
        const siswaList = Object.values(mp.siswa).sort((a, b) => String(a.nis).localeCompare(String(b.nis), undefined, { numeric: true }));
        siswaList.forEach((s, idx) => {
          const total = s.H + s.S + s.I + s.A + s.T;
          const persentase = total > 0 ? Math.round((s.H / total) * 100) : 0;
          const warning = persentase < 70 ? '⚠️ PERINGATAN' : '';
          csvRows.push([idx + 1, s.nis, s.nama, s.H, s.S, s.I, s.A, s.T, `${persentase}%`, warning]);
        });
        csvRows.push([]);
      });
      handleExportCSV(filename, csvRows);
    } else {
      try {
        const doc = new jsPDF();
        let firstPage = true;

        mapelList.forEach(mp => {
          if (!firstPage) doc.addPage();
          firstPage = false;

          doc.setFontSize(14);
          doc.text(titleText, 14, 15);
          doc.setFontSize(11);
          doc.text(`Kelas: ${kelasNama} — Mapel: ${mp.nama}`, 14, 23);
          doc.setFontSize(10);
          doc.text(`Guru: ${mp.guru}`, 14, 29);
          doc.setFontSize(10);
          doc.text(`Wali Kelas: ${user?.nama || '-'}`, 14, 35);
          doc.setFontSize(9);
          doc.text('Keterangan: H=Hadir, S=Sakit, I=Izin, A=Alpa, T=Terlambat', 14, 41);

          const siswaList = Object.values(mp.siswa).sort((a, b) => String(a.nis).localeCompare(String(b.nis), undefined, { numeric: true }));
          const siswaData = siswaList.map((s, idx) => {
            const total = s.H + s.S + s.I + s.A + s.T;
            const persentase = total > 0 ? Math.round((s.H / total) * 100) : 0;
            return { idx, nis: s.nis, nama: s.nama, H: s.H, S: s.S, I: s.I, A: s.A, T: s.T, persentase };
          });

          const columns = [
            { header: 'No', key: 'No' },
            { header: 'NIS', key: 'NIS' },
            { header: 'Nama Siswa', key: 'Nama' },
            { header: 'Hadir', key: 'H' },
            { header: 'Sakit', key: 'S' },
            { header: 'Izin', key: 'I' },
            { header: 'Alpa', key: 'A' },
            { header: 'Terlambat', key: 'T' },
            { header: 'Persentase', key: 'Persentase' }
          ];
          const body = siswaData.map(s => [
            s.idx + 1, s.nis, s.nama, s.H, s.S, s.I, s.A, s.T, `${s.persentase}%`
          ]);

          autoTable(doc, {
            startY: 46,
            theme: 'grid',
            head: [columns.map(c => c.header)],
            body,
            styles: { fontSize: 9, cellPadding: 1.5 },
            headStyles: { fillColor: [43, 62, 80], halign: 'center', fontSize: 8 },
            bodyStyles: { halign: 'center' },
            columnStyles: {
              0: { cellWidth: 8, halign: 'center' },
              1: { cellWidth: 22, halign: 'center' },
              2: { halign: 'left', cellWidth: 42 },
              3: { cellWidth: 12, halign: 'center' },
              4: { cellWidth: 12, halign: 'center' },
              5: { cellWidth: 12, halign: 'center' },
              6: { cellWidth: 12, halign: 'center' },
              7: { cellWidth: 20, halign: 'center' },
              8: { cellWidth: 18, halign: 'center' }
            },
            didParseCell: (hookData) => {
              if (hookData.section === 'body') {
                const rowIndex = hookData.row.index;
                const persentase = siswaData[rowIndex]?.persentase ?? 100;
                if (persentase < 70) {
                  hookData.cell.styles.fillColor = [255, 230, 230];
                  hookData.cell.styles.textColor = [192, 57, 43];
                  hookData.cell.styles.fontStyle = 'bold';
                }
              }
            }
          });
        });

        doc.save(`${filename}.pdf`);
      } catch (err) {
        console.error(err);
        alert('Gagal export PDF');
      }
    }
  };

  // --- RENDER ---
  if (kelasWali.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Laporan Kelas</h1>
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <GraduationCap size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p>Anda belum ditugaskan sebagai wali kelas.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Hubungi administrator untuk mengatur penugasan wali kelas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Laporan Kelas</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Download laporan agenda & absensi untuk kelas yang Anda wali.</p>
      </div>

      {/* Class Selector */}
      {kelasWali.length > 1 && (
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Pilih Kelas</label>
          <select 
            className="input" 
            value={selectedKelasId || ''} 
            onChange={(e) => setSelectedKelasId(parseInt(e.target.value))}
          >
            {kelasWali.map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>
      )}

      {/* Class Info Card */}
      {selectedKelas && (
        <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: 'white' }}>
          <div className="flex items-center gap-3" style={{ marginBottom: '0.75rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Wali Kelas {selectedKelas.nama}</h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>{selectedKelas.tahunPelajaran?.nama || ''} - {selectedKelas.tahunPelajaran?.semester || ''}</p>
            </div>
          </div>
          <div className="flex gap-4" style={{ fontSize: '0.85rem' }}>
            <div className="flex items-center gap-1">
              <Users size={14} /> {selectedKelas._count?.enrollment || 0} Siswa
            </div>
            <div className="flex items-center gap-1">
              <BookOpen size={14} /> {selectedKelas._count?.pengampu || 0} Pengampu
            </div>
          </div>
        </div>
      )}

      {/* Report Cards */}
      {loading ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data laporan...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Month Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Filter Bulan:</label>
            </div>
            <select
              className="input"
              style={{ width: 'auto', minWidth: '180px', fontSize: '0.875rem' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">Semua Bulan</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}
              >
                <X size={14} /> Reset
              </button>
            )}
          </div>
          {/* Agenda Report */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Jurnal Agenda Guru</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Rekap catatan agenda mengajar semua guru di kelas {selectedKelas?.nama}. ({laporanKelas.agenda?.length || 0} catatan)
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#e74c3c' }} onClick={() => exportAgenda('pdf')}>
                <FileText size={16} /> Export PDF
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', color: '#27ae60', borderColor: '#27ae60' }} onClick={() => exportAgenda('csv')}>
                <FileSpreadsheet size={16} /> Export CSV
              </button>
            </div>
          </div>

          {/* Absensi Report */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Rekap Absensi Harian</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Daftar rekap kehadiran siswa kelas {selectedKelas?.nama} per mata pelajaran. ({laporanKelas.absensi?.length || 0} sesi)
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#e74c3c' }} onClick={() => exportAbsensi('pdf')}>
                <FileText size={16} /> Export PDF
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', color: '#27ae60', borderColor: '#27ae60' }} onClick={() => exportAbsensi('csv')}>
                <FileSpreadsheet size={16} /> Export CSV
              </button>
            </div>
          </div>

          {/* Kehadiran per-Siswa Report */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Kehadiran per-Siswa</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Ringkasan kehadiran setiap siswa (Hadir/Sakit/Izin/Alpa) di semua mata pelajaran kelas {selectedKelas?.nama}.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#e74c3c' }} onClick={() => exportKehadiranSiswa('pdf')}>
                <FileText size={16} /> Export PDF
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', color: '#27ae60', borderColor: '#27ae60' }} onClick={() => exportKehadiranSiswa('csv')}>
                <FileSpreadsheet size={16} /> Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaliKelasScreen;
