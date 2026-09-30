// services/dashboardService.ts

// ⚠️ วาง Web App URL ที่เพิ่งก๊อปปี้มาจาก Apps Script ตรงนี้
const DASHBOARD_API_URL = 'https://script.google.com/macros/s/AKfycbzxUxMi5NecassCT-EwLgo5sFroDvkCOnGZXRcRGAMZWgD_vl2mY45ANcLuG8ACKIJ4/exec';

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
    const separator = DASHBOARD_API_URL.includes('?') ? '&' : '?';
    // เติม Timestamp เพื่อป้องกันการดึงข้อมูลแคชเก่า (Cache-busting)
    const cacheBusterUrl = `${DASHBOARD_API_URL}${separator}_t=${Date.now()}`;

    const response = await fetch(cacheBusterUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error status: ${response.status}`);
    }

    const data = (await response.json()) as DashboardSummary;
    return data;
  } catch (error) {
    // ใช้ console.warn เพื่อป้องกัน UI เกิด Crash สีแดงเวลาหลุดการเชื่อมต่อ
    console.warn('Error fetching dashboard summary:', error);
    return null; // คืนค่า null เพื่อให้ UI ยังคงแสดง "ค่าเดิม" ล่าสุดไว้
  }
};