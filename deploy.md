# Panduan Lengkap Deployment ke VPS (Ubuntu/Debian)

Karena aplikasi **Agenda Guru & Absensi Siswa** ini terbagi menjadi dua bagian (*Frontend Vite/React* dan *Backend Express/Prisma*), proses deployment-nya melibatkan beberapa tahap. Panduan ini mengasumsikan Anda menggunakan OS Ubuntu/Debian pada VPS Anda.

---

## 1. Persiapan Server (Instalasi Dependensi)
Akses VPS Anda melalui SSH, lalu install semua kebutuhan dasar:

```bash
# 1. Update sistem
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 24 (menggunakan Node Version Manager / NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc
nvm install 24
nvm alias default 24   # WAJIB: agar Node 24 tetap aktif di setiap sesi SSH baru
nvm use 24
node -v                # pastikan tampil v24.x

# 3. Install PM2 (Untuk menjaga backend tetap menyala 24/7)
#    PM2 terikat pada versi Node yang aktif. Kalau nanti ganti versi Node
#    (mis. 20 -> 24), wajib `npm install -g pm2` ulang lalu `pm2 update`.
npm install -g pm2

# 4. Install Nginx (Sebagai web server)
sudo apt install nginx -y

# 5. Install PostgreSQL (Database)
sudo apt install postgresql postgresql-contrib -y
```

---

## 2. Setup Database PostgreSQL
Buat database dan user untuk aplikasi ini:

```bash
sudo -u postgres psql

# Di dalam prompt PostgreSQL (ganti password dengan yang Anda inginkan):
CREATE DATABASE agenda_guru;
CREATE USER admin_agenda WITH ENCRYPTED PASSWORD 'password_rahasia';
GRANT ALL PRIVILEGES ON DATABASE agenda_guru TO admin_agenda;
\c agenda_guru
GRANT ALL ON SCHEMA public TO admin_agenda;
\q
```

---

## 3. Clone Repository & Setup Backend
Pindahkan kode Anda dari GitHub ke VPS (misalnya di folder `/var/www/agenda-guru`).

```bash
cd /var/www
git clone https://github.com/wahyu83/agenda_guru.git agenda-guru
cd agenda-guru/backend
```

**Konfigurasi Environment Backend:**
1. Buat file `.env` di dalam folder `backend/`:
   ```bash
   nano .env
   ```
2. Isi file tersebut dengan URL database PostgreSQL dan port Anda:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://admin_agenda:password_rahasia@localhost:5432/agenda_guru?schema=public"
   ```
3. Install modul dan migrasi database:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   # (Opsional) Jika Anda punya file seed untuk mengisi data awal:
   node src/seed.js 
   ```
4. Jalankan backend menggunakan PM2:
   ```bash
   pm2 start src/index.js --name "agenda-backend"
   pm2 save
   pm2 startup
   ```

---

## 4. Build & Setup Frontend
Sekarang kita build tampilan antarmukanya.

```bash
cd /var/www/agenda-guru

# Install dependensi frontend
npm install

# Build frontend (Akan menghasilkan folder /dist)
npm run build
```

Pastikan konfigurasi API_BASE di `src/lib/store.js` sudah mengarah ke endpoint VPS Anda sebelum proses build dilakukan.

> **Syarat Node untuk build frontend:** proyek ini memakai **Vite 8** yang butuh **Node >= 22.12** (`^20.19.0 || >=22.12.0`). Di **Node 20 biasa build bisa gagal** — pastikan `node -v` menunjukkan **v24.x** sebelum `npm run build`.

---

## 5. Konfigurasi Nginx (Reverse Proxy)
Kita akan mengatur Nginx agar *Frontend* bisa diakses melalui port 80 (HTTP) dan *Backend* bisa diakses secara aman lewat alias API.

1. Buka konfigurasi Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/agenda-guru
   ```
2. Tempelkan konfigurasi berikut (ganti `domain_anda.com` dengan IP VPS atau domain Anda):
   ```nginx
   server {
       listen 80;
       server_name domain_anda.com;

       # Frontend (Arahkan ke folder dist)
       location / {
           root /var/www/agenda-guru/dist;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

# Backend (Reverse Proxy ke PM2)
        location /api/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # File upload (logo sekolah, dsb.) — diteruskan ke backend
        location /uploads/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
        }
    }
    ```
3. Aktifkan konfigurasi dan *Restart* Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/agenda-guru /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 6. Mengaktifkan PWA (Aplikasi di Layar Utama HP)
Berhubung aplikasi ini sudah didukung teknologi PWA, para guru dapat membuka domain Anda di Google Chrome HP mereka, tekan tombol titik tiga di pojok kanan atas browser, lalu pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)**.

> **Catatan Penting PWA:** Agar fitur PWA bisa berfungsi secara maksimal di ponsel cerdas (Android/iOS), sangat disarankan untuk memasang SSL/HTTPS menggunakan *Certbot* agar website Anda berstatus *Secure*.
> ```bash
> sudo apt install certbot python3-certbot-nginx -y
> sudo certbot --nginx -d domain_anda.com
> ```

---

## 7. Update Aplikasi di VPS

Setelah ada pembaruan kode di GitHub, ikuti langkah berikut untuk update aplikasi di VPS:

### Upgrade Node.js di VPS (mis. 20 → 24)

Lakukan ini **hanya saat ganti versi Node** (tidak perlu tiap deploy). Urutannya penting:

```bash
# 1) Pasang Node 24 & jadikan default
source ~/.nvm/nvm.sh
nvm install 24 && nvm alias default 24 && nvm use 24 && node -v

