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

// Mengambil jadwal mengajar dengan status agenda hari ini
router.get('/jadwal/:guruId', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tugas = await prisma.$queryRaw`
      SELECT p.*, 
        json_build_object('id', k.id, 'nama', k.nama, 'tahunPelajaranId', k."tahunPelajaranId", 'waliKelasId', k."waliKelasId") as kelas,
        json_build_object('id', m.id, 'nama', m.nama) as mapel,
        CASE 
          WHEN a.id IS NOT NULL THEN json_build_object('id', a.id, 'materi', a.materi, 'deskripsi', a.deskripsi, 'tanggal', a.tanggal)
          ELSE NULL
        END as "agendaHariIni"
      FROM "Pengampu" p
      JOIN "Kelas" k ON k.id = p."kelasId"
      JOIN "MataPelajaran" m ON m.id = p."mapelId"
      LEFT JOIN "Agenda" a ON a."pengampuId" = p.id 
        AND a.tanggal >= ${today}::date 
        AND a.tanggal < ${tomorrow}::date
      WHERE p."guruId" = ${parseInt(req.params.guruId)}
      ORDER BY 
        CASE p.hari
          WHEN 'Senin' THEN 1
          WHEN 'Selasa' THEN 2
          WHEN 'Rabu' THEN 3
          WHEN 'Kamis' THEN 4
          WHEN 'Jumat' THEN 5
          WHEN 'Sabtu' THEN 6
          ELSE 7
        END,
        p."jamKe" ASC
    `;

    res.json(tugas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil jadwal' });
  }
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

// --- WALI KELAS ---
router.get('/wali-kelas/:guruId', async (req, res) => {
  try {
    const kelasWali = await prisma.kelas.findMany({
      where: { waliKelasId: parseInt(req.params.guruId) },
      include: { 
        tahunPelajaran: true,
        _count: { select: { enrollment: true, pengampu: true } }
      }
    });
    res.json(kelasWali);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data wali kelas' });
  }
});

router.get('/laporan-kelas/:kelasId', async (req, res) => {
  try {
    const kelasId = parseInt(req.params.kelasId);

    // Get all pengampu for this class
    const pengampuList = await prisma.pengampu.findMany({
      where: { kelasId }
    });
    const pengampuIds = pengampuList.map(p => p.id);

    const [agenda, absensi] = await Promise.all([
      prisma.agenda.findMany({
        where: { pengampuId: { in: pengampuIds } },
        include: { pengampu: { include: { guru: true, kelas: true, mapel: true } } },
        orderBy: { tanggal: 'desc' }
      }),
      prisma.absensi.findMany({
        where: { pengampuId: { in: pengampuIds } },
        include: {
          pengampu: { include: { guru: true, kelas: true, mapel: true } },
          siswaDetail: { include: { siswa: true } }
        },
        orderBy: { tanggal: 'desc' }
      })
    ]);

    res.json({ agenda, absensi });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil laporan kelas' });
  }
});

module.exports = router;
