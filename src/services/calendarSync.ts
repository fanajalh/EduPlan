import { Platform, Alert } from 'react-native';
import * as Calendar from 'expo-calendar';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ScheduleItem, TaskItem, ReminderItem, DayOfWeek } from '@/types';

export interface SyncResult {
  success: boolean;
  method: 'native' | 'ics';
  syncedCount: number;
  message: string;
}

const DAY_MAP: Record<DayOfWeek, number> = {
  Minggu: 0,
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
};

// Calculate next Date for a given DayOfWeek and HH:mm
function getNextDateForDay(dayName: DayOfWeek, timeStr: string = '08:00'): Date {
  const targetDay = DAY_MAP[dayName] ?? 1;
  const now = new Date();
  const [hours, minutes] = timeStr.split(':').map((s) => parseInt(s, 10) || 0);

  const result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  const currentDay = now.getDay();
  let diff = targetDay - currentDay;

  // If today is target day and time has passed, or target day has passed this week -> next week
  if (diff < 0 || (diff === 0 && result.getTime() <= now.getTime())) {
    diff += 7;
  }
  result.setDate(result.getDate() + diff);
  return result;
}

// Parse task deadline into start & end Dates
function parseTaskDeadline(deadline: string, deadlineTime: string = '23:59'): { startDate: Date; endDate: Date } {
  let dateObj = new Date();

  // Try matching YYYY-MM-DD
  const ymdMatch = deadline.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch.map(Number);
    dateObj = new Date(y, m - 1, d);
  } else {
    const parsed = Date.parse(deadline);
    if (!isNaN(parsed)) {
      dateObj = new Date(parsed);
    }
  }

  const [hours, minutes] = deadlineTime.split(':').map((s) => parseInt(s, 10) || 0);
  const endDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), hours, minutes, 0, 0);

  // Set start date 1 hour before deadline or start of hour
  const startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
  return { startDate, endDate };
}

