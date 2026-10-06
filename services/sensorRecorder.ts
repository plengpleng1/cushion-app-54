import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  fetchSensorData,
  SensorData,
} from './sensorService';

import { supabase } from '../lib/supabase';

import {
  HistoryLog,
} from './historyService';

const SELECTED_PATIENT_KEY =
  'selectedPatientId';
const SELECTED_PATIENT_DB_ID_KEY =
  'selectedPatientDbId';

let centerStartTime: number | null = null;

const formatSensorDate = (
  date: string
) => {
  if (!date) {
    return '';
  }

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return date;
  }

  return d.toLocaleDateString(
    'en-GB',
    {
      timeZone: 'Asia/Bangkok',
    }
  );
};

const formatSensorTime = (
  time: string
) => {
  if (!time) {
    return '';
  }

  const d = new Date(time);

  if (isNaN(d.getTime())) {
    return time;
  }

  return d.toLocaleTimeString(
    'en-GB',
    {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }
  );
};

export const recordSensorData =
  async (): Promise<HistoryLog | null> => {

    try {
      // =====================================================
      // 1. อ่าน Patient ที่เลือกอยู่
      // =====================================================
    const citizenId =
        await AsyncStorage.getItem(
            SELECTED_PATIENT_KEY
        );
    const patientId =
        await AsyncStorage.getItem(
            SELECTED_PATIENT_DB_ID_KEY
        );
      if (!citizenId) {
        //console.log('⚠️ ไม่มี Patient ที่เลือกอยู่');
        return null;
      }

      // =====================================================
      // 2. ดึง Sensor
      // =====================================================
      const data =
        await fetchSensorData();

      if (!data) {
        //console.log('⚠️ ไม่ได้รับข้อมูล Sensor');

        return null;
      }

      //console.log('📡 Sensor data:',data);

      // =====================================================
      // 3. ตรวจ Left / Right
      // =====================================================
      const isLeftPressed =
        (data.sensor1 ?? 4095) < 500;

      const isRightPressed =
        (data.sensor2 ?? 4095) < 500;

      // =====================================================
      // 4. คำนวณ Position
      // =====================================================
      let calcPos:
        | 'LEFT'
        | 'RIGHT'
        | 'CENTER'
        | 'NONE' = 'NONE';

      if (
        isLeftPressed &&
        isRightPressed
      ) {
        calcPos = 'CENTER';
      } else if (
        isLeftPressed
      ) {
        calcPos = 'LEFT';
      } else if (
        isRightPressed
      ) {
        calcPos = 'RIGHT';
      }

      // =====================================================
      // 5. Temperature
      // =====================================================
      const temperature =
        Number(data.temperature) || 0;

      const tempHigh =
        temperature > 38;

      // =====================================================
      // 6. Humidity
      // =====================================================
      const humidity =
        Number(data.humidity) || 0;

      const humidHigh =
        humidity > 75;

      // =====================================================
      // 7. Sitting Time
      // =====================================================
      // ================================
        // Sitting Timer สำหรับการบันทึก
        // ================================
        let sittingSeconds = 0;

        if (calcPos === 'CENTER') {
        if (centerStartTime === null) {
            centerStartTime = Date.now();
        }

        sittingSeconds = Math.floor(
            (Date.now() - centerStartTime) / 1000
        );
        } else {
        centerStartTime = null;
        sittingSeconds = 0;
        }

        const isSittingTooLong =
        sittingSeconds >= 120;

      // =====================================================
      // 8. Format Date / Time
      // =====================================================
      const formattedDate =
        formatSensorDate(
          data.date
        );

      const formattedTime =
        formatSensorTime(
          data.time
        );

      // =====================================================
      // 9. สร้าง ID
      // =====================================================
      const logId =
        `${citizenId}_${formattedDate}_${formattedTime}`;

      // =====================================================
      // 10. สร้าง HistoryLog
      // =====================================================
      const newLog:
        HistoryLog = {
        ...data,

        date:
          formattedDate,

        time:
          formattedTime,

        id:
          logId,

        calculatedPosition:
          calcPos,

        isTempHigh:
          tempHigh,

        isHumidHigh:
          humidHigh,

        leftPressed:
          isLeftPressed,

        rightPressed:
          isRightPressed,

        sittingSeconds:
          sittingSeconds,

        isSittingTooLong:
          isSittingTooLong,
      };

      // =====================================================
      // 11. บันทึก Supabase
      // =====================================================
      //console.log('📤 Saving sensor data:',{patient_id:patientId,date:newLog.date,time:newLog.time,});

      const {
        error,
      } = await supabase
        .from(
          'sensor_history'
        )
        .upsert(
          {
            patient_id:
              patientId,

            citizen_id:
              citizenId,

            date:
              newLog.date,

            time:
              newLog.time,

            sensor1:
              newLog.sensor1,

            sensor2:
              newLog.sensor2,

            temperature:
              newLog.temperature,

            humidity:
              newLog.humidity,

            status:
              newLog.status,

            position:
              newLog.position,

            pressure:
              newLog.pressure,

            calculated_position:
              newLog.calculatedPosition,

            is_temp_high:
              newLog.isTempHigh,

            is_humid_high:
              newLog.isHumidHigh,

            left_pressed:
              newLog.leftPressed,

            right_pressed:
              newLog.rightPressed,

            sitting_seconds:
              newLog.sittingSeconds,

            is_sitting_too_long:
              newLog.isSittingTooLong,
          } as any,
          {
            onConflict:
              'citizen_id,date,time',

          }
        );

      if (error) {
        //console.error('❌ Supabase UPSERT error:',error);

        return null;
      }

     // console.log('✅ Sensor data saved to Supabase');

      return newLog;

    } catch (error) {

      console.error(
        '❌ recordSensorData error:',
        error
      );

      return null;
    }
  };