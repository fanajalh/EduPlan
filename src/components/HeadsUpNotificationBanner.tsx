import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '@/constants/theme';
import { CuteCharacter, CharacterType } from '@/components/CuteCharacter';
import {
  notificationService,
  NotificationPayload,
  NotificationType,
} from '@/services/notificationService';

interface MetaConfig {
  cardBg: string;
  textColor: string;
  subTextColor: string;
  character: CharacterType;
  characterBg: string;
  arrowBg: string;
  arrowColor: string;
}

function getNotificationMeta(type: NotificationType): MetaConfig {
  switch (type) {
    case 'streak':
      return {
        cardBg: Colors.primary, // #FF5733 Vibrant Coral / Persimmon
        textColor: '#FFFFFF',
        subTextColor: 'rgba(255, 255, 255, 0.9)',
        character: 'cheer',
        characterBg: 'rgba(255, 255, 255, 0.22)',
        arrowBg: '#FFFFFF',
        arrowColor: Colors.primary,
      };
    case 'payment':
      return {
        cardBg: Colors.mintGreen, // #32BA94 Vibrant Mint Green
        textColor: '#FFFFFF',
        subTextColor: 'rgba(255, 255, 255, 0.9)',
        character: 'zen',
        characterBg: 'rgba(255, 255, 255, 0.22)',
        arrowBg: '#FFFFFF',
        arrowColor: Colors.mintGreen,
      };
    case 'alarm':
      return {
        cardBg: Colors.danger, // #EF4444 Vibrant Red
        textColor: '#FFFFFF',
        subTextColor: 'rgba(255, 255, 255, 0.9)',
        character: 'eyes',
        characterBg: 'rgba(255, 255, 255, 0.22)',
        arrowBg: '#FFFFFF',
        arrowColor: Colors.danger,
      };
    case 'task':
    case 'reminder':
    default:
      return {
        cardBg: Colors.periwinkle, // #6284F6 Vibrant Periwinkle Blue
        textColor: '#FFFFFF',
        subTextColor: 'rgba(255, 255, 255, 0.9)',
        character: 'calm',
        characterBg: 'rgba(255, 255, 255, 0.22)',
        arrowBg: '#FFFFFF',
        arrowColor: Colors.periwinkle,
      };
  }
}

export function HeadsUpNotificationBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentNotif, setCurrentNotif] = useState<NotificationPayload | null>(null);

  const [translateY] = useState(() => new Animated.Value(-160));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissBanner = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(translateY, {
      toValue: -200,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentNotif(null);
    });
  }, [translateY]);

  const displayBanner = useCallback(
    (payload: NotificationPayload) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setCurrentNotif(payload);

      // Haptics feedback
      try {
        if (payload.type === 'alarm') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch {
        // Haptics optional
      }

      // Animate in from top with bouncy spring
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();

      // Auto dismiss after 4.5 seconds
      timerRef.current = setTimeout(() => {
        dismissBanner();
      }, 4500);
    },
    [dismissBanner, translateY]
  );

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((payload) => {
      displayBanner(payload);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [displayBanner]);

  const handleBannerPress = () => {
    if (!currentNotif) return;
    try {
      Haptics.selectionAsync();
    } catch {
      // optional
    }
    const route = currentNotif.route;
    dismissBanner();
    if (route) {
      router.push(route as any);
    }
  };

  if (!currentNotif) return null;

  const meta = getNotificationMeta(currentNotif.type);
  const topOffset = Math.max(insets.top, Platform.OS === 'web' ? 14 : 20) + 6;

  // Clean redundant emojis from title & body
  const cleanTitle = currentNotif.title.replace(/^[\p{Emoji}\u200d\uFE0F\s]+/u, '').trim();
  const cleanBody = currentNotif.body.replace(/^[\p{Emoji}\u200d\uFE0F\s]+/u, '').trim();

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: topOffset,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: meta.cardBg }]}
        activeOpacity={0.92}
        onPress={handleBannerPress}
      >
        <View style={styles.cardContent}>
          {/* Left: EduPlaner Signature Cute Character */}
          <View style={[styles.avatarBox, { backgroundColor: meta.characterBg }]}>
            <CuteCharacter
              type={meta.character}
              size={meta.character === 'eyes' ? 34 : 30}
            />
          </View>

          {/* Center: Title & Body (Tag, time, close, and progress bar removed as requested) */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: meta.textColor }]} numberOfLines={1}>
              {cleanTitle}
            </Text>
            <Text style={[styles.body, { color: meta.subTextColor }]} numberOfLines={2}>
              {cleanBody}
            </Text>
          </View>

          {/* Right: Signature EduPlaner Circular Arrow Button (Close button removed) */}
          <View style={[styles.arrowCircle, { backgroundColor: meta.arrowBg }]}>
            <Ionicons
              name="arrow-up"
              size={15}
              color={meta.arrowColor}
              style={{ transform: [{ rotate: '45deg' }] }}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99999,
    alignItems: 'center',
    // Zero shadow
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 22,
    // No outline (tanpa outline)
    borderWidth: 0,
    // Zero shadow
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatarBox: {
    width: 40,
    height: 40,
    aspectRatio: 1,
    flexShrink: 0,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 2,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    aspectRatio: 1,
    flexShrink: 0,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
