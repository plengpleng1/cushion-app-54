import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

// ดึงข้อมูลจาก sensorService
import {
  fetchSensorData,
  SensorData,
} from '../../services/sensorService';

type PrimaryStatus = 'ACTIVE' | 'STANDBY';
type PressureSide = 'left' | 'right' | 'both' | 'none';

export default function HomeScreen() {
  // =========================
  // Timer & States
  // =========================
  const [seconds, setSeconds] = useState(0);

  // Sensor Data
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // UI State
  const [mainStatus, setMainStatus] = useState<PrimaryStatus>('STANDBY');
  const [pressureSide, setPressureSide] = useState<PressureSide>('none');
  const [isHumidHigh, setIsHumidHigh] = useState<boolean>(false);
  const [isTempHigh, setIsTempHigh] = useState<boolean>(false);

  // =========================
  // Timer Logic: นับเฉพาะเมื่อ pressureSide === 'both' (CENTER)
  // =========================
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (pressureSide === 'both') {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (pressureSide === 'none') {
    // ลุกออกไปแล้ว -> รีเซ็ตเวลากลับเป็น 0
    setSeconds(0);
  }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pressureSide]);

  // =========================
  // ดึงข้อมูล Sensor ทุก 2 วินาที
  // =========================
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await fetchSensorData();

        if (data && isMounted) {
          setSensorData(data);
          setLoading(false);

          // 1. เช็คความชื้นสูง > 75%
          const humidHigh = (data.humidity || 0) > 75;
          setIsHumidHigh(humidHigh);

          // 2. เช็คตำแหน่งแรงกด
          const isLeftPressed = (data.sensor1 ?? 4095) < 500;
          const isRightPressed = (data.sensor2 ?? 4095) < 500;

          if (isLeftPressed && isRightPressed) {
            setPressureSide('both');
          } else if (isLeftPressed) {
            setPressureSide('left');
          } else if (isRightPressed) {
            setPressureSide('right');
          } else {
            setPressureSide('none');
          }

          // 3. เช็คอุณหภูมิสูง > 38°C
          const tempHigh = (data.temperature || 0) > 38;
          setIsTempHigh(tempHigh);

          // 4. เช็คสถานะ ACTIVE / STANDBY
          if (data.status === 'ACTIVE') {
            setMainStatus('ACTIVE');
          } else {
            setMainStatus('STANDBY');
          }
        }
      } catch (error) {
        console.error('โหลดข้อมูล Sensor ไม่สำเร็จ:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // =========================
  // แก้ไขข้อความแสดง Position ให้ตรงตาม pressureSide เสมอ
  // =========================
  const getDisplayPosition = () => {
    switch (pressureSide) {
      case 'left':
        return 'LEFT';
      case 'right':
        return 'RIGHT';
      case 'both':
        return 'CENTER';
      case 'none':
      default:
        return sensorData?.position || 'NONE';
    }
  };

      // =========================
      // คำนวณสีของ Timer Card
      // =========================
      const getTimerCardStyle = () => {
        // ยังไม่ได้นั่ง
        if (pressureSide === 'none') {
          return {
            backgroundColor: '#F2F2F7',
          };
        }

        // นั่งเอียงซ้าย / ขวา
        if (
          pressureSide === 'left' ||
          pressureSide === 'right'
        ) {
          return {
            backgroundColor: '#E5E5EA',
          };
        }

        // นั่งตรงกลาง และเกิน/ครบ 2 นาที
        if (seconds >= 120) {
          return {
            backgroundColor: '#FF3B30',
          };
        }

        // นั่งตรงกลาง และยังไม่ถึง 2 นาที
        return {
          backgroundColor: '#34C759',
        };
      };

        // =========================
        // คำนวณสีตัวอักษรของ Timer
        // =========================
        const getTimerTextColor = () => {
          // กำลังนั่งตรงกลาง
          if (pressureSide === 'both') {
            // เกิน/ครบ 2 นาที
            if (seconds >= 120) {
              return '#FFFFFF';
            }

            // ยังไม่ถึง 2 นาที
            return '#FFFFFF';
          }

          // Standby / นั่งเอียง
          return '#8E8E93';
        };

  // แปลงวินาทีเป็น HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  // 🟢 เพิ่มฟังก์ชันนี้: สำหรับจัดฟอร์แมตเวลาจาก Google Sheet (เช่น "1899-12-30T17:00:48.000Z")
  // แปลง ISO Date String หรือข้อความวันเวลา ให้เหลือเฉพาะ HH:mm:ss
    const formatTimeDisplay = (timeStr?: string) => {
      if (!timeStr) return '-';

      // 1. ค้นหาแพตเทิร์นเวลา HH:mm:ss หรือ HH:mm ในข้อความ (เช่น หา 17:00:48 จาก 1899-12-30T17:00:48.000Z)
      const timeMatch = timeStr.match(/\d{2}:\d{2}(:\d{2})?/);
      
      if (timeMatch) {
        return timeMatch[0]; // ส่งกลับเฉพาะ "17:00:48" หรือ "17:00"
      }

      return timeStr;
    };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4464D0" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูลจาก Google Sheet...</Text>
      </View>
    );
  }

  const isActive = mainStatus === 'ACTIVE';

