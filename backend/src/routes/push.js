const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Kunci publik VAPID untuk di-subscribe frontend
router.get('/public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// Simpan/refresh subscription push guru (satu endpoint unik per perangkat)
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    if (!userId || !subscription?.endpoint) {
      return res.status(400).json({ error: 'userId dan subscription wajib diisi' });
    }

    const { endpoint, keys } = subscription;
    const data = {
      userId: parseInt(userId),
      p256dh: keys?.p256dh || '',
      auth: keys?.auth || ''
    };

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: data,
      create: { endpoint, ...data }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan subscription' });
  }
});

// Hapus subscription (saat guru mematikan notifikasi)
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus subscription' });
  }
});

module.exports = router;
