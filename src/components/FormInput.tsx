import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, Colors } from '@/constants/theme';

export interface FormInputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  onClear?: () => void;
}

/**
 * Stable FormInput — no internal isFocused state, no conditional child mounting.
 * Android drops TextInput focus when sibling views mount/unmount or when
 * elevation/shadow changes trigger a native requestLayout().
 * This component keeps a 100% stable view-tree at all times.
 */
function FormInputInner({
  label,
  required,
  icon,
  error,
  value,
  onChangeText,
  onClear,
  style,
  blurOnSubmit = false,
  ...rest
}: FormInputProps) {
  const hasValue = Boolean(value && value.length > 0);

  return (
    <View style={styles.wrapper}>
      {label != null && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredStar}> *</Text>}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          Boolean(error) && styles.inputContainerError,
        ]}
      >
        {icon != null && (
          <Ionicons
            name={icon}
            size={18}
            color={error ? '#EF4444' : Colors.textSecondary}
            style={styles.icon}
          />
        )}

        <TextInput
          {...rest}
          style={[styles.input, style]}
          value={value}
          onChangeText={onChangeText}
          blurOnSubmit={blurOnSubmit}
          placeholderTextColor={Colors.textMuted}
          cursorColor={Colors.primary}
          selectionColor="rgba(98, 132, 246, 0.25)"
          keyboardAppearance="light"
        />

        {/* Always rendered — visibility toggled via opacity only, never mounted/unmounted */}
        <Pressable
          onPress={hasValue ? onClear : undefined}
          hitSlop={8}
          style={[styles.clearBtn, { opacity: hasValue && onClear ? 1 : 0 }]}
        >
          <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>

      {Boolean(error) && (
        <View style={styles.errorBadge}>
          <Ionicons name="alert-circle" size={13} color="#EF4444" style={{ marginRight: 4 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

export const FormInput = React.memo(FormInputInner);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  requiredStar: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6F2',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  inputContainerError: {
    backgroundColor: '#FFFBFB',
    borderColor: '#EF4444',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.text,
    height: '100%',
    padding: 0,
  },
  clearBtn: {
    padding: 2,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  errorText: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: '#EF4444',
  },
});
