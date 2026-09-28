import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// Structure ข้อมูล Log รายการย้อนหลัง (เพิ่ม temp)
type HistoryLog = {
  id: string;
  timestamp: string;
  status: 'normal' | 'sitting_too_long' | 'critical' | 'standby';
  pressureSide: 'left' | 'right' | 'both' | 'none';
  pressureValue: number;
  humidity: number;
  temperature: number; // °C
  isHumidHigh: boolean;
};

const MOCK_HISTORY: HistoryLog[] = [
  { id: '1', timestamp: '15:30 น.', status: 'critical', pressureSide: 'left', pressureValue: 1025, humidity: 85, temperature: 37.2, isHumidHigh: true },
  { id: '2', timestamp: '14:15 น.', status: 'sitting_too_long', pressureSide: 'right', pressureValue: 1018, humidity: 78, temperature: 36.8, isHumidHigh: false },
  { id: '3', timestamp: '12:00 น.', status: 'normal', pressureSide: 'both', pressureValue: 1012, humidity: 62, temperature: 35.5, isHumidHigh: false },
  { id: '4', timestamp: '10:45 น.', status: 'standby', pressureSide: 'none', pressureValue: 1008, humidity: 58, temperature: 34.2, isHumidHigh: false },
];

export default function HistoryScreen() {
  const [selectedTab, setSelectedTab] = useState<'today' | 'week'>('today');
  const [showAllLogs, setShowAllLogs] = useState(false);

  // ข้อมูลจำลองสำหรับ Trend Chart (เพิ่ม Temp Dataset)
  const chartData = {
    labels: ['09:00', '11:00', '13:00', '15:00', '17:00'],
    datasets: [
      {
        data: [65, 58, 62, 78, 85], // Humid (%) - สีฟ้า
        color: (opacity = 1) => `rgba(2, 136, 209, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: [40, 45, 50, 75, 90], // Pressure Index - สีแดง
        color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: [34, 35, 36, 37, 37.5], // Temp (°C) - สีส้ม
        color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Humid (%)', 'Pressure', 'Temp (°C)'],
  };

  const getStatusBadge = (status: HistoryLog['status']) => {
    switch (status) {
      case 'critical':
        return { label: '🚨 วิกฤต', bgColor: '#FFE5E5', textColor: '#FF3B30' };
      case 'sitting_too_long':
        return { label: '⚠️ นั่งนานเกินไป', bgColor: '#FFF5E6', textColor: '#FF9500' };
      case 'standby':
        return { label: 'Standby', bgColor: '#F2F2F7', textColor: '#8E8E93' };
      case 'normal':
      default:
        return { label: 'Active', bgColor: '#EAF9EC', textColor: '#34C759' };
    }
  };

  const getSideText = (side: HistoryLog['pressureSide']) => {
    switch (side) {
      case 'left': return 'ซ้ายสูง';
      case 'right': return 'ขวาสูง';
      case 'both': return 'เท่ากัน';
      case 'none': default: return 'ไม่มีแรงกด';
    }
  };

  const displayedLogs = showAllLogs ? MOCK_HISTORY : MOCK_HISTORY.slice(0, 2);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.headerTitle}>Clinical Dashboard</Text>
      <Text style={styles.subHeaderTitle}>รายงานวิเคราะห์พฤติกรรมทางการแพทย์</Text>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'today' && styles.activeTabButton]}
          onPress={() => setSelectedTab('today')}
        >
          <Text style={[styles.tabText, selectedTab === 'today' && styles.activeTabText]}>วันนี้</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'week' && styles.activeTabButton]}
          onPress={() => setSelectedTab('week')}
        >
          <Text style={[styles.tabText, selectedTab === 'week' && styles.activeTabText]}>สัปดาห์นี้</Text>
        </TouchableOpacity>
      </View>

      {/* ================= SECTION 1: DAILY SUMMARY (สถิติหลัก) ================= */}
      <View style={styles.gridRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricEmoji}>⏱️</Text>
          <Text style={styles.metricValue}>5 ชม. 20 นาที</Text>
          <Text style={styles.metricLabel}>เวลานั่งรวม</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricEmoji}>🚶‍♂️</Text>
          <Text style={styles.metricValue}>12 ครั้ง</Text>
          <Text style={styles.metricLabel}>ขยับเปลี่ยนท่า</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricEmoji}>🌡️</Text>
          <Text style={[styles.metricValue, { color: '#FF9500' }]}>35.5 °C</Text>
          <Text style={styles.metricLabel}>อุณหภูมิเฉลี่ย</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricEmoji}>🚨</Text>
          <Text style={[styles.metricValue, { color: '#FF3B30' }]}>1 ครั้ง</Text>
          <Text style={styles.metricLabel}>เตือนวิกฤต/ชื้น</Text>
        </View>
      </View>

      {/* Pressure Balance Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚖️ สมดุลการลงน้ำหนัก (Pressure Balance)</Text>
        <View style={styles.balanceInfoRow}>
          <Text style={styles.leftSideText}>ซ้าย 60%</Text>
          <Text style={styles.rightSideText}>ขวา 40%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFillLeft, { width: '60%' }]} />
          <View style={[styles.progressFillRight, { width: '40%' }]} />
        </View>
        <Text style={styles.balanceNote}>
          💡 **ประเมิน:** ทิ้งน้ำหนักลงฝั่งซ้ายมากกว่าปกติ ควรระวังการลงน้ำหนักเอียง
        </Text>
      </View>

      {/* ================= SECTION 2: CHARTS & TRENDS (แนวโน้มตามเวลา) ================= */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📈 แนวโน้มตลอดวัน (Daily Trend)</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 72}
          height={210}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(142, 142, 147, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(28, 28, 30, ${opacity})`,
            propsForDots: { r: '4', strokeWidth: '2' },
          }}
          bezier
          style={styles.chartStyle}
        />
      </View>

      {/* ================= SECTION 3: RAW EVENT LOGS (ประวัติรายรายการ) ================= */}
      <View style={styles.card}>
        <View style={styles.logHeaderRow}>
          <Text style={styles.cardTitle}>📋 ประวัติบันทึกเหตุการณ์ (Recent Logs)</Text>
          <TouchableOpacity onPress={() => setShowAllLogs(!showAllLogs)}>
            <Text style={styles.toggleText}>{showAllLogs ? 'ย่อลง' : 'ดูทั้งหมด'}</Text>
          </TouchableOpacity>
        </View>

        {displayedLogs.map((item) => {
          const badge = getStatusBadge(item.status);
          return (
            <View key={item.id} style={[styles.logItem, item.isHumidHigh && styles.humidHighlight]}>
              <View style={styles.logTopRow}>
                <Text style={styles.logTimestamp}>{item.timestamp}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bgColor }]}>
                  <Text style={[styles.badgeText, { color: badge.textColor }]}>{badge.label}</Text>
                </View>
              </View>
              <View style={styles.logBottomRow}>
                <Text style={styles.logSubText}>แรงกด: {getSideText(item.pressureSide)} ({item.pressureValue} hPa)</Text>
                <Text style={styles.logSubText}>อุณหภูมิ: <Text style={{ color: '#FF9500', fontWeight: 'bold' }}>{item.temperature} °C</Text></Text>
                <Text style={[styles.logSubText, item.isHumidHigh && { color: '#0288D1', fontWeight: 'bold' }]}>
                  ชื้น: {item.humidity}% {item.isHumidHigh ? '💧' : ''}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  contentContainer: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#4464d0', textAlign: 'center' },
  subHeaderTitle: { fontSize: 13, color: '#8E8E93', textAlign: 'center', marginBottom: 16, marginTop: 4 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 12, padding: 4, marginBottom: 16 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTabButton: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  activeTabText: { color: '#4464d0' },

  gridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  metricCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, alignItems: 'center', marginBottom: 10, elevation: 2 },
  metricEmoji: { fontSize: 22, marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  metricLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 10 },

  balanceInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  leftSideText: { fontSize: 13, fontWeight: 'bold', color: '#FF3B30' },
  rightSideText: { fontSize: 13, fontWeight: 'bold', color: '#34C759' },
  progressTrack: { height: 10, flexDirection: 'row', borderRadius: 5, backgroundColor: '#E5E5EA', overflow: 'hidden', marginBottom: 8 },
  progressFillLeft: { backgroundColor: '#FF3B30' },
  progressFillRight: { backgroundColor: '#34C759' },
  balanceNote: { fontSize: 12, color: '#8E8E93' },

  chartStyle: { marginVertical: 4, borderRadius: 12, alignSelf: 'center' },

  logHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  toggleText: { fontSize: 13, color: '#4464d0', fontWeight: 'bold' },
  logItem: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E5E5EA' },
  humidHighlight: { borderLeftWidth: 4, borderLeftColor: '#0288D1' },
  logTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logTimestamp: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  logBottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, flexWrap: 'wrap', gap: 4 },
  logSubText: { fontSize: 11, color: '#8E8E93' },
});