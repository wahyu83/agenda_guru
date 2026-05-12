import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search, FileText, Download } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const NilaiScreen = () => {
  const { tugasId } = useParams();
  const navigate = useNavigate();
  const { tugasGuru, siswaKelasAktif, fetchSiswaKelas, saveNilai, fetchNilaiKelas, nilaiKelas } = useAppStore();

  const currentTugas = tugasGuru.find(t => t.id === parseInt(tugasId));

  const [siswa, setSiswa] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jenis, setJenis] = useState('tugas');
  const [deskripsi, setDeskripsi] = useState('');

  useEffect(() => {
    if (currentTugas?.kelasId) {
      fetchSiswaKelas(currentTugas.kelasId);
      fetchNilaiKelas(currentTugas.kelasId, currentTugas.mapelId);
    }
  }, [currentTugas, fetchSiswaKelas, fetchNilaiKelas]);

  useEffect(() => {
    if (siswaKelasAktif.length > 0) {
      const existingNilai = nilaiKelas.nilai || [];
      const formatted = siswaKelasAktif.map(s => {
        const existing = existingNilai.find(n => n.siswaId === s.id);
        return {
          id: existing?.id || null,
          siswaId: s.id,
          enrollmentId: s.enrollmentId || 0,
          nama: s.nama,
          nis: s.nis,
          nilai: existing?.nilai ?? '',
          jenis: existing?.jenis || jenis,
          deskripsi: existing?.deskripsi || '',
        };
      });
      setSiswa(formatted);
    }
  }, [siswaKelasAktif, nilaiKelas]);

  const updateNilai = (siswaId, val) => {
    setSiswa(siswa.map(s => s.siswaId === siswaId ? { ...s, nilai: val } : s));
  };

  const handleSave = async () => {
    const dataNilai = siswa
      .filter(s => s.nilai !== '' && !isNaN(parseFloat(s.nilai)))
      .map(s => ({
        siswaId: s.siswaId,
        enrollmentId: s.enrollmentId,
        jenis,
        nilai: parseFloat(s.nilai),
        tanggal,
        deskripsi,
      }));

    if (dataNilai.length === 0) {
      alert('Tidak ada nilai yang diisi.');
      return;
    }

    setIsSaving(true);
    try {
      await saveNilai(parseInt(tugasId), dataNilai);
      alert('Nilai berhasil disimpan!');
      if (currentTugas?.kelasId) {
        fetchNilaiKelas(currentTugas.kelasId, currentTugas.mapelId);
      }
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan nilai.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportPDF = () => {
    const values = nilaiKelas.nilai || [];
    if (values.length === 0) {
      alert('Tidak ada data nilai untuk diekspor.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Laporan Nilai Siswa', 14, 20);
    doc.setFontSize(10);
    doc.text(`Kelas: ${currentTugas?.kelas?.nama || '-'}`, 14, 28);
    doc.text(`Mata Pelajaran: ${currentTugas?.mapel?.nama || '-'}`, 14, 34);

    const grouped = {};
    values.forEach(v => {
      const key = v.siswaId;
      if (!grouped[key]) grouped[key] = { siswa: v.siswa, data: [] };
      grouped[key].data.push(v);
    });

    const rows = [];
    Object.values(grouped).forEach(g => {
      g.data.forEach((n, idx) => {
        rows.push([
          idx === 0 ? g.siswa?.nama || '-' : '',
          idx === 0 ? g.siswa?.nis || '-' : '',
          n.jenis === 'ulangan' ? 'Ulangan' : 'Tugas',
          n.nilai,
          n.tanggal ? new Date(n.tanggal).toLocaleDateString('id-ID') : '-',
          n.deskripsi || '-',
        ]);
      });
    });

    doc.autoTable({
      startY: 40,
      head: [['Nama', 'NIS', 'Jenis', 'Nilai', 'Tanggal', 'Deskripsi']],
      body: rows,
      styles: { fontSize: 8 },
    });

    doc.save(`nilai-${currentTugas?.kelas?.nama || 'kelas'}-${currentTugas?.mapel?.nama || 'mapel'}.pdf`);
  };

  const exportCSV = () => {
    const values = nilaiKelas.nilai || [];
    if (values.length === 0) {
      alert('Tidak ada data nilai untuk diekspor.');
      return;
    }

    const header = 'Nama,NIS,Jenis,Nilai,Tanggal,Deskripsi\n';
    const rows = values.map(n => {
      const nama = `"${(n.siswa?.nama || '').replace(/"/g, '""')}"`;
      const nis = `"${(n.siswa?.nis || '').replace(/"/g, '""')}"`;
      const j = n.jenis === 'ulangan' ? 'Ulangan' : 'Tugas';
      const d = `"${(n.deskripsi || '').replace(/"/g, '""')}"`;
      return `${nama},${nis},${j},${n.nilai},${n.tanggal ? new Date(n.tanggal).toLocaleDateString('id-ID') : '-'},${d}`;
    }).join('\n');

    const csv = header + rows;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nilai-${currentTugas?.kelas?.nama || 'kelas'}-${currentTugas?.mapel?.nama || 'mapel'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/guru')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Input Nilai</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {currentTugas ? `${currentTugas.kelas?.nama} - ${currentTugas.mapel?.nama}` : 'Memuat data...'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
        <button onClick={() => navigate(`/guru/agenda/${tugasId}`)} style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500' }}>
          Agenda
        </button>
        <button onClick={() => navigate(`/guru/absensi/${tugasId}`)} style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500' }}>
          Absensi
        </button>
        <button style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', borderBottom: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: '600' }}>
          Nilai
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Tanggal</label>
            <input type="date" className="input w-full" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Jenis</label>
            <select className="input w-full" value={jenis} onChange={(e) => setJenis(e.target.value)}>
              <option value="tugas">Tugas</option>
              <option value="ulangan">Ulangan Harian</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Deskripsi (Judul Tugas/Ulangan)</label>
          <input type="text" className="input w-full" placeholder="Contoh: Bab 3 - Trigonometri" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <input type="text" className="input w-full" placeholder="Cari siswa..." style={{ paddingLeft: '2.5rem' }}
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      <div className="flex flex-col gap-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {siswa.filter(s => s.nama.toLowerCase().includes(search.toLowerCase())).map((s) => (
          <div key={s.siswaId} className="card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontWeight: '600', fontSize: '0.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nama}</h4>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.nis}</p>
            </div>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="0-100"
              value={s.nilai}
              onChange={(e) => updateNilai(s.siswaId, e.target.value)}
              className="input"
              style={{ width: '80px', textAlign: 'center', padding: '0.5rem', fontSize: '0.875rem' }}
            />
          </div>
        ))}
        {siswa.length === 0 && (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada siswa terdaftar di kelas ini.</div>
        )}
      </div>

      <div className="flex gap-2" style={{ marginTop: '1rem' }}>
        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex-1" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
          <Save size={18} /> {isSaving ? 'Menyimpan...' : 'Simpan Nilai'}
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '4rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Ekspor Nilai</h3>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="btn btn-secondary flex-1" style={{ padding: '0.75rem' }}>
            <FileText size={18} /> PDF
          </button>
          <button onClick={exportCSV} className="btn btn-secondary flex-1" style={{ padding: '0.75rem' }}>
            <Download size={18} /> CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default NilaiScreen;
