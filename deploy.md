# Panduan Lengkap Deployment ke VPS (Ubuntu/Debian)

Karena aplikasi **Agenda Guru & Absensi Siswa** ini terbagi menjadi dua bagian (*Frontend Vite/React* dan *Backend Express/Prisma*), proses deployment-nya melibatkan beberapa tahap. Panduan ini mengasumsikan Anda menggunakan OS Ubuntu/Debian pada VPS Anda.

---

## 1. Persiapan Server (Instalasi Dependensi)
Akses VPS Anda melalui SSH, lalu install semua kebutuhan dasar:

```bash
# 1. Update sistem
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (menggunakan Node Version Manager / NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 3. Install PM2 (Untuk menjaga backend tetap menyala 24/7)
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

### Ringkasan Cepat (Copy-Paste)
```bash
cd /var/www/agenda-guru && git pull origin master && cd backend && npm install && npx prisma generate && npx prisma db push && pm2 restart agenda-backend && cd .. && npm install && npm run build
```