const formatUpdateTime = (time?: string) => {
  if (!time) return '-';

  try {
    const date = new Date(time);

    if (isNaN(date.getTime())) {
      return time;
    }

    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return time;
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <Text style={styles.logo}>Cushion{" "}
      <Text style={styles.sense}>Sense</Text>
      </Text>
      <Text style={styles.lastUpdateText}>
        อัปเดตล่าสุด: {formatUpdateTime(sensorData?.time)}
      </Text>

      {/* Alarm Alerts */}
      {(isHumidHigh || isTempHigh || seconds >= 120) && (
        <View style={styles.alarmCard}>
          <Text style={styles.alarmTitle}>🚨 แจ้งเตือนระบบ (Alarm Alert)</Text>
          {seconds >= 120 && (
            <Text style={styles.alarmText}>
              • นั่งตรงกลางเกิน 2 นาทีแล้ว กรุณาปรับเปลี่ยนท่านั่ง
            </Text>
          )}
          {isHumidHigh && (
            <Text style={styles.alarmText}>
              • ตรวจพบความชื้นสูงเกินกำหนด ({sensorData?.humidity ?? 0}%)
            </Text>
          )}
          {isTempHigh && (
            <Text style={styles.alarmText}>
              • ตรวจพบอุณหภูมิสูงเกินกำหนด ({sensorData?.temperature ?? 0} °C)
            </Text>
          )}
        </View>
      )}

      {/* Status + Timer */}
      <View style={styles.row}>
        {/* Status Card */}
        <View
          style={[
            styles.card,
            styles.thirdCard,
            {
              backgroundColor: isActive ? '#EAF9EC' : '#F2F2F7',
            },
          ]}
        >
          <Text style={styles.cardLabel}>Status</Text>
          <Text
            style={[
              styles.cardValue,
              {
                color: isActive ? '#34C759' : '#8E8E93',
              },
            ]}
          >
            {mainStatus}
          </Text>
          <Text style={styles.subText}>
            {isActive ? 'มีการลงน้ำหนัก' : 'ไม่มีการลงน้ำหนัก'}
          </Text>
        </View>

        {/* Timer Card */}
    <View
      style={[
        styles.card,
        styles.twoThirdsCard,
        getTimerCardStyle(),
      ]}
    >
      <Text
        style={[
          styles.cardLabel,
          {
            color: getTimerTextColor(),
          },
        ]}
      >
        Timer
      </Text>

      <Text
        style={[
          styles.timerValue,
          {
            color: getTimerTextColor(),
          },
        ]}
      >
        {formatTime(seconds)}
      </Text>
    </View>
  </View>

      {/* Position & Pressure Map */}
      <View style={styles.card}>
        <View style={styles.positionHeader}>
          <Text style={styles.cardLabel}>
            Position & Pressure Map ({getDisplayPosition()})
          </Text>
          <View style={styles.badgeContainer}>
            {isHumidHigh && <Text style={styles.humidBadge}>💧 Humid High</Text>}
            {isTempHigh && <Text style={styles.tempBadge}>🌡️ Temp High</Text>}
          </View>
        </View>

        <Text style={styles.notMedicalInformation}>
        หมายเหตุ: ผลประเมินเบื้องต้น ไม่ใช่การวินิจฉัยทางการแพทย์</Text>

        {/* Cushion Area */}
        <View
          style={[
            styles.cushionContainer,
            // 1. ถ้ากดเป็น CENTER (และยังไม่เกิน 2 นาที) ให้เป็นกรอบสีเขียว
            pressureSide === 'both' && seconds < 120 && styles.centerCushionContainer,
            // 2. ถ้า Temp High ให้กรอบแดง
            isTempHigh && styles.warningBorder,
            // 3. ถ้า Humid High ให้ขึ้นกรอบสีฟ้า (วางไว้บรรทัดล่างสุดเพื่อให้ขึ้นขอบฟ้าตามต้องการ)
            isHumidHigh && styles.humidWarningBorder,
          ]}
        >
          {/* Left Side */}
          <View
            style={[
              styles.cushionHalf,
              styles.leftHalf,
              // แสดงสีแดงเมื่อลงน้ำหนักฝั่งซ้าย/CENTER
              (pressureSide === 'left' || pressureSide === 'both') && styles.activePressureHalf,
              // เปลี่ยนเป็นสีเขียวเฉพาะตอนเป็น CENTER และเวลาน้อยกว่า 2 นาที (พอครบ 2 นาที จะกลับมาเป็นสีแดง)
              pressureSide === 'both' && seconds < 120 && styles.centerPressureHalf,
            ]}
          >
            {(pressureSide === 'left' || pressureSide === 'both') && (
              <View
                style={[
                  styles.heatSpot,
                  // วงกลมแรงกด เปลี่ยนเป็นสีเขียวเฉพาะตอนเวลาน้อยกว่า 2 นาที
                  pressureSide === 'both' && seconds < 120 && styles.centerHeatSpot,
                ]}
              />
            )}
          </View>

          {/* Right Side */}
          <View
            style={[
              styles.cushionHalf,
              styles.rightHalf,
              // แสดงสีแดงเมื่อลงน้ำหนักฝั่งขวา/CENTER
              (pressureSide === 'right' || pressureSide === 'both') && styles.activePressureHalf,
              // เปลี่ยนเป็นสีเขียวเฉพาะตอนเป็น CENTER และเวลาน้อยกว่า 2 นาที
              pressureSide === 'both' && seconds < 120 && styles.centerPressureHalf,
            ]}
          >
            {(pressureSide === 'right' || pressureSide === 'both') && (
              <View
                style={[
                  styles.heatSpot,
                  // วงกลมแรงกด เปลี่ยนเป็นสีเขียวเฉพาะตอนเวลาน้อยกว่า 2 นาที
                  pressureSide === 'both' && seconds < 120 && styles.centerHeatSpot,
                ]}
              />
            )}
          </View>
        </View>
      </View>

      {/* Sensor Values */}
      <View style={styles.sensorRow}>
        {/* Pressure */}
        {/* Pressure */}
      <View style={[styles.card, styles.pressureCard]}>
        <Text style={styles.cardLabel}>Pressure</Text>
        <Text style={styles.cardValue}>
          {pressureSide === 'none' ? 'LOW' : 'HIGH'}
        </Text>
      </View>

        {/* Temperature */}
        <View
          style={[
            styles.card,
            styles.thirdCard,
            isTempHigh && styles.tempWarningCard,
          ]}
        >
          <Text style={styles.cardLabel}>Temperature</Text>
          <Text
            style={[
              styles.cardValue,
              isTempHigh && styles.tempWarningText,
            ]}
          >
            {sensorData?.temperature ?? 0} °C
          </Text>
        </View>

        {/* Humidity */}
        <View
          style={[
            styles.card,
            styles.thirdCard,
            isHumidHigh && styles.humidWarningCard,
          ]}
        >
          <Text style={styles.cardLabel}>Humid</Text>
          <Text
            style={[
              styles.cardValue,
              isHumidHigh && styles.humidWarningText,
            ]}
          >
            {sensorData?.humidity ?? 0} %
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}


// =====================================================
// Styles
// =====================================================
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#F2F2F7',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 10,
    color: '#8E8E93',
  },
  header: {
    
    alignItems: "center",
    marginBottom: 35,
  },
  logo: {
    fontSize: 32,
    fontStyle: "italic",
    fontWeight: "700",
    color: '#4464D0',
    textAlign: 'center',
  },
  // Sense เอียงและบาง
  sense: {
    fontStyle: "italic",
    fontWeight: "400",
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  notMedicalInformation:{    //หมายเหตุ: ผลประเมินเบื้องต้น ไม่ใช่การวินิจฉัยทางการแพทย์
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 16,        // marginBottom แก้ระยะห่าง
    marginTop: 2,
  },
  alarmCard: {
    backgroundColor: '#FFE5E5',
    borderLeftWidth: 5,
    borderLeftColor: '#FF3B30',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
    width: '40%',          // แก้ขนาดกล่อง
    alignSelf:'center',    // แก้ตำแหน่งกล่อง
  },
  alarmTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 6,
  },
  alarmText: {
    fontSize: 13,
    color: '#D70000',
    fontWeight: '500',
    marginBottom: 3,
  },
  card: {                 //กล่อง Position
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    width: '40%',          // แก้ขนาดกล่อง
    alignSelf:'center',    // แก้ตำแหน่งกล่อง
  },
  cardLabel: {             
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  subText: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  timerValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  row: {                   // กล่อง status+timer
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    width: '40%',          // แก้ขนาดกล่อง
    alignSelf:'center',    // แก้ตำแหน่งกล่อง
  },
  sensorRow:{              // กล่อง temp+humid
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    width: '40%',          // แก้ขนาดกล่อง
    alignSelf:'center',    // แก้ตำแหน่งกล่อง 
  },
  thirdCard: {
    flex: 1,
    minHeight: 90,
    justifyContent: 'center',
  },
  pressureCard:{           //กล่อง pressure
    flex: 1,
    minHeight: 90,
    justifyContent: 'center',
  },
  twoThirdsCard: {
    flex: 2,
    minHeight: 90,
    justifyContent: 'center',
  },
  
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0.5,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  humidBadge: {            // humid high ตรง Position
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0288D1',
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tempBadge: {             // temp high ตรง Position
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF3B30',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cushionContainer: {
    height: 150,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
    padding: 2,
  },
  warningBorder: {
    borderColor: '#FF3B30',
    borderWidth: 3,
  },
  cushionHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
  },
  leftHalf: {
    borderRightWidth: 1,
    borderRightColor: '#333333',
  },
  rightHalf: {},
  activePressureHalf: {
    backgroundColor: '#FFD8D8',
  },
  heatSpot: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#FF8A80',
    opacity: 0.85,
  },
  // สไตล์เฉพาะตอนกดเป็น CENTER
  // ===================================
  centerCushionContainer: {
    borderColor: '#34C759', // เปลี่ยนสีเส้นขอบด้านนอกเป็นสีเขียว
    borderWidth: 2.5,
  },
  centerPressureHalf: {
    backgroundColor: '#E8F5E9', // เปลี่ยนสีพื้นหลังเบาะซ้าย-ขวาเป็นสีเขียวอ่อน
  },
  centerHeatSpot: {
    backgroundColor: '#81C784', // เปลี่ยนสีวงกลมแรงกด (Heat Spot) เป็นสีเขียว
  },
  tempWarningCard: {
    backgroundColor: '#FFF0F0',
  },

  //ตัวอักษร temp แดง ตอน temp high
  tempWarningText: {
    color: '#FF3B30',
  },
  humidWarningCard: {
    backgroundColor: '#E0F7FA',
  },
  humidWarningBorder: {
    borderColor: '#0288D1',           //ขอบตอน Humid High
    borderWidth: 3,
  },

  //ตัวอักษร humid ฟ้า ตอน humod high
  humidWarningText: {
    color: '#0288D1',
  },
});