import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ScheduleItem,
  TaskItem,
  MaterialItem,
  NoteItem,
  ReminderItem,
  AnnouncementItem,
  HabitItem,
  StudentProfile,
} from '@/types';
import {
  INITIAL_SCHEDULES,
  INITIAL_TASKS,
  INITIAL_MATERIALS,
  INITIAL_NOTES,
  INITIAL_REMINDERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_HABITS,
  INITIAL_PROFILE,
} from './seedData';

// Storage keys for isolated, atomic collections in the user's phone storage
export const DB_KEYS = {
  SCHEDULES: '@eduplaner_db_v3:schedules',
  TASKS: '@eduplaner_db_v3:tasks',
  MATERIALS: '@eduplaner_db_v3:materials',
  NOTES: '@eduplaner_db_v3:notes',
  REMINDERS: '@eduplaner_db_v3:reminders',
  ANNOUNCEMENTS: '@eduplaner_db_v3:announcements',
  HABITS: '@eduplaner_db_v3:habits',
  PROFILE: '@eduplaner_db_v3:profile',
  METADATA: '@eduplaner_db_v3:metadata',
  LEGACY_V1: '@eduplaner_data_v1',
};

export interface DatabaseStats {
  taskCount: number;
  completedTasks: number;
  noteCount: number;
  scheduleCount: number;
  materialCount: number;
  habitCount: number;
  reminderCount: number;
  announcementCount: number;
  totalRecords: number;
  approximateSizeKb: string;
  storageEngine: string;
  lastUpdated: string;
  isOfflineOnly: boolean;
}

export interface FullBackupPayload {
  version: string;
  exportedAt: string;
  devicePlatform: string;
  schedules: ScheduleItem[];
  tasks: TaskItem[];
  materials: MaterialItem[];
  notes: NoteItem[];
  reminders: ReminderItem[];
  announcements: AnnouncementItem[];
  habits: HabitItem[];
  profile: StudentProfile;
}

// Generic safe storage helpers
async function readItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`[LocalDB] Error reading key "${key}":`, error);
    return fallback;
  }
}

