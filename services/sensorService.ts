// 1. กำหนด Interface โครงสร้างข้อมูล เพื่อให้ VS Code มี Auto-complete และตรวจจับ Type ได้ถูกต้อง
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

// 2. API URL จาก Google Apps Script ที่ต่อท้าย ?action=read เรียบร้อยแล้ว
const API_URL = "https://script.google.com/macros/s/AKfycby9UFBh-2Ct06oGaexrTMqUSGXFjHHAtI67AtrToOXwr1EBl_HztFRzSliLDk2iPQuzYg/exec?action=read";

// 3. ฟังก์ชันสำหรับดึงข้อมูลล่าสุดจาก Google Sheets
export const fetchSensorData = async (): Promise<SensorData | null> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: SensorData = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    return null;
  }
};