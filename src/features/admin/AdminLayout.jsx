import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, BookOpen, GraduationCap, FileText, LogOut } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import ProfileModal from '../../components/ProfileModal';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [showProfile, setShowProfile] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} />, exact: true },
    { name: 'Tahun Pelajaran', path: '/admin/tahun-pelajaran', icon: <Calendar size={20} /> },
    { name: 'Data Guru', path: '/admin/guru', icon: <Users size={20} /> },
    { name: 'Mata Pelajaran', path: '/admin/mapel', icon: <BookOpen size={20} /> },
    { name: 'Data Kelas', path: '/admin/kelas', icon: <LayoutDashboard size={20} /> },
    { name: 'Data Siswa', path: '/admin/siswa', icon: <GraduationCap size={20} /> },
    { name: 'Laporan', path: '/admin/laporan', icon: <FileText size={20} /> },
  ];

  return (
    <div className="admin-layout bg-gray-50">
      {/* Sidebar */}
      <div className="admin-sidebar shadow-md">
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ padding: '0.5rem', backgroundColor: 'var(--primary)', borderRadius: 'var(--radius-md)', color: 'white' }}>
            <BookOpen size={24} />
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Admin Panel</span>
        </div>
        
        <nav style={{ padding: '1rem 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                borderRight: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                fontWeight: isActive ? '600' : '500',
                transition: 'all var(--transition-fast)'
              })}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => navigate('/login')}
            className="btn btn-secondary w-full"
            style={{ color: 'var(--danger)', borderColor: 'var(--border-color)' }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Sistem Absensi & Agenda</h2>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
            className="hover:bg-gray-100 transition-colors"
            onClick={() => setShowProfile(true)}
          >
            <span style={{ fontWeight: '500' }}>Halo, {user?.nama || 'Administrator'}</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(user?.nama || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className="admin-content animate-fade-in">
          <Outlet />
        </main>
      </div>

      {showProfile && user && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default AdminLayout;
