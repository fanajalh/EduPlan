import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { Colors, Fonts } from '@/constants/theme';
import { CuteCharacter, CharacterType, getWorkloadMood } from '@/components/CuteCharacter';

const ENERGY_OPTIONS: { type: CharacterType; label: string; bg: string; text: string }[] = [
  { type: 'happy', label: 'Bahagia', bg: '#32BA94', text: '#FFFFFF' },
  { type: 'calm', label: 'Santai', bg: '#6284F6', text: '#FFFFFF' },
  { type: 'sad', label: 'Sedih', bg: '#FDCB44', text: '#141416' },
  { type: 'dizzy', label: 'Puyeng', bg: '#FF5733', text: '#FFFFFF' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const {
    profile,
    tasks,
    schedules,
    materials,
    habits,
    toggleHabitToday,
  } = useApp();

  const [activeEnergy, setActiveEnergy] = useState<CharacterType>('calm');

  const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const today = new Date();
  const todayDayName = dayNamesIndo[today.getDay()];
  const todayDateStr = today.toISOString().split('T')[0];

  const todaySchedules = schedules.filter((s) => s.day === todayDayName);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const hasOverdue = pendingTasks.some((t) => t.deadline && t.deadline < todayDateStr);
  const workloadMood = getWorkloadMood(pendingTasks.length, hasOverdue);

  const displayName = profile.name && profile.name.trim() !== ''
    ? (profile.name.startsWith('Bpk. ')
        ? profile.name.replace('Bpk. ', '').split(' ')[0]
        : profile.name.split(' ')[0])
    : 'Siswa';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimalist Header Row (Matching Reference Screen 1) */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.userSection}
            onPress={() => router.push('/profil')}
            activeOpacity={0.8}
          >
            <View style={styles.avatarBorder}>
              <CuteCharacter type={profile.character || 'avatar'} size={48} />
            </View>
            <View>
              <Text style={styles.greetingSub}>Welcome back</Text>
              <Text style={styles.userName}>{profile.name}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push('/(tabs)/menu')}
            activeOpacity={0.7}
          >
            <Ionicons name="reorder-two-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Large Editorial Headline (Exact match to Reference Screen 1) */}
        <View style={styles.headlineWrapper}>
          <View style={styles.headlineHiRow}>
            <Text style={styles.headlineHi}>Hi, {displayName}</Text>
            <TouchableOpacity
              style={[styles.workloadBadge, { backgroundColor: workloadMood.bg }]}
              onPress={() => router.push('/(tabs)/tugas')}
              activeOpacity={0.8}
            >
              <CuteCharacter type={workloadMood.type} size={38} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headlineQuestion}>
            What&apos;s on <Text style={styles.headlineBold}>your</Text>
          </Text>
          <Text style={styles.headlineQuestion}>
            <Text style={styles.headlineBold}>mind</Text> right now?
          </Text>
        </View>

        {/* Daily Study Log (Matching Screen 1 "Daily Mood Log") */}
        <View style={styles.energySection}>
          <View style={styles.energyHeader}>
            <Text style={styles.sectionTitle}>Daily Mood Log</Text>
            <TouchableOpacity onPress={() => router.push('/kebiasaan')}>
              <Text style={styles.sectionLink}>Skip today</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.energyScroll}
          >
            {ENERGY_OPTIONS.map((item) => {
              const isSelected = activeEnergy === item.type;
              return (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.energyCard,
                    { backgroundColor: item.bg },
                    isSelected && styles.energyCardActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setActiveEnergy(item.type);
                  }}
                  activeOpacity={0.85}
                >
                  <CuteCharacter type={item.type} size={48} />
                  <Text style={[styles.energyLabel, { color: item.text }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Dual Core Cards (Matching Screen 1 "Mindful Moments") */}
        <View style={styles.momentsSection}>
          <View style={styles.energyHeader}>
            <Text style={styles.sectionTitle}>Mindful Moments</Text>
            <TouchableOpacity
              onPress={() => router.push('/catatan')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.momentsGrid}>
            {/* Card 1: Warm Mustard Yellow */}
            <TouchableOpacity
              style={[styles.momentCard, { backgroundColor: Colors.sunYellow }]}
              onPress={() => router.push('/(tabs)/tugas')}
              activeOpacity={0.85}
            >
              <View>
                <Text style={styles.momentTitle}>Recharge{'\n'}& Tugas</Text>
                <Text style={styles.momentSub}>{pendingTasks.length} belum selesai</Text>
              </View>

              <View style={styles.momentBottom}>
                <CuteCharacter type="eyes" size={54} />
                <View style={styles.arrowCircle}>
                  <Ionicons name="arrow-up" size={18} color={Colors.text} style={{ transform: [{ rotate: '45deg' }] }} />
                </View>
              </View>
            </TouchableOpacity>

            {/* Card 2: Periwinkle Blue */}
            <TouchableOpacity
              style={[styles.momentCard, { backgroundColor: Colors.periwinkle }]}
              onPress={() => router.push('/materi')}
              activeOpacity={0.85}
            >
              <View>
                <Text style={[styles.momentTitle, { color: Colors.white }]}>
                  Modul{'\n'}Materi
                </Text>
                <Text style={[styles.momentSub, { color: 'rgba(255,255,255,0.85)' }]}>
                  {materials.length} ringkasan
                </Text>
              </View>

              <View style={styles.momentBottom}>
                <CuteCharacter type="zen" size={52} />
                <View style={[styles.arrowCircle, { backgroundColor: Colors.white }]}>
                  <Ionicons name="arrow-up" size={18} color={Colors.periwinkle} style={{ transform: [{ rotate: '45deg' }] }} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Classes */}
        <View style={styles.classesSection}>
          <View style={styles.energyHeader}>
            <Text style={styles.sectionTitle}>Jadwal Hari Ini</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/jadwal')}>
              <Text style={styles.sectionLink}>Lihat semua</Text>
            </TouchableOpacity>
          </View>

          {todaySchedules.length === 0 ? (
            <View style={styles.emptyCard}>
              <CuteCharacter type="calm" size={42} />
              <Text style={styles.emptyTitle}>Tidak ada jadwal kelas hari ini</Text>
              <Text style={styles.emptySub}>Waktunya fokus mengulang modul atau rehat sejenak.</Text>
            </View>
          ) : (
            todaySchedules.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.classRow}
                onPress={() => router.push('/(tabs)/jadwal')}
                activeOpacity={0.8}
              >
                <View style={[styles.classColorBar, { backgroundColor: item.color }]} />
                <View style={styles.classInfo}>
                  <Text style={styles.classSubject}>{item.subject}</Text>
                  <Text style={styles.classSubDetail}>
                    {item.startTime} - {item.endTime} • {item.room}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Daily Habits Minimal Checklist */}
        <View style={styles.habitsSection}>
          <View style={styles.energyHeader}>
            <Text style={styles.sectionTitle}>Kebiasaan Disiplin</Text>
            <TouchableOpacity onPress={() => router.push('/kebiasaan')}>
              <Text style={styles.sectionLink}>Kelola</Text>
            </TouchableOpacity>
          </View>

          {habits.length === 0 ? (
            <View style={styles.emptyCard}>
              <CuteCharacter type="zen" size={38} />
              <Text style={styles.emptyTitle}>Belum ada rutinitas kebiasaan</Text>
              <Text style={styles.emptySub}>Mulai bangun kebiasaan belajar teratur dengan menambah target baru.</Text>
            </View>
          ) : (
            habits.slice(0, 3).map((h) => {
              const isDone = h.completedDates.includes(todayDateStr);
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.habitItem, isDone && styles.habitItemDone]}
                  onPress={() => toggleHabitToday(h.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.habitLeft}>
                    <View style={[styles.habitCircle, isDone && styles.habitCircleActive]}>
                      {isDone && <Ionicons name="checkmark" size={13} color={Colors.white} />}
                    </View>
                    <Text style={[styles.habitText, isDone && styles.habitTextDone]}>
                      {h.title}
                    </Text>
                  </View>
                  <Text style={styles.habitStreakCount}>{h.streak} hari</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 120, // Clean space for floating dock
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  greetingSub: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  userName: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.text,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headlineWrapper: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
  },
  headlineHiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  workloadBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineHi: {
    fontFamily: Fonts.extraBold,
    fontSize: 44,
    color: Colors.text,
    letterSpacing: -1,
  },
  headlineQuestion: {
    fontFamily: Fonts.medium,
    fontSize: 34,
    color: Colors.text,
    letterSpacing: -0.7,
    lineHeight: 44,
  },
  headlineBold: {
    fontFamily: Fonts.extraBold,
    color: Colors.text,
  },
  energySection: {
    marginBottom: 34,
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontFamily: Fonts.semiBold,
    fontSize: 13.5,
    color: Colors.textSecondary,
  },
  energyScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  energyCard: {
    width: 90,
    height: 110,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  energyCardActive: {
    borderWidth: 2.5,
    borderColor: Colors.text,
  },
  energyLabel: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    marginTop: 8,
  },
  momentsSection: {
    paddingHorizontal: 24,
    marginBottom: 36,
  },
  momentsGrid: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 16,
  },
  momentCard: {
    flex: 1,
    height: 195,
    borderRadius: 32,
    padding: 22,
    justifyContent: 'space-between',
  },
  momentTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 19,
    color: Colors.text,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  momentSub: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  momentBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  arrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classesSection: {
    paddingHorizontal: 24,
    marginBottom: 36,
  },
  classRow: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  classColorBar: {
    width: 4,
    height: 38,
    borderRadius: 2,
    marginRight: 14,
  },
  classInfo: {
    flex: 1,
  },
  classSubject: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.text,
  },
  classSubDetail: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.text,
    marginTop: 10,
  },
  emptySub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  habitsSection: {
    paddingHorizontal: 24,
    marginBottom: 36,
  },
  habitItem: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  habitItemDone: {
    opacity: 0.7,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  habitCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  habitText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15.5,
    color: Colors.text,
  },
  habitTextDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  habitStreakCount: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.primary,
  },
});