// Format date to iCalendar UTC string: YYYYMMDDTHHMMSSZ
function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Generate universal .ics content string
export function generateIcsCalendar(
  schedules: ScheduleItem[] = [],
  tasks: TaskItem[] = [],
  reminders: ReminderItem[] = []
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduPlaner//Academic Calendar//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:EduPlaner Jadwal & Tugas',
    'X-WR-TIMEZONE:Asia/Jakarta',
  ];

  // 1. Schedules
  schedules.forEach((sch) => {
    const start = getNextDateForDay(sch.day, sch.startTime);
    const [endH, endM] = (sch.endTime || '09:30').split(':').map((s) => parseInt(s, 10) || 0);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), endH, endM, 0, 0);

    const nowStr = toIcsDate(new Date());
    const uid = `eduplaner-sch-${sch.id}-${nowStr}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowStr}`);
    lines.push(`DTSTART:${toIcsDate(start)}`);
    lines.push(`DTEND:${toIcsDate(end)}`);
    lines.push('RRULE:FREQ=WEEKLY;INTERVAL=1');
    lines.push(`SUMMARY:[Jadwal] ${sch.subject}`);
    lines.push(`LOCATION:${sch.room || 'Kampus / Sekolah'}`);
    lines.push(`DESCRIPTION:Mata Pelajaran / Kuliah: ${sch.subject}\\nPengajar: ${sch.teacher || '-'}\\nHari: ${sch.day} ${sch.startTime} - ${sch.endTime}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  // 2. Tasks
  tasks.filter((t) => !t.completed).forEach((task) => {
    const { startDate, endDate } = parseTaskDeadline(task.deadline, task.deadlineTime);
    const nowStr = toIcsDate(new Date());
    const uid = `eduplaner-task-${task.id}-${nowStr}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowStr}`);
    lines.push(`DTSTART:${toIcsDate(startDate)}`);
    lines.push(`DTEND:${toIcsDate(endDate)}`);
    lines.push(`SUMMARY:[Tugas] ${task.title}`);
    lines.push(`DESCRIPTION:Mata Pelajaran: ${task.subject}\\nPrioritas: ${task.priority}\\nDeadline: ${task.deadline} ${task.deadlineTime || ''}\\nCatatan: ${task.notes || '-'}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  // 3. Reminders
  reminders.filter((r) => r.enabled).forEach((rem) => {
    const [h, m] = (rem.time || '08:00').split(':').map((s) => parseInt(s, 10) || 0);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const nowStr = toIcsDate(new Date());
    const uid = `eduplaner-rem-${rem.id}-${nowStr}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowStr}`);
    lines.push(`DTSTART:${toIcsDate(start)}`);
    lines.push(`DTEND:${toIcsDate(end)}`);
    lines.push(`SUMMARY:[Pengingat] ${rem.title}`);
    lines.push(`DESCRIPTION:Pengingat EduPlaner: ${rem.title}\\nCatatan: ${rem.notes || '-'}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// Fallback: Export and share .ics file to open with Google Calendar / Apple Calendar
export async function exportAndOpenIcsCalendar(
  schedules: ScheduleItem[] = [],
  tasks: TaskItem[] = [],
  reminders: ReminderItem[] = []
): Promise<SyncResult> {
  try {
    const totalCount = schedules.length + tasks.filter((t) => !t.completed).length + reminders.filter((r) => r.enabled).length;
    if (totalCount === 0) {
      return {
        success: false,
        method: 'ics',
        syncedCount: 0,
        message: 'Tidak ada agenda aktif untuk disinkronkan.',
      };
    }

    const icsContent = generateIcsCalendar(schedules, tasks, reminders);
    const filename = `EduPlaner_Kalender_${new Date().toISOString().slice(0, 10)}.ics`;

    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return {
          success: true,
          method: 'ics',
          syncedCount: totalCount,
          message: `${totalCount} agenda berhasil diekspor ke berkas kalender (.ics). Buka berkas untuk menyinkronkan ke kalender perangkat Anda.`,
        };
      }
    }

    // Native mobile (Android & iOS)
    const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!baseDir) {
      throw new Error('Penyimpanan lokal tidak tersedia.');
    }

    const fileUri = `${baseDir}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, icsContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (isSharingAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/calendar',
        dialogTitle: 'Buka dengan Kalender HP (Google / Apple Calendar)',
        UTI: 'com.apple.ical.ics',
      });
      return {
        success: true,
        method: 'ics',
        syncedCount: totalCount,
        message: `${totalCount} agenda siap disinkronkan! Pilih aplikasi Kalender HP Anda untuk mengimpor jadwal.`,
      };
    }

    return {
      success: true,
      method: 'ics',
      syncedCount: totalCount,
      message: `Berkas kalender tersimpan di: ${fileUri}`,
    };
  } catch (error) {
    console.error('[CalendarSync] ICS export error:', error);
    return {
      success: false,
      method: 'ics',
      syncedCount: 0,
      message: 'Gagal mengekspor berkas kalender.',
    };
  }
}

// Find or create writable calendar on device
async function getOrCreateTargetCalendar(): Promise<Calendar.ExpoCalendar | null> {
  try {
    const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);

    // 1. Look for existing EduPlaner calendar
    const existingEdu = calendars.find((c) => c.title === 'EduPlaner' || c.name === 'EduPlaner');
    if (existingEdu && existingEdu.allowsModifications) {
      return existingEdu;
    }

    // 2. On iOS, try default calendar
    if (Platform.OS === 'ios') {
      try {
        const defaultCal = Calendar.getDefaultCalendarSync();
        if (defaultCal && defaultCal.allowsModifications) {
          return defaultCal;
        }
      } catch {
        // Fallback to searching writable
      }
    }

    // 3. Search for primary or writable calendar
    const primaryWritable = calendars.find((c) => c.isPrimary && c.allowsModifications);
    if (primaryWritable) {
      return primaryWritable;
    }

    const anyWritable = calendars.find((c) => c.allowsModifications);
    if (anyWritable) {
      return anyWritable;
    }

    // 4. Try creating an EduPlaner calendar if supported
    if (Platform.OS === 'android') {
      const newCal = await Calendar.createCalendar({
        title: 'EduPlaner',
        color: '#5274F5',
        entityType: Calendar.EntityTypes.EVENT,
        name: 'EduPlaner',
        ownerAccount: 'EduPlaner',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
        source: {
          isLocalAccount: true,
          name: 'EduPlaner',
          type: Calendar.SourceType.LOCAL,
        },
      });
      return newCal;
    }

    return calendars[0] || null;
  } catch (err) {
    console.warn('[CalendarSync] getOrCreateTargetCalendar warning:', err);
    return null;
  }
}