# 2) Install ulang PM2 di Node 24 (PM2 terikat ke versi Node yang aktif)
npm install -g pm2

# 3) Segarkan daemon PM2 agar memakai Node baru
pm2 update

# 4) Rebuild modul native (mis. bcrypt) terhadap Node 24
cd /var/www/agenda-guru/backend && npm rebuild

# 5) Pastikan proses tetap ada, lalu simpan
pm2 restart agenda-backend || pm2 start src/index.js --name agenda-backend
pm2 save
```

> **Jebakan yang sering terjadi:** sesudah `pm2 update`, proses bisa hilang dari daftar (`pm2 list` kosong) sehingga backend mati — karena itu langkah 5 memakai `|| pm2 start ...`.
>
> **Wajib verifikasi (bukan asumsi):**
> ```bash
> node -v                                                     # harus v24.x
> readlink -f /proc/$(pm2 pid agenda-backend)/exe             # harus .../node/v24.x/bin/node
> curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/admin/settings   # harus 200
> ```

### Update Backend
```bash
cd /var/www/agenda-guru

# Tarik kode terbaru dari GitHub
git pull origin master

# Update backend
cd backend
npm install
npx prisma generate
npx prisma db push

# Restart backend
pm2 restart agenda-backend
```

### Update Frontend
```bash
cd /var/www/agenda-guru

# Install dependensi frontend (jika ada perubahan package.json)
npm install

# Build ulang frontend
npm run build
```

### Cek Status Deploy di VPS
Jalankan perintah ini satu per satu di VPS untuk memastikan kode sudah terbaru:

```bash
cd /var/www/agenda-guru
git log --oneline -3
```

Lihat apakah commit terbaru sudah muncul. Jika belum, lanjutkan ke langkah update di bawah.

### Update Manual (Tanpa Copy-Paste Panjang)
Ketik perintah ini satu per satu di terminal VPS Anda:

**Langkah 1 — Tarik kode terbaru dari GitHub:**
```bash
cd /var/www/agenda-guru
git pull origin master
```

**Langkah 2 — Update dan restart backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
pm2 restart agenda-backend
```

**Langkah 3 — Update dan build ulang frontend:**
```bash
cd /var/www/agenda-guru
npm install
npm run build
```

**Langkah 4 — Verifikasi backend hidup:**
```bash
pm2 status
```

Setelah semua langkah selesai, buka aplikasi di browser untuk memastikan perubahan sudah aktif.

### PENTING — Update skema database
Jika `npx prisma db push` berhenti dengan peringatan **"There might be data loss"**, itu artinya ada perubahan skema yang perlu ditinjau. Untuk kolom/index baru yang aman (mis. kolom nullable baru atau unique index pada kolom baru), jalankan:

```bash
npx prisma db push --accept-data-loss
```

Bila ragu, lihat dulu perubahannya tanpa menerapkan apa pun:

```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
```

Pastikan hanya ada `ADD COLUMN` / `CREATE TABLE` / `CREATE INDEX` (aman). Jika ada `DROP`/`ALTER ... DROP`, jangan lanjut tanpa backup.

Selalu buat backup sebelum update:
```bash
mkdir -p /root/backups && pg_dump -h localhost -U admin_agenda agenda_guru > /root/backups/pre-update-$(date +%F-%H%M%S).sql
```

### Ringkasan Cepat (Copy-Paste)
> Catatan: perintah dijalankan **terpisah** (bukan satu `&&` panjang), agar bila langkah DB perlu penanganan, build & restart tetap berjalan.

```bash
# 1) Kode terbaru
cd /var/www/agenda-guru && git pull origin master

# 2) Backend
cd /var/www/agenda-guru/backend && npm install && npx prisma generate && npx prisma db push

# 3) Jika muncul peringatan data loss (lihat panduan di atas), jalankan:
#    npx prisma db push --accept-data-loss

# 4) Restart backend
pm2 restart agenda-backend

# 5) Frontend
cd /var/www/agenda-guru && npm install && npm run build
```
