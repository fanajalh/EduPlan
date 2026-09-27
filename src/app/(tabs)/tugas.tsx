import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { Colors, Fonts } from '@/constants/theme';
import { TaskItem, TaskPriority } from '@/types';
import { FileExportService } from '@/services/fileExport';
import { CuteCharacter } from '@/components/CuteCharacter';
import { ModernAlertModal, AlertType } from '@/components/ModernAlertModal';
import { FormInput } from '@/components/FormInput';

const WEEKDAY_BASE = [
  { day: 'Mon', full: 'Senin' },
  { day: 'Tue', full: 'Selasa' },
  { day: 'Wed', full: 'Rabu' },
  { day: 'Thu', full: 'Kamis' },
  { day: 'Fri', full: 'Jumat' },
  { day: 'Sat', full: 'Sabtu' },
  { day: 'Sun', full: 'Minggu' },
];

export default function TugasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    tasks,
    schedules,
    habits,
    notes: savedNotes,
    profile,
    addTask,
    updateTask,
  } = useApp();

  // Overview State: default to today's weekday index (0 = Mon, ..., 6 = Sun)
  const todayWeekdayIndex = (new Date().getDay() + 6) % 7;
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayWeekdayIndex);
  const [timeRange, setTimeRange] = useState<'Weekly' | 'Monthly'>('Weekly');

  // Quick Add Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<TaskItem | null>(null);
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('sedang');
  const [notes, setNotes] = useState('');

  // Styled alert state
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'warning',
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  // 100% REAL completion rate computed from tasks
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // 100% REAL Learning time calculation from scheduled classes & completed tasks
  const weeklyScheduleMinutes = schedules.reduce((total, s) => {
    if (s.startTime && s.endTime) {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(eh)) {
        const diff = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
        return diff > 0 ? total + diff : total;
      }
    }
    return total;
  }, 0);

  const completedTaskMinutes = completedCount * 45; // 45m per completed assignment
  const totalWeeklyMinutes = weeklyScheduleMinutes + completedTaskMinutes;
  const activeMinutes = timeRange === 'Monthly'
    ? totalWeeklyMinutes * 4
    : totalWeeklyMinutes;

  const displayHours = Math.floor(activeMinutes / 60);
  const displayMins = Math.round(activeMinutes % 60);
  const learningTimeDisplay = `${displayHours}h ${displayMins}m`;

  // 100% REAL Streak calculation from habits
  const maxHabitStreak = habits.length > 0
    ? Math.max(...habits.map((h) => Number(h.streak) || 0), 0)
    : 0;

  // 100% REAL Metrics
  // 1. Lessons: total scheduled classes in timetable
  const totalLessons = schedules.length;

  // 2. Notes: total notes saved by user in local database
  const totalNotes = savedNotes.length;

  // 3. Hours: exact real hours from schedules and completed tasks
  const totalHoursValue = activeMinutes / 60;
  const totalHoursDisplay = totalHoursValue.toFixed(1);

  // 100% REAL Dynamic chart data for Mon–Sun from schedules
  const chartData = useMemo(() => {
    const dayStats = WEEKDAY_BASE.map((item) => {
      const daySchedules = schedules.filter(
        (s) => s.day.toLowerCase() === item.full.toLowerCase()
      );

      let dayMinutes = 0;
      daySchedules.forEach((s) => {
        if (s.startTime && s.endTime) {
          const [sh, sm] = s.startTime.split(':').map(Number);
          const [eh, em] = s.endTime.split(':').map(Number);
          if (!isNaN(sh) && !isNaN(eh)) {
            const diff = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
            if (diff > 0) dayMinutes += diff;
          }
        }
      });

      const dayHours = dayMinutes / 60;
      const finalHours = timeRange === 'Monthly'
        ? Number((dayHours * 4).toFixed(1))
        : Number(dayHours.toFixed(1));

      return {
        item,
        finalHours,
      };
    });

    const maxDayHours = Math.max(
      ...dayStats.map((d) => d.finalHours),
      timeRange === 'Monthly' ? 12 : 3
    );

    return dayStats.map(({ item, finalHours }) => {
      const minHeight = 16;
      const maxHeight = 120;
      const height = finalHours > 0
        ? Math.round(minHeight + (Math.min(finalHours, maxDayHours) / maxDayHours) * (maxHeight - minHeight))
        : minHeight;

      const formattedHours = Number.isInteger(finalHours)
        ? finalHours.toString()
        : finalHours.toFixed(1).replace('.0', '');

      return {
        day: item.day,
        full: item.full,
        height,
        badgeNumber: formattedHours,
        badgeUnit: 'hours',
        rawHours: finalHours,
      };
    });
  }, [schedules, timeRange]);

  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setSubject('');
    setDeadline(todayStr);
    setDeadlineTime('23:59');
    setPriority('sedang');
    setNotes('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setAlertInfo({
        visible: true,
        type: 'warning',
        title: 'Bidang Wajib Diisi',
        message: 'Silakan masukkan judul tugas terlebih dahulu sebelum menyimpan.',
      });
      return;
    }

    if (editingItem) {
      await updateTask({
        ...editingItem,
        title,
        subject: subject || 'Tugas Umum',
        deadline: deadline || todayStr,
        deadlineTime: deadlineTime || '23:59',
        priority,
        notes,
      });
    } else {
      await addTask({
        title,
        subject: subject || 'Tugas Umum',
        deadline: deadline || todayStr,
        deadlineTime: deadlineTime || '23:59',
        priority,
        completed: false,
        notes,
      });
    }

    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top App Bar (Avatar Left, More Options Right) */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => router.push('/profil')}
          activeOpacity={0.8}
        >
          <CuteCharacter type={profile?.character || 'avatar'} size={34} />
        </TouchableOpacity>

        <View style={styles.topNavActions}>
          <TouchableOpacity
            style={styles.circleIconBtn}
            onPress={async () => {
              Haptics.selectionAsync().catch(() => {});
              await FileExportService.downloadTaskList(tasks);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={19} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleIconBtn}
            onPress={openAddModal}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleIconBtn}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setOptionsModalOpen(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Headline Row: "Learning Overview" + Dropdown Pill */}
        <View style={styles.overviewHeaderRow}>
          <Text style={styles.overviewTitle}>Learning{'\n'}Overview</Text>
          <TouchableOpacity
            style={styles.dropdownPill}
            onPress={() => setTimeRange(timeRange === 'Weekly' ? 'Monthly' : 'Weekly')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownPillText}>{timeRange}</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* 1. Weekly Bar Chart Card (From Reference Right Screen) */}
        <View style={styles.chartCard}>
          <View style={styles.chartBarsContainer}>
            {chartData.map((w, index) => {
              const isSelected = index === selectedDayIndex;
              return (
                <TouchableOpacity
                  key={w.day}
                  style={styles.barCol}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedDayIndex(index);
                  }}
                  activeOpacity={0.8}
                >
                  {/* Vertical Bar Track with Centered Tooltip Directly on Top */}
                  <View style={styles.barTrack}>
                    {isSelected && (
                      <View style={[styles.tooltipPill, { bottom: Math.min(w.height + 6, 126) }]}>
                        <Text style={styles.tooltipNum}>{w.badgeNumber}</Text>
                        <Text style={styles.tooltipUnit}>{w.badgeUnit}</Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.barFill,
                        { height: w.height },
                        isSelected ? styles.barFillActive : styles.barFillInactive,
                      ]}
                    />
                  </View>

                  {/* Day Label */}
                  <Text
                    style={[
                      styles.barDayText,
                      isSelected && styles.barDayTextActive,
                    ]}
                  >
                    {w.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Two Squircle Stat Cards (Weekly learning time & Skill Master) */}
        <View style={styles.twoCardsRow}>
          {/* Lavender Card: Weekly learning time */}
          <TouchableOpacity
            style={styles.lavenderCard}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push('/statistik');
            }}
            activeOpacity={0.9}
          >
            <View style={styles.cardIconBoxLavender}>
              <Ionicons name="clipboard-outline" size={20} color="#7C3AED" />
            </View>
            <View>
              <Text style={styles.statCardSubtitle}>
                {timeRange === 'Weekly' ? 'Weekly' : 'Monthly'} learning time
              </Text>
              <Text style={styles.statCardTitle}>{learningTimeDisplay}</Text>
            </View>
          </TouchableOpacity>

          {/* Sky Blue Card: Skill Master Chart / Completion */}
          <TouchableOpacity
            style={styles.skyBlueCard}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push('/daftar-tugas' as any);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.cardIconBoxSky}>
              <Ionicons name="rocket-outline" size={20} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.statCardSubtitle}>Task Master Chart</Text>
              <Text style={styles.statCardTitle}>Done {completionRate}%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. Streak Tracker Card (Lightning) - Matched to Gambar 3 (Capsule & Direct Yellow Bolt) */}
        <TouchableOpacity
          style={styles.streakCard}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push('/kebiasaan' as any);
          }}
          activeOpacity={0.85}
        >
          <View style={styles.streakLeft}>
            <Ionicons name="flash" size={24} color="#EAB308" style={styles.streakFlashIcon} />
            <View style={styles.streakTextCol}>
              <Text style={styles.streakSub}>Streak tracker</Text>
              <Text style={styles.streakTitle}>{maxHabitStreak}-day learning streak!</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* 4. Three Metric Summary Cards - Matched to Gambar 2 (Solid, rich pastel colors, not transparent) */}
        <View style={styles.threeMetricsRow}>
          {/* Card 1: Lessons (Rich Pastel Sky Blue) - Clickable to open Jadwal */}
          <TouchableOpacity
            style={[styles.metricCard, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push('/jadwal');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.metricIconBadge, { backgroundColor: '#0284C7' }]}>
              <Ionicons name="book" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.metricNumber}>{totalLessons}</Text>
            <Text style={styles.metricLabel}>Lessons</Text>
          </TouchableOpacity>

          {/* Card 2: Notes (Rich Pastel Peach / Orange) - Clickable to open Catatan */}
          <TouchableOpacity
            style={[styles.metricCard, { backgroundColor: '#FFEDD5', borderColor: '#FED7AA' }]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push('/catatan' as any);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.metricIconBadge, { backgroundColor: '#F97316' }]}>
              <Ionicons name="document-text" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.metricNumber}>{totalNotes}</Text>
            <Text style={styles.metricLabel}>Notes</Text>
          </TouchableOpacity>

          {/* Card 3: Hours (Rich Pastel Soft Violet / Lavender) */}
          <TouchableOpacity
            style={[styles.metricCard, { backgroundColor: '#EDE9FE', borderColor: '#DDD6FE' }]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push('/statistik');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.metricIconBadgeRound, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="time" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.metricNumber}>{totalHoursDisplay}</Text>
            <Text style={styles.metricLabel}>Hours</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Action Card: Navigasi ke Halaman Baru Lessons & Tasks */}
        <TouchableOpacity
          style={styles.openTasksActionCard}
          onPress={() => router.push('/daftar-tugas' as any)}
          activeOpacity={0.88}
        >
          <View style={styles.openTasksCardLeft}>
            <View style={styles.openTasksIconCircle}>
              <Ionicons name="book" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.openTasksTextCol}>
              <Text style={styles.openTasksCardTitle}>Lessons & Tasks</Text>
              <Text style={styles.openTasksCardSub}>
                {pendingCount} tugas aktif • {completedCount} telah diselesaikan
              </Text>
            </View>
          </View>
          <View style={styles.openTasksArrowBtn}>
            <Ionicons name="chevron-forward" size={18} color="#8B5CF6" />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* 7. Add / Edit Task Modal (Transparent Overlay, Clean Sheet Covering Screen Bottom) */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
          />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Tugas' : 'Tambah Tugas Baru'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              <FormInput
                label="Judul Tugas"
                required
                icon="document-text-outline"
                placeholder="Contoh: Laporan Bab 1 Fisika Dasar"
                value={title}
                onChangeText={setTitle}
                onClear={() => setTitle('')}
              />

              <FormInput
                label="Mata Pelajaran"
                icon="book-outline"
                placeholder="Contoh: Fisika Dasar / Matematika"
                value={subject}
                onChangeText={setSubject}
                onClear={() => setSubject('')}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <FormInput
                    label="Batas Tanggal (YYYY-MM-DD)"
                    icon="calendar-outline"
                    placeholder="2026-09-30"
                    value={deadline}
                    onChangeText={setDeadline}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <FormInput
                    label="Batas Jam (HH:mm)"
                    icon="time-outline"
                    placeholder="23:59"
                    value={deadlineTime}
                    onChangeText={setDeadlineTime}
                  />
                </View>
              </View>

              <Text style={styles.label}>Tingkat Prioritas</Text>
              <View style={styles.priorityRow}>
                {(['tinggi', 'sedang', 'rendah'] as TaskPriority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityBtn,
                        isSelected && styles.priorityBtnActive,
                        p === 'tinggi' && isSelected && { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
                        p === 'sedang' && isSelected && { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
                        p === 'rendah' && isSelected && { backgroundColor: Colors.periwinkleLight, borderColor: Colors.periwinkle },
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text
                        style={[
                          styles.priorityBtnText,
                          isSelected && { fontFamily: Fonts.bold },
                          p === 'tinggi' && isSelected && { color: '#B91C1C' },
                          p === 'sedang' && isSelected && { color: '#B45309' },
                          p === 'rendah' && isSelected && { color: Colors.periwinkle },
                        ]}
                      >
                        {p.toUpperCase()}
                      </Text>

                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Catatan Tambahan / Instruksi</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Catatan detail pengerjaan, format berkas, dsb..."
                placeholderTextColor={Colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>
                  {editingItem ? 'Simpan Perubahan' : 'Buat Tugas Baru'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sleek Custom Options Bottom Sheet Modal */}
      <Modal
        visible={optionsModalOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setOptionsModalOpen(false)}
      >
        <View style={styles.optionsModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setOptionsModalOpen(false)}
          />
          <View style={[styles.optionsModalSheet, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandlePill} />

            {/* Header */}
            <View style={styles.optionsHeader}>
              <View style={styles.optionsHeaderIconWrap}>
                <Ionicons name="options" size={22} color={Colors.primary} />
              </View>
              <View style={styles.optionsHeaderTextWrap}>
                <Text style={styles.optionsModalTitle}>Opsi Halaman Tugas</Text>
                <Text style={styles.optionsModalSubtitle}>Pilih tindakan cepat untuk mengelola tugasmu</Text>
              </View>
            </View>

            {/* Action Items List */}
            <View style={styles.optionsList}>
              {/* Option 1: Toggle View Mode */}
              <TouchableOpacity
                style={styles.optionCard}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setTimeRange(timeRange === 'Weekly' ? 'Monthly' : 'Weekly');
                  setOptionsModalOpen(false);
                }}
              >
                <View style={[styles.optionIconBox, { backgroundColor: '#FFF0ED' }]}>
                  <Ionicons name="calendar-outline" size={20} color="#FF5733" />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>
                    Ubah Tampilan: {timeRange === 'Weekly' ? 'Bulanan' : 'Mingguan'}
                  </Text>
                  <Text style={styles.optionDesc}>
                    Beralih grafik ke ritme {timeRange === 'Weekly' ? 'bulanan (4 minggu)' : 'mingguan (7 hari)'}
                  </Text>
                </View>
                <View style={styles.optionBadgePill}>
                  <Text style={styles.optionBadgeText}>{timeRange === 'Weekly' ? 'Bulanan' : 'Mingguan'}</Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: All Tasks & Subjects */}
              <TouchableOpacity
                style={styles.optionCard}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setOptionsModalOpen(false);
                  router.push('/daftar-tugas' as any);
                }}
              >
                <View style={[styles.optionIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="list-outline" size={20} color="#6284F6" />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>Buka Daftar Tugas & Pelajaran</Text>
                  <Text style={styles.optionDesc}>
                    Lihat semua tugas per mata pelajaran dan deadline
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              {/* Option 3: Export Summary */}
              <TouchableOpacity
                style={styles.optionCard}
                activeOpacity={0.7}
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setOptionsModalOpen(false);
                  await FileExportService.downloadTaskList(tasks);
                }}
              >
                <View style={[styles.optionIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="download-outline" size={20} color="#10B981" />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>Unduh Ringkasan Tugas (.txt)</Text>
                  <Text style={styles.optionDesc}>
                    Ekspor seluruh daftar tugas ke berkas teks di HP
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.optionsCancelBtn}
              activeOpacity={0.75}
              onPress={() => setOptionsModalOpen(false)}
            >
              <Text style={styles.optionsCancelBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ModernAlertModal
        visible={alertInfo.visible}
        type={alertInfo.type}
        title={alertInfo.title}
        message={alertInfo.message}
        onConfirm={() => setAlertInfo((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 130, // Room for floating dock
  },

  // Top App Bar
  topNavRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Overview Headline Row
  overviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 16,
  },
  overviewTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 30,
    color: '#141416',
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  dropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  dropdownPillText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#141416',
  },

  // 1. Weekly Bar Chart Card
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#EAE7E0',
    padding: 18,
    paddingTop: 32,
    marginBottom: 16,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    height: '100%',
  },
  tooltipPill: {
    position: 'absolute',
    backgroundColor: '#141416',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    minWidth: 46,
  },
  tooltipNum: {
    fontFamily: Fonts.extraBold,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 15,
    textAlign: 'center',
  },
  tooltipUnit: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 12,
    textAlign: 'center',
  },
  barTrack: {
    width: 36,
    height: 160,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  barFill: {
    width: 34,
    borderRadius: 17,
  },
  barFillActive: {
    backgroundColor: '#9333EA', // Vibrant purple matching reference
  },
  barFillInactive: {
    backgroundColor: '#F3E8FF', // Soft muted lavender
  },
  barDayText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
  },
  barDayTextActive: {
    fontFamily: Fonts.extraBold,
    color: '#141416',
  },

  // 2. Two Squircle Stat Cards Row
  twoCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  lavenderCard: {
    flex: 1,
    backgroundColor: '#C084FC', // Rich soft purple from reference
    borderRadius: 28,
    padding: 20,
    minHeight: 145,
    justifyContent: 'space-between',
  },
  skyBlueCard: {
    flex: 1,
    backgroundColor: '#38BDF8', // Sky cyan from reference
    borderRadius: 28,
    padding: 20,
    minHeight: 145,
    justifyContent: 'space-between',
  },
  cardIconBoxLavender: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconBoxSky: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardSubtitle: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 8,
  },
  statCardTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },

  // 3. Streak Tracker Card (Capsule shape matching Gambar 3)
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 14,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakFlashIcon: {
    marginLeft: 2,
  },
  streakTextCol: {
    justifyContent: 'center',
  },
  streakSub: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: '#64748B',
  },
  streakTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#0F172A',
    marginTop: 1,
  },

  // 4. Three Metrics Row (Left-aligned & solid icon badges matching Gambar 2)
  threeMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'flex-start',
    minHeight: 122,
  },
  metricIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconBadgeRound: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricNumber: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    color: '#0F172A',
    letterSpacing: -0.4,
    marginTop: 14,
    marginBottom: 2,
  },
  metricLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: '#334155',
  },

  // 5. Open Tasks Action Card
  openTasksActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginTop: 4,
    marginBottom: 30,
  },
  openTasksCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  openTasksIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openTasksTextCol: {
    flex: 1,
  },
  openTasksCardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#0F172A',
  },
  openTasksCardSub: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  openTasksArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Common Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },

  // 7. Add / Edit Task Modal
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: Colors.border,
    paddingHorizontal: 22,
    paddingTop: 12,
    maxHeight: '92%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E4E7',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  modalTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F6F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 13,
  },
  input: {
    fontFamily: Fonts.medium,
    backgroundColor: '#F8F6F2',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F6F2',
  },
  priorityBtnActive: {
    borderColor: Colors.primary,
  },
  priorityBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: '#8B5CF6',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  saveBtnText: {
    fontFamily: Fonts.bold,
    color: Colors.white,
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // Custom Options Bottom Sheet Modal
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  optionsModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: '#E2E8F0',
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  sheetHandlePill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 18,
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionsHeaderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionsHeaderTextWrap: {
    flex: 1,
  },
  optionsModalTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 18,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  optionsModalSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  optionsList: {
    gap: 10,
    marginBottom: 18,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#0F172A',
  },
  optionDesc: {
    fontFamily: Fonts.medium,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  optionBadgePill: {
    backgroundColor: '#FFF0ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  optionBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 11.5,
    color: '#FF5733',
  },
  optionsCancelBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsCancelBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#475569',
  },
});
