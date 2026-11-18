const cron = require('node-cron');
const webpush = require('web-push');
const prisma = require('../db');

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const sentKeys = new Set();

const pad = (n) => String(n).padStart(2, '0');

async function checkAndSend() {
  const now = new Date();
  const hari = HARI[now.getDay()];
  if (hari === 'Minggu') return;

  const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const jamPelajaran = await prisma.jamPelajaran.findMany();
  const jamMap = {};
  jamPelajaran.forEach((jp) => { jamMap[jp.jamKe] = jp.mulai; });

  const pengampuList = await prisma.pengampu.findMany({
    where: { hari },
    include: {
      kelas: true,
      mapel: true,
      guru: { include: { pushSubscriptions: true } }
    }
  });

  for (const p of pengampuList) {
    if (jamMap[p.jamKe] !== hm) continue;

    const dedupeKey = `${p.id}-${todayKey}-${hm}`;
    if (sentKeys.has(dedupeKey)) continue;
    sentKeys.add(dedupeKey);

    const subs = p.guru?.pushSubscriptions || [];
    if (subs.length === 0) continue;

    const payload = JSON.stringify({
      title: 'Jadwal Mengajar',
      body: `${p.mapel?.nama || 'Mata pelajaran'} • Kelas ${p.kelas?.nama || '-'} • Jam ${jamMap[p.jamKe]}`,
      url: '/guru/jadwal',
      tag: `jadwal-${p.id}`
    });

    for (const sub of subs) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error('Gagal kirim push:', err.statusCode || err.message);
        }
      }
    }
  }

  if (sentKeys.size > 5000) sentKeys.clear();
}

function startReminderScheduler() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys belum diset — scheduler notifikasi jadwal dinonaktifkan.');
    return;
  }

  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  cron.schedule('* * * * *', () => {
    checkAndSend().catch((err) => console.error('Scheduler error:', err));
  });
  console.log('Scheduler notifikasi jadwal mengajar aktif (cek tiap menit).');
}

module.exports = { startReminderScheduler, checkAndSend };
