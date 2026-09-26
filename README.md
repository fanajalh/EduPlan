# 🎓 EduPlaner - Smart Student Academic & Daily Planner

<p align="center">
  <b>Aplikasi Manajemen Jadwal Pelajaran, Tugas, Materi, dan Kalender Akademik untuk Pelajar & Mahasiswa Modern.</b>
  <br />
  Dibangun dengan <b>Expo SDK 57</b>, <b>React Native</b>, dan <b>Expo Router</b>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android-green.svg" alt="Platform Android" />
  <img src="https://img.shields.io/badge/Framework-Expo%20SDK%2057-blue.svg" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/Language-TypeScript-informational.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Build-Gradle-orange.svg" alt="Gradle" />
  <img src="https://img.shields.io/badge/License-MIT-purple.svg" alt="License MIT" />
</p>

---

## 📱 Tentang EduPlaner

**EduPlaner** adalah asisten akademik digital all-in-one yang dirancang untuk membantu siswa dan mahasiswa mengatur kehidupan belajarnya secara efisien, teratur, dan menyenangkan. Menggabungkan estetika visual modern (desain sudut tumpul lembut, palet warna pastel yang cerah, maskot karakter animasi, dan bebas dari bayangan kaku) dengan performa native yang cepat dan penyimpanan offline-first.

---

## 🌟 Fitur Unggulan

### 1. 📅 Jadwal Pelajaran (Schedule Matrix)
- **Tampilan Grid 2 Kolom Unik:** Kartu jadwal didesain dengan lengkungan khas *cutout notch SVG* di tepi kanan dan tombol panah 45° yang ikonik.
- **Filter Hari Interaktif:** Navigasi cepat antar hari (Senin s/d Sabtu) dengan badge jumlah kelas aktif.
- **Detail Kelas Lengkap:** Menampilkan mata pelajaran, jam mulai & selesai, lokasi ruangan, nama guru/dosen pengampu, dan ikon subjek otomatis.
- **Ekspor Dokumen:** Mendukung unduh dan bagikan jadwal pelajaran ke format teks/file.

### 2. ✅ Manajemen Tugas & PR (Task Manager)
- **Kategori & Status Tugas:** Memilah tugas dengan filter *Belum Selesai*, *Selesai*, dan *Semua*.
- **Tingkat Prioritas Visual:** Badge prioritas berkode warna (*Tinggi*, *Sedang*, *Rendah*).
- **Deteksi Deadline & Overdue:** Pengingat tenggat waktu otomatis dengan peringatan tanggal batas waktu.
- **Pencarian Cepat:** Temukan tugas berdasarkan judul atau nama mata pelajaran secara instan.
- **Haptic Tactile Feedback:** Getaran responsif saat mencentang penyelesaian tugas.

### 3. 🗓️ Kalender Akademik & Agenda Harian
- **Kalender Bulanan 7 Kolom:** Penghitungan matematis presisi untuk tata letak tanggal bulanan.
- **Tanggal Aktif Kontras Tinggi:** Seleksi tanggal dengan lingkaran putih bersih dan teks tegas `#0F172A`, bebas dari masalah teks terpotong atau pudar di Android.
- **Timeline Agenda Harian:** Daftar runtut semua kelas, tugas, dan pengingat untuk tanggal yang dipilih.
- **Sinkronisasi Kalender HP Native:** Integrasi sekali klik (`Sync ke HP`) untuk mengekspor jadwal langsung ke Google Calendar atau Apple Calendar ponsel.
- **Custom Feedback Modal:** Dialog konfirmasi sinkronisasi dan tindakan yang indah menggantikan alert bawaan sistem OS.

### 4. 📚 Penyimpanan Materi & Modul Pembelajaran
- **Desain Kartu Bergaya Jadwal:** Kartu materi 2 kolom dengan palet warna cerah, ikon mata pelajaran, dan badge modul.
- **Mode Membaca Buku (Book Reader Mode):** Tampilan membaca materi yang nyaman seperti e-reader dengan pita bab, pengatur ukuran font (A/A+), catatan rangkuman, dan tagar topik.
- **Unduh Modul:** Simpan dan bagikan ringkasan materi secara offline.

