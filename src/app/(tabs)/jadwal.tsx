import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { Colors, Fonts } from '@/constants/theme';
import { DayOfWeek, ScheduleItem } from '@/types';
import { FileExportService } from '@/services/fileExport';
import { EmptyState } from '@/components/EmptyState';
import { CuteCharacter, CharacterType } from '@/components/CuteCharacter';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { ModernAlertModal, AlertType } from '@/components/ModernAlertModal';
import { FormInput } from '@/components/FormInput';

const DAYS: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Exact color palette matching the 4 cards in the user reference image
const PRESET_COLORS = [
  '#6284F6', // Card 1: Purple / Periwinkle (Culture)
  '#FF5733', // Card 2: Coral / Red-Orange (History)
  '#FDCB44', // Card 3: Warm Mustard Yellow (Math)
  '#10B981', // Card 4: Emerald Green (Literature)
  '#9A82F7', // Card 5: Soft Lavender
  '#06B6D4', // Card 6: Ocean Cyan
  '#EC4899', // Card 7: Berry Pink
];

// Helper to pick cute subject icon
function getSubjectIcon(subject: string): keyof typeof Ionicons.glyphMap {
  const s = subject.toLowerCase();
  if (s.includes('matematika') || s.includes('math') || s.includes('kalkulus') || s.includes('aljabar')) {
    return 'school-outline';
  }
  if (s.includes('sejarah') || s.includes('history')) {
    return 'receipt-outline';
  }
  if (s.includes('budaya') || s.includes('culture') || s.includes('geografi') || s.includes('sosiologi')) {
    return 'star-outline';
  }
  if (s.includes('bahasa') || s.includes('sastra') || s.includes('literature') || s.includes('indonesia') || s.includes('inggris')) {
    return 'book-outline';
  }
  if (s.includes('fisika') || s.includes('kimia') || s.includes('biologi') || s.includes('science') || s.includes('ipa')) {
    return 'flask-outline';
  }
  if (s.includes('komputer') || s.includes('informatika') || s.includes('it') || s.includes('coding') || s.includes('web') || s.includes('mobile')) {
    return 'laptop-outline';
  }
  if (s.includes('seni') || s.includes('art') || s.includes('musik')) {
    return 'color-palette-outline';
  }
  return 'school-outline';
}

// Teacher character avatars rotation
const TEACHER_AVATARS: CharacterType[] = ['smart', 'calm', 'zen', 'cheer', 'focused'];

