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
import JamPelajaranScreen from './features/admin/pages/JamPelajaranScreen';
import SettingsScreen from './features/admin/pages/SettingsScreen';
import BackupScreen from './features/admin/pages/BackupScreen';

// Guru Pages
import GuruDashboard from './features/guru/pages/GuruDashboard';
import AgendaScreen from './features/guru/pages/AgendaScreen';
import AbsensiScreen from './features/guru/pages/AbsensiScreen';
import RiwayatScreen from './features/guru/pages/RiwayatScreen';
import AbsensiEditScreen from './features/guru/pages/AbsensiEditScreen';
import WaliKelasScreen from './features/guru/pages/WaliKelasScreen';
import JadwalScreen from './features/guru/pages/JadwalScreen';
import NilaiScreen from './features/guru/pages/NilaiScreen';
import NilaiEditScreen from './features/guru/pages/NilaiEditScreen';
import RencanaScreen from './features/guru/pages/RencanaScreen';

// Piket
import PiketLayout from './features/piket/PiketLayout';
import PiketScreen from './features/piket/PiketScreen';
import IzinSiswaScreen from './features/piket/IzinSiswaScreen';

// Guru BK
import BkLayout from './features/bk/BkLayout';
import BkDashboard from './features/bk/pages/BkDashboard';
import KasusScreen from './features/bk/pages/KasusScreen';
import KonselingScreen from './features/bk/pages/KonselingScreen';
import BimbinganScreen from './features/bk/pages/BimbinganScreen';

function App() {
  const fetchMasterData = useAppStore((state) => state.fetchMasterData);
  const fetchSettings = useAppStore((state) => state.fetchSettings);
  const settings = useAppStore((state) => state.settings);

  useEffect(() => {
    fetchMasterData();
    fetchSettings();
  }, [fetchMasterData, fetchSettings]);

  useEffect(() => {
    document.title = `Agenda Guru ${settings?.namaSekolah || ''}`.trim();
  }, [settings?.namaSekolah]);

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
          <Route path="jam-pelajaran" element={<JamPelajaranScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
          <Route path="backup" element={<BackupScreen />} />
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
          <Route path="nilai-edit" element={<NilaiEditScreen />} />
          <Route path="rencana/:tugasId" element={<RencanaScreen />} />
          <Route path="wali-kelas" element={<WaliKelasScreen />} />
        </Route>

        {/* Piket Routes */}
        <Route path="/piket" element={<PiketLayout />}>
          <Route index element={<PiketScreen />} />
          <Route path="izin-siswa" element={<IzinSiswaScreen />} />
        </Route>

        {/* Guru BK Routes */}
        <Route path="/bk" element={<BkLayout />}>
          <Route index element={<BkDashboard />} />
          <Route path="kasus" element={<KasusScreen />} />
          <Route path="konseling" element={<KonselingScreen />} />
          <Route path="bimbingan" element={<BimbinganScreen />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
