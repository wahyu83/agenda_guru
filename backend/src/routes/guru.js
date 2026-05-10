const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Mengambil jadwal tugas/pengampu untuk guru tertentu (dummy middleware guruId = 1 untuk sekarang jika tanpa JWT map)
router.get('/tugas/:guruId', async (req, res) => {
  const tugas = await prisma.pengampu.findMany({
    where: { guruId: parseInt(req.params.guruId) },
    include: { kelas: true, mapel: true }
  });
  res.json(tugas);
});

// Endpoint menyimpan agenda tunggal (Online)
router.post('/agenda', async (req, res) => {
  const { pengampuId, tanggal, materi, deskripsi, catatan } = req.body;
  try {
    const agenda = await prisma.agenda.create({
      data: {
        pengampuId: parseInt(pengampuId),
        tanggal: new Date(tanggal),
        materi,
        deskripsi,
        catatan: catatan || '',
        status_sync: 'synced',
        last_modified: new Date()
      }
    });
    res.json(agenda);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan agenda' });
  }
});

// Endpoint menyimpan absensi tunggal (Online)
router.post('/absensi', async (req, res) => {
  const { pengampuId, tanggal, dataAbsensi } = req.body;
  try {
    // Buat header absensi
    const absensi = await prisma.absensi.create({
      data: {
        pengampuId: parseInt(pengampuId),
        tanggal: new Date(tanggal),
        status_sync: 'synced',
        last_modified: new Date()
      }
    });
    
    // Buat detail siswa
    const detailData = dataAbsensi.map(siswa => ({
      absensiId: absensi.id,
      siswaId: parseInt(siswa.id),
      status: siswa.status
    }));
    
    await prisma.absensiSiswa.createMany({
      data: detailData
    });

    res.json({ success: true, absensiId: absensi.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan absensi' });
  }
});

// Mengambil siswa di kelas tertentu
router.get('/siswa-kelas/:kelasId', async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { kelasId: parseInt(req.params.kelasId) },
      include: { siswa: true }
    });
    const siswaList = enrollments.map(e => e.siswa);
    res.json(siswaList);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data siswa' });
  }
});

// Mengambil riwayat agenda & absensi
router.get('/riwayat/:guruId', async (req, res) => {
  try {
    const pengampu = await prisma.pengampu.findMany({
      where: { guruId: parseInt(req.params.guruId) }
    });
    const pengampuIds = pengampu.map(p => p.id);

    const [agenda, absensi] = await Promise.all([
      prisma.agenda.findMany({
        where: { pengampuId: { in: pengampuIds } },
        include: { pengampu: { include: { kelas: true, mapel: true } } },
        orderBy: { tanggal: 'desc' },
        take: 50
      }),
      prisma.absensi.findMany({
        where: { pengampuId: { in: pengampuIds } },
        include: { 
          pengampu: { include: { kelas: true, mapel: true } },
          siswaDetail: { include: { siswa: true } }
        },
        orderBy: { tanggal: 'desc' },
        take: 50
      })
    ]);

    res.json({ agenda, absensi });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil riwayat' });
  }
});

// --- EDIT & DELETE AGENDA ---
router.put('/agenda/:id', async (req, res) => {
  const { materi, deskripsi, catatan } = req.body;
  try {
    const agenda = await prisma.agenda.update({
      where: { id: parseInt(req.params.id) },
      data: { materi, deskripsi, catatan, last_modified: new Date() }
    });
    res.json(agenda);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update agenda' });
  }
});

router.delete('/agenda/:id', async (req, res) => {
  try {
    await prisma.agenda.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus agenda' });
  }
});

// --- EDIT & DELETE ABSENSI ---
router.get('/absensi-detail/:id', async (req, res) => {
  try {
    const absensi = await prisma.absensi.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        siswaDetail: {
          include: { siswa: true }
        },
        pengampu: {
          include: { kelas: true, mapel: true }
        }
      }
    });
    res.json(absensi);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail absensi' });
  }
});

router.put('/absensi/:id', async (req, res) => {
  const { dataAbsensi } = req.body; // Array of { id: absensiSiswaId, status: newStatus }
  try {
    // We update each student's attendance detail
    await prisma.$transaction(
      dataAbsensi.map((detail) => 
        prisma.absensiSiswa.update({
          where: { id: parseInt(detail.id) },
          data: { status: detail.status }
        })
      )
    );
    
    // Update last modified of the header
    await prisma.absensi.update({
      where: { id: parseInt(req.params.id) },
      data: { last_modified: new Date() }
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal update absensi' });
  }
});

router.delete('/absensi/:id', async (req, res) => {
  try {
    // This will cascade delete AbsensiSiswa due to schema configuration
    await prisma.absensi.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus absensi' });
  }
});

module.exports = router;
