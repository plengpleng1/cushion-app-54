// ⚠️ ใช้ Web App URL เดียวกับตัวอ่าน historyService
const HISTORY_API_URL = 'https://script.google.com/macros/s/AKfycbyZHrfZdDKAon-YcJMsVd-7gp0hNk30UEPAteoRP1GQ6eYX1DgMkAImFF56LqGFksBF/exec';

// 1. Export Interface สำหรับ DashboardSummary
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

export interface SittingLogPayload {
  sitSeconds: number;
  moves: number;
  avgTemp: number;
  alerts: number;
}

// 2. Export ฟังก์ชัน fetchDashboardSummary
export const fetchDashboardSummary = async (): Promise<DashboardSummary | null> => {
  try {
    const response = await fetch(`${HISTORY_API_URL}?action=getSummary&_t=${Date.now()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error status: ${response.status}`);
    }

    const resData = await response.json();
    return resData;
  } catch (error) {
    if (__DEV__) {
      console.log('Error fetching dashboard summary:', error);
    }
    return null;
  }
};

// 3. ฟังก์ชันสำหรับส่งประวัติการนั่งไปบันทึกลง Google Sheet
export const logSittingSession = async (payload: SittingLogPayload): Promise<boolean> => {
  try {
    const queryParams = new URLSearchParams({
      action: 'logSitting',
      sitSeconds: payload.sitSeconds.toString(),
      moves: payload.moves.toString(),
      avgTemp: payload.avgTemp.toString(),
      alerts: payload.alerts.toString(),
      _t: Date.now().toString(),
    });

    // ใช้ mode: 'no-cors' เพื่อให้เบราว์เซอร์ส่ง Request ไปยัง Google Apps Script ได้โดยไม่โดน CORS บล็อก
    await fetch(`${HISTORY_API_URL}?${queryParams.toString()}`, {
      method: 'GET',
      mode: 'no-cors',
    });

    if (__DEV__) {
      console.log('✅ ส่งข้อมูลประวัติการนั่งไป Google Sheet เรียบร้อย');
    }
    return true;
  } catch (error) {
    if (__DEV__) {
      console.log('❌ Error logging sitting session:', error);
    }
    return false;
  }
};