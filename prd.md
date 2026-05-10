## Dokumen Persyaratan Produk (PRD) – Final
### Aplikasi Agenda Mengajar & Absensi Siswa
**(Dukungan Offline pada Aplikasi Guru)**

**Versi:** Final 1.2
**Tanggal:** 10 Mei 2026
**Teknologi:** Flutter, TrailBase (Rust), PostgreSQL, SQLite (lokal)

---

### 1. Pendahuluan
Aplikasi ini mendigitalisasi pencatatan agenda mengajar harian dan absensi siswa oleh guru, serta pengelolaan data induk terpusat oleh administrator. Hanya terdapat dua peran pengguna: **Admin** (menggunakan aplikasi web) dan **Guru** (menggunakan aplikasi mobile).

Fitur utama:
- Satu kelas dapat diampu oleh beberapa guru dengan mata pelajaran berbeda.
- Guru dapat mengisi/mengubah agenda dan absensi untuk **maksimal 15 hari ke belakang**.
- Aplikasi mobile guru mendukung penggunaan offline (pengisian agenda/absensi tanpa koneksi internet), dengan sinkronisasi otomatis saat kembali online.
- Guru dapat mengunduh laporan pribadi (agenda & absensi) dalam format PDF/CSV.
- Admin mengelola seluruh data induk, melakukan impor massal via CSV, serta mengakses laporan global.

**Backend menggunakan TrailBase (Rust)** dengan PostgreSQL sebagai database utama. TrailBase menyediakan autentikasi bawaan, API realtime, penyimpanan file, dan kontrol akses berbasis peran — sehingga mempercepat pengembangan sisi server.

---

### 2. Cakupan (Scope)

**Termasuk dalam pengembangan:**
- Manajemen tahun pelajaran, guru, mata pelajaran, kelas, siswa, pengampu, enrollment (admin).
- Impor CSV untuk seluruh data induk (admin).
- Pengisian, pengubahan, dan penghapusan agenda mengajar (guru, per kelas & mapel, maks. H-15).
- Pengisian dan pengubahan absensi siswa (guru, per kelas, maks. H-15).
- Mode offline untuk guru (penyimpanan lokal dengan SQLite, sinkronisasi otomatis).
- Unduh laporan (PDF/CSV) untuk guru (data sendiri) dan admin (global).

**Tidak termasuk:**
- Pendaftaran mandiri (self‑registration).
- Notifikasi push otomatis.
- Mode offline untuk admin.
- Unduh laporan dalam mode offline.
- Sinkronisasi lintas perangkat (satu guru, satu perangkat).

---

### 3. Peran Pengguna & Hak Akses

| Peran  | Platform      | Hak Akses                                                                                     |
|--------|---------------|-----------------------------------------------------------------------------------------------|
| Admin  | Flutter Web   | - Mengelola tahun pelajaran (CRUD, menetapkan tahun aktif).<br>- CRUD guru, mata pelajaran, kelas, siswa.<br>- Impor CSV untuk semua entitas.<br>- Mengelola penugasan guru ke kelas (pengampu).<br>- Mendaftarkan siswa ke kelas (enrollment).<br>- Melihat & mengunduh laporan agenda & absensi (semua guru/kelas). |
| Guru   | Flutter Mobile | - Melihat daftar tugas (kelas + mata pelajaran yang diampu).<br>- Mengisi, mengubah, menghapus agenda mengajar (milik sendiri, maks. 15 hari ke belakang).<br>- Mengisi, mengubah absensi siswa di kelas yang diampu (maks. 15 hari ke belakang).<br>- Semua pengisian dapat dilakukan secara offline, disinkronkan saat online.<br>- Melihat riwayat agenda & absensi (online/offline).<br>- Mengunduh laporan agenda (per mapel) & absensi (per kelas) dalam PDF/CSV (hanya saat online, data milik sendiri). |

---

### 4. Fitur Utama (Core Features)

#### 4.1 Autentikasi & Otorisasi (TrailBase Built‑in)
- **TrailBase menyediakan sistem autentikasi bawaan:** login dengan username/email & password, manajemen sesi/JWT, serta refresh token.
- Integrasi dengan PostgreSQL untuk penyimpanan kredensial.
- Middleware TrailBase menangani otorisasi berbasis peran (`admin`, `guru`) secara deklaratif di konfigurasi API.
- Token JWT digunakan oleh Flutter (web & mobile) untuk mengakses API.
- Login wajib online; setelah login, guru dapat menggunakan aplikasi offline (token disimpan di secure storage perangkat). Jika token kedaluwarsa saat offline, guru login ulang saat online.

