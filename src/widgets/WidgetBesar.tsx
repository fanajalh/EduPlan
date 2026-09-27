import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface WidgetScheduleItem {
  subject: string;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface WidgetTaskItem {
  title: string;
  subject: string;
  deadline?: string;
  priority?: string;
}

interface WidgetBesarProps {
  dayName?: string;
  dateStr?: string;
  schedules?: WidgetScheduleItem[];
  tasks?: WidgetTaskItem[];
}

export function WidgetBesar({
  dayName = 'Hari Ini',
  dateStr = '',
  schedules = [],
  tasks = [],
}: WidgetBesarProps) {
  const displaySchedules = schedules.slice(0, 3);
  const displayTasks = tasks.slice(0, 3);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0F172A',
        borderRadius: 26,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      {/* Top Header */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#1E293B',
          paddingBottom: 8,
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text="🎓 "
            style={{ fontSize: 15 }}
          />
          <FlexWidget style={{ flexDirection: 'column' }}>
            <TextWidget
              text="EduPlaner Dashboard"
              style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: '#FFFFFF',
              }}
            />
            <TextWidget
              text={`${dayName}${dateStr ? `, ${dateStr}` : ''}`}
              style={{
                fontSize: 10,
                color: '#94A3B8',
              }}
            />
          </FlexWidget>
        </FlexWidget>

        <FlexWidget
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <TextWidget
            text={`${schedules.length} Kelas • ${tasks.length} PR`}
            style={{
              fontSize: 10,
              fontWeight: 'bold',
              color: '#38BDF8',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Middle: Two distinct sections */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-around',
        }}
      >
        {/* Section 1: Jadwal Hari Ini */}
        <FlexWidget
          style={{
            width: 'match_parent',
            backgroundColor: '#1E293B',
            borderRadius: 14,
            padding: 9,
            marginBottom: 6,
          }}
        >
          <TextWidget
            text="📅 JADWAL KELAS HARI INI"
            style={{
              fontSize: 9,
              fontWeight: 'bold',
              color: '#60A5FA',
              marginBottom: 4,
            }}
          />

          {displaySchedules.length === 0 ? (
            <TextWidget
              text="Tidak ada jadwal kelas aktif hari ini 🎉"
              style={{
                fontSize: 11,
                color: '#94A3B8',
                fontStyle: 'italic',
              }}
            />
          ) : (
            displaySchedules.map((item, idx) => (
              <FlexWidget
                key={idx}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 2,
                }}
              >
                <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <TextWidget
                    text="• "
                    style={{ fontSize: 12, color: '#38BDF8' }}
                  />
                  <TextWidget
                    text={item.subject}
                    style={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: '#F8FAFC',
                    }}
                    maxLines={1}
                  />
                  {item.room && (
                    <TextWidget
                      text={` (${item.room})`}
                      style={{
                        fontSize: 10,
                        color: '#94A3B8',
                      }}
                      maxLines={1}
                    />
                  )}
                </FlexWidget>
                <TextWidget
                  text={`${item.startTime} - ${item.endTime}`}
                  style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: '#93C5FD',
                    marginLeft: 6,
                  }}
                />
              </FlexWidget>
            ))
          )}
        </FlexWidget>

        {/* Section 2: Tugas & PR */}
        <FlexWidget
          style={{
            width: 'match_parent',
            backgroundColor: '#1E293B',
            borderRadius: 14,
            padding: 9,
          }}
        >
          <TextWidget
            text="📝 TUGAS & PR MENUNGGU"
            style={{
              fontSize: 9,
              fontWeight: 'bold',
              color: '#F59E0B',
              marginBottom: 4,
            }}
          />

          {displayTasks.length === 0 ? (
            <TextWidget
              text="Semua tugas dan PR sudah selesai! 🌟"
              style={{
                fontSize: 11,
                color: '#34D399',
                fontStyle: 'italic',
              }}
            />
          ) : (
            displayTasks.map((t, idx) => (
              <FlexWidget
                key={idx}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 2,
                }}
              >
                <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <TextWidget
                    text="• "
                    style={{ fontSize: 12, color: '#FBBF24' }}
                  />
                  <TextWidget
                    text={t.title}
                    style={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: '#F8FAFC',
                    }}
                    maxLines={1}
                  />
                  <TextWidget
                    text={` (${t.subject})`}
                    style={{
                      fontSize: 10,
                      color: '#94A3B8',
                    }}
                    maxLines={1}
                  />
                </FlexWidget>
                <TextWidget
                  text={t.deadline || 'Segera'}
                  style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: '#FCD34D',
                    marginLeft: 6,
                  }}
                />
              </FlexWidget>
            ))
          )}
        </FlexWidget>
      </FlexWidget>

      {/* Bottom Footer Action */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 6,
          paddingTop: 4,
        }}
      >
        <TextWidget
          text="Ketuk widget untuk buka EduPlaner"
          style={{
            fontSize: 10,
            color: '#64748B',
          }}
        />
        <TextWidget
          text="Buka Aplikasi ➔"
          style={{
            fontSize: 10,
            fontWeight: 'bold',
            color: '#60A5FA',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
