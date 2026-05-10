import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User } from 'lucide-react';
import { useAppStore } from '../../lib/store';

const LoginScreen = () => {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      // Simpan token
      localStorage.setItem('token', data.token);
      const userData = { role: data.role, nama: data.nama, id: data.id, nip: data.nip };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/guru');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen" style={{
      background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--secondary-light) 100%)'
    }}>
      <div className="glass card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div className="flex flex-col items-center justify-center gap-2" style={{ marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--primary)', borderRadius: 'var(--radius-full)', color: 'white' }}>
            <BookOpen size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Agenda Guru</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Username / Email</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Masukkan NIP atau Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text)' }}>Password</label>
            <input 
              type="password" 
              className="input" 
              placeholder="Masukkan password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
              {errorMsg}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.875rem' }} disabled={isLoading}>
            {isLoading ? 'Memeriksa...' : 'Sign In'}
          </button>
        </form>
        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          *Untuk Admin, gunakan username: <strong>admin</strong> dan password: <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