### 5. ⏰ Pengingat & Alarm Belajar (Reminders)
- **Native Android Notification Channel (`alarms`):** Prioritas maksimal (`MAX`) dengan suara dering sistem default dan pola getar multi-tahap.
- **Heads-Up Banner Notifikasi:** Banner atas dinamis dengan karakter maskot animasi, judul, dan isi ringkas.
- **Modal Alarm Dering Aktif:** Layar dering alarm dengan opsi *Matikan Alarm* atau *Tunda 5 Menit (Snooze)*.

### 6. 🔥 Pelacak Kebiasaan Belajar (Habits Tracker)
- **Flame Streak Counter:** Penghitung konsistensi belajar harian tanpa putus.
- **Matriks Riwayat 7 Hari:** Visualisasi kemajuan disiplin belajar dalam sepekan terakhir.
- **One-Tap Check-In:** Tandai kebiasaan selesai hanya dengan satu ketukan.

### 7. 📝 Catatan Pribadi (Sticky Notes)
- **Format Catatan Tempel Warna-Warni:** Pilihan tema warna pastel lembut (Kuning, Biru, Hijau, Pink, Ungu, Oranye).
- **Fitur Pin (Sematkan):** Menempatkan catatan terpenting selalu di bagian teratas.
- **Pencarian Instan:** Mencari kata kunci di dalam isi catatan secara realtime.

### 8. 📊 Statistik & Evaluasi Diri
- **Metrik Penyelesaian Tugas:** Persentase tugas rampung vs pending.
- **Beban Jam Belajar:** Grafik visual jam pelajaran per hari.
- **Rata-Rata Disiplin:** Evaluasi ketuntasan habit belajar mingguan.

### 9. 👤 Profil Pelajar & Kustomisasi
- **Kartu Identitas Digital:** Menyimpan nama, institusi pendidikan, kelas/jurusan, dan semester.
- **Koleksi Avatar Karakter:** Pilih maskot favorit untuk menemani aktivitas belajar Anda.
- **Reset Data Demo:** Opsi memulihkan data awal aplikasi kapan saja untuk keperluan pengujian.

---

## 🛠️ Arsitektur & Teknologi

