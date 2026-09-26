import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface ScheduleItemWidget {
  subject: string;
  startTime: string;
  endTime: string;
  room?: string;
  color?: string;
}

interface JadwalWidgetProps {
  dayName?: string;
  dateStr?: string;
  schedules?: ScheduleItemWidget[];
}

export function JadwalWidget({
  dayName = 'Hari Ini',
  dateStr = '',
  schedules = [],
}: JadwalWidgetProps) {
  const displaySchedules = schedules.slice(0, 2);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      {/* Header Row */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text="🎓 "
            style={{ fontSize: 13 }}
          />
          <TextWidget
            text={`EduPlaner • ${dayName}`}
            style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: '#0F172A',
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            backgroundColor: '#EEF2FF',
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <TextWidget
            text={schedules.length > 0 ? `${schedules.length} Kelas` : 'Libur'}
            style={{
              fontSize: 11,
              fontWeight: 'bold',
              color: '#4F46E5',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Schedule Items List */}
      {schedules.length === 0 ? (
        <FlexWidget
          style={{
            width: 'match_parent',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            borderRadius: 14,
            padding: 8,
          }}
        >
          <TextWidget
            text="Tidak ada jadwal kelas hari ini 🎉"
            style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: '#64748B',
              textAlign: 'center',
            }}
          />
          <TextWidget
            text="Waktunya istirahat atau belajar mandiri."
            style={{
              fontSize: 10,
              color: '#94A3B8',
              textAlign: 'center',
            }}
          />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
          {displaySchedules.map((sch, idx) => (
            <FlexWidget
              key={idx}
              style={{
                width: 'match_parent',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: idx % 2 === 0 ? '#F1F5F9' : '#F8FAFC',
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 6,
                marginBottom: idx === 0 && displaySchedules.length > 1 ? 5 : 0,
              }}
            >
              {/* Color Accent Bar */}
              <FlexWidget
                style={{
                  width: 4,
                  height: 24,
                  borderRadius: 2,
                  backgroundColor: '#6284F6',
                  marginRight: 8,
                }}
              />

              {/* Subject & Room */}
              <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
                <TextWidget
                  text={sch.subject}
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#0F172A',
                  }}
                  maxLines={1}
                />
                <TextWidget
                  text={sch.room ? `Ruang ${sch.room}` : 'Kelas Aktif'}
                  style={{
                    fontSize: 10,
                    color: '#64748B',
                  }}
                  maxLines={1}
                />
              </FlexWidget>

              {/* Time Pill */}
              <FlexWidget
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                }}
              >
                <TextWidget
                  text={`${sch.startTime} - ${sch.endTime}`}
                  style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: '#334155',
                  }}
                />
              </FlexWidget>
            </FlexWidget>
          ))}
        </FlexWidget>
      )}

      {/* Footer Info */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 6,
        }}
      >
        <TextWidget
          text={dateStr}
          style={{
            fontSize: 9.5,
            color: '#94A3B8',
          }}
        />
        <TextWidget
          text="Ketuk untuk buka EduPlaner ➔"
          style={{
            fontSize: 9.5,
            fontWeight: 'bold',
            color: '#6284F6',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
