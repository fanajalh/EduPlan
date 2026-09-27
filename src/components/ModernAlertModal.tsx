import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Fonts } from '@/constants/theme';

export type AlertType = 'warning' | 'error' | 'success' | 'info';

export interface ModernAlertModalProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function ModernAlertModal({
  visible,
  type = 'warning',
  title,
  message,
  confirmText = 'Mengerti',
  cancelText,
  onConfirm,
  onCancel,
  onClose,
}: ModernAlertModalProps) {
  if (!visible) return null;

  const getTheme = () => {
    switch (type) {
      case 'error':
        return {
          icon: 'alert-circle' as const,
          color: '#EF4444',
          bg: '#FEF2F2',
          border: '#FECACA',
          btnBg: '#DC2626',
        };
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: '#10B981',
          bg: '#ECFDF5',
          border: '#A7F3D0',
          btnBg: '#059669',
        };
      case 'info':
        return {
          icon: 'information-circle' as const,
          color: '#3B82F6',
          bg: '#EFF6FF',
          border: '#BFDBFE',
          btnBg: '#2563EB',
        };
      case 'warning':
      default:
        return {
          icon: 'warning' as const,
          color: '#F59E0B',
          bg: '#FFFBEB',
          border: '#FDE68A',
          btnBg: '#D97706',
        };
    }
  };

  const theme = getTheme();

  const handleConfirm = () => {
    Haptics.selectionAsync().catch(() => {});
    if (onConfirm) {
      onConfirm();
    } else if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    Haptics.selectionAsync().catch(() => {});
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon Badge */}
          <View style={[styles.iconWrapper, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Ionicons name={theme.icon} size={32} color={theme.color} />
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {cancelText && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelBtnText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: theme.btnBg },
                !cancelText && { flex: 1 },
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(width - 48, 360),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 18,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1.2,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
