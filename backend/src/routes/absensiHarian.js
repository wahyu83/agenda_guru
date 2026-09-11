const express = require('express');
const router = express.Router();
const prisma = require('../db');
const crypto = require('crypto');

// Batas jam masuk; scan setelah jam ini dianggap terlambat
const JAM_MASUK_BATAS = process.env.JAM_MASUK_BATAS || '07:00';

// Helper: bentuk UTC date-only dari YYYY-MM-DD / Date (hindari geser timezone)
const toUTCDate = (dateInput) => {
  if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = dateInput.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  if (dateInput instanceof Date) {
    return new Date(Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate()));
  }
  return new Date(dateInput);
};

const todayLocalStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const genToken = () => crypto.randomBytes(8).toString('hex');

// Ambil kelas utama siswa (enrollment pertama)
const kelasSiswa = (siswa) => siswa?.enrollment?.[0]?.kelas?.nama || '-';

// POST /scan — siswa scan kartu QR (mandiri)
router.post('/scan', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'QR tidak valid.' });

    const siswa = await prisma.siswa.findUnique({
      where: { qrToken: token },
      include: { enrollment: { include: { kelas: true } } }
    });
    if (!siswa) return res.status(404).json({ error: 'Kartu tidak dikenali.' });

    const tanggal = toUTCDate(todayLocalStr());
    const now = new Date();
    const [batasH, batasM] = JAM_MASUK_BATAS.split(':').map(Number);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const status = nowMinutes > batasH * 60 + batasM ? 'terlambat' : 'hadir';

    const existing = await prisma.absensiHarian.findUnique({
      where: { siswaId_tanggal: { siswaId: siswa.id, tanggal } }
    });

    if (existing) {
      return res.json({
        already: true,
        siswa: { id: siswa.id, nama: siswa.nama, nis: siswa.nis },
        kelas: kelasSiswa(siswa),
        status: existing.status,
        jamMasuk: existing.jamMasuk
      });
    }

    const created = await prisma.absensiHarian.create({
      data: { siswaId: siswa.id, tanggal, jamMasuk: now, status }
    });

    res.json({
      already: false,
      siswa: { id: siswa.id, nama: siswa.nama, nis: siswa.nis },
      kelas: kelasSiswa(siswa),
      status: created.status,
      jamMasuk: created.jamMasuk
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mencatat absensi.' });
  }
});

// GET / — daftar absensi harian (default hari ini)
router.get('/', async (req, res) => {
  try {
    const { tanggal, kelasId } = req.query;
    const targetDate = toUTCDate(tanggal || todayLocalStr());
    const data = await prisma.absensiHarian.findMany({
      where: {
        tanggal: targetDate,
        ...(kelasId ? { siswa: { enrollment: { some: { kelasId: parseInt(kelasId) } } } } : {})
      },
      include: { siswa: { include: { enrollment: { include: { kelas: true } } } } },
      orderBy: { jamMasuk: 'desc' }
    });
    const formatted = data.map(a => ({
      id: a.id,
      siswaId: a.siswaId,
      nama: a.siswa?.nama,
      nis: a.siswa?.nis,
      kelas: kelasSiswa(a.siswa),
      status: a.status,
      jamMasuk: a.jamMasuk,
      keterangan: a.keterangan
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat absensi harian.' });
  }
});

// GET /rekap — ringkasan kehadiran harian
router.get('/rekap', async (req, res) => {
  try {
    const { tanggal } = req.query;
    const targetDate = toUTCDate(tanggal || todayLocalStr());
    const [hadir, terlambat, totalSiswa] = await Promise.all([
      prisma.absensiHarian.count({ where: { tanggal: targetDate, status: 'hadir' } }),
      prisma.absensiHarian.count({ where: { tanggal: targetDate, status: 'terlambat' } }),
      prisma.siswa.count()
    ]);
    res.json({ hadir, terlambat, total: hadir + terlambat, totalSiswa, belum: Math.max(0, totalSiswa - (hadir + terlambat)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat rekap absensi.' });
  }
});

// GET /kartu?kelasId= — daftar siswa (untuk cetak kartu QR), buat token bila belum ada
router.get('/kartu', async (req, res) => {
  try {
    const { kelasId } = req.query;
    const where = kelasId ? { enrollment: { some: { kelasId: parseInt(kelasId) } } } : {};
    let siswaList = await prisma.siswa.findMany({
      where,
      include: { enrollment: { include: { kelas: true } } },
      orderBy: { nama: 'asc' }
    });

    // Buat token untuk siswa yang belum punya
    const tanpaToken = siswaList.filter(s => !s.qrToken);
    for (const s of tanpaToken) {
      try {
        const updated = await prisma.siswa.update({
          where: { id: s.id },
          data: { qrToken: genToken() }
        });
        s.qrToken = updated.qrToken;
      } catch (e) {
        // abaikan bila bentrok token (sangat jarang)
      }
    }

    const formatted = siswaList.map(s => ({
      id: s.id,
      nama: s.nama,
      nis: s.nis,
      kelas: kelasSiswa(s),
      qrToken: s.qrToken
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat data kartu.' });
  }
});

// DELETE /:id — hapus catatan absensi harian
router.delete('/:id', async (req, res) => {
  try {
    await prisma.absensiHarian.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Gagal menghapus absensi.' });
  }
});

module.exports = router;