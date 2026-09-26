import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { MaterialItem, NoteItem, TaskItem, ScheduleItem } from '@/types';

// Helper to sanitize filenames
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 40);
}

// Universal save/share file to phone storage
async function saveAndShareFile(filename: string, content: string, mimeType: string = 'text/plain'): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      // Browser download trigger
      if (typeof document !== 'undefined') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
      }
      return false;
    }

    // Native mobile (Android & iOS)
    const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!baseDir) {
      throw new Error('Directory storage not available');
    }

    const fileUri = `${baseDir}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Unduh / Simpan: ${filename}`,
        UTI: mimeType === 'application/json' ? 'public.json' : 'public.plain-text',
      });
      return true;
    } else {
      Alert.alert('Tersimpan di HP', `Berkas berhasil disimpan ke penyimpanan internal:\n${fileUri}`);
      return true;
    }
  } catch (error) {
    console.error('[FileExport] Failed to save/share file:', error);
    Alert.alert('Gagal Mengunduh', 'Terjadi kendala saat menyimpan berkas ke perangkat.');
    return false;
  }
}

/**
 * Download & Export Services for EduPlaner
 */
export const FileExportService = {
  /**
   * Unduh Catatan / Modul Materi ke penyimpanan HP (.txt)
   */
  async downloadMaterial(material: MaterialItem): Promise<boolean> {
    const safeTitle = sanitizeFilename(material.title || 'Materi');
    const filename = `${safeTitle}_EduPlaner.txt`;

    const content = [
      `==================================================`,
      `MODUL PEMBELAJARAN: ${material.title.toUpperCase()}`,
      `Mata Pelajaran : ${material.subject}`,
      `Kategori       : ${material.category || 'Umum'}`,
      `Tanggal Dibuat : ${material.createdAt}`,
      `==================================================\n`,
      `[RINGKASAN]`,
      material.summary || '-',
      `\n[ISI LENGKAP MATERI & RUMUS]`,
      material.content,
      `\n[KATA KUNCI / INDEKS]`,
      material.tags && material.tags.length > 0 ? material.tags.join(', ') : '-',
      `\n[REFERENSI / TAUTAN]`,
      material.links && material.links.length > 0 ? material.links.join('\n') : '-',
      `\n--------------------------------------------------`,
      `Diunduh dari EduPlaner Mobile Database`,
    ].join('\n');

    return saveAndShareFile(filename, content, 'text/plain');
  },

  /**
   * Unduh Memo Catatan ke HP (.txt)
   */
  async downloadNote(note: NoteItem): Promise<boolean> {
    const safeTitle = sanitizeFilename(note.title || 'Catatan');
    const filename = `${safeTitle}_EduPlaner.txt`;

    const content = [
      `==================================================`,
      `CATATAN EDUPLANER: ${note.title.toUpperCase()}`,
      `Kategori : ${note.category || 'Umum'}`,
      `Tanggal  : ${note.updatedAt}`,
      `==================================================\n`,
      note.content,
      `\n--------------------------------------------------`,
      `Tersimpan di Penyimpanan HP Anda • EduPlaner`,
    ].join('\n');

    return saveAndShareFile(filename, content, 'text/plain');
  },

  /**
   * Unduh Rangkuman Daftar Tugas ke HP (.txt)
   */
  async downloadTaskList(tasks: TaskItem[]): Promise<boolean> {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Daftar_Tugas_${dateStr}.txt`;

    const pending = tasks.filter((t) => !t.completed);
    const completed = tasks.filter((t) => t.completed);

    const content = [
      `==================================================`,
      `RINGKASAN TUGAS & TENGGAT BELAJAR - EDUPLANER`,
      `Dicetak pada : ${dateStr}`,
      `Total Tugas  : ${tasks.length} (${pending.length} Belum, ${completed.length} Selesai)`,
      `==================================================\n`,
      `[TUGAS PERLU DISELESAIKAN (${pending.length})]`,
      pending.length === 0
        ? 'Semua tugas telah tuntas!'
        : pending
            .map(
              (t, i) =>
                `${i + 1}. [ ] ${t.title} (${t.subject})\n    Prioritas: ${t.priority.toUpperCase()} | Tenggat: ${t.deadline} ${t.deadlineTime || ''}\n    Catatan: ${t.notes || '-'}`
            )
            .join('\n\n'),
      `\n[TUGAS YANG SUDAH SELESAI (${completed.length})]`,
      completed.length === 0
        ? 'Belum ada tugas selesai.'
        : completed.map((t, i) => `${i + 1}. [V] ${t.title} (${t.subject})`).join('\n'),
      `\n--------------------------------------------------`,
      `EduPlaner Mobile Local-First Database`,
    ].join('\n');

    return saveAndShareFile(filename, content, 'text/plain');
  },

  /**
   * Unduh Jadwal Mingguan ke HP (.txt)
   */
  async downloadSchedule(schedules: ScheduleItem[]): Promise<boolean> {
    const filename = `Jadwal_Pelajaran_EduPlaner.txt`;
    const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    const sortedDays = daysOrder.filter((day) =>
      schedules.some((s) => s.day === day)
    );

    const daySections = sortedDays.map((day) => {
      const items = schedules
        .filter((s) => s.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      const listStr = items
        .map(
          (s, idx) =>
            `  ${idx + 1}. ${s.startTime} - ${s.endTime} : ${s.subject}\n     Ruang: ${s.room || '-'} | Guru/Dosen: ${s.teacher || '-'}`
        )
        .join('\n');
      return `[HARI ${day.toUpperCase()}]\n${listStr}`;
    });

    const content = [
      `==================================================`,
      `JADWAL PELAJARAN / KULIAH MINGGUAN - EDUPLANER`,
      `Total Kelas: ${schedules.length}`,
      `==================================================\n`,
      daySections.join('\n\n'),
      `\n--------------------------------------------------`,
      `Diunduh langsung dari memori HP • EduPlaner`,
    ].join('\n');

    return saveAndShareFile(filename, content, 'text/plain');
  },

  /**
   * Unduh Berkas Cadangan Database JSON Lengkap ke HP
   */
  async downloadDatabaseBackup(backupJsonString: string): Promise<boolean> {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `EduPlaner_Database_Backup_${dateStr}.json`;
    return saveAndShareFile(filename, backupJsonString, 'application/json');
  },
};
