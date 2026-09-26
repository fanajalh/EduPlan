import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CustomTabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string }[];

  };
  descriptors: Record<string, any>;
  navigation: {
    navigate: (name: string) => void;
    emit: (event: any) => any;
  };
}

function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  return (
    <View style={styles.tabBarWrapper} pointerEvents="box-none">
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Center prominent circular button (Tugas / Quick Action)
          if (route.name === 'tugas') {
            return (
              <View key={route.key} style={styles.centerBtnWrapper} pointerEvents="box-none">
                <TouchableOpacity
                  onPress={onPress}
                  activeOpacity={0.85}
                  style={styles.centerBtnOuterRing}
                >
                  <View
                    style={[
                      styles.centerBtnInnerCircle,
                      isFocused && styles.centerBtnInnerCircleActive,
                    ]}
                  >
                    <Ionicons
                      name={isFocused ? 'checkbox' : 'checkbox-outline'}
                      size={24}
                      color={Colors.white}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            );
          }

          // Side tab items: Home, Jadwal, Kalender, Menu
          let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';
          let label = options.title || route.name;

          if (route.name === 'index') {
            iconName = isFocused ? 'home' : 'home-outline';
            label = 'Home';
          } else if (route.name === 'jadwal') {
            iconName = isFocused ? 'time' : 'time-outline';
            label = 'Jadwal';
          } else if (route.name === 'kalender') {
            iconName = isFocused ? 'calendar' : 'calendar-outline';
            label = 'Kalender';
          } else if (route.name === 'menu') {
            iconName = isFocused ? 'apps' : 'apps-outline';
            label = 'Menu';
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={isFocused ? Colors.primary : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isFocused && styles.tabLabelActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="jadwal" options={{ title: 'Jadwal' }} />
      <Tabs.Screen name="tugas" options={{ title: 'Tugas' }} />
      <Tabs.Screen name="kalender" options={{ title: 'Kalender' }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabBarContainer: {
    width: '92%',
    maxWidth: 420,
    height: 66,
    backgroundColor: Colors.card, // Clean white pill
    borderRadius: 36,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  tabLabelActive: {
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  centerBtnWrapper: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtnOuterRing: {
    marginTop: -28, // Protrudes above the top edge of the pill
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: Colors.background, // Exact match to gallery background
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  centerBtnInnerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary, // Vibrant bright coral
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtnInnerCircleActive: {
    backgroundColor: '#E04826',
  },

});
