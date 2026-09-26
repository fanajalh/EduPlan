import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '@/constants/theme';
import { CuteCharacter } from '@/components/CuteCharacter';

const ONBOARDING_SEEN_KEY = '@eduplaner_has_seen_onboarding';

export default function InitialSplashScreen() {
  // Entrance Spring & Pop Animations
  const [scaleAnim] = useState(() => new Animated.Value(0.2));
  const [opacityAnim] = useState(() => new Animated.Value(0));
  const [translateYAnim] = useState(() => new Animated.Value(36));
  const [titleOpacity] = useState(() => new Animated.Value(0));

  const navigateToNext = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const hasOnboarded = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
      if (hasOnboarded === 'true') {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    } catch {
      router.replace('/(tabs)');
    }
  }, []);

  // Run the delightful bouncy mascot animation EVERY TIME the app launches
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 48,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance after 1.8 seconds of splash delight
    const timer = setTimeout(() => {
      navigateToNext();
    }, 1800);

    return () => clearTimeout(timer);
  }, [scaleAnim, opacityAnim, translateYAnim, titleOpacity, navigateToNext]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <TouchableOpacity
        style={styles.centerContainer}
        onPress={navigateToNext}
        activeOpacity={1}
      >
        {/* Animated Mascot with Spring Physics */}
        <Animated.View
          style={[
            styles.mascotWrapper,
            {
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: translateYAnim },
              ],
            },
          ]}
        >
          <CuteCharacter type="cheer" size={115} />
        </Animated.View>

        {/* Animated Branding */}
        <Animated.View
          style={[
            styles.titleWrapper,
            {
              opacity: titleOpacity,
            },
          ]}
        >
          <Text style={styles.brandTitle}>
            EduPlaner<Text style={styles.brandDot}>.</Text>
          </Text>
          <Text style={styles.brandSubtitle}>Teman Belajar Cerdasmu</Text>
        </Animated.View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  mascotWrapper: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 34,
    color: Colors.text,
    letterSpacing: -0.6,
  },
  brandDot: {
    color: Colors.primary,
  },
  brandSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    letterSpacing: 0.2,
  },
});
