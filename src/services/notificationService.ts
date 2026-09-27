import { Platform, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export interface NotificationHistoryItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  subtitle?: string;
  badgeText?: string;
  route?: string;
  createdAt: number;
  read: boolean;
}

export interface AlarmEventData {
  id: string;
  title: string;
  body: string;
  time: string;
}

const NOTIF_HISTORY_STORAGE_KEY = '@eduplaner_notification_history';

// In Expo SDK 53+, remote push tokens require dev builds, but local scheduled notifications
// and Android notification sound channels are fully supported on native.
export const ALARM_CHANNEL_ID = 'eduplaner_alarm_loud_v2';
export const REMINDER_CHANNEL_ID = 'eduplaner_reminders_v2';

let Notifications: any = null;

if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          priority: Notifications.AndroidNotificationPriority?.MAX ?? 2,
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

// Alarm subscribers for full-screen alarm ringing modal
type AlarmListener = (alarmData: AlarmEventData) => void;
const alarmListeners = new Set<AlarmListener>();

class NotificationService {
  private initialized = false;

  public async initAsync(): Promise<void> {
    if (this.initialized || Platform.OS === 'web' || !Notifications) return;

    try {
      if (typeof Notifications.setNotificationChannelAsync === 'function') {
        // Delete stale/muted channels from previous versions
        try {
          if (typeof Notifications.deleteNotificationChannelAsync === 'function') {
            await Notifications.deleteNotificationChannelAsync('alarms');
          }
        } catch {
          // ignore
        }

        // 1. Android Channel: Alarms (Loud, highest importance, Alarm audio usage stream)
        await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
          name: 'Alarm & Jadwal Belajar (Loud)',
          importance: Notifications.AndroidImportance?.MAX ?? 7,
          vibrationPattern: [0, 800, 400, 800, 400, 800],
          sound: 'default',
          enableVibrate: true,
          enableLights: true,
          lightColor: '#EF4444',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC ?? 1,
          bypassDnd: true,
          audioAttributes: {
            usage: Notifications.AndroidAudioUsage?.ALARM ?? 4,
            contentType: Notifications.AndroidAudioContentType?.SONIFICATION ?? 4,
            flags: {
              enforceAudibility: true,
            },
          },
        });

        // 2. Android Channel: Reminders & Streaks
        await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
          name: 'Pengingat, Streak & Prestasi',
          importance: Notifications.AndroidImportance?.HIGH ?? 6,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          enableVibrate: true,
          lightColor: '#2563EB',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC ?? 1,
        });
      }

      // Attach listener for foreground & background notification triggers
      if (typeof Notifications.addNotificationReceivedListener === 'function') {
        Notifications.addNotificationReceivedListener((notification: any) => {
          const data = notification?.request?.content?.data;
          if (data?.type === 'alarm') {
            const rawTitle = notification.request?.content?.title || 'Alarm EduPlaner';
            const cleanTitle = rawTitle.replace('⏰ ', '');
            this.triggerAlarmRinging({
              id: notification.request?.identifier || `alarm_${Date.now()}`,
              title: cleanTitle,
              body: notification.request?.content?.body || 'Waktunya agenda belajar Anda!',
              time: data.time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            });
          }
        });
      }

      if (typeof Notifications.addNotificationResponseReceivedListener === 'function') {
        Notifications.addNotificationResponseReceivedListener((response: any) => {
          const data = response?.notification?.request?.content?.data;
          if (data?.type === 'alarm') {
            const rawTitle = response.notification?.request?.content?.title || 'Alarm EduPlaner';
            const cleanTitle = rawTitle.replace('⏰ ', '');
            this.triggerAlarmRinging({
              id: response.notification?.request?.identifier || `alarm_${Date.now()}`,
              title: cleanTitle,
              body: response.notification?.request?.content?.body || 'Waktunya agenda belajar Anda!',
              time: data.time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            });
          }
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

  public subscribeAlarm(listener: AlarmListener): () => void {
    alarmListeners.add(listener);
    return () => {
      alarmListeners.delete(listener);
    };
  }

  public triggerAlarmRinging(alarmData: AlarmEventData): void {
    setTimeout(() => {
      alarmListeners.forEach((listener) => {
        try {
          listener(alarmData);
        } catch (err) {
          console.error('Error invoking alarm listener:', err);
        }
      });
    }, 0);
  }

  /**
   * Fire an immediate native notification sound & vibration ping using OS alarm channel.
   * Uses trigger: null for instant delivery + Vibration API as backup.
   */
  public async ringSystemAlarmPing(title: string, body: string): Promise<void> {
    try {
      Vibration.vibrate([0, 500, 200, 500], false);
    } catch {
      // ignore on web/unsupported
    }

    if (Platform.OS === 'web' || !Notifications) return;
    try {
      await this.initAsync();
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      if (typeof Notifications.scheduleNotificationAsync === 'function') {
        // Fire immediately with trigger: null on the ALARM_CHANNEL_ID
        // audioAttributes.usage = ALARM ensures it sounds using phone's Alarm audio stream
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⏰ ${title}`,
            body,
            sound: 'default',
            channelId: ALARM_CHANNEL_ID,
            priority: Notifications.AndroidNotificationPriority?.MAX ?? 2,
            vibrate: [0, 800, 400, 800, 400, 800],
          },
          trigger: null,
        });
      }
    } catch {
      // ignore
    }
  }

  public async dismissAllAlarms(): Promise<void> {
    if (Platform.OS === 'web' || !Notifications) return;
    try {
      if (typeof Notifications.dismissAllNotificationsAsync === 'function') {
        await Notifications.dismissAllNotificationsAsync();
      }
    } catch {
      // ignore
    }
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

    // Save to persistent notification history
    this.recordNotificationHistory({
      id: payload.id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      subtitle: payload.subtitle,
      badgeText: payload.badgeText,
      route: payload.route,
      createdAt: payload.createdAt,
      read: false,
    }).catch(() => {});

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
          const channelId = params.type === 'alarm' ? ALARM_CHANNEL_ID : REMINDER_CHANNEL_ID;
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
              channelId,
              priority: Notifications.AndroidNotificationPriority?.MAX ?? 2,
              color: params.type === 'streak' ? '#D97706' : params.type === 'alarm' ? '#DC2626' : '#2563EB',
            },
            trigger: params.type === 'alarm' ? null : {
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

      if (typeof Notifications.scheduleNotificationAsync === 'function') {
        const notifId = await Notifications.scheduleNotificationAsync({
          identifier: params.id,
          content: {
            title: `⏰ ${params.title}`,
            body: params.body,
            data: {
              route: params.route || '/reminder',
              type: 'alarm',
              time: params.time,
            },
            sound: 'default',
            channelId: ALARM_CHANNEL_ID,
            priority: Notifications.AndroidNotificationPriority?.MAX ?? 2,
          },
          trigger: {
            channelId: ALARM_CHANNEL_ID,
            date: scheduledDate,
            type: Notifications.SchedulableTriggerInputTypes?.DATE ?? 'date',
          },
        });
        return notifId;
      }
      return null;
    } catch (e) {
      console.warn('Error scheduling alarm notification, retrying with interval trigger:', e);
      // Fallback for environments where date triggers are strictly interval-based
      try {
        const [hours, minutes] = params.time.split(':').map((v) => parseInt(v, 10));
        const scheduledDate = new Date();
        scheduledDate.setHours(hours, minutes, 0, 0);
        if (scheduledDate.getTime() <= Date.now()) {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }
        const diffSeconds = Math.max(1, Math.floor((scheduledDate.getTime() - Date.now()) / 1000));
        const notifId = await Notifications.scheduleNotificationAsync({
          identifier: params.id,
          content: {
            title: `⏰ ${params.title}`,
            body: params.body,
            data: { route: params.route || '/reminder', type: 'alarm', time: params.time },
            sound: 'default',
            channelId: ALARM_CHANNEL_ID,
            priority: Notifications.AndroidNotificationPriority?.MAX ?? 2,
          },
          trigger: {
            channelId: ALARM_CHANNEL_ID,
            seconds: diffSeconds,
            type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
          },
        });
        return notifId;
      } catch (err) {
        console.warn('Fallback interval trigger error:', err);
        return null;
      }
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

  /**
   * Schedule Pomodoro timer countdown alarm (rings even if app is closed/minimized)
   */
  public async schedulePomodoroAlarm(seconds: number, title: string, body: string): Promise<string | null> {
    if (Platform.OS === 'web' || !Notifications) return null;
    try {
      await this.initAsync();
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Cancel previous pomodoro alarm if any
      await this.cancelNotification('pomodoro_timer_alarm');

      if (typeof Notifications.scheduleNotificationAsync === 'function') {
        const notifId = await Notifications.scheduleNotificationAsync({
          identifier: 'pomodoro_timer_alarm',
          content: {
            title: title,
            body,
            data: {
              route: '/pomodoro',
              type: 'alarm',
              isPomodoro: true,
            },
            sound: 'default',
            channelId: ALARM_CHANNEL_ID,
            priority: Notifications.AndroidNotificationPriority?.MAX ?? 2,
          },
          trigger: {
            channelId: ALARM_CHANNEL_ID,
            seconds: Math.max(1, Math.round(seconds)),
            type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
          },
        });
        return notifId;
      }
      return null;
    } catch (e) {
      console.warn('Error scheduling pomodoro alarm:', e);
      return null;
    }
  }

  public async cancelPomodoroAlarm(): Promise<void> {
    await this.cancelNotification('pomodoro_timer_alarm');
  }

  // ==========================================
  // NOTIFICATION HISTORY MANAGEMENT
  // ==========================================

  public async addNotificationHistory(
    title: string,
    body: string,
    type: NotificationType = 'task'
  ): Promise<void> {
    const item: NotificationHistoryItem = {
      id: `history_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      body,
      type,
      createdAt: Date.now(),
      read: false,
    };
    await this.recordNotificationHistory(item);
  }

  public async recordNotificationHistory(item: NotificationHistoryItem): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      const updated = [item, ...history.filter((n) => n.id !== item.id)].slice(0, 50);
      await AsyncStorage.setItem(NOTIF_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  public async getNotificationHistory(): Promise<NotificationHistoryItem[]> {
    try {
      const raw = await AsyncStorage.getItem(NOTIF_HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out any previous mock seed items
          return parsed.filter((item) => !item.id.startsWith('seed_'));
        }
      }
    } catch {
      // ignore
    }

    return [];
  }

  public async markAsRead(id: string): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      const updated = history.map((item) => (item.id === id ? { ...item, read: true } : item));
      await AsyncStorage.setItem(NOTIF_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  public async markAllAsRead(): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      const updated = history.map((item) => ({ ...item, read: true }));
      await AsyncStorage.setItem(NOTIF_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  public async deleteNotification(id: string): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      const updated = history.filter((item) => item.id !== id);
      await AsyncStorage.setItem(NOTIF_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  public async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NOTIF_HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export const notificationService = new NotificationService();
