import { create } from 'zustand';

export const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';



export const useAppStore = create((set, get) => ({
  tahunPelajaran: [],
  guru: [],
  mapel: [],
  kelas: [],
  siswa: [],
  pengampuAktif: [], // Menyimpan pengampu untuk kelas yang sedang dilihat
  tugasGuru: [], // Jadwal mengajar untuk guru yang login
  siswaKelasAktif: [], // Daftar siswa untuk kelas yang dipilih guru
  riwayatGuru: { agenda: [], absensi: [] },
  laporanAgenda: [],
  laporanAbsensi: [],
  kelasWali: [],
  laporanKelas: { agenda: [], absensi: [] },
  user: JSON.parse(localStorage.getItem('user')) || null,

  setUser: (userData) => set({ user: userData }),

  // --- FETCH ALL ---
  fetchMasterData: async () => {
    try {
      const [resTahun, resGuru, resMapel, resKelas, resSiswa] = await Promise.all([
        fetch(`${API_BASE}/admin/tahun-pelajaran`),
        fetch(`${API_BASE}/admin/guru`),
        fetch(`${API_BASE}/admin/mapel`),
        fetch(`${API_BASE}/admin/kelas`),
        fetch(`${API_BASE}/admin/siswa`)
      ]);
      set({
        tahunPelajaran: await resTahun.json(),
        guru: await resGuru.json(),
        mapel: await resMapel.json(),
        kelas: await resKelas.json(),
        siswa: await resSiswa.json()
      });
    } catch (err) {
      console.error("Gagal mengambil master data:", err);
    }
  },

  // --- TAHUN PELAJARAN ---
  addTahunPelajaran: async (nama, semester) => {
    const res = await fetch(`${API_BASE}/admin/tahun-pelajaran`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, semester })
    });
    const newData = await res.json();
    set((state) => ({ tahunPelajaran: [...state.tahunPelajaran, newData] }));
  },
  
  deleteTahunPelajaran: async (id) => {
    await fetch(`${API_BASE}/admin/tahun-pelajaran/${id}`, { method: 'DELETE' });
    set((state) => ({ tahunPelajaran: state.tahunPelajaran.filter((item) => item.id !== id) }));
  },

  setTahunAktif: async (id) => {
    await fetch(`${API_BASE}/admin/tahun-pelajaran/${id}/active`, { method: 'PUT' });
    set((state) => ({
      tahunPelajaran: state.tahunPelajaran.map((item) => 
        item.id === id ? { ...item, isActive: true } : { ...item, isActive: false }
      )
    }));
  },

  // --- GURU ---
  addGuru: async (data) => {
    const res = await fetch(`${API_BASE}/admin/guru`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data) // { nama, nip, username }
    });
    const newData = await res.json();
    set((state) => ({ guru: [...state.guru, newData] }));
  },
  
  deleteGuru: async (id) => {
    await fetch(`${API_BASE}/admin/guru/${id}`, { method: 'DELETE' });
    set((state) => ({ guru: state.guru.filter((item) => item.id !== id) }));
  },
  
  updateGuru: async (id, data) => {
    const res = await fetch(`${API_BASE}/admin/guru/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const newData = await res.json();
    set((state) => ({ guru: state.guru.map(item => item.id === id ? newData : item) }));
  },

  importGuru: async (payloads) => {
    await fetch(`${API_BASE}/admin/guru/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payloads })
    });
    get().fetchMasterData(); // Refresh data
  },

  // --- MAPEL ---
  addMapel: async (nama) => {
    const res = await fetch(`${API_BASE}/admin/mapel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama })
    });
    const newData = await res.json();
    set((state) => ({ mapel: [...state.mapel, newData] }));
  },
  
  deleteMapel: async (id) => {
    await fetch(`${API_BASE}/admin/mapel/${id}`, { method: 'DELETE' });
    set((state) => ({ mapel: state.mapel.filter((item) => item.id !== id) }));
  },
  
  updateMapel: async (id, nama) => {
    const res = await fetch(`${API_BASE}/admin/mapel/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama })
    });
    const newData = await res.json();
    set((state) => ({ mapel: state.mapel.map(item => item.id === id ? newData : item) }));
  },

  importMapel: async (payloads) => {
    await fetch(`${API_BASE}/admin/mapel/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payloads })
    });
    get().fetchMasterData();
  },

  // --- KELAS ---
  addKelas: async (nama) => {
    const res = await fetch(`${API_BASE}/admin/kelas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama })
    });
    if (res.ok) {
      const newData = await res.json();
      set((state) => ({ kelas: [...state.kelas, newData] }));
    } else {
      alert("Gagal menambah kelas. Pastikan ada Tahun Pelajaran aktif.");
    }
  },
  
  deleteKelas: async (id) => {
    await fetch(`${API_BASE}/admin/kelas/${id}`, { method: 'DELETE' });
    set((state) => ({ kelas: state.kelas.filter((item) => item.id !== id) }));
  },

  updateKelas: async (id, nama) => {
    const res = await fetch(`${API_BASE}/admin/kelas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama })
    });
    const newData = await res.json();
    set((state) => ({ kelas: state.kelas.map(item => item.id === id ? { ...item, nama: newData.nama } : item) }));
  },

  setWaliKelas: async (kelasId, waliKelasId) => {
    const res = await fetch(`${API_BASE}/admin/kelas/${kelasId}/wali`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waliKelasId })
    });
    if (res.ok) {
      const updated = await res.json();
      set((state) => ({ kelas: state.kelas.map(item => item.id === kelasId ? { ...item, waliKelasId: updated.waliKelasId, waliKelas: updated.waliKelas } : item) }));
    } else {
      alert('Gagal mengatur wali kelas');
    }
  },

  // --- SISWA ---
  addSiswa: async (data) => {
    const res = await fetch(`${API_BASE}/admin/siswa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data) // { nama, nis }
    });
    const newData = await res.json();
    set((state) => ({ siswa: [...state.siswa, newData] }));
  },
  
  deleteSiswa: async (id) => {
    await fetch(`${API_BASE}/admin/siswa/${id}`, { method: 'DELETE' });
    set((state) => ({ siswa: state.siswa.filter((item) => item.id !== id) }));
  },

  updateSiswa: async (id, data) => {
    const res = await fetch(`${API_BASE}/admin/siswa/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const newData = await res.json();
    set((state) => ({ siswa: state.siswa.map(item => item.id === id ? { ...item, ...newData } : item) }));
  },
  
  importSiswa: async (payloads, kelasId = null) => {
    await fetch(`${API_BASE}/admin/siswa/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payloads, kelasId })
    });
    get().fetchMasterData();
  },

  enrollSiswa: async (siswaId, kelasId) => {
    const res = await fetch(`${API_BASE}/admin/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siswaId, kelasId })
    });
    if (res.ok) {
      get().fetchMasterData();
    } else {
      alert("Gagal melakukan enroll. Mungkin siswa sudah ada di kelas ini.");
    }
  },

  enrollBatchSiswa: async (siswaIds, kelasId) => {
    const res = await fetch(`${API_BASE}/admin/enroll/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siswaIds, kelasId })
    });
    if (res.ok) {
      get().fetchMasterData();
    } else {
      alert("Gagal melakukan mutasi massal.");
    }
  },

  // --- PENGAMPU ---
  fetchPengampu: async (kelasId) => {
    const res = await fetch(`${API_BASE}/admin/pengampu/kelas/${kelasId}`);
    const data = await res.json();
    set({ pengampuAktif: data });
  },

  addPengampu: async (data) => {
    const res = await fetch(`${API_BASE}/admin/pengampu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const newData = await res.json();
      set((state) => ({ pengampuAktif: [...state.pengampuAktif, newData] }));
      return true;
    } else {
      alert("Gagal menambahkan pengampu. Mungkin kombinasi mapel ini sudah ada pengampunya di kelas ini.");
      return false;
    }
  },

  deletePengampu: async (id) => {
    await fetch(`${API_BASE}/admin/pengampu/${id}`, { method: 'DELETE' });
    set((state) => ({ pengampuAktif: state.pengampuAktif.filter(item => item.id !== id) }));
  },

  // --- PASSWORD MANAGEMENT ---
  changePassword: async (userId, oldPassword, newPassword) => {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, oldPassword, newPassword })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Gagal mengubah password');
    }
    return true;
  },

  resetPassword: async (guruId) => {
    const res = await fetch(`${API_BASE}/admin/guru/${guruId}/reset-password`, {
      method: 'PUT'
    });
    if (!res.ok) {
      throw new Error('Gagal melakukan reset password');
    }
    return true;
  },

  // --- GURU SPECIFIC ---
  fetchTugasGuru: async (guruId) => {
    const res = await fetch(`${API_BASE}/guru/tugas/${guruId}`);
    const data = await res.json();
    set({ tugasGuru: data });
  },

  fetchRiwayatGuru: async (guruId) => {
    const res = await fetch(`${API_BASE}/guru/riwayat/${guruId}`);
    const data = await res.json();
    set({ riwayatGuru: data });
  },

  updateAgenda: async (id, data) => {
    const res = await fetch(`${API_BASE}/guru/agenda/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Gagal update agenda');
    return await res.json();
  },

  deleteAgenda: async (id) => {
    const res = await fetch(`${API_BASE}/guru/agenda/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus agenda');
    return await res.json();
  },

  fetchDetailAbsensi: async (id) => {
    const res = await fetch(`${API_BASE}/guru/absensi-detail/${id}`);
    if (!res.ok) throw new Error('Gagal mengambil detail absensi');
    return await res.json();
  },

  updateAbsensi: async (id, data) => {
    const res = await fetch(`${API_BASE}/guru/absensi/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Gagal update absensi');
    return await res.json();
  },

  deleteAbsensi: async (id) => {
    const res = await fetch(`${API_BASE}/guru/absensi/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus absensi');
    return await res.json();
  },

  fetchLaporanAgenda: async () => {
    const res = await fetch(`${API_BASE}/admin/laporan/agenda`);
    const data = await res.json();
    set({ laporanAgenda: data });
  },

  fetchLaporanAbsensi: async () => {
    const res = await fetch(`${API_BASE}/admin/laporan/absensi`);
    const data = await res.json();
    set({ laporanAbsensi: data });
  },

  fetchSiswaKelas: async (kelasId) => {
    const res = await fetch(`${API_BASE}/guru/siswa-kelas/${kelasId}`);
    const data = await res.json();
    set({ siswaKelasAktif: data });
  },

  saveAgendaOnline: async (data) => {
    const res = await fetch(`${API_BASE}/guru/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Gagal menyimpan agenda');
    return await res.json();
  },

  saveAbsensiOnline: async (data) => {
    const res = await fetch(`${API_BASE}/guru/absensi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Gagal menyimpan absensi');
    return await res.json();
  },

  // --- WALI KELAS ---
  fetchWaliKelas: async (guruId) => {
    try {
      const res = await fetch(`${API_BASE}/guru/wali-kelas/${guruId}`);
      const data = await res.json();
      set({ kelasWali: data });
    } catch (err) {
      console.error('Gagal fetch wali kelas:', err);
    }
  },

  fetchLaporanKelas: async (kelasId) => {
    try {
      const res = await fetch(`${API_BASE}/guru/laporan-kelas/${kelasId}`);
      const data = await res.json();
      set({ laporanKelas: data });
    } catch (err) {
      console.error('Gagal fetch laporan kelas:', err);
    }
  }
}));
