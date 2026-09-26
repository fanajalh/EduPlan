import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
  Ellipse,
} from 'react-native-svg';
import type { CharacterType } from '@/types';

export type { CharacterType };

interface CuteCharacterProps {
  type?: CharacterType;
  size?: number;
}

export const CuteCharacter: React.FC<CuteCharacterProps> = ({
  type = 'calm',
  size = 54,
}) => {
  const s = size;

  if (type === 'eyes') {
    // Exact minimalist pair of cartoon eyes from the "Session" card in the reference
    return (
      <View style={{ width: s, height: s * 0.65, flexShrink: 0 }}>
        <Svg width={s} height={s * 0.65} viewBox="0 0 100 65" preserveAspectRatio="xMidYMid meet">
          {/* Left Eye */}
          <Ellipse cx="28" cy="32" rx="20" ry="24" fill="#FFFFFF" />
          <Circle cx="33" cy="32" r="13" fill="#141416" />
          <Circle cx="37" cy="26" r="4.5" fill="#FFFFFF" />
          <Circle cx="30" cy="38" r="1.8" fill="#FFFFFF" />

          {/* Right Eye */}
          <Ellipse cx="72" cy="32" rx="20" ry="24" fill="#FFFFFF" />
          <Circle cx="77" cy="32" r="13" fill="#141416" />
          <Circle cx="81" cy="26" r="4.5" fill="#FFFFFF" />
          <Circle cx="74" cy="38" r="1.8" fill="#FFFFFF" />
        </Svg>
      </View>
    );
  }

  if (type === 'smart') {
    // Clean matte periwinkle with minimalist wireframe glasses
    return (
      <View style={{ width: s, height: s, aspectRatio: 1, flexShrink: 0 }}>
        <Svg width={s} height={s} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <Circle cx="50" cy="50" r="45" fill="#6284F6" />
          {/* Subtle blush */}
          <Circle cx="24" cy="62" r="6" fill="#A5B4FC" opacity="0.6" />
          <Circle cx="76" cy="62" r="6" fill="#A5B4FC" opacity="0.6" />

          {/* Glasses bridge */}
          <Path d="M 43 45 Q 50 42 57 45" stroke="#141416" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Left Lens & Eye */}
          <Circle cx="32" cy="45" r="13" fill="#FFFFFF" stroke="#141416" strokeWidth="3" />
          <Circle cx="34" cy="45" r="6" fill="#141416" />
          <Circle cx="36" cy="42" r="2.2" fill="#FFFFFF" />

          {/* Right Lens & Eye */}
          <Circle cx="68" cy="45" r="13" fill="#FFFFFF" stroke="#141416" strokeWidth="3" />
          <Circle cx="70" cy="45" r="6" fill="#141416" />
          <Circle cx="72" cy="42" r="2.2" fill="#FFFFFF" />

          {/* Minimalist Smile */}
          <Path d="M 44 67 Q 50 73 56 67" stroke="#141416" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        </Svg>
      </View>
    );
  }

  if (type === 'cheer') {
    // Warm persimmon coral cheer face
    return (
      <View style={{ width: s, height: s, aspectRatio: 1, flexShrink: 0 }}>
        <Svg width={s} height={s} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <Circle cx="50" cy="50" r="45" fill="#FF5733" />

          {/* Blush */}
          <Circle cx="22" cy="58" r="6.5" fill="#FFA28D" opacity="0.5" />
          <Circle cx="78" cy="58" r="6.5" fill="#FFA28D" opacity="0.5" />

          {/* Left Eye */}
          <Circle cx="34" cy="42" r="10" fill="#FFFFFF" />
          <Circle cx="36" cy="42" r="5.5" fill="#141416" />
          <Circle cx="38" cy="39" r="2" fill="#FFFFFF" />

          {/* Right Eye */}
          <Circle cx="66" cy="42" r="10" fill="#FFFFFF" />
          <Circle cx="68" cy="42" r="5.5" fill="#141416" />
          <Circle cx="70" cy="39" r="2" fill="#FFFFFF" />

          {/* Joyful Open Mouth */}
          <Path d="M 40 60 Q 50 76 60 60 Z" fill="#141416" />
          <Path d="M 45 66 Q 50 74 55 66 Z" fill="#FFA28D" />
        </Svg>
      </View>
    );
  }

  if (type === 'zen') {
    // Mint Green Zen / Calm face
    return (
      <View style={{ width: s, height: s, aspectRatio: 1, flexShrink: 0 }}>
        <Svg width={s} height={s} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <Circle cx="50" cy="50" r="45" fill="#32BA94" />

          {/* Soft blush */}
          <Circle cx="24" cy="58" r="6" fill="#86EFAC" opacity="0.5" />
          <Circle cx="76" cy="58" r="6" fill="#86EFAC" opacity="0.5" />

          {/* Curved smiling eyes ^ ^ */}
          <Path d="M 28 44 Q 35 34 42 44" stroke="#141416" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <Path d="M 58 44 Q 65 34 72 44" stroke="#141416" strokeWidth="3.5" fill="none" strokeLinecap="round" />

          {/* Peaceful curved smile */}
          <Path d="M 44 58 Q 50 64 56 58" stroke="#141416" strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
      </View>
    );
  }

  if (type === 'focused') {
    // Minimalist Lavender Focused
    return (
      <View style={{ width: s, height: s }}>
        <Svg width={s} height={s} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#9A82F7" />

          {/* Eyes */}
          <Circle cx="35" cy="45" r="10" fill="#FFFFFF" />
          <Circle cx="37" cy="45" r="5" fill="#141416" />
          <Circle cx="39" cy="42" r="2" fill="#FFFFFF" />

          <Circle cx="65" cy="45" r="10" fill="#FFFFFF" />
          <Circle cx="67" cy="45" r="5" fill="#141416" />
          <Circle cx="69" cy="42" r="2" fill="#FFFFFF" />

          {/* Focused mouth */}
          <Circle cx="50" cy="65" r="4" fill="#141416" />
        </Svg>
      </View>
    );
  }

  if (type === 'avatar') {
    // Clean minimalist modern student illustration
    return (
      <View style={{ width: s, height: s }}>
        <Svg width={s} height={s} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="avGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFF3E8" />
              <Stop offset="100%" stopColor="#FED8BA" />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="50" r="46" fill="url(#avGrad)" />
          {/* Shoulders */}
          <Path d="M 22 90 Q 50 68 78 90 Z" fill="#141416" />
          {/* Face */}
          <Circle cx="50" cy="46" r="24" fill="#FFDFC4" />
          {/* Minimalist Hair */}
          <Path d="M 28 42 Q 50 20 72 42 Q 74 30 64 24 Q 50 18 36 24 Z" fill="#2D2D32" />
          {/* Eyes & Smile */}
          <Circle cx="42" cy="45" r="3" fill="#141416" />
          <Circle cx="58" cy="45" r="3" fill="#141416" />
          <Path d="M 46 54 Q 50 58 54 54" stroke="#141416" strokeWidth="2" fill="none" strokeLinecap="round" />
        </Svg>
      </View>
    );
  }

  if (type === 'happy') {
    // Joyful laughing face with open mouth and curved eyes (^ ^)
    return (
      <View style={{ width: s, height: s }}>
        <Svg width={s} height={s} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#32BA94" />
          {/* Soft rosy cheeks */}
          <Circle cx="22" cy="58" r="6.5" fill="#86EFAC" opacity="0.6" />
          <Circle cx="78" cy="58" r="6.5" fill="#86EFAC" opacity="0.6" />
          {/* Happy curved smiling eyes (^ ^) */}
          <Path d="M 26 42 Q 35 28 44 42" stroke="#141416" strokeWidth="4" fill="none" strokeLinecap="round" />
          <Path d="M 56 42 Q 65 28 74 42" stroke="#141416" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Joyful open mouth with cute tongue */}
          <Path d="M 38 60 Q 50 78 62 60 Z" fill="#141416" />
          <Path d="M 44 67 Q 50 76 56 67 Z" fill="#FFA28D" />
        </Svg>
      </View>
    );
  }

  if (type === 'sad') {
    // Sad face with big teary eyes, downturned mouth & cold sweat drop
    return (
      <View style={{ width: s, height: s }}>
        <Svg width={s} height={s} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#FDCB44" />
          {/* Soft blush */}
          <Circle cx="21" cy="58" r="6" fill="#F87171" opacity="0.4" />
          <Circle cx="79" cy="58" r="6" fill="#F87171" opacity="0.4" />
          {/* Sad downturned eyebrows */}
          <Path d="M 26 31 Q 35 25 43 32" stroke="#141416" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Path d="M 74 31 Q 65 25 57 32" stroke="#141416" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Big teary eyes left */}
          <Circle cx="34" cy="44" r="12" fill="#FFFFFF" />
          <Circle cx="37" cy="44" r="7" fill="#0284C7" />
          <Circle cx="37" cy="44" r="4.5" fill="#141416" />
          <Circle cx="35" cy="40" r="2.8" fill="#FFFFFF" />
          <Circle cx="39" cy="48" r="1.3" fill="#FFFFFF" />
          {/* Big teary eyes right */}
          <Circle cx="66" cy="44" r="12" fill="#FFFFFF" />
          <Circle cx="69" cy="44" r="7" fill="#0284C7" />
          <Circle cx="69" cy="44" r="4.5" fill="#141416" />
          <Circle cx="67" cy="40" r="2.8" fill="#FFFFFF" />
          <Circle cx="71" cy="48" r="1.3" fill="#FFFFFF" />
          {/* Sad downturned mouth */}
          <Path d="M 40 70 Q 50 60 60 70" stroke="#141416" strokeWidth="3.6" fill="none" strokeLinecap="round" />
          {/* Cyan sweat drop on forehead */}
          <Path d="M 81 24 C 81 20 84 16 86 11 C 88 16 91 20 91 24 C 91 27 89 29.5 86 29.5 C 83 29.5 81 27 81 24 Z" fill="#38BDF8" stroke="#141416" strokeWidth="1.5" />
        </Svg>
      </View>
    );
  }

  if (type === 'dizzy') {
    // Comical dizzy face with spiral eyes, wavy mouth & dizzy star
    return (
      <View style={{ width: s, height: s }}>
        <Svg width={s} height={s} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#FF5733" />
          {/* Inner yellow circle mascot */}
          <Circle cx="50" cy="50" r="38" fill="#FED855" />
          {/* Soft blush */}
          <Circle cx="24" cy="58" r="5.5" fill="#F87171" opacity="0.4" />
          <Circle cx="76" cy="58" r="5.5" fill="#F87171" opacity="0.4" />
          {/* Concentric spiral rings left eye */}
          <Circle cx="35" cy="42" r="12" fill="none" stroke="#141416" strokeWidth="2.5" />
          <Circle cx="35" cy="42" r="7" fill="none" stroke="#141416" strokeWidth="2.5" />
          <Circle cx="35" cy="42" r="2.5" fill="#141416" />
          {/* Concentric spiral rings right eye */}
          <Circle cx="65" cy="42" r="12" fill="none" stroke="#141416" strokeWidth="2.5" />
          <Circle cx="65" cy="42" r="7" fill="none" stroke="#141416" strokeWidth="2.5" />
          <Circle cx="65" cy="42" r="2.5" fill="#141416" />
          {/* Smooth wavy dazed mouth */}
          <Path d="M 37 66 Q 43 60 50 66 Q 57 72 63 66" stroke="#141416" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          {/* Dizzy star mark */}
          <Path d="M 76 18 L 78 22 L 82 23 L 79 26 L 80 30 L 76 27 L 72 30 L 73 26 L 70 23 L 74 22 Z" fill="#F59E0B" />
        </Svg>
      </View>
    );
  }

  // Default: 'calm' (Yellow minimalist glossy character from center of reference image)
  return (
    <View style={{ width: s, height: s }}>
      <Svg width={s} height={s} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="calmGradMinimal" x1="0.2" y1="0.1" x2="0.8" y2="0.9">
            <Stop offset="0%" stopColor="#FED855" />
            <Stop offset="100%" stopColor="#F9BC24" />
          </LinearGradient>
        </Defs>

        {/* Clean Warm Yellow Face */}
        <Circle cx="50" cy="50" r="45" fill="url(#calmGradMinimal)" />

        {/* Big Expressive Eye Left */}
        <Circle cx="34" cy="42" r="12" fill="#FFFFFF" />
        <Circle cx="37" cy="42" r="7" fill="#0284C7" />
        <Circle cx="37" cy="42" r="4.5" fill="#141416" />
        <Circle cx="39" cy="39" r="2.4" fill="#FFFFFF" />

        {/* Big Expressive Eye Right */}
        <Circle cx="66" cy="42" r="12" fill="#FFFFFF" />
        <Circle cx="69" cy="42" r="7" fill="#0284C7" />
        <Circle cx="69" cy="42" r="4.5" fill="#141416" />
        <Circle cx="71" cy="39" r="2.4" fill="#FFFFFF" />

        {/* Minimalist Smile Line */}
        <Path
          d="M 41 64 Q 50 72 59 64"
          stroke="#141416"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Subtle Rosy Cheeks */}
        <Circle cx="21" cy="54" r="5" fill="#F87171" opacity="0.35" />
        <Circle cx="79" cy="54" r="5" fill="#F87171" opacity="0.35" />
      </Svg>
    </View>
  );
};

