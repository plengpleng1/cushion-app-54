import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

// ดึงข้อมูลจาก sensorService โดยไม่แก้ไขอะไรใน service
import {
  fetchSensorData,
  SensorData,
} from '../../services/sensorService';

type TabType = 'today' | 'week';

interface HistoryLog extends SensorData {
  id: string;
  calculatedPosition: 'LEFT' | 'RIGHT' | 'CENTER' | 'NONE';
  isTempHigh: boolean;
  isHumidHigh: boolean;
  leftPressed: boolean;
  rightPressed: boolean;
}

// =====================================================
// ฟังก์ชันจัดรูปแบบเวลา
// =====================================================
const formatTime = (time?: string) => {
  if (!time) return '-';

  // กรณี Google Sheet ส่งมาเป็น
  // 1899-12-30T17:00:48.000Z
  if (time.includes('T')) {
    const date = new Date(time);

    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    }
  }

  // กรณีส่งมาเป็น 17:00:48 อยู่แล้ว
  return time;
};

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);

  // ==========================================
  // ดึงข้อมูลและสะสม Log
  // ==========================================
  const loadHistoryData = async () => {
    try {
      const data = await fetchSensorData();

      if (data) {
        // 1. คำนวณการกดซ้าย/ขวา
        const isLeftPressed = (data.sensor1 ?? 4095) < 500;
        const isRightPressed = (data.sensor2 ?? 4095) < 500;

        let calcPos: 'LEFT' | 'RIGHT' | 'CENTER' | 'NONE' = 'NONE';

        if (isLeftPressed && isRightPressed) {
          calcPos = 'CENTER';
        } else if (isLeftPressed) {
          calcPos = 'LEFT';
        } else if (isRightPressed) {
          calcPos = 'RIGHT';
        }

        // 2. เช็คอุณหภูมิสูง > 38°C
        const tempHigh = (data.temperature || 0) > 38;

        // 3. เช็คความชื้นสูง > 75%
        const humidHigh = (data.humidity || 0) > 75;

        const newLog: HistoryLog = {
          ...data,

          id: `${data.date}_${data.time}_${Math.random()}`,

          calculatedPosition: calcPos,

          isTempHigh: tempHigh,

          isHumidHigh: humidHigh,

          leftPressed: isLeftPressed,

          rightPressed: isRightPressed,
        };

        setHistoryLogs((prev) => {
          // ป้องกันข้อมูลซ้ำ
          if (
            prev.some(
              (item) =>
                item.time === data.time &&
                item.date === data.date
            )
          ) {
            return prev;
          }

          return [newLog, ...prev];
        });
      }
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // โหลดข้อมูลทุก 3 วินาที
  // ==========================================
  useEffect(() => {
    loadHistoryData();

    const interval = setInterval(() => {
      loadHistoryData();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // คำนวณ Dashboard Stats
  // ==========================================
  const getDashboardStats = () => {
    const total = historyLogs.length || 1;

    let leftCount = 0;
    let rightCount = 0;
    let tempSum = 0;
    let alertCount = 0;
    let moveCount = 0;

    historyLogs.forEach((log, idx) => {
      if (log.leftPressed) {
        leftCount++;
      }

      if (log.rightPressed) {
        rightCount++;
      }

      tempSum += log.temperature || 0;

      if (log.isTempHigh || log.isHumidHigh) {
        alertCount++;
      }

      // เช็คการเปลี่ยนตำแหน่ง
      if (
        idx > 0 &&
        log.calculatedPosition !==
          historyLogs[idx - 1].calculatedPosition
      ) {
        moveCount++;
      }
    });

    const totalPressureSide = leftCount + rightCount || 1;

    const leftPercent = Math.round(
      (leftCount / totalPressureSide) * 100
    );

    const rightPercent = 100 - leftPercent;

    const avgTemp = (tempSum / total).toFixed(1);

    // คำนวณเวลานั่งโดยประมาณ
    const totalMinutes = Math.floor(
      (historyLogs.length * 3) / 60
    );

    const hours = Math.floor(totalMinutes / 60);

    const mins = totalMinutes % 60;

    const sittingTimeStr =
      hours > 0
        ? `${hours} ชม. ${mins} นาที`
        : `${mins || 0} นาที`;

    return {
      sittingTimeStr,
      moveCount,
      avgTemp,
      alertCount,
      leftPercent,
      rightPercent,
    };
  };

  const stats = getDashboardStats();

  // ==========================================
  // Loading
  // ==========================================
  if (loading && historyLogs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#4464D0"
        />

        <Text style={styles.loadingText}>
          กำลังโหลดข้อมูล Dashboard...
        </Text>
      </View>
    );
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Header */}
      <Text style={styles.headerTitle}>
        Clinical Dashboard
      </Text>

      <Text style={styles.subHeaderTitle}>
        รายงานวิเคราะห์พฤติกรรมทางการแพทย์
      </Text>

      {/* ==========================================
          Tab Switcher
      ========================================== */}
      <View style={styles.tabContainer}>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'today' &&
              styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('today')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'today' &&
                styles.activeTabText,
            ]}
          >
            วันนี้
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'week' &&
              styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('week')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'week' &&
                styles.activeTabText,
            ]}
          >
            สัปดาห์นี้
          </Text>
        </TouchableOpacity>

      </View>

      {/* ==========================================
          Summary Cards
      ========================================== */}
      <View style={styles.gridContainer}>

        {/* เวลานั่งรวม */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardIcon}>⏱️</Text>

          <Text style={styles.cardValueText}>
            {stats.sittingTimeStr}
          </Text>

          <Text style={styles.cardLabelText}>
            เวลานั่งรวม
          </Text>
        </View>

        {/* ขยับเปลี่ยนท่า */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardIcon}>🚶</Text>

          <Text style={styles.cardValueText}>
            {stats.moveCount} ครั้ง
          </Text>

          <Text style={styles.cardLabelText}>
            ขยับเปลี่ยนท่า
          </Text>
        </View>

        {/* อุณหภูมิเฉลี่ย */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardIcon}>🌡️</Text>

          <Text
            style={[
              styles.cardValueText,
              { color: '#FF9500' },
            ]}
          >
            {stats.avgTemp} °C
          </Text>

          <Text style={styles.cardLabelText}>
            อุณหภูมิเฉลี่ย
          </Text>
        </View>

        {/* แจ้งเตือน */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardIcon}>🚨</Text>

          <Text
            style={[
              styles.cardValueText,
              { color: '#FF3B30' },
            ]}
          >
            {stats.alertCount} ครั้ง
          </Text>

          <Text style={styles.cardLabelText}>
            เตือนวิกฤต/ชื้น
          </Text>
        </View>

      </View>

      {/* ==========================================
          Pressure Balance
      ========================================== */}
      <View style={styles.cardSection}>

        <Text style={styles.sectionTitle}>
          ⚖️ สัดส่วนการพบแรงกดสูง (High Pressure Balance)
        </Text>

        <View style={styles.balanceHeader}>
          <Text style={styles.leftPercentText}>
            ซ้าย {stats.leftPercent}%
          </Text>

          <Text style={styles.rightPercentText}>
            ขวา {stats.rightPercent}%
          </Text>
        </View>

        <View style={styles.balanceBarContainer}>

          <View
            style={[
              styles.leftBar,
              {
                flex: stats.leftPercent || 1,
              },
            ]}
          />

          <View
            style={[
              styles.rightBar,
              {
                flex: stats.rightPercent || 1,
              },
            ]}
          />

        </View>

        <Text style={styles.evalText}>
          💡 ประเมิน:{' '}
          {Math.abs(
            stats.leftPercent -
              stats.rightPercent
          ) < 20
            ? 'การลงน้ำหนักซ้าย-ขวาอยู่ในเกณฑ์สมดุล'
            : 'ตรวจพบการลงน้ำหนักเอียงไปฝั่งใดฝั่งหนึ่งมากเกินไป'}
        </Text>

      </View>

      {/* ==========================================
          Daily Trend
      ========================================== */}
      <View style={styles.cardSection}>

        <Text style={styles.sectionTitle}>
          📈 แนวโน้มตลอดวัน (Daily Trend)
        </Text>

        {/* Legend */}
        <View style={styles.legendRow}>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: '#0288D1' },
              ]}
            />

            <Text style={styles.legendText}>
              Humid (%)
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: '#FF8A80' },
              ]}
            />

            <Text style={styles.legendText}>
              Pressure
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: '#FF9500' },
              ]}
            />

            <Text style={styles.legendText}>
              Temp (°C)
            </Text>
          </View>

        </View>

        {/* Graph */}
        <View style={styles.graphContainer}>

          {historyLogs
            .slice(0, 5)
            .reverse()
            .map((item, i) => (

              <View
                key={i}
                style={styles.graphBarGroup}
              >

                <View style={styles.barWrapper}>

                  <View
                    style={[
                      styles.graphBar,
                      {
                        height: `${Math.min(
                          item.humidity,
                          100
                        )}%`,
                        backgroundColor:
                          '#0288D1',
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.graphBar,
                      {
                        height: `${Math.min(
                          (item.temperature / 45) *
                            100,
                          100
                        )}%`,
                        backgroundColor:
                          '#FF9500',
                      },
                    ]}
                  />

                </View>

                <Text style={styles.graphTimeText}>
                  {formatTime(item.time)}
                </Text>

              </View>

            ))}

        </View>

      </View>

      {/* ==========================================
          Recent Logs
      ========================================== */}
      <View style={styles.cardSection}>

        <View style={styles.logHeaderRow}>

          <Text style={styles.sectionTitle}>
            📋 ประวัติบันทึกเหตุการณ์ (Recent Logs)
          </Text>

          <TouchableOpacity
            style={styles.exportBadge}
          >
            <Text style={styles.exportBadgeText}>
              ย่อลง
            </Text>
          </TouchableOpacity>

        </View>

        {historyLogs.length === 0 ? (

          <Text style={styles.emptyText}>
            ยังไม่มีข้อมูลบันทึก
          </Text>

        ) : (

          historyLogs.map((item) => (

            <View
              key={item.id}
              style={styles.logItemCard}
            >

              {/* เส้นด้านซ้าย */}
              <View
                style={[
                  styles.sideIndicator,
                  {
                    backgroundColor:
                      item.isTempHigh ||
                      item.isHumidHigh
                        ? '#FF3B30'
                        : '#0288D1',
                  },
                ]}
              />

              <View style={styles.logContent}>

                {/* เวลา + Badge */}
                <View style={styles.logTopRow}>

                  <Text style={styles.logTimeText}>
                    {formatTime(item.time)} น.
                  </Text>

                  {item.isTempHigh && (
                    <Text
                      style={styles.criticalBadge}
                    >
                      🚨 วิกฤต
                    </Text>
                  )}

                  {!item.isTempHigh &&
                    item.calculatedPosition ===
                      'CENTER' && (
                      <Text
                        style={styles.warningBadge}
                      >
                        ⚠️ นั่งนานเกินไป
                      </Text>
                    )}

                </View>

                {/* Sensor Detail */}
                <View style={styles.logSubRow}>

                  <Text style={styles.logDetailText}>
                    แรงกด: ซ้าย{' '}

                    <Text
                      style={
                        item.leftPressed
                          ? styles.textRed
                          : styles.textGreen
                      }
                    >
                      {item.leftPressed
                        ? 'High'
                        : 'Low'}
                    </Text>

                    {' | '}ขวา{' '}

                    <Text
                      style={
                        item.rightPressed
                          ? styles.textRed
                          : styles.textGreen
                      }
                    >
                      {item.rightPressed
                        ? 'High'
                        : 'Low'}
                    </Text>
                  </Text>

                  <Text style={styles.logMetricText}>

                    อุณหภูมิ:{' '}

                    <Text
                      style={
                        item.isTempHigh
                          ? styles.textRed
                          : styles.textDark
                      }
                    >
                      {item.temperature} °C
                    </Text>

                    {'  '}

                    ชื้น:{' '}

                    <Text
                      style={
                        item.isHumidHigh
                          ? styles.textBlue
                          : styles.textDark
                      }
                    >
                      {item.humidity}%
                      {' '}
                      💧
                    </Text>

                  </Text>

                </View>

              </View>

            </View>

          ))

        )}

      </View>

    </ScrollView>
  );
}