| Komponen | Teknologi |
|---|---|
| **Framework Utama** | [Expo SDK 57](https://expo.dev/) (React Native 0.86) |
| **Routing & Navigasi** | [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing) |
| **Bahasa Pemrograman** | TypeScript 6.0 (Strict mode) |
| **Penyimpanan Data** | AsyncStorage (Offline-first, data lokal di perangkat) |
| **Grafis Vektor & Ikon** | `react-native-svg` (15.15.4), `@expo/vector-icons` (Ionicons) |
| **Notifikasi & Alarm** | `expo-notifications` (Channel `alarms` & `reminders`) |
| **Sinkronisasi Kalender** | `expo-calendar` & standar iCalendar (`.ics`) |
| **Haptic Feedback** | `expo-haptics` |
| **Build System** | Gradle (Temurin JDK 17, Android SDK Platform 34/35) |

---

## 🚀 Cara Build & Mengunduh APK

### Opsi 1: Otomatis Menggunakan GitHub Actions (Sangat Disarankan)

Setiap kali ada commit baru di branch `main` atau `master`, GitHub Actions akan secara otomatis mengompilasi kode menjadi file **APK Android**:

1. Buka tab **Actions** di repositori GitHub ini: [GitHub Actions Workflow](https://github.com/fanajalh/EduPlan/actions).
2. Pilih workflow build terbaru yang bertanda centang hijau (**Build Android APK**).
3. Unduh file **`EduPlan-Debug-APK`** dari bagian *Artifacts*, atau buka menu [Releases](https://github.com/fanajalh/EduPlan/releases) untuk langsung mengunduh **`app-debug.apk`**.
4. Pindahkan ke HP Android Anda dan instal langsung!

---

### Opsi 2: Build APK Manual dengan Gradle di Komputer Lokal

Pastikan komputer Anda sudah terpasang **Node.js 20+**, **JDK 17**, dan **Android Studio (Android SDK)**:

```bash
# 1. Clone repositori
git clone https://github.com/fanajalh/EduPlan.git
cd EduPlan

# 2. Pasang dependencies
npm install

# 3. Generate folder native android lengkap dengan Gradle wrapper
npx expo prebuild --platform android --clean

# 4. Kompilasi APK menggunakan Gradle
cd android
./gradlew assembleDebug

# Untuk pengguna Windows PowerShell:
# .\gradlew assembleDebug
```

File APK yang siap diinstal akan tersedia di direktori:  
`android/app/build/outputs/apk/debug/app-debug.apk`

---

### Opsi 3: Menjalankan di Mode Pengembangan (Expo Go)

Untuk menguji dan melihat perubahan secara langsung di layar HP menggunakan aplikasi Expo Go:

```bash
# Jalankan dev server Expo
npx expo start
```
Buka aplikasi **Expo Go** di HP Android, lalu scan QR Code yang muncul di terminal.

---

## 📂 Struktur Direktori Proyek

```
eduplaner/
├── .github/
│   └── workflows/
│       └── build-apk.yml       # Otomatisasi CI/CD Gradle build APK
├── assets/
│   ├── icon.png                # Ikon aplikasi
│   ├── notification-icon.png   # Ikon notifikasi Android
│   └── splash-icon.png         # Ikon splash screen
├── src/
│   ├── app/                    # Halaman & Routing (Expo Router)
│   │   ├── (tabs)/             # Navigasi Tab Bar Utama
│   │   │   ├── index.tsx       # Beranda / Dashboard
│   │   │   ├── jadwal.tsx      # Jadwal Pelajaran (Grid 2 Kolom)
│   │   │   ├── tugas.tsx       # Daftar Tugas & PR
│   │   │   ├── kalender.tsx    # Kalender & Agenda Harian
│   │   │   └── menu.tsx        # Menu Fitur Tambahan
│   │   ├── materi/             # Arsip & Pembaca Modul Materi
│   │   ├── catatan/            # Sticky Notes Warna-Warni
│   │   ├── reminder/           # Pengaturan Alarm & Pengingat
│   │   ├── kebiasaan/          # Pelacak Habit & Streak Harian
│   │   ├── statistik/          # Evaluasi & Analitik Akademik
│   │   └── profil/             # Profil Siswa / Mahasiswa
│   ├── components/             # Komponen UI Reusable
│   │   ├── CuteCharacter.tsx   # Maskot Karakter Animatif
│   │   ├── HeadsUpBanner.tsx   # Banner Notifikasi Atas
│   │   ├── InfoFeedbackModal.tsx # Modal Konfirmasi & Notifikasi Custom
│   │   └── ConfirmDeleteModal.tsx # Dialog Konfirmasi Hapus
│   ├── constants/
│   │   └── theme.ts            # Token Warna, Tipografi & Dimensi
│   ├── context/
│   │   └── AppContext.tsx      # State Manajemen Terpusat (Offline)
│   ├── services/
│   │   ├── notificationService.ts # Manajemen Channel Alarm & Suara
│   │   ├── calendarSync.ts     # Logika Sinkronisasi Kalender HP
│   │   └── localDatabase.ts    # Lapisan Penyimpanan AsyncStorage
│   └── types/                  # Definisi Tipe TypeScript
├── app.json                    # Konfigurasi Proyek Expo & Plugin Native
├── package.json                # Dependencies & Script Eksekusi
└── tsconfig.json               # Konfigurasi TypeScript
```

---

## 📄 Lisensi
Hak Cipta © 2026 EduPlaner. Seluruh hak cipta dilindungi. Dikembangkan untuk memajukan produktivitas pelajar dan mahasiswa.
