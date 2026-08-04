import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Plus, Trash2, FileText, Clock, ArrowRight, ArrowLeft, X, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [pdfItem, setPdfItem] = useState(null);
  const receiptRef = useRef(null);

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

  // Auto-generate PDF when pdfItem changes and receiptRef is ready
  useEffect(() => {
    if (!pdfItem || !receiptRef.current) return;

    const generate = async () => {
      try {
        // Wait for DOM to render
        await new Promise((r) => setTimeout(r, 100));

        const canvas = await html2canvas(receiptRef.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: receiptRef.current.offsetWidth,
          height: receiptRef.current.offsetHeight
        });

        const imgData = canvas.toDataURL('image/png');

        // PDF size: 80mm width, auto height based on canvas ratio
        const pdfWidth = 80;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        const doc = new jsPDF({
          unit: 'mm',
          format: [pdfWidth, pdfHeight],
          orientation: 'portrait'
        });

        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        const fileName = `izin_${pdfItem.siswa?.nama?.replace(/\s+/g, '_') || 'siswa'}_${todayStr}.pdf`;
        doc.save(fileName);

        setToast({ type: 'success', message: 'PDF berhasil diunduh' });
        setPdfItem(null);
      } catch (err) {
        console.error('PDF generation error:', err);
        setToast({ type: 'error', message: 'Gagal membuat PDF: ' + err.message });
        setPdfItem(null);
      }
    };

    generate();
  }, [pdfItem, todayStr]);

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

  const handleDownloadPDF = (item) => {
    setPdfItem(item);
  };

  const jenisLabel = (item) =>
    item?.jenisIzin === 'masuk' ? 'IZIN MASUK (Telat)' : 'IZIN KELUAR (Pulang)';

  const jenisColor = (item) =>
    item?.jenisIzin === 'masuk' ? '#1976d2' : '#f57c00';

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Hidden receipt for html2canvas PDF generation */}
      {pdfItem && (
        <div
          ref={receiptRef}
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '320px',
            padding: '12px',
            backgroundColor: '#fff',
            fontFamily: "'Courier New', 'Consolas', monospace",
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#000',
            boxSizing: 'border-box'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              SURAT IZIN SISWA
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>
              SMKN 1 ARAHAN
            </div>
            <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
          </div>

          <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }} />

          {/* Notice for satpam */}
          <div style={{
            textAlign: 'center',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            padding: '6px',
            marginBottom: '8px',
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#856404'
          }}>
            TUNJUKKAN SURAT INI KE SATPAM / PENJAGA GERBANG
          </div>

          {/* Body */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '2px 4px 2px 0', whiteSpace: 'nowrap', width: '70px' }}>Nama</td>
                <td style={{ padding: '2px 0' }}>: {pdfItem.siswa?.nama || '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '2px 4px 2px 0' }}>Kelas</td>
                <td style={{ padding: '2px 0' }}>: {pdfItem.kelas?.nama || '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '2px 4px 2px 0' }}>NIS</td>
                <td style={{ padding: '2px 0' }}>: {pdfItem.siswa?.nis || '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '2px 4px 2px 0' }}>Jenis Izin</td>
                <td style={{ padding: '2px 0', fontWeight: 'bold', color: jenisColor(pdfItem), textTransform: 'uppercase' }}>
                  : {jenisLabel(pdfItem)}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '2px 4px 2px 0' }}>Jam</td>
                <td style={{ padding: '2px 0', fontWeight: 'bold' }}>: {pdfItem.jam || '-'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '2px 4px 2px 0', verticalAlign: 'top' }}>Alasan</td>
                <td style={{ padding: '2px 0', wordBreak: 'break-word' }}>: {pdfItem.alasan || '-'}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ borderTop: '2px dashed #000', margin: '8px 0' }} />

          {/* Footer */}
          <div style={{ fontSize: '10px', color: '#333', marginBottom: '4px' }}>
            <div>Dibuat oleh: {pdfItem.guruPiket?.nama || user?.nama || '-'}</div>
            <div>
              Jam cetak: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', marginBottom: '4px' }}>Tanda Tangan Guru Piket</div>
            <div style={{ borderBottom: '1px solid #000', width: '140px', margin: '0 auto', height: '30px' }} />
            <div style={{ fontSize: '10px', marginTop: '4px' }}>
              ({pdfItem.guruPiket?.nama || user?.nama || '-'})
            </div>
          </div>

          {/* Barcode-like ID for authenticity */}
          <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '10px', color: '#666' }}>
            No. Izin: #{String(pdfItem.id).padStart(4, '0')}
          </div>
        </div>
      )}

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
                    onClick={() => handleDownloadPDF(item)}
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
