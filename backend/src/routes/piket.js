const express = require('express');
const router = express.Router();
const prisma = require('../db');

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// GET semua pengampu hari ini + status piket
router.get('/jadwal-hari-ini', async (req, res) => {
  try {
    const today = new Date();
    const todayName = HARI[today.getDay()];
    if (todayName === 'Minggu' || todayName === 'Sabtu') {
      return res.json([]);
    }

    const pengampuList = await prisma.pengampu.findMany({
      where: { hari: todayName },
      include: {
        guru: true,
        kelas: true,
        mapel: true,
        piket: {
          where: { tanggal: new Date(today.toISOString().slice(0, 10)) }
        }
      },
      orderBy: { jamKe: 'asc' }
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
    const { pengampuId, piketById, status, catatan } = req.body;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const data = await prisma.piket.upsert({
      where: {
        pengampuId_tanggal: {
          pengampuId: parseInt(pengampuId),
          tanggal: new Date(todayStr)
        }
      },
      update: { status, catatan: catatan || null },
      create: {
        pengampuId: parseInt(pengampuId),
        piketById: parseInt(piketById),
        tanggal: new Date(todayStr),
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

// GET rekap piket hari ini
router.get('/rekap-hari-ini', async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const data = await prisma.piket.findMany({
      where: { tanggal: new Date(todayStr) },
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
