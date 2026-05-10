import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Key, LogOut } from 'lucide-react';
import { useAppStore } from '../lib/store';

const ProfileModal = ({ user, onClose }) => {
  const navigate = useNavigate();
  const { changePassword, setUser } = useAppStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }

    try {
      await changePassword(user.id, oldPassword, newPassword);
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '1.5rem' }}>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={20} /> Pengaturan Akun
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontWeight: '600', fontSize: '1rem' }}>{user.nama}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Role: {user.role.toUpperCase()}</p>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Ganti Password</h3>
        
        {error && <div style={{ backgroundColor: 'var(--danger)20', color: 'var(--danger)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        {success && <div style={{ backgroundColor: 'var(--success)20', color: 'var(--success)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>Password berhasil diubah!</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Password Lama</label>
            <input 
              type="password" 
              className="input w-full" 
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Password Baru</label>
            <input 
              type="password" 
              className="input w-full" 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Konfirmasi Password Baru</label>
            <input 
              type="password" 
              className="input w-full" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary w-full mt-2" style={{ justifyContent: 'center' }}>
            Simpan Perubahan
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary w-full"
            style={{ color: 'var(--danger)', borderColor: 'var(--border-color)', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
          >
            <LogOut size={18} style={{ marginRight: '0.5rem' }} />
            Keluar (Logout)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
