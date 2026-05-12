import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../lib/store';
import { Book, CheckCircle, Clock, Download, FileText, FileSpreadsheet, Edit, Trash2, X, BarChart3 } from 'lucide-react';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const RiwayatScreen = () => {
  const navigate = useNavigate();
  const { user, riwayatGuru, fetchRiwayatGuru, updateAgenda, deleteAgenda, deleteAbsensi, updateNilai, deleteNilai, fetchRiwayatNilai } = useAppStore();
  const [activeTab, setActiveTab] = useState('agenda');
  
  // Modal Edit Agenda State
  const [showEditAgenda, setShowEditAgenda] = useState(false);
  const [editAgendaData, setEditAgendaData] = useState({ id: null, materi: '', deskripsi: '', catatan: '' });

  // Modal Edit Nilai State
  const [showEditNilai, setShowEditNilai] = useState(false);
  const [editNilaiData, setEditNilaiData] = useState({ id: null, jenis: 'tugas', nilai: '', deskripsi: '' });

  useEffect(() => {
    if (user?.id) {
      fetchRiwayatGuru(user.id);
      fetchRiwayatNilai(user.id);
    }
  }, [user, fetchRiwayatGuru, fetchRiwayatNilai]);

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

  // --- CSV WITH HEADER ---
  const handleExportCSVWithHeader = (filename, title, columns, data) => {
    let csvRows = [];
    csvRows.push(['SMK NEGERI 1 ARAHAN']);
    csvRows.push(['Jl. Raya Arahan, Kabupaten Indramayu, Jawa Barat']);
    csvRows.push([]);
    csvRows.push([title]);
    csvRows.push([`Guru: ${user?.nama || '-'}`]);
    csvRows.push([]);
    csvRows.push(columns.map(c => c.header));
    data.forEach(item => {
      csvRows.push(columns.map(c => item[c.key] !== undefined ? item[c.key] : ''));
    });
    handleExportCSV(filename, csvRows);
  };

  // --- PDF EXPORT LOGIC ---
  const handleExportPDF = (filename, title, columns, data) => {
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
      return { kelas: group.pengampu.kelas.nama, mapel: group.pengampu.mapel.nama, guru: user?.nama || '-', dates, matrixData };
    });

    if (type === 'csv') {
      let csvRows = [];
      matrices.forEach(m => {
        csvRows.push(['Buku Rekapitulasi Absensi Kelas']);
        csvRows.push([`Kelas: ${m.kelas}    Mapel: ${m.mapel}    Guru: ${m.guru}`]);
        csvRows.push(['Keterangan: H=Hadir, S=Sakit, I=Izin, A=Alpa']);
        csvRows.push([]);
        const headerRow = ['No', 'Nama Siswa', ...m.dates, 'H', 'S', 'I', 'A'];
        csvRows.push(headerRow);
        m.matrixData.forEach(row => {
          const dataRow = [row.No, row.Nama];
          m.dates.forEach(date => { dataRow.push(row[date] || '-'); });
          dataRow.push(row.H, row.S, row.I, row.A);
          csvRows.push(dataRow);
        });
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
            columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 1: { halign: 'left', cellWidth: 45 } }
          });
        });
        doc.save('Riwayat_Absensi_Matrix.pdf');
      } catch (err) { console.error(err); alert('Gagal export PDF'); }
    }
  };

  // --- NILAI EXPORT (Rekap Matrix) ---
  const exportNilai = (type) => {
    const nilai = riwayatGuru.nilai || [];
    if (nilai.length === 0) {
      alert('Tidak ada data nilai untuk diekspor.');
      return;
    }

    // Group by kelas + mapel (pengampu)
    const groups = {};
    nilai.forEach(n => {
      const key = `${n.pengampu?.kelasId || n.pengampu?.kelas?.id}-${n.pengampu?.mapelId || n.pengampu?.mapel?.id}`;
      if (!groups[key]) {
        groups[key] = {
          kelas: n.pengampu?.kelas?.nama || '-',
          mapel: n.pengampu?.mapel?.nama || '-',
          siswaMap: new Map(),
          deskripsiSet: new Set(),
          deskripsiList: []
        };
      }
      const g = groups[key];
      if (!g.siswaMap.has(n.siswaId)) {
        g.siswaMap.set(n.siswaId, { siswa: n.siswa, nilaiMap: new Map() });
      }
      const descKey = `${n.jenis}|${n.deskripsi || '-'}|${formatDate(n.tanggal)}`;
      if (!g.deskripsiSet.has(descKey)) {
        g.deskripsiSet.add(descKey);
        g.deskripsiList.push({ key: descKey, jenis: n.jenis, deskripsi: n.deskripsi || '-', tanggal: formatDate(n.tanggal) });
      }
      g.siswaMap.get(n.siswaId).nilaiMap.set(descKey, n.nilai);
    });

    const matrices = Object.values(groups).map(g => {
      const students = Array.from(g.siswaMap.values())
        .sort((a, b) => String(a.siswa.nis).localeCompare(String(b.siswa.nis), undefined, { numeric: true }));
      const matrixData = students.map((s, idx) => {
        const row = { No: idx + 1, Nama: s.siswa.nama, NIS: s.siswa.nis };
        let total = 0, count = 0;
        g.deskripsiList.forEach(d => {
          const val = s.nilaiMap.get(d.key);
          row[d.key] = val !== undefined ? val : '-';
          if (val !== undefined) { total += val; count++; }
        });
        row['Rata'] = count > 0 ? (total / count).toFixed(1) : '-';
        return row;
      });
      return { kelas: g.kelas, mapel: g.mapel, deskripsiList: g.deskripsiList, matrixData };
    });

    if (type === 'csv') {
      let csvRows = [];
      matrices.forEach(m => {
        csvRows.push(['SMK NEGERI 1 ARAHAN']);
        csvRows.push(['Jl. Raya Arahan, Kabupaten Indramayu, Jawa Barat']);
        csvRows.push([]);
        csvRows.push(['Rekap Nilai Siswa']);
        csvRows.push([`Kelas: ${m.kelas}    Mapel: ${m.mapel}    Guru: ${user?.nama || '-'}`]);
        csvRows.push([]);
        const headerRow = ['No', 'Nama', 'NIS', ...m.deskripsiList.map(d => `${d.jenis === 'ulangan' ? 'UH' : 'TG'}: ${d.deskripsi}`), 'Rata-rata'];
        csvRows.push(headerRow);
        m.matrixData.forEach(row => {
          const dataRow = [row.No, row.Nama, row.NIS];
          m.deskripsiList.forEach(d => { dataRow.push(row[d.key]); });
          dataRow.push(row['Rata']);
          csvRows.push(dataRow);
        });
        csvRows.push([]);
        csvRows.push([]);
      });
      handleExportCSV('Rekap_Nilai_Siswa', csvRows);
    } else {
      try {
        const doc = new jsPDF('landscape');
        matrices.forEach((m, index) => {
          if (index > 0) doc.addPage();
          doc.setFontSize(14);
          doc.text('Rekap Nilai Siswa', 14, 15);
          doc.setFontSize(10);
          doc.text(`Kelas: ${m.kelas}    Mapel: ${m.mapel}    Guru: ${user?.nama || '-'}`, 14, 22);
          const columns = [
            { header: 'No', key: 'No' },
            { header: 'Nama', key: 'Nama' },
            { header: 'NIS', key: 'NIS' },
            ...m.deskripsiList.map(d => ({ header: d.deskripsi.length > 8 ? d.deskripsi.substring(0, 8) + '...' : d.deskripsi, key: d.key })),
            { header: 'Rata', key: 'Rata' }
          ];
          autoTable(doc, {
            startY: 28,
            theme: 'grid',
            head: [columns.map(c => c.header)],
            body: m.matrixData.map(item => columns.map(c => item[c.key] !== undefined ? item[c.key] : '')),
            styles: { fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.1 },
            headStyles: { fillColor: [43, 62, 80], halign: 'center' },
            bodyStyles: { halign: 'center' },
            columnStyles: { 0: { cellWidth: 8 }, 1: { halign: 'left', cellWidth: 35 }, 2: { cellWidth: 20 } }
          });
        });
        doc.save('Rekap_Nilai_Siswa.pdf');
      } catch (err) { console.error(err); alert('Gagal export PDF'); }
    }
  };

  const handleEditAgendaSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateAgenda(editAgendaData.id, { materi: editAgendaData.materi, deskripsi: editAgendaData.deskripsi, catatan: editAgendaData.catatan });
      setShowEditAgenda(false);
      fetchRiwayatGuru(user.id);
      alert('Agenda berhasil diupdate!');
    } catch (error) { alert('Gagal update agenda'); }
  };

  const handleDeleteAgenda = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus agenda ini secara permanen?')) {
      try { await deleteAgenda(id); fetchRiwayatGuru(user.id); } catch (err) { alert('Gagal menghapus agenda'); }
    }
  };

  const handleDeleteAbsensi = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus rekap absensi ini secara permanen?')) {
      try { await deleteAbsensi(id); fetchRiwayatGuru(user.id); } catch (err) { alert('Gagal menghapus absensi'); }
    }
  };

  const handleEditNilaiSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateNilai(editNilaiData.id, { jenis: editNilaiData.jenis, nilai: parseFloat(editNilaiData.nilai), deskripsi: editNilaiData.deskripsi });
      setShowEditNilai(false);
      fetchRiwayatNilai(user.id);
      alert('Nilai berhasil diupdate!');
    } catch (error) { alert('Gagal update nilai'); }
  };

  const handleDeleteNilai = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus nilai ini?')) {
      try { await deleteNilai(id); fetchRiwayatNilai(user.id); } catch (err) { alert('Gagal menghapus nilai'); }
    }
  };

  const activeExport = activeTab === 'agenda' ? exportAgenda : activeTab === 'absensi' ? exportAbsensi : exportNilai;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Riwayat Mengajar</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Catatan jurnal agenda, absensi, dan nilai Anda.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => activeExport('pdf')} className="btn btn-primary" style={{ padding: '0.5rem', backgroundColor: '#e74c3c', border: 'none' }} title="Export PDF">
            <FileText size={16} />
          </button>
          <button onClick={() => activeExport('csv')} className="btn btn-secondary" style={{ padding: '0.5rem', color: '#27ae60', borderColor: '#27ae60' }} title="Export CSV">
            <FileSpreadsheet size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
        {['agenda', 'absensi', 'nilai'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === tab ? '600' : '500', fontSize: '0.8125rem' }}
          >
            {tab === 'agenda' ? 'Jurnal Agenda' : tab === 'absensi' ? 'Riwayat Absensi' : 'Nilai'}
          </button>
        ))}
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
                    <button onClick={() => { setEditAgendaData({ id: item.id, materi: item.materi, deskripsi: item.deskripsi, catatan: item.catatan || '' }); setShowEditAgenda(true); }}
                      className="text-info hover:text-primary transition-colors bg-transparent border-none cursor-pointer"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteAgenda(item.id)}
                      className="text-danger hover:opacity-80 transition-colors bg-transparent border-none cursor-pointer"><Trash2 size={18} /></button>
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
                    <button onClick={() => navigate(`/guru/absensi-edit/${item.id}`)}
                      className="text-info hover:text-primary transition-colors bg-transparent border-none cursor-pointer"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteAbsensi(item.id)}
                      className="text-danger hover:opacity-80 transition-colors bg-transparent border-none cursor-pointer"><Trash2 size={18} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-success mt-2">
                  <CheckCircle size={16} /> <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Absensi telah diisi</span>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'nilai' && (
          (riwayatGuru.nilai || []).length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BarChart3 size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
              Belum ada riwayat nilai.
            </div>
          ) : (
            (riwayatGuru.nilai || []).map((item) => (
              <div key={item.id} className="card" style={{ padding: '0.75rem' }}>
                <div className="flex justify-between items-start">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--primary)' }}>
                      {item.pengampu?.kelas?.nama} - {item.pengampu?.mapel?.nama}
                    </h3>
                    <div className="flex items-center gap-3" style={{ marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {formatDate(item.tanggal)}
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: item.jenis === 'ulangan' ? 'var(--warning)20' : 'var(--info)20', color: item.jenis === 'ulangan' ? 'var(--warning)' : 'var(--info)', fontWeight: '600' }}>
                        {item.jenis === 'ulangan' ? 'Ulangan Harian' : 'Tugas'}
                      </span>
                      {item.deskripsi && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.deskripsi}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                      {item.siswa?.nama} ({item.siswa?.nis}) — <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{item.nilai}</strong>
                    </p>
                  </div>
                  <div className="flex gap-2" style={{ flexShrink: 0, marginLeft: '0.5rem' }}>
                    <button onClick={() => { setEditNilaiData({ id: item.id, jenis: item.jenis, nilai: item.nilai, deskripsi: item.deskripsi || '' }); setShowEditNilai(true); }}
                      className="text-info hover:text-primary transition-colors bg-transparent border-none cursor-pointer"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteNilai(item.id)}
                      className="text-danger hover:opacity-80 transition-colors bg-transparent border-none cursor-pointer"><Trash2 size={16} /></button>
                  </div>
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
                <input type="text" className="input" value={editAgendaData.materi}
                  onChange={(e) => setEditAgendaData({...editAgendaData, materi: e.target.value})} required />
              </div>
              <div>
                <label className="label">Deskripsi Kegiatan</label>
                <textarea className="input" rows="3" value={editAgendaData.deskripsi}
                  onChange={(e) => setEditAgendaData({...editAgendaData, deskripsi: e.target.value})} required />
              </div>
              <div>
                <label className="label">Catatan Tambahan (Opsional)</label>
                <textarea className="input" rows="2" value={editAgendaData.catatan}
                  onChange={(e) => setEditAgendaData({...editAgendaData, catatan: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3" style={{ marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEditAgenda(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Nilai */}
      {showEditNilai && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Edit Nilai</h2>
              <button onClick={() => setShowEditNilai(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-muted)" />
              </button>
            </div>
            <form onSubmit={handleEditNilaiSubmit} className="flex flex-col gap-4">
              <div>
                <label className="label">Jenis</label>
                <select className="input" value={editNilaiData.jenis} onChange={(e) => setEditNilaiData({...editNilaiData, jenis: e.target.value})}>
                  <option value="tugas">Tugas</option>
                  <option value="ulangan">Ulangan Harian</option>
                </select>
              </div>
              <div>
                <label className="label">Nilai</label>
                <input type="number" min="0" max="100" className="input" value={editNilaiData.nilai}
                  onChange={(e) => setEditNilaiData({...editNilaiData, nilai: e.target.value})} required />
              </div>
              <div>
                <label className="label">Deskripsi</label>
                <input type="text" className="input" value={editNilaiData.deskripsi}
                  onChange={(e) => setEditNilaiData({...editNilaiData, deskripsi: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3" style={{ marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEditNilai(false)} className="btn btn-secondary">Batal</button>
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
