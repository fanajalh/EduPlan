import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CuteCharacter, CharacterType } from '@/components/CuteCharacter';

// Authentic Avataaars Parent Character Illustration
function ParentCharacter() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 280 280" preserveAspectRatio="xMidYMax meet">
      <G transform="translate(8, 0)">
        {/* Head, Ears & Neck Base */}
        <Path
          d="M132 36a56 56 0 0 0-56 56v6.17A12 12 0 0 0 66 110v14a12 12 0 0 0 10.3 11.88 56.04 56.04 0 0 0 31.7 44.73v18.4h-4a72 72 0 0 0-72 72v9h200v-9a72 72 0 0 0-72-72h-4v-18.39a56.04 56.04 0 0 0 31.7-44.73A12 12 0 0 0 198 124v-14a12 12 0 0 0-10-11.83V92a56 56 0 0 0-56-56Z"
          fill="#EDB98A"
        />
        {/* Neck Shadow */}
        <Path
          d="M108 180.61v8a55.79 55.79 0 0 0 24 5.39c8.59 0 16.73-1.93 24-5.39v-8a55.79 55.79 0 0 1-24 5.39 55.79 55.79 0 0 1-24-5.39Z"
          fill="#000000"
          fillOpacity={0.12}
        />

        {/* Smart Sweater & White Collar */}
        <G transform="translate(0, 170)">
          <Path
            d="M100.37 29.14a27.6 27.6 0 0 1 7.63-7.57v15.3c0 5.83 3.98 10.98 10.08 14.13l-.08.06.9 2.86c3.89 2 8.35 3.13 13.1 3.13s9.21-1.13 13.1-3.13l.9-2.86-.08-.06c6.1-3.15 10.08-8.3 10.08-14.12v-14.6a27.1 27.1 0 0 1 6.6 6.82 72 72 0 0 1 69.4 71.95V110H32v-8.95a72 72 0 0 1 68.37-71.9Z"
            fill="#2B4E80"
          />
          <Path
            d="M108 21.57c-6.77 4.6-11 11.17-11 18.46 0 7.4 4.36 14.05 11.3 18.66l6.12-4.81 4.58.33-1-3.15.08-.06c-6.1-3.15-10.08-8.3-10.08-14.12v-15.3ZM156 36.88c0 5.82-3.98 10.97-10.08 14.12l.08.06-1 3.15 4.58-.33 5.65 4.45c6.63-4.6 10.77-11.1 10.77-18.3 0-6.92-3.82-13.2-10-17.75v14.6Z"
            fill="#FFFFFF"
          />
        </G>

        {/* Warm Smiling Mouth */}
        <G transform="translate(78, 134)">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M35.12 15.13a19 19 0 0 0 37.77-.09c.08-.77-.77-2.04-1.85-2.04H37.1C36 13 35 14.18 35.12 15.13Z"
            fill="#1E293B"
          />
          <Path d="M70 13H39a5 5 0 0 0 5 5h21a5 5 0 0 0 5-5Z" fill="#FFFFFF" />
          <Path
            d="M66.7 27.14A10.96 10.96 0 0 0 54 25.2a10.95 10.95 0 0 0-12.7 1.94A18.93 18.93 0 0 0 54 32c4.88 0 9.33-1.84 12.7-4.86Z"
            fill="#FF6B6B"
          />
        </G>

        {/* Cute Subtle Nose */}
        <G transform="translate(104, 122)">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16 8c0 4.42 5.37 8 12 8s12-3.58 12-8"
            fill="#000000"
            fillOpacity={0.16}
          />
        </G>

        {/* Happy Expressive Eyes */}
        <G transform="translate(76, 90)">
          <Path
            d="M16.16 22.45c1.85-3.8 6-6.45 10.84-6.45 4.81 0 8.96 2.63 10.82 6.4.55 1.13-.24 2.05-1.03 1.37a15.05 15.05 0 0 0-9.8-3.43c-3.73 0-7.12 1.24-9.55 3.23-.9.73-1.82-.01-1.28-1.12ZM74.16 22.45c1.85-3.8 6-6.45 10.84-6.45 4.81 0 8.96 2.63 10.82 6.4.55 1.13-.24 2.05-1.03 1.37a15.05 15.05 0 0 0-9.8-3.43c-3.74 0-7.13 1.24-9.56 3.23-.9.73-1.82-.01-1.28-1.12Z"
            fillRule="evenodd"
            clipRule="evenodd"
            fill="#1E293B"
          />
        </G>

        {/* Eyebrows */}
        <G transform="translate(76, 82)">
          <Path
            d="M15.98 17.13C17.48 7.6 30.06 1.1 39.16 5.3a2 2 0 1 0 1.68-3.63c-11.5-5.3-26.9 2.66-28.82 14.84a2 2 0 0 0 3.96.63ZM96.02 17.13C94.52 7.6 81.94 1.1 72.84 5.3a2 2 0 1 1-1.68-3.63c11.5-5.3 26.9 2.66 28.82 14.84a2 2 0 0 1-3.96.63Z"
            fill="#1E293B"
          />
        </G>

        {/* Neat Hair */}
        <G transform="translate(-1, 0)">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M180.15 39.92c-2.76-2.82-5.96-5.21-9.08-7.61-.69-.53-1.39-1.05-2.06-1.6-.15-.12-1.72-1.24-1.9-1.66-.45-.99-.19-.22-.12-1.4.08-1.5 3.13-5.73.85-6.7-1-.43-2.8.7-3.75 1.08a59.56 59.56 0 0 1-5.73 1.9c.93-1.85 2.7-5.57-.63-4.58-2.6.78-5.03 2.77-7.64 3.7.86-1.4 4.32-5.8 1.2-6.05-.98-.07-3.8 1.75-4.86 2.14a55.81 55.81 0 0 1-9.63 2.51c-11.2 2.02-24.3 1.45-34.65 6.54-8 3.93-15.88 10.03-20.5 17.8-4.44 7.48-6.1 15.67-7.03 24.25-.69 6.3-.74 12.8-.42 19.12.1 2.07.34 11.61 3.34 8.72 1.5-1.44 1.49-7.25 1.87-9.22.75-3.91 1.47-7.85 2.72-11.64 2.2-6.68 4.81-13.8 10.3-18.4 3.53-2.94 6.01-6.93 9.39-9.9 1.51-1.35.36-1.2 2.8-1.03 1.63.12 3.28.16 4.92.2 3.8.1 7.6.08 11.4.1 7.64 0 15.25.12 22.89-.28 3.4-.18 6.8-.28 10.18-.6 1.9-.17 5.25-1.38 6.8-.45 1.43.84 2.91 3.61 3.94 4.75 2.41 2.67 5.3 4.72 8.12 6.92 5.9 4.57 8.87 10.33 10.66 17.48 1.79 7.13 1.29 13.75 3.5 20.76.38 1.24 1.4 3.36 2.67 1.46.24-.36.18-2.3.18-3.42 0-4.52 1.14-7.91 1.13-12.46-.06-13.83-.5-31.87-10.85-42.44Z"
            fill="#2C1B18"
          />
        </G>

        {/* Modern Spectacles */}
        <G transform="translate(62, 42)">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M38.5 50c-21.3 0-28.85 5.1-29.55 5.77A2.92 2.92 0 0 0 6 58.66v2.88c0 1.6 1.32 2.89 2.95 2.89 0 0 5.91 0 5.91 2.88 0 .44.07.65.19.68-.04.82-.05 1.66-.05 2.5C15 83.34 23.31 91 37.24 91H40c14.72 0 25-8.43 25-20.5 0-1.5-.04-3-.17-4.46l1.58-.77c.58-.29 1.21-.5 1.9-.64 1.85-.38 3.95-.22 5.99.28.73.18 1.26.35 1.5.45l1.38.55c-.14 1.5-.18 3.04-.18 4.6C77 83.34 85.31 91 99.24 91H102c14.72 0 25-8.43 25-20.5 0-1.54-.04-3.07-.18-4.56 1.74-1.51 6.22-1.51 6.22-1.51a2.92 2.92 0 0 0 2.96-2.89v-2.88c0-1.6-1.32-2.89-2.96-2.89-.69-.67-8.25-5.77-29.54-5.77H100.53c-1.8 0-3.44.07-4.97.2-9.54.54-14.68 2.15-19.92 4.7a17 17 0 0 1-4.56.87 17.01 17.01 0 0 1-4.81-.91l-.42-.2v-.01c-4.94-2.42-8.43-4.13-20.78-4.55a61.2 61.2 0 0 0-3.6-.1H38.5ZM19 71.5C19 62.84 19 56 38.39 56h3.22C61 56 61 62.84 61 71.5 61 80.63 52.36 87 40 87h-3.03C22.12 87 19 78.57 19 71.5Zm62 0c0-8.66 0-15.5 19.39-15.5h3.22C123 56 123 62.84 123 71.5c0 9.13-8.64 15.5-21 15.5h-3.03C84.12 87 81 78.57 81 71.5Z"
            fill="#FFFFFF"
          />
        </G>
      </G>
    </Svg>
  );
}

