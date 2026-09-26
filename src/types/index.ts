export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';

export type TaskPriority = 'tinggi' | 'sedang' | 'rendah';

export interface ScheduleItem {
  id: string;
  subject: string;
  day: DayOfWeek;
  startTime: string; // e.g. "07:30"
  endTime: string;   // e.g. "09:00"
  room: string;
  teacher: string;
  color: string;
}

export interface TaskItem {
  id: string;
  title: string;
  subject: string;
  deadline: string; // YYYY-MM-DD or readable
  deadlineTime?: string; // HH:mm
  priority: TaskPriority;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface MaterialItem {
  id: string;
  title: string;
  subject: string;
  category: string;
  summary: string;
  content: string;
  links: string[];
  tags: string[];
  createdAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  category: string;
  updatedAt: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  type: 'tugas' | 'jadwal' | 'ujian' | 'kebiasaan' | 'umum';
  time: string; // e.g. "07:00"
  repeat: string; // e.g. "Setiap Hari", "Hari Kerja", "Sekali"
  enabled: boolean;
  notes?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  sender: string;
  date: string;
  content: string;
  isPinned: boolean;
  category: 'akademik' | 'kegiatan' | 'ujian' | 'penting';
}

export interface HabitItem {
  id: string;
  title: string;
  category: string;
  streak: number;
  completedDates: string[]; // ['2026-09-25', ...]
  icon: string;
  targetDaysPerWeek: number;
}

export type CharacterType =
  | 'calm'      // Signature Yellow Calm Face
  | 'smart'     // Periwinkle Smart Face
  | 'cheer'     // Warm Coral Happy Face
  | 'zen'       // Mint Relaxed Smiling Eyes
  | 'focused'   // Lavender Focused Wonder
  | 'eyes'      // Pair of cartoon eyes
  | 'avatar'    // Minimalist student avatar
  | 'happy'     // Joyful laughing face with open mouth & curved eyes (^ ^)
  | 'sad'       // Teary eyes & sad downturned mouth & cold sweat drop
  | 'dizzy';    // Spiral eyes & smooth wavy dazed mouth

export interface StudentProfile {
  name: string;
  school: string;
  major: string;
  grade: string;
  studentId: string;
  currentGPA: number;
  targetGPA: number;
  bio: string;
  character: CharacterType;
}
