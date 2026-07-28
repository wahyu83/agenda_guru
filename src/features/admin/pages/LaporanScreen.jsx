import React from 'react';
import { Download, FileText, FileSpreadsheet, Users } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const LaporanScreen = () => {
  const { guru, mapel, kelas, siswa, tahunPelajaran, laporanAgenda, laporanAbsensi, fetchLaporanAgenda, fetchLaporanAbsensi } = useAppStore();
  const tahunAktif = tahunPelajaran.find(t => t.isActive);

  React.useEffect(() => {
    fetchLaporanAgenda();
    fetchLaporanAbsensi();
  }, [fetchLaporanAgenda, fetchLaporanAbsensi]);

  // --- REKAP ABSENSI PER KELAS ---
  const rekapAbsensiPerKelas = React.useMemo(() => {
    const map = {};
    laporanAbsensi.forEach(session => {
      const kelasNama = session.pengampu?.kelas?.nama || '-';
      const kelasId = session.pengampu?.kelas?.id;
      if (!map[kelasId]) {
        map[kelasId] = { kelas: kelasNama, H: 0, S: 0, I: 0, A: 0 };
      }
      session.siswaDetail.forEach(d => {
        const s = d.status?.charAt(0);
        if (s === 'H') map[kelasId].H++;
        else if (s === 'S') map[kelasId].S++;
        else if (s === 'I') map[kelasId].I++;
        else if (s === 'A') map[kelasId].A++;
      });
    });
    return Object.values(map).sort((a, b) => a.kelas.localeCompare(b.kelas));
  }, [laporanAbsensi]);

  const rekapAbsensiPerKelasDetail = React.useMemo(() => {
    const map = {};
    laporanAbsensi.forEach(session => {
      const kelasNama = session.pengampu?.kelas?.nama || '-';
      const kelasId = session.pengampu?.kelas?.id;
      const mapelNama = session.pengampu?.mapel?.nama || '-';
      const key = `${kelasId}_${session.pengampuId}`;
      if (!map[key]) {
        map[key] = { kelas: kelasNama, mapel: mapelNama, H: 0, S: 0, I: 0, A: 0 };
      }
      session.siswaDetail.forEach(d => {
        const s = d.status?.charAt(0);
        if (s === 'H') map[key].H++;
        else if (s === 'S') map[key].S++;
        else if (s === 'I') map[key].I++;
        else if (s === 'A') map[key].A++;
      });
    });
    return Object.values(map).sort((a, b) => a.kelas.localeCompare(b.kelas) || a.mapel.localeCompare(b.mapel));
  }, [laporanAbsensi]);

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
    const formatted = laporanAgenda.map(a => ({
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

    if (type === 'csv') {
      handleExportCSVWithHeader('Laporan_Agenda', 'Jurnal Agenda Mengajar', columns, formatted);
    } else {
      handleExportPDF('Laporan_Agenda', 'Jurnal Agenda Mengajar', columns, formatted);
    }
  };

  const exportAbsensi = (type) => {
    // 1. Grouping Data (Matrix Transformation)
    const groups = {};
    laporanAbsensi.forEach(session => {
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
      // Sort sessions ASC
      group.sessions.sort((a, b) => a.rawDate - b.rawDate);
      const dates = group.sessions.map(s => s.tanggal);
      const students = Array.from(group.siswaMap.values()).sort((a, b) => String(a.nis).localeCompare(String(b.nis), undefined, { numeric: true }));
      
      const matrixData = students.map((siswa, index) => {
        const row = { No: index + 1, Nama: siswa.nama };
        let h = 0, s = 0, i = 0, a = 0;
        group.sessions.forEach(session => {
          const detail = session.details.find(d => d.siswaId === siswa.id);
          const statusChar = detail ? detail.status.charAt(0) : '-';
          row[session.tanggal] = statusChar;
          if (statusChar === 'H') h++;
          if (statusChar === 'S') s++;
          if (statusChar === 'I') i++;
          if (statusChar === 'A') a++;
        });
        row['H'] = h;
        row['S'] = s;
        row['I'] = i;
        row['A'] = a;
        return row;
      });

      return {
        kelas: group.pengampu.kelas.nama,
        mapel: group.pengampu.mapel.nama,
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
        csvRows.push(['Laporan Rekapitulasi Absensi Siswa']);
        csvRows.push([`Kelas: ${m.kelas}    Mapel: ${m.mapel}    Guru: ${m.guru}`]);
        csvRows.push(['Keterangan: H=Hadir, S=Sakit, I=Izin, A=Alpa']);
        csvRows.push([]); // Spacer

        // Table Header
        const headerRow = ['No', 'Nama Siswa', ...m.dates, 'H', 'S', 'I', 'A'];
        csvRows.push(headerRow);

        // Data Rows
        m.matrixData.forEach(row => {
          const dataRow = [row.No, row.Nama];
          // Fill date columns
          m.dates.forEach(date => {
            dataRow.push(row[date] || '-');
          });
          // Fill H, S, I, A
          dataRow.push(row.H, row.S, row.I, row.A);
          csvRows.push(dataRow);
        });

        // Add spacers between matrices
        csvRows.push([]);
        csvRows.push([]);
      });

      handleExportCSV('Laporan_Absensi_Matrix', csvRows);
    }
 else {
      try {
        // Landscape orientation for many columns
        const doc = new jsPDF('landscape');
        
        matrices.forEach((m, index) => {
          if (index > 0) doc.addPage();
          
          doc.setFontSize(14);
          doc.text('Laporan Rekapitulasi Absensi Siswa', 14, 15);
          doc.setFontSize(10);
          doc.text(`Kelas: ${m.kelas}    Mapel: ${m.mapel}    Guru: ${m.guru}`, 14, 22);
          doc.text('Keterangan: H=Hadir, S=Sakit, I=Izin, A=Alpa', 14, 27);
          
          const columns = [
            { header: 'No', key: 'No' },
            { header: 'Nama Siswa', key: 'Nama' },
            ...m.dates.map(d => ({ header: d.split('/').join('\n'), key: d })),
            { header: 'H', key: 'H' },
            { header: 'S', key: 'S' },
            { header: 'I', key: 'I' },
            { header: 'A', key: 'A' }
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

        doc.save('Laporan_Absensi_Matrix.pdf');
      } catch (err) {
        console.error(err);
        alert('Gagal export PDF');
      }
    }
  };

  // UI Components
  const ReportCard = ({ title, description, onPdf, onCsv }) => (
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
          <FileSpreadsheet size={16} /> Export CSV
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

      {/* REKAP ABSENSI PER KELAS */}
      {rekapAbsensiPerKelas.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} /> Rekap Absensi Per Kelas
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Total kehadiran siswa dirangkum per kelas (H=Hadir, S=Sakit, I=Izin, A=Alpa)</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-hover)' }}>
                  <th style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Kelas</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>Mapel</th>
                  <th style={{ padding: '0.75rem', color: 'var(--secondary-hover)', fontWeight: '600', textAlign: 'center' }}>Hadir</th>
                  <th style={{ padding: '0.75rem', color: 'var(--warning)', fontWeight: '600', textAlign: 'center' }}>Sakit</th>
                  <th style={{ padding: '0.75rem', color: 'var(--info)', fontWeight: '600', textAlign: 'center' }}>Izin</th>
                  <th style={{ padding: '0.75rem', color: 'var(--danger)', fontWeight: '600', textAlign: 'center' }}>Alpa</th>
                </tr>
              </thead>
              <tbody>
                {rekapAbsensiPerKelasDetail.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: '500' }}>{row.kelas}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{row.mapel}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: 'var(--secondary-hover)' }}>{row.H}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: 'var(--warning)' }}>{row.S}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: 'var(--info)' }}>{row.I}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: 'var(--danger)' }}>{row.A}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--surface-hover)', fontWeight: 'bold' }}>
                  <td style={{ padding: '0.75rem 1.5rem' }} colSpan={2}>TOTAL</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--secondary-hover)' }}>
                    {rekapAbsensiPerKelas.reduce((s, r) => s + r.H, 0)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--warning)' }}>
                    {rekapAbsensiPerKelas.reduce((s, r) => s + r.S, 0)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--info)' }}>
                    {rekapAbsensiPerKelas.reduce((s, r) => s + r.I, 0)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--danger)' }}>
                    {rekapAbsensiPerKelas.reduce((s, r) => s + r.A, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </div>
  );
};

export default LaporanScreen;
