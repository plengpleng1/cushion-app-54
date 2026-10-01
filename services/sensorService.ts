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
   // เติม &_t=${Date.now()} ต่อท้าย เพื่อบังคับดึงข้อมูลสดใหม่ทุกรอบ
   const cacheBusterUrl = `${API_URL}&_t=${Date.now()}`;


   const response = await fetch(cacheBusterUrl, {
     cache: 'no-store' // สั่งไม่ให้เก็บ Cache ในอุปกรณ์
   });


   if (!response.ok) {
     throw new Error(`HTTP error! status: ${response.status}`);
   }
   const data: SensorData = await response.json();
   return data;
 } catch (error) {
   console.warn("Error fetching sensor data:", error);
   return null;
 }
};
