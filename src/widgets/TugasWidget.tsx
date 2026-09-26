import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface TaskItemWidget {
  title: string;
  subject: string;
  deadline?: string;
  deadlineTime?: string;
  priority?: string;
}

interface TugasWidgetProps {
  tasks?: TaskItemWidget[];
}

export function TugasWidget({ tasks = [] }: TugasWidgetProps) {
  const displayTasks = tasks.slice(0, 2);

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
      {/* Header */}
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
            text="📝 "
            style={{ fontSize: 13 }}
          />
          <TextWidget
            text="EduPlaner • Tugas & PR"
            style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: '#0F172A',
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            backgroundColor: tasks.length > 0 ? '#FEE2E2' : '#DCFCE7',
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <TextWidget
            text={tasks.length > 0 ? `${tasks.length} Pending` : 'Tuntas!'}
            style={{
              fontSize: 11,
              fontWeight: 'bold',
              color: tasks.length > 0 ? '#DC2626' : '#15803D',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Task Content */}
      {tasks.length === 0 ? (
        <FlexWidget
          style={{
            width: 'match_parent',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#F0FDF4',
            borderRadius: 14,
            padding: 8,
          }}
        >
          <TextWidget
            text="Semua tugas sudah selesai! 🌟"
            style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: '#15803D',
              textAlign: 'center',
            }}
          />
          <TextWidget
            text="Hebat! Tidak ada tanggungan tugas saat ini."
            style={{
              fontSize: 10,
              color: '#4ADE80',
              textAlign: 'center',
            }}
          />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>
          {displayTasks.map((t, idx) => (
            <FlexWidget
              key={idx}
              style={{
                width: 'match_parent',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 6,
                marginBottom: idx === 0 && displayTasks.length > 1 ? 5 : 0,
              }}
            >
              {/* Checkbox Square Accent */}
              <FlexWidget
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: '#F97316',
                  marginRight: 8,
                }}
              />

              {/* Title & Subject */}
              <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
                <TextWidget
                  text={t.title}
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#0F172A',
                  }}
                  maxLines={1}
                />
                <TextWidget
                  text={t.subject}
                  style={{
                    fontSize: 10,
                    color: '#64748B',
                  }}
                  maxLines={1}
                />
              </FlexWidget>

              {/* Deadline */}
              {t.deadlineTime ? (
                <FlexWidget
                  style={{
                    backgroundColor: '#FEF3C7',
                    borderRadius: 8,
                    paddingHorizontal: 6,
                    paddingVertical: 2.5,
                  }}
                >
                  <TextWidget
                    text={t.deadlineTime}
                    style={{
                      fontSize: 9.5,
                      fontWeight: 'bold',
                      color: '#B45309',
                    }}
                  />
                </FlexWidget>
              ) : null}
            </FlexWidget>
          ))}
        </FlexWidget>
      )}

      {/* Footer */}
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
          text="Prioritas & Deadline"
          style={{
            fontSize: 9.5,
            color: '#94A3B8',
          }}
        />
        <TextWidget
          text="Buka Tugas ➔"
          style={{
            fontSize: 9.5,
            fontWeight: 'bold',
            color: '#FF5733',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
