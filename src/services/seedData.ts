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

export const INITIAL_SCHEDULES: ScheduleItem[] = [];

export const INITIAL_TASKS: TaskItem[] = [];

export const INITIAL_MATERIALS: MaterialItem[] = [];

export const INITIAL_NOTES: NoteItem[] = [];

export const INITIAL_REMINDERS: ReminderItem[] = [];

export const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [];

export const INITIAL_HABITS: HabitItem[] = [];

export const INITIAL_PROFILE: StudentProfile = {
  name: '',
  school: '',
  major: '',
  grade: '',
  studentId: '',
  currentGPA: 0,
  targetGPA: 0,
  bio: '',
  character: 'calm',
};
