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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { Colors, Fonts } from '@/constants/theme';
import { CuteCharacter, CharacterType } from '@/components/CuteCharacter';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { ModernAlertModal, AlertType } from '@/components/ModernAlertModal';
import { FormInput } from '@/components/FormInput';
import { FileExportService } from '@/services/fileExport';
import { syncWidgetsData } from '@/widgets/widgetSync';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATAR_OPTIONS: { id: CharacterType; label: string }[] = [
  { id: 'avatar', label: 'Pelajar' },
  { id: 'calm', label: 'Tenang' },
  { id: 'happy', label: 'Bahagia' },
  { id: 'sad', label: 'Lelah' },
  { id: 'dizzy', label: 'Puyeng' },
  { id: 'smart', label: 'Fokus' },
  { id: 'cheer', label: 'Ceria' },
  { id: 'zen', label: 'Santai' },
  { id: 'focused', label: 'Tekun' },
];

export default function ProfilScreen() {
  const router = useRouter();
  const {
    profile,
    updateProfile,
    resetToDemoData,
    tasks,
    habits,
    schedules,
    notes,
    materials,
    reminders,
    exportDatabaseBackup,
    importDatabaseBackup,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [storageModalVisible, setStorageModalVisible] = useState(false);
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [pastedJson, setPastedJson] = useState('');

  // Styled alert state
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    confirmText?: string;
    cancelText?: string;
    onConfirmAction?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'warning',
  });

  // Edit form states
  const [name, setName] = useState(profile.name);
  const [school, setSchool] = useState(profile.school);
  const [major, setMajor] = useState(profile.major);
  const [grade, setGrade] = useState(profile.grade);
  const [studentId, setStudentId] = useState(profile.studentId);
  const [bio, setBio] = useState(profile.bio);
  const [selectedAvatar, setSelectedAvatar] = useState<CharacterType>(
    (profile.character as CharacterType) || 'avatar'
  );

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/menu');
    }
  };

  const openEditModal = () => {
    setName(profile.name);
    setSchool(profile.school);
    setMajor(profile.major);
    setGrade(profile.grade);
    setStudentId(profile.studentId);
    setBio(profile.bio);
    setSelectedAvatar((profile.character as CharacterType) || 'avatar');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setAlertInfo({
        visible: true,
        type: 'warning',
        title: 'Bidang Wajib Diisi',
        message: 'Nama lengkap tidak boleh kosong.',
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await updateProfile({
      ...profile,
      name: name.trim(),
      school: school.trim(),
      major: major.trim(),
      grade: grade.trim(),
      studentId: studentId.trim(),
      bio: bio.trim(),
      character: selectedAvatar,
    });

    setModalVisible(false);
  };

  const handlePickBackupFile = async () => {
    try {
      Haptics.selectionAsync().catch(() => {});
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await processBackupJson(content);
    } catch (err) {
      console.warn('Error picking backup file:', err);
      setAlertInfo({
        visible: true,
        type: 'error',
        title: 'Gagal Membaca Berkas',
        message: 'Tidak dapat membuka berkas cadangan yang dipilih.',
      });
    }
  };

  const processBackupJson = async (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON format');
      }

      const schedCount = Array.isArray(parsed.schedules) ? parsed.schedules.length : 0;
      const taskCount = Array.isArray(parsed.tasks) ? parsed.tasks.length : 0;
      const matCount = Array.isArray(parsed.materials) ? parsed.materials.length : 0;
      const noteCount = Array.isArray(parsed.notes) ? parsed.notes.length : 0;
      const remCount = Array.isArray(parsed.reminders) ? parsed.reminders.length : 0;

      const summaryText = `Ditemukan data cadangan:\n• ${schedCount} Jadwal Kelas\n• ${taskCount} Tugas & PR\n• ${matCount} Materi Belajar\n• ${noteCount} Catatan\n• ${remCount} Pengingat\n\nApakah Anda ingin memulihkan dan mengganti data lokal saat ini dengan data cadangan ini?`;

      setAlertInfo({
        visible: true,
        type: 'info',
        title: 'Pulihkan Cadangan Data?',
        message: summaryText,
        confirmText: 'Terapkan Sekarang',
        cancelText: 'Batal',
        onConfirmAction: async () => {
          setAlertInfo((prev) => ({ ...prev, visible: false }));
          const ok = await importDatabaseBackup(jsonString);
          if (ok) {
            syncWidgetsData();
            setStorageModalVisible(false);
            setPasteModalVisible(false);
            setPastedJson('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            setTimeout(() => {
              setAlertInfo({
                visible: true,
                type: 'success',
                title: 'Data Berhasil Dipulihkan 🎉',
                message: 'Seluruh jadwal, tugas, catatan, dan profil Anda telah diperbarui dari cadangan.',
              });
            }, 350);
          } else {
            setAlertInfo({
              visible: true,
              type: 'error',
              title: 'Gagal Memulihkan Data',
              message: 'Format data berkas cadangan tidak valid atau rusak.',
            });
          }
        },
      });
    } catch {
      setAlertInfo({
        visible: true,
        type: 'error',
        title: 'Format Tidak Valid',
        message: 'Teks atau berkas yang Anda pilih bukan berkas cadangan EduPlaner yang valid.',
      });
    }
  };

  const handleResetData = () => {
    setShowResetModal(true);
  };

  const confirmResetData = async () => {
    setShowResetModal(false);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Haptics optional
    }
    await resetToDemoData();
  };

  const handleShowStorageInfo = () => {
    Haptics.selectionAsync().catch(() => {});
    setStorageModalVisible(true);
  };

  const handleReplaySplash = async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      await AsyncStorage.removeItem('@eduplaner_has_seen_splash');
    } catch {}
    router.replace('/');
  };

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0;
  const totalRecords =
    tasks.length +
    schedules.length +
    notes.length +
    materials.length +
    habits.length +
    reminders.length;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#2354F6" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Curved Hero Section (Clean Solid Blue, no glow/shadow) */}
        <View style={styles.heroContainer}>
          <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
            {/* Top Navigation Bar */}
            <View style={styles.heroTopBar}>
              <TouchableOpacity
                onPress={handleGoBack}
                style={styles.heroNavBtn}
                activeOpacity={0.75}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openEditModal}
                style={styles.heroNavBtn}
                activeOpacity={0.75}
              >
                <Ionicons name="create-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Simple Profile Info */}
            <View style={styles.heroContent}>
              <Text style={styles.heroName} numberOfLines={1}>
                {profile.name}
              </Text>
              <Text style={styles.heroSubtitle} numberOfLines={1}>
                {profile.bio || (profile.grade ? `Siswa • ${profile.grade}` : 'Pelajar')}
              </Text>
            </View>
          </SafeAreaView>
        </View>

        {/* Circular Avatar Overlapping the Blue Boundary */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarBorderRing}>
            <CuteCharacter type={(profile.character as CharacterType) || 'avatar'} size={82} />
          </View>
        </View>

        {/* 3-Column Key Stats Row (Simple & Punchy) */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{schedules.length}</Text>
            <Text style={styles.statLabel}>Jadwal</Text>
          </View>

          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{completedTasksCount}</Text>
            <Text style={styles.statLabel}>Tugas Selesai</Text>
          </View>

          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{bestStreak} Hari</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* Clean & Simple Menu List */}
        <View style={styles.menuContainer}>
          {/* Item 1: Identitas & Sekolah */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={openEditModal}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="person" size={20} color="#2563EB" />
              </View>
              <Text style={styles.menuTitle}>Identitas & Sekolah</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.itemSeparator} />

          {/* Item 2: Target Akademik */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={openEditModal}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="trending-up" size={20} color="#10B981" />
              </View>
              <Text style={styles.menuTitle}>Target Akademik</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.itemSeparator} />

          {/* Item 3: Nomor Induk / NIM */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={openEditModal}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="card" size={20} color="#F97316" />
              </View>
              <Text style={styles.menuTitle}>Nomor Induk Siswa</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.itemSeparator} />

          {/* Item 4: Koleksi Modul & Catatan */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/materi')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="library" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.menuTitle}>Modul & Materi</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.itemSeparator} />

          {/* Item 5: Penyimpanan Lokal HP */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleShowStorageInfo}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="hardware-chip-outline" size={20} color="#2563EB" />
              </View>
              <Text style={styles.menuTitle}>Penyimpanan Lokal (Database HP)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.itemSeparator} />

          {/* Item 6: Lihat Splash & Onboarding */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleReplaySplash}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FDF4FF' }]}>
                <Ionicons name="sparkles" size={20} color="#C026D3" />
              </View>
              <Text style={styles.menuTitle}>Lihat Splash Animasi & Intro</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.itemSeparator} />

          {/* Item 7: Reset Data Demo */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="refresh" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.menuTitle, { color: '#EF4444' }]}>
                Reset Data Bawaan
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* App Version Footer */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerText}>EduPlaner • Versi 2.1.4</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profil Pelajar</Text>
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
              {/* Avatar Selector */}
              <Text style={styles.fieldLabel}>Pilih Karakter Avatar</Text>
              <View style={styles.avatarPickerRow}>
                {AVATAR_OPTIONS.map((item) => {
                  const isSelected = selectedAvatar === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.avatarOptionCard,
                        isSelected && styles.avatarOptionCardActive,
                      ]}
                      onPress={() => setSelectedAvatar(item.id)}
                      activeOpacity={0.8}
                    >
                      <CuteCharacter type={item.id} size={42} />
                      <Text
                        style={[
                          styles.avatarOptionLabel,
                          isSelected && styles.avatarOptionLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Name */}
              <FormInput
                label="Nama Lengkap"
                required
                icon="person-outline"
                value={name}
                onChangeText={setName}
                placeholder="Nama Anda"
                onClear={() => setName('')}
              />

              {/* School */}
              <FormInput
                label="Sekolah / Kampus"
                icon="school-outline"
                value={school}
                onChangeText={setSchool}
                placeholder="Nama institusi pendidikan"
                onClear={() => setSchool('')}
              />

              {/* Major & Grade */}
              <View style={styles.formRowTwo}>
                <View style={styles.formColHalf}>
                  <FormInput
                    label="Jurusan"
                    icon="book-outline"
                    value={major}
                    onChangeText={setMajor}
                    placeholder="Contoh: IPA / TI"
                    onClear={() => setMajor('')}
                  />
                </View>
                <View style={styles.formColHalf}>
                  <FormInput
                    label="Kelas / Semester"
                    icon="layers-outline"
                    value={grade}
                    onChangeText={setGrade}
                    placeholder="Contoh: Semester 4"
                    onClear={() => setGrade('')}
                  />
                </View>
              </View>

              {/* Student ID */}
              <FormInput
                label="NIS / NIM"
                icon="card-outline"
                value={studentId}
                onChangeText={setStudentId}
                placeholder="Nomor induk siswa"
                keyboardType="numeric"
                onClear={() => setStudentId('')}
              />

              {/* Bio / Motto */}
              <FormInput
                label="Motto / Status Belajar"
                icon="chatbubble-ellipses-outline"
                value={bio}
                onChangeText={setBio}
                placeholder="Contoh: Belajar dengan tekun & gembira"
                onClear={() => setBio('')}
              />

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.88}
              >
                <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmDeleteModal
        visible={showResetModal}
        title="Reset Data Demo?"
        message="Apakah Anda yakin ingin mengembalikan seluruh jadwal, tugas, materi, dan catatan ke data demo bawaan? Data Anda saat ini akan ditimpa."
        confirmLabel="Reset Ulang"
        cancelLabel="Batal"
        onConfirm={confirmResetData}
        onCancel={() => setShowResetModal(false)}
      />

      {/* Sleek Custom Storage & Database Modal Dialog */}
      <Modal
        visible={storageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStorageModalVisible(false)}
      >
        <View style={styles.storageModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setStorageModalVisible(false)}
          />
          <View style={styles.storageModalCard}>
            {/* Header */}
            <View style={styles.storageHeaderRow}>
              <View style={styles.storageHeaderIconWrap}>
                <Ionicons name="hardware-chip-outline" size={24} color="#2563EB" />
              </View>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={styles.storageModalTitle}>Database & Penyimpanan HP</Text>
              </View>
              <TouchableOpacity
                onPress={() => setStorageModalVisible(false)}
                style={styles.storageCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.storageModalDesc}>
              Semua data akademis dan aktivitas belajar Anda tersimpan lokal di memori internal smartphone tanpa memerlukan server luar.
            </Text>

            {/* 6-Grid Stats Cards */}
            <View style={styles.storageGrid}>
              <View style={styles.storageGridItem}>
                <View style={[styles.storageItemIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="checkbox-outline" size={16} color="#2563EB" />
                </View>
                <Text style={styles.storageItemNumber}>{tasks.length}</Text>
                <Text style={styles.storageItemLabel}>Tugas ({completedTasksCount} selesai)</Text>
              </View>

              <View style={styles.storageGridItem}>
                <View style={[styles.storageItemIconWrap, { backgroundColor: '#FFF0ED' }]}>
                  <Ionicons name="calendar-outline" size={16} color="#FF5733" />
                </View>
                <Text style={styles.storageItemNumber}>{schedules.length}</Text>
                <Text style={styles.storageItemLabel}>Jadwal Pelajaran</Text>
              </View>

              <View style={styles.storageGridItem}>
                <View style={[styles.storageItemIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="document-text-outline" size={16} color="#D97706" />
                </View>
                <Text style={styles.storageItemNumber}>{notes.length}</Text>
                <Text style={styles.storageItemLabel}>Catatan Materi</Text>
              </View>

              <View style={styles.storageGridItem}>
                <View style={[styles.storageItemIconWrap, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="library-outline" size={16} color="#9333EA" />
                </View>
                <Text style={styles.storageItemNumber}>{materials.length}</Text>
                <Text style={styles.storageItemLabel}>Modul Belajar</Text>
              </View>

              <View style={styles.storageGridItem}>
                <View style={[styles.storageItemIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="flame-outline" size={16} color="#059669" />
                </View>
                <Text style={styles.storageItemNumber}>{habits.length}</Text>
                <Text style={styles.storageItemLabel}>Kebiasaan Aktif</Text>
              </View>

              <View style={styles.storageGridItem}>
                <View style={[styles.storageItemIconWrap, { backgroundColor: '#FCE7F3' }]}>
                  <Ionicons name="notifications-outline" size={16} color="#DB2777" />
                </View>
                <Text style={styles.storageItemNumber}>{reminders.length}</Text>
                <Text style={styles.storageItemLabel}>Pengingat Belajar</Text>
              </View>
            </View>

            {/* Total Records Footer Bar */}
            <View style={styles.storageTotalBar}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.storageTotalText}>
                Total: <Text style={{ fontFamily: Fonts.bold, color: '#0F172A' }}>{totalRecords} item data</Text> tersimpan aman di internal HP.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.storageActionRow}>
              <TouchableOpacity
                style={styles.storageBackupBtn}
                activeOpacity={0.88}
                onPress={async () => {
                  try {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    const backup = await exportDatabaseBackup();
                    await FileExportService.downloadDatabaseBackup(backup);
                    setStorageModalVisible(false);
                  } catch {
                    setAlertInfo({
                      visible: true,
                      type: 'error',
                      title: 'Gagal Membuat Cadangan',
                      message: 'Tidak dapat membuat atau mengunduh berkas cadangan data.',
                    });
                  }
                }}
              >
                <Ionicons name="download-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.storageBackupBtnText}>Unduh Cadangan (.json)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storageRestoreBtn}
                activeOpacity={0.88}
                onPress={handlePickBackupFile}
              >
                <Ionicons name="folder-open-outline" size={18} color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={styles.storageRestoreBtnText}>Pulihkan dari Berkas (.json)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storagePasteBtn}
                activeOpacity={0.88}
                onPress={() => {
                  setStorageModalVisible(false);
                  setPasteModalVisible(true);
                }}
              >
                <Ionicons name="clipboard-outline" size={18} color="#0D9488" style={{ marginRight: 6 }} />
                <Text style={styles.storagePasteBtnText}>Tempel Teks Cadangan (JSON)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storageDismissBtn}
                activeOpacity={0.75}
                onPress={() => setStorageModalVisible(false)}
              >
                <Text style={styles.storageDismissBtnText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Tempel Teks Cadangan JSON */}
      <Modal
        visible={pasteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasteModalVisible(false)}
      >
        <View style={styles.storageModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPasteModalVisible(false)}
          />
          <View style={styles.pasteModalCard}>
            <View style={styles.storageHeaderRow}>
              <View style={[styles.storageHeaderIconWrap, { backgroundColor: '#CCFBF1' }]}>
                <Ionicons name="clipboard-outline" size={22} color="#0D9488" />
              </View>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={styles.storageModalTitle}>Tempel Data Cadangan</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPasteModalVisible(false)}
                style={styles.storageCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.storageModalDesc}>
              Tempelkan teks JSON cadangan yang telah Anda salin sebelumnya untuk memulihkan jadwal, tugas, dan materi Anda.
            </Text>

            <TextInput
              style={styles.pasteJsonInput}
              value={pastedJson}
              onChangeText={setPastedJson}
              placeholder={`{\n  "version": 1,\n  "profile": { ... },\n  "schedules": [ ... ]\n}`}
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.pasteActionRow}>
              <TouchableOpacity
                style={styles.pasteCancelBtn}
                onPress={() => {
                  setPasteModalVisible(false);
                  setPastedJson('');
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.pasteCancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pasteApplyBtn,
                  !pastedJson.trim() && { opacity: 0.5 },
                ]}
                disabled={!pastedJson.trim()}
                onPress={() => processBackupJson(pastedJson.trim())}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.pasteApplyBtnText}>Pulihkan Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ModernAlertModal
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        confirmText={alertInfo.confirmText}
        cancelText={alertInfo.cancelText}
        onConfirm={alertInfo.onConfirmAction}
        onClose={() => setAlertInfo((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Top Curved Hero Container (Solid Blue, deeper height to fill screen down)
  heroContainer: {
    backgroundColor: '#2563EB',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 68,
  },
  heroSafeArea: {
    paddingHorizontal: 20,
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 24,
  },
  heroNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  heroName: {
    fontFamily: Fonts.extraBold,
    fontSize: 25,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Avatar Overlapping Curve
  avatarWrap: {
    alignItems: 'center',
    marginTop: -46,
    zIndex: 10,
  },
  avatarBorderRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF0EC',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 3-Column Key Stats Row (Clean Direct Layout matching reference)
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 28,
    marginTop: 24,
    marginBottom: 34,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#94A3B8',
  },

  // Clean Menu Action List
  menuContainer: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#0F172A',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 60,
  },

  // Footer
  footerWrap: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: '#94A3B8',
  },

  // Modal (Edit Profile)
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
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: Colors.border,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    maxHeight: '90%',
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
  avatarPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  avatarOptionCard: {
    width: '30%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  avatarOptionCardActive: {
    backgroundColor: '#FFF0EC',
    borderColor: Colors.primary,
  },
  avatarOptionLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  avatarOptionLabelActive: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
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
  formRowTwo: {
    flexDirection: 'row',
    gap: 12,
  },
  formColHalf: {
    flex: 1,
  },
  saveBtn: {
    backgroundColor: '#2354F6',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 16,
  },
  saveBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.white,
  },

  // Custom Storage Info Modal Styles
  storageModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  storageModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  storageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storageHeaderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  storageStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  storageStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  storageStatusText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: '#059669',
  },
  storageModalTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 17,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  storageCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageModalDesc: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
    marginBottom: 16,
  },
  storageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  storageGridItem: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  storageItemIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  storageItemNumber: {
    fontFamily: Fonts.extraBold,
    fontSize: 16,
    color: '#0F172A',
  },
  storageItemLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  storageTotalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 16,
  },
  storageTotalText: {
    fontFamily: Fonts.medium,
    fontSize: 11.5,
    color: '#166534',
    flex: 1,
  },
  storageActionRow: {
    gap: 8,
  },
  storageBackupBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageBackupBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  storageDismissBtn: {
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageDismissBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
    color: '#64748B',
  },
  storageRestoreBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageRestoreBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#2563EB',
  },
  storagePasteBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storagePasteBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#0D9488',
  },
  pasteModalCard: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10,
  },
  pasteJsonInput: {
    height: 180,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 16,
  },
  pasteActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pasteCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasteCancelBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
    color: '#64748B',
  },
  pasteApplyBtn: {
    flex: 2,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasteApplyBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