// Authentic Avataaars Child Character Illustration
function ChildCharacter() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 280 280" preserveAspectRatio="xMidYMax meet">
      <G transform="translate(8, 0)">
        {/* Head, Ears & Neck Base */}
        <Path
          d="M132 36a56 56 0 0 0-56 56v6.17A12 12 0 0 0 66 110v14a12 12 0 0 0 10.3 11.88 56.04 56.04 0 0 0 31.7 44.73v18.4h-4a72 72 0 0 0-72 72v9h200v-9a72 72 0 0 0-72-72h-4v-18.39a56.04 56.04 0 0 0 31.7-44.73A12 12 0 0 0 198 124v-14a12 12 0 0 0-10-11.83V92a56 56 0 0 0-56-56Z"
          fill="#EDB98A"
        />
        {/* Neck Shadow */}
        <Path
          d="M108 180.61v8a55.79 55.79 0 0 0 24 5.39c8.59 0 16.73-1.93 24-5.39v-8a55.79 55.79 0 0 1-24 5.39 55.79 55.79 0 0 1-24-5.39Z"
          fill="#000000"
          fillOpacity={0.12}
        />

        {/* Vibrant Student Hoodie */}
        <G transform="translate(0, 170)">
          <Path
            d="M108 14.7c-15.52 3.68-27.1 10.83-30.77 19.44A72.02 72.02 0 0 0 32 101v9h200v-9a72.02 72.02 0 0 0-45.23-66.86C183.1 25.53 171.52 18.38 156 14.7V32a24 24 0 1 1-48 0V14.7Z"
            fill="#4F75E8"
          />
          {/* White Hoodie Drawstrings */}
          <Path
            d="M102 63.34a67.1 67.1 0 0 1-7-2.82V110h7V63.34ZM162 63.34a67.04 67.04 0 0 0 7-2.82V98.5a3.5 3.5 0 1 1-7 0V63.34Z"
            fill="#FFFFFF"
          />
          <Path
            d="M187.62 34.49a71.79 71.79 0 0 1 10.83 5.63C197.11 55.62 167.87 68 132 68c30.93 0 56-13.43 56-30 0-1.19-.13-2.36-.38-3.51ZM76.38 34.49a16.48 16.48 0 0 0-.38 3.5c0 16.58 25.07 30 56 30-35.87 0-65.1-12.38-66.45-27.88a71.79 71.79 0 0 1 10.83-5.63Z"
            fill="#000000"
            fillOpacity={0.15}
          />
        </G>

        {/* Wide Cheerful Smile */}
        <G transform="translate(78, 134)">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M35.12 15.13a19 19 0 0 0 37.77-.09c.08-.77-.77-2.04-1.85-2.04H37.1C36 13 35 14.18 35.12 15.13Z"
            fill="#1E293B"
          />
          <Path d="M70 13H39a5 5 0 0 0 5 5h21a5 5 0 0 0 5-5Z" fill="#FFFFFF" />
          <Path
            d="M66.7 27.14A10.96 10.96 0 0 0 54 25.2a10.95 10.95 0 0 0-12.7 1.94A18.93 18.93 0 0 0 54 32c4.88 0 9.33-1.84 12.7-4.86Z"
            fill="#FF6B6B"
          />
        </G>

        {/* Subtle Nose */}
        <G transform="translate(104, 122)">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16 8c0 4.42 5.37 8 12 8s12-3.58 12-8"
            fill="#000000"
            fillOpacity={0.16}
          />
        </G>

        {/* Playful Crescent Eyes */}
        <G transform="translate(76, 90)">
          <Path
            d="M16.16 22.45c1.85-3.8 6-6.45 10.84-6.45 4.81 0 8.96 2.63 10.82 6.4.55 1.13-.24 2.05-1.03 1.37a15.05 15.05 0 0 0-9.8-3.43c-3.73 0-7.12 1.24-9.55 3.23-.9.73-1.82-.01-1.28-1.12ZM74.16 22.45c1.85-3.8 6-6.45 10.84-6.45 4.81 0 8.96 2.63 10.82 6.4.55 1.13-.24 2.05-1.03 1.37a15.05 15.05 0 0 0-9.8-3.43c-3.74 0-7.13 1.24-9.56 3.23-.9.73-1.82-.01-1.28-1.12Z"
            fillRule="evenodd"
            clipRule="evenodd"
            fill="#1E293B"
          />
        </G>

        {/* Cheerful Eyebrows */}
        <G transform="translate(76, 82)">
          <Path
            d="M38.03 5.6c-1.48 8.38-14.1 14.17-23.24 10.42a2.04 2.04 0 0 0-2.64 1c-.43.97.04 2.1 1.05 2.5 11.45 4.7 26.84-2.37 28.76-13.3a1.92 1.92 0 0 0-1.64-2.2 2 2 0 0 0-2.3 1.57ZM73.97 5.6c1.48 8.38 14.1 14.17 23.24 10.42 1.02-.41 2.2.03 2.63 1 .43.97-.04 2.1-1.05 2.5-11.44 4.7-26.84-2.37-28.76-13.3a1.92 1.92 0 0 1 1.64-2.2 2 2 0 0 1 2.3 1.57Z"
            fill="#1E293B"
          />
        </G>

        {/* Playful Round Student Haircut */}
        <G transform="translate(-1, 0)">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M167.3 35c-20.18-11.7-40.17-9.78-55.26-5.97-15.1 3.8-24.02 14.62-31.68 30.62a67.68 67.68 0 0 0-6.34 25.83c-.13 3.41.33 6.94 1.25 10.22.33 1.2 2.15 5.39 2.65 2 .17-1.12-.44-2.67-.5-3.86-.08-1.57 0-3.16.11-4.73.2-2.92.73-5.8 1.65-8.59 1.33-3.98 3.02-8.3 5.6-11.67 6.4-8.33 17.49-8.8 26.29-13.39-.77 1.4-3.7 3.68-2.7 5.27.71 1.1 3.38.76 4.65.72 3.35-.09 6.72-.67 10.02-1.14a71.5 71.5 0 0 0 15-4.1c4.02-1.5 8.61-2.88 11.63-6.07a68.67 68.67 0 0 0 17.4 13c5.62 2.88 14.68 4.32 18.11 10.16 4.07 6.91 2.2 15.4 3.44 22.9.47 2.85 1.54 2.79 2.13.24 1-4.33 1.47-8.83 1.15-13.28-.72-10.05-4.4-36.45-24.6-48.15Z"
            fill="#2C1B18"
          />
        </G>
      </G>
    </Svg>
  );
}