#### 4.2 Fitur Admin (Web)

##### 4.2.1 Dasbor
- Ringkasan: jumlah guru, kelas, siswa, mata pelajaran, tahun pelajaran aktif.
- Statistik pengisian agenda/absensi hari ini dan kepatuhan jendela 15 hari.

##### 4.2.2 Manajemen Tahun Pelajaran
- Daftar, tambah, edit, hapus tahun pelajaran.
- Tombol "Jadikan Aktif" (otomatis menonaktifkan tahun sebelumnya).
- Tahun aktif digunakan sebagai default untuk semua operasi guru dan laporan.

##### 4.2.3 Manajemen Guru
- CRUD guru: Nama, NIP/NUPTK (opsional), username/email, password.
- Impor CSV (format: `nama, nip, username, password`). Validasi duplikasi username/NIP.

##### 4.2.4 Manajemen Mata Pelajaran
- CRUD mata pelajaran: Nama (unik).
- Impor CSV (format: `nama`).

##### 4.2.5 Manajemen Kelas & Pengampu
- CRUD kelas: Nama kelas, tahun pelajaran (diambil dari tahun aktif).
- **Pengelolaan Pengampu:** Dalam form kelas, tambahkan satu atau lebih pengampu: pilih guru dan mata pelajaran.
- Satu guru hanya bisa mengampu satu mata pelajaran di kelas yang sama (unique constraint).
- Impor CSV kelas dan pengampu (format disepakati).

##### 4.2.6 Manajemen Siswa & Enrollment
- CRUD siswa: Nama, NIS/NISN (unik).
- Impor CSV siswa (format: `nama, nis`).
- **Enrollment:** Daftarkan siswa ke satu kelas dalam tahun pelajaran aktif. Satu siswa hanya satu kelas per tahun (unique constraint).
- Form: Pilih siswa, pilih kelas, simpan.
- Impor CSV enrollment (format: `nis, nama_kelas`).

##### 4.2.7 Impor CSV
- Menu terpisah untuk setiap entitas.
- Unggah file CSV (maks. 5 MB).
- Validasi header, validasi setiap baris, laporan error per baris.
- Proses dalam satu transaksi database (atomik).

##### 4.2.8 Laporan
**Laporan Agenda Mengajar**
- Filter: Tahun pelajaran, kelas, guru, mata pelajaran, rentang tanggal.
- Kolom: Tanggal, kelas, guru, mapel, materi, deskripsi.
- Format: PDF dan CSV.
- **Implementasi:** Endpoint khusus di TrailBase yang membaca data dari PostgreSQL, menghasilkan PDF menggunakan crate Rust (misal `genpdf`/`pdf-canvas`), dan mengembalikan file untuk diunduh.

**Laporan Absensi**
- Dua tipe:
  - **Rekap per Siswa:** Jumlah hadir, sakit, izin, alpa.
  - **Detail Harian:** Daftar siswa & status per tanggal.
- Filter: Tahun pelajaran, kelas, rentang tanggal, siswa (opsional).
- Format: PDF dan CSV.

Laporan dihasilkan sisi server (TrailBase/PostgreSQL) dan diunduh.

#### 4.3 Fitur Guru (Mobile) – Offline-first

##### 4.3.1 Login & Dasbor Tugas
- Login wajib online → menyimpan token JWT (TrailBase), mengunduh data pengampu dan daftar siswa (per kelas yang diampu) ke SQLite lokal.
- Dasbor menampilkan daftar tugas: "Kelas – Mata Pelajaran".
- Data ini di-cache dan tetap tersedia offline.

##### 4.3.2 Agenda Mengajar (Offline)
- Pilih tugas → layar Agenda.
- Kalender/daftar tanggal: hanya bisa pilih **tanggal perangkat** yang berada dalam rentang **hari ini hingga 15 hari ke belakang**.
- **Tambah/Ubah/Hapus:** Data disimpan di SQLite lokal dengan status `pending_insert/update/delete`.
- **Sinkronisasi:** Saat online, aplikasi mengirim perubahan ke TrailBase API. Server memvalidasi ulang batas 15 hari berdasarkan **tanggal server**. Jika di luar batas, data ditolak dan guru mendapat notifikasi.
- Konflik diselesaikan dengan **last write wins** (timestamp `last_modified`).
- Agenda yang sudah lewat jendela tetap dapat dilihat (read-only) secara offline jika sudah disinkronkan sebelumnya.

