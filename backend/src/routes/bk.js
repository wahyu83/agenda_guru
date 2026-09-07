const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Helper tanggal lokal ke UTC date-only
const toDate = (s) => s ? new Date(s) : new Date();

// --- KASUS SISWA ---
router.get('/kasus', async (req, res) => {
  try {
    const { status, siswaId, kelasId } = req.query;
    const data = await prisma.bkKasus.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(siswaId ? { siswaId: parseInt(siswaId) } : {}),
        ...(kelasId ? { siswa: { enrollment: { some: { kelasId: parseInt(kelasId) } } } } : {})
      },
      include: {
        siswa: { include: { enrollment: { include: { kelas: true } } } },
        konselor: { select: { id: true, nama: true, nip: true } }
      },
      orderBy: { tanggal: 'desc' }
    });
    const formatted = data.map(k => ({
      ...k,
      kelas: k.siswa?.enrollment?.[0]?.kelas?.nama || '-'
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat kasus siswa.' });
  }
});

router.post('/kasus', async (req, res) => {
  try {
    const { siswaId, konselorId, jenisKasus, kronologi, tindakan, status, tanggal } = req.body;
    if (!siswaId || !konselorId || !jenisKasus || !kronologi) {
      return res.status(400).json({ error: 'Data kasus belum lengkap.' });
    }
    const data = await prisma.bkKasus.create({
      data: {
        siswaId: parseInt(siswaId),
        konselorId: parseInt(konselorId),
        jenisKasus,
        kronologi,
        tindakan: tindakan || null,
        status: status || 'diproses',
        tanggal: toDate(tanggal)
      },
      include: { siswa: true, konselor: { select: { id: true, nama: true } } }
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Gagal menambah kasus siswa.' });
  }
});

router.put('/kasus/:id', async (req, res) => {
  try {
    const { jenisKasus, kronologi, tindakan, status, tanggal } = req.body;
    const data = await prisma.bkKasus.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(jenisKasus !== undefined ? { jenisKasus } : {}),
        ...(kronologi !== undefined ? { kronologi } : {}),
        ...(tindakan !== undefined ? { tindakan } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(tanggal !== undefined ? { tanggal: toDate(tanggal) } : {})
      },
      include: { siswa: true }
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Gagal mengupdate kasus siswa.' });
  }
});

router.delete('/kasus/:id', async (req, res) => {
  try {
    await prisma.bkKasus.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Gagal menghapus kasus siswa.' });
  }
});

// --- KONSELING INDIVIDU ---
router.get('/konseling', async (req, res) => {
  try {
    const { siswaId, konselorId, kelasId } = req.query;
    const data = await prisma.bkKonseling.findMany({
      where: {
        ...(siswaId ? { siswaId: parseInt(siswaId) } : {}),
        ...(konselorId ? { konselorId: parseInt(konselorId) } : {}),
        ...(kelasId ? { siswa: { enrollment: { some: { kelasId: parseInt(kelasId) } } } } : {})
      },
      include: {
        siswa: { include: { enrollment: { include: { kelas: true } } } },
        konselor: { select: { id: true, nama: true } }
      },
      orderBy: { tanggal: 'desc' }
    });
    const formatted = data.map(c => ({
      ...c,
      kelas: c.siswa?.enrollment?.[0]?.kelas?.nama || '-'
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat konseling.' });
  }
});

router.post('/konseling', async (req, res) => {
  try {
    const { siswaId, konselorId, topik, catatan, tindakLanjut, tanggal } = req.body;
    if (!siswaId || !konselorId || !topik || !catatan) {
      return res.status(400).json({ error: 'Data konseling belum lengkap.' });
    }
    const data = await prisma.bkKonseling.create({
      data: {
        siswaId: parseInt(siswaId),
        konselorId: parseInt(konselorId),
        topik,
        catatan,
        tindakLanjut: tindakLanjut || null,
        tanggal: toDate(tanggal)
      },
      include: { siswa: true }
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Gagal menambah konseling.' });
  }
});

router.put('/konseling/:id', async (req, res) => {
  try {
    const { topik, catatan, tindakLanjut, tanggal } = req.body;
    const data = await prisma.bkKonseling.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(topik !== undefined ? { topik } : {}),
        ...(catatan !== undefined ? { catatan } : {}),
        ...(tindakLanjut !== undefined ? { tindakLanjut } : {}),
        ...(tanggal !== undefined ? { tanggal: toDate(tanggal) } : {})
      },
      include: { siswa: true }
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Gagal mengupdate konseling.' });
  }
});

router.delete('/konseling/:id', async (req, res) => {
  try {
    await prisma.bkKonseling.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Gagal menghapus konseling.' });
  }
});

// --- BIMBINGAN KELOMPOK / KLASIKAL ---
router.get('/bimbingan', async (req, res) => {
  try {
    const { konselorId, kelasId } = req.query;
    const data = await prisma.bkBimbingan.findMany({
      where: {
        ...(konselorId ? { konselorId: parseInt(konselorId) } : {}),
        ...(kelasId ? { kelasId: parseInt(kelasId) } : {})
      },
      include: {
        konselor: { select: { id: true, nama: true } },
        kelas: { select: { id: true, nama: true } },
        peserta: { include: { siswa: true } }
      },
      orderBy: { tanggal: 'desc' }
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat bimbingan.' });
  }
});

router.post('/bimbingan', async (req, res) => {
  try {
    const { konselorId, judul, topik, materi, tanggal, kelasId, pesertaIds } = req.body;
    if (!konselorId || !judul || !topik || !tanggal) {
      return res.status(400).json({ error: 'Data bimbingan belum lengkap.' });
    }
    const data = await prisma.bkBimbingan.create({
      data: {
        konselorId: parseInt(konselorId),
        judul,
        topik,
        materi: materi || null,
        tanggal: toDate(tanggal),
        kelasId: kelasId ? parseInt(kelasId) : null,
        peserta: Array.isArray(pesertaIds) && pesertaIds.length > 0
          ? { create: pesertaIds.map(pid => ({ siswaId: parseInt(pid) })) }
          : undefined
      },
      include: { konselor: { select: { id: true, nama: true } }, kelas: true, peserta: { include: { siswa: true } } }
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Gagal menambah bimbingan.' });
  }
});

router.put('/bimbingan/:id', async (req, res) => {
  try {
    const { judul, topik, materi, tanggal, kelasId, pesertaIds } = req.body;
    await prisma.bkBimbinganPeserta.deleteMany({ where: { bimbinganId: parseInt(req.params.id) } });
    const data = await prisma.bkBimbingan.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(judul !== undefined ? { judul } : {}),
        ...(topik !== undefined ? { topik } : {}),
        ...(materi !== undefined ? { materi } : {}),
        ...(tanggal !== undefined ? { tanggal: toDate(tanggal) } : {}),
        ...(kelasId !== undefined ? { kelasId: kelasId ? parseInt(kelasId) : null } : {}),
        ...(Array.isArray(pesertaIds)
          ? { peserta: { create: pesertaIds.map(pid => ({ siswaId: parseInt(pid) })) } }
          : {})
      },
      include: { kelas: true, peserta: { include: { siswa: true } } }
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Gagal mengupdate bimbingan.' });
  }
});

router.delete('/bimbingan/:id', async (req, res) => {
  try {
    await prisma.bkBimbingan.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Gagal menghapus bimbingan.' });
  }
});

// --- REKAP / DASHBOARD BK ---
router.get('/rekap', async (req, res) => {
  try {
    const { bulan } = req.query;
    const startBulan = bulan ? new Date(`${bulan}-01T00:00:00.000Z`) : null;
    const nextBulan = startBulan ? new Date(startBulan.getFullYear(), startBulan.getMonth() + 1, 1) : null;

    const kasusWhere = startBulan ? { tanggal: { gte: startBulan, lt: nextBulan } } : {};
    const konselingWhere = startBulan ? { tanggal: { gte: startBulan, lt: nextBulan } } : {};
    const bimbinganWhere = startBulan ? { tanggal: { gte: startBulan, lt: nextBulan } } : {};

    const [totalKasus, kasusSelesai, totalKonseling, totalBimbingan, totalPeserta] = await Promise.all([
      prisma.bkKasus.count({ where: kasusWhere }),
      prisma.bkKasus.count({ where: { ...kasusWhere, status: 'selesai' } }),
      prisma.bkKonseling.count({ where: konselingWhere }),
      prisma.bkBimbingan.count({ where: bimbinganWhere }),
      prisma.bkBimbinganPeserta.count({
        where: { bimbingan: bimbinganWhere }
      })
    ]);

    const kasusPerStatus = await prisma.bkKasus.groupBy({
      by: ['status'],
      where: kasusWhere,
      _count: { _all: true }
    });

    const kasusPerKelas = await prisma.bkKasus.findMany({
      where: kasusWhere,
      include: { siswa: { include: { enrollment: { include: { kelas: true } } } } }
    });
    const kelasMap = {};
    kasusPerKelas.forEach(k => {
      const nama = k.siswa?.enrollment?.[0]?.kelas?.nama || 'Tanpa Kelas';
      kelasMap[nama] = (kelasMap[nama] || 0) + 1;
    });

    res.json({
      totalKasus,
      kasusSelesai,
      kasusAktif: totalKasus - kasusSelesai,
      totalKonseling,
      totalBimbingan,
      totalPeserta,
      kasusPerStatus: Object.fromEntries(kasusPerStatus.map(r => [r.status, r._count._all])),
      kasusPerKelas: kelasMap
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat rekap BK.' });
  }
});

module.exports = router;