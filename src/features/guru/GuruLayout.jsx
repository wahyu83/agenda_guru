import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Clock, User, UserCog, WifiOff } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import ProfileModal from '../../components/ProfileModal';

const GuruLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAppStore();
  const [showProfile, setShowProfile] = useState(false);
  // Mock offline status
  const isOffline = false;

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
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
        
        {isOffline ? (
          <div className="flex items-center gap-1" style={{ backgroundColor: 'var(--warning)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '600' }}>
            <WifiOff size={14} /> Offline Mode
          </div>
        ) : !location.pathname.includes('/riwayat') ? (
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
             Logout
          </button>
        ) : null}
      </header>

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
          to="/guru/riwayat" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Clock size={24} />
          <span>Riwayat</span>
        </NavLink>
      </nav>
      {showProfile && user && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default GuruLayout;
