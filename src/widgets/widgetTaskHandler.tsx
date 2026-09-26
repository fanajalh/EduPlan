import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JadwalWidget, ScheduleItemWidget } from './JadwalWidget';
import { TugasWidget, TaskItemWidget } from './TugasWidget';
import { DB_KEYS } from '@/services/localDatabase';
import { INITIAL_SCHEDULES, INITIAL_TASKS } from '@/services/seedData';
import { ScheduleItem, TaskItem } from '@/types';

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, renderWidget } = props;

  try {
    const now = new Date();
    const dayName = DAY_NAMES[now.getDay()];
    const dateStr = `${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

    if (widgetInfo.widgetName === 'JadwalWidget') {
      let schedules: ScheduleItem[] = INITIAL_SCHEDULES;
      try {
        const raw = await AsyncStorage.getItem(DB_KEYS.SCHEDULES);
        if (raw) {
          schedules = JSON.parse(raw);
        }
      } catch {
        // fallback to initial
      }

      const todaySchedules: ScheduleItemWidget[] = schedules
        .filter((s) => s.day === dayName)
        .map((s) => ({
          subject: s.subject,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
          color: s.color,
        }));

      renderWidget(
        <JadwalWidget
          dayName={dayName}
          dateStr={dateStr}
          schedules={todaySchedules}
        />
      );
    } else if (widgetInfo.widgetName === 'TugasWidget') {
      let tasks: TaskItem[] = INITIAL_TASKS;
      try {
        const raw = await AsyncStorage.getItem(DB_KEYS.TASKS);
        if (raw) {
          tasks = JSON.parse(raw);
        }
      } catch {
        // fallback to initial
      }

      const pendingTasks: TaskItemWidget[] = tasks
        .filter((t) => !t.completed)
        .map((t) => ({
          title: t.title,
          subject: t.subject,
          deadline: t.deadline,
          deadlineTime: t.deadlineTime,
          priority: t.priority,
        }));

      renderWidget(<TugasWidget tasks={pendingTasks} />);
    }
  } catch (error) {
    console.log('[WidgetTaskHandler] Execution error:', error);
  }
}
