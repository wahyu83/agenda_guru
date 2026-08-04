import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Plus, Trash2, FileText, Clock, ArrowRight, ArrowLeft, X, Download, Printer, CheckSquare, Square, XCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const formatDateISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const IzinSiswaScreen = () => {
  const { user, kelas, siswaKelasAktif, permohonanIzin, fetchSiswaKelas, fetchPermohonanIzin, createPermohonanIzinBatch, deletePermohonanIzin } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [viewKelasId, setViewKelasId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [jenisIzin, setJenisIzin] = useState('keluar');
  const [jam, setJam] = useState('');
  const [alasan, setAlasan] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [pdfItem, setPdfItem] = useState(null);
  const [printItem, setPrintItem] = useState(null);
  const receiptRef = useRef(null);

  const todayStr = formatDateISO(new Date());

  useEffect(() => {
    fetchPermohonanIzin(todayStr);
  }, [fetchPermohonanIzin, todayStr]);

  useEffect(() => {
    if (viewKelasId) {
      fetchSiswaKelas(parseInt(viewKelasId));
    }
  }, [fetchSiswaKelas, viewKelasId]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Auto-generate PDF when pdfItem changes
  useEffect(() => {
    if (!pdfItem || !receiptRef.current) return;
    const generate = async () => {
      try {
        await new Promise((r) => setTimeout(r, 100));
        const canvas = await html2canvas(receiptRef.current, {
          scale: 3, useCORS: true, backgroundColor: '#ffffff',
          width: receiptRef.current.offsetWidth,
          height: receiptRef.current.offsetHeight
        });
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = 80;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const doc = new jsPDF({ unit: 'mm', format: [pdfWidth, pdfHeight], orientation: 'portrait' });
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

  const siswaOptions = useMemo(() => siswaKelasAktif || [], [siswaKelasAktif]);

  const currentKelasNama = useMemo(() => {
    const k = kelas.find((c) => String(c.id) === viewKelasId);
    return k?.nama || '';
  }, [kelas, viewKelasId]);

  const isSelected = (siswaId) => selectedStudents.some((s) => String(s.siswaId) === String(siswaId));

  const toggleSiswa = (s) => {
    const id = String(s.id);
    console.log('[toggleSiswa] clicked id:', id, 'current selected:', selectedStudents);
    setSelectedStudents((prev) => {
      if (prev.some((x) => String(x.siswaId) === id)) {
        const next = prev.filter((x) => String(x.siswaId) !== id);
        console.log('[toggleSiswa] removed, next count:', next.length);
        return next;
      }
      const next = [...prev, { siswaId: id, kelasId: viewKelasId, nama: s.nama, nis: s.nis, kelasNama: currentKelasNama }];
      console.log('[toggleSiswa] added, next count:', next.length);
      return next;
    });
  };

  const selectAllCurrent = () => {
    const newOnes = siswaOptions
      .filter((s) => !isSelected(s.id))
      .map((s) => ({ siswaId: String(s.id), kelasId: viewKelasId, nama: s.nama, nis: s.nis, kelasNama: currentKelasNama }));
    setSelectedStudents((prev) => [...prev, ...newOnes]);
  };

  const deselectAllCurrent = () => {
    setSelectedStudents((prev) => prev.filter((s) => String(s.kelasId) !== String(viewKelasId)));
  };

  const removeSelected = (siswaId) => {
    setSelectedStudents((prev) => prev.filter((s) => String(s.siswaId) !== String(siswaId)));
  };

  const clearAll = () => setSelectedStudents([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[handleSubmit] selectedStudents:', selectedStudents.length, 'jam:', jam, 'alasan:', alasan, 'user:', user);
    if (selectedStudents.length === 0 || !jam || !alasan) {
      setToast({ type: 'error', message: 'Pilih minimal 1 siswa dan isi semua field' });
      return;
    }
    if (!user?.id) {
      setToast({ type: 'error', message: 'Session tidak valid, silakan login ulang' });
      return;
    }
    setSaving(true);
    try {
      console.log('[handleSubmit] calling batch API with', selectedStudents.length, 'students');
      await createPermohonanIzinBatch({
        items: selectedStudents.map((s) => ({ siswaId: s.siswaId, kelasId: s.kelasId })),
        tanggal: todayStr,
        jenisIzin,
        jam,
        alasan,
        guruPiketId: user.id
      });
      setToast({ type: 'success', message: `${selectedStudents.length} permohonan izin berhasil dibuat` });
      setShowForm(false);
      setSelectedStudents([]);
      setViewKelasId('');
      setJam('');
      setAlasan('');
    } catch (err) {
      console.error('[handleSubmit] error:', err);
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

  const handleDownloadPDF = (item) => setPdfItem(item);

  const handleDirectPrint = (item) => {
    setPrintItem(item);
    setTimeout(() => { window.print(); setPrintItem(null); }, 400);
  };

  const jenisLabel = (item) => item?.jenisIzin === 'masuk' ? 'IZIN MASUK' : 'IZIN KELUAR';

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Hidden receipt for html2canvas PDF */}
      {pdfItem && (
        <div ref={receiptRef} style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '320px', padding: '12px', backgroundColor: '#fff', fontFamily: "'Courier New', 'Consolas', monospace", fontSize: '13px', lineHeight: 1.5, color: '#000', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#000' }}>SURAT IZIN SISWA</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px', color: '#000' }}>SMKN 1 ARAHAN</div>
            <div style={{ fontSize: '10px', marginTop: '2px', color: '#000' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }} />
          <div style={{ textAlign: 'center', border: '2px solid #000', padding: '6px', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold', color: '#000' }}>
            TUNJUKKAN SURAT INI KE SATPAM / PENJAGA GERBANG
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ fontWeight: 'bold', padding: '2px 4px 2px 0', whiteSpace: 'nowrap', width: '70px', color: '#000' }}>Nama</td><td style={{ padding: '2px 0', color: '#000' }}>: {pdfItem.siswa?.nama || '-'}</td></tr>
              <tr><td style={{ fontWeight: 'bold', padding: '2px 4px 2px 0', color: '#000' }}>Kelas</td><td style={{ padding: '2px 0', color: '#000' }}>: {pdfItem.kelas?.nama || '-'}</td></tr>
              <tr><td style={{ fontWeight: 'bold', padding: '2px 4px 2px 0', color: '#000' }}>NIS</td><td style={{ padding: '2px 0', color: '#000' }}>: {pdfItem.siswa?.nis || '-'}</td></tr>
              <tr><td style={{ fontWeight: 'bold', padding: '2px 4px 2px 0', color: '#000' }}>Jenis Izin</td><td style={{ padding: '2px 0', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>: {jenisLabel(pdfItem)}</td></tr>
              <tr><td style={{ fontWeight: 'bold', padding: '2px 4px 2px 0', color: '#000' }}>Jam</td><td style={{ padding: '2px 0', fontWeight: 'bold', color: '#000' }}>: {pdfItem.jam || '-'}</td></tr>
              <tr><td style={{ fontWeight: 'bold', padding: '2px 4px 2px 0', verticalAlign: 'top', color: '#000' }}>Alasan</td><td style={{ padding: '2px 0', wordBreak: 'break-word', color: '#000' }}>: {pdfItem.alasan || '-'}</td></tr>
            </tbody>
          </table>
          <div style={{ borderTop: '2px dashed #000', margin: '8px 0' }} />
          <div style={{ fontSize: '10px', marginBottom: '4px', color: '#000' }}>
            <div>Dibuat oleh: {pdfItem.guruPiket?.nama || user?.nama || '-'}</div>
            <div>Jam cetak: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', marginBottom: '4px', color: '#000' }}>Tanda Tangan Guru Piket</div>
            <div style={{ borderBottom: '1px solid #000', width: '140px', margin: '0 auto', height: '30px' }} />
            <div style={{ fontSize: '10px', marginTop: '4px', color: '#000' }}>({pdfItem.guruPiket?.nama || user?.nama || '-'})</div>
          </div>
          <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '10px', color: '#000' }}>No. Izin: #{String(pdfItem.id).padStart(4, '0')}</div>
        </div>
      )}

      {/* Print-only receipt for direct thermal print */}
      {printItem && (
        <div className="print-only-receipt">
          <div className="print-header">
            <div className="print-title">SURAT IZIN SISWA</div>
            <div className="print-school">SMKN 1 ARAHAN</div>
            <div className="print-date">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div className="print-divider" />
          <div className="print-notice">TUNJUKKAN SURAT INI KE SATPAM / PENJAGA GERBANG</div>
          <table className="print-table">
            <tbody>
              <tr><td className="print-label">Nama</td><td className="print-value">: {printItem.siswa?.nama || '-'}</td></tr>
              <tr><td className="print-label">Kelas</td><td className="print-value">: {printItem.kelas?.nama || '-'}</td></tr>
              <tr><td className="print-label">NIS</td><td className="print-value">: {printItem.siswa?.nis || '-'}</td></tr>
              <tr><td className="print-label">Jenis Izin</td><td className="print-value print-bold">: {jenisLabel(printItem)}</td></tr>
              <tr><td className="print-label">Jam</td><td className="print-value print-bold">: {printItem.jam || '-'}</td></tr>
              <tr><td className="print-label" style={{ verticalAlign: 'top' }}>Alasan</td><td className="print-value">: {printItem.alasan || '-'}</td></tr>
            </tbody>
          </table>
          <div className="print-divider" />
          <div className="print-meta">
            <div>Dibuat oleh: {printItem.guruPiket?.nama || user?.nama || '-'}</div>
            <div>Jam cetak: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div className="print-signature">
            <div className="print-sig-label">Tanda Tangan Guru Piket</div>
            <div className="print-sig-line" />
            <div className="print-sig-name">({printItem.guruPiket?.nama || user?.nama || '-'})</div>
          </div>
          <div className="print-id">No. Izin: #{String(printItem.id).padStart(4, '0')}</div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', backgroundColor: toast.type === 'success' ? 'var(--secondary)' : 'var(--danger)', color: 'white', fontWeight: '600', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Permohonan Izin Siswa</h1>
        <button onClick={() => setShowForm(!showForm)} className="card" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem' }}>
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Tutup' : 'Buat Izin'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card flex flex-col gap-3" style={{ padding: '1rem' }}>
          {/* Selected students summary */}
          {selectedStudents.length > 0 && (
            <div style={{ backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  Siswa Terpilih ({selectedStudents.length})
                </span>
                <button type="button" onClick={clearAll} style={{ fontSize: '0.7rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                  Hapus Semua
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {selectedStudents.map((s) => (
                  <span key={s.siswaId} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', border: '1px solid var(--primary)' }}>
                    {s.nama} <span style={{ color: 'var(--text-muted)' }}>({s.kelasNama})</span>
                    <button type="button" onClick={() => removeSelected(s.siswaId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--danger)' }}>
                      <XCircle size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Kelas selector */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Pilih Kelas</label>
            <select
              value={viewKelasId}
              onChange={(e) => setViewKelasId(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
            >
              <option value="">Pilih kelas untuk melihat siswa...</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          {/* Student checklist for current kelas */}
          <div className="flex flex-col gap-1">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                {viewKelasId ? `Siswa di ${currentKelasNama}` : 'Siswa'}
              </label>
              {viewKelasId && siswaOptions.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={selectAllCurrent} style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Pilih Semua</button>
                  <button type="button" onClick={deselectAllCurrent} style={{ fontSize: '0.7rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Batal</button>
                </div>
              )}
            </div>

            {!viewKelasId ? (
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                Pilih kelas untuk melihat daftar siswa
              </div>
            ) : siswaOptions.length === 0 ? (
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                Tidak ada siswa di kelas ini
              </div>
            ) : (
              <div className="card" style={{ maxHeight: '220px', overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {siswaOptions.map((s) => {
                  const checked = isSelected(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSiswa(s)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        backgroundColor: checked ? 'var(--primary-light)' : 'transparent',
                        color: checked ? 'var(--primary)' : 'var(--text)',
                        fontSize: '0.85rem', fontWeight: checked ? '600' : '400',
                        border: checked ? '1px solid var(--primary)' : '1px solid transparent'
                      }}
                    >
                      {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                      <span>{s.nama}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{s.nis}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Jenis Izin</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => setJenisIzin('masuk')} style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', backgroundColor: jenisIzin === 'masuk' ? 'var(--primary)' : 'var(--surface)', color: jenisIzin === 'masuk' ? 'white' : 'var(--text-muted)' }}>
                <ArrowRight size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Izin Masuk
              </button>
              <button type="button" onClick={() => setJenisIzin('keluar')} style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', backgroundColor: jenisIzin === 'keluar' ? 'var(--primary)' : 'var(--surface)', color: jenisIzin === 'keluar' ? 'white' : 'var(--text-muted)' }}>
                <ArrowLeft size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Izin Keluar
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Jam</label>
            <input type="time" value={jam} onChange={(e) => setJam(e.target.value)} required style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }} />
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Alasan</label>
            <textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} required rows={3} placeholder="Contoh: Sakit, urusan keluarga, dll." style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.9rem', resize: 'vertical' }} />
          </div>

          <button type="submit" disabled={saving} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '600', fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Menyimpan...' : `Simpan (${selectedStudents.length} siswa)`}
          </button>
        </form>
      )}

      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Daftar Izin Hari Ini</h2>
        {permohonanIzin.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ fontWeight: '500' }}>Belum ada permohonan izin hari ini</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Klik "Buat Izin" untuk menambahkan</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {permohonanIzin.map((item) => (
              <div key={item.id} className="card" style={{ padding: '0.75rem 1rem', borderLeft: `4px solid ${item.jenisIzin === 'masuk' ? 'var(--primary)' : 'var(--warning)'}`, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.siswa?.nama}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.kelas?.nama} &middot; NIS: {item.siswa?.nis}</p>
                  </div>
                  <div style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', fontSize: '0.7rem', fontWeight: '700', backgroundColor: item.jenisIzin === 'masuk' ? 'var(--primary-light)' : 'var(--warning-light, #FFF3E0)', color: item.jenisIzin === 'masuk' ? 'var(--primary)' : 'var(--warning)', textTransform: 'uppercase', flexShrink: 0 }}>
                    {item.jenisIzin === 'masuk' ? 'IZIN MASUK' : 'IZIN KELUAR'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}><Clock size={14} /> Jam: {item.jam}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}><span style={{ fontWeight: '600' }}>Alasan: </span>{item.alasan}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Oleh: {item.guruPiket?.nama} &middot; {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button onClick={() => handleDirectPrint(item)} className="card" style={{ flex: 1, padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#000', color: '#fff' }}><Printer size={14} /> Cetak Thermal</button>
                  <button onClick={() => handleDownloadPDF(item)} className="card" style={{ flex: 1, padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'var(--surface-hover)', color: 'var(--primary)' }}><Download size={14} /> Download PDF</button>
                  <button onClick={() => handleDelete(item.id)} style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', backgroundColor: 'var(--danger-light, #FFEBEE)', color: 'var(--danger)' }}><Trash2 size={16} /></button>
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
