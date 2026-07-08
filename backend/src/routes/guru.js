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

// Mengambil detail absensi berdasarkan ID
router.get('/absensi-detail/:id', async (req, res) => {
  try {
    const absensi = await prisma.absensi.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        pengampu: { include: { kelas: true, mapel: true } },
        siswaDetail: { include: { siswa: true } }
      }
    });
    if (!absensi) {
      return res.status(404).json({ error: 'Absensi tidak ditemukan' });
    }
    res.json(absensi);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil detail absensi' });
  }
});

// Update absensi
router.put('/absensi/:id', async (req, res) => {
  try {
    const { dataAbsensi } = req.body;
    const absensiId = parseInt(req.params.id);

    // Update last_modified pada header absensi
    await prisma.absensi.update({
      where: { id: absensiId },
      data: { last_modified: new Date() }
    });

    // Update detail siswa: hapus yang lama, buat yang baru
    await prisma.absensiSiswa.deleteMany({
      where: { absensiId }
    });

    const detailData = dataAbsensi.map(siswa => ({
      absensiId: absensiId,
      siswaId: parseInt(siswa.siswaId || siswa.id),
      status: siswa.status
    }));

    await prisma.absensiSiswa.createMany({
      data: detailData
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal update absensi' });
  }
});

// Hapus absensi
router.delete('/absensi/:id', async (req, res) => {
  try {
    await prisma.absensi.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus absensi' });
  }
});

// Update agenda
router.put('/agenda/:id', async (req, res) => {
  try {
    const { materi, deskripsi, catatan } = req.body;
    const agenda = await prisma.agenda.update({
      where: { id: parseInt(req.params.id) },
      data: {
        materi,
        deskripsi,
        catatan: catatan || '',
        last_modified: new Date()
      }
    });
    res.json(agenda);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal update agenda' });
  }
});

// Hapus agenda
router.delete('/agenda/:id', async (req, res) => {
  try {
    await prisma.agenda.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus agenda' });
  }
});

// Mengambil siswa di kelas tertentu
router.get('/siswa-kelas/:kelasId', async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { kelasId: parseInt(req.params.kelasId) },
      include: { siswa: true }
    });
    const siswaList = enrollments.map(e => ({ ...e.siswa, enrollmentId: e.id }));
    res.json(siswaList);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data siswa' });
  }
});

