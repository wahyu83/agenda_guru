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
const genSessionToken = () => crypto.randomBytes(16).toString('hex');

// Ambil kelas utama siswa (enrollment pertama)
const kelasSiswa = (siswa) => siswa?.enrollment?.[0]?.kelas?.nama || '-';

// Validasi sesi scan; kembalikan objek sesi bila valid, null bila tidak
const validateSession = async (token) => {
  if (!token) return null;
  const session = await prisma.scanSession.findUnique({ where: { token } });
  if (!session) return null;
  if (session.revoked) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  return session;
};

// --- SESI SCAN (berbatas waktu) ---
// POST /sesi — buka sesi scan baru (admin/petugas)
router.post('/sesi', async (req, res) => {
  try {
    const { durasiJam, petugas } = req.body || {};
    const jam = Number(durasiJam) > 0 ? Number(durasiJam) : 8;
    const token = genSessionToken();
    const expiresAt = new Date(Date.now() + jam * 60 * 60 * 1000);
    const session = await prisma.scanSession.create({
      data: { token, expiresAt, petugas: petugas || null }
    });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat sesi scan.' });
  }
});

// GET /sesi — daftar sesi scan aktif
router.get('/sesi', async (req, res) => {
  try {
    const data = await prisma.scanSession.findMany({
      where: { revoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat sesi scan.' });
  }
});

// DELETE /sesi/:id — tutup (cabut) sesi scan
router.delete('/sesi/:id', async (req, res) => {
  try {
    await prisma.scanSession.update({
      where: { id: parseInt(req.params.id) },
      data: { revoked: true }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Gagal menutup sesi scan.' });
  }
});

// GET /sesi/cek?token= — validasi token sesi (untuk halaman scan)
router.get('/sesi/cek', async (req, res) => {
  try {
    const session = await validateSession(req.query.token);
    if (!session) return res.status(401).json({ valid: false, error: 'Sesi tidak valid atau sudah berakhir.' });
    res.json({ valid: true, expiresAt: session.expiresAt, petugas: session.petugas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memvalidasi sesi.' });
  }
});

// POST /scan — siswa scan kartu QR (mandiri), wajib sesi scan yang valid
router.post('/scan', async (req, res) => {
  try {
    const { token, sessionToken } = req.body || {};

    const session = await validateSession(sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Sesi scan tidak valid atau sudah berakhir. Minta tautan baru ke petugas.' });
    }

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

// GET /laporan — rekap absensi harian berdasarkan rentang tanggal (untuk export)
router.get('/laporan', async (req, res) => {
  try {
    const { tanggalDari, tanggalSampai, kelasId, status } = req.query;
    const from = toUTCDate(tanggalDari || todayLocalStr());
    const to = toUTCDate(tanggalSampai || tanggalDari || todayLocalStr());
    const toEnd = new Date(to.getTime() + 24 * 60 * 60 * 1000);

    const data = await prisma.absensiHarian.findMany({
      where: {
        tanggal: { gte: from, lt: toEnd },
        ...(status ? { status } : {}),
        ...(kelasId ? { siswa: { enrollment: { some: { kelasId: parseInt(kelasId) } } } } : {})
      },
      include: { siswa: { include: { enrollment: { include: { kelas: true } } } } },
      orderBy: [{ tanggal: 'asc' }, { jamMasuk: 'asc' }]
    });

    const fmtTanggal = (d) => {
      const dt = new Date(d);
      return `${String(dt.getUTCDate()).padStart(2, '0')}/${String(dt.getUTCMonth() + 1).padStart(2, '0')}/${dt.getUTCFullYear()}`;
    };
    const fmtJam = (d) => {
      if (!d) return '-';
      const dt = new Date(d);
      return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
    };

    const formatted = data.map(a => ({
      no: null,
      tanggal: fmtTanggal(a.tanggal),
      nama: a.siswa?.nama || '-',
      nis: a.siswa?.nis || '-',
      kelas: kelasSiswa(a.siswa),
      status: a.status === 'terlambat' ? 'Terlambat' : 'Hadir',
      jamMasuk: fmtJam(a.jamMasuk),
      keterangan: a.keterangan || '-'
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat laporan absensi.' });
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