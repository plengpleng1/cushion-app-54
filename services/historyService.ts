// services/dashboardService.ts

// ⚠️ Web App URL จาก Google Apps Script
const HISTORY_API_URL = 'https://script.google.com/macros/s/AKfycbzxUxMi5NecassCT-EwLgo5sFroDvkCOnGZXRcRGAMZWgD_vl2mY45ANcLuG8ACKIJ4/exec';

export interface DashboardSummary {
  today: {
    sitMinutes: number;
    moves: number;
    avgTemp: string;
    alerts: number;
  };
  week: {
    sitMinutes: number;
    moves: number;
    avgTemp: string;
    alerts: number;
  };
}

export const fetchDashboardSummary = async (): Promise<DashboardSummary | null> => {
  try {
    const separator = HISTORY_API_URL.includes('?') ? '&' : '?';
    // เติม Timestamp เพื่อป้องกันการดึงข้อมูลแคชเก่า (Cache-busting)
    const cacheBusterUrl = `${HISTORY_API_URL}${separator}_t=${Date.now()}`;

    // ลบ headers ป้องกันการติด CORS บน Web Browser และใส่ redirect: 'follow'
    const response = await fetch(cacheBusterUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error status: ${response.status}`);
    }

    const data = (await response.json()) as DashboardSummary;
    return data;
  } catch (error) {
    // ใช้ console.warn เพื่อป้องกัน UI เกิด Crash สีแดงเวลาหลุดการเชื่อมต่อ
    console.warn('Error fetching dashboard summary:', error);
    
    // คืนค่า Mock Data สำรอง หรือ null เพื่อไม่ให้หน้าแอปค้าง
    return {
      today: {
        sitMinutes: 0,
        moves: 0,
        avgTemp: '36.5',
        alerts: 0,
      },
      week: {
        sitMinutes: 0,
        moves: 0,
        avgTemp: '36.5',
        alerts: 0,
      },
    };
  }
};