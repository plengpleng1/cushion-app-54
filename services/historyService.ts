import AsyncStorage from '@react-native-async-storage/async-storage';
import { SensorData } from './sensorService';
import { supabase } from '../lib/supabase';

export interface HistoryLog extends SensorData {
  id: string;
  calculatedPosition: 'LEFT' | 'RIGHT' | 'CENTER' | 'NONE';
  isTempHigh: boolean;
  isHumidHigh: boolean;
  leftPressed: boolean;
  rightPressed: boolean;
  sittingSeconds: number;
  isSittingTooLong: boolean;
}

export const getHistoryStorageKey = (patientId: string) => {
  return `history_${patientId}`;
};

export const loadSavedHistory = async (
  patientId: string
): Promise<HistoryLog[]> => {
  try {
    const storageKey = getHistoryStorageKey(patientId);

    const savedData =
      await AsyncStorage.getItem(storageKey);

    if (!savedData) {
      return [];
    }

    const savedLogs: HistoryLog[] =
      JSON.parse(savedData);

    if (Array.isArray(savedLogs)) {
      return savedLogs;
    }

    return [];
  } catch (error) {
    console.error(
      'ไม่สามารถโหลด History ได้:',
      error
    );

    return [];
  }
};

//==================== เชื่อม supabase ===========================\\
//console.log('>>> historyService.ts LOADED');
export const loadHistoryFromSupabase = async (
  patientId: string
): Promise<HistoryLog[]> => {
  try {
    const { data, error } = await supabase
      .from('sensor_history')
      .select('*')
      .eq('citizen_id', patientId)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      console.error(
        '❌ ไม่สามารถโหลด History จาก Supabase:',
        error
      );
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((item: any) => ({
      date: item.date,
      time: item.time,
      sensor1: Number(item.sensor1) || 0,
      sensor2: Number(item.sensor2) || 0,
      temperature: Number(item.temperature) || 0,
      humidity: Number(item.humidity) || 0,
      status: item.status,
      position: item.position,
      pressure: item.pressure,

      id: `${item.patient_id}_${item.date}_${item.time}`,

      calculatedPosition:
        item.calculated_position,

      isTempHigh:
        Boolean(item.is_temp_high),

      isHumidHigh:
        Boolean(item.is_humid_high),

      leftPressed:
        Boolean(item.left_pressed),

      rightPressed:
        Boolean(item.right_pressed),

      sittingSeconds:
        Number(item.sitting_seconds) || 0,

      isSittingTooLong:
        Boolean(item.is_sitting_too_long),
    }));
  } catch (error) {
    console.error(
      '❌ Error loading History from Supabase:',
      error
    );

    return [];
  }
};
    console.log(
    '>>> loadHistoryFromSupabase EXPORT:',
    loadHistoryFromSupabase
    );
//==================================================\\
export const saveHistory = async (
  patientId: string,
  logs: HistoryLog[]
) => {
  try {
    const storageKey = getHistoryStorageKey(patientId);

    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify(logs)
    );
  } catch {
    // ไม่แสดง error ใน Terminal
  }
};

//======================================================== \\
                  //  เก็บข้อมูลให้สะสมใน week \\
//======================================================== \\