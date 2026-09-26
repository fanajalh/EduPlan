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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { Colors, Fonts } from '@/constants/theme';
import { FileExportService } from '@/services/fileExport';

import { MaterialItem } from '@/types';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { CuteCharacter, CharacterType } from '@/components/CuteCharacter';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import Svg, { Path } from 'react-native-svg';

// Exact color palette matching the Jadwal schedule cards
const PRESET_COLORS = [
  '#6284F6', // Card 1: Purple / Periwinkle
  '#FF5733', // Card 2: Coral / Red-Orange
  '#FDCB44', // Card 3: Warm Mustard Yellow
  '#10B981', // Card 4: Emerald Green
  '#9A82F7', // Card 5: Soft Lavender
  '#06B6D4', // Card 6: Cyan Teal
];

// Vibrant, curated color palettes for reader mode
const CARD_PALETTES = [
  {
    bg: '#627BFF',
    pillBg: '#EDE9FE',
    arrowColor: '#4F46E5',
    iconBg: 'rgba(255, 255, 255, 0.22)',
  },
  {
    bg: '#FF597B',
    pillBg: '#FFE4E6',
    arrowColor: '#BE123C',
    iconBg: 'rgba(255, 255, 255, 0.22)',
  },
  {
    bg: '#F59E0B',
    pillBg: '#FEF3C7',
    arrowColor: '#B45309',
    iconBg: 'rgba(255, 255, 255, 0.22)',
  },
  {
    bg: '#06B6D4',
    pillBg: '#CFFAFE',
    arrowColor: '#0E7490',
    iconBg: 'rgba(255, 255, 255, 0.22)',
  },
  {
    bg: '#10B981',
    pillBg: '#D1FAE5',
    arrowColor: '#047857',
    iconBg: 'rgba(255, 255, 255, 0.22)',
  },
  {
    bg: '#F97316',
    pillBg: '#FFEDD5',
    arrowColor: '#C2410C',
    iconBg: 'rgba(255, 255, 255, 0.22)',
  },
  {
    bg: '#8B5CF6',
    pillBg: '#EDE9FE',
    arrowColor: '#6D28D9',
    iconBg: 'rgba(255, 255, 255, 0.22)',
  },
  {
    bg: '#EC4899',
    pillBg: '#FCE7F3',
    arrowColor: '#BE185D',
    iconBg: 'rgba(255, 255, 255, 0.22)',
  },
];

// Helper to choose cute subject icon matching Jadwal
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

const CHAR_AVATARS: CharacterType[] = ['smart', 'calm', 'zen', 'cheer', 'focused'];

