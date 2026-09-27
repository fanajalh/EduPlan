import React from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { WidgetKecil } from './WidgetKecil';
import { WidgetSedang } from './WidgetSedang';
import { WidgetBesar } from './WidgetBesar';
import { JadwalWidget, ScheduleItemWidget } from './JadwalWidget';
import { TugasWidget, TaskItemWidget } from './TugasWidget';
import { ScheduleItem, TaskItem } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB_KEYS } from '@/services/localDatabase';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export async function syncWidgetsData(schedulesParam?: ScheduleItem[], tasksParam?: TaskItem[]) {
  // Widgets are native Android only and require APK build (not available in Expo Go)
  if (Platform.OS !== 'android' || isExpoGo) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requestWidgetUpdate } = require('react-native-android-widget');

    const now = new Date();
    const dayName = DAY_NAMES[now.getDay()];
    const dateStr = `${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

    let schedules = schedulesParam;
    if (!schedules) {
      try {
        const raw = await AsyncStorage.getItem(DB_KEYS.SCHEDULES);
        if (raw) schedules = JSON.parse(raw);
      } catch {
        // ignore
      }
    }

    let tasks = tasksParam;
    if (!tasks) {
      try {
        const raw = await AsyncStorage.getItem(DB_KEYS.TASKS);
        if (raw) tasks = JSON.parse(raw);
      } catch {
        // ignore
      }
    }

    const todaySchedules: ScheduleItemWidget[] = (schedules || [])
      .filter((s) => s.day === dayName)
      .map((s) => ({
        subject: s.subject,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        color: s.color,
      }));

    const pendingTasks: TaskItemWidget[] = (tasks || [])
      .filter((t) => !t.completed)
      .map((t) => ({
        title: t.title,
        subject: t.subject,
        deadline: t.deadline,
        deadlineTime: t.deadlineTime,
        priority: t.priority,
      }));

    const nextClass = todaySchedules.length > 0 ? todaySchedules[0] : null;
    const nextTask = pendingTasks.length > 0 ? pendingTasks[0] : null;

    // 1. Sync WidgetKecil (2x2)
    requestWidgetUpdate({
      widgetName: 'WidgetKecil',
      renderWidget: () => (
        <WidgetKecil
          dayName={dayName}
          dateStr={dateStr}
          classCount={todaySchedules.length}
          taskCount={pendingTasks.length}
          nextClassText={nextClass ? `${nextClass.startTime} ${nextClass.subject}` : 'Semua tuntas! 🎉'}
        />
      ),
    }).catch(() => {});

    // 2. Sync WidgetSedang (4x2)
    requestWidgetUpdate({
      widgetName: 'WidgetSedang',
      renderWidget: () => (
        <WidgetSedang
          dayName={dayName}
          dateStr={dateStr}
          nextClass={nextClass}
          nextTask={nextTask}
        />
      ),
    }).catch(() => {});

    // 3. Sync WidgetBesar (4x4)
    requestWidgetUpdate({
      widgetName: 'WidgetBesar',
      renderWidget: () => (
        <WidgetBesar
          dayName={dayName}
          dateStr={dateStr}
          schedules={todaySchedules}
          tasks={pendingTasks}
        />
      ),
    }).catch(() => {});

    // 4. Sync JadwalWidget (legacy)
    requestWidgetUpdate({
      widgetName: 'JadwalWidget',
      renderWidget: () => (
        <JadwalWidget
          dayName={dayName}
          dateStr={dateStr}
          schedules={todaySchedules}
        />
      ),
    }).catch(() => {});

    // 5. Sync TugasWidget (legacy)
    requestWidgetUpdate({
      widgetName: 'TugasWidget',
      renderWidget: () => <TugasWidget tasks={pendingTasks} />,
    }).catch(() => {});
  } catch (err) {
    console.log('[WidgetSync] Update error:', err);
  }
}
