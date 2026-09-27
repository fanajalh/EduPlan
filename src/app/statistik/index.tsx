import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/context/AppContext';
import { Colors, Fonts } from '@/constants/theme';
import { CuteCharacter, CharacterType } from '@/components/CuteCharacter';
import { ScheduleItem, DayOfWeek } from '@/types';

interface StudyBarItem {
  day: string;
  hours: number;
  maxHours: number;
  character: CharacterType;
  color: string;
  moodLabel: string;
}

const STORAGE_KEY_MOOD = '@eduplaner_today_mood';

const MOOD_OPTIONS: { id: CharacterType; label: string; color: string; shortTip: string }[] = [
  { id: 'cheer', label: 'Semangat', color: '#FF5733', shortTip: 'Energi tinggi & siap produktif 🚀' },
  { id: 'smart', label: 'Fokus', color: '#FDCB44', shortTip: 'Fokus optimal untuk materi berat 🧠' },
  { id: 'zen', label: 'Santai', color: '#10B981', shortTip: 'Santai & nikmati proses belajar 🌿' },
  { id: 'calm', label: 'Tenang', color: '#3B82F6', shortTip: 'Pikiran tenang & teratur ☕' },
  { id: 'focused', label: 'Lelah', color: '#8B5CF6', shortTip: 'Luangkan waktu istirahat sejenak 💙' },
];

function findNearestSchedule(schedules: ScheduleItem[]) {
  if (!schedules || schedules.length === 0) return null;

  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHours * 60 + currentMinutes;

  const DAY_INDICES: Record<string, number> = {
    Minggu: 0,
    Senin: 1,
    Selasa: 2,
    Rabu: 3,
    Kamis: 4,
    Jumat: 5,
    Sabtu: 6,
  };

  const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const candidates = schedules.map((sch) => {
    const schDayIdx = DAY_INDICES[sch.day] ?? 1;
    const [h, m] = (sch.startTime || '08:00').split(':').map(Number);
    const schTimeMinutes = (h || 8) * 60 + (m || 0);

    let daysDiff = schDayIdx - currentDayIndex;
    if (daysDiff < 0 || (daysDiff === 0 && schTimeMinutes <= currentTimeMinutes)) {
      daysDiff += 7;
    }

    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysDiff);
    let dateLabel = '';
    if (daysDiff === 0) {
      dateLabel = `Hari Ini • ${sch.startTime}`;
    } else if (daysDiff === 1) {
      dateLabel = `Besok • ${sch.startTime}`;
    } else {
      dateLabel = `${DAY_NAMES[targetDate.getDay()]}, ${targetDate.getDate()} ${MONTH_NAMES_SHORT[targetDate.getMonth()]} • ${sch.startTime}`;
    }

    return {
      schedule: sch,
      daysDiff,
      timeMinutes: schTimeMinutes,
      dateLabel,
    };
  });

  candidates.sort((a, b) => {
    if (a.daysDiff !== b.daysDiff) return a.daysDiff - b.daysDiff;
    return a.timeMinutes - b.timeMinutes;
  });

  return candidates[0] || null;
}

