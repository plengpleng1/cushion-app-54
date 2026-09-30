// 1. กำหนด Interface โครงสร้างข้อมูล
export interface SensorData {
  date: string;
  time: string;
  sensor1: number;
  sensor2: number;
  temperature: number;
  humidity: number;
  status: "ACTIVE" | "STANDBY";
  position: "LEFT" | "RIGHT" | "CENTER";
  pressure: "HIGH" | "LOW";
}

// 2. API URL หลักจาก Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycby9UFBh-2Ct06oGaexrTMqUSGXFjHHAtI67AtrToOXwr1EBl_HztFRzSliLDk2iPQuzYg/exec?action=read";

// 3. ฟังก์ชันสำหรับดึงข้อมูลล่าสุด (ป้องกัน Cache เพื่อความ Real-time)
export const fetchSensorData = async (): Promise<SensorData | null> => {
  try {
    const separator = API_URL.includes('?') ? '&' : '?';
    const cacheBusterUrl = `${API_URL}${separator}_t=${Date.now()}`;

    const response = await fetch(cacheBusterUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as SensorData;
    return data;
} catch (error) {
  // ซ่อน log ใน terminal หรือแสดงเฉพาะตอน debug
  if (__DEV__) {
    // ใช้ console.log หรือซ่อนไว้เพื่อไม่ให้ขึ้นเป็น Warning สีเหลืองใน Terminal
  }
  return null;
}
};