// =====================================================
// Styles
// =====================================================

const styles = StyleSheet.create({

  container: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#F4F6F9',
    flexGrow: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
  },

  loadingText: {
    marginTop: 10,
    color: '#8E8E93',
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: '#3B5998',
  },

  subHeaderTitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
  },

  // Tab
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E0E5EC',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },

  activeTabButton: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },

  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },

  activeTabText: {
    color: '#3B5998',
  },

  // Summary Cards
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },

  summaryCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },

  cardIcon: {
    fontSize: 20,
    marginBottom: 4,
  },

  cardValueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },

  cardLabelText: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Section
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },

  // Balance
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  leftPercentText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF3B30',
  },

  rightPercentText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#34C759',
  },

  balanceBarContainer: {
    height: 14,
    flexDirection: 'row',
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
    marginBottom: 8,
  },

  leftBar: {
    backgroundColor: '#FF3B30',
  },

  rightBar: {
    backgroundColor: '#34C759',
  },

  evalText: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  legendText: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // Graph
  graphContainer: {
    height: 120,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },

  graphBarGroup: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },

  barWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: '80%',
  },

  graphBar: {
    width: 8,
    borderRadius: 4,
  },

  graphTimeText: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
  },

  // Recent Logs
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  exportBadge: {
    backgroundColor: '#3B5998',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  exportBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    paddingVertical: 12,
  },

  logItemCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },

  sideIndicator: {
    width: 4,
  },

  logContent: {
    flex: 1,
    padding: 10,
  },

  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  logTimeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },

  criticalBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FF3B30',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  warningBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FF9500',
    backgroundColor: '#FFF5E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  logSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },

  logDetailText: {
    fontSize: 11,
    color: '#8E8E93',
  },

  logMetricText: {
    fontSize: 11,
    color: '#8E8E93',
  },

  textRed: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },

  textGreen: {
    color: '#34C759',
    fontWeight: 'bold',
  },

  textBlue: {
    color: '#0288D1',
    fontWeight: 'bold',
  },

  textDark: {
    color: '#1C1C1E',
    fontWeight: 'bold',
  },

});