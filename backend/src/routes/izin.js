const express = require('express');
const router = express.Router();
const prisma = require('../db');

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

// GET list permohonan izin (filter by date, kelas, siswa)
router.get('/', async (req, res) => {
  try {
    const { tanggal, kelasId, siswaId } = req.query;
    const targetDate = tanggal ? toUTCDate(tanggal) : toUTCDate(todayLocalStr());

    const where = {
      tanggal: targetDate,
      ...(kelasId ? { kelasId: parseInt(kelasId) } : {}),
      ...(siswaId ? { siswaId: parseInt(siswaId) } : {})
    };

    const data = await prisma.permohonanIzin.findMany({
      where,
      include: {
        siswa: true,
        kelas: true,
        guruPiket: { select: { id: true, nama: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data permohonan izin' });
  }
});

// POST buat permohonan izin baru
router.post('/', async (req, res) => {
  try {
    const { siswaId, kelasId, jenisIzin, tanggal, jam, alasan, guruPiketId } = req.body;

    if (!siswaId || !kelasId || !jenisIzin || !jam || !alasan || !guruPiketId) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    const targetDate = tanggal ? toUTCDate(tanggal) : toUTCDate(todayLocalStr());

    const data = await prisma.permohonanIzin.create({
      data: {
        siswaId: parseInt(siswaId),
        kelasId: parseInt(kelasId),
        jenisIzin,
        tanggal: targetDate,
        jam,
        alasan,
        guruPiketId: parseInt(guruPiketId),
        status: 'diajukan'
      },
      include: {
        siswa: true,
        kelas: true,
        guruPiket: { select: { id: true, nama: true } }
      }
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat permohonan izin' });
  }
});

// PUT update permohonan izin (status, alasan, jam)
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { jenisIzin, jam, alasan, status } = req.body;

    const updateData = {};
    if (jenisIzin) updateData.jenisIzin = jenisIzin;
    if (jam) updateData.jam = jam;
    if (alasan) updateData.alasan = alasan;
    if (status) updateData.status = status;

    const data = await prisma.permohonanIzin.update({
      where: { id },
      data: updateData,
      include: {
        siswa: true,
        kelas: true,
        guruPiket: { select: { id: true, nama: true } }
      }
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengupdate permohonan izin' });
  }
});

// DELETE permohonan izin
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.permohonanIzin.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus permohonan izin' });
  }
});

module.exports = router;
