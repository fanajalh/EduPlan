import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface WidgetKecilProps {
  dayName?: string;
  dateStr?: string;
  classCount?: number;
  taskCount?: number;
  nextClassText?: string;
}

export function WidgetKecil({
  dayName = 'Hari Ini',
  dateStr = '',
  classCount = 0,
  taskCount = 0,
  nextClassText = 'Tidak ada kelas berikutnya',
}: WidgetKecilProps) {
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
      {/* Top Header */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text="🎓"
            style={{ fontSize: 13, marginRight: 4 }}
          />
          <TextWidget
            text="EduPlan"
            style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 8,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <TextWidget
            text={dayName}
            style={{
              fontSize: 9,
              fontWeight: 'bold',
              color: '#94A3B8',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Middle Stats Grid (2 side-by-side chips) */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginVertical: 4,
        }}
      >
        {/* Classes Card */}
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: '#1E293B',
            borderRadius: 14,
            padding: 8,
            marginRight: 4,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextWidget
            text={String(classCount)}
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#60A5FA',
            }}
          />
          <TextWidget
            text="Kelas"
            style={{
              fontSize: 10,
              fontWeight: 'bold',
              color: '#94A3B8',
              marginTop: 1,
            }}
          />
        </FlexWidget>

        {/* Tasks Card */}
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: '#1E293B',
            borderRadius: 14,
            padding: 8,
            marginLeft: 4,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextWidget
            text={String(taskCount)}
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#F59E0B',
            }}
          />
          <TextWidget
            text="PR Pending"
            style={{
              fontSize: 10,
              fontWeight: 'bold',
              color: '#94A3B8',
              marginTop: 1,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Bottom Status / Next Info */}
      <FlexWidget
        style={{
          width: 'match_parent',
          backgroundColor: '#1E293B',
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 5,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text="⏰ "
          style={{ fontSize: 9 }}
        />
        <TextWidget
          text={nextClassText}
          style={{
            fontSize: 10,
            fontWeight: 'bold',
            color: '#E2E8F0',
          }}
          maxLines={1}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
