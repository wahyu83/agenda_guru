import React, { useState, useMemo } from 'react';
import { Download, FileText, FileSpreadsheet, Filter, X, CalendarDays } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const LaporanScreen = () => {
  const { guru, mapel, kelas, siswa, tahunPelajaran, laporanAgenda, laporanAbsensi, laporanPiket, fetchLaporanAgenda, fetchLaporanAbsensi, fetchLaporanPiket } = useAppStore();
  const tahunAktif = tahunPelajaran.find(t => t.isActive);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedPiketDate, setSelectedPiketDate] = useState('');

  React.useEffect(() => {
    fetchLaporanAgenda();
    fetchLaporanAbsensi();
    fetchLaporanPiket();
  }, [fetchLaporanAgenda, fetchLaporanAbsensi, fetchLaporanPiket]);

  const extractYearMonth = (dateString) => {
    if (!dateString) return '';
    // Supports "2024-01-15T00:00:00.000Z" or "2024-01-15"
    const datePart = dateString.split('T')[0];
    return datePart.slice(0, 7); // "2024-01"
  };

  const availableMonths = useMemo(() => {
    const months = new Set();
    [...laporanAgenda, ...laporanAbsensi].forEach(item => {
      const ym = extractYearMonth(item.tanggal);
      if (ym) months.add(ym);
    });
    return Array.from(months).sort();
  }, [laporanAgenda, laporanAbsensi]);

  const formatMonthLabel = (key) => {
    if (!key) return 'Semua Bulan';
    const [y, m] = key.split('-');
    return `${MONTHS[parseInt(m) - 1]} ${y}`;
  };

  const isInMonth = (dateString, monthKey) => {
    if (!monthKey) return true;
    return extractYearMonth(dateString) === monthKey;
  };

  // --- CSV EXPORT LOGIC ---
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

  // --- CSV WITH HEADER (matching PDF kop) ---
  const handleExportCSVWithHeader = (filename, title, columns, data) => {
    let csvRows = [];
    // Kop Sekolah
    csvRows.push(['SMK NEGERI 1 ARAHAN']);
    csvRows.push(['Jl. Raya Arahan, Kabupaten Indramayu, Jawa Barat']);
    csvRows.push([]); // Separator
    csvRows.push([title]);
    csvRows.push([]); // Separator
    // Table Header
    csvRows.push(columns.map(c => c.header));
    // Table Data
    data.forEach(item => {
      csvRows.push(columns.map(c => item[c.key] !== undefined ? item[c.key] : ''));
    });
    handleExportCSV(filename, csvRows);
  };

  // --- PDF EXPORT LOGIC ---
  const handleExportPDF = (filename, title, columns, data) => {
    try {
      const doc = new jsPDF();
      
      // Header Kop Sekolah (Simple Text Version)
      doc.setFontSize(16);
      doc.text('SMK NEGERI 1 ARAHAN', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Jl. Raya Arahan, Kabupaten Indramayu, Jawa Barat', 105, 22, { align: 'center' });
      doc.line(14, 25, 196, 25);
      
      // Title
      doc.setFontSize(14);
      doc.text(title, 14, 35);
      
      // Table
      autoTable(doc, {
        startY: 40,
        head: [columns.map(c => c.header)],
        body: data.map(item => columns.map(c => item[c.key])),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [43, 62, 80] }, // Dark primary color
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error("Export PDF Error:", error);
      alert("Terjadi kesalahan saat membuat PDF: " + error.message);
    }
  };

  // --- DATA FORMATTERS ---
  const exportGuru = (type) => {
    const formatted = guru.map(g => ({
      NIP: g.nip,
      Nama: g.nama,
      Username: g.username
    }));
    const columns = [
      { header: 'NIP / NUPTK', key: 'NIP' },
      { header: 'Nama Lengkap', key: 'Nama' },
      { header: 'Username', key: 'Username' }
    ];
    
    if (type === 'csv') {
      handleExportCSVWithHeader('Data_Guru', 'Laporan Data Guru', columns, formatted);
    } else {
      handleExportPDF('Data_Guru', 'Laporan Data Guru', columns, formatted);
    }
  };

  const exportSiswa = (type) => {
    const formatted = siswa.map(s => {
      // Find class in active year
      let kelasName = '-';
      if (s.enrollment && s.enrollment.length > 0 && tahunAktif) {
        const active = s.enrollment.find(e => e.kelas.tahunPelajaranId === tahunAktif.id);
        if (active) kelasName = active.kelas.nama;
      }
      return {
        NIS: s.nis,
        Nama: s.nama,
        Kelas: kelasName
      };
    });
    const columns = [
      { header: 'NIS / NISN', key: 'NIS' },
      { header: 'Nama Lengkap', key: 'Nama' },
      { header: 'Kelas Aktif', key: 'Kelas' }
    ];
    const title = `Laporan Data Siswa (Tahun ${tahunAktif ? tahunAktif.nama : '-'})`;

    if (type === 'csv') {
      handleExportCSVWithHeader('Data_Siswa', title, columns, formatted);
    } else {
      handleExportPDF('Data_Siswa', title, columns, formatted);
    }
  };

  const exportKelas = (type) => {
    const formatted = kelas.map(k => ({
      NamaKelas: k.nama,
      JumlahSiswa: k.jumlahSiswa || 0,
      JumlahPengampu: k.jumlahPengampu || 0
    }));
    const columns = [
      { header: 'Nama Kelas', key: 'NamaKelas' },
      { header: 'Jumlah Siswa', key: 'JumlahSiswa' },
      { header: 'Jumlah Pengampu', key: 'JumlahPengampu' }
    ];

    if (type === 'csv') {
      handleExportCSVWithHeader('Data_Kelas', 'Laporan Data Kelas', columns, formatted);
    } else {
      handleExportPDF('Data_Kelas', 'Laporan Data Kelas', columns, formatted);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = String(date.getFullYear()).slice(-2);
    return `${d}/${m}/${y}`;
  };

  const exportAgenda = (type) => {
    const filtered = laporanAgenda.filter(a => isInMonth(a.tanggal, selectedMonth));
    const formatted = filtered.map(a => ({
      Tanggal: formatDate(a.tanggal),
      Guru: a.pengampu?.guru?.nama,
      Kelas: a.pengampu?.kelas?.nama,
      Mapel: a.pengampu?.mapel?.nama,
      Materi: a.materi,
      Deskripsi: a.deskripsi
    }));
    const columns = [
      { header: 'Tanggal', key: 'Tanggal' },
      { header: 'Guru', key: 'Guru' },
      { header: 'Kelas', key: 'Kelas' },
      { header: 'Mapel', key: 'Mapel' },
      { header: 'Materi', key: 'Materi' }
    ];

    const bulanLabel = selectedMonth ? ` - ${formatMonthLabel(selectedMonth)}` : '';
    const title = `Jurnal Agenda Mengajar${bulanLabel}`;

    if (type === 'csv') {
      handleExportCSVWithHeader(`Laporan_Agenda${selectedMonth ? '_' + selectedMonth : ''}`, title, columns, formatted);
    } else {
      handleExportPDF(`Laporan_Agenda${selectedMonth ? '_' + selectedMonth : ''}`, title, columns, formatted);
    }
  };

  const exportAbsensi = (type) => {
    const filtered = laporanAbsensi.filter(s => isInMonth(s.tanggal, selectedMonth));
    const bulanLabel = selectedMonth ? ` - ${formatMonthLabel(selectedMonth)}` : '';
    const titleText = `Laporan Rekapitulasi Absensi Siswa${bulanLabel}`;

    // 1. Grouping Data (Matrix Transformation)
    const groups = {};
    filtered.forEach(session => {
      const pId = session.pengampuId;
      if (!pId) return;
      if (!groups[pId]) {
        groups[pId] = { pengampu: session.pengampu, sessions: [], siswaMap: new Map() };
      }
      groups[pId].sessions.push({
        tanggal: formatDate(session.tanggal),
        rawDate: new Date(session.tanggal).getTime(),
        details: session.siswaDetail
      });
      (session.siswaDetail || []).forEach(d => {
        if (d.siswa && !groups[pId].siswaMap.has(String(d.siswa.id))) {
          groups[pId].siswaMap.set(String(d.siswa.id), d.siswa);
        }
      });
    });

    const matrices = Object.values(groups).map(group => {
      // Sort sessions ASC
      group.sessions.sort((a, b) => a.rawDate - b.rawDate);
      const dates = group.sessions.map(s => s.tanggal);
      const students = Array.from(group.siswaMap.values()).sort((a, b) => String(a.nis).localeCompare(String(b.nis), undefined, { numeric: true }));
      
      const matrixData = students.map((siswa, index) => {
        const sid = String(siswa.id);
        const row = { No: index + 1, Nama: siswa.nama };
        let h = 0, s = 0, i = 0, a = 0, t = 0;
        group.sessions.forEach(session => {
          const detail = session.details.find(d => String(d.siswaId) === sid);
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
        kelas: group.pengampu.kelas?.nama || '-',
        mapel: group.pengampu.mapel?.nama || '-',
        guru: group.pengampu.guru?.nama || '-',
        dates,
        matrixData
      };
    });

    if (type === 'csv') {
      // Create a matrix-style CSV matching PDF layout
      let csvRows = [];
      
      matrices.forEach((m, idx) => {
        // Header info matching PDF
        csvRows.push([titleText]);
        csvRows.push([`Kelas: ${m.kelas}    Mapel: ${m.mapel}    Guru: ${m.guru}`]);
        csvRows.push(['Keterangan: H=Hadir, S=Sakit, I=Izin, A=Alpa, T=Terlambat']);
        csvRows.push([]); // Spacer

        // Table Header
        const headerRow = ['No', 'Nama Siswa', ...m.dates, 'H', 'S', 'I', 'A', 'T'];
        csvRows.push(headerRow);

        // Data Rows
        m.matrixData.forEach(row => {
          const dataRow = [row.No, row.Nama];
          // Fill date columns
          m.dates.forEach(date => {
            dataRow.push(row[date] || '-');
          });
          // Fill H, S, I, A, T
          dataRow.push(row.H, row.S, row.I, row.A, row.T);
          csvRows.push(dataRow);
        });

        // Add spacers between matrices
        csvRows.push([]);
        csvRows.push([]);
      });

      handleExportCSV(`Laporan_Absensi_Matrix${selectedMonth ? '_' + selectedMonth : ''}`, csvRows);
    }
 else {
      try {
        // Landscape orientation for many columns
        const doc = new jsPDF('landscape');
        
        matrices.forEach((m, index) => {
          if (index > 0) doc.addPage();
          
          doc.setFontSize(14);
          doc.text(titleText, 14, 15);
          doc.setFontSize(10);
          doc.text(`Kelas: ${m.kelas}    Mapel: ${m.mapel}    Guru: ${m.guru}`, 14, 22);
          doc.text('Keterangan: H=Hadir, S=Sakit, I=Izin, A=Alpa, T=Terlambat', 14, 27);
          
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
            startY: 32,
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

        doc.save(`Laporan_Absensi_Matrix${selectedMonth ? '_' + selectedMonth : ''}.pdf`);
      } catch (err) {
        console.error(err);
        alert('Gagal export PDF');
      }
    }
  };

  const exportKehadiranSiswa = (type) => {
    const filtered = laporanAbsensi.filter(s => isInMonth(s.tanggal, selectedMonth));
    const bulanLabel = selectedMonth ? ` - ${formatMonthLabel(selectedMonth)}` : '';
    const selectedKelasName = selectedKelas ? (kelas.find(k => String(k.id) === String(selectedKelas))?.nama || selectedKelas) : '';
    const titleText = `Laporan Kehadiran Per-Siswa${bulanLabel}${selectedKelasName ? ' — Kelas ' + selectedKelasName : ''}`;
    const kelasLabel = selectedKelas ? '_' + selectedKelasName : '';
    const filename = `Laporan_Kehadiran_Per_Siswa${selectedMonth ? '_' + selectedMonth : ''}${kelasLabel}`;

    // Group by kelas -> mapel -> siswa
    const kelasMap = {};
    filtered.forEach(session => {
      const kelasIdRaw = session.pengampu?.kelas?.id;
      if (!kelasIdRaw) return; // skip sessions without valid class
      const kelasId = String(kelasIdRaw);
      const kelasNama = session.pengampu?.kelas?.nama || '-';
      const mapelId = session.pengampu?.mapel?.id;
      const mapelNama = session.pengampu?.mapel?.nama || '-';
      if (!kelasMap[kelasId]) {
        kelasMap[kelasId] = { id: kelasId, nama: kelasNama, mapel: {} };
      }
      const guruNama = session.pengampu?.guru?.nama || '-';
      if (!kelasMap[kelasId].mapel[mapelId]) {
        kelasMap[kelasId].mapel[mapelId] = { nama: mapelNama, guru: guruNama, siswa: {} };
      }
      session.siswaDetail.forEach(d => {
        const sid = d.siswaId;
        if (!kelasMap[kelasId].mapel[mapelId].siswa[sid]) {
          kelasMap[kelasId].mapel[mapelId].siswa[sid] = { id: sid, nama: d.siswa.nama, nis: d.siswa.nis, H: 0, S: 0, I: 0, A: 0, T: 0 };
        }
        const s = d.status?.charAt(0);
        const siswa = kelasMap[kelasId].mapel[mapelId].siswa[sid];
        if (s === 'H') siswa.H++;
        else if (s === 'S') siswa.S++;
        else if (s === 'I') siswa.I++;
        else if (s === 'A') siswa.A++;
        else if (s === 'T') siswa.T++;
      });
    });

    let kelasList = Object.values(kelasMap).sort((a, b) => a.nama.localeCompare(b.nama));
    if (selectedKelas) {
      kelasList = kelasList.filter(k => k.id === String(selectedKelas));
    }

    if (type === 'csv') {
      let csvRows = [];
      kelasList.forEach(k => {
        csvRows.push([titleText]);
        csvRows.push([`Kelas: ${k.nama}`]);
        csvRows.push([]);
        Object.values(k.mapel).sort((a, b) => a.nama.localeCompare(b.nama)).forEach(mp => {
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
        csvRows.push([]);
        csvRows.push([]);
      });
      handleExportCSV(filename, csvRows);
    } else {
      try {
        const doc = new jsPDF();
        let firstPage = true;
        kelasList.forEach(k => {
          Object.values(k.mapel).sort((a, b) => a.nama.localeCompare(b.nama)).forEach(mp => {
            if (!firstPage) doc.addPage();
            firstPage = false;

            doc.setFontSize(14);
            doc.text(titleText, 14, 15);
            doc.setFontSize(11);
            doc.text(`Kelas: ${k.nama} — Mapel: ${mp.nama}`, 14, 23);
            doc.setFontSize(10);
            doc.text(`Guru: ${mp.guru}`, 14, 29);
            doc.setFontSize(9);
            doc.text('Keterangan: H=Hadir, S=Sakit, I=Izin, A=Alpa, T=Terlambat', 14, 35);

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
              startY: 40,
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
        });
        doc.save(`${filename}.pdf`);
      } catch (err) {
        console.error(err);
        alert('Gagal export PDF');
      }
    }
  };

  const exportPiket = (type) => {
    const filtered = selectedPiketDate
      ? laporanPiket.filter(p => {
          const d = new Date(p.tanggal);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return key === selectedPiketDate;
        })
      : laporanPiket;

    const formatted = filtered.map(p => ({
      Tanggal: formatDate(p.tanggal),
      Guru: p.pengampu?.guru?.nama || '-',
      Kelas: p.pengampu?.kelas?.nama || '-',
      Mapel: p.pengampu?.mapel?.nama || '-',
      Jam: p.pengampu?.jamKe ? `Jam ke-${p.pengampu.jamKe}` : '-',
      Status: p.status === 'hadir' ? 'Hadir' : p.status === 'terlambat' ? 'Terlambat' : p.status === 'tidak_hadir' ? 'Tidak Hadir' : p.status,
      Catatan: p.catatan || '-',
      Petugas: p.piketBy?.nama || '-'
    }));

    const columns = [
      { header: 'Tanggal', key: 'Tanggal' },
      { header: 'Guru', key: 'Guru' },
      { header: 'Kelas', key: 'Kelas' },
      { header: 'Mapel', key: 'Mapel' },
      { header: 'Jam', key: 'Jam' },
      { header: 'Status', key: 'Status' },
      { header: 'Catatan', key: 'Catatan' },
      { header: 'Petugas Piket', key: 'Petugas' }
    ];

    const dateLabel = selectedPiketDate ? ` - ${selectedPiketDate}` : '';
    const title = `Rekap Kehadiran Guru di Kelas${dateLabel}`;
    const filename = `Rekap_Kehadiran_Guru${selectedPiketDate ? '_' + selectedPiketDate : ''}`;

    if (type === 'xls') {
      let csvRows = [];
      csvRows.push(['SMK NEGERI 1 ARAHAN']);
      csvRows.push(['Jl. Raya Arahan, Kabupaten Indramayu, Jawa Barat']);
      csvRows.push([]);
      csvRows.push([title]);
      csvRows.push([]);
      csvRows.push(columns.map(c => c.header));
      formatted.forEach(item => {
        csvRows.push(columns.map(c => item[c.key]));
      });

      const csv = Papa.unparse(csvRows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

        autoTable(doc, {
          startY: 40,
          head: [columns.map(c => c.header)],
          body: formatted.map(item => columns.map(c => item[c.key])),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [43, 62, 80] },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`${filename}.pdf`);
      } catch (err) {
        console.error(err);
        alert('Gagal export PDF');
      }
    }
  };

  // UI Components
  const ReportCard = ({ title, description, onPdf, onCsv, xlsLabel = false }) => (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{description}</p>
      </div>
      <div className="flex gap-2 mt-auto">
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#e74c3c' }} onClick={onPdf}>
          <FileText size={16} /> Export PDF
        </button>
        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', color: '#27ae60', borderColor: '#27ae60' }} onClick={onCsv}>
          <FileSpreadsheet size={16} /> {xlsLabel ? 'Export XLS' : 'Export CSV'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Laporan & Export Data</h1>
        <p style={{ color: 'var(--text-muted)' }}>Unduh laporan data master dan transaksional dalam format PDF (untuk cetak) atau CSV (untuk Excel).</p>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        Laporan Data Master
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReportCard 
          title="Data Guru" 
          description="Seluruh data staf pengajar beserta NIP dan username login."
          onPdf={() => exportGuru('pdf')}
          onCsv={() => exportGuru('csv')}
        />
        <ReportCard 
          title="Data Siswa" 
          description="Daftar siswa beserta kelas aktif mereka saat ini."
          onPdf={() => exportSiswa('pdf')}
          onCsv={() => exportSiswa('csv')}
        />
        <ReportCard 
          title="Data Kelas" 
          description="Daftar kelas beserta jumlah siswa dan guru pengampunya."
          onPdf={() => exportKelas('pdf')}
          onCsv={() => exportKelas('csv')}
        />
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        Laporan Transaksional
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Filter Bulan:</label>
        </div>
        <select
          className="input"
          style={{ width: 'auto', minWidth: '200px' }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Filter Kelas:</label>
        </div>
        <select
          className="input"
          style={{ width: 'auto', minWidth: '200px' }}
          value={selectedKelas}
          onChange={(e) => setSelectedKelas(e.target.value)}
        >
          <option value="">Semua Kelas</option>
          {kelas.map(k => (
            <option key={k.id} value={k.id}>{k.nama}</option>
          ))}
        </select>
        {selectedKelas && (
          <button
            onClick={() => setSelectedKelas('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}
          >
            <X size={14} /> Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReportCard
          title="Jurnal Agenda Guru"
          description="Rekap catatan jurnal mengajar guru selama satu semester."
          onPdf={() => exportAgenda('pdf')}
          onCsv={() => exportAgenda('csv')}
        />
        <ReportCard 
          title="Rekap Absensi Harian" 
          description="Daftar rekap kehadiran siswa per kelas dan per mata pelajaran."
          onPdf={() => exportAbsensi('pdf')}
          onCsv={() => exportAbsensi('csv')}
        />
        <ReportCard 
          title="Kehadiran per-Siswa" 
          description="Ringkasan kehadiran setiap siswa (Hadir/Sakit/Izin/Alpa) di semua mata pelajaran."
          onPdf={() => exportKehadiranSiswa('pdf')}
          onCsv={() => exportKehadiranSiswa('csv')}
        />
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        Laporan Petugas Piket
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <CalendarDays size={16} style={{ color: 'var(--text-muted)' }} />
          <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Filter Tanggal:</label>
        </div>
        <input
          type="date"
          className="input"
          style={{ width: 'auto', minWidth: '200px' }}
          value={selectedPiketDate}
          onChange={(e) => {
            setSelectedPiketDate(e.target.value);
            fetchLaporanPiket(e.target.value);
          }}
        />
        {selectedPiketDate && (
          <button
            onClick={() => {
              setSelectedPiketDate('');
              fetchLaporanPiket();
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}
          >
            <X size={14} /> Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReportCard 
          title="Rekap Kehadiran Guru di Kelas" 
          description="Daftar kehadiran guru berdasarkan pantauan petugas piket per hari."
          onPdf={() => exportPiket('pdf')}
          onCsv={() => exportPiket('xls')}
          xlsLabel={true}
        />
      </div>
    </div>
  );
};

export default LaporanScreen;