async function writeItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[LocalDB] Error writing key "${key}":`, error);
    throw error;
  }
}

/**
 * Local-First Mobile Database Backend
 * All user data is 100% saved, indexed, and processed on the user's smartphone.
 */
export const LocalDatabase = {
  /**
   * Initializes the database on the phone.
   * Handles migration from legacy single-key storage, or seeds initial data if fresh.
   */
  async init(): Promise<void> {
    try {
      // 1. Force a one-time clean slate wipe of any old demo/seed data from user's device
      const isCleaned = await AsyncStorage.getItem('@eduplaner_clean_slate_production_v4');
      if (!isCleaned) {
        await AsyncStorage.clear();
        await AsyncStorage.setItem('@eduplaner_clean_slate_production_v4', 'true');
        await this.clearAll();
        return;
      }

      const meta = await readItem<{ initialized?: boolean; version?: string } | null>(
        DB_KEYS.METADATA,
        null
      );

      if (meta && meta.initialized) {
        return;
      }

      await this.clearAll();
    } catch (error) {
      console.error('[LocalDB] Database initialization error:', error);
    }
  },

  // ---------------------------------------------------------------------------
  // TASK REPOSITORY (TUGAS)
  // ---------------------------------------------------------------------------
  tasks: {
    async getAll(): Promise<TaskItem[]> {
      return readItem<TaskItem[]>(DB_KEYS.TASKS, INITIAL_TASKS);
    },

    async getById(id: string): Promise<TaskItem | null> {
      const list = await this.getAll();
      return list.find((t) => t.id === id) || null;
    },

    async insert(item: Omit<TaskItem, 'id' | 'createdAt'>): Promise<TaskItem> {
      const list = await this.getAll();
      const newTask: TaskItem = {
        ...item,
        id: 'tsk-' + Date.now(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [newTask, ...list];
      await writeItem(DB_KEYS.TASKS, updated);
      return newTask;
    },

    async update(item: TaskItem): Promise<TaskItem> {
      const list = await this.getAll();
      const updated = list.map((t) => (t.id === item.id ? item : t));
      await writeItem(DB_KEYS.TASKS, updated);
      return item;
    },

    async delete(id: string): Promise<boolean> {
      const list = await this.getAll();
      const updated = list.filter((t) => t.id !== id);
      await writeItem(DB_KEYS.TASKS, updated);
      return true;
    },

    async toggle(id: string): Promise<TaskItem | null> {
      const list = await this.getAll();
      let modified: TaskItem | null = null;
      const updated = list.map((t) => {
        if (t.id === id) {
          modified = { ...t, completed: !t.completed };
          return modified;
        }
        return t;
      });
      await writeItem(DB_KEYS.TASKS, updated);
      return modified;
    },
  },

  // ---------------------------------------------------------------------------
  // SCHEDULE REPOSITORY (JADWAL)
  // ---------------------------------------------------------------------------
  schedules: {
    async getAll(): Promise<ScheduleItem[]> {
      return readItem<ScheduleItem[]>(DB_KEYS.SCHEDULES, INITIAL_SCHEDULES);
    },

    async getById(id: string): Promise<ScheduleItem | null> {
      const list = await this.getAll();
      return list.find((s) => s.id === id) || null;
    },

    async insert(item: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> {
      const list = await this.getAll();
      const newSchedule: ScheduleItem = {
        ...item,
        id: 'sch-' + Date.now(),
      };
      const updated = [...list, newSchedule];
      await writeItem(DB_KEYS.SCHEDULES, updated);
      return newSchedule;
    },

    async update(item: ScheduleItem): Promise<ScheduleItem> {
      const list = await this.getAll();
      const updated = list.map((s) => (s.id === item.id ? item : s));
      await writeItem(DB_KEYS.SCHEDULES, updated);
      return item;
    },

    async delete(id: string): Promise<boolean> {
      const list = await this.getAll();
      const updated = list.filter((s) => s.id !== id);
      await writeItem(DB_KEYS.SCHEDULES, updated);
      return true;
    },
  },

  // ---------------------------------------------------------------------------
  // MATERIAL REPOSITORY (MATERI)
  // ---------------------------------------------------------------------------
  materials: {
    async getAll(): Promise<MaterialItem[]> {
      return readItem<MaterialItem[]>(DB_KEYS.MATERIALS, INITIAL_MATERIALS);
    },

    async getById(id: string): Promise<MaterialItem | null> {
      const list = await this.getAll();
      return list.find((m) => m.id === id) || null;
    },

    async insert(item: Omit<MaterialItem, 'id' | 'createdAt'>): Promise<MaterialItem> {
      const list = await this.getAll();
      const newMaterial: MaterialItem = {
        ...item,
        id: 'mat-' + Date.now(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [newMaterial, ...list];
      await writeItem(DB_KEYS.MATERIALS, updated);
      return newMaterial;
    },

    async update(item: MaterialItem): Promise<MaterialItem> {
      const list = await this.getAll();
      const updated = list.map((m) => (m.id === item.id ? item : m));
      await writeItem(DB_KEYS.MATERIALS, updated);
      return item;
    },

    async delete(id: string): Promise<boolean> {
      const list = await this.getAll();
      const updated = list.filter((m) => m.id !== id);
      await writeItem(DB_KEYS.MATERIALS, updated);
      return true;
    },
  },

  // ---------------------------------------------------------------------------
  // NOTE REPOSITORY (CATATAN)
  // ---------------------------------------------------------------------------
  notes: {
    async getAll(): Promise<NoteItem[]> {
      return readItem<NoteItem[]>(DB_KEYS.NOTES, INITIAL_NOTES);
    },

    async getById(id: string): Promise<NoteItem | null> {
      const list = await this.getAll();
      return list.find((n) => n.id === id) || null;
    },

    async insert(item: Omit<NoteItem, 'id' | 'updatedAt'>): Promise<NoteItem> {
      const list = await this.getAll();
      const newNote: NoteItem = {
        ...item,
        id: 'not-' + Date.now(),
        updatedAt: new Date().toISOString().split('T')[0],
      };
      const updated = [newNote, ...list];
      await writeItem(DB_KEYS.NOTES, updated);
      return newNote;
    },

    async update(item: NoteItem): Promise<NoteItem> {
      const list = await this.getAll();
      const updatedItem = { ...item, updatedAt: new Date().toISOString().split('T')[0] };
      const updated = list.map((n) => (n.id === item.id ? updatedItem : n));
      await writeItem(DB_KEYS.NOTES, updated);
      return updatedItem;
    },

    async delete(id: string): Promise<boolean> {
      const list = await this.getAll();
      const updated = list.filter((n) => n.id !== id);
      await writeItem(DB_KEYS.NOTES, updated);
      return true;
    },

    async togglePin(id: string): Promise<NoteItem | null> {
      const list = await this.getAll();
      let modified: NoteItem | null = null;
      const updated = list.map((n) => {
        if (n.id === id) {
          modified = { ...n, pinned: !Boolean(n.pinned) };
          return modified;
        }
        return n;
      });
      await writeItem(DB_KEYS.NOTES, updated);
      return modified;
    },
  },

  // ---------------------------------------------------------------------------
  // REMINDER REPOSITORY (PENGINGAT)
  // ---------------------------------------------------------------------------
  reminders: {
    async getAll(): Promise<ReminderItem[]> {
      return readItem<ReminderItem[]>(DB_KEYS.REMINDERS, INITIAL_REMINDERS);
    },

    async getById(id: string): Promise<ReminderItem | null> {
      const list = await this.getAll();
      return list.find((r) => r.id === id) || null;
    },

    async insert(item: Omit<ReminderItem, 'id'>): Promise<ReminderItem> {
      const list = await this.getAll();
      const newReminder: ReminderItem = {
        ...item,
        id: 'rem-' + Date.now(),
      };
      const updated = [...list, newReminder];
      await writeItem(DB_KEYS.REMINDERS, updated);
      return newReminder;
    },

    async update(item: ReminderItem): Promise<ReminderItem> {
      const list = await this.getAll();
      const updated = list.map((r) => (r.id === item.id ? item : r));
      await writeItem(DB_KEYS.REMINDERS, updated);
      return item;
    },

    async delete(id: string): Promise<boolean> {
      const list = await this.getAll();
      const updated = list.filter((r) => r.id !== id);
      await writeItem(DB_KEYS.REMINDERS, updated);
      return true;
    },

    async toggle(id: string): Promise<ReminderItem | null> {
      const list = await this.getAll();
      let modified: ReminderItem | null = null;
      const updated = list.map((r) => {
        if (r.id === id) {
          modified = { ...r, enabled: !r.enabled };
          return modified;
        }
        return r;
      });
      await writeItem(DB_KEYS.REMINDERS, updated);
      return modified;
    },
  },

  // ---------------------------------------------------------------------------
  // ANNOUNCEMENT REPOSITORY (PENGUMUMAN)
  // ---------------------------------------------------------------------------
  announcements: {
    async getAll(): Promise<AnnouncementItem[]> {
      return readItem<AnnouncementItem[]>(DB_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    },

    async insert(item: Omit<AnnouncementItem, 'id'>): Promise<AnnouncementItem> {
      const list = await this.getAll();
      const newAnc: AnnouncementItem = {
        ...item,
        id: 'anc-' + Date.now(),
      };
      const updated = [newAnc, ...list];
      await writeItem(DB_KEYS.ANNOUNCEMENTS, updated);
      return newAnc;
    },

    async delete(id: string): Promise<boolean> {
      const list = await this.getAll();
      const updated = list.filter((a) => a.id !== id);
      await writeItem(DB_KEYS.ANNOUNCEMENTS, updated);
      return true;
    },
  },

  // ---------------------------------------------------------------------------
  // HABIT REPOSITORY (KEBIASAAN)
  // ---------------------------------------------------------------------------
  habits: {
    async getAll(): Promise<HabitItem[]> {
      return readItem<HabitItem[]>(DB_KEYS.HABITS, INITIAL_HABITS);
    },

    async getById(id: string): Promise<HabitItem | null> {
      const list = await this.getAll();
      return list.find((h) => h.id === id) || null;
    },

    async insert(
      item: Omit<HabitItem, 'id' | 'streak' | 'completedDates'>
    ): Promise<HabitItem> {
      const list = await this.getAll();
      const newHabit: HabitItem = {
        ...item,
        id: 'hab-' + Date.now(),
        streak: 0,
        completedDates: [],
      };
      const updated = [...list, newHabit];
      await writeItem(DB_KEYS.HABITS, updated);
      return newHabit;
    },

    async update(item: HabitItem): Promise<HabitItem> {
      const list = await this.getAll();
      const updated = list.map((h) => (h.id === item.id ? item : h));
      await writeItem(DB_KEYS.HABITS, updated);
      return item;
    },

    async delete(id: string): Promise<boolean> {
      const list = await this.getAll();
      const updated = list.filter((h) => h.id !== id);
      await writeItem(DB_KEYS.HABITS, updated);
      return true;
    },

    async toggleToday(id: string, dateStr?: string): Promise<HabitItem | null> {
      const targetDate = dateStr || new Date().toISOString().split('T')[0];
      const list = await this.getAll();
      let modified: HabitItem | null = null;

      const updated = list.map((h) => {
        if (h.id !== id) return h;
        const isDone = h.completedDates.includes(targetDate);
        let newDates: string[];
        let newStreak = h.streak;

        if (isDone) {
          newDates = h.completedDates.filter((d) => d !== targetDate);
          newStreak = Math.max(0, h.streak - 1);
        } else {
          newDates = [...h.completedDates, targetDate];
          newStreak = h.streak + 1;
        }

        modified = {
          ...h,
          completedDates: newDates,
          streak: newStreak,
        };
        return modified;
      });

      await writeItem(DB_KEYS.HABITS, updated);
      return modified;
    },
  },

  // ---------------------------------------------------------------------------
  // PROFILE REPOSITORY (PROFIL PELAJAR)
  // ---------------------------------------------------------------------------
  profile: {
    async get(): Promise<StudentProfile> {
      const stored = await readItem<StudentProfile>(DB_KEYS.PROFILE, INITIAL_PROFILE);
      return {
        ...INITIAL_PROFILE,
        ...stored,
        character: stored.character || 'calm',
      };
    },

    async update(newProfile: StudentProfile): Promise<StudentProfile> {
      await writeItem(DB_KEYS.PROFILE, newProfile);
      return newProfile;
    },
  },

  // ---------------------------------------------------------------------------
  // DATABASE STATS & SYSTEM DIAGNOSTICS
  // ---------------------------------------------------------------------------
  async getStats(): Promise<DatabaseStats> {
    const [tasks, notes, schedules, materials, habits, reminders, announcements] =
      await Promise.all([
        this.tasks.getAll(),
        this.notes.getAll(),
        this.schedules.getAll(),
        this.materials.getAll(),
        this.habits.getAll(),
        this.reminders.getAll(),
        this.announcements.getAll(),
      ]);

    const totalRecords =
      tasks.length +
      notes.length +
      schedules.length +
      materials.length +
      habits.length +
      reminders.length +
      announcements.length;

    // Approximate size in local storage
    const allDataStr = JSON.stringify({
      tasks,
      notes,
      schedules,
      materials,
      habits,
      reminders,
      announcements,
    });
    const bytes = new Blob ? new Blob([allDataStr]).size : allDataStr.length;
    const approximateSizeKb = (bytes / 1024).toFixed(2);

    return {
      taskCount: tasks.length,
      completedTasks: tasks.filter((t) => t.completed).length,
      noteCount: notes.length,
      scheduleCount: schedules.length,
      materialCount: materials.length,
      habitCount: habits.length,
      reminderCount: reminders.length,
      announcementCount: announcements.length,
      totalRecords,
      approximateSizeKb,
      storageEngine: 'AsyncStorage (Local Phone DB)',
      lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isOfflineOnly: true,
    };
  },

  // ---------------------------------------------------------------------------
  // BACKUP & RESTORE (OFFLINE PHONE BACKUP)
  // ---------------------------------------------------------------------------
  async exportBackup(): Promise<string> {
    const [schedules, tasks, materials, notes, reminders, announcements, habits, profile] =
      await Promise.all([
        this.schedules.getAll(),
        this.tasks.getAll(),
        this.materials.getAll(),
        this.notes.getAll(),
        this.reminders.getAll(),
        this.announcements.getAll(),
        this.habits.getAll(),
        this.profile.get(),
      ]);

    const backupPayload: FullBackupPayload = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      devicePlatform: 'mobile-local-db',
      schedules,
      tasks,
      materials,
      notes,
      reminders,
      announcements,
      habits,
      profile,
    };

    return JSON.stringify(backupPayload, null, 2);
  },

  async importBackup(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString) as Partial<FullBackupPayload>;
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON backup file');
      }

      const writes: Promise<void>[] = [];
      if (Array.isArray(parsed.schedules)) {
        writes.push(writeItem(DB_KEYS.SCHEDULES, parsed.schedules));
      }
      if (Array.isArray(parsed.tasks)) {
        writes.push(writeItem(DB_KEYS.TASKS, parsed.tasks));
      }
      if (Array.isArray(parsed.materials)) {
        writes.push(writeItem(DB_KEYS.MATERIALS, parsed.materials));
      }
      if (Array.isArray(parsed.notes)) {
        writes.push(writeItem(DB_KEYS.NOTES, parsed.notes));
      }
      if (Array.isArray(parsed.reminders)) {
        writes.push(writeItem(DB_KEYS.REMINDERS, parsed.reminders));
      }
      if (Array.isArray(parsed.announcements)) {
        writes.push(writeItem(DB_KEYS.ANNOUNCEMENTS, parsed.announcements));
      }
      if (Array.isArray(parsed.habits)) {
        writes.push(writeItem(DB_KEYS.HABITS, parsed.habits));
      }
      if (parsed.profile && typeof parsed.profile === 'object') {
        writes.push(writeItem(DB_KEYS.PROFILE, parsed.profile as StudentProfile));
      }

      await Promise.all(writes);
      return true;
    } catch (err) {
      console.error('[LocalDB] Failed to restore backup:', err);
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // RESET / CLEAR
  // ---------------------------------------------------------------------------
  async resetToDefaults(): Promise<void> {
    await this.clearAll();
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      writeItem(DB_KEYS.SCHEDULES, []),
      writeItem(DB_KEYS.TASKS, []),
      writeItem(DB_KEYS.MATERIALS, []),
      writeItem(DB_KEYS.NOTES, []),
      writeItem(DB_KEYS.REMINDERS, []),
      writeItem(DB_KEYS.ANNOUNCEMENTS, []),
      writeItem(DB_KEYS.HABITS, []),
      writeItem(DB_KEYS.PROFILE, INITIAL_PROFILE),
      writeItem(DB_KEYS.METADATA, {
        initialized: true,
        version: '3.0.0',
        resetAt: new Date().toISOString(),
      }),
      AsyncStorage.removeItem(DB_KEYS.LEGACY_V1).catch(() => {}),
    ]);
  },
};
