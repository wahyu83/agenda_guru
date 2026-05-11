import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../lib/store';
import { Book, CheckCircle, Clock, Download, FileText, FileSpreadsheet, Edit, Trash2, X } from 'lucide-react';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const RiwayatScreen = () => {
  const navigate = useNavigate();
  const { user, riwayatGuru, fetchRiwayatGuru, updateAgenda, deleteAgenda, deleteAbsensi } = useAppStore();
  const [activeTab, setActiveTab] = useState('agenda');
  
  // Modal Edit Agenda State
  const [showEditAgenda, setShowEditAgenda] = useState(false);
  const [editAgendaData, setEditAgendaData] = useState({ id: null, materi: '', deskripsi: '', catatan: '' });

  useEffect(() => {
    if (user?.id) {
      fetchRiwayatGuru(user.id);
    }
  }, [user, fetchRiwayatGuru]);

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
    csvRows.push([`Guru: ${user?.nama || '-'}`]);
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
      
      // Header Kop Sekolah
      doc.setFontSize(16);
      doc.text('SMK NEGERI 1 ARAHAN', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Jl. Raya Arahan, Kabupaten Indramayu, Jawa Barat', 105, 22, { align: 'center' });
      doc.line(14, 25, 196, 25);
      
      doc.setFontSize(14);
      doc.text(title, 14, 35);
      doc.setFontSize(10);
      doc.text(`Guru: ${user?.nama || '-'}`, 14, 42);
      
      autoTable(doc, {
        startY: 47,
        head: [columns.map(c => c.header)],
        body: data.map(item => columns.map(c => item[c.key])),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [43, 62, 80] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error("Export PDF Error:", error);
      alert("Terjadi kesalahan saat membuat PDF.");
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
    const formatted = riwayatGuru.agenda.map(a => ({
      Tanggal: formatDate(a.tanggal),
      Kelas: a.pengampu?.kelas?.nama,
      Mapel: a.pengampu?.mapel?.nama,
      Materi: a.materi,
      Deskripsi: a.deskripsi
    }));
    const columns = [
      { header: 'Tanggal', key: 'Tanggal' },
      { header: 'Kelas', key: 'Kelas' },
      { header: 'Mapel', key: 'Mapel' },
      { header: 'Materi', key: 'Materi' },
      { header: 'Deskripsi', key: 'Deskripsi' }
    ];

    if (type === 'csv') {
      handleExportCSVWithHeader('Riwayat_Agenda_Pribadi', 'Riwayat Jurnal Agenda Pribadi', columns, formatted);
    } else {
      handleExportPDF('Riwayat_Agenda_Pribadi', 'Riwayat Jurnal Agenda Pribadi', columns, formatted);
    }
  };

  const exportAbsensi = (type) => {
    // 1. Grouping Data (Matrix Transformation)
    const groups = {};
    riwayatGuru.absensi.forEach(session => {
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
        guru: user?.nama || '-',
        dates,
        matrixData
      };
    });

    if (type === 'csv') {
      // Create a matrix-style CSV matching PDF layout
      let csvRows = [];
      matrices.forEach(m => {
        // Header info matching PDF
        csvRows.push(['Buku Rekapitulasi Absensi Kelas']);
        csvRows.push([`Kelas: ${m.kelas}    Mapel: ${m.mapel}    Guru: ${m.guru}`]);
        csvRows.push(['Keterangan: H=Hadir, S=Sakit, I=Izin, A=Alpa']);
        csvRows.push([]); // Spacer

        // Table Header
        const headerRow = ['No', 'Nama Siswa', ...m.dates, 'H', 'S', 'I', 'A'];
        csvRows.push(headerRow);

        // Data Rows
        m.matrixData.forEach(row => {
          const dataRow = [row.No, row.Nama];
          m.dates.forEach(date => {
            dataRow.push(row[date] || '-');
          });
          dataRow.push(row.H, row.S, row.I, row.A);
          csvRows.push(dataRow);
        });

        // Spacers between matrices
        csvRows.push([]);
        csvRows.push([]);
      });
      handleExportCSV('Riwayat_Absensi_Matrix', csvRows);
    } else {
      try {
        const doc = new jsPDF('landscape');
        
        matrices.forEach((m, index) => {
          if (index > 0) doc.addPage();
          
          doc.setFontSize(14);
          doc.text('Buku Rekapitulasi Absensi Kelas', 14, 15);
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

        doc.save('Riwayat_Absensi_Matrix.pdf');
      } catch (err) {
        console.error(err);
        alert('Gagal export PDF');
      }
    }
  };

  const handleEditAgendaSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateAgenda(editAgendaData.id, {
        materi: editAgendaData.materi,
        deskripsi: editAgendaData.deskripsi,
        catatan: editAgendaData.catatan
      });
      setShowEditAgenda(false);
      fetchRiwayatGuru(user.id);
      alert('Agenda berhasil diupdate!');
    } catch (error) {
      alert('Gagal update agenda');
    }
  };

  const handleDeleteAgenda = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus agenda ini secara permanen?')) {
      try {
        await deleteAgenda(id);
        fetchRiwayatGuru(user.id);
      } catch (err) {
        alert('Gagal menghapus agenda');
      }
    }
  };

  const handleDeleteAbsensi = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus rekap absensi ini secara permanen?')) {
      try {
        await deleteAbsensi(id);
        fetchRiwayatGuru(user.id);
      } catch (err) {
        alert('Gagal menghapus absensi');
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Riwayat Mengajar</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Catatan jurnal agenda dan absensi Anda.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => activeTab === 'agenda' ? exportAgenda('pdf') : exportAbsensi('pdf')}
            className="btn btn-primary" style={{ padding: '0.5rem', backgroundColor: '#e74c3c', border: 'none' }} title="Export PDF"
          >
            <FileText size={16} />
          </button>
          <button 
            onClick={() => activeTab === 'agenda' ? exportAgenda('csv') : exportAbsensi('csv')}
            className="btn btn-secondary" style={{ padding: '0.5rem', color: '#27ae60', borderColor: '#27ae60' }} title="Export CSV"
          >
            <FileSpreadsheet size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('agenda')}
          style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', borderBottom: activeTab === 'agenda' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'agenda' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'agenda' ? '600' : '500' }}
        >
          Jurnal Agenda
        </button>
        <button 
          onClick={() => setActiveTab('absensi')}
          style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', borderBottom: activeTab === 'absensi' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'absensi' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'absensi' ? '600' : '500' }}
        >
          Riwayat Absensi
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {activeTab === 'agenda' && (
          riwayatGuru.agenda.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada riwayat agenda.</div>
          ) : (
            riwayatGuru.agenda.map((item) => (
              <div key={item.id} className="card" style={{ padding: '1rem' }}>
                <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--primary)' }}>{item.pengampu?.kelas?.nama} - {item.pengampu?.mapel?.nama}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {formatDate(item.tanggal)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditAgendaData({ id: item.id, materi: item.materi, deskripsi: item.deskripsi, catatan: item.catatan || '' });
                        setShowEditAgenda(true);
                      }}
                      className="text-info hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteAgenda(item.id)}
                      className="text-danger hover:opacity-80 transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{item.materi}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{item.deskripsi}</p>
              </div>
            ))
          )
        )}

        {activeTab === 'absensi' && (
          riwayatGuru.absensi.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada riwayat absensi.</div>
          ) : (
            riwayatGuru.absensi.map((item) => (
              <div key={item.id} className="card" style={{ padding: '1rem' }}>
                <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--primary)' }}>{item.pengampu?.kelas?.nama} - {item.pengampu?.mapel?.nama}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {formatDate(item.tanggal)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/guru/absensi-edit/${item.id}`)}
                      className="text-info hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteAbsensi(item.id)}
                      className="text-danger hover:opacity-80 transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-success mt-2">
                  <CheckCircle size={16} /> <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Absensi telah diisi</span>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Modal Edit Agenda */}
      {showEditAgenda && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Edit Agenda</h2>
              <button onClick={() => setShowEditAgenda(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-muted)" />
              </button>
            </div>
            <form onSubmit={handleEditAgendaSubmit} className="flex flex-col gap-4">
              <div>
                <label className="label">Materi Pokok</label>
                <input 
                  type="text" 
                  className="input" 
                  value={editAgendaData.materi}
                  onChange={(e) => setEditAgendaData({...editAgendaData, materi: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="label">Deskripsi Kegiatan</label>
                <textarea 
                  className="input" 
                  rows="3"
                  value={editAgendaData.deskripsi}
                  onChange={(e) => setEditAgendaData({...editAgendaData, deskripsi: e.target.value})}
                  required 
                ></textarea>
              </div>
              <div>
                <label className="label">Catatan Tambahan (Opsional)</label>
                <textarea 
                  className="input" 
                  rows="2"
                  value={editAgendaData.catatan}
                  onChange={(e) => setEditAgendaData({...editAgendaData, catatan: e.target.value})}
                ></textarea>
              </div>
              <div className="flex justify-end gap-3" style={{ marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEditAgenda(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiwayatScreen;
