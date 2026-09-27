# EduPlaner - Smart Student Academic & Daily Planner

Aplikasi manajemen jadwal pelajaran, tugas, materi, dan kalender akademik untuk pelajar dan mahasiswa modern. Dibangun menggunakan Expo SDK 57, React Native 0.86, dan Expo Router.

[![Version](https://img.shields.io/badge/Version-2.1.4-blue.svg)](https://github.com/fanajalh/EduPlan)
[![Platform](https://img.shields.io/badge/Platform-Android-green.svg)](https://github.com/fanajalh/EduPlan)
[![Framework](https://img.shields.io/badge/Framework-Expo%20SDK%2057-informational.svg)](https://expo.dev)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## Tentang EduPlaner

EduPlaner adalah asisten akademik digital all-in-one yang dirancang untuk membantu siswa dan mahasiswa mengelola aktivitas belajar secara terstruktur, produktif, dan efisien. Aplikasi ini menerapkan prinsip offline-first (seluruh data tersimpan aman di perangkat pengguna tanpa server eksternal), navigasi yang responsif, serta antarmuka modern yang bersih tanpa bayangan berlebihan.

---

## Fitur Utama (Versi 2.1.4)

### 1. Jadwal Pelajaran (Schedule Matrix)
- Tampilan kartu jadwal dua kolom dengan lekukan cutout khas.
- Filter hari interaktif (Senin hingga Sabtu) dengan penanda jumlah kelas aktif.
- Informasi lengkap meliputi mata pelajaran, jam mulai/selesai, ruangan, nama pengajar, dan ikon mata pelajaran otomatis.
- Opsi ekspor dan berbagi teks ringkasan jadwal.

### 2. Manajemen Tugas & Deadline
- Pengelompokan status tugas: Belum Selesai, Selesai, dan Semua.
- Label prioritas berkode warna (Tinggi, Sedang, Rendah).
- Deteksi otomatis batas waktu dan status terlambat (overdue).
- Pencarian instan berdasarkan judul tugas atau nama mata kuliah.
- Konfirmasi penyelesaian dengan getaran haptik responsif.

### 3. Kalender Akademik & Agenda Harian
- Kalender bulanan presisi dengan navigasi cepat antar-bulan.
- Penanda tanggal aktif berkontras tinggi yang mudah dibaca.
- Timeline agenda harian terpadu yang menampilkan kelas, tugas, dan pengingat pada hari terpilih.
- Sinkronisasi satu ketukan ke Google Calendar atau kalender bawaan perangkat (format standar iCalendar).

### 4. Timer Pomodoro
- Tiga mode produktivitas: Fokus Belajar, Istirahat Singkat, dan Istirahat Panjang.
- Durasi waktu yang dapat dikustomisasi secara fleksibel dengan pilihan preset cepat maupun stepper menit.
- Dial lingkaran visual SVG dengan hitungan mundur format menit dan detik.
- Pelacak siklus 4 sesi fokus yang otomatis merekomendasikan istirahat panjang.
- Alarm sistem Android berprioritas tinggi yang tetap berbunyi tepat waktu meskipun aplikasi sedang diminimize atau ditutup.
- Statistik harian otomatis untuk memantau total sesi dan total menit fokus.

### 5. Pusat Notifikasi & Riwayat Alarm
- Layar terpusat untuk melihat seluruh log notifikasi, alarm yang telah berdering, dan pencapaian tugas.
- Filter kategori notifikasi: Semua, Alarm, Streak, dan Tugas.
- Tombol tandai semua telah dibaca dan pembersihan riwayat sekali tekan.
- Tampilan kartu dengan warna kontras tinggi yang jelas dan mudah dipindai.

### 6. Widget Layar Utama Android (Home Screen Widgets)
- Integrasi widget Android native menggunakan `react-native-android-widget`.
- Tersedia dalam tiga ukuran:
  - Widget Kecil: Menampilkan ringkasan jumlah tugas tertunda dan jadwal terdekat.
  - Widget Sedang: Menampilkan jadwal kuliah atau pelajaran hari ini secara langsung di layar beranda.
  - Widget Besar: Tampilan lengkap jadwal hari ini beserta daftar tugas prioritas.
- Sinkronisasi otomatis setiap ada perubahan data pada aplikasi utama.

### 7. Pengingat & Alarm Keras Sistem (Reminders)
- Notifikasi native berbasis saluran alarm Android (`ALARM_CHANNEL_ID`) berprioritas maksimal (`MAX`).
- Layar modal dering alarm interaktif saat waktu tiba dengan kontrol matikan alarm.
- Dukungan nada dering sistem default dan getaran multi-tahap yang andal.

### 8. Penyimpanan Materi & Modul Pembelajaran
- Pengarsipan rangkuman materi dan modul pelajaran per mata kuliah.
- Mode baca nyaman (e-reader) dengan pengaturan ukuran font, penomoran bab, dan catatan sampingan.
- Kemampuan mengunduh dan membagikan teks materi secara offline.

### 9. Pelacak Kebiasaan Belajar (Habits Tracker)
- Pencatat streak disiplin belajar berturut-turut.
- Matriks evaluasi konsistensi 7 hari terakhir.
- Check-in cepat dengan satu ketukan.

### 10. Catatan Pribadi (Sticky Notes)
- Catatan tempel dengan aneka pilihan warna pastel.
- Fitur pin untuk menyematkan catatan penting di posisi paling atas.
- Pencarian konten catatan secara realtime.

### 11. Statistik & Jam Belajar
- Visualisasi grafik jam belajar mingguan, bulanan, dan semesteran.
- Evaluasi mood belajar harian dengan rekomendasi tips produktivitas.
- Deteksi jadwal sesi belajar berikutnya secara otomatis.

### 12. Cadangan & Pemulihan Data (Backup & Restore)
- Ekspor seluruh basis data aplikasi ke dalam format JSON yang dapat disimpan di penyimpanan eksternal atau cloud drive.
- Impor data cadangan untuk memulihkan jadwal, tugas, catatan, materi, dan pengaturan saat berganti perangkat.

---

## Arsitektur & Teknologi

| Kategori | Spesifikasi / Pustaka |
|---|---|
| Framework Utama | Expo SDK 57 (React Native 0.86) |
| Navigasi & Routing | Expo Router (File-based routing) |
| Bahasa Pemrograman | TypeScript 6.0 (Strict mode) |
| Penyimpanan Lokal | AsyncStorage (Offline-first database) |
| Widget Android | react-native-android-widget |
| Grafis Vektor & Ikon | react-native-svg, @expo/vector-icons (Ionicons) |
| Notifikasi & Alarm | expo-notifications |
| Sinkronisasi Kalender | expo-calendar |
| Haptic Feedback | expo-haptics |
| Build & CI/CD | Gradle, GitHub Actions |

---

## Cara Build & Menjalankan Aplikasi

### 1. Unduh APK Otomatis (GitHub Actions)
Setiap commit di branch `main` akan dikompilasi secara otomatis menjadi file APK Android oleh GitHub Actions:
1. Buka tab [GitHub Actions](https://github.com/fanajalh/EduPlan/actions) di repositori ini.
2. Buka workflow build terbaru (**Build Android APK**).
3. Unduh berkas **EduPlan-Debug-APK** pada bagian *Artifacts*, atau buka menu [Releases](https://github.com/fanajalh/EduPlan/releases) untuk mengunduh `app-debug.apk`.
4. Salin ke ponsel Android Anda dan instal.

### 2. Menjalankan di Mode Pengembangan (Expo Go / Dev Client)
```bash
# Pasang dependensi
npm install

# Jalankan server pengembangan
npx expo start
```
Buka aplikasi **Expo Go** pada ponsel Android Anda, kemudian pindai kode QR yang tampil di terminal.

### 3. Build APK Manual dengan Gradle di Lokal
Pastikan perangkat komputer telah terpasang **Node.js 20+**, **JDK 17**, dan **Android SDK**:
```bash
# 1. Generate direktori native Android
npx expo prebuild --platform android --clean

# 2. Kompilasi APK dengan Gradle
cd android
./gradlew assembleDebug

# Untuk PowerShell (Windows):
# .\gradlew assembleDebug
```
Berkas APK hasil kompilasi akan tersimpan di:  
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## Struktur Direktori Proyek

```text
eduplaner/
├── .github/
│   └── workflows/
│       └── build-apk.yml          # Otomasi CI/CD build APK
├── assets/                        # Aset gambar, ikon, dan splash screen
├── src/
│   ├── app/                       # Rute halaman (Expo Router)
│   │   ├── (tabs)/                # Tab bar navigasi utama
│   │   │   ├── index.tsx          # Beranda / Dashboard
│   │   │   ├── jadwal.tsx         # Jadwal Pelajaran (Grid 2 Kolom)
│   │   │   ├── tugas.tsx          # Manajemen Tugas & PR
│   │   │   ├── kalender.tsx       # Kalender & Agenda Harian
│   │   │   └── menu.tsx           # Menu & Pengaturan Utama
│   │   ├── pomodoro/              # Timer Pomodoro & Durasi Kustom
│   │   ├── notifikasi/            # Pusat Notifikasi & Riwayat Alarm
│   │   ├── materi/                # Arsip & Pembaca Modul Pembelajaran
│   │   ├── catatan/               # Sticky Notes Pribadi
│   │   ├── reminder/              # Pengingat & Pengaturan Alarm
│   │   ├── kebiasaan/             # Pelacak Kebiasaan & Streak Belajar
│   │   ├── statistik/             # Statistik & Beban Jam Belajar
│   │   └── profil/                # Profil Siswa & Backup Data JSON
│   ├── components/                # Komponen UI Reusable
│   │   ├── AlarmRingingModal.tsx  # Layar Dering Alarm Layar Penuh
│   │   ├── CuteCharacter.tsx      # Komponen Maskot Animatif
│   │   ├── HeadsUpBanner.tsx      # Notifikasi Banner Atas Aplikasi
│   │   ├── ModernAlertModal.tsx   # Dialog Peringatan & Konfirmasi
│   │   └── ConfirmDeleteModal.tsx # Dialog Konfirmasi Hapus Data
│   ├── constants/
│   │   └── theme.ts               # Token Warna, Tipografi & Dimensi
│   ├── context/
│   │   └── AppContext.tsx         # State Manajemen Terpusat (Offline)
│   ├── services/
│   │   ├── notificationService.ts # Manajemen Notifikasi & Saluran Alarm OS
│   │   ├── calendarSync.ts        # Sinkronisasi ke Kalender Ponsel
│   │   └── localDatabase.ts       # Lapisan Akses Database Lokal
│   ├── widgets/                   # Home Screen Widgets Android
│   │   ├── WidgetKecil.tsx        # Widget Ukuran Kecil (Ringkasan)
│   │   ├── WidgetSedang.tsx       # Widget Ukuran Sedang (Jadwal Hari Ini)
│   │   ├── WidgetBesar.tsx        # Widget Ukuran Besar (Jadwal & Tugas)
│   │   ├── widgetSync.tsx         # Sinkronisasi Data Aplikasi ke Widget
│   │   └── widgetTaskHandler.tsx  # Handler Background Task Widget
│   └── types/                     # Definisi Tipe TypeScript
├── app.json                       # Konfigurasi Proyek Expo & Plugin Native
├── package.json                   # Dependensi & Skrip Proyek
└── tsconfig.json                  # Konfigurasi TypeScript
```

---

## Lisensi

Hak Cipta © 2026 EduPlaner. Seluruh hak cipta dilindungi. Dikembangkan untuk memajukan produktivitas pelajar dan mahasiswa.
