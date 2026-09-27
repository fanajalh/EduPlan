import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '@/constants/theme';
import {
  notificationService,
  NotificationHistoryItem,
  NotificationType,
} from '@/services/notificationService';
import { CuteCharacter } from '@/components/CuteCharacter';
import { ModernAlertModal, AlertType } from '@/components/ModernAlertModal';

type FilterTab = 'all' | 'alarm' | 'streak' | 'task';

function formatTimestamp(timestamp: number): string {
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} mnt lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return 'Kemarin';
  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

function getTypeConfig(type: NotificationType) {
  switch (type) {
    case 'alarm':
      return {
        icon: 'alarm' as const,
        badgeText: 'ALARM AKTIF',
        // Card 2 Coral / Red-Orange from Jadwal (#FF5733)
        cardBg: '#FF5733',
        iconCircleBg: 'rgba(255, 255, 255, 0.24)',
        iconColor: '#FFFFFF',
        pillBg: 'rgba(255, 255, 255, 0.22)',
        pillText: '#FFFFFF',
        titleColor: '#FFFFFF',
        subtitleColor: 'rgba(255, 255, 255, 0.95)',
        descColor: 'rgba(255, 255, 255, 0.92)',
        timeColor: 'rgba(255, 255, 255, 0.78)',
        dismissColor: 'rgba(255, 255, 255, 0.85)',
        unreadDot: '#FFFFFF',
      };
    case 'streak':
      return {
        icon: 'flame' as const,
        badgeText: 'STREAK BELAJAR',
        // Card 3 Warm Flame / Amber from Jadwal (#F59E0B / #FDCB44)
        cardBg: '#F59E0B',
        iconCircleBg: 'rgba(255, 255, 255, 0.24)',
        iconColor: '#FFFFFF',
        pillBg: 'rgba(255, 255, 255, 0.22)',
        pillText: '#FFFFFF',
        titleColor: '#FFFFFF',
        subtitleColor: 'rgba(255, 255, 255, 0.95)',
        descColor: 'rgba(255, 255, 255, 0.92)',
        timeColor: 'rgba(255, 255, 255, 0.78)',
        dismissColor: 'rgba(255, 255, 255, 0.85)',
        unreadDot: '#FFFFFF',
      };
    case 'task':
      return {
        icon: 'clipboard' as const,
        badgeText: 'TUGAS & PR',
        // Card 1 Signature EduPlaner Blue / Periwinkle from Jadwal (#6284F6)
        cardBg: '#6284F6',
        iconCircleBg: 'rgba(255, 255, 255, 0.24)',
        iconColor: '#FFFFFF',
        pillBg: 'rgba(255, 255, 255, 0.22)',
        pillText: '#FFFFFF',
        titleColor: '#FFFFFF',
        subtitleColor: 'rgba(255, 255, 255, 0.95)',
        descColor: 'rgba(255, 255, 255, 0.92)',
        timeColor: 'rgba(255, 255, 255, 0.78)',
        dismissColor: 'rgba(255, 255, 255, 0.85)',
        unreadDot: '#FFFFFF',
      };
    case 'payment':
      return {
        icon: 'card' as const,
        badgeText: 'AKADEMIK',
        // Card 5 Soft Lavender / Violet from Jadwal (#9A82F7)
        cardBg: '#9A82F7',
        iconCircleBg: 'rgba(255, 255, 255, 0.24)',
        iconColor: '#FFFFFF',
        pillBg: 'rgba(255, 255, 255, 0.22)',
        pillText: '#FFFFFF',
        titleColor: '#FFFFFF',
        subtitleColor: 'rgba(255, 255, 255, 0.95)',
        descColor: 'rgba(255, 255, 255, 0.92)',
        timeColor: 'rgba(255, 255, 255, 0.78)',
        dismissColor: 'rgba(255, 255, 255, 0.85)',
        unreadDot: '#FFFFFF',
      };
    default:
      return {
        icon: 'notifications' as const,
        badgeText: 'PENGINGAT',
        // Card 4 Emerald Green from Jadwal (#10B981)
        cardBg: '#10B981',
        iconCircleBg: 'rgba(255, 255, 255, 0.24)',
        iconColor: '#FFFFFF',
        pillBg: 'rgba(255, 255, 255, 0.22)',
        pillText: '#FFFFFF',
        titleColor: '#FFFFFF',
        subtitleColor: 'rgba(255, 255, 255, 0.95)',
        descColor: 'rgba(255, 255, 255, 0.92)',
        timeColor: 'rgba(255, 255, 255, 0.78)',
        dismissColor: 'rgba(255, 255, 255, 0.85)',
        unreadDot: '#FFFFFF',
      };
  }
}

