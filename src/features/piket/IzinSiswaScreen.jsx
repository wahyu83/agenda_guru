import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Plus, Trash2, Printer, FileText, Clock, ArrowRight, ArrowLeft, AlertCircle, CheckCircle, X } from 'lucide-react';

const formatDateISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const IzinSiswaScreen = () => {
  const { user, kelas, siswa, siswaKelasAktif, permohonanIzin, fetchSiswaKelas, fetchPermohonanIzin, createPermohonanIzin, deletePermohonanIzin } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [selectedSiswaId, setSelectedSiswaId] = useState('');
  const [jenisIzin, setJenisIzin] = useState('keluar');
  const [jam, setJam] = useState('');
  const [alasan, setAlasan] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [printItem, setPrintItem] = useState(null);
  const printRef = useRef();

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

  const handlePrint = (item) => {
    setPrintItem(item);
    setTimeout(() => {
      window.print();
      setPrintItem(null);
    }, 300);
  };

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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

      {/* Print Thermal Preview (hidden until print) */}
      {printItem && (
        <div ref={printRef} className="thermal-print">
          <div className="thermal-header">
            <h3>SURAT IZIN SISWA</h3>
            <p>SMKN 1 Arahan</p>
            <p>{new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
            <div className="thermal-divider" />
          </div>

          <div className="thermal-body">
            <div className="thermal-row">
              <span className="thermal-label">Nama</span>
              <span className="thermal-value">{printItem.siswa?.nama}</span>
            </div>
            <div className="thermal-row">
              <span className="thermal-label">Kelas</span>
              <span className="thermal-value">{printItem.kelas?.nama}</span>
            </div>
            <div className="thermal-row">
              <span className="thermal-label">Jenis Izin</span>
              <span className="thermal-value" style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                {printItem.jenisIzin === 'masuk' ? 'IZIN MASUK (Telat)' : 'IZIN KELUAR (Pulang)'}
              </span>
            </div>
            <div className="thermal-row">
              <span className="thermal-label">Jam</span>
              <span className="thermal-value">{printItem.jam}</span>
            </div>
            <div className="thermal-row">
              <span className="thermal-label">Alasan</span>
              <span className="thermal-value">{printItem.alasan}</span>
            </div>
          </div>

          <div className="thermal-divider" />

          <div className="thermal-footer">
            <p>Dibuat oleh: {printItem.guruPiket?.nama}</p>
            <p>Jam cetak: {currentTime}</p>
            <br />
            <p>_________________________</p>
            <p>Tanda Tangan Guru Piket</p>
          </div>
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
                    <Printer size={16} /> Cetak (80mm)
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
