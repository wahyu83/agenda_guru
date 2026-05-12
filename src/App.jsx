import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './lib/store';

// Layouts
import AdminLayout from './features/admin/AdminLayout';
import GuruLayout from './features/guru/GuruLayout';

// Auth
import LoginScreen from './features/auth/LoginScreen';

// Admin Pages
import AdminDashboard from './features/admin/pages/AdminDashboard';
import TahunPelajaran from './features/admin/pages/TahunPelajaran';
import GuruScreen from './features/admin/pages/GuruScreen';
import MapelScreen from './features/admin/pages/MapelScreen';
import KelasScreen from './features/admin/pages/KelasScreen';
import SiswaScreen from './features/admin/pages/SiswaScreen';
import LaporanScreen from './features/admin/pages/LaporanScreen';

// Guru Pages
import GuruDashboard from './features/guru/pages/GuruDashboard';
import AgendaScreen from './features/guru/pages/AgendaScreen';
import AbsensiScreen from './features/guru/pages/AbsensiScreen';
import RiwayatScreen from './features/guru/pages/RiwayatScreen';
import AbsensiEditScreen from './features/guru/pages/AbsensiEditScreen';
import WaliKelasScreen from './features/guru/pages/WaliKelasScreen';
import JadwalScreen from './features/guru/pages/JadwalScreen';
import NilaiScreen from './features/guru/pages/NilaiScreen';

function App() {
  const fetchMasterData = useAppStore((state) => state.fetchMasterData);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  return (
    <Router>
      <Routes>
        {/* Default route to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth Route */}
        <Route path="/login" element={<LoginScreen />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="tahun-pelajaran" element={<TahunPelajaran />} />
          <Route path="guru" element={<GuruScreen />} />
          <Route path="mapel" element={<MapelScreen />} />
          <Route path="kelas" element={<KelasScreen />} />
          <Route path="siswa" element={<SiswaScreen />} />
          <Route path="laporan" element={<LaporanScreen />} />
        </Route>

        {/* Guru Routes */}
        <Route path="/guru" element={<GuruLayout />}>
          <Route index element={<GuruDashboard />} />
          <Route path="agenda/:tugasId" element={<AgendaScreen />} />
          <Route path="absensi/:tugasId" element={<AbsensiScreen />} />
          <Route path="riwayat" element={<RiwayatScreen />} />
          <Route path="absensi-edit/:absensiId" element={<AbsensiEditScreen />} />
          <Route path="jadwal" element={<JadwalScreen />} />
          <Route path="nilai/:tugasId" element={<NilaiScreen />} />
          <Route path="wali-kelas" element={<WaliKelasScreen />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
