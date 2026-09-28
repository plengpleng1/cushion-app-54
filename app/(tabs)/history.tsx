import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
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

  // เพิ่มตัวนี้
  isPositionChanged: boolean;
}

const screenWidth = Dimensions.get('window').width;

// =====================================================
// ฟังก์ชันจัดรูปแบบเวลา
// =====================================================
const formatTime = (time?: string) => {
  if (!time) return '-';

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

  return time;
};

// =====================================================
// จำกัดค่าให้อยู่ระหว่าง 0 - 100
// =====================================================
const clamp = (value: number) => {
  return Math.min(Math.max(value, 0), 100);
};

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);

  // ==========================================
  // ดึงข้อมูล
  // ==========================================
  const loadHistoryData = async () => {
    try {
      const data = await fetchSensorData();

      if (data) {
        // คำนวณแรงกดซ้าย / ขวา
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

        // อุณหภูมิสูง
        const tempHigh = (data.temperature || 0) > 38;

        // ความชื้นสูง
        const humidHigh = (data.humidity || 0) > 75;

        const newLog: HistoryLog = {
          ...data,

          id: `${data.date}_${data.time}_${Math.random()}`,

          calculatedPosition: calcPos,

          isTempHigh: tempHigh,

          isHumidHigh: humidHigh,

          leftPressed: isLeftPressed,

          rightPressed: isRightPressed,

        // เช็คว่าตำแหน่งเปลี่ยนจากครั้งก่อนหรือไม่
        isPositionChanged:
        historyLogs.length > 0 &&
        historyLogs[0].calculatedPosition !== calcPos,
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
  // Dashboard Stats
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
  // เตรียมข้อมูลกราฟ
  // เอา 10 รายการล่าสุด แล้วเรียงจากเก่า -> ใหม่
  // ==========================================
  const graphLogs = historyLogs
    .slice(0, 10)
    .reverse();

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
          Tab
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

        <View style={styles.summaryCard}>
          <Text style={styles.cardIcon}>⏱️</Text>

          <Text style={styles.cardValueText}>
            {stats.sittingTimeStr}
          </Text>

          <Text style={styles.cardLabelText}>
            เวลานั่งรวม
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.cardIcon}>🚶</Text>

          <Text style={styles.cardValueText}>
            {stats.moveCount} ครั้ง
          </Text>

          <Text style={styles.cardLabelText}>
            ขยับเปลี่ยนท่า
          </Text>
        </View>

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
          ⚖️ สัดส่วนการพบแรงกดสูง
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
          Daily Trend Graph
      ========================================== */}
      <View style={styles.cardSection}>

        <Text style={styles.sectionTitle}>
          📈 แนวโน้มข้อมูลตลอดเวลา
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
              ความชื้น
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: '#FF3B30' },
              ]}
            />

            <Text style={styles.legendText}>
              แรงกด
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
              อุณหภูมิ
            </Text>
          </View>

        </View>

        {/* Graph */}
        {graphLogs.length === 0 ? (

          <Text style={styles.emptyGraphText}>
            ยังไม่มีข้อมูลสำหรับแสดงกราฟ
          </Text>

        ) : (

          <View style={styles.trendGraph}>

            {/* Y Axis */}
            <View style={styles.yAxis}>

              <Text style={styles.axisText}>
                100
              </Text>

              <Text style={styles.axisText}>
                75
              </Text>

              <Text style={styles.axisText}>
                50
              </Text>

              <Text style={styles.axisText}>
                25
              </Text>

              <Text style={styles.axisText}>
                0
              </Text>

            </View>

            {/* Graph Area */}
            <View style={styles.graphArea}>

              {/* Grid */}
              <View
                style={[
                  styles.gridLine,
                  { top: '0%' },
                ]}
              />

              <View
                style={[
                  styles.gridLine,
                  { top: '25%' },
                ]}
              />

              <View
                style={[
                  styles.gridLine,
                  { top: '50%' },
                ]}
              />

              <View
                style={[
                  styles.gridLine,
                  { top: '75%' },
                ]}
              />

              <View
                style={[
                  styles.gridLine,
                  { top: '100%' },
                ]}
              />

              {/* เส้นแนวโน้ม */}
              <View style={styles.dataRow}>

                {graphLogs.map(
                  (item, index) => {

                    const humidity =
                      clamp(
                        Number(
                          item.humidity
                        ) || 0
                      );

                    const pressure =
                      item.leftPressed ||
                      item.rightPressed
                        ? 80
                        : 20;

                    const temperature =
                      clamp(
                        ((Number(
                          item.temperature
                        ) || 0) /
                          45) *
                          100
                      );

                    return (
                      <View
                        key={item.id}
                        style={styles.dataColumn}
                      >

                        {/* เส้นก่อนหน้า */}
                        {index > 0 && (
                          <>
                            {/* Humidity line */}
                            <View
                              style={[
                                styles.connectLine,
                                {
                                  backgroundColor:
                                    '#0288D1',
                                  bottom:
                                    `${Math.min(
                                      humidity,
                                      100
                                    )}%`,
                                },
                              ]}
                            />

                            {/* Pressure line */}
                            <View
                              style={[
                                styles.connectLine,
                                {
                                  backgroundColor:
                                    '#FF3B30',
                                  bottom:
                                    `${Math.min(
                                      pressure,
                                      100
                                    )}%`,
                                },
                              ]}
                            />

                            {/* Temperature line */}
                            <View
                              style={[
                                styles.connectLine,
                                {
                                  backgroundColor:
                                    '#FF9500',
                                  bottom:
                                    `${Math.min(
                                      temperature,
                                      100
                                    )}%`,
                                },
                              ]}
                            />
                          </>
                        )}

                        {/* Humidity Point */}
                        <View
                          style={[
                            styles.dataPoint,
                            {
                              bottom:
                                `${humidity}%`,
                              backgroundColor:
                                '#0288D1',
                            },
                          ]}
                        />

                        {/* Pressure Point */}
                        <View
                          style={[
                            styles.dataPoint,
                            {
                              bottom:
                                `${pressure}%`,
                              backgroundColor:
                                '#FF3B30',
                            },
                          ]}
                        />

                        {/* Temperature Point */}
                        <View
                          style={[
                            styles.dataPoint,
                            {
                              bottom:
                                `${temperature}%`,
                              backgroundColor:
                                '#FF9500',
                            },
                          ]}
                        />

                        {/* เวลา */}
                        <Text
                          style={
                            styles.xAxisText
                          }
                        >
                          {formatTime(
                            item.time
                          ).slice(0, 5)}
                        </Text>

                      </View>
                    );
                  }
                )}

              </View>

            </View>

          </View>

        )}

        <Text style={styles.xAxisTitle}>
          เวลา
        </Text>

        <Text style={styles.graphDescription}>
          แสดงแนวโน้มจากข้อมูลล่าสุด
        </Text>

      </View>

      {/* ==========================================
          Recent Logs
      ========================================== */}
      <View style={styles.cardSection}>

        <View style={styles.logHeaderRow}>

          <Text style={styles.sectionTitle}>
            📋 ประวัติบันทึกเหตุการณ์
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
                      {item.humidity}% 💧
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

  // ==========================================
  // Tab
  // ==========================================

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

  // ==========================================
  // Summary
  // ==========================================

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

  // ==========================================
  // Section
  // ==========================================

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

  // ==========================================
  // Balance
  // ==========================================

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

  // ==========================================
  // Legend
  // ==========================================

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 8,
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
    fontSize: 10,
    color: '#8E8E93',
  },

  // ==========================================
  // Trend Graph
  // ==========================================

  trendGraph: {
    flexDirection: 'row',
    height: 230,
    marginTop: 8,
  },

  yAxis: {
    width: 35,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 28,
  },

  axisText: {
    fontSize: 9,
    color: '#8E8E93',
  },

  graphArea: {
    flex: 1,
    height: 195,
    marginLeft: 8,
    position: 'relative',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D1D1D6',
  },

  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },

  dataRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  dataColumn: {
    flex: 1,
    height: '100%',
    position: 'relative',
    alignItems: 'center',
  },

  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 3,
  },

  connectLine: {
    position: 'absolute',
    width: 2,
    height: 12,
    opacity: 0.45,
    zIndex: 1,
  },

  xAxisText: {
    position: 'absolute',
    bottom: -25,
    fontSize: 8,
    color: '#8E8E93',
    width: 45,
    textAlign: 'center',
  },

  xAxisTitle: {
    textAlign: 'center',
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 0,
    fontWeight: '600',
  },

  graphDescription: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 6,
  },

  emptyGraphText: {
    textAlign: 'center',
    color: '#8E8E93',
    paddingVertical: 50,
    fontSize: 12,
  },

  // ==========================================
  // Recent Logs
  // ==========================================

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