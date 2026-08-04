const express = require('express');
const router = express.Router();
const prisma = require('../db');

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Helper: parse YYYY-MM-DD string (or Date) into a UTC Date that represents
// the same calendar day everywhere, avoiding timezone shift bugs.
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

// GET semua pengampu untuk hari tertentu + status piket
router.get('/jadwal-hari-ini', async (req, res) => {
  try {
    const { hari: hariParam, tanggal: tanggalParam } = req.query;
    
    const today = new Date();
    const todayName = HARI[today.getDay()];
    const targetHari = hariParam && HARI.includes(hariParam) ? hariParam : todayName;
    const targetDate = toUTCDate(tanggalParam || todayLocalStr());
    
    if (targetHari === 'Minggu' || targetHari === 'Sabtu') {
      return res.json([]);
    }

    // Ambil tahun pelajaran aktif untuk memastikan data sesuai tahun ajaran
    const tahunAktif = await prisma.tahunPelajaran.findFirst({
      where: { isActive: true }
    });

    const whereClause = {
      hari: targetHari,
      ...(tahunAktif ? {
        kelas: {
          tahunPelajaranId: tahunAktif.id
        }
      } : {})
    };

    const pengampuList = await prisma.pengampu.findMany({
      where: whereClause,
      include: {
        guru: true,
        kelas: true,
        mapel: true,
        piket: {
          where: { tanggal: targetDate }
        }
      },
      orderBy: [
        { jamKe: 'asc' },
        { kelas: { nama: 'asc' } }
      ]
    });

    const data = pengampuList.map(p => ({
      id: p.id,
      guruId: p.guruId,
      guru: p.guru.nama,
      kelas: p.kelas.nama,
      mapel: p.mapel.nama,
      jamKe: p.jamKe,
      jamSampai: p.jamSampai,
      piket: p.piket.length > 0 ? p.piket[0] : null
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil jadwal piket' });
  }
});

// POST/UPSERT piket check
router.post('/', async (req, res) => {
  try {
    const { pengampuId, piketById, status, catatan, tanggal } = req.body;
    const targetDate = toUTCDate(tanggal || todayLocalStr());

    const data = await prisma.piket.upsert({
      where: {
        pengampuId_tanggal: {
          pengampuId: parseInt(pengampuId),
          tanggal: targetDate
        }
      },
      update: { status, catatan: catatan || null },
      create: {
        pengampuId: parseInt(pengampuId),
        piketById: parseInt(piketById),
        tanggal: targetDate,
        status,
        catatan: catatan || null
      }
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan data piket' });
  }
});

// GET rekap piket untuk tanggal tertentu (default hari ini)
router.get('/rekap-hari-ini', async (req, res) => {
  try {
    const { tanggal } = req.query;
    const targetDate = toUTCDate(tanggal || todayLocalStr());

    const data = await prisma.piket.findMany({
      where: { tanggal: targetDate },
      include: {
        pengampu: {
          include: { guru: true, kelas: true, mapel: true }
        },
        piketBy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil rekap piket' });
  }
});

module.exports = router;
