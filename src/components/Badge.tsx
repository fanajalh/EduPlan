import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan' | 'neutral';
  size?: 'sm' | 'md';
}

const variantStyles = {
  primary: { bg: '#FFF0EC', text: '#FF5733', border: '#FFD5CC' },
  success: { bg: '#E6FAF8', text: '#0F766E', border: '#A7F3D0' },
  warning: { bg: '#FFF8E1', text: '#B45309', border: '#FDE68A' },
  danger: { bg: '#FEECEC', text: '#DC2626', border: '#FECACA' },
  purple: { bg: '#F3EFFF', text: '#6D28D9', border: '#DDD6FE' },
  cyan: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
  neutral: { bg: '#F4F0E8', text: '#52525B', border: '#ECE7DD' },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'sm',
}) => {
  const current = variantStyles[variant];
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
          paddingVertical: size === 'sm' ? 4 : 6,
          paddingHorizontal: size === 'sm' ? 10 : 14,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: current.text,
            fontSize: size === 'sm' ? 11 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Fonts.bold,
    textTransform: 'capitalize',
  },
});