##### 4.3.3 Absensi Siswa (Offline)
- Pilih tugas → tab Absensi → pilih tanggal (H-15 s.d. hari ini berdasarkan perangkat).
- Daftar siswa dari cache lokal.
- Tandai status (Hadir, Sakit, Izin, Alpa) → simpan lokal.
- Sinkronisasi otomatis saat online dengan aturan yang sama (validasi 15 hari server, last write wins).
- Data absensi bisa diisi dan diubah oleh guru lain (dalam kelas yang sama); sinkronisasi akan memperbarui cache lokal dengan perubahan terbaru.

##### 4.3.4 Riwayat & Cache Lokal
- Semua data yang sudah disinkronkan dapat dilihat secara offline (read-only).
- Data yang belum disinkronkan memiliki indikator visual.

##### 4.3.5 Indikator & Manajemen Sinkronisasi
- Ikon status koneksi di bilah atas.
- Antrian perubahan yang belum disinkron (misal "3 perubahan belum dikirim").
- Notifikasi jika sinkronisasi gagal (konflik, penolakan batas 15 hari, dll).
- Sinkronisasi berjalan otomatis saat aplikasi aktif dan online.

##### 4.3.6 Laporan Pribadi
- Hanya dapat diakses saat online.
- Pilih tugas/kelas, rentang tanggal, format (PDF/CSV), unduh.
- Data diambil langsung dari server, terbatas hanya milik guru yang login.

---

### 5. Alur Aplikasi (App Flow)

#### 5.1 Alur Admin Web
1. Login → Dasbor.
2. Set tahun aktif.
3. Isi data dasar: Mapel, Guru.
4. Buat kelas + tetapkan pengampu.
5. Tambah siswa → enroll ke kelas.
6. Akses laporan/pengunduhan.

#### 5.2 Alur Guru Mobile – Offline & Sinkronisasi
1. **Online:** Login → unduh cache lokal (tugas, siswa).
2. **Offline:** Pilih tugas → isi agenda/absensi (dibatasi 15 hari dari tanggal perangkat).
3. **Kembali online:** Aplikasi mendeteksi koneksi → sinkronisasi otomatis:
   - Kirim antrian perubahan ke TrailBase API.
   - Terima konfirmasi; jika sukses, perbarui status lokal. Jika gagal, tampilkan pesan.
   - Tarik perubahan dari server (menggabungkan dengan lokal).
4. **Laporan:** Harus online, pilih filter → unduh.

---

### 6. Model Data

#### 6.1 Database Server — PostgreSQL (via TrailBase)

TrailBase menggunakan PostgreSQL sebagai datastore. Selain tabel bawaan TrailBase (pengguna, sesi, dll), tabel-tabel berikut dibuat:

```
tahun_pelajaran
  id (PK, UUID/Serial), nama (unique), is_active (boolean)

guru
  id (PK, UUID), user_id (FK ke tabel pengguna TrailBase), nama, nip (nullable, unique)
  (autentikasi dikelola TrailBase; user_id mengaitkan ke akun login)

mata_pelajaran
  id (PK), nama (unique)

kelas
  id (PK), nama, tahun_pelajaran_id (FK)

pengampu
  id (PK), guru_id (FK), kelas_id (FK), mata_pelajaran_id (FK), tahun_pelajaran_id (FK)
  unique(guru_id, kelas_id, mata_pelajaran_id, tahun_pelajaran_id)

siswa
  id (PK), nama, nis (unique)

enrollment
  id (PK), siswa_id (FK), kelas_id (FK), tahun_pelajaran_id (FK)
  unique(siswa_id, tahun_pelajaran_id)

agenda
  id (PK), pengampu_id (FK), tanggal (date), materi, deskripsi, catatan (nullable)
  unique(pengampu_id, tanggal)
  last_modified (timestamptz)

absensi
  id (PK), enrollment_id (FK), tanggal (date), status (hadir/sakit/izin/alpa)
  unique(enrollment_id, tanggal)
  last_modified (timestamptz)
```

#### 6.2 Database Lokal — SQLite (Flutter)

