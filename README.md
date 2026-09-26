# 🎓 EduPlaner - Aplikasi Manajemen Belajar & Agenda Pelajar Pintar (Android APK)

Aplikasi **EduPlaner** dibangun menggunakan **Expo SDK 57 (React Native)** dengan arsitektur **Expo Router**, offline-first storage via **AsyncStorage**, dan desain antarmuka modern yang ramah pengguna (UI/UX expert grade).

---

## 🌟 11 Fitur Lengkap Sesuai Permintaan

1. **Dashboard (`src/app/(tabs)/index.tsx`)**:
   - Ringkasan aktivitas harian, kartu status tugas mendesak, jadwal kelas hari ini.
   - Quick check-in habit streak harian & target capaian IPK.
   - Papan edaran penting & menu pintas ke seluruh 11 fitur.

2. **Jadwal Pelajaran (`src/app/(tabs)/jadwal.tsx`)**:
   - Filter tab hari (Senin s/d Sabtu).
   - Kartu jadwal dengan jam mulai/selesai, ruangan, nama guru/dosen, serta label warna visual.
   - Modal tambah, edit, dan hapus jadwal pelajaran.

3. **Tugas & PR (`src/app/(tabs)/tugas.tsx`)**:
   - Filter status: *Belum Selesai*, *Selesai*, dan *Semua*.
   - Filter prioritas (*Tinggi*, *Sedang*, *Rendah*).
   - Centang tugas selesai dengan animasi & haptic feedback.
   - Indikator peringatan batas waktu (deadline & overdue status).
   - Pencarian tugas berdasarkan nama tugas dan mata pelajaran.

4. **Penyimpanan Catatan Materi (`src/app/materi/index.tsx`)**:
   - Pengelompokan berdasarkan mata pelajaran & kategori modul.
   - Pencarian cepat materi berdasarkan kata kunci, judul, atau tagar.
   - Pembaca modul lengkap (*Reader view* dengan ringkasan & isi catatan detail).
   - Modal tambah/edit materi beserta tag.

5. **Catatan Pribadi (`src/app/catatan/index.tsx`)**:
   - Format kartu *Sticky Notes* warna-warni (Kuning, Biru, Hijau, Pink, Ungu, Merah).
   - Fitur Pin (Sematkan di atas) untuk catatan prioritas.
   - Pencarian instan isi catatan.

6. **Reminder & Alarm (`src/app/reminder/index.tsx`)**:
   - Saklar aktif/nonaktif alarm interaktif dengan haptic tactile.
   - Kategori pengingat (*Kelas/Kuliah*, *Tugas & PR*, *Ujian/Tryout*, *Habit*, *Umum*).
   - Pengaturan frekuensi (*Setiap Hari*, *Hari Kerja*, *Akhir Pekan*, *Sekali*).

7. **Papan Pengumuman (`src/app/pengumuman/index.tsx`)**:
   - Pengumuman resmi kampus/sekolah dengan lencana kategori (*Akademik*, *Ujian*, *Kegiatan*, *Penting*).
   - Fitur sematkan edaran penting di urutan teratas.
   - Modal baca detail lengkap edaran.

8. **Statistik & Analitik (`src/app/statistik/index.tsx`)**:
   - Evaluasi persentase penyelesaian tugas (Progress bar & pie metrics).
   - Simulator & pelacak target IPK (IPK saat ini vs target kelulusan).
   - Grafik batang beban jam kelas per hari (Senin - Sabtu).
   - Konsistensi rata-rata streak habit harian.

9. **Kalender Akademik (`src/app/(tabs)/kalender.tsx`)**:
   - Tampilan kalender bulanan interaktif dengan navigasi bulan.
   - Indikator titik berwarna untuk hari yang memiliki jadwal kelas dan tenggat tugas.
   - Daftar agenda harian spesifik untuk tanggal yang dipilih.

10. **Profil Pelajar (`src/app/profil/index.tsx`)**:
    - Kartu identitas siswa (Nama, NISN/NIM, Sekolah/Kampus, Jurusan, Semester).
    - Pemilihan karakter emoji avatar.
    - Pengaturan target IPK & moto motivasi belajar.
    - Tombol *Reset ke Data Demo* untuk mengembalikan data pengujian kapan saja.

11. **Kebiasaan Harian / Habits Tracker (`src/app/kebiasaan/index.tsx`)**:
    - Matriks 7 hari riwayat kedisiplinan belajar.
    - Penghitung api konsistensi (*Flame Streak Counter*).
    - Tombol check-in satu ketukan untuk menyelesaikan habit hari ini.

---

## 🚀 Panduan Menjalankan & Membuat APK

### 1. Menjalankan di Mode Pengembangan (Expo Go / Emulator)
```bash
# Menjalankan dev server Expo
npx expo start

# Atau langsung ke perangkat/emulator Android
npm run android
```
> Buka aplikasi **Expo Go** di HP Android Anda, lalu scan QR Code yang muncul di terminal.

---

### 2. Cara Build APK Standalone untuk Android (File `.apk` yang bisa langsung diinstal)

Kami telah menyiapkan konfigurasi `eas.json` dengan profile `preview` yang khusus menghasilkan file APK:

1. **Pastikan EAS CLI terpasang & login akun Expo Anda:**
   ```bash
   npx eas-cli login
   ```

2. **Jalankan perintah build APK:**
   ```bash
   npx eas-cli build -p android --profile preview
   ```
   *Atau gunakan script shortcut:*
   ```bash
   npm run build:apk
   ```

3. Server EAS akan memproses kompilasi Android APK di cloud. Setelah selesai (beberapa menit), Anda akan mendapatkan tautan unduhan langsung berupa file **`eduplaner.apk`** yang dapat langsung dibagikan dan diinstal di semua smartphone Android!

---

## 🛠️ Pemeriksaan Kualitas Kode (Verification)
- **Typecheck:** `npm run typecheck` (`npx tsc --noEmit`) ➔ **0 Errors**
- **Expo Health Check:** `npm run doctor` (`npx expo-doctor`) ➔ **21/21 Checks Passed**
