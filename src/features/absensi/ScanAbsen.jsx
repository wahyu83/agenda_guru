import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, CheckCircle2, Clock, AlertTriangle, Camera, CameraOff, XCircle, Keyboard } from 'lucide-react';
import { useAppStore } from '../../lib/store';

const ScanAbsen = () => {
  const { scanAbsensiSiswa, settings } = useAppStore();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [showManual, setShowManual] = useState(false);

  const scannerRef = useRef(null);
  const lastScanRef = useRef(0);
  const resetTimerRef = useRef(null);

  // Beep sederhana via Web Audio API
  const playBeep = (ok) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = ok ? 880 : 320;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      setTimeout(() => ctx.close(), 600);
    } catch {
      // abaikan bila browser memblokir audio
    }
  };

  const handleToken = async (token) => {
    if (!token) return;
    const now = Date.now();
    if (now - lastScanRef.current < 1800) return; // debounce
    lastScanRef.current = now;
    try {
      const data = await scanAbsensiSiswa(token.trim());
      setResult(data);
      playBeep(!data.already);
      setError('');
    } catch (err) {
      setError(err.message || 'Kartu tidak dikenali.');
      playBeep(false);
    }
    clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setResult(null), 3000);
  };

  const startScan = async () => {
    setError('');
    try {
      const scanner = new Html5Qrcode('qr-reader', { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleToken(decodedText),
        () => {}
      );
      setScanning(true);
    } catch (err) {
      console.error(err);
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diizinkan atau gunakan input manual.');
    }
  };

  const stopScan = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {
      // abaikan
    }
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    startScan();
    return () => {
      clearTimeout(resetTimerRef.current);
      stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusInfo = (s) => s === 'terlambat'
    ? { label: 'TERLAMBAT', color: 'var(--warning)', icon: <Clock size={40} /> }
    : { label: 'HADIR', color: 'var(--success)', icon: <CheckCircle2 size={40} /> };

  const formatJam = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Absensi Siswa</h1>
        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>{settings?.namaSekolah || 'Scan Kartu QR'}</p>
      </div>

      <div style={{ width: '100%', maxWidth: '520px', background: 'white', borderRadius: 'var(--radius-lg)', padding: '1rem', boxShadow: 'var(--shadow-lg)' }}>
        {/* Area kamera */}
        <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#000' }}>
          <div id="qr-reader" style={{ width: '100%' }} />
          {!scanning && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '0.5rem' }}>
              <CameraOff size={40} />
              <span style={{ fontSize: '0.875rem' }}>Kamera tidak aktif</span>
            </div>
          )}
        </div>

        <div className="flex gap-2" style={{ marginTop: '0.75rem', justifyContent: 'center' }}>
          {scanning ? (
            <button className="btn btn-secondary" onClick={stopScan}><CameraOff size={16} /> Hentikan Kamera</button>
          ) : (
            <button className="btn btn-primary" onClick={startScan}><Camera size={16} /> Aktifkan Kamera</button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowManual(v => !v)}><Keyboard size={16} /> Input Manual</button>
        </div>

        {showManual && (
          <form onSubmit={(e) => { e.preventDefault(); handleToken(manualToken); setManualToken(''); }} className="flex gap-2" style={{ marginTop: '0.75rem' }}>
            <input className="input" placeholder="Tempel/ketik kode kartu..." value={manualToken} onChange={(e) => setManualToken(e.target.value)} />
            <button type="submit" className="btn btn-primary"><QrCode size={16} /> Proses</button>
          </form>
        )}

        {/* Hasil scan */}
        {result && (
          <div style={{ marginTop: '1rem', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', backgroundColor: result.already ? 'var(--warning)15' : `${statusInfo(result.status).color}15`, border: `2px solid ${result.already ? 'var(--warning)' : statusInfo(result.status).color}` }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: result.already ? 'var(--warning)' : statusInfo(result.status).color }}>
              {result.already ? <AlertTriangle size={40} /> : statusInfo(result.status).icon}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{result.siswa?.nama}</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{result.siswa?.nis} · {result.kelas}</p>
            <p style={{ marginTop: '0.5rem', fontWeight: 'bold', color: result.already ? 'var(--warning)' : statusInfo(result.status).color }}>
              {result.already ? `Sudah tercatat (${statusInfo(result.status).label})` : statusInfo(result.status).label}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Jam {formatJam(result.jamMasuk)}</p>
          </div>
        )}

        {error && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)15', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <XCircle size={18} /> {error}
          </div>
        )}
      </div>

      <p style={{ color: 'white', fontSize: '0.8125rem', opacity: 0.85, textAlign: 'center' }}>
        Arahkan kartu QR siswa ke kamera. Kehadiran tercatat otomatis.
      </p>
    </div>
  );
};

export default ScanAbsen;