export default function NotifikasiScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);

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
    type: 'info',
  });

  const loadNotifications = useCallback(async () => {
    try {
      const items = await notificationService.getNotificationHistory();
      setNotifications(items);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let active = true;
    notificationService.getNotificationHistory().then((items) => {
      if (active) {
        setNotifications(items);
      }
    });

    // Listen for incoming notifications while screen is open
    const unsubscribe = notificationService.subscribe(() => {
      notificationService.getNotificationHistory().then((items) => {
        if (active) {
          setNotifications(items);
        }
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    Haptics.selectionAsync().catch(() => {});
    await notificationService.markAllAsRead();
    await loadNotifications();
    setAlertInfo({
      visible: true,
      title: 'Semua Dibaca',
      message: 'Semua notifikasi telah ditandai sebagai sudah dibaca.',
      type: 'success',
    });
  };

  const handleClearAll = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    await notificationService.clearAllNotifications();
    await loadNotifications();
    setAlertInfo({
      visible: true,
      title: 'Riwayat Dikosongkan',
      message: 'Seluruh riwayat notifikasi telah dihapus.',
      type: 'info',
    });
  };

  const handleItemPress = async (item: NotificationHistoryItem) => {
    Haptics.selectionAsync().catch(() => {});
    if (!item.read) {
      await notificationService.markAsRead(item.id);
      await loadNotifications();
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const handleDeleteItem = async (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    await notificationService.deleteNotification(id);
    await loadNotifications();
  };

  // Filtering
  const filteredList = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar with Home-style back button and actions */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={17} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Large Editorial Headline (Home Screen Aesthetic) */}
      <View style={styles.headlineWrapper}>
        <View style={styles.headlineHiRow}>
          <Text style={styles.headlineHi}>Pusat Notifikasi</Text>
          <CuteCharacter type="smart" size={32} />
        </View>
        <Text style={styles.headlineQuestion}>
          {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi & riwayat alarm'}
        </Text>
      </View>


      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, activeTab === 'all' && styles.filterChipActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, activeTab === 'all' && styles.filterChipTextActive]}>
            Semua ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeTab === 'alarm' && styles.filterChipActive]}
          onPress={() => setActiveTab('alarm')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, activeTab === 'alarm' && styles.filterChipTextActive]}>
            Alarm & Jadwal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeTab === 'streak' && styles.filterChipActive]}
          onPress={() => setActiveTab('streak')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, activeTab === 'streak' && styles.filterChipTextActive]}>
            Prestasi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeTab === 'task' && styles.filterChipActive]}
          onPress={() => setActiveTab('task')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, activeTab === 'task' && styles.filterChipTextActive]}>
            Tugas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CuteCharacter type="calm" size={90} />
            <Text style={styles.emptyTitle}>Belum Ada Notifikasi</Text>
            <Text style={styles.emptySubtitle}>
              Semua jadwal alarm, pengingat tugas, dan pencapaian streak belajar Anda akan tercatat di sini.
            </Text>
          </View>
        ) : (
          filteredList.map((item) => {
            const config = getTypeConfig(item.type);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.notifCard, { backgroundColor: config.cardBg }]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.88}
              >
                {/* High Contrast White Icon Circle with vibrant icon */}
                <View style={[styles.iconCircle, { backgroundColor: config.iconCircleBg }]}>
                  <Ionicons name={config.icon} size={22} color={config.iconColor} />
                </View>

                {/* Content */}
                <View style={styles.notifBody}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.badgePill, { backgroundColor: config.pillBg }]}>
                      <Text style={[styles.badgePillText, { color: config.pillText }]}>
                        {item.badgeText || config.badgeText}
                      </Text>
                    </View>
                    <Text style={[styles.timeText, { color: config.timeColor }]}>
                      {formatTimestamp(item.createdAt)}
                    </Text>
                  </View>

                  <Text
                    style={[styles.notifTitle, { color: config.titleColor }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  {item.subtitle ? (
                    <Text
                      style={[styles.notifSubtitle, { color: config.subtitleColor }]}
                      numberOfLines={1}
                    >
                      {item.subtitle}
                    </Text>
                  ) : null}

                  <Text
                    style={[styles.notifDesc, { color: config.descColor }]}
                    numberOfLines={3}
                  >
                    {item.body}
                  </Text>
                </View>

                {/* Right: unread dot + dismiss */}
                <View style={styles.notifRightCol}>
                  {!item.read && <View style={[styles.unreadDot, { backgroundColor: config.unreadDot }]} />}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteItem(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={20} color={config.dismissColor} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Styled Modern Alert */}
      <ModernAlertModal
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={() => setAlertInfo((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headlineWrapper: {
    paddingHorizontal: 20,
    marginTop: 4,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#F8F9FA',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 40,
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    borderRadius: 22,
    padding: 16,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  notifBody: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  badgePillText: {
    fontFamily: Fonts.extraBold,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  timeText: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
  },
  notifTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 2,
  },
  notifSubtitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    marginBottom: 3,
  },
  notifDesc: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    lineHeight: 17,
  },
  notifRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
    minHeight: 44,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginBottom: 8,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 18,
    color: Colors.text,
    marginTop: 18,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
});
