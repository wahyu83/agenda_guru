import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../lib/store';
import { CheckCircle, XCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, Calendar, Lock, Loader2 } from 'lucide-react';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const formatTanggalIndo = (date) => {
  return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
};

const formatDateISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PiketScreen = () => {
  const { user, jadwalPiket, jamPelajaran, fetchJadwalPiket, savePiket, fetchJamPelajaran } = useAppStore();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState(null);
  
  const selectedHari = HARI[selectedDate.getDay()];
  const selectedDateISO = formatDateISO(selectedDate);

  useEffect(() => {
    fetchJamPelajaran();
  }, [fetchJamPelajaran]);

  useEffect(() => {
    fetchJadwalPiket(selectedHari, selectedDateISO);
  }, [fetchJadwalPiket, selectedHari, selectedDateISO]);

  // Auto refresh setiap 60 detik
  useEffect(() => {
    const interval = setInterval(() => {
      fetchJadwalPiket(selectedHari, selectedDateISO);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchJadwalPiket, selectedHari, selectedDateISO]);

  // Clear toast after 3s
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const navigateDay = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const jamMap = useMemo(() => {
    const m = {};
    jamPelajaran.forEach(jp => {
      m[jp.jamKe] = `${jp.mulai} - ${jp.selesai}`;
    });
    return m;
  }, [jamPelajaran]);

  const grouped = useMemo(() => {
    const map = {};
    jadwalPiket.forEach(item => {
      const key = item.jamKe;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return Object.entries(map).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  }, [jadwalPiket]);

  const handleStatus = async (pengampuId, status) => {
    if (!user?.id) {
      setToast({ type: 'error', message: 'Session tidak valid. Silakan login ulang.' });
      return;
    }
    setSavingId(pengampuId);
    try {
      await savePiket({
        pengampuId,
        piketById: user.id,
        status,
        catatan: null,
        tanggal: selectedDateISO
      });
      await fetchJadwalPiket(selectedHari, selectedDateISO);
      setToast({ type: 'success', message: 'Status berhasil diperbarui' });
    } catch (err) {
      console.error('Piket save error:', err);
      setToast({ type: 'error', message: 'Gagal menyimpan: ' + (err.message || 'Server error') });
    } finally {
      setSavingId(null);
    }
  };

  const isLibur = selectedHari === 'Sabtu' || selectedHari === 'Minggu';
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const canEdit = isToday; // hanya hari ini yang boleh di-pantau / diperbaiki

  if (isLibur) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigateDay(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--primary)' }}>
            <ChevronLeft size={24} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '1rem' }}>
              <Calendar size={18} style={{ color: 'var(--primary)' }} />
              {selectedHari}, {formatTanggalIndo(selectedDate)}
            </div>
          </div>
          <button onClick={() => navigateDay(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--primary)' }}>
            <ChevronRight size={24} />
          </button>
        </div>
        {!isToday && (
          <button onClick={goToToday} className="card" style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', border: 'none', background: 'var(--surface)' }}>
            Kembali ke Hari Ini
          </button>
        )}
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: '500' }}>Tidak ada jadwal mengajar hari ini</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Hari {selectedHari} adalah hari libur</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: toast.type === 'success' ? 'var(--secondary)' : 'var(--danger)',
          color: 'white',
          fontWeight: '600',
          fontSize: '0.85rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.2s ease'
        }}>
          {toast.message}
        </div>
      )}

      <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigateDay(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--primary)' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '1rem' }}>
            <Calendar size={18} style={{ color: 'var(--primary)' }} />
            {selectedHari}, {formatTanggalIndo(selectedDate)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {isToday ? 'Hari ini' : 'Pantau Kehadiran Guru'}
          </p>
        </div>
        <button onClick={() => navigateDay(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--primary)' }}>
          <ChevronRight size={24} />
        </button>
      </div>

      {!isToday && (
        <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(255, 193, 7, 0.08)', borderLeft: '4px solid var(--warning)' }}>
          <Lock size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--warning)' }}>Tanggal sudah terlewat</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pantauan dan perbaikan hanya dapat dilakukan pada hari pengajaran yang bersangkutan.
            </p>
          </div>
        </div>
      )}

      {!isToday && (
        <button onClick={goToToday} className="card" style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', border: 'none', background: 'var(--surface)' }}>
          Kembali ke Hari Ini
        </button>
      )}

      {jadwalPiket.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: '500' }}>Belum ada jadwal mengajar untuk hari ini</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Hubungi admin untuk mengatur jadwal pelajaran</p>
        </div>
      ) : (
        grouped.map(([jamKe, items]) => {
          const jamMulai = parseInt(jamKe);
          const jamAkhir = items[0]?.jamSampai || jamMulai;
          const waktuMulai = jamMap[jamMulai];
          const waktuAkhir = jamMap[jamAkhir] ? jamMap[jamAkhir].split(' - ')[1] : null;
          const rentangWaktu = waktuMulai && waktuAkhir ? `${waktuMulai.split(' - ')[0]} - ${waktuAkhir}` : (jamMap[jamMulai] || `Jam ke-${jamKe}`);
          const labelJam = jamAkhir > jamMulai ? `Jam ke-${jamMulai} s.d. ${jamAkhir}` : `Jam ke-${jamMulai}`;

          return (
            <div key={jamKe}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Clock size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--primary)' }}>
                  {labelJam} ({rentangWaktu})
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map(item => {
                  const status = item.piket?.status;
                  const isHadir = status === 'hadir';
                  const isTidakHadir = status === 'tidak_hadir';
                  const isTerlambat = status === 'terlambat';
                  const sudahDicek = !!status;
                  const isSaving = savingId === item.id;

                  // Status label untuk mode read-only
                  const statusLabel = isHadir ? 'Hadir' : isTerlambat ? 'Terlambat' : isTidakHadir ? 'Tidak Hadir' : 'Belum dipantau';
                  const statusColor = isHadir ? 'var(--secondary)' : isTerlambat ? 'var(--warning)' : isTidakHadir ? 'var(--danger)' : 'var(--text-muted)';

                  return (
                    <div key={item.id} className="card" style={{
                      padding: '0.75rem 1rem',
                      borderLeft: `4px solid ${sudahDicek ? (isHadir ? 'var(--secondary)' : isTerlambat ? 'var(--warning)' : 'var(--danger)') : 'var(--border-color)'}`,
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      opacity: isSaving ? 0.7 : 1
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.mapel}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {item.guru} &middot; {item.kelas}
                        </p>
                        {item.piket && (
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                            Terakhir diperbarui: {new Date(item.piket.createdAt).toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                        {canEdit ? (
                          // Mode edit: tampilkan tombol interaktif
                          <>
                            <button
                              disabled={isSaving}
                              onClick={() => handleStatus(item.id, 'hadir')}
                              style={{
                                padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-md)', border: 'none',
                                fontSize: '0.75rem', fontWeight: '600', cursor: isSaving ? 'not-allowed' : 'pointer',
                                backgroundColor: isHadir ? 'var(--secondary)' : 'var(--surface-hover)',
                                color: isHadir ? 'white' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                opacity: isSaving ? 0.6 : 1
                              }}
                            >
                              {isSaving ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />} Hadir
                            </button>
                            <button
                              disabled={isSaving}
                              onClick={() => handleStatus(item.id, 'terlambat')}
                              style={{
                                padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-md)', border: 'none',
                                fontSize: '0.75rem', fontWeight: '600', cursor: isSaving ? 'not-allowed' : 'pointer',
                                backgroundColor: isTerlambat ? 'var(--warning)' : 'var(--surface-hover)',
                                color: isTerlambat ? 'white' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                opacity: isSaving ? 0.6 : 1
                              }}
                            >
                              {isSaving ? <Loader2 size={14} className="spin" /> : <Clock size={14} />} Terlambat
                            </button>
                            <button
                              disabled={isSaving}
                              onClick={() => handleStatus(item.id, 'tidak_hadir')}
                              style={{
                                padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-md)', border: 'none',
                                fontSize: '0.75rem', fontWeight: '600', cursor: isSaving ? 'not-allowed' : 'pointer',
                                backgroundColor: isTidakHadir ? 'var(--danger)' : 'var(--surface-hover)',
                                color: isTidakHadir ? 'white' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                opacity: isSaving ? 0.6 : 1
                              }}
                            >
                              {isSaving ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />} Tdk Hadir
                            </button>
                          </>
                        ) : (
                          // Mode read-only: tampilkan status saja tanpa tombol
                          <div style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: sudahDicek ? statusColor : 'var(--surface-hover)',
                            color: sudahDicek ? 'white' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}>
                            {sudahDicek ? (
                              <>
                                {isHadir && <CheckCircle size={14} />}
                                {isTerlambat && <Clock size={14} />}
                                {isTidakHadir && <XCircle size={14} />}
                                {statusLabel}
                              </>
                            ) : (
                              <span style={{ fontStyle: 'italic' }}>Belum dipantau</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default PiketScreen;
