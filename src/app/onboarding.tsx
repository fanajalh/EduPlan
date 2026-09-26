import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { Colors, Fonts } from '@/constants/theme';
import { CuteCharacter, CharacterType } from '@/components/CuteCharacter';

// Precise 4-pointed diamond sparkle
function FourPointStar({
  size = 28,
  color = '#FF8FA3',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M 16 0 C 16 8.8 8.8 16 0 16 C 8.8 16 16 23.2 16 32 C 16 23.2 23.2 16 32 16 C 23.2 16 16 8.8 16 0 Z"
        fill={color}
      />
    </Svg>
  );
}

interface SlideItem {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  character: CharacterType;
  bg: string;
  accent: string;
}

// Lightened & brightened crisp pastel background palettes
const SLIDES: SlideItem[] = [
  {
    id: 'slide-1',
    title: 'Manajemen Waktu\nBelajar Efektif',
    subtitle: 'Atur jadwal kelas harian dan deadline tugasmu dengan ritme belajar terstruktur.',
    buttonText: 'Lanjutkan',
    character: 'cheer',
    bg: '#FFFBF8', // Brightened soft warm glow
    accent: '#FF5733',
  },
  {
    id: 'slide-2',
    title: 'Akses Materi &\nModul Kapan Saja',
    subtitle: 'Simpan ringkasan catatan penting dan modul pembelajaran dalam satu tempat rapi.',
    buttonText: 'Lanjutkan',
    character: 'smart',
    bg: '#F6F8FF', // Brightened soft periwinkle
    accent: '#6284F6',
  },
  {
    id: 'slide-3',
    title: 'Bangun Disiplin &\nCapai Prestasi Terbaik',
    subtitle: 'Pantau kebiasaan belajar harian dan perkembangan performa belajarmu secara konsisten.',
    buttonText: 'Mulai Sekarang',
    character: 'calm',
    bg: '#F3FCF7', // Brightened soft mint
    accent: '#32BA94',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const currentSlide = SLIDES[currentIndex] || SLIDES[0];

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('@eduplaner_has_seen_onboarding', 'true');
    } catch {}
    router.replace('/login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIdx = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      setCurrentIndex(nextIdx);
    } else {
      handleFinish();
    }
  };

  const goToSlide = (idx: number) => {
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
    setCurrentIndex(idx);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
    }
  };

  // Proportionate mascot size & responsive sizing for any screen aspect ratio
  const isSmallDevice = height < 720;
  const mascotSize = isSmallDevice
    ? Math.min(Math.round(width * 0.38), 135)
    : Math.min(Math.round(width * 0.44), Math.round(height * 0.22), 175);

  return (
    <View style={[styles.container, { backgroundColor: currentSlide.bg }]}>
      <StatusBar style="dark" />

      {/* Top Header with Progress Dash & Skip — perfectly cleared below notch/camera */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        {/* 3-Dash Progress Indicators */}
        <View style={styles.dashContainer}>
          {SLIDES.map((slide, i) => {
            const isActive = i === currentIndex;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => goToSlide(i)}
                activeOpacity={0.8}
                style={[
                  styles.dashPill,
                  isActive
                    ? [styles.dashPillActive, { backgroundColor: slide.accent }]
                    : styles.dashPillInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Skip Button */}
        <TouchableOpacity
          onPress={handleFinish}
          style={styles.skipBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Full-Height Paging Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={[styles.slidePage, { width, height: '100%' }]}>
            {/* Upper Illustration Area with Centered Mascot */}
            <View style={styles.illustrationArea}>
              <View style={[styles.mascotWrapper, { width: mascotSize + 56, height: mascotSize + 56 }]}>
                {/* Floating Sparkles around Face Mascot */}
                <View style={styles.sparkleTopLeft}>
                  <FourPointStar size={isSmallDevice ? 20 : 24} color={item.accent} />
                </View>
                <View style={styles.sparkleTopRight}>
                  <FourPointStar size={isSmallDevice ? 18 : 22} color="#FDCB44" />
                </View>
                <View style={styles.sparkleBottomLeft}>
                  <FourPointStar size={isSmallDevice ? 15 : 18} color="#FDCB44" />
                </View>
                <View style={styles.sparkleBottomRight}>
                  <FourPointStar size={isSmallDevice ? 17 : 20} color={item.accent} />
                </View>

                {/* Signature Cute Character Face */}
                <CuteCharacter type={item.character} size={mascotSize} />
              </View>
            </View>

            {/* Bottom White Card Sheet — Sits 100% Flush to the Physical Screen Edge! */}
            <View
              style={[
                styles.bottomCard,
                {
                  paddingTop: isSmallDevice ? 24 : 32,
                  paddingBottom: Math.max(insets.bottom, 22) + 14,
                },
              ]}
            >
              <View style={[styles.textWrap, isSmallDevice && { marginBottom: 18 }]}>
                <Text
                  style={[
                    styles.titleText,
                    isSmallDevice && { fontSize: 21, lineHeight: 27, marginBottom: 6 },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.subtitleText,
                    isSmallDevice && { fontSize: 12.5, lineHeight: 18 },
                  ]}
                >
                  {item.subtitle}
                </Text>
              </View>

              {/* Pill Action Button */}
              <TouchableOpacity
                style={[
                  styles.pillButton,
                  isSmallDevice && { height: 48, borderRadius: 24 },
                  { backgroundColor: item.accent },
                ]}
                onPress={handleNext}
                activeOpacity={0.88}
              >
                <Text style={styles.pillButtonText}>{item.buttonText}</Text>
              </TouchableOpacity>

              {/* Seamless Bottom Bleed — guarantees zero peach gap behind system nav bar */}
              <View style={styles.cardBottomBleed} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
    zIndex: 10,
  },
  dashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dashPill: {
    height: 4,
    borderRadius: 2,
  },
  dashPillActive: {
    width: 26,
    backgroundColor: Colors.primary,
  },
  dashPillInactive: {
    width: 10,
    backgroundColor: '#CBD5E1',
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  skipBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Carousel
  flatList: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  flatListContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  slidePage: {
    flex: 1,
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  // Upper Illustration Area with Character
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minHeight: 140,
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 12,
    right: 8,
  },
  sparkleBottomLeft: {
    position: 'absolute',
    bottom: 12,
    left: 8,
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },

  // Bottom White Card Sheet — Sits 100% Flush to the Screen Edge
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 32,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    position: 'relative',
  },
  cardBottomBleed: {
    position: 'absolute',
    bottom: -400,
    left: -40,
    right: -40,
    height: 400,
    backgroundColor: '#FFFFFF',
    zIndex: -1,
  },
  textWrap: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  titleText: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    lineHeight: 32,
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: Fonts.medium,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 290,
  },
  pillButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 36,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
