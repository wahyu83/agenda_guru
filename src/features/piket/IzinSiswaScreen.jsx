import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Plus, Trash2, FileText, Clock, ArrowRight, ArrowLeft, X, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

const formatDateISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const IzinSiswaScreen = () => {
  const { user, kelas, siswaKelasAktif, permohonanIzin, fetchSiswaKelas, fetchPermohonanIzin, createPermohonanIzin, deletePermohonanIzin } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [selectedSiswaId, setSelectedSiswaId] = useState('');
  const [jenisIzin, setJenisIzin] = useState('keluar');
  const [jam, setJam] = useState('');
  const [alasan, setAlasan] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const todayStr = formatDateISO(new Date());

  useEffect(() => {
    fetchPermohonanIzin(todayStr);
  }, [fetchPermohonanIzin, todayStr]);

  useEffect(() => {
    if (selectedKelasId) {
      fetchSiswaKelas(parseInt(selectedKelasId));
    }
  }, [fetchSiswaKelas, selectedKelasId]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const siswaOptions = useMemo(() => {
    return siswaKelasAktif || [];
  }, [siswaKelasAktif]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSiswaId || !selectedKelasId || !jam || !alasan) {
      setToast({ type: 'error', message: 'Semua field wajib diisi' });
      return;
    }
    setSaving(true);
    try {
      await createPermohonanIzin({
        siswaId: parseInt(selectedSiswaId),
        kelasId: parseInt(selectedKelasId),
        jenisIzin,
        tanggal: todayStr,
        jam,
        alasan,
        guruPiketId: user.id
      });
      setToast({ type: 'success', message: 'Permohonan izin berhasil dibuat' });
      setShowForm(false);
      setSelectedKelasId('');
      setSelectedSiswaId('');
      setJam('');
      setAlasan('');
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Gagal menyimpan' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus permohonan izin ini?')) return;
    try {
      await deletePermohonanIzin(id);
      setToast({ type: 'success', message: 'Berhasil dihapus' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Gagal menghapus' });
    }
  };

  // Generate PDF using jsPDF (80mm thermal receipt)
  const generateIzinPDF = (item) => {
    try {
      const doc = new jsPDF({
        unit: 'mm',
        format: [80, 200],
        orientation: 'portrait'
      });

      const pageWidth = 80;
      const margin = 4;
      const contentWidth = pageWidth - (margin * 2);
      let y = 8;

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('SURAT IZIN SISWA', pageWidth / 2, y, { align: 'center' });
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('SMKN 1 Arahan', pageWidth / 2, y, { align: 'center' });
      y += 4;

      const today = new Date();
      const dateStr = today.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      doc.setFontSize(9);
      doc.text(dateStr, pageWidth / 2, y, { align: 'center' });
      y += 6;

      // Divider
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      // Helper to add label-value row
      const addRow = (label, value, isBold = false) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(label, margin, y);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(9);
        const textLines = doc.splitTextToSize(value, contentWidth - 25);
        doc.text(textLines, pageWidth - margin, y, { align: 'right' });
        y += (textLines.length * 3.5) + 1.5;
      };

      addRow('Nama', item.siswa?.nama || '-');
      addRow('Kelas', item.kelas?.nama || '-');
      addRow('NIS', item.siswa?.nis || '-');

      const jenisLabel = item.jenisIzin === 'masuk'
        ? 'IZIN MASUK (Telat)'
        : 'IZIN KELUAR (Pulang)';
      addRow('Jenis Izin', jenisLabel, true);

      addRow('Jam', item.jam || '-');

      // Alasan (multiline)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Alasan:', margin, y);
      y += 3.5;
      doc.setFont('helvetica', 'normal');
      const alasanLines = doc.splitTextToSize(item.alasan || '-', contentWidth);
      doc.text(alasanLines, margin, y);
      y += (alasanLines.length * 3.5) + 3;

      // Divider
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      // Footer info
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      doc.setFontSize(8);
      doc.text(`Dicetak: ${dateStr} ${timeStr}`, margin, y);
      y += 3.5;
      doc.text(`Oleh: ${item.guruPiket?.nama || user?.nama || '-'}`, margin, y);
      y += 8;

      // Signature
      doc.setFontSize(9);
      doc.text('Tanda Tangan', pageWidth - margin - 25, y);
      y += 12;
      doc.line(pageWidth - margin - 30, y, pageWidth - margin, y);
      y += 3.5;
      doc.setFontSize(8);
      doc.text('Guru Piket', pageWidth - margin - 15, y, { align: 'center' });

      // Trim page height to content
      const finalHeight = y + 8;
      doc.internal.pageSize.setHeight(finalHeight);

      // Save
      const fileName = `izin_${item.siswa?.nama?.replace(/\s+/g, '_') || 'siswa'}_${todayStr}.pdf`;
      doc.save(fileName);

      setToast({ type: 'success', message: 'PDF berhasil diunduh' });
    } catch (err) {
      console.error('PDF generation error:', err);
      setToast({ type: 'error', message: 'Gagal membuat PDF: ' + err.message });
    }
  };

  const handlePrint = (item) => {
    generateIzinPDF(item);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)',
          backgroundColor: toast.type === 'success' ? 'var(--secondary)' : 'var(--danger)',
          color: 'white', fontWeight: '600', fontSize: '0.85rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Permohonan Izin Siswa</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="card"
          style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem' }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Tutup' : 'Buat Izin'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card flex flex-col gap-3" style={{ padding: '1rem' }}>
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Kelas</label>
            <select
              value={selectedKelasId}
              onChange={(e) => { setSelectedKelasId(e.target.value); setSelectedSiswaId(''); }}
              style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
            >
              <option value="">Pilih kelas...</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Siswa</label>
            <select
              value={selectedSiswaId}
              onChange={(e) => setSelectedSiswaId(e.target.value)}
              disabled={!selectedKelasId}
              style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
            >
              <option value="">{selectedKelasId ? 'Pilih siswa...' : 'Pilih kelas dulu'}</option>
              {siswaOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.nama} ({s.nis})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Jenis Izin</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setJenisIzin('masuk')}
                style={{
                  flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                  fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                  backgroundColor: jenisIzin === 'masuk' ? 'var(--primary)' : 'var(--surface)',
                  color: jenisIzin === 'masuk' ? 'white' : 'var(--text-muted)'
                }}
              >
                <ArrowRight size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Izin Masuk
              </button>
              <button
                type="button"
                onClick={() => setJenisIzin('keluar')}
                style={{
                  flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                  fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                  backgroundColor: jenisIzin === 'keluar' ? 'var(--primary)' : 'var(--surface)',
                  color: jenisIzin === 'keluar' ? 'white' : 'var(--text-muted)'
                }}
              >
                <ArrowLeft size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Izin Keluar
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Jam</label>
            <input
              type="time"
              value={jam}
              onChange={(e) => setJam(e.target.value)}
              required
              style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Alasan</label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              required
              rows={3}
              placeholder="Contoh: Sakit, urusan keluarga, dll."
              style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.9rem', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none',
              backgroundColor: 'var(--primary)', color: 'white', fontWeight: '600',
              fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Menyimpan...' : 'Simpan Permohonan'}
          </button>
        </form>
      )}

      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Daftar Izin Hari Ini
        </h2>
        {permohonanIzin.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ fontWeight: '500' }}>Belum ada permohonan izin hari ini</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Klik "Buat Izin" untuk menambahkan</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {permohonanIzin.map((item) => (
              <div key={item.id} className="card" style={{
                padding: '0.75rem 1rem',
                borderLeft: `4px solid ${item.jenisIzin === 'masuk' ? 'var(--primary)' : 'var(--warning)'}`,
                display: 'flex', flexDirection: 'column', gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.siswa?.nama}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.kelas?.nama} &middot; NIS: {item.siswa?.nis}
                    </p>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', fontSize: '0.7rem', fontWeight: '700',
                    backgroundColor: item.jenisIzin === 'masuk' ? 'var(--primary-light)' : 'var(--warning-light, #FFF3E0)',
                    color: item.jenisIzin === 'masuk' ? 'var(--primary)' : 'var(--warning)',
                    textTransform: 'uppercase', flexShrink: 0
                  }}>
                    {item.jenisIzin === 'masuk' ? 'IZIN MASUK' : 'IZIN KELUAR'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Clock size={14} /> Jam: {item.jam}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
                  <span style={{ fontWeight: '600' }}>Alasan: </span>{item.alasan}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Oleh: {item.guruPiket?.nama} &middot; {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button
                    onClick={() => handlePrint(item)}
                    className="card"
                    style={{
                      flex: 1, padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                      border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                      backgroundColor: 'var(--surface-hover)', color: 'var(--primary)'
                    }}
                  >
                    <Download size={16} /> Download PDF (80mm)
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                      backgroundColor: 'var(--danger-light, #FFEBEE)', color: 'var(--danger)'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IzinSiswaScreen;
