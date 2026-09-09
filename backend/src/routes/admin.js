const express = require('express');
const router = express.Router();
const prisma = require('../db');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

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

router.put('/tahun-pelajaran/:id', async (req, res) => {
  const { nama, semester } = req.body;
  const data = await prisma.tahunPelajaran.update({
    where: { id: parseInt(req.params.id) },
    data: { nama, semester }
  });
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

// --- GURU (User role: guru atau guru_piket) ---
router.get('/guru', async (req, res) => {
  const data = await prisma.user.findMany({
    where: {
      role: { in: ['guru', 'guru_piket', 'guru_bk'] }
    },
    orderBy: { nama: 'asc' }
  });
  res.json(data);
});

router.post('/guru', async (req, res) => {
  const { nama, nip, username, password, role } = req.body;
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password || 'guru123', 10);
  const data = await prisma.user.create({
    data: { nama, nip, username, password: hashedPassword, role: role || 'guru' }
  });
  res.json(data);
});

router.delete('/guru/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

router.put('/guru/:id', async (req, res) => {
  const { nama, nip, username, password, role } = req.body;
  const updateData = { nama, nip, username };
  if (role) updateData.role = role;
  
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
    orderBy: { nama: 'asc' },
    include: { 
      tahunPelajaran: true,
      waliKelas: { select: { id: true, nama: true, nip: true } },
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
  const created = await prisma.kelas.create({ data: { nama: req.body.nama, tahunPelajaranId: tp.id } });
  const data = await prisma.kelas.findUnique({
    where: { id: created.id },
    include: { 
      tahunPelajaran: true,
      waliKelas: { select: { id: true, nama: true, nip: true } },
      _count: { select: { enrollment: true, pengampu: true } }
    }
  });
  res.json({
    ...data,
    jumlahSiswa: data._count.enrollment,
    jumlahPengampu: data._count.pengampu
  });
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

router.put('/kelas/:id/wali', async (req, res) => {
  try {
    const { waliKelasId } = req.body;
    const data = await prisma.kelas.update({
      where: { id: parseInt(req.params.id) },
      data: { waliKelasId: waliKelasId ? parseInt(waliKelasId) : null },
      include: { waliKelas: { select: { id: true, nama: true, nip: true } } }
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengatur wali kelas' });
  }
});

// --- SISWA ---
router.get('/siswa', async (req, res) => {
  const data = await prisma.siswa.findMany({ include: { enrollment: { include: { kelas: true } } } });
  res.json(data);
});

router.post('/siswa', async (req, res) => {
  const created = await prisma.siswa.create({ data: { nama: req.body.nama, nis: req.body.nis } });
  const data = await prisma.siswa.findUnique({
    where: { id: created.id },
    include: { enrollment: { include: { kelas: true } } }
  });
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
  const { payloads, kelasId } = req.body;
  const processedData = payloads.map(item => ({ nama: item.nama, nis: item.nis }));
  
  await prisma.siswa.createMany({ data: processedData, skipDuplicates: true });

  if (kelasId) {
    const nisList = processedData.map(p => p.nis);
    const createdSiswa = await prisma.siswa.findMany({
      where: { nis: { in: nisList } }
    });
    
    const enrollPayloads = createdSiswa.map(s => ({
      siswaId: s.id,
      kelasId: parseInt(kelasId)
    }));
    
    await prisma.enrollment.createMany({ data: enrollPayloads, skipDuplicates: true });
  }

  res.json({ success: true, count: payloads.length });
});

// --- ENROLLMENT ---
router.post('/enroll', async (req, res) => {
  const { siswaId, kelasId } = req.body;
  try {
    const data = await prisma.$transaction(async (tx) => {
      await tx.enrollment.deleteMany({ where: { siswaId: parseInt(siswaId) } });
      return tx.enrollment.create({
        data: { siswaId: parseInt(siswaId), kelasId: parseInt(kelasId) }
      });
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: 'Siswa mungkin sudah terdaftar di kelas ini.' });
  }
});

router.post('/enroll/batch', async (req, res) => {
  const { siswaIds, kelasId } = req.body;
  try {
    const ids = siswaIds.map(id => parseInt(id));
    const targetKelasId = parseInt(kelasId);
    await prisma.$transaction(async (tx) => {
      await tx.enrollment.deleteMany({ where: { siswaId: { in: ids } } });
      const payloads = ids.map(siswaId => ({ siswaId, kelasId: targetKelasId }));
      await tx.enrollment.createMany({ data: payloads });
    });
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
  const { guruId, mapelId, kelasId, hari, jamKe, jamSampai } = req.body;
  try {
    const data = await prisma.pengampu.create({
      data: {
        guruId: parseInt(guruId),
        mapelId: parseInt(mapelId),
        kelasId: parseInt(kelasId),
        hari: hari || 'Senin',
        jamKe: parseInt(jamKe) || 1,
        jamSampai: parseInt(jamSampai) || parseInt(jamKe) || 1
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

// --- LAPORAN PIKET ---
router.get('/laporan/piket', async (req, res) => {
  try {
    const { date } = req.query;
    const where = {};
    if (date) {
      where.tanggal = new Date(date);
    }

    const data = await prisma.piket.findMany({
      where,
      include: {
        pengampu: {
          include: { guru: true, kelas: true, mapel: true }
        },
        piketBy: true
      },
      orderBy: { tanggal: 'desc' }
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil laporan piket' });
  }
});

router.put('/pengampu/:id', async (req, res) => {
  try {
    const { guruId, mapelId, hari, jamKe, jamSampai } = req.body;
    const data = await prisma.pengampu.update({
      where: { id: parseInt(req.params.id) },
      data: {
        guruId: parseInt(guruId),
        mapelId: parseInt(mapelId),
        hari: hari || 'Senin',
        jamKe: parseInt(jamKe) || 1,
        jamSampai: parseInt(jamSampai) || parseInt(jamKe) || 1
      },
      include: { guru: true, mapel: true }
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: 'Gagal mengupdate pengampu.' });
  }
});

router.delete('/pengampu/:id', async (req, res) => {
  await prisma.pengampu.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

// --- JAM PELAJARAN ---
router.get('/jam-pelajaran', async (req, res) => {
  const data = await prisma.jamPelajaran.findMany({ orderBy: { jamKe: 'asc' } });
  res.json(data);
});

router.post('/jam-pelajaran', async (req, res) => {
  try {
    const { jamKe, mulai, selesai } = req.body;
    const data = await prisma.jamPelajaran.create({
      data: { jamKe: parseInt(jamKe), mulai, selesai }
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: 'Gagal menambah jam pelajaran.' });
  }
});

router.put('/jam-pelajaran/:id', async (req, res) => {
  try {
    const { jamKe, mulai, selesai } = req.body;
    const data = await prisma.jamPelajaran.update({
      where: { id: parseInt(req.params.id) },
      data: { jamKe: parseInt(jamKe), mulai, selesai }
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: 'Gagal mengupdate jam pelajaran.' });
  }
});

router.delete('/jam-pelajaran/:id', async (req, res) => {
  await prisma.jamPelajaran.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

// --- PENGATURAN SEKOLAH ---
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

router.get('/settings', async (req, res) => {
  try {
    let settings = await prisma.schoolSettings.findFirst();
    if (!settings) {
      settings = await prisma.schoolSettings.create({
        data: {
          namaSekolah: 'SMK NEGERI 1 ARAHAN',
          alamat: 'Jl. Raya Arahan, Kabupaten Indramayu, Jawa Barat'
        }
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat pengaturan sekolah.' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { namaSekolah, alamat } = req.body;
    let settings = await prisma.schoolSettings.findFirst();
    if (!settings) {
      settings = await prisma.schoolSettings.create({ data: { namaSekolah, alamat } });
    } else {
      settings = await prisma.schoolSettings.update({
        where: { id: settings.id },
        data: { namaSekolah, alamat }
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: 'Gagal menyimpan pengaturan sekolah.' });
  }
});

router.post('/settings/logo', async (req, res) => {
  try {
    const { logoDataUrl } = req.body; // format: data:image/png;base64,....
    if (!logoDataUrl || !logoDataUrl.startsWith('data:image')) {
      return res.status(400).json({ error: 'Data logo tidak valid.' });
    }
    const match = logoDataUrl.match(/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Format gambar tidak didukung. Gunakan PNG/JPEG/WebP/SVG.' });
    }
    const ext = match[1] === 'svg+xml' ? 'svg' : (match[1] === 'jpeg' ? 'jpg' : match[1]);
    const base64 = match[2];
    const buffer = Buffer.from(base64, 'base64');
    const filename = `logo-${Date.now()}.${ext}`;
    if (!fsSync.existsSync(UPLOAD_DIR)) fsSync.mkdirSync(UPLOAD_DIR, { recursive: true });

    // Hapus logo lama jika ada
    let settings = await prisma.schoolSettings.findFirst();
    if (settings?.logoPath) {
      const oldFile = path.join(UPLOAD_DIR, path.basename(settings.logoPath));
      try { await fs.unlink(oldFile); } catch (e) {}
    }

    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
    if (!settings) {
      settings = await prisma.schoolSettings.create({ data: { logoPath: `/uploads/${filename}` } });
    } else {
      settings = await prisma.schoolSettings.update({
        where: { id: settings.id },
        data: { logoPath: `/uploads/${filename}` }
      });
    }
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengupload logo.' });
  }
});

router.delete('/settings/logo', async (req, res) => {
  try {
    let settings = await prisma.schoolSettings.findFirst();
    if (settings?.logoPath) {
      const oldFile = path.join(UPLOAD_DIR, path.basename(settings.logoPath));
      try { await fs.unlink(oldFile); } catch (e) {}
      settings = await prisma.schoolSettings.update({
        where: { id: settings.id },
        data: { logoPath: null }
      });
    }
    res.json(settings || { success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus logo.' });
  }
});

// --- BACKUP & RESTORE DATABASE ---
const dbUrl = process.env.DATABASE_URL;

function parseDbUrl(url) {
  // postgresql://user:pass@host:port/db?schema=public
  const m = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!m) return null;
  return { user: m[1], pass: m[2], host: m[3], port: m[4], db: m[5] };
}

router.get('/backup-database', async (req, res) => {
  let tmpFile = null;
  try {
    const cfg = parseDbUrl(dbUrl);
    if (!cfg) return res.status(500).json({ error: 'Konfigurasi database tidak valid.' });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    tmpFile = path.join(require('os').tmpdir(), `agenda-guru-backup-${stamp}.sql`);
    const cmd = `PGPASSWORD='${cfg.pass}' pg_dump -h ${cfg.host} -p ${cfg.port} -U ${cfg.user} ${cfg.db} > "${tmpFile}"`;
    await execAsync(cmd, { shell: '/bin/bash' });
    const stat = await fs.stat(tmpFile);
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="backup-${stamp}.sql"`);
    const data = await fs.readFile(tmpFile);
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat backup database.' });
  } finally {
    if (tmpFile) { try { await fs.unlink(tmpFile); } catch (e) {} }
  }
});

router.post('/restore-database', async (req, res) => {
  let tmpFile = null;
  try {
    const { sql } = req.body;
    if (!sql || !sql.trim()) return res.status(400).json({ error: 'Tidak ada data untuk dipulihkan.' });
    const cfg = parseDbUrl(dbUrl);
    if (!cfg) return res.status(500).json({ error: 'Konfigurasi database tidak valid.' });
    tmpFile = path.join(require('os').tmpdir(), `agenda-guru-restore-${Date.now()}.sql`);
    await fs.writeFile(tmpFile, sql);
    // Bersihkan schema dulu supaya restore benar-benar menggantikan data lama
    const dropCmd = `PGPASSWORD='${cfg.pass}' psql -h ${cfg.host} -p ${cfg.port} -U ${cfg.user} -d ${cfg.db} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`;
    await execAsync(dropCmd, { shell: '/bin/bash' });
    const cmd = `PGPASSWORD='${cfg.pass}' psql -h ${cfg.host} -p ${cfg.port} -U ${cfg.user} -d ${cfg.db} -f "${tmpFile}"`;
    const { stderr } = await execAsync(cmd, { shell: '/bin/bash' });
    res.json({ success: true, message: 'Database berhasil dipulihkan.', log: stderr });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memulihkan database. Pastikan file backup valid.' });
  } finally {
    if (tmpFile) { try { await fs.unlink(tmpFile); } catch (e) {} }
  }
});

module.exports = router;