const CHARACTER_OPTIONS: {
  id: CharacterType;
  label: string;
  bg: string;
}[] = [
  { id: 'smart', label: 'Fokus', bg: '#6284F6' },
  { id: 'cheer', label: 'Semangat', bg: '#FF5733' },
  { id: 'calm', label: 'Tenang', bg: '#FDCB44' },
  { id: 'zen', label: 'Santai', bg: '#32BA94' },
  { id: 'focused', label: 'Tekun', bg: '#9A82F7' },
];

const GRADE_PRESETS = ['Kelas 10', 'Kelas 11', 'Kelas 12', 'Kuliah'];

export default function LoginScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<'parent' | 'child'>('child');
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useApp();

  // Personalization Form State - Simple & Clean
  const [name, setName] = useState(profile.name && profile.name !== 'Pelajar' ? profile.name : '');
  const [school, setSchool] = useState(profile.school || '');
  const [grade, setGrade] = useState(profile.grade || 'Kelas 10');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>(
    (profile.character as CharacterType) || 'smart'
  );

  const activeChar =
    CHARACTER_OPTIONS.find((c) => c.id === selectedCharacter) || CHARACTER_OPTIONS[0];

  const handleSelectRole = (role: 'parent' | 'child') => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedRole(role);
    if (role === 'parent') {
      setSelectedCharacter('calm');
    } else {
      setSelectedCharacter('smart');
    }
  };

  const handleStep1Continue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStep(2);
  };

  const handleSkip = async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      await AsyncStorage.setItem('@eduplaner_has_seen_splash', 'true');
      await AsyncStorage.setItem('@eduplaner_has_seen_onboarding', 'true');
    } catch {}
    await updateProfile({
      ...profile,
      name: name.trim() || (selectedRole === 'parent' ? 'Bpk. Hendra Pratama' : 'Aditya Pratama'),
      school: school.trim() || 'SMA Negeri 1 Jakarta',
      grade: grade.trim() || 'Kelas 11',
      character: selectedCharacter,
    });
    router.replace('/(tabs)');
  };

  const handleSavePersonalization = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await AsyncStorage.setItem('@eduplaner_has_seen_splash', 'true');
      await AsyncStorage.setItem('@eduplaner_has_seen_onboarding', 'true');
    } catch {}
    await updateProfile({
      ...profile,
      name: name.trim() || (selectedRole === 'parent' ? 'Bpk. Hendra Pratama' : 'Aditya Pratama'),
      school: school.trim() || 'SMA Negeri 1 Jakarta',
      grade: grade.trim() || 'Kelas 11',
      character: selectedCharacter,
    });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar style="dark" />

      {/* STEP 1: ROLE SELECTION */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          {/* Top Bar with Back and Skip */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.replace('/onboarding')}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color="#16151A" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Title Header */}
          <View style={styles.header}>
            <Text style={styles.title}>I am a</Text>
            <Text style={styles.subtitle}>Select one that applies to you</Text>
          </View>

          {/* Role Selection Cards Container - Flex 1 */}
          <View style={styles.cardsContainer}>
            {/* Parent Card */}
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => handleSelectRole('parent')}
              style={[
                styles.roleCard,
                styles.parentCard,
                selectedRole === 'parent' && styles.cardSelected,
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.roleLabel}>Parent</Text>
                {selectedRole === 'parent' && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  </View>
                )}
              </View>

              <View style={styles.illustrationWrapper}>
                <ParentCharacter />
              </View>
            </TouchableOpacity>

            {/* Child Card */}
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => handleSelectRole('child')}
              style={[
                styles.roleCard,
                styles.childCard,
                selectedRole === 'child' && styles.cardSelected,
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.roleLabel}>Child</Text>
                {selectedRole === 'child' && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  </View>
                )}
              </View>

              <View style={styles.illustrationWrapper}>
                <ChildCharacter />
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Continue Action */}
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom + 14, 28) },
            ]}
          >
            <TouchableOpacity
              onPress={handleStep1Continue}
              activeOpacity={0.88}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 2: PROFILE PERSONALIZATION (HOME SCREEN STYLE - SIMPLE & CLEAN) */}
      {step === 2 && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.stepContainer}
        >
          {/* Top Bar with Back, Title, and Skip */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => setStep(1)}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </TouchableOpacity>

            <Text style={styles.topBarTitle}>Profil Belajar</Text>

            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.skipButtonText}>Lewati</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={[
              styles.formScrollContent,
              { paddingBottom: Math.max(insets.bottom + 90, 110) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Center Avatar Preview */}
            <View style={styles.avatarPreviewCenter}>
              <View style={[styles.avatarCircleBig, { backgroundColor: activeChar.bg }]}>
                <CuteCharacter type={selectedCharacter} size={88} />
              </View>
              <View style={styles.characterBadge}>
                <Text style={styles.characterBadgeText}>{activeChar.label}</Text>
              </View>
            </View>

            {/* Character Picker Row */}
            <View style={styles.charPickerRow}>
              {CHARACTER_OPTIONS.map((item) => {
                const isSelected = selectedCharacter === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedCharacter(item.id);
                    }}
                    style={[
                      styles.charPickerItem,
                      isSelected && styles.charPickerItemActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.charCircleMini, { backgroundColor: item.bg }]}>
                      <CuteCharacter type={item.id} size={34} />
                    </View>
                    <Text
                      style={[
                        styles.charPickerLabel,
                        isSelected && styles.charPickerLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Form Fields: Only Nama, Sekolah, Kelas */}
            <View style={styles.formFields}>
              {/* Nama */}
              <View style={styles.fieldWrap}>
                <Text style={styles.inputLabel}>Nama Lengkap</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputField}
                    value={name}
                    onChangeText={setName}
                    placeholder={selectedRole === 'parent' ? 'Nama Orang Tua / Wali' : 'Nama Lengkap'}
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              {/* Sekolah */}
              <View style={styles.fieldWrap}>
                <Text style={styles.inputLabel}>Sekolah / Kampus</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="school-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputField}
                    value={school}
                    onChangeText={setSchool}
                    placeholder="Nama sekolah atau kampus"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              {/* Kelas */}
              <View style={styles.fieldWrap}>
                <Text style={styles.inputLabel}>Tingkat / Kelas</Text>
                <View style={styles.chipsRow}>
                  {GRADE_PRESETS.map((preset) => {
                    const isSelected = grade === preset;
                    return (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setGrade(preset);
                        }}
                        style={[
                          styles.chipBtn,
                          isSelected && styles.chipBtnActive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.chipBtnText,
                            isSelected && styles.chipBtnTextActive,
                          ]}
                        >
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Floating Bottom Button */}
          <View
            style={[
              styles.floatingBottomBar,
              { paddingBottom: Math.max(insets.bottom + 14, 24) },
            ]}
          >
            <TouchableOpacity
              onPress={handleSavePersonalization}
              activeOpacity={0.88}
              style={styles.primaryBottomButton}
            >
              <Text style={styles.primaryBottomButtonText}>Mulai Belajar</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    color: '#8A8A93',
  },

  // STEP 1 Header
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 14,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 32,
    lineHeight: 38,
    color: '#141416',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: '#8A8A93',
  },

  // STEP 1 Cards Container
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 22,
    gap: 16,
    paddingVertical: 6,
  },
  roleCard: {
    flex: 1,
    borderRadius: 34,
    paddingHorizontal: 26,
    paddingTop: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3.5,
    borderColor: 'transparent',
  },
  parentCard: {
    backgroundColor: '#72C19C',
  },
  childCard: {
    backgroundColor: '#F5B959',
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  roleLabel: {
    fontFamily: Fonts.extraBold,
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrapper: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    height: '80%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  // STEP 2 PERSONALIZATION (SIMPLE & CLEAN)
  topBarTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.text,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },

  // Center Avatar Preview
  avatarPreviewCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 16,
  },
  avatarCircleBig: {
    width: 124,
    height: 124,
    borderRadius: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterBadge: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 12,
  },
  characterBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.text,
  },

  // Character Picker Row
  charPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 24,
    gap: 8,
  },
  charPickerItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  charPickerItemActive: {
    borderColor: Colors.text,
    backgroundColor: '#F4F4F5',
  },
  charCircleMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  charPickerLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  charPickerLabelActive: {
    fontFamily: Fonts.bold,
    color: Colors.text,
  },

  // Form Fields
  formFields: {
    gap: 16,
  },
  fieldWrap: {},
  inputLabel: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
    color: Colors.text,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 14.5,
    color: Colors.text,
    height: '100%',
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBtnActive: {
    backgroundColor: Colors.text,
  },
  chipBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: Colors.text,
  },
  chipBtnTextActive: {
    fontFamily: Fonts.bold,
    color: Colors.white,
  },

  // Floating Bottom Button
  floatingBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
  },
  primaryBottomButton: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBottomButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.white,
  },

  // Bottom Continue Action for Step 1
  bottomBar: {
    paddingHorizontal: 22,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  continueButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
