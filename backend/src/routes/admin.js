const express = require('express');
const router = express.Router();
const prisma = require('../db');

// --- TAHUN PELAJARAN ---
router.get('/tahun-pelajaran', async (req, res) => {
  const data = await prisma.tahunPelajaran.findMany();
  res.json(data);
});

router.post('/tahun-pelajaran', async (req, res) => {
  const { nama, semester } = req.body;
  const data = await prisma.tahunPelajaran.create({ data: { nama, semester } });
  res.json(data);
});

router.delete('/tahun-pelajaran/:id', async (req, res) => {
  await prisma.tahunPelajaran.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

router.put('/tahun-pelajaran/:id/active', async (req, res) => {
  const targetId = parseInt(req.params.id);
  // Set all to false
  await prisma.tahunPelajaran.updateMany({ data: { isActive: false } });
  // Set target to true
  const data = await prisma.tahunPelajaran.update({ where: { id: targetId }, data: { isActive: true } });
  res.json(data);
});

// --- GURU (User role: guru) ---
router.get('/guru', async (req, res) => {
  const data = await prisma.user.findMany({ where: { role: 'guru' } });
  res.json(data);
});

router.post('/guru', async (req, res) => {
  const { nama, nip, username, password } = req.body;
  // Fallback default password jika tidak dikirim
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password || 'guru123', 10);
  const data = await prisma.user.create({
    data: { nama, nip, username, password: hashedPassword, role: 'guru' }
  });
  res.json(data);
});

router.delete('/guru/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

router.put('/guru/:id', async (req, res) => {
  const { nama, nip, username, password } = req.body;
  const updateData = { nama, nip, username };
  
  if (password && password.trim() !== '') {
    const bcrypt = require('bcrypt');
    updateData.password = await bcrypt.hash(password, 10);
  }
  
  const data = await prisma.user.update({
    where: { id: parseInt(req.params.id) },
    data: updateData
  });
  res.json(data);
});

router.put('/guru/:id/reset-password', async (req, res) => {
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('123456', 10);
  const data = await prisma.user.update({
    where: { id: parseInt(req.params.id) },
    data: { password: hashedPassword }
  });
  res.json({ success: true });
});

router.post('/guru/batch', async (req, res) => {
  const { payloads } = req.body;
  const bcrypt = require('bcrypt');
  
  const processedData = await Promise.all(payloads.map(async (item) => ({
    nama: item.nama,
    nip: item.nip || '-',
    username: item.username,
    password: await bcrypt.hash(item.password || 'guru123', 10),
    role: 'guru'
  })));

  await prisma.user.createMany({ data: processedData, skipDuplicates: true });
  res.json({ success: true, count: payloads.length });
});

// --- MATA PELAJARAN ---
router.get('/mapel', async (req, res) => {
  const data = await prisma.mataPelajaran.findMany();
  res.json(data);
});

router.post('/mapel', async (req, res) => {
  const data = await prisma.mataPelajaran.create({ data: { nama: req.body.nama } });
  res.json(data);
});

router.delete('/mapel/:id', async (req, res) => {
  await prisma.mataPelajaran.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

router.put('/mapel/:id', async (req, res) => {
  const data = await prisma.mataPelajaran.update({
    where: { id: parseInt(req.params.id) },
    data: { nama: req.body.nama }
  });
  res.json(data);
});

router.post('/mapel/batch', async (req, res) => {
  const { payloads } = req.body;
  const processedData = payloads.map(item => ({ nama: item.nama }));
  await prisma.mataPelajaran.createMany({ data: processedData, skipDuplicates: true });
  res.json({ success: true, count: payloads.length });
});

// --- KELAS ---
router.get('/kelas', async (req, res) => {
  const data = await prisma.kelas.findMany({ 
    include: { 
      tahunPelajaran: true,
      _count: {
        select: { enrollment: true, pengampu: true }
      }
    } 
  });
  
  const formatted = data.map(k => ({
    ...k,
    jumlahSiswa: k._count.enrollment,
    jumlahPengampu: k._count.pengampu
  }));
  res.json(formatted);
});

router.post('/kelas', async (req, res) => {
  // Anggap kita ambil TP aktif pertama untuk contoh ini
  const tp = await prisma.tahunPelajaran.findFirst({ where: { isActive: true } });
  if (!tp) return res.status(400).json({ error: 'Tidak ada Tahun Pelajaran aktif' });
  const data = await prisma.kelas.create({ data: { nama: req.body.nama, tahunPelajaranId: tp.id } });
  res.json(data);
});

router.delete('/kelas/:id', async (req, res) => {
  await prisma.kelas.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

router.put('/kelas/:id', async (req, res) => {
  const data = await prisma.kelas.update({
    where: { id: parseInt(req.params.id) },
    data: { nama: req.body.nama }
  });
  res.json(data);
});

// --- SISWA ---
router.get('/siswa', async (req, res) => {
  const data = await prisma.siswa.findMany({ include: { enrollment: { include: { kelas: true } } } });
  res.json(data);
});

router.post('/siswa', async (req, res) => {
  const data = await prisma.siswa.create({ data: { nama: req.body.nama, nis: req.body.nis } });
  res.json(data);
});

router.delete('/siswa/:id', async (req, res) => {
  await prisma.siswa.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

router.put('/siswa/:id', async (req, res) => {
  const data = await prisma.siswa.update({
    where: { id: parseInt(req.params.id) },
    data: { nama: req.body.nama, nis: req.body.nis }
  });
  res.json(data);
});

router.post('/siswa/batch', async (req, res) => {
  const { payloads } = req.body;
  const processedData = payloads.map(item => ({ nama: item.nama, nis: item.nis }));
  await prisma.siswa.createMany({ data: processedData, skipDuplicates: true });
  res.json({ success: true, count: payloads.length });
});

// --- ENROLLMENT ---
router.post('/enroll', async (req, res) => {
  const { siswaId, kelasId } = req.body;
  try {
    const data = await prisma.enrollment.create({
      data: { siswaId: parseInt(siswaId), kelasId: parseInt(kelasId) }
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: 'Siswa mungkin sudah terdaftar di kelas ini.' });
  }
});

router.post('/enroll/batch', async (req, res) => {
  const { siswaIds, kelasId } = req.body;
  try {
    const payloads = siswaIds.map(id => ({
      siswaId: parseInt(id),
      kelasId: parseInt(kelasId)
    }));
    await prisma.enrollment.createMany({ data: payloads, skipDuplicates: true });
    res.json({ success: true, count: siswaIds.length });
  } catch (err) {
    res.status(400).json({ error: 'Gagal melakukan mutasi massal.' });
  }
});

// --- PENGAMPU ---
router.get('/pengampu/kelas/:id', async (req, res) => {
  const kelasId = parseInt(req.params.id);
  const data = await prisma.pengampu.findMany({
    where: { kelasId },
    include: { guru: true, mapel: true }
  });
  res.json(data);
});

router.post('/pengampu', async (req, res) => {
  const { guruId, mapelId, kelasId } = req.body;
  try {
    const data = await prisma.pengampu.create({
      data: {
        guruId: parseInt(guruId),
        mapelId: parseInt(mapelId),
        kelasId: parseInt(kelasId)
      },
      include: { guru: true, mapel: true }
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: 'Gagal menambahkan pengampu.' });
  }
});

// --- LAPORAN TRANSAKSIONAL ---
router.get('/laporan/agenda', async (req, res) => {
  const data = await prisma.agenda.findMany({
    include: { pengampu: { include: { guru: true, kelas: true, mapel: true } } },
    orderBy: { tanggal: 'desc' }
  });
  res.json(data);
});

router.get('/laporan/absensi', async (req, res) => {
  const data = await prisma.absensi.findMany({
    include: { 
      pengampu: { include: { guru: true, kelas: true, mapel: true } },
      siswaDetail: { include: { siswa: true } }
    },
    orderBy: { tanggal: 'desc' }
  });
  
  res.json(data);
});

router.delete('/pengampu/:id', async (req, res) => {
  await prisma.pengampu.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

module.exports = router;
