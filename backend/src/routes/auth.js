const express = require('express');
const router = express.Router();
const prisma = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Seed admin otomatis jika belum ada (untuk kemudahan testing)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Cek jika admin belum ada di sistem, buatkan satu
    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    if (adminCount === 0 && username === 'admin') {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
          nama: 'Administrator'
        }
      });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Fallback untuk mockup (jika plain text dari seed manual sebelumnya)
      if (password !== user.password) {
        return res.status(401).json({ error: 'Username atau password salah' });
      }
    }

    const token = jwt.sign({ id: user.id, role: user.role, nama: user.nama }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role, nama: user.nama, id: user.id, nip: user.nip });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

router.put('/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch && oldPassword !== user.password) {
      return res.status(400).json({ error: 'Password lama salah' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: hashedPassword }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

module.exports = router;
