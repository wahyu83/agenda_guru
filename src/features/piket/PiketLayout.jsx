import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { UserCog } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import ProfileModal from '../../components/ProfileModal';

const PiketLayout = () => {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

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
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user?.nama || 'Guru Piket'}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>Guru Piket</span>
          </div>
        </div>
      </header>

      <main className="mobile-content animate-fade-in">
        <Outlet />
      </main>

      {showProfile && user && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default PiketLayout;
