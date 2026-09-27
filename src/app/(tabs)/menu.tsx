import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { Fonts } from '@/constants/theme';
import { CuteCharacter } from '@/components/CuteCharacter';
import { FileExportService } from '@/services/fileExport';

export default function MenuScreen() {
  const router = useRouter();
  const {
    materials,
    notes,
    reminders,
    habits,
    profile,
    exportDatabaseBackup,
  } = useApp();

  // Handle Backup Data
  const handleBackupData = async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      const backupJson = await exportDatabaseBackup();
      await FileExportService.downloadDatabaseBackup(backupJson);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat membuat cadangan data.');
    }
  };

  // Section 1: Modul Akademik & Belajar (100% Berfungsi)
  const academicItems = [
    {
      id: 'materi',
      title: 'Penyimpanan Materi',
      icon: 'library-outline' as const,
      value: `${materials.length} Modul`,
      onPress: () => router.push('/materi'),
    },
    {
      id: 'catatan',
      title: 'Catatan & Sticky Notes',
      icon: 'journal-outline' as const,
      value: `${notes.length} Memo`,
      onPress: () => router.push('/catatan'),
    },
    {
      id: 'reminder',
      title: 'Pengingat & Alarm Belajar',
      icon: 'alarm-outline' as const,
      value: `${reminders.filter((r) => r.enabled).length} Aktif`,
      onPress: () => router.push('/reminder'),
    },
    {
      id: 'notifikasi',
      title: 'Pusat Notifikasi',
      icon: 'notifications-outline' as const,
      value: 'Riwayat & Alarm',
      onPress: () => router.push('/notifikasi' as any),
    },
  ];

  // Section 2: Produktivitas & Analisis (100% Berfungsi)
  const productivityItems = [
    {
      id: 'pomodoro',
      title: 'Timer Pomodoro',
      icon: 'timer-outline' as const,
      value: 'Fokus Belajar',
      onPress: () => router.push('/pomodoro' as any),
    },
    {
      id: 'statistik',
      title: 'Statistik & Jam Belajar',
      icon: 'pie-chart-outline' as const,
      value: 'Grafik Belajar',
      onPress: () => router.push('/statistik'),
    },
    {
      id: 'kebiasaan',
      title: 'Target Kebiasaan',
      icon: 'flame-outline' as const,
      value: `${habits.length} Kebiasaan`,
      onPress: () => router.push('/kebiasaan'),
    },
  ];

  // Section 3: Akun & Sistem (100% Berfungsi)
  const systemItems = [
    {
      id: 'profile',
      title: 'Edit Profil Pelajar',
      icon: 'person-outline' as const,
      value: profile.grade || 'Pengaturan',
      onPress: () => router.push('/profil'),
    },
    {
      id: 'backup',
      title: 'Cadangkan',
      icon: 'download-outline' as const,
      value: 'Backup JSON',
      onPress: handleBackupData,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Clean Centered Header without redundant back button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu & Pengaturan</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Banner (Exact match to reference card) */}
        <TouchableOpacity
          style={styles.profileBannerCard}
          onPress={() => router.push('/profil')}
          activeOpacity={0.88}
        >
          {/* Top Orange Banner with Geometric Watermark */}
          <View style={styles.bannerHeader}>
            <View style={styles.watermarkWrap}>
              <Svg width={140} height={90} viewBox="0 0 140 90">
                <Path
                  d="M 15 90 C 8 35 40 8 85 8 L 140 8 L 140 28 L 88 28 C 55 28 35 48 38 90 Z"
                  fill="rgba(255, 255, 255, 0.22)"
                />
                <Path
                  d="M 54 90 C 50 60 68 44 95 44 L 140 44 L 140 64 L 98 64 C 82 64 72 72 72 90 Z"
                  fill="rgba(255, 255, 255, 0.22)"
                />
              </Svg>
            </View>
          </View>

          {/* Overlapping Avatar */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircleBorder}>
              <CuteCharacter type={profile?.character || 'avatar'} size={56} />
            </View>
          </View>

          {/* Name & Subtitle below */}
          <View style={styles.profileTextWrap}>
            <View style={styles.nameRow}>
              <Text style={styles.profileNameText}>{profile.name}</Text>
              <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
            </View>
            <Text style={styles.profileSubtitleText} numberOfLines={1}>
              {profile.school} • {profile.major || profile.grade}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Section 1: Modul Akademik */}
        <Text style={styles.sectionHeading}>Modul Akademik</Text>
        <View style={styles.sectionCard}>
          {academicItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.rowItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon} size={19} color="#1E293B" />
                </View>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {item.value ? <Text style={styles.rowValueText}>{item.value}</Text> : null}
                <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
              </TouchableOpacity>
              {index < academicItems.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Section 2: Produktivitas & Analisis */}
        <Text style={styles.sectionHeading}>Produktivitas & Evaluasi</Text>
        <View style={styles.sectionCard}>
          {productivityItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.rowItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon} size={19} color="#1E293B" />
                </View>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {item.value ? <Text style={styles.rowValueText}>{item.value}</Text> : null}
                <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
              </TouchableOpacity>
              {index < productivityItems.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Section 3: Akun & Sistem */}
        <Text style={styles.sectionHeading}>Akun & Pengaturan</Text>
        <View style={styles.sectionCard}>
          {systemItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.rowItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon} size={19} color="#1E293B" />
                </View>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {item.value ? <Text style={styles.rowValueText}>{item.value}</Text> : null}
                <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
              </TouchableOpacity>
              {index < systemItems.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Footer Brand */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>EduPlaner v2.1.4</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 19,
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 120, // Generous padding so items scroll completely clear of the bottom floating dock
  },

  // Profile Banner Card (Exact match to reference image 1)
  profileBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bannerHeader: {
    height: 84,
    backgroundColor: '#FF5733',
    position: 'relative',
    overflow: 'hidden',
  },
  watermarkWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  avatarRow: {
    paddingHorizontal: 16,
    marginTop: -32,
    zIndex: 10,
    alignSelf: 'flex-start',
  },
  avatarCircleBorder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFF0EC',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTextWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  profileNameText: {
    fontFamily: Fonts.extraBold,
    fontSize: 17,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  profileSubtitleText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },


  // Section Heading
  sectionHeading: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    color: '#475569',
    marginBottom: 10,
    marginTop: 18,
    marginLeft: 4,
  },

  // Section Group Card Container (Rounded pure white card matching iOS Settings reference)
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Row Item
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
    marginLeft: 14,
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#0F172A',
  },
  rowValueText: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: '#94A3B8',
    marginRight: 6,
  },

  // Subtle divider between list rows, indented past the icon box
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 52,
  },

  // Footer Info
  footer: {
    alignItems: 'center',
    marginTop: 26,
    paddingVertical: 14,
  },
  footerBrand: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#94A3B8',
  },
  footerSub: {
    fontFamily: Fonts.medium,
    fontSize: 11.5,
    color: '#CBD5E1',
    marginTop: 2,
  },
});