// Main sync function: Tries direct Native Calendar sync, with automatic fallback to .ics
export async function syncAllToPhoneCalendar(
  schedules: ScheduleItem[] = [],
  tasks: TaskItem[] = [],
  reminders: ReminderItem[] = []
): Promise<SyncResult> {
  const totalAgendas = schedules.length + tasks.filter((t) => !t.completed).length + reminders.filter((r) => r.enabled).length;

  if (totalAgendas === 0) {
    return {
      success: false,
      method: 'native',
      syncedCount: 0,
      message: 'Belum ada agenda jadwal atau tugas untuk disinkronkan.',
    };
  }

  // If on Web or unsupported platform, directly use universal .ics export
  if (Platform.OS === 'web') {
    return await exportAndOpenIcsCalendar(schedules, tasks, reminders);
  }

  try {
    // Check permission
    const { status } = await Calendar.requestCalendarPermissions();
    if (status !== 'granted') {
      // If user denied native calendar permission, offer .ics share
      return await exportAndOpenIcsCalendar(schedules, tasks, reminders);
    }

    // Get writable calendar
    const targetCalendar = await getOrCreateTargetCalendar();
    if (!targetCalendar) {
      // Fallback to .ics if no writable calendar found
      return await exportAndOpenIcsCalendar(schedules, tasks, reminders);
    }

    let syncedCount = 0;

    // 1. Sync Schedules
    for (const sch of schedules) {
      try {
        const start = getNextDateForDay(sch.day, sch.startTime);
        const [endH, endM] = (sch.endTime || '09:30').split(':').map((s) => parseInt(s, 10) || 0);
        const end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), endH, endM, 0, 0);

        await targetCalendar.createEvent({
          title: `[Jadwal] ${sch.subject}`,
          startDate: start,
          endDate: end,
          location: sch.room || 'Ruang Kuliah / Kelas',
          notes: `EduPlaner\nMata Pelajaran/Kuliah: ${sch.subject}\nPengajar: ${sch.teacher || '-'}\nHari: ${sch.day} (${sch.startTime} - ${sch.endTime})`,
          recurrenceRule: {
            frequency: Calendar.Frequency.WEEKLY,
            interval: 1,
          },
        });
        syncedCount++;
      } catch (err) {
        console.warn(`[CalendarSync] Failed to sync schedule ${sch.subject}:`, err);
      }
    }

    // 2. Sync Tasks
    const activeTasks = tasks.filter((t) => !t.completed);
    for (const task of activeTasks) {
      try {
        const { startDate, endDate } = parseTaskDeadline(task.deadline, task.deadlineTime);

        await targetCalendar.createEvent({
          title: `[Tugas] ${task.title}`,
          startDate,
          endDate,
          notes: `EduPlaner Tugas\nMata Pelajaran: ${task.subject}\nPrioritas: ${task.priority}\nDeadline: ${task.deadline} ${task.deadlineTime || ''}\nCatatan: ${task.notes || '-'}`,
        });
        syncedCount++;
      } catch (err) {
        console.warn(`[CalendarSync] Failed to sync task ${task.title}:`, err);
      }
    }

    // 3. Sync Reminders
    const activeReminders = reminders.filter((r) => r.enabled);
    for (const rem of activeReminders) {
      try {
        const [h, m] = (rem.time || '08:00').split(':').map((s) => parseInt(s, 10) || 0);
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
        const end = new Date(start.getTime() + 30 * 60 * 1000);

        await targetCalendar.createEvent({
          title: `[Pengingat] ${rem.title}`,
          startDate: start,
          endDate: end,
          notes: `Pengingat EduPlaner: ${rem.title}\nCatatan: ${rem.notes || '-'}`,
        });
        syncedCount++;
      } catch (err) {
        console.warn(`[CalendarSync] Failed to sync reminder ${rem.title}:`, err);
      }
    }

    if (syncedCount > 0) {
      return {
        success: true,
        method: 'native',
        syncedCount,
        message: `Berhasil menyinkronkan ${syncedCount} agenda langsung ke Kalender HP Anda!`,
      };
    } else {
      // If native events failed (e.g. running in Expo Go without dev build), fallback to .ics
      return await exportAndOpenIcsCalendar(schedules, tasks, reminders);
    }
  } catch (error) {
    console.log('[CalendarSync] Native sync encountered error, falling back to ICS:', error);
    // Graceful fallback for Expo Go / simulator / restricted environments
    return await exportAndOpenIcsCalendar(schedules, tasks, reminders);
  }
}