router.get('/enrollment/:kelasId', async (req, res) => {
  try {
    const data = await prisma.enrollment.findMany({
      where: { kelasId: parseInt(req.params.kelasId) },
      include: { siswa: true }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil enrollment' });
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
    res.status(500).json({ error: 'Gagal mengambil laporan kelas' });
  }
});

// --- NILAI ---
router.post('/nilai', async (req, res) => {
  try {
    const { pengampuId, dataNilai } = req.body;

    const payloads = dataNilai.map(d => ({
      pengampuId: parseInt(pengampuId),
      siswaId: parseInt(d.siswaId),
      enrollmentId: parseInt(d.enrollmentId),
      jenis: d.jenis || 'tugas',
      nilai: parseFloat(d.nilai),
      tanggal: new Date(d.tanggal),
      deskripsi: d.deskripsi || '',
      last_modified: new Date()
    }));

    await prisma.nilai.createMany({ data: payloads });
    res.json({ success: true, count: payloads.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan nilai' });
  }
});

router.get('/nilai-riwayat/:guruId', async (req, res) => {
  try {
    const pengampu = await prisma.pengampu.findMany({
      where: { guruId: parseInt(req.params.guruId) }
    });
    const pengampuIds = pengampu.map(p => p.id);

    const nilai = await prisma.nilai.findMany({
      where: { pengampuId: { in: pengampuIds } },
      include: {
        siswa: { select: { id: true, nama: true, nis: true } },
        pengampu: { include: { kelas: { select: { id: true, nama: true } }, mapel: { select: { id: true, nama: true } } } }
      },
      orderBy: { tanggal: 'desc' }
    });

    res.json(nilai);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil riwayat nilai' });
  }
});

router.get('/nilai-session/:pengampuId', async (req, res) => {
  try {
    const { tanggal, jenis, deskripsi } = req.query;
    const where = {
      pengampuId: parseInt(req.params.pengampuId),
      tanggal: new Date(tanggal),
      jenis: jenis || 'tugas',
    };
    if (deskripsi) {
      where.deskripsi = deskripsi;
    } else {
      where.OR = [{ deskripsi: null }, { deskripsi: '' }];
    }
    const nilai = await prisma.nilai.findMany({
      where,
      include: {
        siswa: { select: { id: true, nama: true, nis: true } },
        pengampu: { include: { kelas: { select: { id: true, nama: true } }, mapel: { select: { id: true, nama: true } } } }
      },
      orderBy: { id: 'asc' }
    });
    res.json(nilai);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil session nilai' });
  }
});

router.get('/nilai-export/:kelasId', async (req, res) => {
  try {
    const kelasId = parseInt(req.params.kelasId);
    const { mapelId, format } = req.query;

    const pengampuWhere = { kelasId };
    if (mapelId) pengampuWhere.mapelId = parseInt(mapelId);

    const pengampuList = await prisma.pengampu.findMany({
      where: pengampuWhere,
      include: { guru: { select: { id: true, nama: true } }, mapel: { select: { id: true, nama: true } }, kelas: { select: { id: true, nama: true } } }
    });

    const pengampuIds = pengampuList.map(p => p.id);

    const nilai = await prisma.nilai.findMany({
      where: { pengampuId: { in: pengampuIds } },
      include: {
        siswa: { select: { id: true, nama: true, nis: true } },
        pengampu: { include: { guru: { select: { id: true, nama: true } }, mapel: { select: { id: true, nama: true } } } }
      },
      orderBy: [{ tanggal: 'asc' }, { id: 'asc' }]
    });

    if (format === 'json') {
      res.json({ nilai, pengampu: pengampuList, kelas: pengampuList[0]?.kelas });
    } else {
      res.json({ nilai, pengampu: pengampuList, kelas: pengampuList[0]?.kelas });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal export nilai' });
  }
});

router.put('/nilai/batch', async (req, res) => {
  try {
    const { pengampuId, dataNilai } = req.body;
    const first = dataNilai[0];
    const delWhere = {
      pengampuId: parseInt(pengampuId),
      tanggal: new Date(first.tanggal),
      jenis: first.jenis || 'tugas',
    };
    if (first.deskripsi) {
      delWhere.deskripsi = first.deskripsi;
    } else {
      delWhere.OR = [{ deskripsi: null }, { deskripsi: '' }];
    }
    await prisma.nilai.deleteMany({ where: delWhere });

    const payloads = dataNilai.map(d => ({
      pengampuId: parseInt(pengampuId),
      siswaId: parseInt(d.siswaId),
      enrollmentId: parseInt(d.enrollmentId),
      tanggal: new Date(d.tanggal),
      jenis: d.jenis || 'tugas',
      nilai: parseFloat(d.nilai),
      deskripsi: d.deskripsi || '',
      last_modified: new Date()
    }));

    await prisma.nilai.createMany({ data: payloads });
    res.json({ success: true, count: payloads.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal batch update nilai' });
  }
});

router.put('/nilai/:id', async (req, res) => {
  try {
    const { jenis, nilai, deskripsi } = req.body;
    const data = await prisma.nilai.update({
      where: { id: parseInt(req.params.id) },
      data: {
        jenis: jenis || 'tugas',
        nilai: parseFloat(nilai),
        deskripsi: deskripsi || '',
        last_modified: new Date()
      },
      include: { siswa: { select: { id: true, nama: true, nis: true } } }
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal update nilai' });
  }
});

router.delete('/nilai/:id', async (req, res) => {
  try {
    await prisma.nilai.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus nilai' });
  }
});

// Must be last to avoid matching /nilai-session, /nilai-riwayat, etc.
router.get('/nilai/:kelasId', async (req, res) => {
  try {
    const kelasId = parseInt(req.params.kelasId);
    const { mapelId } = req.query;

    const pengampuWhere = { kelasId };
    if (mapelId) pengampuWhere.mapelId = parseInt(mapelId);

    const pengampuList = await prisma.pengampu.findMany({
      where: pengampuWhere,
      include: { guru: { select: { id: true, nama: true } }, mapel: { select: { id: true, nama: true } } }
    });

    const pengampuIds = pengampuList.map(p => p.id);

    const nilai = await prisma.nilai.findMany({
      where: { pengampuId: { in: pengampuIds } },
      include: {
        siswa: { select: { id: true, nama: true, nis: true } },
        pengampu: { include: { guru: { select: { id: true, nama: true } }, mapel: { select: { id: true, nama: true } } } }
      },
      orderBy: [{ tanggal: 'desc' }, { id: 'asc' }]
    });

    res.json({ nilai, pengampu: pengampuList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data nilai' });
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

// --- RPP ---
function getBase64FileSize(base64String) {
  if (!base64String) return 0;
  const base64Part = base64String.includes(',') ? base64String.split(',')[1] : base64String;
  if (!base64Part) return 0;
  // Base64 length * 3/4 approximates original bytes (ignoring padding)
  return Math.floor(base64Part.length * 3 / 4);
}

router.post('/rpp', async (req, res) => {
  try {
    const { pengampuId, judul, fileData, fileName, fileType, deskripsi } = req.body;

    // Get guruId from pengampu
    const pengampu = await prisma.pengampu.findUnique({
      where: { id: parseInt(pengampuId) },
      select: { guruId: true }
    });
    if (!pengampu) {
      return res.status(404).json({ error: 'Pengampu tidak ditemukan' });
    }

    // Find all pengampu for this guru
    const allPengampu = await prisma.pengampu.findMany({
      where: { guruId: pengampu.guruId },
      select: { id: true }
    });
    const pengampuIds = allPengampu.map(p => p.id);

    // Calculate total existing RPP size for this guru
    const existingRpps = await prisma.rpp.findMany({
      where: { pengampuId: { in: pengampuIds } },
      select: { fileData: true }
    });

    let totalExistingBytes = 0;
    for (const rpp of existingRpps) {
      totalExistingBytes += getBase64FileSize(rpp.fileData);
    }

    const newFileBytes = getBase64FileSize(fileData);
    const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50MB

    if (totalExistingBytes + newFileBytes > MAX_TOTAL_BYTES) {
      const usedMB = (totalExistingBytes / (1024 * 1024)).toFixed(1);
      return res.status(400).json({
        error: `Storage RPP Anda sudah terpakai ${usedMB}MB dari batas 50MB. Hapus RPP lama untuk upload file baru.`
      });
    }

    const rpp = await prisma.rpp.create({
      data: {
        pengampuId: parseInt(pengampuId),
        judul,
        fileData,
        fileName,
        fileType,
        deskripsi: deskripsi || '',
        tanggalUpload: new Date()
      }
    });
    res.json(rpp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan RPP' });
  }
});

router.get('/rpp/:pengampuId', async (req, res) => {
  try {
    const rppList = await prisma.rpp.findMany({
      where: { pengampuId: parseInt(req.params.pengampuId) },
      orderBy: { tanggalUpload: 'desc' }
    });
    res.json(rppList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil RPP' });
  }
});

router.delete('/rpp/:id', async (req, res) => {
  try {
    await prisma.rpp.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus RPP' });
  }
});

// Endpoint untuk melihat file RPP langsung di browser (tanpa download)
router.get('/rpp-file/:id', async (req, res) => {
  try {
    const rpp = await prisma.rpp.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!rpp) {
      return res.status(404).json({ error: 'RPP tidak ditemukan' });
    }

    // Extract base64 data (handle data:application/pdf;base64,xxx format)
    let base64Data = rpp.fileData;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const contentType = rpp.fileType || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${rpp.fileName}"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil file RPP' });
  }
});

module.exports = router;
