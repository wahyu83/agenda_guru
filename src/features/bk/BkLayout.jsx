import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { UserCog, LayoutDashboard, FileWarning, MessagesSquare, Users, FileText } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import ProfileModal from '../../components/ProfileModal';

const BkLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppStore();
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/bk', label: 'Dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { path: '/bk/kasus', label: 'Kasus', icon: <FileWarning size={20} /> },
    { path: '/bk/konseling', label: 'Konseling', icon: <MessagesSquare size={20} /> },
    { path: '/bk/bimbingan', label: 'Bimbingan', icon: <Users size={20} /> },
    { path: '/bk/laporan', label: 'Laporan', icon: <FileText size={20} /> },
  ];

  return (
    <div className="mobile-layout">
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
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user?.nama || 'Guru BK'}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>Guru BK</span>
          </div>
        </div>
      </header>

      <main className="mobile-content animate-fade-in">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive: active }) => isActive(item.path) ? 'nav-item active' : 'nav-item'}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {showProfile && user && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default BkLayout;