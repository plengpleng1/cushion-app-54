// 1. Interface โครงสร้างข้อมูล Sensor
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
const API_URL = "https://script.google.com/macros/s/AKfycby9UFBh-2Ct06oGaexrTMqUSGXFjHHAtI67AtrToOXwr1EBl_HztFRzSliLDk2iPQuzYg/exec";

<<<<<<< HEAD
// ==========================================
// 3. ตัวแปรเก็บสะสมค่าการนั่ง (Background Tracker)
// ==========================================
let sitSeconds = 0;
let movesCount = 0;
let tempSum = 0;
let tempSamples = 0;
let alertsCount = 0;
let prevPosition: "LEFT" | "RIGHT" | "CENTER" | "NONE" = "NONE";
let prevAlertState = false;

// ==========================================
// 4. ฟังก์ชันส่งประวัติการนั่งลง Google Sheet
// ==========================================
export const logSittingSession = async (data: {
  sitSeconds: number;
  moves: number;
  avgTemp: number;
  alerts: number;
}) => {
  try {
    console.log("🚀 [Google Sheet] กำลังบันทึกประวัติการนั่ง...", data);

    await fetch(`${API_URL}?action=write`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(data),
      redirect: "follow",
    });

    console.log("✅ [Google Sheet] บันทึกประวัติสำเร็จ!");
  } catch (error) {
    console.error("❌ [Google Sheet] บันทึกล้มเหลว:", error);
  }
};

// ==========================================
// 5. ฟังก์ชันดึงข้อมูล Sensor + คำนวณเบื้องหลัง
// ==========================================
=======
// 3. ฟังก์ชันสำหรับดึงข้อมูลล่าสุด
>>>>>>> 829b4db0067e16b96520e34f7f33abd14a4c8376
export const fetchSensorData = async (): Promise<SensorData | null> => {
  try {
    const separator = API_URL.includes("?") ? "&" : "?";
    const cacheBusterUrl = `${API_URL}${separator}action=read&_t=${Date.now()}`;

    // 💡 แก้ไข: ตัด headers ออกทั้งหมด และใช้ redirect: 'follow'
    const response = await fetch(cacheBusterUrl, {
<<<<<<< HEAD
      method: "GET",
      redirect: "follow",
=======
      method: 'GET',
      redirect: 'follow',
>>>>>>> 829b4db0067e16b96520e34f7f33abd14a4c8376
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();
<<<<<<< HEAD
    if (!rawData) return null;

    // แปลงโครงสร้างข้อมูลจาก Google Sheet
    const sensorData: SensorData = {
      date: String(rawData.date || rawData.Date || ""),
      time: String(rawData.time || rawData.Time || "-"),
=======

    if (!rawData) return null;

    // จัดการแปลงข้อมูลอย่างปลอดภัย (Mapping) กันกรณีประเภทข้อมูลส่งมาไม่ตรง
    return {
      date: String(rawData.date || rawData.Date || ''),
      time: String(rawData.time || rawData.Time || '-'),
>>>>>>> 829b4db0067e16b96520e34f7f33abd14a4c8376
      sensor1: Number(rawData.sensor1 ?? 4095),
      sensor2: Number(rawData.sensor2 ?? 4095),
      temperature: Number(rawData.temperature ?? rawData.temp ?? 0),
      humidity: Number(rawData.humidity ?? rawData.humid ?? 0),
<<<<<<< HEAD
      status: rawData.status === "ACTIVE" ? "ACTIVE" : "STANDBY",
      position: rawData.position || "NONE",
      pressure: rawData.pressure === "HIGH" ? "HIGH" : "LOW",
    };

    // ----------------------------------------------------
    // ลอจิกประมวลผลการนั่งเบื้องหลัง (Background Logic)
    // ----------------------------------------------------
    const currentPosition = sensorData.position;
    const currentTemp = sensorData.temperature;
    const currentHumid = sensorData.humidity;

    if (currentPosition === "CENTER") {
      // 1) นั่งตรงกลาง -> สะสมเวลานั่ง และเก็บค่าอุณหภูมิ
      sitSeconds += 1;
      tempSum += currentTemp;
      tempSamples += 1;

      // นั่งต่อเนื่องเกิน 2 นาที (120 วินาที) นับ Alert 1 ครั้ง
      if (sitSeconds === 120) {
        alertsCount += 1;
      }

      // เช็คการแจ้งเตือนความชื้นสูง (> 75%) หรืออุณหภูมิสูง (> 38°C)
      const isAlerting = currentHumid > 75 || currentTemp > 38;
      if (isAlerting && !prevAlertState) {
        alertsCount += 1;
      }
      prevAlertState = isAlerting;

    } else if (currentPosition === "NONE") {
      // 2) ลุกออกจากเบาะ -> ถ้านั่งเกิน 10 วินาที ให้ส่งข้อมูลลง Google Sheet
      if ((prevPosition === "CENTER" || sitSeconds > 0) && sitSeconds >= 10) {
        const avgTemp =
          tempSamples > 0
            ? Number((tempSum / tempSamples).toFixed(1))
            : currentTemp;

        // บันทึกลง Google Sheet
        logSittingSession({
          sitSeconds,
          moves: movesCount,
          avgTemp,
          alerts: alertsCount,
        });
      }

      // รีเซ็ตตัวแปรเพื่อเตรียมนั่งรอบใหม่
      sitSeconds = 0;
      movesCount = 0;
      tempSum = 0;
      tempSamples = 0;
      alertsCount = 0;
      prevAlertState = false;

    } else if (currentPosition === "LEFT" || currentPosition === "RIGHT") {
      // 3) เอียงซ้าย/ขวา -> นับการขยับตัว 1 ครั้ง
      if (prevPosition === "CENTER") {
        movesCount += 1;
      }
    }

    prevPosition = currentPosition;

    return sensorData;
  } catch (error) {
    if (__DEV__) {
=======
      status: rawData.status === 'ACTIVE' ? 'ACTIVE' : 'STANDBY',
      position: rawData.position || 'NONE',
      pressure: rawData.pressure === 'HIGH' ? 'HIGH' : 'LOW',
    };
  } catch (error) {
    if (__DEV__) {
      // แสดง Log เฉพาะตอน Debug ไม่ให้ขัดจังหวะการทำงาน
>>>>>>> 829b4db0067e16b96520e34f7f33abd14a4c8376
      console.log("Error fetching sensor data:", error);
    }
    return null;
  }
};