import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';

import {
  fetchSensorData,
  SensorData,
} from '../../services/sensorService';

type PrimaryStatus = 'ACTIVE' | 'STANDBY';
type PressureSide = 'left' | 'right' | 'both' | 'none';

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const maxContainerWidth = Math.min(windowWidth - 32, 500);

  const [seconds, setSeconds] = useState(0);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [mainStatus, setMainStatus] = useState<PrimaryStatus>('STANDBY');
  const [pressureSide, setPressureSide] = useState<PressureSide>('none');
  const [isHumidHigh, setIsHumidHigh] = useState<boolean>(false);
  const [isTempHigh, setIsTempHigh] = useState<boolean>(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (pressureSide === 'both') {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (pressureSide === 'none') {
      setSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pressureSide]);

  useEffect(() => {
  let isMounted = true;
  let lastFetchedTime: string | null = null;

    const loadData = async () => {
    try {
      const data = await fetchSensorData();

      // ถ้าดึงข้อมูลไม่ได้ เช่น 404
      // ไม่ต้อง reset ค่าเดิม
      if (!data || !isMounted) {
        return;
      }

      // เช็กว่ามีข้อมูลใหม่เข้ามาหรือไม่
      const isNewData =
        !!data.time && data.time !== lastFetchedTime;

      if (isNewData) {
        lastFetchedTime = data.time;
      }

      // -----------------------------
      // เก็บข้อมูล Sensor ล่าสุด
      // -----------------------------
      setSensorData(data);
      setLoading(false);

      // -----------------------------
      // Humidity
      // -----------------------------
      const humidHigh = (data.humidity || 0) > 75;
      setIsHumidHigh(humidHigh);

      // -----------------------------
      // อ่านแรงกดจาก Sensor
      // -----------------------------
      const isLeftPressed = (data.sensor1 ?? 4095) < 500;
      const isRightPressed = (data.sensor2 ?? 4095) < 500;

      // ถ้ามีเซนเซอร์ตัวใดตัวหนึ่งต่ำกว่า 500 ให้ตีเป็น 'HIGH' ทันที
      const correctedPressure = (isLeftPressed || isRightPressed) ? "HIGH" : "LOW";
      // จากนั้นก็นำค่า correctedPressure นี้ไปใช้งานหรือบันทึกลง Async Storage แทนค่าเดิมที่มาจาก API ได้เลยครับ
      // 🎯 นำค่าที่ถูกต้องไปทับค่าเดิมในตัวแปร data ซะเลย
      data.pressure = correctedPressure;

      let calcPos: 'left' | 'right' | 'both' | 'none' = 'none';

      if (isLeftPressed && isRightPressed) {
        calcPos = 'both';   // กดทั้งสองข้าง (ตรงกลาง)
      } else if (isLeftPressed) {
        calcPos = 'left';   // ฝั่งซ้าย
      } else if (isRightPressed) {
        calcPos = 'right';  // ฝั่งขวา
      } else {
        calcPos = 'none';   // ไม่มีแรงกด
      }

      setPressureSide(calcPos); 

      // -----------------------------
      // Status (อิงค่าตาม Google Sheets/API ตรงๆ)
      // -----------------------------
      if (data && data.status) {
        const normalizedStatus = String(data.status).toUpperCase() as 'ACTIVE' | 'STANDBY';
        setMainStatus(normalizedStatus);
      }

      // -----------------------------
      // Temperature
      // -----------------------------
      const tempHigh = (data.temperature || 0) > 28;
      setIsTempHigh(tempHigh);

    } catch (error) {
      console.error('โหลดข้อมูล Sensor ไม่สำเร็จ:', error);
    }
  };

  // โหลดครั้งแรกทันที
  loadData();

  // โหลดข้อมูลทุก 2 วินาที
  const interval = setInterval(loadData, 2000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}, []);

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
      return 'NONE'; // บังคับให้คืนค่า 'NONE' ตรงๆ ทันทีเมื่อไม่มีการกด
  }
};

  const getTimerCardStyle = () => {
    if (pressureSide === 'none') {
      return { backgroundColor: '#F2F2F7' };
    }
    if (pressureSide === 'left' || pressureSide === 'right') {
      return { backgroundColor: '#E5E5EA' };
    }
    if (seconds >= 120) {
      return { backgroundColor: '#FF3B30' };
    }
    return { backgroundColor: '#34C759' };
  };

  const getTimerTextColor = () => {
    if (pressureSide === 'both') {
      return '#FFFFFF';
    }
    return '#8E8E93';
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // แก้ไขตรงอัปเดตล่าสุด
  // แก้ไขฟังก์ชันอัปเดตล่าสุดให้ปลอดภัยจากวันที่เพี้ยน (ปี 1899)
  const formatUpdateTime = (
    dateString?: string,
    timeString?: string
  ) => {
    // ถ้าไม่มีค่า หรือตัวหนังสือติดค่าปี 1899 ที่เป็นบั๊ก ให้ใช้เวลาปัจจุบันแทนทันที
    if (!dateString || !timeString || String(dateString).includes('1899')) {
      const now = new Date();
      return `${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} น. ${now.toLocaleDateString('en-GB')}`;
    }

    try {
      // ตรวจสอบว่าถ้า timeString เป็นแค่วินาที/เวลา (เช่น "02:38:50") ให้แปะวันที่เข้าไปด้วยเพื่อให้ new Date() อ่านออก
      const fullDateTimeString = timeString.includes('T') || timeString.includes('-') 
        ? timeString 
        : `${dateString.split('T')[0]}T${timeString}`;

      const time = new Date(fullDateTimeString);
      
      // ถ้าแปลงแล้วได้ปี 1899 (Invalid Date) ให้ fallback ไปใช้เวลาปัจจุบัน
      if (isNaN(time.getTime()) || time.getFullYear() <= 1900) {
        throw new Error('Invalid date');
      }

      const formattedTime = time.toLocaleTimeString('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Bangkok',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });

      return `${formattedTime} น. ${formattedDate}`;
    } catch {
      // กรณีแปลงไม่ผ่านจริงๆ ให้โชว์ค่าเดิมแบบกันพัง หรือดึงเวลาปัจจุบันมาโชว์
      const now = new Date();
      return `${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} น. ${now.toLocaleDateString('en-GB')}`;
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.mainWrapper, { width: maxContainerWidth }]}>
        <Text style={styles.logo}>
          Cushion <Text style={styles.sense}>Sense</Text>
        </Text>
        <Text style={styles.lastUpdateText}>
          อัปเดตล่าสุด: {formatUpdateTime(sensorData?.date, sensorData?.time)}
        </Text>

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

        <View style={styles.row}>
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
            หมายเหตุ: ผลประเมินเบื้องต้น ไม่ใช่การวินิจฉัยทางการแพทย์
          </Text>

          <View
            style={[
              styles.cushionContainer,
              pressureSide === 'both' && seconds < 120 && styles.centerCushionContainer,
              isTempHigh && styles.warningBorder,
              isHumidHigh && styles.humidWarningBorder,
            ]}
          >
            <View
              style={[
                styles.cushionHalf,
                styles.leftHalf,
                (pressureSide === 'left' || pressureSide === 'both') && styles.activePressureHalf,
                pressureSide === 'both' && seconds < 120 && styles.centerPressureHalf,
              ]}
            >
              {(pressureSide === 'left' || pressureSide === 'both') && (
                <View
                  style={[
                    styles.heatSpot,
                    pressureSide === 'both' && seconds < 120 && styles.centerHeatSpot,
                  ]}
                />
              )}
            </View>

            <View
              style={[
                styles.cushionHalf,
                styles.rightHalf,
                (pressureSide === 'right' || pressureSide === 'both') && styles.activePressureHalf,
                pressureSide === 'both' && seconds < 120 && styles.centerPressureHalf,
              ]}
            >
              {(pressureSide === 'right' || pressureSide === 'both') && (
                <View
                  style={[
                    styles.heatSpot,
                    pressureSide === 'both' && seconds < 120 && styles.centerHeatSpot,
                  ]}
                />
              )}
            </View>
          </View>
        </View>

        <View style={styles.sensorRow}>
          <View style={[styles.card, styles.pressureCard]}>
            <Text style={styles.cardLabel}>Pressure</Text>
            <Text style={styles.cardValue}>
              {pressureSide === 'none' ? 'LOW' : 'HIGH'}
            </Text>
          </View>

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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    flexGrow: 1,
    alignItems: 'center',
  },
  mainWrapper: {
    alignSelf: 'center',
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
  logo: {
    fontSize: 32,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#4464D0',
    textAlign: 'center',
  },
  sense: {
    fontStyle: 'italic',
    fontWeight: '400',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  notMedicalInformation: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 16,
    marginTop: 2,
  },
  alarmCard: {
    backgroundColor: '#FFE5E5',
    borderLeftWidth: 5,
    borderLeftColor: '#FF3B30',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
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
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
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
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  sensorRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  thirdCard: {
    flex: 1,
    minHeight: 90,
    justifyContent: 'center',
  },
  pressureCard: {
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
  humidBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0288D1',
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tempBadge: {
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
    borderRightColor: '#c3c5c9',
    borderStyle: 'dashed',
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
  centerCushionContainer: {
    borderColor: '#34C759',
    borderWidth: 2.5,
  },
  centerPressureHalf: {
    backgroundColor: '#E8F5E9',
  },
  centerHeatSpot: {
    backgroundColor: '#81C784',
  },
  tempWarningCard: {
    backgroundColor: '#FFF0F0',
  },
  tempWarningText: {
    color: '#FF3B30',
  },
  humidWarningCard: {
    backgroundColor: '#E0F7FA',
  },
  humidWarningBorder: {
    borderColor: '#0288D1',
    borderWidth: 3,
  },
  humidWarningText: {
    color: '#0288D1',
  },
});