import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Fonts } from '@/constants/theme';
import { CuteCharacter, CharacterType } from '@/components/CuteCharacter';
import { notificationService } from '@/services/notificationService';
import { ModernAlertModal, AlertType } from '@/components/ModernAlertModal';

export type PomodoroMode = 'focus' | 'short_break' | 'long_break';

interface ModeConfig {
  id: PomodoroMode;
  title: string;
  shortLabel: string;
  defaultMinutes: number;
  color: string;
  character: CharacterType;
  quote: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const MODES: Record<PomodoroMode, ModeConfig> = {
  focus: {
    id: 'focus',
    title: 'Fokus Belajar',
    shortLabel: 'Fokus',
    defaultMinutes: 25,
    color: '#FF5733',
    character: 'smart',
    quote: 'Fokus belajar penuh, singkirkan gangguan sejenak! 🧠✨',
    icon: 'flame',
  },
  short_break: {
    id: 'short_break',
    title: 'Istirahat Singkat',
    shortLabel: 'Istirahat',
    defaultMinutes: 5,
    color: '#10B981',
    character: 'zen',
    quote: 'Tarik nafas dalam-dalam, minum air & relaksasi sejenak 🌿☕',
    icon: 'cafe-outline',
  },
  long_break: {
    id: 'long_break',
    title: 'Istirahat Panjang',
    shortLabel: 'Panjang',
    defaultMinutes: 15,
    color: '#3B82F6',
    character: 'cheer',
    quote: 'Hebat! Kamu sudah menyelesaikan target fokus. Segarkan energimu! 🎉🚀',
    icon: 'sparkles-outline',
  },
};

const STORAGE_KEY_STATS = '@eduplaner_pomodoro_stats_v1';
const STORAGE_KEY_CUSTOM_DURATIONS = '@eduplaner_pomodoro_durations_v1';

export interface CustomDurations {
  focus: number;
  short_break: number;
  long_break: number;
}

const DEFAULT_DURATIONS: CustomDurations = {
  focus: 25,
  short_break: 5,
  long_break: 15,
};

interface PomodoroStats {
  date: string;
  completedFocusCount: number;
  totalFocusMinutes: number;
}

function playCompletionBeep() {
  if (Platform.OS === 'web') {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch {
      // ignore
    }
  }
}

export default function PomodoroScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [durations, setDurations] = useState<CustomDurations>(DEFAULT_DURATIONS);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(DEFAULT_DURATIONS.focus * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [stats, setStats] = useState<PomodoroStats>({
    date: new Date().toISOString().split('T')[0],
    completedFocusCount: 0,
    totalFocusMinutes: 0,
  });

  // Duration settings modal
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [tempDurations, setTempDurations] = useState<CustomDurations>(DEFAULT_DURATIONS);

  // Alert Modal
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load custom durations & persistent stats
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    // Load durations
    AsyncStorage.getItem(STORAGE_KEY_CUSTOM_DURATIONS)
      .then((data) => {
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed.focus === 'number') {
            setDurations(parsed);
            setSecondsRemaining(parsed.focus * 60);
          }
        }
      })
      .catch(() => {});

    // Load stats
    AsyncStorage.getItem(STORAGE_KEY_STATS)
      .then((data) => {
        if (data) {
          const parsed: PomodoroStats = JSON.parse(data);
          if (parsed.date === today) {
            setStats(parsed);
          } else {
            // New day reset
            const resetStats: PomodoroStats = {
              date: today,
              completedFocusCount: 0,
              totalFocusMinutes: 0,
            };
            setStats(resetStats);
            AsyncStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(resetStats)).catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

  const saveStats = useCallback(async (newStats: PomodoroStats) => {
    setStats(newStats);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(newStats));
    } catch {
      // ignore
    }
  }, []);

  const switchMode = useCallback((newMode: PomodoroMode) => {
    setIsRunning(false);
    notificationService.cancelPomodoroAlarm().catch(() => {});
    setMode(newMode);
    setSecondsRemaining(durations[newMode] * 60);
    Haptics.selectionAsync().catch(() => {});
  }, [durations]);

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    playCompletionBeep();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    notificationService.cancelPomodoroAlarm().catch(() => {});

    const isFocus = mode === 'focus';
    const alarmTitle = isFocus ? 'Waktu Fokus Selesai!' : 'Waktu Istirahat Selesai!';
    const alarmBody = isFocus
      ? 'Hebat! Waktu fokus belajar kamu telah selesai. Saatnya istirahat sejenak.'
      : 'Waktu istirahat sudah usai. Yuk mulai sesi fokus berikutnya!';

    // 1. Trigger full-screen Alarm Ringing Modal with sound & vibration
    notificationService.triggerAlarmRinging({
      id: `pomodoro_${Date.now()}`,
      title: alarmTitle,
      body: alarmBody,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    // 2. Dispatch heads-up notification
    notificationService.sendHeadsUpNotification({
      type: 'alarm',
      title: alarmTitle,
      subtitle: 'Alarm Pomodoro Berbunyi',
      body: alarmBody,
      badgeText: 'WAKTU HABIS',
      route: '/pomodoro',
    }).catch(() => {});

    if (isFocus) {
      const minutesSpent = durations.focus;
      const today = new Date().toISOString().split('T')[0];
      const updatedStats: PomodoroStats = {
        date: today,
        completedFocusCount: (stats.completedFocusCount || 0) + 1,
        totalFocusMinutes: (stats.totalFocusMinutes || 0) + minutesSpent,
      };
      saveStats(updatedStats);

      // Record in notification history
      notificationService.addNotificationHistory(
        'Sesi Fokus Selesai!',
        `Kamu telah fokus selama ${minutesSpent} menit. Hebat! Saatnya istirahat sejenak.`,
        'task'
      ).catch(() => {});

      const nextCycle = cycleCount >= 4 ? 1 : cycleCount + 1;
      setCycleCount(nextCycle);

      const nextMode: PomodoroMode = cycleCount >= 4 ? 'long_break' : 'short_break';
      setAlertInfo({
        visible: true,
        title: 'Sesi Fokus Selesai!',
        message:
          cycleCount >= 4
            ? `Luar biasa! 4 sesi fokus telah kamu tuntaskan. Saatnya nikmati Istirahat Panjang ${durations.long_break} menit.`
            : `Kerja bagus! ${durations.focus} menit fokus belajar tuntas. Istirahat singkat ${durations.short_break} menit yuk.`,
        type: 'success',
        onConfirm: () => switchMode(nextMode),
      });
    } else {
      // Break complete
      notificationService.addNotificationHistory(
        'Istirahat Selesai',
        'Waktu istirahat sudah usai. Yuk siap kembali untuk sesi fokus belajar berikutnya!',
        'alarm'
      ).catch(() => {});

      setAlertInfo({
        visible: true,
        title: 'Istirahat Selesai!',
        message: 'Energi sudah terisi kembali. Siap memulai sesi fokus belajar berikutnya?',
        type: 'info',
        onConfirm: () => switchMode('focus'),
      });
    }
  }, [mode, cycleCount, stats, durations, saveStats, switchMode]);

  // Timer countdown logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimeout(() => {
              handleTimerComplete();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, handleTimerComplete]);

  const handleTogglePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const willRun = !isRunning;
    const nextSeconds = secondsRemaining === 0 ? durations[mode] * 60 : secondsRemaining;
    if (secondsRemaining === 0) {
      setSecondsRemaining(nextSeconds);
    }
    setIsRunning(willRun);

    if (willRun) {
      // Schedule background OS notification in case user minimizes/exits app
      const title = mode === 'focus' ? 'Fokus Belajar Selesai!' : 'Istirahat Selesai!';
      const body = mode === 'focus' ? 'Waktu fokus belajar telah tuntas.' : 'Waktu istirahat telah usai.';
      notificationService.schedulePomodoroAlarm(nextSeconds, title, body).catch(() => {});
    } else {
      notificationService.cancelPomodoroAlarm().catch(() => {});
    }
  };

  const handleReset = () => {
    Haptics.selectionAsync().catch(() => {});
    setIsRunning(false);
    notificationService.cancelPomodoroAlarm().catch(() => {});
    setSecondsRemaining(durations[mode] * 60);
  };

  const handleSkip = () => {
    Haptics.selectionAsync().catch(() => {});
    setIsRunning(false);
    notificationService.cancelPomodoroAlarm().catch(() => {});
    const nextMode = mode === 'focus' ? 'short_break' : 'focus';
    switchMode(nextMode);
  };

  // Duration settings handlers
  const openSettingsModal = () => {
    Haptics.selectionAsync().catch(() => {});
    setTempDurations({ ...durations });
    setSettingsModalVisible(true);
  };

  const adjustTempDuration = (type: keyof CustomDurations, delta: number, min = 1, max = 120) => {
    Haptics.selectionAsync().catch(() => {});
    setTempDurations((prev) => ({
      ...prev,
      [type]: Math.min(max, Math.max(min, prev[type] + delta)),
    }));
  };

  const setExactTempDuration = (type: keyof CustomDurations, minutes: number) => {
    Haptics.selectionAsync().catch(() => {});
    setTempDurations((prev) => ({
      ...prev,
      [type]: minutes,
    }));
  };

  const handleSaveDurations = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setDurations(tempDurations);
    setSettingsModalVisible(false);
    await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_DURATIONS, JSON.stringify(tempDurations)).catch(() => {});
    if (!isRunning) {
      setSecondsRemaining(tempDurations[mode] * 60);
    }
  };

  const handleResetDefaultDurations = () => {
    Haptics.selectionAsync().catch(() => {});
    setTempDurations({ ...DEFAULT_DURATIONS });
  };

  // Time calculations
  const totalModeSeconds = durations[mode] * 60;
  const progressPercent = Math.max(0, Math.min(1, 1 - secondsRemaining / totalModeSeconds));
  const displayMinutes = Math.floor(secondsRemaining / 60);
  const displaySeconds = secondsRemaining % 60;
  const formattedTime = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;

  // SVG circular ring metrics
  const ringSize = 240;
  const strokeWidth = 14;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressPercent);

  const activeConfig = MODES[mode];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Bar with standard EduPlaner circular back button and settings button */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.actionCircleBtn}
            onPress={openSettingsModal}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCircleBtn}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.text} />
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
            <Text style={styles.headlineHi}>Timer Pomodoro</Text>
            <CuteCharacter type={activeConfig.character} size={32} />
          </View>
          <Text style={styles.headlineQuestion}>
            Metode fokus terbukti untuk hasil belajar optimal
          </Text>
        </View>

        {/* Mode Selector Tabs with customizable duration badges */}
        <View style={styles.modeTabs}>
          {(['focus', 'short_break', 'long_break'] as PomodoroMode[]).map((mKey) => {
            const config = MODES[mKey];
            const isActive = mode === mKey;
            const durationMin = durations[mKey];
            return (
              <TouchableOpacity
                key={mKey}
                style={[
                  styles.modeTabBtn,
                  isActive && { backgroundColor: config.color },
                ]}
                onPress={() => switchMode(mKey)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    isActive && styles.modeTabTextActive,
                  ]}
                >
                  {mKey === 'focus' ? `Fokus (${durationMin}m)` : mKey === 'short_break' ? `Istirahat (${durationMin}m)` : `Panjang (${durationMin}m)`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Circular Timer Main Card */}
        <View style={styles.timerCard}>
          {/* Badge & Cycle indicator */}
          <View style={styles.badgeRow}>
            <TouchableOpacity
              style={[styles.modeBadge, { backgroundColor: `${activeConfig.color}18` }]}
              onPress={openSettingsModal}
              activeOpacity={0.75}
            >
              <Ionicons name={activeConfig.icon} size={15} color={activeConfig.color} />
              <Text style={[styles.modeBadgeText, { color: activeConfig.color }]}>
                {activeConfig.title} ({durations[mode]} Menit)
              </Text>
              <Ionicons name="pencil" size={11} color={activeConfig.color} />
            </TouchableOpacity>

            {mode === 'focus' && (
              <View style={styles.cycleIndicator}>
                {[1, 2, 3, 4].map((step) => {
                  const isDone = step < cycleCount;
                  const isCurrent = step === cycleCount;
                  return (
                    <View
                      key={step}
                      style={[
                        styles.cycleDot,
                        isDone && { backgroundColor: activeConfig.color },
                        isCurrent && {
                          backgroundColor: activeConfig.color,
                          width: 14,
                          borderRadius: 7,
                        },
                      ]}
                    />
                  );
                })}
                <Text style={styles.cycleText}>Sesi {cycleCount}/4</Text>
              </View>
            )}
          </View>

          {/* SVG Circular Dial */}
          <View style={styles.ringWrapper}>
            <Svg width={ringSize} height={ringSize}>
              {/* Background ring */}
              <Circle
                stroke="#E2E8F0"
                fill="none"
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                strokeWidth={strokeWidth}
              />
              {/* Progress ring */}
              <Circle
                stroke={activeConfig.color}
                fill="none"
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              />
            </Svg>

            {/* Centered Time & Character Display (Tappable to customize duration) */}
            <TouchableOpacity
              style={styles.ringCenterContent}
              onPress={openSettingsModal}
              activeOpacity={0.75}
            >
              <Text style={styles.timerDisplay}>{formattedTime}</Text>
              <View style={styles.timerBadgeHint}>
                <Ionicons name="create-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.timerSubText}>
                  {isRunning ? 'Sedang Berjalan' : secondsRemaining === 0 ? 'Selesai' : 'Ubah Durasi'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Encouraging Quote Bubble */}
          <View style={styles.quoteBubble}>
            <CuteCharacter type={activeConfig.character} size={28} />
            <Text style={styles.quoteText}>{activeConfig.quote}</Text>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.secondaryControlBtn}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryPlayBtn,
                { backgroundColor: activeConfig.color },
              ]}
              onPress={handleTogglePlay}
              activeOpacity={0.88}
            >
              <Ionicons
                name={isRunning ? 'pause' : 'play'}
                size={26}
                color="#FFFFFF"
                style={{ marginLeft: isRunning ? 0 : 3 }}
              />
              <Text style={styles.primaryPlayText}>
                {isRunning ? 'Jeda' : secondsRemaining < totalModeSeconds && secondsRemaining > 0 ? 'Lanjutkan' : 'Mulai Fokus'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryControlBtn}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Ionicons name="play-skip-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Stats Summary Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
            <Text style={styles.statsTitle}>Pencapaian Fokus Hari Ini</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{stats.completedFocusCount}</Text>
              <Text style={styles.statsLabel}>Sesi Tuntas</Text>
            </View>

            <View style={styles.statsDivider} />

            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{stats.totalFocusMinutes}</Text>
              <Text style={styles.statsLabel}>Menit Fokus</Text>
            </View>

            <View style={styles.statsDivider} />

            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>
                {Math.round((stats.completedFocusCount / 4) * 100)}%
              </Text>
              <Text style={styles.statsLabel}>Target Harian</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modern Duration Customization Modal */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSettingsModalVisible(false)}
          />
          <View style={styles.modalContent}>
            {/* Handle Drag bar */}
            <View style={styles.modalDragHandle} />

            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Atur Durasi Pomodoro</Text>
                <Text style={styles.modalSubtitle}>Kustomisasi ritme fokus & istirahat belajarmu</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSettingsModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
              {/* Section 1: Fokus Belajar */}
              <View style={styles.durationSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: '#FF573318' }]}>
                    <Ionicons name="flame" size={16} color="#FF5733" />
                  </View>
                  <Text style={styles.sectionTitle}>Fokus Belajar</Text>
                  <Text style={[styles.sectionValText, { color: '#FF5733' }]}>
                    {tempDurations.focus} Menit
                  </Text>
                </View>

                {/* Preset Chips */}
                <View style={styles.presetChipsRow}>
                  {[15, 20, 25, 30, 45, 60].map((mins) => {
                    const isSelected = tempDurations.focus === mins;
                    return (
                      <TouchableOpacity
                        key={mins}
                        style={[
                          styles.presetChip,
                          isSelected && { backgroundColor: '#FF5733', borderColor: '#FF5733' },
                        ]}
                        onPress={() => setExactTempDuration('focus', mins)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                          {mins}m
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Stepper */}
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => adjustTempDuration('focus', -5, 5, 120)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.stepperValueText}>{tempDurations.focus} Menit</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => adjustTempDuration('focus', 5, 5, 120)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Section 2: Istirahat Singkat */}
              <View style={styles.durationSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: '#10B98118' }]}>
                    <Ionicons name="cafe" size={16} color="#10B981" />
                  </View>
                  <Text style={styles.sectionTitle}>Istirahat Singkat</Text>
                  <Text style={[styles.sectionValText, { color: '#10B981' }]}>
                    {tempDurations.short_break} Menit
                  </Text>
                </View>

                {/* Preset Chips */}
                <View style={styles.presetChipsRow}>
                  {[3, 5, 10, 15].map((mins) => {
                    const isSelected = tempDurations.short_break === mins;
                    return (
                      <TouchableOpacity
                        key={mins}
                        style={[
                          styles.presetChip,
                          isSelected && { backgroundColor: '#10B981', borderColor: '#10B981' },
                        ]}
                        onPress={() => setExactTempDuration('short_break', mins)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                          {mins}m
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Stepper */}
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => adjustTempDuration('short_break', -1, 1, 30)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.stepperValueText}>{tempDurations.short_break} Menit</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => adjustTempDuration('short_break', 1, 1, 30)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Section 3: Istirahat Panjang */}
              <View style={styles.durationSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: '#3B82F618' }]}>
                    <Ionicons name="sparkles" size={16} color="#3B82F6" />
                  </View>
                  <Text style={styles.sectionTitle}>Istirahat Panjang</Text>
                  <Text style={[styles.sectionValText, { color: '#3B82F6' }]}>
                    {tempDurations.long_break} Menit
                  </Text>
                </View>

                {/* Preset Chips */}
                <View style={styles.presetChipsRow}>
                  {[10, 15, 20, 30].map((mins) => {
                    const isSelected = tempDurations.long_break === mins;
                    return (
                      <TouchableOpacity
                        key={mins}
                        style={[
                          styles.presetChip,
                          isSelected && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
                        ]}
                        onPress={() => setExactTempDuration('long_break', mins)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                          {mins}m
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Stepper */}
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => adjustTempDuration('long_break', -5, 5, 60)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.stepperValueText}>{tempDurations.long_break} Menit</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => adjustTempDuration('long_break', 5, 5, 60)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.saveDurationBtn}
                onPress={handleSaveDurations}
                activeOpacity={0.88}
              >
                <Text style={styles.saveDurationBtnText}>Simpan Durasi Baru</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetDefaultBtn}
                onPress={handleResetDefaultDurations}
                activeOpacity={0.7}
              >
                <Text style={styles.resetDefaultBtnText}>Reset ke Standar (25/5/15)</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Styled Modern Alert Modal */}
      <ModernAlertModal
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={() => {
          setAlertInfo((prev) => ({ ...prev, visible: false }));
          if (alertInfo.onConfirm) {
            alertInfo.onConfirm();
          }
        }}
      />
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  actionCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },

  // Large Editorial Headline
  headlineWrapper: {
    marginBottom: 16,
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

  // Mode Tabs
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    padding: 4,
    marginBottom: 18,
    gap: 4,
  },
  modeTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: Colors.white,
  },

  // Timer Card
  timerCard: {
    backgroundColor: Colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 22,
    alignItems: 'center',
    marginBottom: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 18,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  modeBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  cycleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cycleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  cycleText: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 4,
  },

  // Ring
  ringWrapper: {
    position: 'relative',
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  ringCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDisplay: {
    fontFamily: Fonts.extraBold,
    fontSize: 52,
    color: Colors.text,
    letterSpacing: -1,
  },
  timerBadgeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timerSubText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: Colors.textSecondary,
  },

  // Quote Bubble
  quoteBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    width: '100%',
    marginVertical: 16,
  },
  quoteText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: Colors.text,
    lineHeight: 18,
  },

  // Controls Row
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    marginTop: 6,
  },
  primaryPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 10,
    flex: 1,
    maxWidth: 220,
  },
  primaryPlayText: {
    fontFamily: Fonts.extraBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryControlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Stats Card
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 18,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  statsTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statsItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsNumber: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    color: Colors.text,
  },
  statsLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  statsDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  modalDragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollBody: {
    paddingBottom: 20,
  },
  durationSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  sectionValText: {
    fontFamily: Fonts.extraBold,
    fontSize: 14,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipText: {
    fontFamily: Fonts.bold,
    fontSize: 12.5,
    color: Colors.text,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueText: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
    color: Colors.text,
  },
  saveDurationBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  saveDurationBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  resetDefaultBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetDefaultBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
