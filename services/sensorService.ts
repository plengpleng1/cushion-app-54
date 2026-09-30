// 1. กำหนด Interface โครงสร้างข้อมูล
export interface SensorData {
  date: string;
  time: string;
  sensor1: number;
  sensor2: number;
  temperature: number;
  humidity: number;
  status: "ACTIVE" | "STANDBY";
  position: "LEFT" | "RIGHT" | "CENTER" | "NONE";
  pressure: "HIGH" | "LOW";
}

// 2. API URL หลักจาก Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycby9UFBh-2Ct06oGaexrTMqUSGXFjHHAtI67AtrToOXwr1EBl_HztFRzSliLDk2iPQuzYg/exec?action=read";

// 3. ฟังก์ชันสำหรับดึงข้อมูลล่าสุด
export const fetchSensorData = async (): Promise<SensorData | null> => {
  try {
    const separator = API_URL.includes('?') ? '&' : '?';
    const cacheBusterUrl = `${API_URL}${separator}_t=${Date.now()}`;

    // 💡 แก้ไข: ตัด headers ออกทั้งหมด และใช้ redirect: 'follow'
    const response = await fetch(cacheBusterUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();

    if (!rawData) return null;

    // จัดการแปลงข้อมูลอย่างปลอดภัย (Mapping) กันกรณีประเภทข้อมูลส่งมาไม่ตรง
    return {
      date: String(rawData.date || rawData.Date || ''),
      time: String(rawData.time || rawData.Time || '-'),
      sensor1: Number(rawData.sensor1 ?? 4095),
      sensor2: Number(rawData.sensor2 ?? 4095),
      temperature: Number(rawData.temperature ?? rawData.temp ?? 0),
      humidity: Number(rawData.humidity ?? rawData.humid ?? 0),
      status: rawData.status === 'ACTIVE' ? 'ACTIVE' : 'STANDBY',
      position: rawData.position || 'NONE',
      pressure: rawData.pressure === 'HIGH' ? 'HIGH' : 'LOW',
    };
  } catch (error) {
    if (__DEV__) {
      // แสดง Log เฉพาะตอน Debug ไม่ให้ขัดจังหวะการทำงาน
      console.log("Error fetching sensor data:", error);
    }
    return null;
  }
};