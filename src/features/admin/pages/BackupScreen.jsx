import React, { useState, useRef } from 'react';
import { Download, Upload, DatabaseBackup, RefreshCw, Loader, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../../../lib/store';

const BackupScreen = () => {
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);

  const handleDownload = async () => {
    setBackingUp(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/admin/backup-database`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal membuat backup.');
      }
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition') || '';
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage('Backup database berhasil diunduh.');
    } catch (err) {
      setMessage('Gagal membuat backup: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('PERINGATAN: Memulihkan backup akan MENIMPA seluruh data saat ini. Lanjutkan?')) {
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setRestoring(true);
    setMessage('');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/restore-database`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: reader.result })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memulihkan database.');
        setMessage('Database berhasil dipulihkan. Silakan muat ulang halaman.');
      } catch (err) {
        setMessage('Gagal memulihkan: ' + (err.message || 'Terjadi kesalahan'));
      } finally {
        setRestoring(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Backup &amp; Restore Database</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Unduh cadangan (backup) seluruh data, atau pulihkan dari file backup saat pindah perangkat/sekolah baru.
        </p>
      </div>

      {/* Backup */}
      <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--primary)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={20} style={{ color: 'var(--primary)' }} />
          Backup Database
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Unduh file SQL berisi seluruh data aplikasi. Simpan file ini di tempat yang aman.
        </p>
        <button className="btn btn-primary" onClick={handleDownload} disabled={backingUp}>
          {backingUp ? <Loader size={16} className="animate-spin" /> : <DatabaseBackup size={16} />}
          {backingUp ? 'Membuat backup...' : 'Download Backup'}
        </button>
      </div>

      {/* Restore */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Upload size={20} style={{ color: 'var(--primary)' }} />
          Restore Database
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--danger)15', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.8125rem' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          Memulihkan backup akan menimpa seluruh data yang ada saat ini. Pastikan Anda sudah membuat backup terlebih dahulu.
        </div>
        <input ref={fileRef} type="file" accept=".sql,text/plain" style={{ display: 'none' }} onChange={handleRestore} />
        <button className="btn btn-secondary" style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }} onClick={() => fileRef.current?.click()} disabled={restoring}>
          {restoring ? <Loader size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {restoring ? 'Memulihkan...' : 'Pilih File Backup'}
        </button>
      </div>

      {message && (
        <div className="card" style={{ padding: '1rem', backgroundColor: message.startsWith('Gagal') ? 'var(--danger)10' : 'var(--success)10', color: message.startsWith('Gagal') ? 'var(--danger)' : 'var(--success)', fontWeight: '500' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default BackupScreen;