export default function JadwalScreen() {
  const router = useRouter();
  const { schedules, profile, addSchedule, updateSchedule, deleteSchedule } = useApp();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Senin');

  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeItem, setActiveItem] = useState<ScheduleItem | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<ScheduleItem | null>(null);

  // Form state
  const [subject, setSubject] = useState('');
  const [day, setDay] = useState<DayOfWeek>('Senin');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');
  const [teacher, setTeacher] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  // Styled Alert modal state
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

  const filteredSchedules = schedules
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const openAddModal = () => {
    setEditingItem(null);
    setSubject('');
    setDay(selectedDay);
    setStartTime('08:00');
    setEndTime('09:30');
    setRoom('');
    setTeacher('');
    setColor(PRESET_COLORS[filteredSchedules.length % PRESET_COLORS.length]);
    setModalVisible(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setDetailModalVisible(false);
    setEditingItem(item);
    setSubject(item.subject);
    setDay(item.day);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setRoom(item.room);
    setTeacher(item.teacher);
    setColor(item.color);
    setModalVisible(true);
  };

  const handleCardPress = (item: ScheduleItem) => {
    setActiveItem(item);
    setDetailModalVisible(true);
  };

  const handleSave = async () => {
    if (!subject.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setAlertInfo({
        visible: true,
        type: 'warning',
        title: 'Bidang Wajib Diisi',
        message: 'Silakan masukkan nama mata pelajaran terlebih dahulu sebelum menyimpan.',
      });
      return;
    }

    if (editingItem) {
      await updateSchedule({
        ...editingItem,
        subject,
        day,
        startTime,
        endTime,
        room: room || 'Ruang Kelas',
        teacher: teacher || 'Guru Pengampu',
        color,
      });
    } else {
      await addSchedule({
        subject,
        day,
        startTime: startTime || '08:00',
        endTime: endTime || '09:30',
        room: room || 'Ruang Kelas',
        teacher: teacher || 'Guru Pengampu',
        color,
      });
    }

    setModalVisible(false);
  };

  const handleDelete = (item: ScheduleItem) => {
    if (!item) return;
    setDeletingSchedule(item);
  };

  const confirmDeleteSchedule = async () => {
    if (!deletingSchedule) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics optional
    }
    const item = deletingSchedule;
    setDeletingSchedule(null);
    setDetailModalVisible(false);
    setActiveItem(null);
    await deleteSchedule(item.id);
  };

  const handleDownloadSchedule = async () => {
    Haptics.selectionAsync().catch(() => {});
    await FileExportService.downloadSchedule(schedules);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header matching reference image */}
      <View style={styles.topHeader}>
        <View style={styles.greetingCol}>
          <Text style={styles.greetingText}>Good morning,</Text>
          <Text style={styles.userNameText}>{profile.name}!</Text>
        </View>

        <View style={styles.headerActionRow}>
          <TouchableOpacity
            style={styles.headerCircleBtn}
            onPress={handleDownloadSchedule}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={19} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerCircleBtn}
            onPress={() => router.push('/notifikasi' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerCircleBtn}
            onPress={openAddModal}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter / Segmented Pills Bar matching reference */}
      <View style={styles.pillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {/* Add. class pill */}
          <TouchableOpacity
            style={styles.addPillBtn}
            onPress={openAddModal}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={15} color={Colors.primary} />
            <Text style={styles.addPillText}>Add. class</Text>
          </TouchableOpacity>

          {/* Days Pills */}
          {DAYS.map((d) => {
            const isSelected = d === selectedDay;
            const count = schedules.filter((s) => s.day === d).length;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dayPill, isSelected && styles.dayPillActive]}
                onPress={() => setSelectedDay(d)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dayPillText, isSelected && styles.dayPillTextActive]}>
                  {d}
                </Text>
                {count > 0 && (
                  <View style={[styles.countBadge, isSelected && styles.countBadgeActive]}>
                    <Text style={[styles.countText, isSelected && styles.countTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2-Column Subject Grid matching reference */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredSchedules.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              icon="calendar-outline"
              title={`Tidak Ada Jadwal Hari ${selectedDay}`}
              description="Tambahkan mata pelajaran untuk hari ini agar jadwal kelas Anda tertata rapi."
              actionLabel="Tambah Kelas"
              onAction={openAddModal}
            />
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredSchedules.map((item, index) => {
              const cardBg = item.color || PRESET_COLORS[index % PRESET_COLORS.length];
              const teacherAvatar = TEACHER_AVATARS[index % TEACHER_AVATARS.length];

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.subjectCard, { backgroundColor: cardBg }]}
                  onPress={() => handleCardPress(item)}
                  activeOpacity={0.9}
                >
                  {/* Top row: Subject Icon badge & Bookmark */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.iconBadge}>
                      <Ionicons
                        name={getSubjectIcon(item.subject)}
                        size={18}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.roomBadge}>
                      <Ionicons
                        name="bookmark-outline"
                        size={14}
                        color="rgba(255,255,255,0.85)"
                      />
                    </View>
                  </View>

                  {/* Cutout notch with arrow on the right edge */}
                  <View style={styles.notchWrapper} pointerEvents="none">
                    <Svg width={40} height={68} viewBox="0 0 40 68" style={StyleSheet.absoluteFill}>
                      <Path
                        d="M 32 0 Q 32 12, 24 12 A 22 22 0 0 0 24 56 Q 32 56, 32 68 L 40 68 L 40 0 Z"
                        fill={Colors.background}
                      />
                    </Svg>
                    <View style={styles.notchArrowCircle}>
                      <Ionicons
                        name="arrow-up"
                        size={17}
                        color={cardBg}
                        style={{ transform: [{ rotate: '45deg' }] }}
                      />
                    </View>
                  </View>

                  {/* Bottom section: Subject title, time & teacher info */}
                  <View style={styles.cardBottom}>
                    <Text style={styles.subjectTitle} numberOfLines={2}>
                      {item.subject}
                    </Text>

                    <Text style={styles.timeText} numberOfLines={1}>
                      {item.startTime} - {item.endTime}
                    </Text>

                    <View style={styles.teacherRow}>
                      <View style={styles.teacherAvatar}>
                        <CuteCharacter type={teacherAvatar} size={22} />
                      </View>
                      <View style={styles.teacherTextCol}>
                        <Text style={styles.teacherPrefix}>Teacher:</Text>
                        <Text style={styles.teacherName} numberOfLines={1}>
                          {item.teacher}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Class Detail Sheet Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.detailModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDetailModalVisible(false)}
          />
          <View style={styles.detailSheetContent}>
            {activeItem && (
              <>
                <View style={[styles.detailHeaderBar, { backgroundColor: activeItem.color }]}>
                  <View style={styles.detailDragHandle} />
                  <View style={styles.detailHeaderTop}>
                    <View style={styles.detailIconBox}>
                      <Ionicons name={getSubjectIcon(activeItem.subject)} size={24} color="#FFFFFF" />
                    </View>
                    <TouchableOpacity
                      onPress={() => setDetailModalVisible(false)}
                      style={styles.detailCloseBtn}
                    >
                      <Ionicons name="close" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.detailTitle}>{activeItem.subject}</Text>
                  <Text style={styles.detailDayTime}>
                    {activeItem.day} • {activeItem.startTime} - {activeItem.endTime}
                  </Text>
                </View>

                <View style={styles.detailBody}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconCircle}>
                      <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>Ruang Kelas / Lokasi</Text>
                      <Text style={styles.detailValue}>{activeItem.room}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconCircle}>
                      <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>Guru / Dosen Pengampu</Text>
                      <Text style={styles.detailValue}>{activeItem.teacher}</Text>
                    </View>
                  </View>

                  {/* Actions: Edit & Delete */}
                  <View style={styles.detailActionRow}>
                    <TouchableOpacity
                      style={styles.editActionBtn}
                      onPress={() => openEditModal(activeItem)}
                    >
                      <Ionicons name="create-outline" size={18} color={Colors.white} />
                      <Text style={styles.editActionText}>Ubah Jadwal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteActionBtn}
                      onPress={() => handleDelete(activeItem)}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add / Edit Form Modal (Refined Bottom Sheet) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          enabled={Platform.OS === 'ios'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            {/* Elegant drag handle pill at top */}
            <View style={styles.dragHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Jadwal Kelas' : 'Tambah Kelas Baru'}
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
              contentContainerStyle={styles.formScrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              bounces={false}
            >
              <FormInput
                label="Mata Pelajaran"
                required
                icon="book-outline"
                placeholder="Contoh: Mathematics / Sejarah"
                value={subject}
                onChangeText={setSubject}
                onClear={() => setSubject('')}
              />

              <Text style={styles.label}>Hari Belajar</Text>
              <View style={styles.daySelectorRow}>
                {DAYS.map((d) => {
                  const isActive = day === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.smallDayBtn, isActive && styles.smallDayBtnActive]}
                      onPress={() => setDay(d)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.smallDayText,
                          isActive && styles.smallDayTextActive,
                        ]}
                      >
                        {d.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Jam Mulai</Text>
                  <View style={styles.timeInputContainer}>
                    <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                    <TextInput
                      style={styles.timeTextInput}
                      placeholder="08:00"
                      placeholderTextColor={Colors.textMuted}
                      cursorColor={Colors.primary}
                      value={startTime}
                      onChangeText={setStartTime}
                      blurOnSubmit={false}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Jam Selesai</Text>
                  <View style={styles.timeInputContainer}>
                    <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                    <TextInput
                      style={styles.timeTextInput}
                      placeholder="09:30"
                      placeholderTextColor={Colors.textMuted}
                      cursorColor={Colors.primary}
                      value={endTime}
                      onChangeText={setEndTime}
                      blurOnSubmit={false}
                    />
                  </View>
                </View>
              </View>

              <FormInput
                label="Ruangan / Laboratorium"
                icon="location-outline"
                placeholder="Contoh: Lab Komputer / Ruang 302"
                value={room}
                onChangeText={setRoom}
                onClear={() => setRoom('')}
              />

              <FormInput
                label="Guru / Dosen Pengampu"
                icon="person-outline"
                placeholder="Contoh: Amy Adams, M.Pd"
                value={teacher}
                onChangeText={setTeacher}
                onClear={() => setTeacher('')}
              />

              <Text style={styles.label}>Pilih Warna Kartu</Text>
              <View style={styles.colorRow}>
                {PRESET_COLORS.map((c) => {
                  const isColorSelected = color === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorCircleWrapper,
                        isColorSelected && styles.colorCircleWrapperActive,
                      ]}
                      onPress={() => setColor(c)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.colorCircle, { backgroundColor: c }]}>
                        {isColorSelected && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={c === '#FDCB44' ? '#141416' : Colors.white}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan ke Jadwal'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDeleteModal
        visible={Boolean(deletingSchedule)}
        title="Hapus Jadwal?"
        itemName={deletingSchedule?.subject}
        onConfirm={confirmDeleteSchedule}
        onCancel={() => setDeletingSchedule(null)}
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
    paddingBottom: 130, // Room for floating dock
  },

  // Top Header (Good morning, Anna Lane!)
  topHeader: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
  },
  greetingCol: {
    flex: 1,
  },
  greetingText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  userNameText: {
    fontFamily: Fonts.extraBold,
    fontSize: 26,
    color: Colors.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },

  // Pills Row
  pillsWrapper: {
    paddingBottom: 10,
    backgroundColor: Colors.background,
  },
  pillsScroll: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  addPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  addPillText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.text,
  },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  dayPillActive: {
    backgroundColor: '#6284F6', // Reference signature lessons purple
    borderColor: '#6284F6',
  },
  dayPillText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dayPillTextActive: {
    color: Colors.white,
  },
  countBadge: {
    backgroundColor: '#ECE7DD',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  countTextActive: {
    color: Colors.white,
  },

  emptyWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // 2-Column Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  subjectCard: {
    width: '48%',
    minHeight: 224, // Generous height so teacher row never clips
    borderRadius: 28, // Sudut tumpul semua
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cutout notch with arrow on the right edge (C1 smooth rounded fillets)
  notchWrapper: {
    position: 'absolute',
    right: -8,
    top: 72,
    width: 40,
    height: 68,
    zIndex: 10,
  },
  notchArrowCircle: {
    position: 'absolute',
    left: 8,
    top: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom text section of card
  cardBottom: {
    marginTop: 8,
  },
  subjectTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  timeText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 3,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
  },
  teacherAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  teacherTextCol: {
    flex: 1,
  },
  teacherPrefix: {
    fontFamily: Fonts.medium,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 11,
  },
  teacherName: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },

  // Detail Sheet Modal
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  detailSheetContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  detailHeaderBar: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 20,
  },
  detailDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  detailHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    color: Colors.white,
    letterSpacing: -0.4,
  },
  detailDayTime: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  detailBody: {
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
    backgroundColor: '#F8F6F2',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.text,
    marginTop: 2,
  },
  detailActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  editActionBtn: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
  },
  editActionText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.white,
  },
  deleteActionBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Add / Edit Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    maxHeight: '90%',
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
  formScrollContent: {
    paddingBottom: 16,
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
  daySelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  smallDayBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8F6F2',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallDayBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  smallDayText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  smallDayTextActive: {
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F6F2',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  timeTextInput: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
    height: '100%',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  colorCircleWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleWrapperActive: {
    borderColor: Colors.text,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  saveBtnText: {
    fontFamily: Fonts.bold,
    color: Colors.white,
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
