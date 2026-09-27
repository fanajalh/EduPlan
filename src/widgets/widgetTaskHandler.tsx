import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetKecil } from './WidgetKecil';
import { WidgetSedang } from './WidgetSedang';
import { WidgetBesar } from './WidgetBesar';
import { JadwalWidget } from './JadwalWidget';
import { TugasWidget } from './TugasWidget';
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

    // Read schedules and tasks from AsyncStorage
    let schedules: ScheduleItem[] = INITIAL_SCHEDULES;
    try {
      const rawSchedules = await AsyncStorage.getItem(DB_KEYS.SCHEDULES);
      if (rawSchedules) {
        schedules = JSON.parse(rawSchedules);
      }
    } catch {
      // fallback
    }

    let tasks: TaskItem[] = INITIAL_TASKS;
    try {
      const rawTasks = await AsyncStorage.getItem(DB_KEYS.TASKS);
      if (rawTasks) {
        tasks = JSON.parse(rawTasks);
      }
    } catch {
      // fallback
    }

    const todaySchedules = schedules
      .filter((s) => s.day === dayName)
      .map((s) => ({
        subject: s.subject,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        color: s.color,
      }));

    const pendingTasks = tasks
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

    if (widgetInfo.widgetName === 'WidgetKecil') {
      renderWidget(
        <WidgetKecil
          dayName={dayName}
          dateStr={dateStr}
          classCount={todaySchedules.length}
          taskCount={pendingTasks.length}
          nextClassText={nextClass ? `${nextClass.startTime} ${nextClass.subject}` : 'Semua tuntas! 🎉'}
        />
      );
    } else if (widgetInfo.widgetName === 'WidgetSedang') {
      renderWidget(
        <WidgetSedang
          dayName={dayName}
          dateStr={dateStr}
          nextClass={nextClass}
          nextTask={nextTask}
        />
      );
    } else if (widgetInfo.widgetName === 'WidgetBesar') {
      renderWidget(
        <WidgetBesar
          dayName={dayName}
          dateStr={dateStr}
          schedules={todaySchedules}
          tasks={pendingTasks}
        />
      );
    } else if (widgetInfo.widgetName === 'JadwalWidget') {
      renderWidget(
        <JadwalWidget
          dayName={dayName}
          dateStr={dateStr}
          schedules={todaySchedules}
        />
      );
    } else if (widgetInfo.widgetName === 'TugasWidget') {
      renderWidget(<TugasWidget tasks={pendingTasks} />);
    }
  } catch (error) {
    console.log('[WidgetTaskHandler] Execution error:', error);
  }
}
