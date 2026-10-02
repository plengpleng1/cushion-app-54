import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';

import { recordSensorData } from '../services/sensorRecorder';

export default function RootLayout() {
  const isRecordingRef = useRef(false);

  useEffect(() => {
    const recordData = async () => {
      // ป้องกันการเรียกซ้อนกัน
      if (isRecordingRef.current) {
        return;
      }

      isRecordingRef.current = true;

      try {
        await recordSensorData();
      } catch (error) {
        console.error(
          '❌ Root Sensor Recorder error:',
          error
        );
      } finally {
        isRecordingRef.current = false;
      }
    };

    // เรียกทันทีเมื่อเปิดแอป
    recordData();

    // บันทึกทุก 3 วินาที
    const interval = setInterval(() => {
      recordData();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}