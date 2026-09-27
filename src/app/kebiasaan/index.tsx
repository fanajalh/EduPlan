import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { Colors, Fonts } from '@/constants/theme';
import { HabitItem } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { CuteCharacter } from '@/components/CuteCharacter';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { ModernAlertModal, AlertType } from '@/components/ModernAlertModal';
import { FormInput } from '@/components/FormInput';
import { notificationService } from '@/services/notificationService';

const HABIT_CATEGORIES = [
  { key: 'all', label: 'Semua' },
  { key: 'Belajar', label: 'Belajar' },
  { key: 'Literasi', label: 'Literasi' },
  { key: 'Fokus', label: 'Fokus' },
  { key: 'Kesehatan', label: 'Kesehatan' },
];

const PRESET_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'book-outline',
  'time-outline',
  'alarm-outline',
  'document-text-outline',
  'create-outline',
  'bulb-outline',
  'laptop-outline',
  'trophy-outline',
];

export default function KebiasaanScreen() {
  const router = useRouter();
  const { habits, toggleHabitToday, addHabit, updateHabit, deleteHabit } = useApp();

  const [activeCategory, setActiveCategory] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<HabitItem | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<HabitItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Belajar');
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('book-outline');
  const [targetDays, setTargetDays] = useState(7);

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

  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];

  // Helper to generate the past 7 days for the weekly strip
  const pastSevenDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: dayNames[d.getDay()],
      dateNum: d.getDate(),
      isToday: i === 6,
    };
  });

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/menu');
    }
  };

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const habit = habits.find((h) => h.id === id);
    const wasCompleted = habit?.completedDates.includes(todayDateStr);
    toggleHabitToday(id);

    if (habit && !wasCompleted) {
      const newStreak = (habit.streak || 0) + 1;
      notificationService.sendHeadsUpNotification({
        type: 'streak',
        title: `Streak ${newStreak} Hari: ${habit.title}`,
        subtitle: 'Kebiasaan Selesai',
        body: `Target harian tercapai. Konsistensi belajarmu semakin mantap!`,
        badgeText: `STREAK ${newStreak} HARI`,
        route: '/kebiasaan',
      });
    }
  };

  const handleDelete = (habit: HabitItem) => {
    setDeletingHabit(habit);
  };

  const confirmDeleteHabit = async () => {
    if (!deletingHabit) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics optional
    }
    await deleteHabit(deletingHabit.id);
    if (modalVisible && editingItem?.id === deletingHabit.id) {
      setModalVisible(false);
    }
    setDeletingHabit(null);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setCategory('Belajar');
    setSelectedIcon('book-outline');
    setTargetDays(7);
    setModalVisible(true);
  };

  const openEditModal = (habit: HabitItem) => {
    setEditingItem(habit);
    setTitle(habit.title);
    setCategory(habit.category);
    setSelectedIcon((habit.icon as keyof typeof Ionicons.glyphMap) || 'book-outline');
    setTargetDays(habit.targetDaysPerWeek || 7);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setAlertInfo({
        visible: true,
        type: 'warning',
        title: 'Bidang Wajib Diisi',
        message: 'Silakan masukkan nama target kebiasaan terlebih dahulu sebelum menyimpan.',
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (editingItem) {
      await updateHabit({
        ...editingItem,
        title: title.trim(),
        category,
        icon: selectedIcon,
        targetDaysPerWeek: targetDays,
      });
    } else {
      await addHabit({
        title: title.trim(),
        category,
        icon: selectedIcon,
        targetDaysPerWeek: targetDays,
      });
    }

    setModalVisible(false);
  };

  const filteredHabits = habits.filter((h) => {
    if (activeCategory === 'all') return true;
    return h.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const totalHabits = habits.length;
  const completedTodayCount = habits.filter((h) =>
    h.completedDates.includes(todayDateStr)
  ).length;
  const completionPct = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Bar with Home-style back button and add button */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addCircleBtn}
          onPress={openAddModal}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Editorial Headline (Home Screen Aesthetic) */}
        <View style={styles.headlineWrapper}>
          <View style={styles.headlineHiRow}>
            <Text style={styles.headlineHi}>Kebiasaan & Rutinitas</Text>
            <CuteCharacter type="cheer" size={32} />
          </View>
          <Text style={styles.headlineQuestion}>
            Bangun konsistensi <Text style={styles.headlineBold}>belajar harianmu</Text>
          </Text>
        </View>

        {/* Dual Mindful Moments Cards */}
        <View style={styles.momentsGrid}>
          {/* Card 1: Mustard Sun Yellow */}
          <TouchableOpacity
            style={[styles.momentCard, { backgroundColor: Colors.sunYellow }]}
            onPress={openAddModal}
            activeOpacity={0.88}
          >
            <View>
              <Text style={styles.momentTitle}>Rapor Target{'\n'}& Rutinitas</Text>
              <Text style={styles.momentSub}>
                {completedTodayCount} / {totalHabits} selesai ({completionPct}%)
              </Text>
            </View>
            <View style={styles.momentBottom}>
              <CuteCharacter type={completionPct >= 75 ? 'cheer' : 'smart'} size={42} />
              <View style={styles.arrowCircle}>
                <Ionicons name="checkmark" size={17} color={Colors.text} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 2: Mint Green */}
          <TouchableOpacity
            style={[styles.momentCard, { backgroundColor: Colors.mintGreen }]}
            onPress={() => setActiveCategory('all')}
            activeOpacity={0.88}
          >
            <View>
              <Text style={[styles.momentTitle, { color: '#FFFFFF' }]}>Konsistensi{'\n'}& Disiplin</Text>
              <Text style={[styles.momentSub, { color: 'rgba(255,255,255,0.85)' }]}>
                {totalHabits} target aktif
              </Text>
            </View>
            <View style={styles.momentBottom}>
              <CuteCharacter type="zen" size={42} />
              <View style={[styles.arrowCircle, { backgroundColor: Colors.white }]}>
                <Ionicons name="flame" size={16} color={Colors.mintGreen} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {HABIT_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daftar Rutinitas</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredHabits.length}</Text>
          </View>
        </View>

        {/* Habits List */}
        <View style={styles.listContainer}>
          {filteredHabits.length === 0 ? (
            <EmptyState
              character="zen"
              title="Belum ada target kebiasaan"
              description="Tambahkan rutinitas belajar seperti membaca materi atau sesi fokus 45 menit."
              actionLabel="Tambah Habit"
              onAction={openAddModal}
            />
          ) : (
            filteredHabits.map((item) => {
              const isDoneToday = item.completedDates.includes(todayDateStr);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.habitCard}
                  onPress={() => openEditModal(item)}
                  activeOpacity={0.88}
                >
                  {/* Top Row: Icon + Title + Meta + Checkmark Toggle */}
                  <View style={styles.habitCardHeader}>
                    <View style={styles.habitTitleRow}>
                      <View style={[styles.iconCircle, isDoneToday && styles.iconCircleDone]}>
                        <Ionicons
                          name={(item.icon as any) || 'book-outline'}
                          size={20}
                          color={isDoneToday ? Colors.mintGreen : Colors.text}
                        />
                      </View>

                      <View style={styles.habitTextWrap}>
                        <Text style={[styles.habitTitle, isDoneToday && styles.habitTitleDone]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={styles.metaRow}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{item.category}</Text>
                          </View>
                          <Text style={styles.streakText}>
                            🔥 {item.streak} hari
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Today Completion Toggle Checkmark */}
                    <TouchableOpacity
                      style={[
                        styles.toggleCheckBtn,
                        isDoneToday && styles.toggleCheckBtnDone,
                      ]}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleToggle(item.id);
                      }}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={isDoneToday ? 'checkmark' : 'ellipse-outline'}
                        size={20}
                        color={isDoneToday ? Colors.white : Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* 7-Day Mini Tracker Strip */}
                  <View style={styles.weekStripWrapper}>
                    <Text style={styles.weekStripLabel}>Riwayat 7 Hari</Text>
                    <View style={styles.weekStripRow}>
                      {pastSevenDays.map((d) => {
                        const isDayDone = item.completedDates.includes(d.dateStr);
                        return (
                          <View key={d.dateStr} style={styles.dayDotCol}>
                            <Text
                              style={[
                                styles.dayDotLabel,
                                d.isToday && styles.dayDotLabelToday,
                              ]}
                            >
                              {d.dayName}
                            </Text>
                            <View
                              style={[
                                styles.dayDot,
                                isDayDone && styles.dayDotFilled,
                                d.isToday && !isDayDone && styles.dayDotTodayEmpty,
                              ]}
                            >
                              {isDayDone && (
                                <Ionicons name="checkmark" size={10} color={Colors.white} />
                              )}
                            </View>
                            <Text style={styles.dayDotNum}>{d.dateNum}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Footer actions: Target & Delete */}
                  <View style={styles.habitCardFooter}>
                    <Text style={styles.targetFrequencyText}>
                      Target: {item.targetDaysPerWeek || 7} hari / minggu
                    </Text>

                    <TouchableOpacity
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleDelete(item);
                      }}
                      style={styles.deleteHabitBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Habit Modal (Home Style Sheet) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Kebiasaan' : 'Tambah Kebiasaan'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalForm}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title Input */}
              <FormInput
                label="Nama Rutinitas / Kebiasaan"
                required
                icon="flame-outline"
                placeholder="Contoh: Belajar Fokus 45 Menit, Baca Modul"
                value={title}
                onChangeText={setTitle}
                onClear={() => setTitle('')}
              />

              {/* Category Picker */}
              <Text style={styles.fieldLabel}>Kategori</Text>
              <View style={styles.categoryPickerRow}>
                {['Belajar', 'Literasi', 'Fokus', 'Kesehatan'].map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catOptionChip,
                        isSelected && styles.catOptionChipActive,
                      ]}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.catOptionChipText,
                          isSelected && styles.catOptionChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Icon Selector */}
              <Text style={styles.fieldLabel}>Pilih Ikon</Text>
              <View style={styles.iconSelectorRow}>
                {PRESET_ICONS.map((iconName) => {
                  const isSelected = selectedIcon === iconName;
                  return (
                    <TouchableOpacity
                      key={iconName}
                      style={[
                        styles.iconOptionBtn,
                        isSelected && styles.iconOptionBtnActive,
                      ]}
                      onPress={() => setSelectedIcon(iconName)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={iconName}
                        size={20}
                        color={isSelected ? Colors.white : Colors.text}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Target Frequency */}
              <Text style={styles.fieldLabel}>Target Frekuensi</Text>
              <View style={styles.targetDaysRow}>
                {[5, 6, 7].map((num) => {
                  const isSelected = targetDays === num;
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.targetDayBtn,
                        isSelected && styles.targetDayBtnActive,
                      ]}
                      onPress={() => setTargetDays(num)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.targetDayBtnText,
                          isSelected && styles.targetDayBtnTextActive,
                        ]}
                      >
                        {num} Hari / Minggu
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.88}
              >
                <Text style={styles.saveBtnText}>
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Kebiasaan'}
                </Text>
              </TouchableOpacity>

              {/* Delete Button (If editing existing habit) */}
              {editingItem && (
                <TouchableOpacity
                  style={styles.deleteModalBtn}
                  onPress={() => handleDelete(editingItem)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={17} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteModalBtnText}>Hapus Kebiasaan Ini</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Designed Delete Confirmation Pop-up */}
      <ConfirmDeleteModal
        visible={Boolean(deletingHabit)}
        title="Hapus Kebiasaan?"
        itemName={deletingHabit?.title}
        onConfirm={confirmDeleteHabit}
        onCancel={() => setDeletingHabit(null)}
      />

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
    paddingBottom: 40,
  },

  // Top Header (Home-style)
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Large Editorial Headline
  headlineWrapper: {
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 18,
  },
  headlineHiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headlineHi: {
    fontFamily: Fonts.extraBold,
    fontSize: 28,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headlineQuestion: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  headlineBold: {
    fontFamily: Fonts.bold,
    color: Colors.text,
  },

  // Dual Mindful Moments Cards
  momentsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 14,
    marginBottom: 20,
  },
  momentCard: {
    flex: 1,
    height: 154,
    borderRadius: 26,
    padding: 18,
    justifyContent: 'space-between',
  },
  momentTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 17,
    color: Colors.text,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  momentSub: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  momentBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category Filter Pills
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  filterPillText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.white,
    fontFamily: Fonts.bold,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.text,
  },
  countBadge: {
    backgroundColor: Colors.cardAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Habits List
  listContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  habitCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  habitCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircleDone: {
    backgroundColor: '#ECFDF5',
  },
  habitTextWrap: {
    flex: 1,
  },
  habitTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  habitTitleDone: {
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: Colors.cardAlt,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  streakText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  toggleCheckBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  toggleCheckBtnDone: {
    backgroundColor: Colors.mintGreen,
    borderColor: Colors.mintGreen,
  },

  // Week Strip
  weekStripWrapper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  weekStripLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  weekStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayDotCol: {
    alignItems: 'center',
    gap: 4,
  },
  dayDotLabel: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textMuted,
  },
  dayDotLabelToday: {
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  dayDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E4E4E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDotFilled: {
    backgroundColor: Colors.mintGreen,
  },
  dayDotTodayEmpty: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  dayDotNum: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textSecondary,
  },

  // Footer
  habitCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  targetFrequencyText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  deleteHabitBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
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
    color: Colors.text,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalForm: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.text,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catOptionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  catOptionChipActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  catOptionChipText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  catOptionChipTextActive: {
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  iconSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOptionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOptionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  targetDaysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  targetDayBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  targetDayBtnActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  targetDayBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  targetDayBtnTextActive: {
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
  },
  saveBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.white,
  },
  deleteModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    marginBottom: 20,
  },
  deleteModalBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#EF4444',
  },
});
