import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Fonts } from '@/constants/theme';
import { notificationService, AlarmEventData } from '@/services/notificationService';

// Optional Web Audio synth beep for web/browser environment
function playWebAudioBeep() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
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
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // ignore
    }
  }
}

export function AlarmRingingModal() {
  const [visible, setVisible] = useState(false);
  const [alarmData, setAlarmData] = useState<AlarmEventData | null>(null);

  // Animations (state-based to comply with React 19 compiler rules)
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [ringAnim] = useState(() => new Animated.Value(0));
  const vibrationInterval = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribeAlarm((data) => {
      setAlarmData(data);
      setVisible(true);
    });

    return () => {
      unsubscribe();
      if (vibrationInterval.current) {
        clearInterval(vibrationInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (visible) {

      // 2. Bell shake animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: -15, duration: 80, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 15, duration: 80, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
          Animated.delay(800),
        ])
      ).start();

      // 3. Play native system alarm ringtone & loop vibration pattern
      if (alarmData) {
        notificationService.ringSystemAlarmPing(alarmData.title, alarmData.body).catch(() => {});
      }

      const ringAlarmCycle = () => {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          playWebAudioBeep();
        } catch {
          // ignore
        }
      };

      ringAlarmCycle();
      vibrationInterval.current = setInterval(ringAlarmCycle, 2000);
    } else {
      pulseAnim.setValue(1);
      ringAnim.setValue(0);
      if (vibrationInterval.current) {
        clearInterval(vibrationInterval.current);
        vibrationInterval.current = null;
      }
    }
  }, [visible, pulseAnim, ringAnim, alarmData]);

  const handleDismiss = () => {
    notificationService.dismissAllAlarms().catch(() => {});
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      // ignore
    }
    setVisible(false);
    setAlarmData(null);
  };

  const handleSnooze = async () => {
    notificationService.dismissAllAlarms().catch(() => {});
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {
      // ignore
    }
    if (alarmData) {
      // Reschedule for 5 minutes later
      const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
      const hours = String(snoozeTime.getHours()).padStart(2, '0');
      const minutes = String(snoozeTime.getMinutes()).padStart(2, '0');
      await notificationService.scheduleAlarmNotification({
        id: `snooze_${Date.now()}`,
        title: alarmData.title,
        body: alarmData.body || 'Pengingat tunda 5 menit',
        time: `${hours}:${minutes}`,
      });
      await notificationService.sendHeadsUpNotification({
        type: 'alarm',
        title: 'Alarm Ditunda 5 Menit',
        subtitle: `Akan berbunyi lagi pukul ${hours}:${minutes}`,
        body: `Alarm "${alarmData.title}" berhasil ditunda.`,
        badgeText: 'DITUNDA',
      });
    }
    setVisible(false);
    setAlarmData(null);
  };

  const ringInterpolate = useMemo(
    () =>
      ringAnim.interpolate({
        inputRange: [-15, 15],
        outputRange: ['-15deg', '15deg'],
      }),
    [ringAnim]
  );

  if (!visible || !alarmData) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Top Space (Clean, no badge) */}
        <View style={styles.topBar} />

        {/* Center Clock & Ringing Graphic */}
        <View style={styles.centerSection}>
          <View style={styles.bellIconBox}>
            <Animated.View style={{ transform: [{ rotate: ringInterpolate }] }}>
              <Ionicons name="alarm" size={46} color="#EF4444" />
            </Animated.View>
          </View>

          {/* Large Time Display */}
          <Text style={styles.timeText}>
            {alarmData.time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </Text>

          {/* Alarm Title & Description */}
          <Text style={styles.titleText}>{alarmData.title}</Text>
          <Text style={styles.bodyText}>
            {alarmData.body || 'Waktunya memulai agenda dan kelas belajar Anda!'}
          </Text>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          {/* Snooze Button */}
          <TouchableOpacity
            style={styles.snoozeBtn}
            onPress={handleSnooze}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={20} color="#F8FAFC" style={{ marginRight: 8 }} />
            <Text style={styles.snoozeBtnText}>Tunda 5 Menit (Snooze)</Text>
          </TouchableOpacity>

          {/* Dismiss Button (Big Red Stop) */}
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={handleDismiss}
            activeOpacity={0.85}
          >
            <Ionicons name="stop-circle" size={26} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.dismissBtnText}>Matikan Alarm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
  },
  topBar: {
    height: 10,
  },
  centerSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  bellIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timeText: {
    fontFamily: Fonts.extraBold,
    fontSize: 54,
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 10,
  },
  titleText: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  bodyText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  bottomSection: {
    gap: 12,
  },
  snoozeBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snoozeBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#F8FAFC',
  },
  dismissBtn: {
    height: 58,
    borderRadius: 18,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontFamily: Fonts.extraBold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
