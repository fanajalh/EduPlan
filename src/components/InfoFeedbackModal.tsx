import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Fonts } from '@/constants/theme';

export type FeedbackType = 'success' | 'info' | 'warning' | 'error';

interface InfoFeedbackModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: FeedbackType;
  buttonLabel?: string;
  buttonColor?: string;
  onClose: () => void;
}

export function InfoFeedbackModal({
  visible,
  title,
  message,
  type = 'success',
  buttonLabel = 'OK, Mengerti',
  buttonColor = '#5274F5',
  onClose,
}: InfoFeedbackModalProps) {
  const handleClose = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
    onClose();
  };

  const getMeta = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          iconColor: '#10B981',
          bubbleBg: '#D1FAE5',
          innerBg: '#A7F3D0',
        };
      case 'warning':
        return {
          icon: 'alert-circle' as const,
          iconColor: '#F59E0B',
          bubbleBg: '#FEF3C7',
          innerBg: '#FDE68A',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          iconColor: '#EF4444',
          bubbleBg: '#FEE2E2',
          innerBg: '#FECACA',
        };
      case 'info':
      default:
        return {
          icon: 'calendar' as const,
          iconColor: '#5274F5',
          bubbleBg: '#EFF6FF',
          innerBg: '#DBEAFE',
        };
    }
  };

  const meta = getMeta();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop touch to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* Modal Card */}
        <View style={styles.card}>
          {/* Top Icon Circle */}
          <View style={[styles.iconCircle, { backgroundColor: meta.bubbleBg }]}>
            <View style={[styles.iconInner, { backgroundColor: meta.innerBg }]}>
              <Ionicons name={meta.icon} size={28} color={meta.iconColor} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: buttonColor }]}
            onPress={handleClose}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 64,
    height: 64,
    aspectRatio: 1,
    flexShrink: 0,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconInner: {
    width: 48,
    height: 48,
    aspectRatio: 1,
    flexShrink: 0,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 18.5,
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: Fonts.medium,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  confirmBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
});