export interface WorkloadMood {
  type: CharacterType;
  label: string;
  bg: string;
  textColor: string;
  description: string;
}

export function getWorkloadMood(pendingCount: number, hasOverdue = false): WorkloadMood {
  if (pendingCount === 0) {
    return {
      type: 'happy',
      label: 'Bahagia',
      bg: '#32BA94',
      textColor: '#FFFFFF',
      description: 'Semua tugas selesai! Waktunya santai 🏖️',
    };
  }
  if (pendingCount <= 2 && !hasOverdue) {
    return {
      type: 'calm',
      label: 'Santai',
      bg: '#6284F6',
      textColor: '#FFFFFF',
      description: `${pendingCount} tugas tersisa, kendali aman terkendali!`,
    };
  }
  if (pendingCount <= 5 && !hasOverdue) {
    return {
      type: 'sad',
      label: 'Sedih',
      bg: '#FDCB44',
      textColor: '#141416',
      description: `${pendingCount} tugas menumpuk, yuk mulai dicicil!`,
    };
  }
  return {
    type: 'dizzy',
    label: 'Puyeng',
    bg: '#FF5733',
    textColor: '#FFFFFF',
    description: hasOverdue
      ? 'Ada tugas yang lewat batas waktu! Yuk tuntaskan sekarang!'
      : `${pendingCount} tugas menanti, jangan panik, fokus satu per satu!`,
  };
}
