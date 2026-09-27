import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { Colors, Fonts } from '@/constants/theme';
import { ReminderItem } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { CuteCharacter } from '@/components/CuteCharacter';
import { CustomSwitch } from '@/components/CustomSwitch';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { ModernAlertModal, AlertType } from '@/components/ModernAlertModal';
import { FormInput } from '@/components/FormInput';
import { notificationService } from '@/services/notificationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }[] = [
  { key: 'all', label: 'Semua', icon: 'notifications-outline', color: Colors.text, bg: Colors.cardAlt },
  { key: 'jadwal', label: 'Jadwal Kelas', icon: 'time-outline', color: '#6284F6', bg: '#EEF2FF' },
  { key: 'tugas', label: 'Deadline Tugas', icon: 'checkbox-outline', color: '#FF5733', bg: '#FFF0EC' },
  { key: 'ujian', label: 'Ujian & Tryout', icon: 'school-outline', color: '#DC2626', bg: '#FEE2E2' },
  { key: 'kebiasaan', label: 'Kebiasaan', icon: 'flame-outline', color: '#F59E0B', bg: '#FEF3C7' },
];

const REPEAT_OPTIONS = [
  'Setiap Hari',
  'Hari Kerja (Sen - Jum)',
  'Akhir Pekan (Sab - Min)',
  'Sekali Saja',
];

