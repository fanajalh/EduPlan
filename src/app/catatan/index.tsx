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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { Colors, Fonts } from '@/constants/theme';
import { NoteItem } from '@/types';
import { FileExportService } from '@/services/fileExport';
import { EmptyState } from '@/components/EmptyState';
import { CuteCharacter } from '@/components/CuteCharacter';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

function formatNoteDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des',
    ];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

const CATEGORY_PILLS = ['Semua', 'Disematkan', 'Casual', 'Kuliah', 'Tugas', 'Ide', 'Pribadi'];

export default function CatatanScreen() {
  const router = useRouter();
  const { notes, addNote, updateNote, deleteNote, togglePinNote } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Always keep activeNote 100% in sync with real AppContext notes
  const activeNote = useMemo(
    () => (activeNoteId ? notes.find((n) => n.id === activeNoteId) || null : null),
    [notes, activeNoteId]
  );

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<NoteItem | null>(null);
  const [deletingNote, setDeletingNote] = useState<NoteItem | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Casual');
  const [pinned, setPinned] = useState(false);

  // Filter & sort notes (Pinned notes ALWAYS on top!)
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        // Category / pinned filter
        if (activeCategory === 'Disematkan') {
          if (!n.pinned) return false;
        } else if (activeCategory !== 'Semua' && n.category?.toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }
        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          n.title?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q) ||
          n.category?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aPinned = Boolean(a.pinned);
        const bPinned = Boolean(b.pinned);
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      });
  }, [notes, activeCategory, searchQuery]);

  const pinnedNotes = useMemo(() => notes.filter((n) => Boolean(n.pinned)), [notes]);
  const col1 = filteredNotes.filter((_, idx) => idx % 2 === 0);
  const col2 = filteredNotes.filter((_, idx) => idx % 2 === 1);

  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setContent('');
    setCategory('Casual');
    setPinned(false);
    setModalVisible(true);
  };

  const openEditModal = (note: NoteItem) => {
    setEditingItem(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setPinned(Boolean(note.pinned));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Perhatian', 'Catatan tidak boleh kosong!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (editingItem) {
      const updated: NoteItem = {
        ...editingItem,
        title: title || 'Catatan Tanpa Judul',
        content,
        category: category || 'Casual',
        pinned,
        updatedAt: todayStr,
      };
      await updateNote(updated);
    } else {
      const newNote: NoteItem = {
        id: `note-${Date.now()}`,
        title: title || 'Catatan Tanpa Judul',
        content,
        category: category || 'Casual',
        pinned,
        color: '#FFFFFF',
        updatedAt: todayStr,
      };
      await addNote(newNote);
    }

    setModalVisible(false);
  };

  const handleDelete = (note: NoteItem) => {
    setDeletingNote(note);
  };

  const confirmDeleteNote = async () => {
    if (!deletingNote) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics optional
    }
    const noteToDelete = deletingNote;
    setDeletingNote(null);
    await deleteNote(noteToDelete.id);
    if (activeNoteId === noteToDelete.id) {
      setActiveNoteId(null);
    }
    if (modalVisible) {
      setModalVisible(false);
    }
  };

  const handleTogglePin = async (noteId: string) => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
    await togglePinNote(noteId);
  };

  const handleBackNavigation = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/menu');
    }
  };

  const handleDownloadNote = async (note: NoteItem) => {
    Haptics.selectionAsync().catch(() => {});
    await FileExportService.downloadNote(note);
  };

  // ==========================================
  // VIEW 1: NOTES LIST SCREEN (Home Style) - Card Renderer
  // ==========================================
  const renderNoteCard = (note: NoteItem) => {
    const isPinned = Boolean(note.pinned);
    return (
      <TouchableOpacity
        key={note.id}
        style={[styles.masonryCard, isPinned && styles.masonryCardPinned]}
        onPress={() => setActiveNoteId(note.id)}
        onLongPress={() => handleDelete(note)}
        activeOpacity={0.88}
      >
        <View style={styles.cardTopRow}>
          {isPinned ? (
            <View style={styles.pinnedBadge}>
              <Ionicons name="pin" size={11} color={Colors.primary} />
              <Text style={styles.pinnedBadgeText}>Disematkan</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <TouchableOpacity
            style={styles.cardPinQuickBtn}
            onPress={(e) => {
              e?.stopPropagation?.();
              handleTogglePin(note.id);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPinned ? 'pin' : 'pin-outline'}
              size={15}
              color={isPinned ? Colors.primary : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {note.title}
        </Text>

        {/* Snippet Content */}
        <Text style={styles.cardSnippet} numberOfLines={4}>
          {note.content}
        </Text>

        {/* Card Footer: Category Pill (Left) & Date (Right) */}
        <View style={styles.cardFooterRow}>
          <View style={styles.cardCategoryPill}>
            <Text style={styles.cardCategoryPillText}>
              {note.category || 'Casual'}
            </Text>
          </View>

          <Text style={styles.cardDateText}>
            {formatNoteDate(note.updatedAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {activeNote ? (
        /* VIEW 2: NOTE DETAIL / READER SCREEN */
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Navigation Bar */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.backCircleBtn}
              onPress={() => setActiveNoteId(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color={Colors.text} />
            </TouchableOpacity>

            <View style={styles.readerTopRight}>
              <TouchableOpacity
                style={styles.actionCircleBtn}
                onPress={() => handleDownloadNote(activeNote)}
                activeOpacity={0.7}
              >
                <Ionicons name="download-outline" size={19} color={Colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionCircleBtn,
                  activeNote.pinned && {
                    backgroundColor: `${Colors.primary}18`,
                    borderColor: Colors.primary,
                  },
                ]}
                onPress={() => handleTogglePin(activeNote.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={activeNote.pinned ? 'pin' : 'pin-outline'}
                  size={19}
                  color={activeNote.pinned ? Colors.primary : Colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCircleBtn, { borderColor: '#FECACA' }]}
                onPress={() => handleDelete(activeNote)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={19} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Note Reader Body */}
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.readerScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Category Pill & Date */}
            <View style={styles.readerMetaRow}>
              <View style={styles.readerCategoryPill}>
                <Text style={styles.readerCategoryPillText}>
                  {activeNote.category || 'Casual'}
                </Text>
              </View>
              <Text style={styles.readerDateText}>
                {formatNoteDate(activeNote.updatedAt)}
              </Text>
            </View>

            {/* Large Editorial Title */}
            <Text style={styles.readerTitle}>{activeNote.title}</Text>

            {/* Body Text */}
            <Text style={styles.readerBodyText}>{activeNote.content}</Text>
          </ScrollView>

          {/* Floating Bottom Edit Button */}
          <View style={styles.floatingReaderBar}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => openEditModal(activeNote)}
              activeOpacity={0.88}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryActionButtonText}>Edit Catatan</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : (
        /* VIEW 1: NOTES LIST SCREEN */
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Top Bar with Home-style back button and search/add button */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.backCircleBtn}
          onPress={handleBackNavigation}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.actionCircleBtn}
            onPress={() => setShowSearchInput(!showSearchInput)}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={19} color={Colors.text} />
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
            <Text style={styles.headlineHi}>Catatan & Ide</Text>
            <CuteCharacter type="smart" size={32} />
          </View>
          <Text style={styles.headlineQuestion}>
            Simpan materi & <Text style={styles.headlineBold}>ringkasan belajarmu</Text>
          </Text>
        </View>

        {/* Expandable Search Input */}
        {showSearchInput && (
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari ide, materi, atau catatan..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Dual Mindful Moments Style Cards */}
        <View style={styles.momentsGrid}>
          {/* Card 1: Mustard Sun Yellow */}
          <TouchableOpacity
            style={[styles.momentCard, { backgroundColor: Colors.sunYellow }]}
            onPress={openAddModal}
            activeOpacity={0.88}
          >
            <View>
              <Text style={styles.momentTitle}>Tulis Ide{'\n'}& Memo</Text>
              <Text style={styles.momentSub}>{notes.length} total tersimpan</Text>
            </View>
            <View style={styles.momentBottom}>
              <CuteCharacter type="eyes" size={42} />
              <View style={styles.arrowCircle}>
                <Ionicons name="add" size={18} color={Colors.text} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 2: Periwinkle Blue */}
          <TouchableOpacity
            style={[
              styles.momentCard,
              { backgroundColor: Colors.periwinkle },
              activeCategory === 'Disematkan' && styles.momentCardActive,
            ]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setActiveCategory(activeCategory === 'Disematkan' ? 'Semua' : 'Disematkan');
            }}
            activeOpacity={0.88}
          >
            <View>
              <Text style={[styles.momentTitle, { color: '#FFFFFF' }]}>Catatan{'\n'}Penting</Text>
              <Text style={[styles.momentSub, { color: 'rgba(255,255,255,0.85)' }]}>
                {pinnedNotes.length} disematkan
              </Text>
            </View>
            <View style={styles.momentBottom}>
              <CuteCharacter type="calm" size={42} />
              <View style={styles.arrowCircle}>
                <Ionicons name="pin" size={15} color={Colors.text} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Category Pills Strip */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Kategori</Text>
          <Text style={styles.sectionCount}>{filteredNotes.length} Catatan</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORY_PILLS.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <EmptyState
            icon="journal-outline"
            title="Belum Ada Catatan"
            description="Tulis ide cepat, daftar hal penting, atau rangkuman harian Anda di sini."
            actionLabel="Tulis Catatan Sekarang"
            onAction={openAddModal}
          />
        ) : (
          <View style={styles.masonryContainer}>
            <View style={styles.masonryCol}>
              {col1.map(renderNoteCard)}
            </View>
            <View style={styles.masonryCol}>
              {col2.map(renderNoteCard)}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )}

  {/* Add / Edit Note Modal (Home Style) */}
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
                {editingItem ? 'Edit Catatan' : 'Tulis Catatan Baru'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Judul Catatan</Text>
              <TextInput
                style={styles.input}
                placeholder="Judul catatan atau rangkuman..."
                placeholderTextColor={Colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Pilih Kategori</Text>
              <View style={styles.quickCatRow}>
                {['Casual', 'Kuliah', 'Tugas', 'Ide', 'Pribadi'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.quickCatChip, category === cat && styles.quickCatChipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.quickCatText,
                        category === cat && styles.quickCatTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Isi Catatan</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tuliskan ringkasan materi, ide, atau pengingat di sini..."
                placeholderTextColor={Colors.textSecondary}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={8}
              />

              {/* Pin Checkbox */}
              <TouchableOpacity
                style={styles.pinToggleRow}
                onPress={() => setPinned(!pinned)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={pinned ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={pinned ? Colors.primary : Colors.textSecondary}
                />
                <Text style={styles.pinToggleText}>Sematkan catatan ini di atas</Text>
              </TouchableOpacity>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.88}
              >
                <Text style={styles.saveBtnText}>
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Catatan'}
                </Text>
              </TouchableOpacity>

              {/* Delete Button (If editing existing note) */}
              {editingItem && (
                <TouchableOpacity
                  style={styles.deleteModalBtn}
                  onPress={() => handleDelete(editingItem)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={17} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteModalBtnText}>Hapus Catatan Ini</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmDeleteModal
        visible={Boolean(deletingNote)}
        title="Hapus Catatan?"
        itemName={deletingNote?.title}
        onConfirm={confirmDeleteNote}
        onCancel={() => setDeletingNote(null)}
      />
    </>
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionCircleBtn: {
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

  // EDITORIAL HEADLINE (Exact Home Match)
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

  // EXPANDED SEARCH
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
  momentCardActive: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: Colors.periwinkle,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
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

  // CATEGORY PILLS (Home Style)
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
  categoryScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  categoryPillText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.text,
  },
  categoryPillTextActive: {
    fontFamily: Fonts.bold,
    color: Colors.white,
  },

  // MASONRY CARDS (Home Clean Cards)
  masonryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  masonryCol: {
    flex: 1,
    gap: 12,
  },
  masonryCard: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  masonryCardPinned: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  pinnedBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.primary,
  },
  cardTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardSnippet: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  cardCategoryPill: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardCategoryPillText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.text,
  },
  cardDateText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // READER SCREEN
  readerTopRight: {
    flexDirection: 'row',
    gap: 8,
  },
  readerScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 100,
  },
  readerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  readerCategoryPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  readerCategoryPillText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.periwinkle,
  },
  readerDateText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  readerTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 26,
    lineHeight: 34,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  readerBodyText: {
    fontFamily: Fonts.regular,
    fontSize: 15.5,
    lineHeight: 26,
    color: '#334155',
  },
  floatingReaderBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryActionButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.white,
  },

  // MODAL (Home Style)
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
    paddingBottom: 40,
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
    height: 140,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  quickCatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  quickCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F4F4F5',
  },
  quickCatChipActive: {
    backgroundColor: Colors.primary,
  },
  quickCatText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.text,
  },
  quickCatTextActive: {
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  pinToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  pinToggleText: {
    fontFamily: Fonts.medium,
    fontSize: 13.5,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.white,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardPinQuickBtn: {
    padding: 3,
    borderRadius: 12,
  },
  deleteModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    marginTop: 12,
  },
  deleteModalBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#EF4444',
  },
});
