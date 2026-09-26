import { Platform } from 'react-native';

export type NotificationType = 'alarm' | 'streak' | 'payment' | 'reminder' | 'task';

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  subtitle?: string;
  badgeText?: string;
  route?: string;
  createdAt: number;
}

// In Expo SDK 53+, remote push tokens require dev builds, but local scheduled notifications
// and Android notification sound channels are fully supported on native.
let Notifications: any = null;

if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (err) {
    console.warn('[NotificationService] Native notifications not available in current environment:', err);
    Notifications = null;
  }
}

// In-app banner subscribers for heads-up top notification
type NotificationListener = (payload: NotificationPayload) => void;
const listeners = new Set<NotificationListener>();

class NotificationService {
  private initialized = false;

  public async initAsync(): Promise<void> {
    if (this.initialized || Platform.OS === 'web' || !Notifications) return;

    try {
      // 1. Android Channel: Alarms (Highest priority, loud sound & vibration)
      if (typeof Notifications.setNotificationChannelAsync === 'function') {
        await Notifications.setNotificationChannelAsync('alarms', {
          name: 'Alarm & Jadwal Penting',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 200, 500, 200, 500],
          sound: 'default',
          enableVibrate: true,
          lightColor: '#EF4444',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        });

        // 2. Android Channel: Reminders & Streaks (Heads-up banner like payment notification)
        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Pengingat, Streak & Prestasi',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          enableVibrate: true,
          lightColor: '#2563EB',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      this.initialized = true;
    } catch (e) {
      console.warn('Failed to configure Android notification channels:', e);
    }
  }

  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications) return true;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch {
      return false;
    }
  }

  public subscribe(listener: NotificationListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * Send a rich heads-up notification (Displays in phone top notification tray & in-app floating banner)
   */
  public async sendHeadsUpNotification(params: {
    type: NotificationType;
    title: string;
    body: string;
    subtitle?: string;
    badgeText?: string;
    route?: string;
  }): Promise<void> {
    const payload: NotificationPayload = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: params.type,
      title: params.title,
      body: params.body,
      subtitle: params.subtitle,
      badgeText: params.badgeText,
      route: params.route,
      createdAt: Date.now(),
    };

    // 1. Immediately emit to in-app banner listeners (Works on Expo Go, Web preview & Mobile foreground)
    listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('Error invoking in-app notification listener:', err);
      }
    });

    // 2. Dispatch to OS native notification tray (when running in standalone APK / dev build)
    if (Platform.OS !== 'web' && Notifications) {
      try {
        await this.initAsync();
        const hasPermission = await this.requestPermissions();
        if (hasPermission && typeof Notifications.scheduleNotificationAsync === 'function') {
          const channelId = params.type === 'alarm' ? 'alarms' : 'reminders';
          await Notifications.scheduleNotificationAsync({
            content: {
              title: params.title,
              subtitle: params.subtitle,
              body: params.body,
              data: {
                route: params.route,
                type: params.type,
                badgeText: params.badgeText,
              },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority?.MAX ?? 2,
              color: params.type === 'streak' ? '#F59E0B' : params.type === 'alarm' ? '#EF4444' : '#2563EB',
            },
            trigger: {
              channelId,
              seconds: 1,
              type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
            },
          });
        }
      } catch (e) {
        console.warn('Native notification schedule error:', e);
      }
    }
  }

  /**
   * Schedule a future alarm notification at a specific time (e.g. "07:00")
   */
  public async scheduleAlarmNotification(params: {
    id: string;
    title: string;
    body: string;
    time: string; // "HH:MM"
    route?: string;
  }): Promise<string | null> {
    if (Platform.OS === 'web' || !Notifications) {
      return null;
    }

    try {
      await this.initAsync();
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const [hours, minutes] = params.time.split(':').map((v) => parseInt(v, 10));
      const scheduledDate = new Date();
      scheduledDate.setHours(hours, minutes, 0, 0);

      // If time has already passed today, schedule for tomorrow
      if (scheduledDate.getTime() <= Date.now()) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      const diffSeconds = Math.max(1, Math.floor((scheduledDate.getTime() - Date.now()) / 1000));

      if (typeof Notifications.scheduleNotificationAsync === 'function') {
        const notifId = await Notifications.scheduleNotificationAsync({
          identifier: params.id,
          content: {
            title: `⏰ ${params.title}`,
            body: params.body,
            data: { route: params.route || '/reminder', type: 'alarm' },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority?.MAX ?? 2,
          },
          trigger: {
            channelId: 'alarms',
            seconds: diffSeconds,
            type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
          },
        });
        return notifId;
      }
      return null;
    } catch (e) {
      console.warn('Error scheduling alarm notification:', e);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  public async cancelNotification(notificationId: string): Promise<void> {
    if (Platform.OS === 'web' || !Notifications) return;
    try {
      if (typeof Notifications.cancelScheduledNotificationAsync === 'function') {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }
    } catch {
      // ignore
    }
  }

  // ==========================================
  // QUICK TEST PRESETS
  // ==========================================

  public async triggerTestAlarm(title = 'Waktunya Belajar!'): Promise<void> {
    await this.sendHeadsUpNotification({
      type: 'alarm',
      title: title,
      subtitle: 'Alarm Belajar',
      body: 'Waktu fokus belajar telah tiba. Buka modul dan mulai belajar!',
      badgeText: 'ALARM BELAJAR',
      route: '/reminder',
    });
  }

  public async triggerTestStreak(streakDays = 7): Promise<void> {
    await this.sendHeadsUpNotification({
      type: 'streak',
      title: `Streak ${streakDays} Hari Tercapai!`,
      subtitle: 'Milestone Disiplin',
      body: `Konsistensi belajarmu luar biasa! Pertahankan ritme harianmu.`,
      badgeText: `STREAK ${streakDays} HARI`,
      route: '/kebiasaan',
    });
  }

  public async triggerTestPayment(amount = 150): Promise<void> {
    await this.sendHeadsUpNotification({
      type: 'payment',
      title: `+${amount} XP Poin Prestasi`,
      subtitle: 'Hadiah Belajar',
      body: `Poin prestasi baru berhasil ditambahkan ke profil belajarmu.`,
      badgeText: 'POIN PRESTASI',
      route: '/profil',
    });
  }

  public async triggerTestReminder(taskName = 'Tugas Kalkulus'): Promise<void> {
    await this.sendHeadsUpNotification({
      type: 'reminder',
      title: `Tenggat Waktu: ${taskName}`,
      subtitle: 'Pengingat Tugas',
      body: `Ada tugas yang perlu diselesaikan hari ini. Cek daftarmu!`,
      badgeText: 'PENGINGAT',
      route: '/daftar-tugas',
    });
  }
}

export const notificationService = new NotificationService();
