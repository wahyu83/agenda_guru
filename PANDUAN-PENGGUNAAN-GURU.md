<style>
table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
th, td { border: 1px solid #555; padding: 8px 12px; text-align: left; }
th { background: #333; color: white; }
tr:nth-child(even) { background: #f9f9f9; }
</style>

# Panduan Penggunaan Aplikasi Agenda Guru

## SMK Negeri 1 Arahan

## Daftar Isi

1. [Pengenalan Aplikasi](#1-pengenalan-aplikasi)
2. [Cara Login](#2-cara-login)
3. [Navigasi Utama](#3-navigasi-utama)
4. [Daftar Tugas](#4-daftar-tugas)
5. [Mengisi Agenda Mengajar](#5-mengisi-agenda-mengajar)
6. [Mengisi Absensi Siswa](#6-mengisi-absensi-siswa)
7. [Memasukkan Nilai Siswa](#7-memasukkan-nilai-siswa)
8. [Jadwal Mengajar](#8-jadwal-mengajar)
9. [Riwayat](#9-riwayat)
10. [Laporan Wali Kelas](#10-laporan-wali-kelas)
11. [Ekspor Data](#11-ekspor-data)
12. [Pengaturan Akun](#12-pengaturan-akun)
13. [FAQ & Tips](#13-faq--tips)

## 1. Pengenalan Aplikasi

**Agenda Guru SMKN 1 Arahan** adalah aplikasi berbasis web dan PWA (*Progressive Web App*) untuk membantu guru dalam:
- Mencatat agenda pembelajaran harian
- Mengelola absensi siswa
- Memasukkan nilai siswa (Tugas & Ulangan Harian)
- Melihat jadwal mengajar mingguan
- Mengekspor laporan dalam format **PDF** dan **CSV**

Aplikasi dapat diakses melalui browser pada perangkat **komputer**, **laptop**, **tablet**, maupun **smartphone**.

### Perbandingan Fitur Berdasarkan Peran

<table>
<tr><th>Fitur</th><th>Guru Biasa</th><th>Wali Kelas</th></tr>
<tr><td>Mengisi Agenda Mengajar</td><td>✓</td><td>✓</td></tr>
<tr><td>Mengisi Absensi Siswa</td><td>✓</td><td>✓</td></tr>
<tr><td>Memasukkan Nilai</td><td>✓</td><td>✓</td></tr>
<tr><td>Melihat Jadwal Mengajar</td><td>✓</td><td>✓</td></tr>
<tr><td>Melihat Riwayat</td><td>✓</td><td>✓</td></tr>
<tr><td>Ekspor Riwayat (PDF/CSV)</td><td>✓</td><td>✓</td></tr>
<tr><td>Laporan Kelas (Agenda & Absensi)</td><td>✗</td><td>✓</td></tr>
<tr><td>Ekspor Laporan Kelas</td><td>✗</td><td>✓</td></tr>
</table>

---

## 2. Cara Login

### Langkah-langkah:

1. Buka aplikasi melalui URL yang disediakan sekolah.
2. Anda akan melihat halaman **Sign In**.
3. Masukkan **Username** (NIP atau username yang diberikan admin).
4. Masukkan **Password**.
5. Klik tombol **Sign In**.

> **Catatan:** Jika lupa password, hubungi administrator untuk di-reset. Password default untuk akun baru adalah **`123456`**.

### Diagram Alur Login

```
Buka Aplikasi
      │
      ▼
Halaman Login
      │
      ▼
Input Username & Password
      │
      ▼
Verifikasi Server ────── Gagal ────▶ Tampilkan Pesan Error
      │                                    │
      │ Berhasil                           │
      ▼                                    │
Redirect ke Dashboard                       │
      ▲                                    │
      └────────────────────────────────────┘
      (kembali ke input)
```

---

## 3. Navigasi Utama

Setelah login sebagai **Guru**, Anda akan masuk ke antarmuka utama dengan navigasi sebagai berikut:

### Struktur Halaman Guru

```
+------------------------------------+
| HEADER: Nama Guru & NIP   (tap=akun)|
+------------------------------------+
|                                    |
|           KONTEN HALAMAN           |
|        (berubah sesuai menu)        |
|                                    |
+------------------------------------+
| [Tugas]  [Jadwal]  [Riwayat]  [Lap]| <-- Bottom Nav
+------------------------------------+
```

### Menu Navigasi Bawah

<table>
<tr><th>Ikon</th><th>Menu</th><th>Deskripsi</th></tr>
<tr><td>🏠</td><td><b>Tugas</b></td><td>Daftar kelas & mata pelajaran yang diampu</td></tr>
<tr><td>📖</td><td><b>Jadwal</b></td><td>Tabel jadwal mengajar mingguan (Senin-Jumat)</td></tr>
<tr><td>🕐</td><td><b>Riwayat</b></td><td>Riwayat agenda, absensi, dan nilai yang telah diisi</td></tr>
<tr><td>📄</td><td><b>Laporan</b></td><td>Laporan kelas untuk Wali Kelas <i>(hanya tampil jika Anda Wali Kelas)</i></td></tr>
</table>

---

## 4. Daftar Tugas

Halaman **Tugas** menampilkan semua kelas dan mata pelajaran yang diampu oleh guru. Dari sini Anda dapat memulai pengisian agenda, absensi, dan nilai.

### Tampilan Daftar Tugas

<table>
<tr><th>Kelas</th><th>Mata Pelajaran</th><th>Aksi</th></tr>
<tr><td>X - RPL 1</td><td>Pemrograman Dasar</td><td>Tap ➔</td></tr>
<tr><td>XI - TKJ 2</td><td>Basis Data</td><td>Tap ➔</td></tr>
<tr><td>XII - MM 1</td><td>Desain Grafis</td><td>Tap ➔</td></tr>
</table>

### Alur Kerja Harian

```
Pilih Kelas ───────▶ Isi Agenda ───────▶ Isi Absensi ───────▶ Input Nilai
                   (Tab Agenda)        (Tab Absensi)        (Tab Nilai)
```

---

## 5. Mengisi Agenda Mengajar

Setelah memilih kelas, Anda akan diarahkan ke halaman pengisian **Agenda**. Halaman ini memiliki 3 tab: **Agenda | Absensi | Nilai**.

### Form Agenda Mengajar

<table>
<tr><th>Field</th><th>Keterangan</th><th>Wajib</th></tr>
<tr><td><b>Tanggal</b></td><td>Tanggal pelaksanaan pembelajaran</td><td>✓</td></tr>
<tr><td><b>Materi Pokok</b></td><td>Judul/isi materi yang diajarkan</td><td>✓</td></tr>
<tr><td><b>Deskripsi / Kegiatan</b></td><td>Detail kegiatan belajar mengajar</td><td>✓</td></tr>
<tr><td><b>Catatan Tambahan</b></td><td>Catatan khusus (misal: siswa remedial, kendala)</td><td>✗</td></tr>
</table>

### Langkah Pengisian:

1. Pilih **tanggal** pembelajaran.
2. Isi **Materi Pokok** (contoh: *"Algoritma Percabangan"*).
3. Isi **Deskripsi / Kegiatan** (contoh: *"Menjelaskan konsep if-else, latihan soal 5 nomor"*).
4. Isi **Catatan Tambahan** jika diperlukan.
5. Klik **Simpan Agenda**.

> Setelah agenda tersimpan, Anda dapat langsung beralih ke tab **Absensi** untuk mengisi kehadiran siswa.

---



## 6. Mengisi Absensi Siswa

Halaman **Absensi** menampilkan daftar siswa di kelas yang dipilih. Setiap siswa dapat diberi status kehadiran.

### Status Kehadiran

<table>
<tr><th>Status</th><th>Kode Warna</th><th>Keterangan</th></tr>
<tr><td><b>Hadir</b></td><td>🟢 Hijau</td><td>Siswa hadir di kelas</td></tr>
<tr><td><b>Sakit</b></td><td>🔵 Biru</td><td>Siswa tidak hadir karena sakit</td></tr>
<tr><td><b>Izin</b></td><td>🟡 Kuning</td><td>Siswa tidak hadir dengan izin resmi</td></tr>
<tr><td><b>Alpa</b></td><td>🔴 Merah</td><td>Siswa tidak hadir tanpa keterangan</td></tr>
</table>

### Langkah Pengisian:

1. Pilih **tanggal** pertemuan.
2. Gunakan kolom **Cari siswa...** untuk memfilter nama.
3. Untuk setiap siswa, tekan tombol status yang sesuai (Hadir/Sakit/Izin/Alpa).
   - Secara default, semua siswa berstatus **Hadir**.
   - Cukup ubah status untuk siswa yang tidak hadir.
4. Klik **Simpan Absensi**.

### Tampilan Kartu Absensi per Siswa

```
+------------------------------------------+
| Nama Siswa   [Hadir][Sakit][Izin][Alpa]  |
| NIS: 2024001                             |
+------------------------------------------+
| Nama Siswa   [Hadir][Sakit][Izin][Alpa]  |
| NIS: 2024002                             |
+------------------------------------------+
| ...                                      |
+------------------------------------------+
```

---

## 7. Memasukkan Nilai Siswa

Halaman **Nilai** digunakan untuk mencatat nilai **Tugas** atau **Ulangan Harian** siswa.

### Form Input Nilai

<table>
<tr><th>Field</th><th>Keterangan</th></tr>
<tr><td><b>Tanggal</b></td><td>Tanggal penilaian</td></tr>
<tr><td><b>Jenis</b></td><td><b>Tugas</b> atau <b>Ulangan Harian</b></td></tr>
<tr><td><b>Deskripsi</b></td><td>Judul tugas/ulangan (contoh: <i>"Bab 3 - Trigonometri"</i>)</td></tr>
<tr><td><b>Nilai</b></td><td>Skala <b>0 - 100</b> per siswa</td></tr>
</table>

### Langkah Pengisian:

1. Pilih **Tanggal** penilaian.
2. Pilih **Jenis** (Tugas / Ulangan Harian).
3. Isi **Deskripsi** untuk identifikasi.
4. Masukkan nilai setiap siswa pada kolom input (0-100).
5. Klik **Simpan Nilai**.

> **Tips:** Anda tidak harus mengisi nilai semua siswa sekaligus. Hanya nilai yang diisi (tidak kosong) yang akan disimpan.

---

## 8. Jadwal Mengajar

Halaman **Jadwal** menampilkan jadwal mengajar mingguan dalam bentuk tabel grid.

### Tampilan Jadwal

```
+-----+----------+----------+----------+----------+----------+
| Jam |  Senin   |  Selasa  |  Rabu    |  Kamis   |  Jumat   |
+-----+----------+----------+----------+----------+----------+
|  1  | X-RPL 1  |          | XI-TKJ 2 |          |          |
|  2  | X-RPL 1  |          | XI-TKJ 2 |          |          |
|  3  |          | XII-MM 1 |          | X-RPL 1  |          |
| ... |          |          |          |          |          |
+-----+----------+----------+----------+----------+----------+
```





### Keterangan Warna

<table>
<tr><th>Warna</th><th>Arti</th></tr>
<tr><td>🟣 <b>Ungu (Primary)</b></td><td>Jadwal belum diisi agenda hari ini</td></tr>
<tr><td>🟢 <b>Hijau (Secondary)</b></td><td>Agenda sudah diisi hari ini</td></tr>
<tr><td>🔵 <b>Kolom Hari Biru</b></td><td>Menandakan hari ini (current day)</td></tr>
</table>

### Ringkasan Statistik

Di bagian atas halaman Jadwal terdapat kartu ringkasan:
- **Mapel**: Total mata pelajaran yang diampu
- **Slot Terisi**: Jumlah slot jadwal
- **Terisi Hari Ini**: Jumlah agenda yang sudah diisi pada hari ini

---

## 9. Riwayat

Halaman **Riwayat** menampilkan semua data yang pernah diisi dan mendukung fitur edit, hapus, serta ekspor.

### Tiga Tab Riwayat

```
+------------------------------------------+
| [Jurnal Agenda] [Riwayat Absensi] [Nilai]|
+------------------------------------------+
|                                          |
|         Data sesuai tab dipilih           |
|                                          |
+------------------------------------------+
|      [Export PDF]    [Export CSV]        |
+------------------------------------------+
```

### Tab 1: Jurnal Agenda

<table>
<tr><th>Fitur</th><th>Deskripsi</th></tr>
<tr><td><b>Lihat</b></td><td>Daftar semua agenda yang pernah diisi</td></tr>
<tr><td><b>Edit</b></td><td>Ubah materi, deskripsi, atau catatan agenda</td></tr>
<tr><td><b>Hapus</b></td><td>Menghapus data agenda</td></tr>
<tr><td><b>Export</b></td><td>Unduh sebagai PDF atau CSV</td></tr>
</table>

### Tab 2: Riwayat Absensi

<table>
<tr><th>Fitur</th><th>Deskripsi</th></tr>
<tr><td><b>Lihat</b></td><td>Daftar sesi absensi yang pernah direkam</td></tr>
<tr><td><b>Edit</b></td><td>Ubah status kehadiran per siswa</td></tr>
<tr><td><b>Hapus</b></td><td>Menghapus data absensi</td></tr>
<tr><td><b>Export</b></td><td>Unduh sebagai PDF atau CSV</td></tr>
</table>

### Tab 3: Nilai

<table>
<tr><th>Fitur</th><th>Deskripsi</th></tr>
<tr><td><b>Lihat</b></td><td>Daftar nilai yang dikelompokkan berdasarkan tanggal & jenis</td></tr>
<tr><td><b>Edit</b></td><td>Ubah nilai siswa</td></tr>
<tr><td><b>Hapus</b></td><td>Menghapus sesi penilaian</td></tr>
<tr><td><b>Export</b></td><td>Unduh sebagai PDF atau CSV</td></tr>
</table>

---

## 10. Laporan Wali Kelas

Menu **Laporan** hanya tersedia jika Anda ditugaskan sebagai **Wali Kelas** oleh administrator.

### Fitur Laporan Wali Kelas

<table>
<tr><th>Laporan</th><th>Isi</th><th>Format</th></tr>
<tr><td><b>Jurnal Agenda Guru</b></td><td>Rekap semua agenda mengajar dari semua guru di kelas wali</td><td>PDF / CSV</td></tr>
<tr><td><b>Rekap Absensi Harian</b></td><td>Matriks kehadiran siswa per mata pelajaran (H/S/I/A)</td><td>PDF / CSV</td></tr>
</table>

### Contoh Matriks Absensi

<table>
<tr><th>No</th><th>Nama Siswa</th><th>01/05/26</th><th>02/05/26</th><th>03/05/26</th><th>H</th><th>S</th><th>I</th><th>A</th></tr>
<tr><td>1</td><td>Andi Pratama</td><td>H</td><td>H</td><td>S</td><td>2</td><td>1</td><td>0</td><td>0</td></tr>
<tr><td>2</td><td>Budi Santoso</td><td>H</td><td>H</td><td>H</td><td>3</td><td>0</td><td>0</td><td>0</td></tr>
<tr><td>3</td><td>Citra Dewi</td><td>I</td><td>H</td><td>H</td><td>2</td><td>0</td><td>1</td><td>0</td></tr>
</table>

> **Keterangan:** H=Hadir, S=Sakit, I=Izin, A=Alpa

---

## 11. Ekspor Data

Aplikasi mendukung ekspor data ke dua format:

<table>
<tr><th>Format</th><th>Kelebihan</th></tr>
<tr><td><b>PDF</b></td><td>Siap cetak, format rapi dengan kop sekolah</td></tr>
<tr><td><b>CSV</b></td><td>Dapat dibuka di <b>Microsoft Excel</b>, <b>Google Sheets</b>, atau aplikasi spreadsheet lainnya</td></tr>
</table>

### Data yang Dapat Diekspor

<table>
<tr><th>Sumber</th><th>Data</th></tr>
<tr><td>Halaman <b>Riwayat</b></td><td>Agenda, Absensi, Nilai (pribadi guru)</td></tr>
<tr><td>Halaman <b>Laporan</b> (Wali Kelas)</td><td>Agenda semua guru & Absensi per kelas</td></tr>
</table>

### Cara Ekspor:

1. Buka halaman **Riwayat** atau **Laporan**.
2. Klik tombol **Export PDF** atau **Export CSV**.
3. File akan otomatis terunduh ke perangkat Anda.

---

## 12. Pengaturan Akun

### Mengubah Password

1. Tap pada **nama/NIP Anda** di bagian header (pojok kiri atas).
2. Sebuah modal **Pengaturan Akun** akan tampil.
3. Masukkan **Password Lama**.
4. Masukkan **Password Baru**.
5. Masukkan **Konfirmasi Password Baru**.
6. Klik **Simpan**.

> **Tips Keamanan:** Gunakan password yang kuat minimal 6 karakter dan sulit ditebak.

---

## 13. FAQ & Tips

### Pertanyaan Umum

<table>
<tr><th>Pertanyaan</th><th>Jawaban</th></tr>
<tr><td><b>Bagaimana jika lupa password?</b></td><td>Hubungi administrator untuk reset password ke default <code>123456</code>.</td></tr>
<tr><td><b>Apakah bisa mengisi data tanpa internet?</b></td><td>Ya, aplikasi mendukung mode offline. Data akan disimpan di perangkat dan disinkronkan saat koneksi tersedia.</td></tr>
<tr><td><b>Bagaimana jika data yang diisi salah?</b></td><td>Buka halaman <b>Riwayat</b>, cari data yang salah, lalu klik <b>Edit</b> atau <b>Hapus</b>.</td></tr>
<tr><td><b>Berapa skala nilai yang digunakan?</b></td><td>Skala <b>0 - 100</b>.</td></tr>
<tr><td><b>Apakah bisa mengisi agenda untuk tanggal yang lalu?</b></td><td>Ya, pilih tanggal yang diinginkan pada input <b>Tanggal</b>.</td></tr>
<tr><td><b>Bagaimana cara mengakses aplikasi dari HP?</b></td><td>Buka browser, masukkan URL aplikasi. Anda juga dapat menambahkannya ke <b>Home Screen</b> (Add to Home Screen) untuk akses seperti aplikasi native.</td></tr>
</table>

### Tips Penggunaan

1. **Isi agenda setiap selesai mengajar** agar data tetap akurat dan tidak tertinggal.
2. **Gunakan fitur pencarian** di halaman absensi dan nilai untuk menemukan siswa dengan cepat.
3. **Ekspor data secara berkala** sebagai cadangan.
4. **Pastikan koneksi internet stabil** saat akan menyimpan data agar sinkronisasi berjalan lancar.
5. **Ganti password default** (`123456`) segera setelah login pertama kali.

---
> **Dokumen ini disusun untuk memudahkan guru dalam menggunakan aplikasi Agenda Guru SMKN 1 Arahan.**
> Untuk pertanyaan atau bantuan lebih lanjut, hubungi **Administrator** atau **Tim IT Sekolah**.

---


