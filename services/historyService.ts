import AsyncStorage from '@react-native-async-storage/async-storage';
import { SensorData } from './sensorService';

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