```
guru_cache (id, user_id, nama, nip, dll)
pengampu_cache (id, guru_id, kelas_id, mata_pelajaran_id, nama_kelas, nama_mapel)
siswa_cache (siswa_id, nama, nis, kelas_id)

agenda_local
  id (local autoincrement), server_id (nullable), pengampu_id, tanggal,
  materi, deskripsi, catatan, status_sync (synced/pending_insert/update/delete),
  last_modified (timestamp)

absensi_local
  id (local autoincrement), server_id (nullable), enrollment_id_internal,
  enrollment_id (server), siswa_id, tanggal, status,
  status_sync, last_modified
```

---

### 7. Aturan Bisnis Utama

- **Tahun Aktif:** Semua operasi guru dan laporan terikat pada tahun yang `is_active = true`.
- **Jendela 15 Hari:** Pengisian/ubah oleh guru dibatasi pada `tanggal perangkat` (offline) dan divalidasi ulang dengan `CURRENT_DATE` server saat sinkronisasi.
- **Laporan Guru:** Hanya data milik guru yang login. Harus online.
- **Enrollment:** Satu siswa hanya satu kelas per tahun.
- **Pengampu:** Satu guru hanya satu mapel per kelas yang sama.
- **Resolusi Konflik:** Last write wins berdasarkan `last_modified`.

---

### 8. Persyaratan Non-Fungsional

| Aspek          | Ketentuan                                                                                     |
|----------------|-----------------------------------------------------------------------------------------------|
| Offline        | Guru mengisi agenda & absensi tanpa koneksi. SQLite untuk penyimpanan lokal.                 |
| Sinkronisasi   | Otomatis saat online; antrian tampil di UI; LWW untuk konflik.                               |
| Keamanan       | Autentikasi & otorisasi bawaan TrailBase; JWT; secure storage token; endpoint terlindungi.    |
| Kinerja        | TrailBase (Rust) berkinerja tinggi; koneksi pool PostgreSQL; query laporan pakai indeks.      |
| Keandalan      | Transaksi database atomik; retry otomatis pada kegagalan jaringan.                           |
| Kegunaan       | UI mobile sederhana, indikator offline/sinkronisasi jelas.                                    |
| Platform       | Admin: Flutter Web (responsif). Guru: Flutter Mobile (Android/iOS).                           |

---

### 9. Tumpukan Teknologi

| Komponen           | Teknologi                                      |
|--------------------|------------------------------------------------|
| Frontend Admin     | Flutter Web                                    |
| Frontend Guru      | Flutter Mobile (Android/iOS)                   |
| Backend API        | **TrailBase (Rust)**                           |
| Database Server    | PostgreSQL (terintegrasi dengan TrailBase)      |
| Database Lokal     | SQLite (`sqflite` package)                     |
| State Management   | Riverpod / Bloc (Flutter)                      |
| Autentikasi        | TrailBase built‑in (JWT)                       |
| PDF Generation     | Rust crate (`genpdf`, `pdf-canvas`)           |
| CSV Handling       | Rust crate (`csv`)                             |

---

### 10. Mengapa TrailBase?

- **Backend siap pakai:** TrailBase menyediakan autentikasi, otorisasi, API generator, realtime, dan file storage secara bawaan — mengurangi penulisan kode boilerplate yang signifikan dibandingkan membangun dari nol dengan Golang.
- **Performa tinggi:** Dibangun dengan Rust, cocok untuk beban konkuren tinggi dan latensi rendah.
- **Keamanan:** Sistem izin deklaratif, JWT, dan best practice keamanan terintegrasi.
- **Fleksibilitas:** API khusus dapat ditulis sebagai ekstensi Rust saat dibutuhkan (misal untuk logika laporan PDF atau validasi 15 hari).
- **PostgreSQL sebagai database utama:** Skema relasional, constraint, dan kueri kompleks tertangani dengan baik, selaras dengan TrailBase.

---

### 11. Lampiran: Format Impor CSV

| Data                | Kolom CSV (header)                            |
|---------------------|-----------------------------------------------|
| Guru                | `nama, nip, username, password`               |
| Mata Pelajaran      | `nama`                                        |
| Kelas & Pengampu    | `nama_kelas, guru_username, mapel_nama`       |
| Siswa               | `nama, nis`                                   |
| Enrollment          | `nis, nama_kelas`                             |

*(Kelas dibuat otomatis jika belum ada; menggunakan tahun aktif.)*