export default function ReminderScreen() {
  const router = useRouter();
  const { reminders, addReminder, updateReminder, toggleReminder, deleteReminder } = useApp();

  const [activeFilter, setActiveFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ReminderItem | null>(null);
  const [deletingReminder, setDeletingReminder] = useState<ReminderItem | null>(null);

  // Active ringing alarm modal state
  const [activeRingingAlarm, setActiveRingingAlarm] = useState<{ title: string; time: string } | null>(null);

  useEffect(() => {
    // Initialize notification service on mount
    notificationService.initAsync().catch(() => {});
  }, []);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReminderItem['type']>('jadwal');
  const [time, setTime] = useState('07:00');
  const [repeat, setRepeat] = useState('Hari Kerja (Sen - Jum)');
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

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/menu');
    }
  };

  const handleToggle = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const target = reminders.find((r) => r.id === id);
    toggleReminder(id);

    if (target) {
      if (!target.enabled) {
        // Will be enabled
        await notificationService.scheduleAlarmNotification({
          id: target.id,
          title: target.title,
          body: target.notes || `Waktunya: ${target.title} (${target.time})`,
          time: target.time,
        });

        await notificationService.sendHeadsUpNotification({
          type: 'alarm',
          title: `⏰ Alarm Diaktifkan: ${target.title}`,
          subtitle: `Disetel pukul ${target.time}`,
          body: `Alarm aktif dan akan berbunyi tepat waktu pada pukul ${target.time}.`,
          badgeText: 'ALARM AKTIF',
        });
      } else {
        // Will be disabled
        await notificationService.cancelNotification(target.id);
        await notificationService.sendHeadsUpNotification({
          type: 'reminder',
          title: `Pengingat Dinonaktifkan: ${target.title}`,
          subtitle: 'Status Alarm Mati',
          body: `Alarm "${target.title}" dinonaktifkan sementara.`,
          badgeText: 'NONAKTIF',
        });
      }
    }
  };


  const handleDelete = (item: ReminderItem) => {
    setDeletingReminder(item);
  };

  const confirmDeleteReminder = async () => {
    if (!deletingReminder) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics optional
    }
    const itemToDelete = deletingReminder;
    setDeletingReminder(null);
    await deleteReminder(itemToDelete.id);
    if (modalVisible && editingItem?.id === itemToDelete.id) {
      setModalVisible(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setType('jadwal');
    setTime('07:00');
    setRepeat('Hari Kerja (Sen - Jum)');
    setNotes('');
    setModalVisible(true);
  };

  const openEditModal = (item: ReminderItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setType(item.type);
    setTime(item.time);
    setRepeat(item.repeat);
    setNotes(item.notes || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setAlertInfo({
        visible: true,
        type: 'warning',
        title: 'Bidang Wajib Diisi',
        message: 'Silakan masukkan judul alarm atau pengingat terlebih dahulu sebelum menyimpan.',
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (editingItem) {
      await updateReminder({
        ...editingItem,
        title: title.trim(),
        type,
        time: time.trim() || '07:00',
        repeat,
        notes: notes.trim(),
      });
      await notificationService.sendHeadsUpNotification({
        type: 'alarm',
        title: `Alarm Diperbarui: ${title.trim()}`,
        subtitle: `Pukul ${time.trim() || '07:00'}`,
        body: `Pengaturan alarm telah diperbarui dan dijadwalkan ulang.`,
        badgeText: 'DIPERBARUI',
      });
    } else {
      const newId = `rem_${Date.now()}`;
      await addReminder({
        title: title.trim(),
        type,
        time: time.trim() || '07:00',
        repeat,
        enabled: true,
        notes: notes.trim(),
      });
      await notificationService.scheduleAlarmNotification({
        id: newId,
        title: title.trim(),
        body: notes.trim() || `Waktunya agenda: ${title.trim()}`,
        time: time.trim() || '07:00',
      });
      await notificationService.sendHeadsUpNotification({
        type: 'alarm',
        title: `⏰ Alarm Baru Disetel: ${title.trim()}`,
        subtitle: `Pukul ${time.trim() || '07:00'}`,
        body: `Alarm baru aktif dan siap mengingatkan Anda tepat waktu!`,
        badgeText: 'ALARM AKTIF',
      });
    }

    setModalVisible(false);
  };

  const filteredReminders = reminders.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  const activeCount = reminders.filter((r) => r.enabled).length;

  const getTypeMeta = (t: ReminderItem['type']) => {
    switch (t) {
      case 'jadwal':
        return { label: 'Jadwal', color: '#6284F6', bg: '#EEF2FF', icon: 'time-outline' as const };
      case 'tugas':
        return { label: 'Tugas', color: '#FF5733', bg: '#FFF0EC', icon: 'checkbox-outline' as const };
      case 'ujian':
        return { label: 'Ujian', color: '#DC2626', bg: '#FEE2E2', icon: 'school-outline' as const };
      case 'kebiasaan':
        return { label: 'Kebiasaan', color: '#F59E0B', bg: '#FEF3C7', icon: 'flame-outline' as const };
      default:
        return { label: 'Umum', color: '#64748B', bg: '#F1F5F9', icon: 'notifications-outline' as const };
    }
  };

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
            <Text style={styles.headlineHi}>Pengingat & Alarm</Text>
            <CuteCharacter type="smart" size={32} />
          </View>
          <Text style={styles.headlineQuestion}>
            Disiplin & siapkan <Text style={styles.headlineBold}>jadwal belajarmu</Text>
          </Text>
        </View>

        {/* Dual Mindful Moments Cards */}
        <View style={styles.momentsGrid}>
          {/* Card 1: Warm Sun Yellow */}
          <TouchableOpacity
            style={[styles.momentCard, { backgroundColor: Colors.sunYellow }]}
            onPress={openAddModal}
            activeOpacity={0.88}
          >
            <View>
              <Text style={styles.momentTitle}>Pengingat{'\n'}& Alarm</Text>
              <Text style={styles.momentSub}>{activeCount} alarm aktif</Text>
            </View>
            <View style={styles.momentBottom}>
              <CuteCharacter type="smart" size={42} />
              <View style={styles.arrowCircle}>
                <Ionicons name="add" size={18} color={Colors.text} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 2: Periwinkle */}
          <TouchableOpacity
            style={[styles.momentCard, { backgroundColor: Colors.periwinkle }]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.88}
          >
            <View>
              <Text style={[styles.momentTitle, { color: '#FFFFFF' }]}>Ritme{'\n'}Disiplin</Text>
              <Text style={[styles.momentSub, { color: 'rgba(255,255,255,0.85)' }]}>
                {reminders.length} total pengingat
              </Text>
            </View>
            <View style={styles.momentBottom}>
              <CuteCharacter type="zen" size={42} />
              <View style={[styles.arrowCircle, { backgroundColor: Colors.white }]}>
                <Ionicons name="notifications" size={15} color={Colors.periwinkle} />
              </View>
            </View>
          </TouchableOpacity>
        </View>


        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = activeFilter === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter(cat.key)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isSelected ? Colors.white : Colors.textSecondary}
                />
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.sectionTitle}>Daftar Alarm</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredReminders.length}</Text>
            </View>
          </View>
        </View>

        {/* Reminders List */}
        <View style={styles.listContainer}>
          {filteredReminders.length === 0 ? (
            <EmptyState
              character="calm"
              title="Belum ada pengingat"
              description="Buat pengingat jadwal kelas atau tugas agar ritme belajarmu tidak tertinggal."
              actionLabel="Tambah Pengingat"
              onAction={openAddModal}
            />
          ) : (
            filteredReminders.map((item) => {
              const meta = getTypeMeta(item.type);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.reminderCard,
                    !item.enabled && styles.reminderCardDisabled,
                  ]}
                  onPress={() => openEditModal(item)}
                  activeOpacity={0.88}
                >
                  {/* Top row: Time, Type Badge, and Switch */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.timeWrap}>
                      <Text style={[styles.timeText, !item.enabled && styles.timeTextDisabled]}>
                        {item.time}
                      </Text>
                      <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon} size={12} color={meta.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.typeBadgeText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>

                    {/* Sleek Custom Switch Toggle */}
                    <CustomSwitch
                      value={item.enabled}
                      onValueChange={() => handleToggle(item.id)}
                      activeColor={Colors.primary}
                    />
                  </View>

                  {/* Body: Title & Notes */}
                  <View style={styles.cardBody}>
                    <Text
                      style={[
                        styles.reminderTitle,
                        !item.enabled && styles.reminderTitleDisabled,
                      ]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    {item.notes ? (
                      <Text
                        style={[
                          styles.reminderNotes,
                          !item.enabled && styles.reminderNotesDisabled,
                        ]}
                        numberOfLines={2}
                      >
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>

                  {/* Card Footer: Repeat Schedule & Delete Action */}
                  <View style={styles.cardFooter}>
                    <View style={styles.repeatBadge}>
                      <Ionicons name="repeat-outline" size={13} color={Colors.textSecondary} />
                      <Text style={styles.repeatText}>{item.repeat}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Reminder Modal (Home Style Sheet) */}
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
                {editingItem ? 'Edit Pengingat' : 'Tambah Pengingat'}
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
                label="Judul Alarm / Pengingat"
                required
                icon="alarm-outline"
                placeholder="Contoh: Kuliah Algoritma, Kuis Kimia"
                value={title}
                onChangeText={setTitle}
                onClear={() => setTitle('')}
              />

              {/* Type Selection Chips */}
              <Text style={styles.fieldLabel}>Kategori</Text>
              <View style={styles.typeSelectorRow}>
                {(['jadwal', 'tugas', 'ujian', 'kebiasaan'] as ReminderItem['type'][]).map((t) => {
                  const meta = getTypeMeta(t);
                  const isSelected = type === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeSelectBtn,
                        isSelected && { borderColor: meta.color, backgroundColor: meta.bg },
                      ]}
                      onPress={() => setType(t)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={meta.icon}
                        size={15}
                        color={isSelected ? meta.color : Colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.typeSelectBtnText,
                          isSelected && { color: meta.color, fontFamily: Fonts.bold },
                        ]}
                      >
                        {meta.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Time Input */}
              <FormInput
                label="Waktu Alarm (Format HH:mm)"
                required
                icon="time-outline"
                placeholder="07:00 atau 19:30"
                value={time}
                onChangeText={setTime}
                keyboardType="numbers-and-punctuation"
              />

              {/* Repeat Options */}
              <Text style={styles.fieldLabel}>Pengulangan</Text>
              <View style={styles.repeatOptionsWrap}>
                {REPEAT_OPTIONS.map((opt) => {
                  const isSelected = repeat === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.repeatOptionChip,
                        isSelected && styles.repeatOptionChipActive,
                      ]}
                      onPress={() => setRepeat(opt)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.repeatOptionChipText,
                          isSelected && styles.repeatOptionChipTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Notes Input */}
              <Text style={styles.fieldLabel}>Catatan Tambahan (Opsional)</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Bawa modul praktikum, siapkan kartu ujian..."
                placeholderTextColor={Colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.88}
              >
                <Text style={styles.saveBtnText}>
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Pengingat'}
                </Text>
              </TouchableOpacity>

              {/* Delete Button (If editing existing reminder) */}
              {editingItem && (
                <TouchableOpacity
                  style={styles.deleteModalBtn}
                  onPress={() => handleDelete(editingItem)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={17} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteModalBtnText}>Hapus Pengingat Ini</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmDeleteModal
        visible={Boolean(deletingReminder)}
        title="Hapus Pengingat?"
        itemName={deletingReminder?.title}
        onConfirm={confirmDeleteReminder}
        onCancel={() => setDeletingReminder(null)}
      />

      {/* Alarm Ringing Fullscreen Alert Modal */}
      <Modal
        visible={Boolean(activeRingingAlarm)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveRingingAlarm(null)}
      >
        <View style={styles.alarmModalOverlay}>
          <View style={styles.alarmModalCard}>
            <View style={styles.alarmPulseCircle}>
              <View style={styles.alarmPulseInner}>
                <Ionicons name="alarm" size={38} color="#EF4444" />
              </View>
            </View>

            <Text style={styles.alarmRingingSubtitle}>ALARM SEDANG BERBUNYI</Text>
            <Text style={styles.alarmRingingTitle}>{activeRingingAlarm?.title}</Text>
            <Text style={styles.alarmRingingTime}>Waktu: {activeRingingAlarm?.time}</Text>

            <Text style={styles.alarmRingingDesc}>
              Pengingat sesi belajar Anda telah tiba. Siapkan modul dan mulailah dengan fokus!
            </Text>

            <View style={styles.alarmModalActionCol}>
              <TouchableOpacity
                style={styles.alarmDismissBtn}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  setActiveRingingAlarm(null);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="stop-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.alarmDismissBtnText}>Matikan Alarm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.alarmSnoozeBtn}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  const title = activeRingingAlarm?.title || 'Agenda Belajar';
                  setActiveRingingAlarm(null);
                  notificationService.sendHeadsUpNotification({
                    type: 'reminder',
                    title: `Tunda 5 Menit: ${title}`,
                    subtitle: 'Alarm Ditunda',
                    body: 'Alarm akan berdering kembali dalam 5 menit.',
                    badgeText: 'SNOOZE',
                  });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.alarmSnoozeBtnText}>Tunda 5 Menit (Snooze)</Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
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

  // Reminders List
  listContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  reminderCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reminderCardDisabled: {
    backgroundColor: '#F8F9FA',
    borderColor: '#EFEFEF',
    opacity: 0.72,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    color: Colors.text,
  },
  timeTextDisabled: {
    color: Colors.textMuted,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
  },

  cardBody: {
    marginBottom: 12,
  },
  reminderTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 3,
  },
  reminderTitleDisabled: {
    color: Colors.textMuted,
  },
  reminderNotes: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  reminderNotesDisabled: {
    color: Colors.textMuted,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  repeatText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  textAreaInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  typeSelectBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  repeatOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repeatOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  repeatOptionChipActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  repeatOptionChipText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  repeatOptionChipTextActive: {
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


  // Alarm Ringing Modal
  alarmModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alarmModalCard: {
    width: Math.min(SCREEN_WIDTH - 48, 340),
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 12,
  },
  alarmPulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  alarmPulseInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmRingingSubtitle: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: '#EF4444',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  alarmRingingTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 18,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  alarmRingingTime: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  alarmRingingDesc: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  alarmModalActionCol: {
    width: '100%',
    gap: 10,
  },
  alarmDismissBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmDismissBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  alarmSnoozeBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmSnoozeBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#475569',
  },
});
