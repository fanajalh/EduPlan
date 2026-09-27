import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { Colors, Fonts } from '@/constants/theme';
import { TaskItem, TaskPriority } from '@/types';
import { FileExportService } from '@/services/fileExport';
import { EmptyState } from '@/components/EmptyState';
import { CuteCharacter } from '@/components/CuteCharacter';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { ModernAlertModal, AlertType } from '@/components/ModernAlertModal';
import { FormInput } from '@/components/FormInput';
import { notificationService } from '@/services/notificationService';

function getPriorityColor(priority: TaskPriority) {
  switch (priority) {
    case 'tinggi':
      return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' };
    case 'sedang':
      return { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' };
    case 'rendah':
      return { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' };
    default:
      return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
  }
}

function formatDeadline(dateStr: string) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const day = parseInt(parts[2], 10);
      const month = months[parseInt(parts[1], 10) - 1];
      return `${day} ${month}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function getPriorityDotColor(priority: TaskPriority) {
  switch (priority) {
    case 'tinggi':
      return '#EF4444';
    case 'sedang':
      return '#F59E0B';
    case 'rendah':
      return '#10B981';
    default:
      return '#94A3B8';
  }
}

export default function DaftarTugasScreen() {
  const router = useRouter();
  const { tasks, addTask, updateTask, deleteTask, toggleTaskCompleted } = useApp();

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [editingItem, setEditingItem] = useState<TaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<{ id: string; title: string } | null>(null);

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

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'pending' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchSubject = task.subject.toLowerCase().includes(q);
      return matchTitle || matchSubject;
    }

    return true;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

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

  const openEditModal = (task: TaskItem) => {
    setEditingItem(task);
    setTitle(task.title);
    setSubject(task.subject);
    setDeadline(task.deadline);
    setDeadlineTime(task.deadlineTime || '23:59');
    setPriority(task.priority);
    setNotes(task.notes || '');
    setDetailModalVisible(false);
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
    if (!subject.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setAlertInfo({
        visible: true,
        type: 'warning',
        title: 'Bidang Wajib Diisi',
        message: 'Silakan masukkan nama mata pelajaran untuk tugas ini.',
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (editingItem) {
      const updated: TaskItem = {
        ...editingItem,
        title: title.trim(),
        subject: subject.trim(),
        deadline: deadline.trim() || todayStr,
        deadlineTime: deadlineTime.trim() || '23:59',
        priority,
        notes: notes.trim(),
      };
      await updateTask(updated);
    } else {
      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        title: title.trim(),
        subject: subject.trim(),
        deadline: deadline.trim() || todayStr,
        deadlineTime: deadlineTime.trim() || '23:59',
        priority,
        completed: false,
        notes: notes.trim(),
        createdAt: todayStr,
      };
      await addTask(newTask);
    }

    setModalVisible(false);
  };

  const handleDelete = (id: string, taskTitle: string) => {
    setDeletingTask({ id, title: taskTitle });
  };

  const confirmDeleteTask = async () => {
    if (!deletingTask) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics optional
    }
    const { id } = deletingTask;
    setDeletingTask(null);
    await deleteTask(id);
    setDetailModalVisible(false);
    setSelectedTask(null);
  };

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const targetTask = tasks.find((t) => t.id === id);
    const wasCompleted = targetTask?.completed;
    toggleTaskCompleted(id);

    if (targetTask && !wasCompleted) {
      notificationService.sendHeadsUpNotification({
        type: 'payment',
        title: `+100 XP: ${targetTask.title}`,
        subtitle: 'Tugas Selesai',
        body: `Tugas ${targetTask.subject} tuntas. Poin kemajuan telah ditambahkan!`,
        badgeText: 'POIN PRESTASI',
        route: '/daftar-tugas',
      });
    }
  };

  const handleBackNavigation = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/tugas');
    }
  };

  const handleDownloadTasks = async () => {
    Haptics.selectionAsync().catch(() => {});
    await FileExportService.downloadTaskList(tasks);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header Bar (Home Style) */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={handleBackNavigation}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={styles.backCircleBtn}
            onPress={handleDownloadTasks}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={20} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addCircleBtn}
            onPress={openAddModal}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Editorial Headline (Home Screen Aesthetic) */}
        <View style={styles.headlineWrapper}>
          <View style={styles.headlineHiRow}>
            <Text style={styles.headlineHi}>Daftar Tugas</Text>
            <CuteCharacter type="cheer" size={32} />
          </View>
          <Text style={styles.headlineQuestion}>
            Kelola tugas & <Text style={styles.headlineBold}>target belajarmu</Text>
          </Text>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari tugas atau mata pelajaran..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Dual Mindful Moments Cards */}
        <View style={styles.momentsGrid}>
          {/* Card 1: Warm Sun Yellow */}
          <TouchableOpacity
            style={[styles.momentCard, { backgroundColor: Colors.sunYellow }]}
            onPress={() => setStatusFilter('pending')}
            activeOpacity={0.88}
          >
            <View>
              <Text style={styles.momentTitle}>Belum Selesai{'\n'}& Perlu Aksi</Text>
              <Text style={styles.momentSub}>{pendingCount} tugas tersisa</Text>
            </View>
            <View style={styles.momentBottom}>
              <CuteCharacter type="eyes" size={42} />
              <View style={styles.arrowCircle}>
                <Ionicons name="arrow-up" size={16} color={Colors.text} style={{ transform: [{ rotate: '45deg' }] }} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 2: Periwinkle Blue */}
          <TouchableOpacity
            style={[styles.momentCard, { backgroundColor: Colors.periwinkle }]}
            onPress={() => setStatusFilter('completed')}
            activeOpacity={0.88}
          >
            <View>
              <Text style={[styles.momentTitle, { color: '#FFFFFF' }]}>Tuntas Selesai{'\n'}& Sukses</Text>
              <Text style={[styles.momentSub, { color: 'rgba(255,255,255,0.85)' }]}>
                {completedCount} tugas beres
              </Text>
            </View>
            <View style={styles.momentBottom}>
              <CuteCharacter type="calm" size={42} />
              <View style={styles.arrowCircle}>
                <Ionicons name="checkmark" size={17} color={Colors.text} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Status Filter Chips Row */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Semua Tugas</Text>
          <Text style={styles.sectionCount}>{filteredTasks.length} Item</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
            onPress={() => setStatusFilter('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
              Semua ({tasks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'pending' && styles.filterChipActive]}
            onPress={() => setStatusFilter('pending')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, statusFilter === 'pending' && styles.filterChipTextActive]}>
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'completed' && styles.filterChipActive]}
            onPress={() => setStatusFilter('completed')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, statusFilter === 'completed' && styles.filterChipTextActive]}>
              Selesai ({completedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, priorityFilter === 'tinggi' && styles.filterChipActive]}
            onPress={() => setPriorityFilter(priorityFilter === 'tinggi' ? 'all' : 'tinggi')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, priorityFilter === 'tinggi' && styles.filterChipTextActive]}>
              Prioritas Tinggi
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon="checkbox-outline"
            title="Tidak Ada Tugas"
            description="Semua tugas pada kategori ini telah selesai atau belum ditambahkan."
            actionLabel="Tambah Tugas Baru"
            onAction={openAddModal}
          />
        ) : (
          <View style={styles.taskList}>
            {filteredTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
                onPress={() => {
                  setSelectedTask(task);
                  setDetailModalVisible(true);
                }}
                activeOpacity={0.88}
              >
                {/* Left Checkbox */}
                <TouchableOpacity
                  style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
                  onPress={() => handleToggle(task.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {task.completed && (
                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                {/* Task Content - Clean & Uncluttered */}
                <View style={styles.taskInfo}>
                  <Text
                    style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>

                  <View style={styles.taskMetaRow}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityDotColor(task.priority) },
                      ]}
                    />
                    <Text style={styles.taskSubtext}>
                      {task.subject} • {formatDeadline(task.deadline)}
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Task Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDetailModalVisible(false)}
          />
          {selectedTask && (
            <View style={styles.modalContent}>
              <View style={styles.dragHandle} />
              <View style={styles.modalHeader}>
                <View style={styles.subjectPill}>
                  <Text style={styles.subjectPillText}>{selectedTask.subject}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setDetailModalVisible(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.detailTitle}>{selectedTask.title}</Text>

              <View style={styles.detailMetaGrid}>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.detailMetaLabel}>Batas Waktu</Text>
                  <Text style={styles.detailMetaVal}>
                    {selectedTask.deadline} • {selectedTask.deadlineTime || '23:59'}
                  </Text>
                </View>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.detailMetaLabel}>Prioritas</Text>
                  <Text style={[styles.detailMetaVal, { color: getPriorityColor(selectedTask.priority).text }]}>
                    {selectedTask.priority.toUpperCase()}
                  </Text>
                </View>
              </View>

              {selectedTask.notes ? (
                <View style={styles.detailNotesBox}>
                  <Text style={styles.detailNotesLabel}>Catatan Tambahan:</Text>
                  <Text style={styles.detailNotesText}>{selectedTask.notes}</Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.detailActionsRow}>
                <TouchableOpacity
                  style={[styles.detailPrimaryBtn, selectedTask.completed && styles.detailBtnReopen]}
                  onPress={() => {
                    handleToggle(selectedTask.id);
                    setDetailModalVisible(false);
                  }}
                  activeOpacity={0.88}
                >
                  <Ionicons
                    name={selectedTask.completed ? 'refresh-outline' : 'checkmark-circle-outline'}
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.detailPrimaryBtnText}>
                    {selectedTask.completed ? 'Buka Kembali' : 'Tandai Selesai'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailEditBtn}
                  onPress={() => openEditModal(selectedTask)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="create-outline" size={18} color={Colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailDeleteBtn}
                  onPress={() => handleDelete(selectedTask.id, selectedTask.title)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Add / Edit Task Modal (Home Style) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
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
                <Ionicons name="close" size={20} color={Colors.text} />
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
                placeholder="Contoh: Latihan Soal Bab 4..."
                value={title}
                onChangeText={setTitle}
                onClear={() => setTitle('')}
              />

              <FormInput
                label="Mata Pelajaran"
                required
                icon="book-outline"
                placeholder="Contoh: Matematika, Fisika, Biologi..."
                value={subject}
                onChangeText={setSubject}
                onClear={() => setSubject('')}
              />

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <FormInput
                    label="Tenggat Tanggal"
                    icon="calendar-outline"
                    placeholder="YYYY-MM-DD"
                    value={deadline}
                    onChangeText={setDeadline}
                  />
                </View>
                <View style={styles.formHalf}>
                  <FormInput
                    label="Jam (HH:mm)"
                    icon="time-outline"
                    placeholder="23:59"
                    value={deadlineTime}
                    onChangeText={setDeadlineTime}
                  />
                </View>
              </View>

              <Text style={styles.label}>Prioritas</Text>
              <View style={styles.prioritySelectorRow}>
                {(['rendah', 'sedang', 'tinggi'] as TaskPriority[]).map((p) => {
                  const isSelected = priority === p;
                  const pStyle = getPriorityColor(p);
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityOptionBtn,
                        isSelected && { backgroundColor: pStyle.bg, borderColor: pStyle.text, borderWidth: 1.5 },
                      ]}
                      onPress={() => setPriority(p)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.priorityOptionText,
                          isSelected && { color: pStyle.text, fontFamily: Fonts.bold },
                        ]}
                      >
                        {p.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Catatan Tambahan (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Instruksi pengerjaan, bab, link materi..."
                placeholderTextColor={Colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.88}
              >
                <Text style={styles.saveBtnText}>
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Tugas'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmDeleteModal
        visible={Boolean(deletingTask)}
        title="Hapus Tugas?"
        itemName={deletingTask?.title}
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeletingTask(null)}
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
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 60,
  },

  // TOP HEADER (Home Style)
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: Colors.background,
  },
  backCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },

  // EDITORIAL HEADLINE (Home Screen Match)
  headlineWrapper: {
    marginBottom: 20,
    marginTop: 6,
  },
  headlineHiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  headlineHi: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  headlineQuestion: {
    fontFamily: Fonts.extraBold,
    fontSize: 28,
    lineHeight: 36,
    color: Colors.text,
    letterSpacing: -0.6,
  },
  headlineBold: {
    fontFamily: Fonts.extraBold,
    color: Colors.primary,
  },

  // SEARCH BOX
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.text,
  },

  // DUAL MINDFUL MOMENTS CARDS (Home Match)
  momentsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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

  // FILTER STRIP (Home Style)
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  filterChipText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.text,
  },
  filterChipTextActive: {
    fontFamily: Fonts.bold,
    color: Colors.white,
  },

  // TASK LIST
  taskList: {
    gap: 10,
  },
  taskCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskCardCompleted: {
    opacity: 0.65,
    backgroundColor: '#FAFAFA',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxCompleted: {
    backgroundColor: Colors.mintGreen,
    borderColor: Colors.mintGreen,
  },
  taskInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  taskTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  taskSubtext: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: '#64748B',
  },
  subjectPill: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectPillText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: '#0F172A',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
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
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    color: Colors.text,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formHalf: {
    flex: 1,
  },
  prioritySelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityOptionText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  saveBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.white,
  },

  // DETAIL MODAL
  detailTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  detailMetaGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailMetaItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailMetaLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailMetaVal: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.text,
  },
  detailNotesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  detailNotesLabel: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.text,
    marginBottom: 4,
  },
  detailNotesText: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  detailPrimaryBtn: {
    flex: 1,
    backgroundColor: Colors.mintGreen,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBtnReopen: {
    backgroundColor: Colors.primary,
  },
  detailPrimaryBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.white,
  },
  detailEditBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailDeleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
