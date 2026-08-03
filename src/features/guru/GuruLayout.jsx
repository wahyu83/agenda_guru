import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Clock, User, UserCog, WifiOff, FileText, BookOpen, Bell, X } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import ProfileModal from '../../components/ProfileModal';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const NOTIF_BEFORE_MINUTES = 5;

const GuruLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, kelasWali, jadwalGuru, jamPelajaran, fetchWaliKelas, fetchJadwalGuru, fetchJamPelajaran } = useAppStore();
  const [showProfile, setShowProfile] = useState(false);
  const [notif, setNotif] = useState(null);
  const dismissedRef = useRef(new Set());
  const isOffline = false;

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchWaliKelas(user.id);
      fetchJadwalGuru(user.id);
      fetchJamPelajaran();
    }
  }, [user, fetchWaliKelas, fetchJadwalGuru, fetchJamPelajaran]);

  const jamKeWaktuMap = useMemo(() => {
    const map = {};
    jamPelajaran.forEach(jp => {
      map[jp.jamKe] = { start: jp.mulai, end: jp.selesai };
    });
    return map;
  }, [jamPelajaran]);

  const getJamStart = useCallback((jamKe) => {
    const waktu = jamKeWaktuMap[jamKe];
    if (!waktu) return null;
    const [h, m] = waktu.start.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }, [jamKeWaktuMap]);

  useEffect(() => {
    const checkUpcoming = () => {
      const now = new Date();
      const todayIdx = now.getDay();
      if (todayIdx === 0 || todayIdx === 6) {
        setNotif(null);
        return;
      }
      const todayName = HARI[todayIdx - 1];

      const upcoming = jadwalGuru.find((item) => {
        if (item.hari !== todayName) return false;
        const startTime = getJamStart(item.jamKe);
        if (!startTime) return false;
        const diffMs = startTime.getTime() - now.getTime();
        const diffMin = diffMs / 60000;
        if (diffMin < 0 || diffMin > NOTIF_BEFORE_MINUTES) return false;
        const key = `${item.id}-${startTime.toDateString()}`;
        return !dismissedRef.current.has(key);
      });

      if (upcoming) {
        const startWaktu = jamKeWaktuMap[upcoming.jamKe];
        setNotif({
          kelas: upcoming.kelas?.nama || '-',
          mapel: upcoming.mapel?.nama || '-',
          jam: startWaktu ? `${startWaktu.start} - ${startWaktu.end}` : `Jam ke-${upcoming.jamKe}`,
          key: `${upcoming.id}-${getJamStart(upcoming.jamKe)?.toDateString()}`
        });
      }
    };

    checkUpcoming();
    const interval = setInterval(checkUpcoming, 30000);
    return () => clearInterval(interval);
  }, [jadwalGuru, getJamStart]);

  const handleDismissNotif = () => {
    if (notif?.key) {
      dismissedRef.current.add(notif.key);
    }
    setNotif(null);
  };

  return (
    <div className="mobile-layout">
      {/* App Bar */}
      <header className="mobile-header shadow-sm">
        <div 
          className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/10 transition-colors" 
          onClick={() => setShowProfile(true)}
          style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCog size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user?.nama || 'Guru'}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>NIP. {user?.nip || '-'}</span>
          </div>
        </div>
        
        {isOffline && (
          <div className="flex items-center gap-1" style={{ backgroundColor: 'var(--warning)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '600' }}>
            <WifiOff size={14} /> Offline Mode
          </div>
        )}
      </header>

      {/* Notifikasi Jadwal */}
      {notif && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: '90%',
            maxWidth: '380px',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            border: '1px solid var(--primary)',
            borderLeft: '5px solid var(--primary)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bell size={20} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>
                  Jam pelajaran akan dimulai
                </p>
                <p style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text)' }}>
                  {notif.mapel}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  Kelas {notif.kelas} &middot; {notif.jam}
                </p>
              </div>
              <button
                onClick={handleDismissNotif}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0.25rem', color: 'var(--text-muted)', flexShrink: 0
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{
              height: 3,
              background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
              animation: 'shrink 5s linear forwards',
            }} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="mobile-content animate-fade-in">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <NavLink 
          to="/guru" 
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Home size={24} />
          <span>Tugas</span>
        </NavLink>
        
        <NavLink 
          to="/guru/jadwal" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <BookOpen size={24} />
          <span>Jadwal</span>
        </NavLink>

        <NavLink 
          to="/guru/riwayat" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Clock size={24} />
          <span>Riwayat</span>
        </NavLink>
        
        {kelasWali.length > 0 && (
          <NavLink 
            to="/guru/wali-kelas" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <FileText size={24} />
            <span>Laporan</span>
          </NavLink>
        )}
      </nav>
      {showProfile && user && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default GuruLayout;
