import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, ChevronRight, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const GuruDashboard = () => {
  const navigate = useNavigate();
  const { user, tugasGuru, fetchTugasGuru } = useAppStore();

  const sortedTugas = useMemo(() => {
    return [...tugasGuru].sort((a, b) =>
      (a.kelas?.nama || '').localeCompare(b.kelas?.nama || '', 'id')
    );
  }, [tugasGuru]);
  
  useEffect(() => {
    if (user?.id) {
      fetchTugasGuru(user.id);
    }
  }, [user, fetchTugasGuru]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Daftar Tugas</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pilih kelas untuk mengisi agenda & absensi.</p>
      </div>

      <div className="flex flex-col gap-3">
        {sortedTugas.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Belum ada jadwal mengajar yang ditugaskan kepada Anda.
          </div>
        ) : (
          sortedTugas.map((tugas) => (
            <div 
              key={tugas.id}
              className="card" 
              style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onClick={() => navigate(`/guru/agenda/${tugas.id}`)}
            >
              <div className="flex items-center gap-3">
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
                  <Book size={20} />
                </div>
                <div>
                  <h3 style={{ fontWeight: '600', fontSize: '1rem' }}>{tugas.kelas?.nama}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tugas.mapel?.nama}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            </div>
          ))
        )}
      </div>
      
      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--info)20', borderRadius: 'var(--radius-md)', border: '1px solid var(--info)40' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--info)' }}>Informasi Sinkronisasi</h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Semua data telah tersinkronisasi dengan server. Anda dapat mengisi data secara offline jika tidak ada koneksi internet.
        </p>
      </div>
    </div>
  );
};

export default GuruDashboard;
