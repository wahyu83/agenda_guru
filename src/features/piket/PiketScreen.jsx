import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../lib/store';
import { CheckCircle, XCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, Calendar, Lock, Loader2, Filter } from 'lucide-react';

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
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('all');

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

  // Daftar kelas unik untuk filter
  const uniqueKelas = useMemo(() => {
    const set = new Set(jadwalPiket.map(item => item.kelas));
    return Array.from(set).sort();
  }, [jadwalPiket]);

  // Group by kelas, lalu urutkan by jamKe
  const groupedByKelas = useMemo(() => {
    const map = {};
    jadwalPiket.forEach(item => {
      if (!map[item.kelas]) map[item.kelas] = [];
      map[item.kelas].push(item);
    });
    // Urutkan jam dalam setiap kelas
    Object.values(map).forEach(list => list.sort((a, b) => a.jamKe - b.jamKe));
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [jadwalPiket]);

  // Terapkan filter kelas
  const filteredGrouped = useMemo(() => {
    if (selectedKelasFilter === 'all') return groupedByKelas;
    return groupedByKelas.filter(([kelas]) => kelas === selectedKelasFilter);
  }, [groupedByKelas, selectedKelasFilter]);

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
  const canEdit = isToday;

  // Helper: format label jam dengan rentang waktu
  const formatJamLabel = (jamKe, jamSampai) => {
    const mulai = parseInt(jamKe);
    const akhir = parseInt(jamSampai) || mulai;
    const waktuMulai = jamMap[mulai];
    const waktuAkhir = jamMap[akhir] ? jamMap[akhir].split(' - ')[1] : null;
    const rentang = waktuMulai && waktuAkhir
      ? `${waktuMulai.split(' - ')[0]} - ${waktuAkhir}`
      : (jamMap[mulai] || `Jam ke-${jamKe}`);
    const label = akhir > mulai ? `Jam ke-${mulai} s.d. ${akhir}` : `Jam ke-${mulai}`;
    return { label, rentang };
  };

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

      {/* Filter Kelas */}
      {uniqueKelas.length > 0 && (
        <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Filter size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <select
            className="input"
            value={selectedKelasFilter}
            onChange={(e) => setSelectedKelasFilter(e.target.value)}
            style={{ flex: 1, fontSize: '0.9rem' }}
          >
            <option value="all">Semua Kelas</option>
            {uniqueKelas.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      )}

      {jadwalPiket.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: '500' }}>Belum ada jadwal mengajar untuk hari ini</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Hubungi admin untuk mengatur jadwal pelajaran</p>
        </div>
      ) : (
        filteredGrouped.map(([kelas, items]) => {
          return (
            <div key={kelas} className="card" style={{ padding: '1rem', overflow: 'hidden' }}>
              {/* Header Kelas */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  fontSize: '0.8rem'
                }}>
                  {kelas.split(' ')[0] || kelas.charAt(0)}
                </div>
                <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary)' }}>
                  {kelas}
                </span>
              </div>

              {/* Daftar Jam dalam Kelas */}
              <div className="flex flex-col gap-2">
                {items.map(item => {
                  const { label, rentang } = formatJamLabel(item.jamKe, item.jamSampai);
                  const status = item.piket?.status;
                  const isHadir = status === 'hadir';
                  const isTidakHadir = status === 'tidak_hadir';
                  const isTerlambat = status === 'terlambat';
                  const sudahDicek = !!status;
                  const isSaving = savingId === item.id;

                  const statusLabel = isHadir ? 'H' : isTerlambat ? 'T' : isTidakHadir ? 'A' : 'Belum dipantau';
                  const statusColor = isHadir ? 'var(--secondary)' : isTerlambat ? 'var(--warning)' : isTidakHadir ? 'var(--danger)' : 'var(--text-muted)';

                  return (
                    <div key={item.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 0',
                      borderBottom: '1px solid var(--border-color)'
                    }}>
                      {/* Info Jam & Mapel */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                          <Clock size={14} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--primary)' }}>
                            {label}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ({rentang})
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.guru}</p>
                        {item.piket && (
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                            Terakhir diperbarui: {new Date(item.piket.createdAt).toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>

                      {/* Status / Tombol */}
                      <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {canEdit ? (
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
                              {isSaving ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />} H
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
                              {isSaving ? <Loader2 size={14} className="spin" /> : <Clock size={14} />} T
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
                              {isSaving ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />} A
                            </button>
                          </>
                        ) : (
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
