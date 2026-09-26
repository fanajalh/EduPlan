import React from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { JadwalWidget, ScheduleItemWidget } from './JadwalWidget';
import { TugasWidget, TaskItemWidget } from './TugasWidget';
import { ScheduleItem, TaskItem } from '@/types';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export async function syncWidgetsData(schedules?: ScheduleItem[], tasks?: TaskItem[]) {
  // Widgets are native Android only and require APK build (not available in Expo Go)
  if (Platform.OS !== 'android' || isExpoGo) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requestWidgetUpdate } = require('react-native-android-widget');

    const now = new Date();
    const dayName = DAY_NAMES[now.getDay()];
    const dateStr = `${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

    if (schedules) {
      const todaySchedules: ScheduleItemWidget[] = schedules
        .filter((s) => s.day === dayName)
        .map((s) => ({
          subject: s.subject,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
          color: s.color,
        }));

      await requestWidgetUpdate({
        widgetName: 'JadwalWidget',
        renderWidget: () => (
          <JadwalWidget
            dayName={dayName}
            dateStr={dateStr}
            schedules={todaySchedules}
          />
        ),
      });
    }

    if (tasks) {
      const pendingTasks: TaskItemWidget[] = tasks
        .filter((t) => !t.completed)
        .map((t) => ({
          title: t.title,
          subject: t.subject,
          deadline: t.deadline,
          deadlineTime: t.deadlineTime,
          priority: t.priority,
        }));

      await requestWidgetUpdate({
        widgetName: 'TugasWidget',
        renderWidget: () => <TugasWidget tasks={pendingTasks} />,
      });
    }
  } catch (err) {
    console.log('[WidgetSync] Request update skipped:', err);
  }
}
