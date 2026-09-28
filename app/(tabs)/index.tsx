import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// กำหนด Type ของสถานะให้รองรับทั้ง 4 สถานะ
type DeviceStatus = 'normal' | 'standby' | 'sitting_too_long' | 'critical';
type PressureSide = 'left' | 'right' | 'both' | 'none';

export default function HomeScreen() {
  const [seconds, setSeconds] = useState(0);

  // จำลอง status (สามารถเปลี่ยนเป็น 'normal' | 'standby' | 'sitting_too_long' | 'critical' เพื่อทดสอบดูได้)
  const [status, setStatus] = useState<DeviceStatus>('normal');

  // จำลองตำแหน่งแรงกดทับ และสถานะความชื้นสูง
  const [pressureSide, setPressureSide] = useState<PressureSide>('left');
  const [isHumidHigh, setIsHumidHigh] = useState<boolean>(false);

  // นับเวลา Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ฟังก์ชัน แปลงวินาทีเป็น HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ฟังก์ชันคืนค่าการแต่งสี ข้อความ และคำอธิบายตามสถานะ
  const getStatusConfig = (currentStatus: DeviceStatus) => {
    switch (currentStatus) {
      case 'standby':
        return {
          label: 'Standby',
          textColor: '#8E8E93', // สีเทา
          bgColor: '#F2F2F7',   // พื้นหลังเทาอ่อน
          subText: 'แรงกดหายไป 5 นาที',
        };
      case 'sitting_too_long':
        return {
          label: '⚠️ นั่งนานเกินไป',
          textColor: '#FF9500', // สีส้ม
          bgColor: '#FFF5E6',   // พื้นหลังส้มอ่อน
          subText: 'ควรลุกเปลี่ยนท่าทาง',
        };
      case 'critical':
        return {
          label: '🚨 วิกฤต',
          textColor: '#FF3B30', // สีแดง
          bgColor: '#FFE5E5',   // พื้นหลังแดงอ่อน
          subText: 'ตรวจพบค่าผิดปกติ!',
        };
      case 'normal':
      default:
        return {
          label: 'Active',
          textColor: '#34C759', // สีเขียว
          bgColor: '#EAF9EC',   // พื้นหลังเขียวอ่อน
          subText: 'ใช้งานปกติ',
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>Cushion Sense</Text>

      <View style={styles.row}>
        {/* 1. กล่อง Status (เปลี่ยนสี ข้อความ และ Subtext ตามค่าสถานะ) */}
        <View style={[styles.card, styles.halfCard, { backgroundColor: statusConfig.bgColor }]}>
          <Text style={styles.cardLabel}>Status</Text>
          <Text style={[styles.cardValue, { color: statusConfig.textColor }]} numberOfLines={1} adjustsFontSizeToFit>
            {statusConfig.label}
          </Text>
          <Text style={styles.subText}>{statusConfig.subText}</Text>
        </View>

        {/* 2. กล่อง Timer */}
        <View style={[styles.card, styles.halfCard, styles.timerCard]}>
          <Text style={[styles.cardLabel, { color: '#E5E5EA' }]}>Timer</Text>
          <Text style={styles.timerValue}>{formatTime(seconds)}</Text>
        </View>
      </View>

      {/* 3. กล่อง Position (แสดงภาพจำลองแรงกดทับเบาะ และขอบความชื้น) */}
      <View style={styles.card}>
        <View style={styles.positionHeader}>
          <Text style={styles.cardLabel}>Position & Pressure Map</Text>
          {isHumidHigh && <Text style={styles.humidBadge}>💧 Humid High</Text>}
        </View>

        {/* ตัวเบาะนั่ง (ถ้า Humid สูง จะมีขอบสีฟ้าล้อมรอบตามรูปที่ 3) */}
        <View style={[styles.cushionContainer, isHumidHigh && styles.humidBorder]}>
          {/* ฝั่งซ้าย */}
          <View
            style={[
              styles.cushionHalf,
              styles.leftHalf,
              (pressureSide === 'left' || pressureSide === 'both') && styles.activePressureHalf,
            ]}
          >
            {(pressureSide === 'left' || pressureSide === 'both') && <View style={styles.heatSpot} />}
          </View>

          {/* ฝั่งขวา */}
          <View
            style={[
              styles.cushionHalf,
              styles.rightHalf,
              (pressureSide === 'right' || pressureSide === 'both') && styles.activePressureHalf,
            ]}
          >
            {(pressureSide === 'right' || pressureSide === 'both') && <View style={styles.heatSpot} />}
          </View>
        </View>
      </View>

      {/* กล่องแบบคู่ (Pressure & Humid) */}
      <View style={styles.row}>
        {/* 4. กล่อง Pressure */}
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardLabel}>Pressure</Text>
          <Text style={styles.cardValue}>1013 hPa</Text>
        </View>
        
        {/* 5. กล่อง Temp */}
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardLabel}>Temperature</Text>
          <Text style={styles.cardValue}>25</Text>
        </View> 

        {/* 6. กล่อง Humid */}
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardLabel}>Humid</Text>
          <Text style={styles.cardValue}>{isHumidHigh ? '85 % (สูง)' : '65 %'}</Text>
        </View>
      </View>

      {/* ----------------- ส่วนสำหรับทดสอบเปลี่ยนสถานะ (Test Controls) ----------------- */}
      <View style={testStyles.testContainer}>
        <Text style={testStyles.testTitle}>🧪 Test Device Status:</Text>
        <View style={testStyles.buttonGroup}>
          <TouchableOpacity 
            style={[testStyles.btn, { backgroundColor: '#EAF9EC' }]} 
            onPress={() => setStatus('normal')}
          >
            <Text style={{ color: '#34C759', fontWeight: 'bold' }}>Normal</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[testStyles.btn, { backgroundColor: '#F2F2F7' }]} 
            onPress={() => setStatus('standby')}
          >
            <Text style={{ color: '#8E8E93', fontWeight: 'bold' }}>Standby</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[testStyles.btn, { backgroundColor: '#FFF5E6' }]} 
            onPress={() => setStatus('sitting_too_long')}
          >
            <Text style={{ color: '#FF9500', fontWeight: 'bold' }}>นั่งนาน</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[testStyles.btn, { backgroundColor: '#FFE5E5' }]} 
            onPress={() => setStatus('critical')}
          >
            <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Critical</Text>
          </TouchableOpacity>
        </View>

        <Text style={[testStyles.testTitle, { marginTop: 16 }]}>🧪 Test Pressure & Humid Position:</Text>
        <View style={testStyles.buttonGroup}>
          <TouchableOpacity 
            style={[testStyles.btn, pressureSide === 'left' && testStyles.btnActive]} 
            onPress={() => setPressureSide('left')}
          >
            <Text style={testStyles.btnText}>กดซ้าย (รูป 1)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[testStyles.btn, pressureSide === 'right' && testStyles.btnActive]} 
            onPress={() => setPressureSide('right')}
          >
            <Text style={testStyles.btnText}>กดขวา (รูป 2)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[testStyles.btn, isHumidHigh ? testStyles.btnHumidActive : testStyles.btnHumid]} 
            onPress={() => setIsHumidHigh(!isHumidHigh)}
          >
            <Text style={{ color: isHumidHigh ? '#FFFFFF' : '#0288D1', fontWeight: 'bold' }}>
              {isHumidHigh ? 'ปิด Humid สูง' : 'เปิด Humid สูง (รูป 3)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* ---------------------------------------------------------------------------- */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#F2F2F7',
    flexGrow: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#4464d0',
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
  timerCard: {
    backgroundColor: '#4464d0',
  },
  cardLabel: {
    fontSize: 14,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCard: {
    width: '32.5%',
  },

  /* ---------- ส่วนของภาพจำลอง Position / Cushion ---------- */
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  /* เพิ่มเส้นขอบสีฟ้าเมื่อความชื้นสูงตามรูปที่ 3 */
  humidBorder: {
    borderColor: '#29B6F6',
    borderWidth: 5,
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
  /* เมื่อฝั่งนั้นมีแรงกดสูง เปลี่ยนพื้นหลังเป็นสีพาสเทลส้ม/แดง */
  activePressureHalf: {
    backgroundColor: '#FFD8D8',
  },
  /* จุดความร้อนสีแดงตรงกลางฝั่งเบาะ */
  heatSpot: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#FF8A80',
    opacity: 0.85,
  },
});

/* ----------------- ส่วนสำหรับทดสอบเปลี่ยนสถานะ (Test Controls) ----------------- */
const testStyles = StyleSheet.create({
  testContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  testTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8E8E93',
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: '48%',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  btnActive: {
    backgroundColor: '#4464d0',
  },
  btnText: {
    fontWeight: 'bold',
    color: '#212529',
  },
  btnHumid: {
    backgroundColor: '#E0F7FA',
    width: '100%',
  },
  btnHumidActive: {
    backgroundColor: '#0288D1',
    width: '100%',
  },
});