export default function MateriScreen() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Semua');

  // Full-screen Book Reading Mode State (in sync with AppContext)
  const [readingMaterialId, setReadingMaterialId] = useState<string | null>(null);
  const readingMaterial = useMemo(
    () => (readingMaterialId ? materials.find((m) => m.id === readingMaterialId) || null : null),
    [materials, readingMaterialId]
  );
  const [readingPaletteIndex, setReadingPaletteIndex] = useState(0);
  const [fontSizeLarge, setFontSizeLarge] = useState(false);

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialItem | null>(null);
  const [actionMaterial, setActionMaterial] = useState<MaterialItem | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Extract unique subjects
  const subjectList = ['Semua', ...Array.from(new Set(materials.map((m) => m.subject)))];

  const filteredMaterials = materials.filter((m) => {
    if (selectedSubject !== 'Semua' && m.subject !== selectedSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchSub = m.subject.toLowerCase().includes(q);
      const matchTag = m.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchSub || matchTag;
    }
    return true;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setSubject(selectedSubject !== 'Semua' ? selectedSubject : '');
    setCategory('Modul Teori');
    setSummary('');
    setContent('');
    setTagInput('');
    setModalVisible(true);
  };

  const openEditModal = (item: MaterialItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setSubject(item.subject);
    setCategory(item.category);
    setSummary(item.summary);
    setContent(item.content);
    setTagInput(item.tags ? item.tags.join(', ') : '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Perhatian', 'Judul dan isi materi wajib diisi!');
      return;
    }

    const tags = tagInput
      ? tagInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : ['Umum'];

    if (editingItem) {
      const updated: MaterialItem = {
        ...editingItem,
        title,
        subject: subject || 'Mata Pelajaran Umum',
        category: category || 'Rangkuman',
        summary: summary || title,
        content,
        tags,
      };
      await updateMaterial(updated);
    } else {
      await addMaterial({
        title,
        subject: subject || 'Mata Pelajaran Umum',
        category: category || 'Rangkuman',
        summary: summary || title,
        content,
        links: [],
        tags,
      });
    }

    setModalVisible(false);
  };

  const handleDelete = (item: MaterialItem) => {
    setDeletingMaterial(item);
  };

  const confirmDeleteMaterial = async () => {
    if (!deletingMaterial) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics optional
    }
    const itemToDelete = deletingMaterial;
    setDeletingMaterial(null);
    setActionMaterial(null);
    await deleteMaterial(itemToDelete.id);
    if (readingMaterialId === itemToDelete.id) {
      setReadingMaterialId(null);
    }
    if (modalVisible && editingItem?.id === itemToDelete.id) {
      setModalVisible(false);
    }
  };

  const handleCardLongPress = (item: MaterialItem) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
    setActionMaterial(item);
  };

  const handleOpenBookReader = (item: MaterialItem, index: number) => {
    setReadingMaterialId(item.id);
    setReadingPaletteIndex(index);
  };

  const handleDownloadMaterial = async (item: MaterialItem) => {
    Haptics.selectionAsync().catch(() => {});
    await FileExportService.downloadMaterial(item);
  };

  return (
    <>
      {readingMaterial ? (
        <SafeAreaView style={styles.bookSafeArea} edges={['top', 'bottom']}>
          {/* Book Navigation Bar */}
          <View style={styles.bookNavBar}>
            <TouchableOpacity
              style={styles.bookBackBtn}
              onPress={() => setReadingMaterialId(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color="#0F172A" />
              <Text style={styles.bookBackBtnText}>Daftar Materi</Text>
            </TouchableOpacity>

            <View style={styles.bookNavActions}>
              {/* Download Material */}
              <TouchableOpacity
                style={styles.bookNavActionBtn}
                onPress={() => handleDownloadMaterial(readingMaterial)}
                activeOpacity={0.7}
              >
                <Ionicons name="download-outline" size={19} color={Colors.primary} />
              </TouchableOpacity>

              {/* Font Size Toggle */}
              <TouchableOpacity
                style={styles.bookNavActionBtn}
                onPress={() => setFontSizeLarge(!fontSizeLarge)}
                activeOpacity={0.7}
              >
                <Text style={styles.fontSizeToggleText}>
                  {fontSizeLarge ? 'A+' : 'A'}
                </Text>
              </TouchableOpacity>

              {/* Edit Material */}
              <TouchableOpacity
                style={styles.bookNavActionBtn}
                onPress={() => openEditModal(readingMaterial)}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={19} color={Colors.primary} />
              </TouchableOpacity>

              {/* Delete Material */}
              <TouchableOpacity
                style={[styles.bookNavActionBtn, { borderColor: '#FECACA' }]}
                onPress={() => handleDelete(readingMaterial)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={19} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reading Progress Top Bar Indicator */}
          <View style={styles.bookProgressBarWrapper}>
            <View
              style={[
                styles.bookProgressBar,
                { backgroundColor: CARD_PALETTES[readingPaletteIndex % CARD_PALETTES.length].bg },
              ]}
            />
          </View>

          {/* Book Page Surface */}
          <ScrollView
            style={styles.bookPageScroll}
            contentContainerStyle={styles.bookPageContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Chapter / Subject Ribbon Header */}
            <View style={styles.bookHeaderRow}>
              <View
                style={[
                  styles.bookSubjectRibbon,
                  { backgroundColor: CARD_PALETTES[readingPaletteIndex % CARD_PALETTES.length].bg },
                ]}
              >
                <Ionicons name="bookmark" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.bookSubjectRibbonText}>
                  {readingMaterial.subject}
                </Text>
              </View>

              <Text style={styles.bookDateText}>{readingMaterial.createdAt}</Text>
            </View>

            {/* Book Title */}
            <Text style={styles.bookTitle}>{readingMaterial.title}</Text>

            {/* Category & Read Time Subheader */}
            <View style={styles.bookMetaRow}>
              <View style={styles.bookCategoryBadge}>
                <Ionicons name="book-outline" size={13} color="#64748B" />
                <Text style={styles.bookCategoryText}>
                  {readingMaterial.category || 'Modul Pembelajaran'}
                </Text>
              </View>
              <Text style={styles.bookMetaDot}>•</Text>
              <View style={styles.bookCategoryBadge}>
                <Ionicons name="time-outline" size={13} color="#64748B" />
                <Text style={styles.bookCategoryText}>
                  ~{Math.max(1, Math.ceil(readingMaterial.content.split(' ').length / 120))} mnt baca
                </Text>
              </View>
            </View>

            {/* Decorative Divider */}
            <View style={styles.bookOrnamentRow}>
              <View style={styles.bookOrnamentLine} />
              <Text style={styles.bookOrnamentSymbol}>✦ ✦ ✦</Text>
              <View style={styles.bookOrnamentLine} />
            </View>

            {/* Intisari / Synopsis Lead Text */}
            {readingMaterial.summary ? (
              <View style={styles.bookSynopsisRow}>
                <View
                  style={[
                    styles.bookSynopsisAccentLine,
                    { backgroundColor: CARD_PALETTES[readingPaletteIndex % CARD_PALETTES.length].bg },
                  ]}
                />
                <Text style={styles.bookSynopsisText}>
                  {readingMaterial.summary}
                </Text>
              </View>
            ) : null}

            {/* Main Book Content */}
            <Text
              style={[
                styles.bookBodyText,
                fontSizeLarge && styles.bookBodyTextLarge,
              ]}
            >
              {readingMaterial.content}
            </Text>

            {/* Tags Section */}
            {readingMaterial.tags && readingMaterial.tags.length > 0 ? (
              <View style={styles.bookTagsSection}>
                <Text style={styles.bookTagsHeader}>Kata Kunci / Indeks:</Text>
                <View style={styles.bookTagsRow}>
                  {readingMaterial.tags.map((tag, idx) => (
                    <View key={idx} style={styles.bookTagPill}>
                      <Text style={styles.bookTagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* End of Book Ornament & Back Button */}
            <View style={styles.bookEndSection}>
              <View style={styles.bookEndDivider} />
              <Text style={styles.bookEndSymbol}>❖ Selesai Membaca ❖</Text>
              <TouchableOpacity
                style={styles.bookFinishBtn}
                onPress={() => setReadingMaterialId(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.bookFinishBtnText}>Kembali ke Arsip Materi</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      ) : (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Penyimpanan Materi"
        subtitle={`${materials.length} arsip rangkuman & modul pembelajaran`}
        showBack
        rightAction={{
          icon: 'add',
          onPress: openAddModal,
          label: 'Tambah',
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari materi, topik, rumus..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Subject Filter Pills */}
      <View style={styles.subjectFilterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subjectFilterScroll}
        >
          {subjectList.map((sub) => {
            const isSelected = sub === selectedSubject;
            return (
              <TouchableOpacity
                key={sub}
                style={[styles.subjectChip, isSelected && styles.subjectChipActive]}
                onPress={() => setSelectedSubject(sub)}
                activeOpacity={0.7}
              >
                <Text style={[styles.subjectChipText, isSelected && styles.subjectChipTextActive]}>
                  {sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Grid Content Area */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredMaterials.length === 0 ? (
          <EmptyState
            icon="library-outline"
            title="Belum Ada Materi"
            description="Simpan rangkuman rumus, modul pelajaran, dan catatan kuliah Anda di sini agar mudah diakses saat ujian."
            actionLabel="Tambah Catatan Materi"
            onAction={openAddModal}
          />
        ) : (
          /* 2-COLUMN COLORFUL CARDS GRID */
          <View style={styles.gridContainer}>
            {filteredMaterials.map((item, index) => {
              const cardBg = PRESET_COLORS[index % PRESET_COLORS.length];
              const charAvatar = CHAR_AVATARS[index % CHAR_AVATARS.length];

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.subjectCard, { backgroundColor: cardBg }]}
                  onPress={() => handleOpenBookReader(item, index)}
                  onLongPress={() => handleCardLongPress(item)}
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
                        fill="#FAFAFA"
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

                  {/* Bottom section: Subject title, material title & footer info */}
                  <View style={styles.cardBottom}>
                    <Text style={styles.subjectTitle} numberOfLines={2}>
                      {item.subject}
                    </Text>

                    <Text style={styles.materialSubTitle} numberOfLines={2}>
                      {item.title}
                    </Text>

                    <View style={styles.materiFooterRow}>
                      <View style={styles.characterAvatar}>
                        <CuteCharacter type={charAvatar} size={22} />
                      </View>
                      <View style={styles.materiTextCol}>
                        <Text style={styles.materiPrefix}>Ringkasan:</Text>
                        <Text style={styles.materiDate} numberOfLines={1}>
                          {item.createdAt || 'Modul'}
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
    </SafeAreaView>
  )}

  {/* Add / Edit Material Modal */}
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
                {editingItem ? 'Edit Materi' : 'Tambah Materi Baru'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollArea}>
              <Text style={styles.label}>Judul Materi *</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Rangkuman Integral & Turunan"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Mata Pelajaran</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Matematika Peminatan"
                placeholderTextColor="#94A3B8"
                value={subject}
                onChangeText={setSubject}
              />

              {/* Quick Subject Suggestions */}
              <View style={styles.quickSuggestionsRow}>
                {['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Pemrograman', 'Bahasa Inggris'].map(
                  (sug) => (
                    <TouchableOpacity
                      key={sug}
                      style={styles.quickSugChip}
                      onPress={() => setSubject(sug)}
                    >
                      <Text style={styles.quickSugText}>+ {sug}</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={styles.label}>Kategori Modul</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Rangkuman Rumus / Modul Teori"
                placeholderTextColor="#94A3B8"
                value={category}
                onChangeText={setCategory}
              />

              <Text style={styles.label}>Ringkasan Singkat</Text>
              <TextInput
                style={styles.input}
                placeholder="Deskripsi 1-2 kalimat tentang materi ini..."
                placeholderTextColor="#94A3B8"
                value={summary}
                onChangeText={setSummary}
              />

              <Text style={styles.label}>Isi Lengkap Catatan Materi *</Text>
              <TextInput
                style={[styles.input, styles.textAreaLarge]}
                placeholder="Ketik rumus, catatan penting, daftar poin..."
                placeholderTextColor="#94A3B8"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={8}
              />

              <Text style={styles.label}>Label / Tag (Pisahkan dengan koma)</Text>
              <TextInput
                style={styles.input}
                placeholder="Kalkulus, Rumus Cepat, UTS"
                placeholderTextColor="#94A3B8"
                value={tagInput}
                onChangeText={setTagInput}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Catatan Materi'}
                </Text>
              </TouchableOpacity>

              {/* Delete Button (If editing existing material) */}
              {editingItem && (
                <TouchableOpacity
                  style={styles.deleteModalBtn}
                  onPress={() => handleDelete(editingItem)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={17} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteModalBtnText}>Hapus Materi Ini</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Action Options Modal for Long-Pressed Card */}
      <Modal
        visible={Boolean(actionMaterial)}
        transparent
        animationType="fade"
        onRequestClose={() => setActionMaterial(null)}
      >
        <View style={styles.actionModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActionMaterial(null)}
          />
          <View style={styles.actionModalCard}>
            <View style={styles.actionModalHeader}>
              <Text style={styles.actionModalSubject}>{actionMaterial?.subject}</Text>
              <Text style={styles.actionModalTitle} numberOfLines={2}>
                {actionMaterial?.title}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionModalBtn}
              onPress={() => {
                if (actionMaterial) {
                  const idx = materials.findIndex((m) => m.id === actionMaterial.id);
                  const mat = actionMaterial;
                  setActionMaterial(null);
                  handleOpenBookReader(mat, idx >= 0 ? idx : 0);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="book-outline" size={18} color={Colors.primary} style={{ marginRight: 10 }} />
              <Text style={styles.actionModalBtnText}>Baca Materi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionModalBtn}
              onPress={() => {
                if (actionMaterial) {
                  const mat = actionMaterial;
                  setActionMaterial(null);
                  openEditModal(mat);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color="#0F172A" style={{ marginRight: 10 }} />
              <Text style={styles.actionModalBtnText}>Edit Materi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionModalBtn, styles.actionModalBtnDanger]}
              onPress={() => {
                if (actionMaterial) {
                  const mat = actionMaterial;
                  setActionMaterial(null);
                  setDeletingMaterial(mat);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.danger} style={{ marginRight: 10 }} />
              <Text style={[styles.actionModalBtnText, { color: Colors.danger }]}>Hapus Materi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionModalCancelBtn}
              onPress={() => setActionMaterial(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionModalCancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Styled Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={Boolean(deletingMaterial)}
        title="Hapus Materi?"
        itemName={deletingMaterial?.title}
        onConfirm={confirmDeleteMaterial}
        onCancel={() => setDeletingMaterial(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: Fonts.medium,
    fontSize: 13.5,
    color: '#0F172A',
  },
  subjectFilterWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  subjectFilterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  subjectChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subjectChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },


  subjectChipText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: '#64748B',
  },
  subjectChipTextActive: {
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // 2-COLUMN COLORFUL CARDS GRID MATCHING JADWAL
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  subjectCard: {
    width: '48%',
    minHeight: 224,
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
    position: 'relative',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
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
  materialSubTitle: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 16,
    marginTop: 4,
    minHeight: 32,
  },
  materiFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
  },
  characterAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  materiTextCol: {
    flex: 1,
  },
  materiPrefix: {
    fontFamily: Fonts.medium,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 11,
  },
  materiDate: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },

  // ==========================================
  // FULL-PAGE BOOK READER STYLES
  // ==========================================
  bookSafeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Comfortable Apple Books paper tone
  },
  bookNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE8E1',
  },
  bookBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  bookBackBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    color: '#0F172A',
  },
  bookNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookNavActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeToggleText: {
    fontFamily: Fonts.extraBold,
    fontSize: 14,
    color: Colors.text,
  },

  bookProgressBarWrapper: {
    height: 3,
    backgroundColor: '#EBE8E1',
    width: '100%',
  },
  bookProgressBar: {
    height: '100%',
    width: '100%',
  },
  bookPageScroll: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  bookPageContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 60,
  },
  bookHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookSubjectRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bookSubjectRibbonText: {
    fontFamily: Fonts.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookDateText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#94A3B8',
  },
  bookTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    lineHeight: 32,
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  bookMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  bookCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookCategoryText: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: '#64748B',
  },
  bookMetaDot: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  bookOrnamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 12,
  },
  bookOrnamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E0D5',
  },
  bookOrnamentSymbol: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: '#A8A29E',
    letterSpacing: 3,
  },
  bookSynopsisRow: {
    flexDirection: 'row',
    marginBottom: 22,
    paddingLeft: 2,
    alignItems: 'stretch',
  },
  bookSynopsisAccentLine: {
    width: 3.5,
    borderRadius: 2,
    marginRight: 12,
  },
  bookSynopsisText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 23,
    color: '#475569',
    fontStyle: 'italic',
  },
  bookBodyText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 28,
    color: '#0F172A',
    letterSpacing: 0.15,
    marginBottom: 28,
  },
  bookBodyTextLarge: {
    fontSize: 18.5,
    lineHeight: 33,
  },
  bookTagsSection: {
    marginBottom: 28,
  },
  bookTagsHeader: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bookTagPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  bookTagText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.primary,
  },
  bookEndSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  bookEndDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#E5E0D5',
    marginBottom: 10,
  },
  bookEndSymbol: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 18,
    letterSpacing: 1,
  },
  bookFinishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
  },


  bookFinishBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // ==========================================
  // ADD/EDIT MODAL
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '88%',
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalScrollArea: {
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  modalTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 19,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 12.5,
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: Fonts.medium,
    fontSize: 13.5,
    color: '#0F172A',
    marginBottom: 12,
  },
  textAreaLarge: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  quickSuggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: -6,
    marginBottom: 12,
  },
  quickSugChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickSugText: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: Colors.primary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },

  saveBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    color: Colors.white,
  },
  deleteModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    marginBottom: 24,
  },
  deleteModalBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#EF4444',
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionModalHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionModalSubject: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  actionModalTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 16,
    color: '#0F172A',
  },
  actionModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  actionModalBtnDanger: {
    backgroundColor: '#FEF2F2',
  },
  actionModalBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#0F172A',
  },
  actionModalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  actionModalCancelText: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
    color: '#64748B',
  },
});