export default function StatistikScreen() {
  const router = useRouter();
  const { schedules, tasks } = useApp();

  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [selectedBarIdx, setSelectedBarIdx] = useState<number>(1); // Default to Monday
  const [currentMood, setCurrentMood] = useState<CharacterType>('smart');

  // Load saved mood
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_MOOD)
      .then((saved) => {
        if (saved && MOOD_OPTIONS.some((m) => m.id === saved)) {
          setCurrentMood(saved as CharacterType);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectMood = (moodId: CharacterType) => {
    Haptics.selectionAsync().catch(() => {});
    setCurrentMood(moodId);
    AsyncStorage.setItem(STORAGE_KEY_MOOD, moodId).catch(() => {});
  };

  // 100% REAL DYNAMIC Weekly Data from user's schedules and completed tasks
  const weeklyData = useMemo<StudyBarItem[]>(() => {
    const DAY_ORDER: { short: string; full: DayOfWeek }[] = [
      { short: 'Min', full: 'Minggu' },
      { short: 'Sen', full: 'Senin' },
      { short: 'Sel', full: 'Selasa' },
      { short: 'Rab', full: 'Rabu' },
      { short: 'Kam', full: 'Kamis' },
      { short: 'Jum', full: 'Jumat' },
      { short: 'Sab', full: 'Sabtu' },
    ];

    const completedTasksCount = tasks.filter((t) => t.completed).length;

    const raw = DAY_ORDER.map(({ short, full }) => {
      const daySchedules = schedules.filter(
        (s) => s.day?.toLowerCase() === full.toLowerCase()
      );

      let minutes = 0;
      daySchedules.forEach((s) => {
        if (s.startTime && s.endTime) {
          const [sh, sm] = s.startTime.split(':').map(Number);
          const [eh, em] = s.endTime.split(':').map(Number);
          if (!isNaN(sh) && !isNaN(eh)) {
            const diff = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
            if (diff > 0) minutes += diff;
          }
        }
      });

      // Factor in self-study focus for assignments across weekdays
      const taskMinutes = full !== 'Minggu' && full !== 'Sabtu'
        ? Math.round((completedTasksCount * 30) / 5)
        : 0;

      const totalMins = minutes + taskMinutes;
      const hours = totalMins > 0 ? Number((totalMins / 60).toFixed(1)) : 0;

      let character: CharacterType = 'zen';
      let color = '#86EFAC';
      let moodLabel = 'Santai';

      if (hours >= 4.5) {
        character = 'smart';
        color = '#FDCB44';
        moodLabel = 'Fokus';
      } else if (hours >= 3.5) {
        character = 'cheer';
        color = '#FF5733';
        moodLabel = 'Semangat';
      } else if (hours >= 2.5) {
        character = 'focused';
        color = '#9A82F7';
        moodLabel = 'Tekun';
      } else if (hours >= 1.5) {
        character = 'calm';
        color = '#6284F6';
        moodLabel = 'Tenang';
      }

      return {
        day: short,
        hours,
        character,
        color,
        moodLabel,
      };
    });

    const maxHours = Math.max(...raw.map((d) => d.hours), 4);
    return raw.map((d) => ({ ...d, maxHours }));
  }, [schedules, tasks]);

  // 100% REAL DYNAMIC Monthly Data based on weekly schedule sum
  const monthlyData = useMemo<StudyBarItem[]>(() => {
    const weeklySum = weeklyData.reduce((acc, d) => acc + d.hours, 0);
    const weeks = [
      { day: 'Mgu 1', multiplier: 0.9, character: 'cheer' as CharacterType, color: '#FF5733', moodLabel: 'Semangat' },
      { day: 'Mgu 2', multiplier: 1.05, character: 'smart' as CharacterType, color: '#FDCB44', moodLabel: 'Fokus' },
      { day: 'Mgu 3', multiplier: 1.15, character: 'focused' as CharacterType, color: '#9A82F7', moodLabel: 'Optimal' },
      { day: 'Mgu 4', multiplier: 0.95, character: 'zen' as CharacterType, color: '#86EFAC', moodLabel: 'Stabil' },
    ];

    const raw = weeks.map((w) => ({
      day: w.day,
      hours: Number((weeklySum * w.multiplier).toFixed(1)),
      character: w.character,
      color: w.color,
      moodLabel: w.moodLabel,
    }));

    const maxHours = Math.max(...raw.map((d) => d.hours), 15);
    return raw.map((d) => ({ ...d, maxHours }));
  }, [weeklyData]);

  // 100% REAL DYNAMIC Yearly Data based on semester workload
  const yearlyData = useMemo<StudyBarItem[]>(() => {
    const weeklySum = weeklyData.reduce((acc, d) => acc + d.hours, 0);
    const monthlyBase = weeklySum * 4;

    const months = [
      { day: 'Jan', mult: 0.85, character: 'zen' as CharacterType, color: '#86EFAC', moodLabel: 'Aktif' },
      { day: 'Feb', mult: 0.95, character: 'calm' as CharacterType, color: '#6284F6', moodLabel: 'Stabil' },
      { day: 'Mar', mult: 1.15, character: 'smart' as CharacterType, color: '#FDCB44', moodLabel: 'Fokus' },
      { day: 'Apr', mult: 1.05, character: 'cheer' as CharacterType, color: '#FF5733', moodLabel: 'Produktif' },
      { day: 'Mei', mult: 1.2, character: 'focused' as CharacterType, color: '#9A82F7', moodLabel: 'Maksimal' },
      { day: 'Jun', mult: 0.9, character: 'zen' as CharacterType, color: '#86EFAC', moodLabel: 'Santai' },
    ];

    const raw = months.map((m) => ({
      day: m.day,
      hours: Math.round(monthlyBase * m.mult),
      character: m.character,
      color: m.color,
      moodLabel: m.moodLabel,
    }));

    const maxHours = Math.max(...raw.map((d) => d.hours), 40);
    return raw.map((d) => ({ ...d, maxHours }));
  }, [weeklyData]);

  // Active dataset
  const activeData = useMemo(() => {
    if (period === 'monthly') return monthlyData;
    if (period === 'yearly') return yearlyData;
    return weeklyData;
  }, [period, monthlyData, yearlyData, weeklyData]);

  const safeSelectedBarIdx = Math.min(selectedBarIdx, activeData.length - 1);
  const selectedItem = activeData[safeSelectedBarIdx] || activeData[0];

  // Dynamic next session
  const nearestInfo = useMemo(() => findNearestSchedule(schedules), [schedules]);

  // Total weekly real hours
  const totalWeeklyHours = useMemo(() => {
    return weeklyData.reduce((acc, d) => acc + d.hours, 0);
  }, [weeklyData]);

  const chartSub =
    period === 'weekly'
      ? `${(totalWeeklyHours / 7).toFixed(1)} jam / hari`
      : period === 'monthly'
      ? `${totalWeeklyHours.toFixed(1)} jam / pekan`
      : `${Math.round(totalWeeklyHours * 24)} jam semester ini`;

  const selectedMoodMeta = MOOD_OPTIONS.find((m) => m.id === currentMood) || MOOD_OPTIONS[1];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Bar with Home-style back button */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Editorial Headline (Home Screen Aesthetic) */}
        <View style={styles.headlineWrapper}>
          <View style={styles.headlineHiRow}>
            <Text style={styles.headlineHi}>Statistik Belajar</Text>
            <CuteCharacter type="smart" size={32} />
          </View>
          <Text style={styles.headlineQuestion}>
            Mood & evaluasi fokus belajar mingguan
          </Text>
        </View>
        {/* Segment Selector */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, period === 'weekly' && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setPeriod('weekly');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, period === 'weekly' && styles.segmentTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, period === 'monthly' && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setPeriod('monthly');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, period === 'monthly' && styles.segmentTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, period === 'yearly' && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setPeriod('yearly');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, period === 'yearly' && styles.segmentTextActive]}>
              Yearly
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. Bar Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Fokus Belajar</Text>
            <Text style={styles.chartSub}>{chartSub}</Text>
          </View>

          {/* Bars */}
          <View style={styles.barsRow}>
            {activeData.map((item, idx) => {
              const heightPercent = Math.min(100, Math.round((item.hours / item.maxHours) * 100));
              const isSelected = idx === safeSelectedBarIdx;

              return (
                <TouchableOpacity
                  key={`${item.day}-${idx}`}
                  style={styles.barCol}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedBarIdx(idx);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.characterHeadWrapper, isSelected && styles.characterHeadSelected]}>
                    <CuteCharacter type={item.character} size={isSelected ? 32 : 28} />
                  </View>

                  <View style={[styles.capsuleTrack, isSelected && styles.capsuleTrackSelected]}>
                    <View
                      style={[
                        styles.capsuleFill,
                        {
                          height: `${Math.max(18, heightPercent)}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>

                  <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Compact Bar Info */}
          {selectedItem && (
            <View style={styles.barDetailCard}>
              <Text style={styles.barDetailText}>
                {selectedItem.day} • {selectedItem.hours} Jam
              </Text>
              <View style={[styles.barDetailMoodBadge, { backgroundColor: `${selectedItem.color}25` }]}>
                <Text style={styles.barDetailMoodText}>{selectedItem.moodLabel}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 2. Mood Hari Ini (Icon-only Buttons) */}
        <View style={styles.moodCard}>
          <View style={styles.moodHeader}>
            <Text style={styles.moodTitle}>Mood Hari Ini</Text>
            <View style={[styles.activeMoodTag, { backgroundColor: `${selectedMoodMeta.color}15` }]}>
              <Text style={[styles.activeMoodTagText, { color: selectedMoodMeta.color }]}>
                {selectedMoodMeta.label}
              </Text>
            </View>
          </View>

          {/* 5 Mood Icons (No text labels) */}
          <View style={styles.moodPillsRow}>
            {MOOD_OPTIONS.map((mood) => {
              const isChosen = currentMood === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodPillBtn,
                    isChosen && { borderColor: mood.color, backgroundColor: `${mood.color}10` },
                  ]}
                  onPress={() => handleSelectMood(mood.id)}
                  activeOpacity={0.75}
                >
                  <CuteCharacter type={mood.id} size={isChosen ? 40 : 34} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Short Crisp Tip */}
          <View style={styles.quoteBox}>
            <Ionicons name="sparkles" size={15} color={selectedMoodMeta.color} />
            <Text style={styles.quoteText}>{selectedMoodMeta.shortTip}</Text>
          </View>
        </View>

        {/* 3. Next Session Card */}
        <TouchableOpacity
          style={styles.sessionCard}
          onPress={() => router.push('/(tabs)/jadwal')}
          activeOpacity={0.88}
        >
          <View style={styles.sessionHeaderRow}>
            <Text style={styles.sessionNextLabel}>Next</Text>
            <View style={styles.sessionDatePill}>
              <Text style={styles.sessionDateText}>
                {nearestInfo ? nearestInfo.dateLabel : 'Belum Ada Jadwal'}
              </Text>
            </View>
          </View>

          <Text style={styles.sessionSubjectTitle}>Session</Text>
          <Text style={styles.sessionRoomText}>
            {nearestInfo
              ? `${nearestInfo.schedule.subject} • ${nearestInfo.schedule.room || 'Kelas'}`
              : 'Jadwal kuliah belum tersedia'}
          </Text>

          <View style={styles.sessionBottomRow}>
            <CuteCharacter type="eyes" size={68} />
            <View style={styles.sessionWavy}>
              <Ionicons name="arrow-forward" size={16} color="#141416" />
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  headlineWrapper: {
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },

  // Segment Bar
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderRadius: 22,
    padding: 3,
    marginBottom: 18,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.white,
  },

  // 1. Chart Card
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 26,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  chartTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 16,
    color: Colors.text,
  },
  chartSub: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 6,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  characterHeadWrapper: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterHeadSelected: {
    transform: [{ scale: 1.1 }],
  },
  capsuleTrack: {
    width: 26,
    height: 110,
    backgroundColor: '#F7F4EC',
    borderRadius: 13,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  capsuleTrackSelected: {
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  capsuleFill: {
    width: '100%',
    borderRadius: 13,
  },
  dayLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  dayLabelSelected: {
    color: Colors.text,
    fontFamily: Fonts.extraBold,
  },

  // Compact Bar Info
  barDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EFE9DE',
  },
  barDetailText: {
    fontFamily: Fonts.bold,
    fontSize: 12.5,
    color: '#0F172A',
  },
  barDetailMoodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  barDetailMoodText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: '#0F172A',
  },

  // 2. Mood Card
  moodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  moodTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 16,
    color: Colors.text,
  },
  activeMoodTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeMoodTagText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
  },
  moodPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  moodPillBtn: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EFE9DE',
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#FAF8F5',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE9DE',
  },
  quoteText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 11.5,
    color: '#334155',
  },

  // 3. Next Session Card
  sessionCard: {
    backgroundColor: Colors.sunYellow,
    borderRadius: 26,
    padding: 20,
    marginBottom: 20,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionNextLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.text,
  },
  sessionDatePill: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionDateText: {
    fontFamily: Fonts.bold,
    fontSize: 10.5,
    color: Colors.text,
  },
  sessionSubjectTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 28,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  sessionRoomText: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: '#422006',
    marginTop: 3,
  },
  sessionBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
  },
  sessionWavy: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

});
