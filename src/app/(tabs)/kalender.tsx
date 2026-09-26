import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { Colors, Fonts } from '@/constants/theme';
import { CuteCharacter } from '@/components/CuteCharacter';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { InfoFeedbackModal, FeedbackType } from '@/components/InfoFeedbackModal';
import { DayOfWeek, TaskPriority } from '@/types';
import { syncAllToPhoneCalendar, syncSingleItemToPhoneCalendar } from '@/services/calendarSync';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Vibrant cheerful Periwinkle theme matching EduPlaner aesthetic (bright, not dark)
const CALENDAR_THEME = '#5274F5';
const AMBER_ACCENT = '#FDCB44';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_FULL_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

interface TimelineItem {
  id: string;
  type: 'schedule' | 'task' | 'reminder';
  title: string;
  subtitle?: string;
  timeRange: string;
  status: 'done' | 'in_progress' | 'upcoming';
  badgeLabel: string;
  badgeBg: string;
  badgeTextColor: string;
  indicatorBg: string;
  indicatorBorder: string;
  dotColor: string;
  originalId: string;
  room?: string;
  teacher?: string;
  priority?: string;
  notes?: string;
  completed?: boolean;
}

export default function KalenderScreen() {
  const router = useRouter();
  const {
    schedules,
    tasks,
    reminders,
    profile,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompleted,
    addReminder,
    updateReminder,
    deleteReminder,
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Detail Modal State
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [deletingTimelineItem, setDeletingTimelineItem] = useState<TimelineItem | null>(null);

  // Add / Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'schedule' | 'task' | 'reminder'>('schedule');

  // Agenda Form Fields
  const [agendaType, setAgendaType] = useState<'schedule' | 'task' | 'reminder'>('schedule');
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaSubject, setAgendaSubject] = useState('');
  const [agendaStartTime, setAgendaStartTime] = useState('08:00');
  const [agendaEndTime, setAgendaEndTime] = useState('09:30');
  const [agendaRoom, setAgendaRoom] = useState('');
  const [agendaTeacher, setAgendaTeacher] = useState('');
  const [agendaPriority, setAgendaPriority] = useState<TaskPriority>('sedang');
  const [agendaNotes, setAgendaNotes] = useState('');

  // Calendar HP Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToPhoneCalendar, setSyncToPhoneCalendar] = useState(true);

  // Custom Feedback Modal State (Replacing default native Alert)
  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: FeedbackType;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      today.getDate() === d.getDate() &&
      today.getMonth() === d.getMonth() &&
      today.getFullYear() === d.getFullYear()
    );
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const formatYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Generate 7-column calendar cells mathematically aligned
  const calendarCells = useMemo(() => {
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Day of week of 1st day of month (0 = Sun, 1 = Mon ... 6 = Sat)
    const firstDayRaw = new Date(year, month, 1).getDay();
    // Shift so Monday is 0, Sunday is 6
    const startOffset = (firstDayRaw + 6) % 7;

    const cells: {
      day: number;
      isCurrentMonth: boolean;
      date: Date;
      hasEvent: boolean;
    }[] = [];


    // 1. Previous month trailing days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const cellDate = new Date(year, month - 1, d);
      cells.push({
        day: d,
        isCurrentMonth: false,
        date: cellDate,
        hasEvent: false,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const cellDate = new Date(year, month, d);
      const ymd = formatYMD(cellDate);

      // Only show event dot on dates with active task deadlines or exams
      const hasTaskDeadline = tasks.some((t) => t.deadline === ymd && !t.completed);
      cells.push({
        day: d,
        isCurrentMonth: true,
        date: cellDate,
        hasEvent: hasTaskDeadline,
      });
    }

    // 3. Next month leading days to complete full weeks
    const totalCells = cells.length <= 35 ? 35 : 42;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const cellDate = new Date(year, month + 1, d);
      cells.push({
        day: d,
        isCurrentMonth: false,
        date: cellDate,
        hasEvent: false,
      });
    }

    return cells;
  }, [year, month, tasks]);

  // Selected Day's Column Index (0 = Monday, ..., 6 = Sunday)
  const selectedDayColIndex = (selectedDate.getDay() + 6) % 7;

  // Selected Day's Timeline Agenda Items
  const selectedYMD = formatYMD(selectedDate);
  const selectedDayName = DAY_FULL_INDO[selectedDate.getDay()];

  const timelineItems: TimelineItem[] = useMemo(() => {
    const list: TimelineItem[] = [];

    // 1. Classes on this day (schedules)
    const dayClasses = schedules.filter((s) => s.day === selectedDayName);
    dayClasses.forEach((c) => {
      list.push({
        id: `sch-${c.id}`,
        type: 'schedule',
        title: c.subject,
        timeRange: `${c.startTime} - ${c.endTime} • Ruang ${c.room}`,
        status: 'in_progress',
        badgeLabel: 'In Progress',
        badgeBg: '#EDE9FE',
        badgeTextColor: '#7C3AED',
        indicatorBg: '#FFFFFF',
        indicatorBorder: '#7C3AED',
        dotColor: '#7C3AED',
        originalId: c.id,
        room: c.room,
        teacher: c.teacher,
      });
    });

    // 2. Tasks with deadline on this day
    const dayTasks = tasks.filter((t) => t.deadline === selectedYMD);
    dayTasks.forEach((t) => {
      const isDone = t.completed;
      list.push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        timeRange: `${t.deadlineTime || '23:59'} • ${t.subject}`,
        status: isDone ? 'done' : 'upcoming',
        badgeLabel: isDone ? 'Done' : 'Pending',
        badgeBg: isDone ? '#DCFCE7' : '#FEF3C7',
        badgeTextColor: isDone ? '#15803D' : '#D97706',
        indicatorBg: isDone ? '#10B981' : '#FFFFFF',
        indicatorBorder: isDone ? '#10B981' : '#CBD5E1',
        dotColor: isDone ? '#FFFFFF' : '#94A3B8',
        originalId: t.id,
        priority: t.priority,
        notes: t.notes,
        completed: isDone,
      });
    });

    return list;
  }, [schedules, tasks, selectedDayName, selectedYMD]);

  // Open Add Modal
  const openAddModal = () => {
    Haptics.selectionAsync().catch(() => {});
    setIsEditing(false);
    setEditingItemId(null);
    setEditingType('schedule');
    setAgendaType('schedule');
    setAgendaTitle('');
    setAgendaSubject('');
    setAgendaStartTime('08:00');
    setAgendaEndTime('09:30');
    setAgendaRoom('');
    setAgendaTeacher('');
    setAgendaPriority('sedang');
    setAgendaNotes('');
    setModalVisible(true);
  };

  // Open Edit Modal
  const openEditModal = (item: TimelineItem) => {
    Haptics.selectionAsync().catch(() => {});
    setDetailModalVisible(false);
    setIsEditing(true);
    setEditingItemId(item.originalId);
    setEditingType(item.type);
    setAgendaType(item.type);

    if (item.type === 'schedule') {
      const s = schedules.find((sch) => sch.id === item.originalId);
      setAgendaTitle(s?.subject || item.title);
      setAgendaSubject(s?.subject || item.title);
      setAgendaStartTime(s?.startTime || '08:00');
      setAgendaEndTime(s?.endTime || '09:30');
      setAgendaRoom(s?.room || '');
      setAgendaTeacher(s?.teacher || '');
      setAgendaNotes('');
    } else if (item.type === 'task') {
      const t = tasks.find((tsk) => tsk.id === item.originalId);
      setAgendaTitle(t?.title || item.title);
      setAgendaSubject(t?.subject || '');
      setAgendaStartTime(t?.deadlineTime || '23:59');
      setAgendaPriority(t?.priority || 'sedang');
      setAgendaNotes(t?.notes || '');
    } else if (item.type === 'reminder') {
      const r = (reminders || []).find((rem) => rem.id === item.originalId);
      setAgendaTitle(r?.title || item.title);
      setAgendaStartTime(r?.time || '08:00');
      setAgendaNotes(r?.notes || '');
    }

    setSyncToPhoneCalendar(true);
    setModalVisible(true);
  };

  // Open Item Detail
  const openItemDetail = (item: TimelineItem) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  // Execute Delete
  const executeDelete = async (type: string, id: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      if (type === 'schedule') {
        await deleteSchedule(id);
      } else if (type === 'task') {
        await deleteTask(id);
      } else if (type === 'reminder') {
        await deleteReminder(id);
      }
      setDetailModalVisible(false);
      if (Platform.OS !== 'web') {
        Alert.alert('Sukses', 'Agenda berhasil dihapus.');
      }
    } catch {
      Alert.alert('Error', 'Gagal menghapus agenda.');
    }
  };

  // Confirm Delete Handler
  const confirmDelete = (item: TimelineItem) => {
    setDeletingTimelineItem(item);
  };

  const handleConfirmDeleteTimeline = async () => {
    if (!deletingTimelineItem) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics optional
    }
    const item = deletingTimelineItem;
    setDeletingTimelineItem(null);
    await executeDelete(item.type, item.originalId);
  };

  // Bulk sync all schedules and tasks to phone calendar
  const handleSyncAllAgendas = async () => {
    try {
      setIsSyncing(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const result = await syncAllToPhoneCalendar(schedules, tasks, reminders);
      setIsSyncing(false);

      if (result.success) {
        setFeedbackModal({
          visible: true,
          title: 'Sukses Sinkronisasi',
          message: result.message,
          type: 'success',
        });
      } else {
        setFeedbackModal({
          visible: true,
          title: 'Sinkronisasi Kalender',
          message: result.message,
          type: 'info',
        });
      }
    } catch {
      setIsSyncing(false);
      setFeedbackModal({
        visible: true,
        title: 'Gagal Sinkronisasi',
        message: 'Terjadi kesalahan saat menyinkronkan agenda ke kalender HP.',
        type: 'error',
      });
    }
  };

  // Sync single agenda item to phone calendar
  const handleSyncSingleAgenda = async (item: TimelineItem | null) => {
    if (!item) return;
    try {
      setIsSyncing(true);
      Haptics.selectionAsync().catch(() => {});

      const times = item.timeRange.split('-');
      const result = await syncSingleItemToPhoneCalendar({
        title: item.title,
        type: item.type,
        subtitle: item.subtitle,
        day: selectedDayName as DayOfWeek,
        startTime: times[0]?.trim() || '08:00',
        endTime: times[1]?.trim() || '09:30',
        location: item.room,
        notes: item.notes,
      });
      setIsSyncing(false);

      if (result.success) {
        setFeedbackModal({
          visible: true,
          title: 'Sukses Sinkronisasi',
          message: result.message,
          type: 'success',
        });
      } else {
        setFeedbackModal({
          visible: true,
          title: 'Sinkronisasi Kalender',
          message: result.message,
          type: 'info',
        });
      }
    } catch {
      setIsSyncing(false);
      setFeedbackModal({
        visible: true,
        title: 'Gagal Sinkronisasi',
        message: 'Gagal menyinkronkan agenda ini ke kalender HP.',
        type: 'error',
      });
    }
  };

  // Save new or edited Agenda handler
  const handleSaveAgenda = async () => {
    if (!agendaTitle.trim()) {
      setFeedbackModal({
        visible: true,
        title: 'Perhatian',
        message: 'Judul agenda wajib diisi!',
        type: 'warning',
      });
      return;
    }

    try {
      if (isEditing && editingItemId) {
        if (editingType === 'schedule') {
          const orig = schedules.find((s) => s.id === editingItemId);
          if (orig) {
            await updateSchedule({
              ...orig,
              subject: agendaTitle.trim(),
              startTime: agendaStartTime.trim() || '08:00',
              endTime: agendaEndTime.trim() || '09:30',
              room: agendaRoom.trim() || 'Ruang Kuliah',
              teacher: agendaTeacher.trim() || 'Dosen Pengampu',
            });
          }
        } else if (editingType === 'task') {
          const orig = tasks.find((t) => t.id === editingItemId);
          if (orig) {
            await updateTask({
              ...orig,
              title: agendaTitle.trim(),
              subject: agendaSubject.trim() || 'Tugas Umum',
              deadline: selectedYMD,
              deadlineTime: agendaStartTime.trim() || '23:59',
              priority: agendaPriority,
              notes: agendaNotes.trim(),
            });
          }
        } else if (editingType === 'reminder') {
          const orig = (reminders || []).find((r) => r.id === editingItemId);
          if (orig) {
            await updateReminder({
              ...orig,
              title: agendaTitle.trim(),
              time: agendaStartTime.trim() || '08:00',
              notes: agendaNotes.trim(),
            });
          }
        }

        // If sync to phone calendar is enabled
        if (syncToPhoneCalendar) {
          syncSingleItemToPhoneCalendar({
            title: agendaTitle.trim(),
            type: editingType,
            subtitle: editingType === 'schedule' ? agendaTeacher : agendaSubject,
            day: selectedDayName as DayOfWeek,
            startTime: agendaStartTime.trim() || '08:00',
            endTime: agendaEndTime.trim() || '09:30',
            location: agendaRoom.trim(),
            notes: agendaNotes.trim(),
          }).catch((err) => console.warn('[CalendarSync] Single edit sync error:', err));
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setModalVisible(false);
        setFeedbackModal({
          visible: true,
          title: 'Berhasil Disimpan',
          message: 'Perubahan agenda berhasil disimpan.',
          type: 'success',
        });
      } else {
        // Create New
        if (agendaType === 'schedule') {
          await addSchedule({
            subject: agendaTitle.trim(),
            day: selectedDayName as DayOfWeek,
            startTime: agendaStartTime.trim() || '08:00',
            endTime: agendaEndTime.trim() || '09:30',
            room: agendaRoom.trim() || 'Ruang Kuliah',
            teacher: agendaTeacher.trim() || 'Dosen Pengampu',
            color: '#7C3AED',
          });
        } else if (agendaType === 'task') {
          await addTask({
            title: agendaTitle.trim(),
            subject: agendaSubject.trim() || 'Tugas Umum',
            deadline: selectedYMD,
            deadlineTime: agendaStartTime.trim() || '23:59',
            priority: agendaPriority,
            completed: false,
            notes: agendaNotes.trim(),
          });
        } else if (agendaType === 'reminder') {
          await addReminder({
            title: agendaTitle.trim(),
            time: agendaStartTime.trim() || '08:00',
            repeat: selectedDayName,
            enabled: true,
            type: 'umum',
            notes: agendaNotes.trim(),
          });
        }

        // If sync to phone calendar is enabled
        if (syncToPhoneCalendar) {
          syncSingleItemToPhoneCalendar({
            title: agendaTitle.trim(),
            type: agendaType,
            subtitle: agendaType === 'schedule' ? agendaTeacher : agendaSubject,
            day: selectedDayName as DayOfWeek,
            startTime: agendaStartTime.trim() || '08:00',
            endTime: agendaEndTime.trim() || '09:30',
            location: agendaRoom.trim(),
            notes: agendaNotes.trim(),
          }).catch((err) => console.log('[CalendarSync] Single create sync error:', err));
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setModalVisible(false);
        setFeedbackModal({
          visible: true,
          title: 'Agenda Ditambahkan',
          message: 'Agenda baru berhasil ditambahkan ke jadwal Anda.',
          type: 'success',
        });
      }
    } catch {
      setFeedbackModal({
        visible: true,
        title: 'Gagal Menyimpan',
        message: 'Gagal menyimpan agenda. Silakan coba lagi.',
        type: 'error',
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Indigo / Violet Calendar Section */}
        <View style={styles.topCalendarSection}>
          {/* Top Bar (Hamburger Menu & Avatar Squircle) */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => router.push('/(tabs)/menu')}
              activeOpacity={0.7}
            >
              <View style={styles.menuBar} />
              <View style={[styles.menuBar, { width: 14 }]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarSquircle}
              onPress={() => router.push('/profil')}
              activeOpacity={0.8}
            >
              <CuteCharacter type={profile?.character || 'avatar'} size={28} />
            </TouchableOpacity>
          </View>

          {/* Month & Year Title with Chevrons */}
          <View style={styles.monthHeaderRow}>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[month]} {year}
            </Text>
            <View style={styles.monthNavActions}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Day of Week Headers (7 equal columns: 14.285% each) */}
          <View style={styles.daysHeaderRow}>
            {DAY_HEADERS.map((day, idx) => {
              const isActiveDay = idx === selectedDayColIndex;
              return (
                <View key={`${day}-${idx}`} style={styles.dayHeaderCell}>
                  <Text style={[styles.dayHeaderText, isActiveDay && styles.dayHeaderTextActive]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Calendar Grid (7 equal columns: 14.285% each - ENLARGED) */}
          <View style={styles.calendarGrid}>
            {calendarCells.map((cell, idx) => {
              const selected = isSameDay(cell.date, selectedDate);
              const today = isToday(cell.date);
              return (
                <TouchableOpacity
                  key={`cell-${idx}`}
                  style={styles.calendarCell}
                  onPress={() => setSelectedDate(cell.date)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.dateNumberCircle,
                      today && !selected && styles.dateNumberCircleToday,
                      selected && styles.dateNumberCircleSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateNumberText,
                        !cell.isCurrentMonth && styles.dateNumberTextMuted,
                        selected && styles.dateNumberTextSelected,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </View>
                  {cell.hasEvent && !selected && <View style={styles.eventDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Subtle Bottom Dash Indicator */}
          <View style={styles.bottomDashIndicator} />
        </View>

        {/* Bottom White Card Section ("Today" / Agenda Timeline with PROMINENT ROUNDED CORNERS) */}
        <View style={styles.bottomWhiteCard}>
          {/* Section Header with Sync ke HP button */}
          <View style={styles.agendaHeaderRow}>
            <View style={styles.agendaHeaderLeft}>
              <Text style={styles.agendaTitle}>
                {isToday(selectedDate) ? 'Today' : `${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()]}`}
              </Text>
              <Text style={styles.agendaSubtitle}>
                {timelineItems.length} agenda terjadwal
              </Text>
            </View>

            <TouchableOpacity
              style={styles.syncHeaderBtn}
              onPress={handleSyncAllAgendas}
              activeOpacity={0.8}
              disabled={isSyncing}
            >
              <Ionicons
                name={isSyncing ? 'sync' : 'phone-portrait-outline'}
                size={14}
                color={CALENDAR_THEME}
              />
              <Text style={styles.syncHeaderBtnText}>
                {isSyncing ? 'Syncing...' : 'Sync ke HP'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Vertical Timeline Items List */}
          {timelineItems.length === 0 ? (
            <View style={styles.emptyAgendaContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="calendar-outline" size={30} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Tidak ada agenda pada hari ini</Text>
              <Text style={styles.emptySub}>
                Belum ada jadwal kelas, tugas, atau acara untuk tanggal ini.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={openAddModal}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Tambah Agenda</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timelineList}>
              {timelineItems.map((item, index) => {
                const isLast = index === timelineItems.length - 1;
                return (
                  <View key={item.id} style={styles.timelineRow}>
                    {/* Left Column: Timeline Indicator Dot & Dashed Line */}
                    <View style={styles.timelineIndicatorCol}>
                      <TouchableOpacity
                        style={[
                          styles.timelineDotCircle,
                          {
                            backgroundColor: item.indicatorBg,
                            borderColor: item.indicatorBorder,
                          },
                        ]}
                        onPress={() => {
                          if (item.type === 'task') {
                            Haptics.selectionAsync().catch(() => {});
                            toggleTaskCompleted(item.originalId);
                          } else {
                            openItemDetail(item);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        {item.status === 'done' ? (
                          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                        ) : item.status === 'in_progress' ? (
                          <View style={[styles.timelineDotInner, { backgroundColor: item.dotColor }]} />
                        ) : null}
                      </TouchableOpacity>

                      {!isLast && (
                        <View style={styles.timelineDashedLineContainer}>
                          <View style={styles.timelineDashedLine} />
                        </View>
                      )}
                    </View>

                    {/* Content Column */}
                    <TouchableOpacity
                      style={styles.timelineContentCol}
                      onPress={() => openItemDetail(item)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.timelineItemTitle,
                          item.status === 'done' && styles.timelineItemTitleDone,
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.timelineItemTime}>{item.timeRange}</Text>
                    </TouchableOpacity>

                    {/* Minimalist Chevron Arrow */}
                    <TouchableOpacity
                      style={styles.chevronBtn}
                      onPress={() => openItemDetail(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (+) */}
      <TouchableOpacity
        style={styles.fabBtn}
        onPress={openAddModal}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 1. Detail Agenda Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDetailModalVisible(false)}
          />
          <View style={styles.detailModalContent}>
            <View style={styles.sheetHandle} />

            {selectedItem && (
              <>
                <View style={styles.detailHeaderRow}>
                  <View style={[styles.detailTypeBadge, { backgroundColor: selectedItem.badgeBg }]}>
                    <Text style={[styles.detailTypeBadgeText, { color: selectedItem.badgeTextColor }]}>
                      {selectedItem.type === 'schedule'
                        ? 'Jadwal Kuliah / Pelajaran'
                        : selectedItem.type === 'task'
                        ? 'Tugas & Deadline'
                        : 'Pengingat & Acara'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setDetailModalVisible(false)}
                    style={styles.modalCloseBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.detailTitle}>{selectedItem.title}</Text>

                <View style={styles.detailMetaCard}>
                  <View style={styles.detailMetaRow}>
                    <Ionicons name="time-outline" size={18} color="#64748B" />
                    <Text style={styles.detailMetaText}>{selectedItem.timeRange}</Text>
                  </View>

                  {selectedItem.room && (
                    <View style={styles.detailMetaRow}>
                      <Ionicons name="location-outline" size={18} color="#64748B" />
                      <Text style={styles.detailMetaText}>Ruang: {selectedItem.room}</Text>
                    </View>
                  )}

                  {selectedItem.teacher && (
                    <View style={styles.detailMetaRow}>
                      <Ionicons name="person-outline" size={18} color="#64748B" />
                      <Text style={styles.detailMetaText}>Pengajar: {selectedItem.teacher}</Text>
                    </View>
                  )}

                  {selectedItem.priority && (
                    <View style={styles.detailMetaRow}>
                      <Ionicons name="flag-outline" size={18} color="#64748B" />
                      <Text style={styles.detailMetaText}>
                        Prioritas: {selectedItem.priority.toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {selectedItem.notes && (
                    <View style={styles.detailMetaRow}>
                      <Ionicons name="document-text-outline" size={18} color="#64748B" />
                      <Text style={styles.detailMetaText}>{selectedItem.notes}</Text>
                    </View>
                  )}
                </View>

                {/* Task completion toggle */}
                {selectedItem.type === 'task' && (
                  <TouchableOpacity
                    style={[
                      styles.toggleTaskBtn,
                      selectedItem.completed ? styles.toggleTaskBtnDone : styles.toggleTaskBtnPending,
                    ]}
                    onPress={async () => {
                      Haptics.selectionAsync().catch(() => {});
                      await toggleTaskCompleted(selectedItem.originalId);
                      setDetailModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={selectedItem.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={selectedItem.completed ? '#15803D' : '#475569'}
                    />
                    <Text
                      style={[
                        styles.toggleTaskText,
                        selectedItem.completed ? styles.toggleTaskTextDone : styles.toggleTaskTextPending,
                      ]}
                    >
                      {selectedItem.completed ? 'Sudah Selesai (Klik untuk Batal)' : 'Tandai Selesai'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Sync Single Agenda to Device Calendar */}
                <TouchableOpacity
                  style={styles.syncSingleActionBtn}
                  onPress={() => handleSyncSingleAgenda(selectedItem)}
                  activeOpacity={0.85}
                  disabled={isSyncing}
                >
                  <Ionicons name="calendar-outline" size={17} color={CALENDAR_THEME} />
                  <Text style={styles.syncSingleActionBtnText}>
                    {isSyncing ? 'Menyinkronkan...' : 'Sync Agenda Ini ke Kalender HP'}
                  </Text>
                </TouchableOpacity>

                {/* Actions: Edit and Delete */}
                <View style={styles.detailActionsRow}>
                  <TouchableOpacity
                    style={styles.editActionBtn}
                    onPress={() => openEditModal(selectedItem)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.editActionBtnText}>Edit Agenda</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteActionBtn}
                    onPress={() => confirmDelete(selectedItem)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteActionBtnText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 2. Add / Edit Agenda Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Agenda' : 'Tambah Agenda Baru'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
              {/* Date Banner */}
              <View style={styles.dateBanner}>
                <Ionicons name="calendar" size={18} color={CALENDAR_THEME} />
                <Text style={styles.dateBannerText}>
                  {selectedDayName}, {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </Text>
              </View>

              {/* Type Selector (Only when adding new) */}
              {!isEditing && (
                <View style={styles.typeTabRow}>
                  <TouchableOpacity
                    style={[styles.typeTabBtn, agendaType === 'schedule' && styles.typeTabBtnActive]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setAgendaType('schedule');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="school-outline"
                      size={16}
                      color={agendaType === 'schedule' ? '#FFFFFF' : '#64748B'}
                    />
                    <Text style={[styles.typeTabText, agendaType === 'schedule' && styles.typeTabTextActive]}>
                      Jadwal
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeTabBtn, agendaType === 'task' && styles.typeTabBtnActive]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setAgendaType('task');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="checkbox-outline"
                      size={16}
                      color={agendaType === 'task' ? '#FFFFFF' : '#64748B'}
                    />
                    <Text style={[styles.typeTabText, agendaType === 'task' && styles.typeTabTextActive]}>
                      Tugas
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeTabBtn, agendaType === 'reminder' && styles.typeTabBtnActive]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setAgendaType('reminder');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="alarm-outline"
                      size={16}
                      color={agendaType === 'reminder' ? '#FFFFFF' : '#64748B'}
                    />
                    <Text style={[styles.typeTabText, agendaType === 'reminder' && styles.typeTabTextActive]}>
                      Pengingat
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Title Input */}
              <Text style={styles.modalFieldLabel}>
                {agendaType === 'schedule'
                  ? 'Mata Kuliah / Pelajaran *'
                  : agendaType === 'task'
                  ? 'Judul Tugas *'
                  : 'Nama Agenda / Acara *'}
              </Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder={
                  agendaType === 'schedule'
                    ? 'Contoh: Matematika Peminatan'
                    : agendaType === 'task'
                    ? 'Contoh: Laporan Praktikum'
                    : 'Contoh: Rapat Kelompok'
                }
                placeholderTextColor="#94A3B8"
                value={agendaTitle}
                onChangeText={setAgendaTitle}
              />

              {/* Schedule Specific Fields */}
              {agendaType === 'schedule' && (
                <>
                  <View style={styles.timeInputsRow}>
                    <View style={styles.timeInputCol}>
                      <Text style={styles.modalFieldLabel}>Jam Mulai</Text>
                      <TextInput
                        style={styles.modalTextInput}
                        placeholder="08:00"
                        placeholderTextColor="#94A3B8"
                        value={agendaStartTime}
                        onChangeText={setAgendaStartTime}
                      />
                    </View>
                    <View style={styles.timeInputCol}>
                      <Text style={styles.modalFieldLabel}>Jam Selesai</Text>
                      <TextInput
                        style={styles.modalTextInput}
                        placeholder="10:30"
                        placeholderTextColor="#94A3B8"
                        value={agendaEndTime}
                        onChangeText={setAgendaEndTime}
                      />
                    </View>
                  </View>

                  <Text style={[styles.modalFieldLabel, { marginTop: 14 }]}>Ruang Kelas</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Contoh: Lab Komputer 2 / R.301"
                    placeholderTextColor="#94A3B8"
                    value={agendaRoom}
                    onChangeText={setAgendaRoom}
                  />

                  <Text style={[styles.modalFieldLabel, { marginTop: 14 }]}>Dosen / Pengajar</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Contoh: Dr. Sri Wahyuni, M.Si"
                    placeholderTextColor="#94A3B8"
                    value={agendaTeacher}
                    onChangeText={setAgendaTeacher}
                  />
                </>
              )}

              {/* Task Specific Fields */}
              {agendaType === 'task' && (
                <>
                  <Text style={[styles.modalFieldLabel, { marginTop: 14 }]}>Mata Pelajaran</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Contoh: Fisika, Matematika"
                    placeholderTextColor="#94A3B8"
                    value={agendaSubject}
                    onChangeText={setAgendaSubject}
                  />

                  <Text style={[styles.modalFieldLabel, { marginTop: 14 }]}>Jam Deadline</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="23:59"
                    placeholderTextColor="#94A3B8"
                    value={agendaStartTime}
                    onChangeText={setAgendaStartTime}
                  />

                  <Text style={[styles.modalFieldLabel, { marginTop: 14 }]}>Prioritas</Text>
                  <View style={styles.priorityPillsRow}>
                    {(['rendah', 'sedang', 'tinggi'] as TaskPriority[]).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.priorityPill, agendaPriority === p && styles.priorityPillActive]}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setAgendaPriority(p);
                        }}
                      >
                        <Text
                          style={[
                            styles.priorityPillText,
                            agendaPriority === p && styles.priorityPillTextActive,
                          ]}
                        >
                          {p.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.modalFieldLabel, { marginTop: 14 }]}>Catatan Tambahan</Text>
                  <TextInput
                    style={[styles.modalTextInput, styles.modalTextArea]}
                    placeholder="Keterangan tugas, instruksi, link..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    value={agendaNotes}
                    onChangeText={setAgendaNotes}
                  />
                </>
              )}

              {/* Reminder Specific Fields */}
              {agendaType === 'reminder' && (
                <>
                  <Text style={[styles.modalFieldLabel, { marginTop: 14 }]}>Waktu Pengingat</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="08:00"
                    placeholderTextColor="#94A3B8"
                    value={agendaStartTime}
                    onChangeText={setAgendaStartTime}
                  />

                  <Text style={[styles.modalFieldLabel, { marginTop: 14 }]}>Keterangan Pengingat</Text>
                  <TextInput
                    style={[styles.modalTextInput, styles.modalTextArea]}
                    placeholder="Catatan pengingat agenda..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    value={agendaNotes}
                    onChangeText={setAgendaNotes}
                  />
                </>
              )}

              {/* Sync to Phone Calendar Toggle */}
              <TouchableOpacity
                style={styles.syncCheckboxRow}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSyncToPhoneCalendar(!syncToPhoneCalendar);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.syncCheckbox, syncToPhoneCalendar && styles.syncCheckboxChecked]}>
                  {syncToPhoneCalendar && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <View style={styles.syncCheckboxTextCol}>
                  <Text style={styles.syncCheckboxLabel}>Sync juga ke Kalender HP</Text>
                  <Text style={styles.syncCheckboxSub}>
                    Otomatis tambahkan agenda ini ke kalender Google / Apple ponsel
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveAgenda}
                activeOpacity={0.88}
              >
                <Text style={styles.saveBtnText}>
                  {isEditing ? 'Simpan Perubahan' : 'Simpan Agenda'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmDeleteModal
        visible={Boolean(deletingTimelineItem)}
        title="Hapus Agenda?"
        itemName={deletingTimelineItem?.title}
        onConfirm={handleConfirmDeleteTimeline}
        onCancel={() => setDeletingTimelineItem(null)}
      />

      <InfoFeedbackModal
        visible={feedbackModal.visible}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        buttonColor={CALENDAR_THEME}
        onClose={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CALENDAR_THEME,
  },
  container: {
    flex: 1,
    backgroundColor: CALENDAR_THEME, // Keeps purple behind the rounded top corners of bottomWhiteCard
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: CALENDAR_THEME,
  },

  // 1. Top Indigo/Violet Calendar Section
  topCalendarSection: {
    backgroundColor: CALENDAR_THEME,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  menuBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    gap: 5,
  },
  menuBar: {
    width: 22,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  avatarSquircle: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Month Title Row
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  monthTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  monthNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Day Headers (14.285% each for pixel-perfect 7-column grid)
  daysHeaderRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 14,
  },
  dayHeaderCell: {
    width: '14.285%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  dayHeaderTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.extraBold,
    fontSize: 15,
  },

  // Calendar Grid (14.285% each - ENLARGED)
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    rowGap: 6,
  },
  calendarCell: {
    width: '14.285%',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumberCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumberCircleSelected: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    borderWidth: 0,
  },
  dateNumberCircleToday: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 19,
  },
  dateNumberText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlign: 'center',
  },
  dateNumberTextMuted: {
    color: 'rgba(255, 255, 255, 0.32)',
    fontSize: 14,
  },
  dateNumberTextSelected: {
    color: '#0F172A', // High-contrast bold dark slate on pure white circle - 100% visible
    fontFamily: Fonts.extraBold,
    fontSize: 16,
    includeFontPadding: false,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AMBER_ACCENT,
    position: 'absolute',
    bottom: 2,
  },
  bottomDashIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    alignSelf: 'center',
    marginTop: 18,
    marginBottom: 6,
  },

  // 2. Bottom White Card Section (PROMINENT ROUNDED TOP CORNERS: Sudut Tumpul)
  bottomWhiteCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 140, // Generous clearance above floating bottom dock
    minHeight: Math.max(550, SCREEN_HEIGHT - 380), // Always covers screen all the way down to bottom
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  agendaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  agendaHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  syncHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  syncHeaderBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: CALENDAR_THEME,
  },
  agendaTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  agendaSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: '#64748B',
  },

  // Empty State inside Agenda
  emptyAgendaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Timeline List
  timelineList: {
    gap: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 68,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 14,
  },
  timelineDotCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineDotInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  timelineDashedLineContainer: {
    width: 2,
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: 4,
  },
  timelineDashedLine: {
    width: 1.5,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  timelineContentCol: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  timelineItemTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    color: '#0F172A',
  },
  timelineItemTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  timelineItemTime: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  chevronBtn: {
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Floating Action Button (Rounded Squircle placed above the floating tab dock)
  fabBtn: {
    position: 'absolute',
    bottom: 92,
    right: 22,
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: AMBER_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 3. Add Note Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    fontSize: 19,
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalForm: {
    marginBottom: 10,
  },
  modalSectionLabel: {
    fontFamily: Fonts.extraBold,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 12,
  },
  drumPickerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  drumPickerLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: '#94A3B8',
    width: 50,
    textAlign: 'center',
  },
  drumPickerActiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  drumPickerNumber: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: '#0F172A',
    width: 50,
    textAlign: 'center',
  },
  drumPickerNumberActive: {
    fontFamily: Fonts.extraBold,
    fontSize: 18,
    color: Colors.primary,
    width: 50,
    textAlign: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 2,
  },
  drumPickerAmPm: {
    fontFamily: Fonts.extraBold,
    fontSize: 16,
    color: Colors.primary,
    width: 50,
    textAlign: 'center',
  },


  modalFieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 8,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#0F172A',
  },
  modalTextArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },

  colorAlarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 30,
  },
  colorCirclesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  colorCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmCol: {
    alignItems: 'flex-start',
  },
  saveBtn: {
    backgroundColor: AMBER_ACCENT,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  saveBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: '#0F172A',
  },

  // Added styles for Detail & Add/Edit Agenda
  rowRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowActionIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CALENDAR_THEME,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 14,
  },
  emptyAddBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Detail Modal Styles
  detailModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  detailTypeBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  detailTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    color: '#0F172A',
    marginBottom: 14,
  },
  detailMetaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailMetaText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  toggleTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  toggleTaskBtnDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  toggleTaskBtnPending: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  toggleTaskText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  toggleTaskTextDone: {
    color: '#15803D',
  },
  toggleTaskTextPending: {
    color: '#334155',
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: CALENDAR_THEME,
    paddingVertical: 14,
    borderRadius: 16,
  },
  editActionBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
  },
  deleteActionBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#EF4444',
  },

  // Date Banner & Form Styles
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateBannerText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: CALENDAR_THEME,
  },
  typeTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeTabBtnActive: {
    backgroundColor: CALENDAR_THEME,
    borderColor: CALENDAR_THEME,
  },
  typeTabText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: '#64748B',
  },
  typeTabTextActive: {
    color: '#FFFFFF',
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  timeInputCol: {
    flex: 1,
  },
  priorityPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  priorityPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priorityPillActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  priorityPillText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: '#64748B',
  },
  priorityPillTextActive: {
    color: '#7C3AED',
  },
  syncSingleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 12,
  },
  syncSingleActionBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: CALENDAR_THEME,
  },
  syncCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
    marginBottom: 8,
  },
  syncCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  syncCheckboxChecked: {
    backgroundColor: CALENDAR_THEME,
    borderColor: CALENDAR_THEME,
  },
  syncCheckboxTextCol: {
    flex: 1,
  },
  syncCheckboxLabel: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#0F172A',
  },
  syncCheckboxSub: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
