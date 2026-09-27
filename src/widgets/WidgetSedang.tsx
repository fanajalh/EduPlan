import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface WidgetSedangProps {
  dayName?: string;
  dateStr?: string;
  nextClass?: {
    subject: string;
    startTime: string;
    endTime: string;
    room?: string;
  } | null;
  nextTask?: {
    title: string;
    subject: string;
    deadline?: string;
    priority?: string;
  } | null;
}

export function WidgetSedang({
  dayName = 'Hari Ini',
  dateStr = '',
  nextClass,
  nextTask,
}: WidgetSedangProps) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0F172A',
        borderRadius: 24,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      {/* Top Bar Header */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text="🎓 "
            style={{ fontSize: 13 }}
          />
          <TextWidget
            text="EduPlaner"
            style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginRight: 6,
            }}
          />
          <TextWidget
            text={`• ${dayName}${dateStr ? `, ${dateStr}` : ''}`}
            style={{
              fontSize: 11,
              fontWeight: 'normal',
              color: '#94A3B8',
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            backgroundColor: '#3B82F6',
            borderRadius: 7,
            paddingHorizontal: 7,
            paddingVertical: 2,
          }}
        >
          <TextWidget
            text="Jadwal & Tugas"
            style={{
              fontSize: 9,
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Main Content: 2 Cards Side-by-Side */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        {/* Left Card: Jadwal Terdekat */}
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: '#1E293B',
            borderRadius: 14,
            padding: 9,
            marginRight: 4,
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <FlexWidget
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 3,
            }}
          >
            <TextWidget
              text="KELAS BERIKUTNYA"
              style={{
                fontSize: 9,
                fontWeight: 'bold',
                color: '#60A5FA',
              }}
            />
            {nextClass && (
              <FlexWidget
                style={{
                  backgroundColor: '#0F172A',
                  borderRadius: 5,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                }}
              >
                <TextWidget
                  text={nextClass.startTime}
                  style={{
                    fontSize: 9,
                    fontWeight: 'bold',
                    color: '#93C5FD',
                  }}
                />
              </FlexWidget>
            )}
          </FlexWidget>

          {nextClass ? (
            <FlexWidget style={{ flexDirection: 'column' }}>
              <TextWidget
                text={nextClass.subject}
                style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: '#F8FAFC',
                }}
                maxLines={1}
              />
              <TextWidget
                text={`📍 ${nextClass.room || 'Kelas Reguler'} • ${nextClass.startTime} - ${nextClass.endTime}`}
                style={{
                  fontSize: 10,
                  fontWeight: 'normal',
                  color: '#94A3B8',
                  marginTop: 2,
                }}
                maxLines={1}
              />
            </FlexWidget>
          ) : (
            <FlexWidget style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <TextWidget
                text="Tidak ada kelas lagi 🎉"
                style={{
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: '#94A3B8',
                }}
              />
            </FlexWidget>
          )}
        </FlexWidget>

        {/* Right Card: Tugas Mendesak */}
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: '#1E293B',
            borderRadius: 14,
            padding: 9,
            marginLeft: 4,
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <FlexWidget
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 3,
            }}
          >
            <TextWidget
              text="PR & TUGAS"
              style={{
                fontSize: 9,
                fontWeight: 'bold',
                color: '#F59E0B',
              }}
            />
            {nextTask && (
              <FlexWidget
                style={{
                  backgroundColor: nextTask.priority === 'tinggi' ? '#7F1D1D' : '#0F172A',
                  borderRadius: 5,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                }}
              >
                <TextWidget
                  text={nextTask.priority === 'tinggi' ? 'PRIORITAS' : 'TUGAS'}
                  style={{
                    fontSize: 8,
                    fontWeight: 'bold',
                    color: nextTask.priority === 'tinggi' ? '#FCA5A5' : '#FCD34D',
                  }}
                />
              </FlexWidget>
            )}
          </FlexWidget>

          {nextTask ? (
            <FlexWidget style={{ flexDirection: 'column' }}>
              <TextWidget
                text={nextTask.title}
                style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: '#F8FAFC',
                }}
                maxLines={1}
              />
              <TextWidget
                text={`⏳ ${nextTask.deadline || 'Segera'} • ${nextTask.subject}`}
                style={{
                  fontSize: 10,
                  fontWeight: 'normal',
                  color: '#94A3B8',
                  marginTop: 2,
                }}
                maxLines={1}
              />
            </FlexWidget>
          ) : (
            <FlexWidget style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <TextWidget
                text="Semua PR selesai! ✨"
                style={{
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: '#10B981',
                }}
              />
            </FlexWidget>
          )}
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
