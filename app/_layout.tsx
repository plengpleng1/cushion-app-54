import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';

import { recordSensorData } from '../services/sensorRecorder';

export default function RootLayout() {
  const isRecordingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let timeout: ReturnType<typeof setTimeout>;

    const recordData = async () => {
      // ป้องกันการเรียกซ้อนกัน
      if (isRecordingRef.current || !isMounted) {
        return;
      }

      isRecordingRef.current = true;

      try {
        //console.log('📝 Sensor Recorder start:',
          //new Date().toLocaleTimeString()
        //);

        await recordSensorData();

        //console.log('📝 Sensor Recorder finished:',
          //new Date().toLocaleTimeString()
        //);
      
      } catch (error) {
        console.error(
          '❌ Root Sensor Recorder error:',
          error
        );
      } finally {
        isRecordingRef.current = false;
      }

      // รอ 3 วินาทีหลังจาก request เสร็จ
      if (isMounted) {
        timeout = setTimeout(recordData, 3000);
      }
    };

    // เรียกครั้งแรกทันที
    recordData();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
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