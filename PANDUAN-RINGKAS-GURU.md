<style>
table { border-collapse: collapse; width: 100%; margin: 0.3rem 0; font-size: 0.85rem; }
th, td { border: 1px solid #555; padding: 4px 8px; text-align: left; }
th { background: #333; color: white; }
h2 { font-size: 1.1rem; margin-top: 0.5rem; }
h3 { font-size: 1rem; margin-top: 0.4rem; }
body { font-family: Arial, sans-serif; font-size: 0.85rem; }
</style>

# AGENDA GURU &mdash; Panduan Ringkas
## SMK Negeri 1 Arahan

---

### Ringkasan Aplikasi
Aplikasi web & PWA untuk mencatat **agenda**, **absensi**, dan **nilai** siswa. Akses via browser di HP/laptop.

---

### Alur Kerja Harian

```
  MULAI → LOGIN → HALAMAN TUGAS → Pilih Kelas
                                      │
               ┌──────────────────────┼──────────────────────┐
               ▼                      ▼                      ▼
         ISI AGENDA             ISI ABSENSI             INPUT NILAI
         (Tab 1)                (Tab 2)                 (Tab 3)
               │                      │                      │
               └──────────────────────┼──────────────────────┘
                                      ▼
                                   SELESAI
```

---

### Navigasi Bawah (Guru)

| Menu | Fungsi |
|---|---|
| **Tugas** | Daftar kelas & mapel yang diampu |
| **Jadwal** | Tabel jadwal mingguan (Senin&ndash;Jumat, 10 jam) |
| **Riwayat** | Lihat/edit/hapus/ekspor data lalu |
| **Laporan** | Ekspor laporan wali kelas (hanya wali kelas) |

---

### 1. Isi Agenda Mengajar

<table>
<tr><th>Field</th><th>Isi</th><th>Wajib</th></tr>
<tr><td>Tanggal</td><td>Tanggal pembelajaran</td><td>✓</td></tr>
<tr><td>Materi Pokok</td><td>Judul materi (contoh: Algoritma Percabangan)</td><td>✓</td></tr>
<tr><td>Deskripsi</td><td>Detail kegiatan KBM</td><td>✓</td></tr>
<tr><td>Catatan</td><td>Kendala, siswa remedial, dll.</td><td>✗</td></tr>
</table>

> Klik **Simpan Agenda** setelah selesai.

---

### 2. Isi Absensi

<table>
<tr><th>Status</th><th>Warna</th><th>Arti</th></tr>
<tr><td><b>Hadir</b></td><td>🟢 Hijau</td><td>Siswa hadir</td></tr>
<tr><td><b>Sakit</b></td><td>🔵 Biru</td><td>Tidak hadir &mdash; sakit</td></tr>
<tr><td><b>Izin</b></td><td>🟡 Kuning</td><td>Tidak hadir &mdash; izin resmi</td></tr>
<tr><td><b>Alpa</b></td><td>🔴 Merah</td><td>Tidak hadir &mdash; tanpa keterangan</td></tr>
</table>

**Langkah:** Pilih tanggal &rarr; tap status tiap siswa (default: Hadir) &rarr; **Simpan Absensi**.

---

### 3. Input Nilai

<table>
<tr><th>Field</th><th>Keterangan</th></tr>
<tr><td>Tanggal</td><td>Tanggal penilaian</td></tr>
<tr><td>Jenis</td><td><b>Tugas</b> atau <b>Ulangan Harian</b></td></tr>
<tr><td>Deskripsi</td><td>Judul (contoh: Bab 3 &mdash; Trigonometri)</td></tr>
<tr><td>Nilai</td><td>Skala <b>0 &ndash; 100</b> per siswa</td></tr>
</table>

> Hanya nilai yang diisi (tidak kosong) yang tersimpan. Klik **Simpan Nilai**.

---
---
---
---
### 4. Riwayat & Ekspor

| Tab | Isi | Aksi |
|---|---|---|
| **Jurnal Agenda** | Semua agenda yang pernah diisi | Lihat, Edit, Hapus |
| **Riwayat Absensi** | Semua sesi absensi | Lihat, Edit, Hapus |
| **Nilai** | Semua nilai (dikelompokkan) | Lihat, Edit, Hapus |

file csv bisa dibuka menggunakan excel, google sheets, maupun aplikasi spreadsheet lainnya<br>
Setiap tab memiliki tombol **Export PDF** & **Export CSV**.

---

### 5. Laporan Wali Kelas

| Laporan | Format |
|---|---|
| Jurnal Agenda Guru (semua guru di kelas wali) | PDF / CSV |
| Rekap Absensi Harian (matriks H/S/I/A per mapel) | PDF / CSV |

---

### 6. Pengaturan Akun

Tap **nama/NIP** di header pojok kiri atas &rarr; isi password lama & baru &rarr; **Simpan**.

---

### FAQ Singkat

| Tanya | Jawab |
|---|---|
| Lupa password? | Hubungi admin, reset ke `123456` |
| Offline? | Bisa, data disimpan lokal & disinkronkan saat online |
| Data salah? | Buka **Riwayat** &rarr; Edit atau Hapus |
| Akses dari HP? | Buka browser, tambahkan ke Home Screen |

---


