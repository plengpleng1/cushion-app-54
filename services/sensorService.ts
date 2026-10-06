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


// 3. ฟังก์ชันสำหรับดึงข้อมูลล่าสุด
export const fetchSensorData =
  async (): Promise<SensorData | null> => {
    try {
      //console.log("🌐 API URL:", API_URL);

      const response = await fetch(API_URL);

      //console.log("🌐 API status:",response.status);

      //console.log("🌐 API final URL:",response.url);

      if (!response.ok) {
        //console.error(
          //"❌ API response not OK:",
          //response.status,
          //response.url
        //);
        return null;
      }

      const data: SensorData =
        await response.json();

      //console.log("✅ API data received:",data);

      return data;

    } catch (error) {
      //console.error(
        //"❌ fetchSensorData error:",error
      //);
      return null;
    }
  };