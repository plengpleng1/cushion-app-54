// ⚠️ ใช้ Web App URL เดียวกับตัวอ่าน historyService
const HISTORY_API_URL = 'https://script.google.com/macros/s/AKfycbyNYyeMj98qwdehn41xbUQP_MTTnXieTOB6Qhd1yKWyj1COqoO6hU2aqa3kH-IbBOM-/exec';

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
      redirect: 'follow',
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

// ฟังก์ชันสำหรับส่งประวัติการนั่งไปบันทึกลง Google Sheet
export const logSittingSession = async (payload: SittingLogPayload): Promise<boolean> => {
  try {
    // ใช้ URLSearchParams หรือยิงผ่าน Query String เพื่อหลีกเลี่ยง CORS Preflight Options บน Web
    const queryParams = new URLSearchParams({
      action: 'logSitting',
      sitSeconds: payload.sitSeconds.toString(),
      moves: payload.moves.toString(),
      avgTemp: payload.avgTemp.toString(),
      alerts: payload.alerts.toString(),
      _t: Date.now().toString(),
    });

    const response = await fetch(`${HISTORY_API_URL}?${queryParams.toString()}`, {
      method: 'GET', // ใช้ GET ยิงพร้อม action=logSitting เพื่อความชัวร์และไม่ติด CORS
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error status: ${response.status}`);
    }

    const resData = await response.json();
    return resData?.status === 'success';
  } catch (error) {
    if (__DEV__) {
      console.log('Error logging sitting session:', error);
    }
    return false;
  }
};