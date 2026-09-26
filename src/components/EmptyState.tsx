import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { CuteCharacter, CharacterType } from '@/components/CuteCharacter';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  character?: CharacterType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  accentColor?: string;
}

function resolveCharacter(
  icon?: string,
  character?: CharacterType
): { char: CharacterType; bg: string } {
  if (character) {
    switch (character) {
      case 'happy':
        return { char: 'happy', bg: '#E6F8F3' };
      case 'calm':
        return { char: 'calm', bg: '#EEF2FF' };
      case 'sad':
        return { char: 'sad', bg: '#FEF9E7' };
      case 'dizzy':
        return { char: 'dizzy', bg: '#FFF0EC' };
      case 'smart':
        return { char: 'smart', bg: '#EEF2FF' };
      case 'cheer':
        return { char: 'cheer', bg: '#FFF0EC' };
      case 'zen':
        return { char: 'zen', bg: '#E6F8F3' };
      default:
        return { char: character, bg: '#F1F5F9' };
    }
  }

  if (icon?.includes('calendar')) {
    return { char: 'calm', bg: '#EEF2FF' };
  }
  if (icon?.includes('checkbox') || icon?.includes('task') || icon?.includes('checkmark')) {
    return { char: 'happy', bg: '#E6F8F3' };
  }
  if (icon?.includes('journal') || icon?.includes('document') || icon?.includes('note')) {
    return { char: 'smart', bg: '#FEF9E7' };
  }
  if (icon?.includes('library') || icon?.includes('book')) {
    return { char: 'smart', bg: '#EEF2FF' };
  }
  if (icon?.includes('alarm') || icon?.includes('notifications') || icon?.includes('time')) {
    return { char: 'cheer', bg: '#FFF0EC' };
  }
  if (icon?.includes('flame') || icon?.includes('sparkles') || icon?.includes('trophy')) {
    return { char: 'zen', bg: '#E6F8F3' };
  }

  return { char: 'calm', bg: '#EEF2FF' };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  character,
  title,
  description,
  actionLabel,
  onAction,
  accentColor = '#FF5733',
}) => {
  const meta = resolveCharacter(icon, character);

  return (
    <View style={styles.container}>
      {/* 100% Symmetrical Centered Mascot Badge (No Off-Center Icons) */}
      <View style={[styles.mascotBadge, { backgroundColor: meta.bg }]}>
        <CuteCharacter type={meta.char} size={58} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: accentColor }]}
          onPress={onAction}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={17} color="#FFFFFF" />
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mascotBadge: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 16.5,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 280,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 22,
    gap: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: 13.5,
  },
});
