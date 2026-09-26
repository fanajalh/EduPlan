import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
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
  LocalDatabase,
  DatabaseStats,
} from '@/services/localDatabase';
import {
  INITIAL_SCHEDULES,
  INITIAL_TASKS,
  INITIAL_MATERIALS,
  INITIAL_NOTES,
  INITIAL_REMINDERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_HABITS,
  INITIAL_PROFILE,
} from '@/services/seedData';

interface AppContextType {
  schedules: ScheduleItem[];
  tasks: TaskItem[];
  materials: MaterialItem[];
  notes: NoteItem[];
  reminders: ReminderItem[];
  announcements: AnnouncementItem[];
  habits: HabitItem[];
  profile: StudentProfile;
  isLoaded: boolean;
  dbStats: DatabaseStats | null;

  // Schedule CRUD
  addSchedule: (item: Omit<ScheduleItem, 'id'>) => Promise<void>;
  updateSchedule: (item: ScheduleItem) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  // Task CRUD
  addTask: (item: Omit<TaskItem, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (item: TaskItem) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompleted: (id: string) => Promise<void>;

  // Material CRUD
  addMaterial: (item: Omit<MaterialItem, 'id' | 'createdAt'>) => Promise<void>;
  updateMaterial: (item: MaterialItem) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;

  // Note CRUD
  addNote: (item: Omit<NoteItem, 'id' | 'updatedAt'>) => Promise<void>;
  updateNote: (item: NoteItem) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;

  // Reminder CRUD
  addReminder: (item: Omit<ReminderItem, 'id'>) => Promise<void>;
  updateReminder: (item: ReminderItem) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;

  // Announcement CRUD
  addAnnouncement: (item: Omit<AnnouncementItem, 'id'>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;

  // Habit CRUD
  addHabit: (item: Omit<HabitItem, 'id' | 'streak' | 'completedDates'>) => Promise<void>;
  updateHabit: (item: HabitItem) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitToday: (id: string) => Promise<void>;

  // Profile
  updateProfile: (profile: StudentProfile) => Promise<void>;
  resetToDemoData: () => Promise<void>;

  // Offline Database & Storage Engine Helpers
  refreshDbStats: () => Promise<DatabaseStats>;
  exportDatabaseBackup: () => Promise<string>;
  importDatabaseBackup: (jsonString: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(INITIAL_SCHEDULES);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [materials, setMaterials] = useState<MaterialItem[]>(INITIAL_MATERIALS);
  const [notes, setNotes] = useState<NoteItem[]>(INITIAL_NOTES);
  const [reminders, setReminders] = useState<ReminderItem[]>(INITIAL_REMINDERS);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(INITIAL_ANNOUNCEMENTS);
  const [habits, setHabits] = useState<HabitItem[]>(INITIAL_HABITS);
  const [profile, setProfile] = useState<StudentProfile>(INITIAL_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);

  const reloadDataFromStorage = useCallback(async () => {
    try {
      const [
        loadedSchedules,
        loadedTasks,
        loadedMaterials,
        loadedNotes,
        loadedReminders,
        loadedAnnouncements,
        loadedHabits,
        loadedProfile,
        stats,
      ] = await Promise.all([
        LocalDatabase.schedules.getAll(),
        LocalDatabase.tasks.getAll(),
        LocalDatabase.materials.getAll(),
        LocalDatabase.notes.getAll(),
        LocalDatabase.reminders.getAll(),
        LocalDatabase.announcements.getAll(),
        LocalDatabase.habits.getAll(),
        LocalDatabase.profile.get(),
        LocalDatabase.getStats(),
      ]);

      setSchedules(loadedSchedules);
      setTasks(loadedTasks);
      setMaterials(loadedMaterials);
      setNotes(loadedNotes);
      setReminders(loadedReminders);
      setAnnouncements(loadedAnnouncements);
      setHabits(loadedHabits);
      setProfile(loadedProfile);
      setDbStats(stats);
    } catch (err) {
      console.error('[AppContext] Error reloading from local phone database:', err);
    }
  }, []);

  // Hydrate all data on mount from the user's phone local storage
  useEffect(() => {
    let isMounted = true;
    const hydrateLocalDb = async () => {
      try {
        await LocalDatabase.init();
        const [
          loadedSchedules,
          loadedTasks,
          loadedMaterials,
          loadedNotes,
          loadedReminders,
          loadedAnnouncements,
          loadedHabits,
          loadedProfile,
          stats,
        ] = await Promise.all([
          LocalDatabase.schedules.getAll(),
          LocalDatabase.tasks.getAll(),
          LocalDatabase.materials.getAll(),
          LocalDatabase.notes.getAll(),
          LocalDatabase.reminders.getAll(),
          LocalDatabase.announcements.getAll(),
          LocalDatabase.habits.getAll(),
          LocalDatabase.profile.get(),
          LocalDatabase.getStats(),
        ]);

        if (isMounted) {
          setSchedules(loadedSchedules);
          setTasks(loadedTasks);
          setMaterials(loadedMaterials);
          setNotes(loadedNotes);
          setReminders(loadedReminders);
          setAnnouncements(loadedAnnouncements);
          setHabits(loadedHabits);
          setProfile(loadedProfile);
          setDbStats(stats);
          setIsLoaded(true);
        }
      } catch (err) {
        console.error('[AppContext] Error hydrating local phone database:', err);
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };

    hydrateLocalDb();

    return () => {
      isMounted = false;
    };
  }, []);

  // Refresh live statistics of local phone storage
  const refreshDbStats = async (): Promise<DatabaseStats> => {
    const stats = await LocalDatabase.getStats();
    setDbStats(stats);
    return stats;
  };

  // ---------------------------------------------------------------------------
  // SCHEDULE CRUD
  // ---------------------------------------------------------------------------
  const addSchedule = async (item: Omit<ScheduleItem, 'id'>) => {
    const created = await LocalDatabase.schedules.insert(item);
    setSchedules((prev) => [...prev, created]);
    refreshDbStats().catch(() => {});
  };

  const updateSchedule = async (item: ScheduleItem) => {
    const updated = await LocalDatabase.schedules.update(item);
    setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    refreshDbStats().catch(() => {});
  };

  const deleteSchedule = async (id: string) => {
    await LocalDatabase.schedules.delete(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    refreshDbStats().catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // TASK CRUD
  // ---------------------------------------------------------------------------
  const addTask = async (item: Omit<TaskItem, 'id' | 'createdAt'>) => {
    const created = await LocalDatabase.tasks.insert(item);
    setTasks((prev) => [created, ...prev]);
    refreshDbStats().catch(() => {});
  };

  const updateTask = async (item: TaskItem) => {
    const updated = await LocalDatabase.tasks.update(item);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    refreshDbStats().catch(() => {});
  };

  const deleteTask = async (id: string) => {
    await LocalDatabase.tasks.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    refreshDbStats().catch(() => {});
  };

  const toggleTaskCompleted = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics optional
    }
    const modified = await LocalDatabase.tasks.toggle(id);
    if (modified) {
      setTasks((prev) => prev.map((t) => (t.id === id ? modified : t)));
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    }
    refreshDbStats().catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // MATERIAL CRUD
  // ---------------------------------------------------------------------------
  const addMaterial = async (item: Omit<MaterialItem, 'id' | 'createdAt'>) => {
    const created = await LocalDatabase.materials.insert(item);
    setMaterials((prev) => [created, ...prev]);
    refreshDbStats().catch(() => {});
  };

  const updateMaterial = async (item: MaterialItem) => {
    const updated = await LocalDatabase.materials.update(item);
    setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    refreshDbStats().catch(() => {});
  };

  const deleteMaterial = async (id: string) => {
    await LocalDatabase.materials.delete(id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    refreshDbStats().catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // NOTE CRUD
  // ---------------------------------------------------------------------------
  const addNote = async (item: Omit<NoteItem, 'id' | 'updatedAt'>) => {
    const created = await LocalDatabase.notes.insert(item);
    setNotes((prev) => [created, ...prev]);
    refreshDbStats().catch(() => {});
  };

  const updateNote = async (item: NoteItem) => {
    const updated = await LocalDatabase.notes.update(item);
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    refreshDbStats().catch(() => {});
  };

  const deleteNote = async (id: string) => {
    await LocalDatabase.notes.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    refreshDbStats().catch(() => {});
  };

  const togglePinNote = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics optional
    }
    const modified = await LocalDatabase.notes.togglePin(id);
    if (modified) {
      setNotes((prev) => prev.map((n) => (n.id === id ? modified : n)));
    } else {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !Boolean(n.pinned) } : n)));
    }
    refreshDbStats().catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // REMINDER CRUD
  // ---------------------------------------------------------------------------
  const addReminder = async (item: Omit<ReminderItem, 'id'>) => {
    const created = await LocalDatabase.reminders.insert(item);
    setReminders((prev) => [...prev, created]);
    refreshDbStats().catch(() => {});
  };

  const updateReminder = async (item: ReminderItem) => {
    const updated = await LocalDatabase.reminders.update(item);
    setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    refreshDbStats().catch(() => {});
  };

  const deleteReminder = async (id: string) => {
    await LocalDatabase.reminders.delete(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    refreshDbStats().catch(() => {});
  };

  const toggleReminder = async (id: string) => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
    const modified = await LocalDatabase.reminders.toggle(id);
    if (modified) {
      setReminders((prev) => prev.map((r) => (r.id === id ? modified : r)));
    } else {
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
      );
    }
    refreshDbStats().catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // ANNOUNCEMENT CRUD
  // ---------------------------------------------------------------------------
  const addAnnouncement = async (item: Omit<AnnouncementItem, 'id'>) => {
    const created = await LocalDatabase.announcements.insert(item);
    setAnnouncements((prev) => [created, ...prev]);
    refreshDbStats().catch(() => {});
  };

  const deleteAnnouncement = async (id: string) => {
    await LocalDatabase.announcements.delete(id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    refreshDbStats().catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // HABIT CRUD
  // ---------------------------------------------------------------------------
  const addHabit = async (item: Omit<HabitItem, 'id' | 'streak' | 'completedDates'>) => {
    const created = await LocalDatabase.habits.insert(item);
    setHabits((prev) => [...prev, created]);
    refreshDbStats().catch(() => {});
  };

  const updateHabit = async (item: HabitItem) => {
    const updated = await LocalDatabase.habits.update(item);
    setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    refreshDbStats().catch(() => {});
  };

  const deleteHabit = async (id: string) => {
    await LocalDatabase.habits.delete(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    refreshDbStats().catch(() => {});
  };

  const toggleHabitToday = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics optional
    }
    const modified = await LocalDatabase.habits.toggleToday(id);
    if (modified) {
      setHabits((prev) => prev.map((h) => (h.id === id ? modified : h)));
    }
    refreshDbStats().catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // PROFILE REPOSITORY
  // ---------------------------------------------------------------------------
  const updateProfile = async (newProfile: StudentProfile) => {
    const updated = await LocalDatabase.profile.update(newProfile);
    setProfile(updated);
    refreshDbStats().catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // RESET / BACKUP / RESTORE
  // ---------------------------------------------------------------------------
  const resetToDemoData = async () => {
    await LocalDatabase.resetToDefaults();
    await reloadDataFromStorage();
  };

  const exportDatabaseBackup = async (): Promise<string> => {
    return LocalDatabase.exportBackup();
  };

  const importDatabaseBackup = async (jsonString: string): Promise<boolean> => {
    const success = await LocalDatabase.importBackup(jsonString);
    if (success) {
      await reloadDataFromStorage();
    }
    return success;
  };

  return (
    <AppContext.Provider
      value={{
        schedules,
        tasks,
        materials,
        notes,
        reminders,
        announcements,
        habits,
        profile,
        isLoaded,
        dbStats,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompleted,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        addNote,
        updateNote,
        deleteNote,
        togglePinNote,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleReminder,
        addAnnouncement,
        deleteAnnouncement,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitToday,
        updateProfile,
        resetToDemoData,
        refreshDbStats,
        exportDatabaseBackup,
        importDatabaseBackup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