// Single item sync helper
export async function syncSingleItemToPhoneCalendar(item: {
  title: string;
  type: 'schedule' | 'task' | 'reminder';
  subtitle?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  notes?: string;
  day?: DayOfWeek;
  startTime?: string;
  endTime?: string;
}): Promise<SyncResult> {
  // If web, export single ics
  if (Platform.OS === 'web') {
    const singleSch = item.type === 'schedule' ? [{
      id: 'single',
      subject: item.title,
      day: item.day || 'Senin',
      startTime: item.startTime || '08:00',
      endTime: item.endTime || '09:30',
      room: item.location || '',
      teacher: item.subtitle || '',
      color: '#5274F5',
    }] : [];

    const singleTask = item.type === 'task' ? [{
      id: 'single',
      title: item.title,
      subject: item.subtitle || 'Tugas Umum',
      deadline: new Date().toISOString().slice(0, 10),
      deadlineTime: item.startTime || '23:59',
      priority: 'sedang' as const,
      completed: false,
      notes: item.notes,
      createdAt: new Date().toISOString(),
    }] : [];

    return await exportAndOpenIcsCalendar(singleSch, singleTask);
  }

  try {
    const { status } = await Calendar.requestCalendarPermissions();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin untuk menambahkan agenda ke Kalender HP.');
      return {
        success: false,
        method: 'native',
        syncedCount: 0,
        message: 'Izin kalender belum diberikan.',
      };
    }

    const targetCalendar = await getOrCreateTargetCalendar();
    if (!targetCalendar) {
      throw new Error('Tidak menemukan kalender aktif.');
    }

    let start = item.startDate;
    let end = item.endDate;

    if (!start) {
      if (item.type === 'schedule' && item.day) {
        start = getNextDateForDay(item.day, item.startTime || '08:00');
        const [endH, endM] = (item.endTime || '09:30').split(':').map((s) => parseInt(s, 10) || 0);
        end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), endH, endM, 0, 0);
      } else {
        const now = new Date();
        const [h, m] = (item.startTime || '08:00').split(':').map((s) => parseInt(s, 10) || 0);
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
        end = new Date(start.getTime() + 60 * 60 * 1000);
      }
    }

    if (!end) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    await targetCalendar.createEvent({
      title: item.title,
      startDate: start,
      endDate: end,
      location: item.location || 'EduPlaner',
      notes: item.notes || `Agenda EduPlaner: ${item.title}`,
      recurrenceRule: item.type === 'schedule' ? {
        frequency: Calendar.Frequency.WEEKLY,
        interval: 1,
      } : undefined,
    });

    return {
      success: true,
      method: 'native',
      syncedCount: 1,
      message: `Agenda "${item.title}" berhasil disinkronkan ke Kalender HP!`,
    };
  } catch (error) {
    console.log('[CalendarSync] Single item sync failed, fallback to ICS:', error);
    const singleSch = item.type === 'schedule' ? [{
      id: 'single',
      subject: item.title,
      day: item.day || 'Senin',
      startTime: item.startTime || '08:00',
      endTime: item.endTime || '09:30',
      room: item.location || '',
      teacher: item.subtitle || '',
      color: '#5274F5',
    }] : [];

    const singleTask = item.type === 'task' ? [{
      id: 'single',
      title: item.title,
      subject: item.subtitle || 'Tugas Umum',
      deadline: new Date().toISOString().slice(0, 10),
      deadlineTime: item.startTime || '23:59',
      priority: 'sedang' as const,
      completed: false,
      notes: item.notes,
      createdAt: new Date().toISOString(),
    }] : [];

    return await exportAndOpenIcsCalendar(singleSch, singleTask);
  }
}
