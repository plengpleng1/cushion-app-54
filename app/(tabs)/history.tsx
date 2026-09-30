import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { fetchSensorData, SensorData } from '../../services/sensorService';

type TabType = 'today' | 'week';
type MetricType = 'humidity' | 'pressure' | 'temperature';

interface HistoryLog extends SensorData {
  id: string;
  calculatedPosition: 'LEFT' | 'RIGHT' | 'CENTER' | 'NONE';
  isTempHigh: boolean;
  isHumidHigh: boolean;
  leftPressed: boolean;
  rightPressed: boolean;
  sittingSeconds: number;
  isSittingTooLong: boolean;
}

// =====================================================
// Format Time
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

const clamp = (value: number) => {
  return Math.min(Math.max(value, 0), 100);
};

// =====================================================
// Dynamic Trend Chart
// =====================================================
interface TrendChartProps {
  logs: HistoryLog[];
  selectedMetric: MetricType;
  containerWidth: number;
}

const TrendChart = ({ logs, selectedMetric, containerWidth }: TrendChartProps) => {
  const chartWidth = Math.max(containerWidth - 32, 280);
  const chartHeight = 220;

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  if (logs.length === 0) {
    return (
      <View style={styles.emptyGraphContainer}>
        <Text style={styles.emptyGraphText}>ยังไม่มีข้อมูลสำหรับแสดงกราฟ</Text>
      </View>
    );
  }

  const metricConfig = {
    humidity: {
      color: '#4A90E2',
      yMin: 0,
      yMax: 100,
      unit: '%',
      gridValues: [100, 75, 50, 25, 0],
      getValue: (item: HistoryLog) => clamp(Number(item.humidity) || 0),
    },
    pressure: {
      color: '#F15B4A',
      yMin: 0,
      yMax: 100,
      unit: '',
      gridValues: [100, 75, 50, 25, 0],
      getValue: (item: HistoryLog) => (item.leftPressed || item.rightPressed ? 80 : 20),
    },
    temperature: {
      color: '#FF9500',
      yMin: 20,
      yMax: 45,
      unit: '°C',
      gridValues: [45, 40, 35, 30, 25, 20],
      getValue: (item: HistoryLog) => Number(item.temperature) || 0,
    },
  };

  const currentConfig = metricConfig[selectedMetric];
  const rawValues = logs.map(currentConfig.getValue);

  const getX = (index: number) => {
    if (logs.length === 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (index / (logs.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const { yMin, yMax } = currentConfig;
    const clampedVal = Math.min(Math.max(val, yMin), yMax);
    const percentage = (clampedVal - yMin) / (yMax - yMin);
    return paddingTop + plotHeight - percentage * plotHeight;
  };

  const createPath = (values: number[]) => {
    if (values.length === 0) return '';
    return values.reduce((acc, val, index) => {
      const x = getX(index);
      const y = getY(val);
      return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const linePath = createPath(rawValues);

  return (
    <View style={styles.chartWrapper}>
      <Svg width={chartWidth} height={chartHeight}>
        {currentConfig.gridValues.map((val) => {
          const y = getY(val);
          return (
            <React.Fragment key={val}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 3}
                fontSize="10"
                fill="#8E8E93"
                textAnchor="end"
              >
                {`${val}${currentConfig.unit}`}
              </SvgText>
            </React.Fragment>
          );
        })}

        <Line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={paddingTop + plotHeight}
          stroke="#D1D1D6"
          strokeWidth={1}
        />
        <Line
          x1={paddingLeft}
          y1={paddingTop + plotHeight}
          x2={chartWidth - paddingRight}
          y2={paddingTop + plotHeight}
          stroke="#D1D1D6"
          strokeWidth={1}
        />

        <Path
          d={linePath}
          fill="none"
          stroke={currentConfig.color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {rawValues.map((val, index) => {
          const x = getX(index);
          const y = getY(val);
          return (
            <Circle
              key={`point-${index}`}
              cx={x}
              cy={y}
              r={5}
              fill={currentConfig.color}
            />
          );
        })}

        {logs.map((item, index) => {
          const x = getX(index);
          const time = formatTime(item.time);
          return (
            <SvgText
              key={`time-${index}`}
              x={x}
              y={chartHeight - 12}
              fontSize="9"
              fill="#8E8E93"
              textAnchor="middle"
            >
              {time.slice(0, 5)}
            </SvgText>
          );
        })}
      </Svg>
      <Text style={styles.xAxisTitle}>เวลา (น.)</Text>
    </View>
  );
};

// =====================================================
// History Screen
// =====================================================
export default function HistoryScreen() {
  const { width: windowWidth } = useWindowDimensions();

  // คำนวณ responsive container และ card width
  const maxContainerWidth = Math.min(windowWidth - 32, 480);
  const cardWidth = (maxContainerWidth - 12) / 2;

  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('humidity');
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const centerStartTimeRef = useRef<number | null>(null);

  const loadHistoryData = async () => {
    try {
      const data = await fetchSensorData();
      if (!data) return;

      const isLeftPressed = (data.sensor1 ?? 4095) < 500;
      const isRightPressed = (data.sensor2 ?? 4095) < 500;

      let calcPos: 'LEFT' | 'RIGHT' | 'CENTER' | 'NONE' = 'NONE';
      if (isLeftPressed && isRightPressed) {
        calcPos = 'CENTER';
      } else if (isLeftPressed) {
        calcPos = 'LEFT';
      } else if (isRightPressed) {
        calcPos = 'RIGHT';
      } else {
        calcPos = 'NONE';
      }

      const temperature = Number(data.temperature) || 0;
      const tempHigh = temperature > 38;

      const humidity = Number(data.humidity) || 0;
      const humidHigh = humidity > 75;

      let sittingSeconds = 0;
      if (calcPos === 'CENTER') {
        if (centerStartTimeRef.current === null) {
          centerStartTimeRef.current = Date.now();
        }
        sittingSeconds = Math.floor((Date.now() - centerStartTimeRef.current) / 1000);
      } else {
        centerStartTimeRef.current = null;
        sittingSeconds = 0;
      }

      const isSittingTooLong = calcPos === 'CENTER' && sittingSeconds >= 120;

      const newLog: HistoryLog = {
        ...data,
        id: `${data.date}_${data.time}_${Date.now()}`,
        calculatedPosition: calcPos,
        isTempHigh: tempHigh,
        isHumidHigh: humidHigh,
        leftPressed: isLeftPressed,
        rightPressed: isRightPressed,
        sittingSeconds,
        isSittingTooLong,
      };

      setHistoryLogs((prev) => {
        const alreadyExists = prev.some(
          (item) => item.time === data.time && item.date === data.date
        );
        if (alreadyExists) return prev;
        return [newLog, ...prev];
      });
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    centerStartTimeRef.current = null;
    loadHistoryData();
    const interval = setInterval(() => {
      loadHistoryData();
    }, 3000);

    return () => {
      clearInterval(interval);
      centerStartTimeRef.current = null;
    };
  }, []);

  const getDashboardStats = () => {
    const total = historyLogs.length || 1;
    let leftCount = 0;
    let rightCount = 0;
    let tempSum = 0;
    let alertCount = 0;
    let moveCount = 0;

    historyLogs.forEach((log, idx) => {
      if (log.leftPressed) leftCount++;
      if (log.rightPressed) rightCount++;
      tempSum += log.temperature || 0;
      if (log.isTempHigh || log.isHumidHigh || log.isSittingTooLong) {
        alertCount++;
      }
      if (idx > 0 && log.calculatedPosition !== historyLogs[idx - 1].calculatedPosition) {
        moveCount++;
      }
    });

    const totalPressureSide = leftCount + rightCount || 1;
    const leftPercent = Math.round((leftCount / totalPressureSide) * 100);
    const rightPercent = 100 - leftPercent;
    const avgTemp = (tempSum / total).toFixed(1);

    const totalMinutes = Math.floor((historyLogs.length * 3) / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const sittingTimeStr = hours > 0 ? `${hours} ชม. ${mins} นาที` : `${mins} นาที`;

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

  if (loading && historyLogs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4464D0" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล Dashboard...</Text>
      </View>
    );
  }

  const graphLogs = historyLogs.slice(0, 10).reverse();
  const displayedLogs = isExpanded ? historyLogs : historyLogs.slice(0, 3);

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.mainWrapper, { width: maxContainerWidth }]}>
        {/* Header */}
        <Text style={styles.headerTitle}>Clinical Dashboard</Text>
        <Text style={styles.subHeaderTitle}>รายงานวิเคราะห์พฤติกรรมทางการแพทย์</Text>

        {/* Tab */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'today' && styles.activeTabButton]}
            onPress={() => setActiveTab('today')}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
              วันนี้
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'week' && styles.activeTabButton]}
            onPress={() => setActiveTab('week')}
          >
            <Text style={[styles.tabText, activeTab === 'week' && styles.activeTabText]}>
              สัปดาห์นี้
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards - แสดง 2x2 ตลอดเวลา */}
        <View style={styles.gridContainer}>
          <View style={[styles.summaryCard, { width: cardWidth }]}>
            <Text style={styles.cardIcon}>⏱️</Text>
            <Text style={styles.cardValueText}>{stats.sittingTimeStr}</Text>
            <Text style={styles.cardLabelText}>เวลานั่งรวม</Text>
          </View>
          <View style={[styles.summaryCard, { width: cardWidth }]}>
            <Text style={styles.cardIcon}>🚶</Text>
            <Text style={styles.cardValueText}>{stats.moveCount} ครั้ง</Text>
            <Text style={styles.cardLabelText}>ขยับเปลี่ยนท่า</Text>
          </View>
          <View style={[styles.summaryCard, { width: cardWidth }]}>
            <Text style={styles.cardIcon}>🌡️</Text>
            <Text style={[styles.cardValueText, { color: '#FF9500' }]}>{stats.avgTemp} °C</Text>
            <Text style={styles.cardLabelText}>อุณหภูมิเฉลี่ย</Text>
          </View>
          <View style={[styles.summaryCard, { width: cardWidth }]}>
            <Text style={styles.cardIcon}>🚨</Text>
            <Text style={[styles.cardValueText, { color: '#FF3B30' }]}>{stats.alertCount} ครั้ง</Text>
            <Text style={styles.cardLabelText}>เตือนวิกฤต/ชื้น</Text>
          </View>
        </View>

        {/* Pressure Balance */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>⚖ สัดส่วนการพบแรงกดสูง</Text>
          <View style={styles.balanceHeader}>
            <Text style={styles.leftPercentText}>ซ้าย {stats.leftPercent}%</Text>
            <Text style={styles.rightPercentText}>ขวา {stats.rightPercent}%</Text>
          </View>
          <View style={styles.balanceBarContainer}>
            <View style={[styles.leftBar, { flex: stats.leftPercent || 1 }]} />
            <View style={[styles.rightBar, { flex: stats.rightPercent || 1 }]} />
          </View>
          <Text style={styles.evalText}>
            💡 ประเมิน:{' '}
            {Math.abs(stats.leftPercent - stats.rightPercent) < 20
              ? 'การลงน้ำหนักซ้าย-ขวาอยู่ในเกณฑ์สมดุล'
              : 'ตรวจพบการลงน้ำหนักเอียงไปฝั่งใดฝั่งหนึ่งมากเกินไป'}
          </Text>
        </View>

        {/* Daily Trend */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>📈 ภาพรวมวันนี้ (Daily Trend)</Text>
          <Text style={styles.graphSubTitle}>เลือกกดเลือกระบุตัวแปรที่ต้องการดูแนวโน้ม</Text>

          <View style={styles.metricToggleContainer}>
            <TouchableOpacity
              style={[
                styles.metricButton,
                selectedMetric === 'humidity' && styles.humidityActiveBtn,
              ]}
              onPress={() => setSelectedMetric('humidity')}
            >
              <Text
                style={[
                  styles.metricButtonText,
                  selectedMetric === 'humidity' && styles.activeMetricText,
                ]}
              >
                💧 ความชื้น
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.metricButton,
                selectedMetric === 'pressure' && styles.pressureActiveBtn,
              ]}
              onPress={() => setSelectedMetric('pressure')}
            >
              <Text
                style={[
                  styles.metricButtonText,
                  selectedMetric === 'pressure' && styles.activeMetricText,
                ]}
              >
                🎈 แรงกด
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.metricButton,
                selectedMetric === 'temperature' && styles.tempActiveBtn,
              ]}
              onPress={() => setSelectedMetric('temperature')}
            >
              <Text
                style={[
                  styles.metricButtonText,
                  selectedMetric === 'temperature' && styles.activeMetricText,
                ]}
              >
                🌡️ อุณหภูมิ
              </Text>
            </TouchableOpacity>
          </View>

          <TrendChart
            logs={graphLogs}
            selectedMetric={selectedMetric}
            containerWidth={maxContainerWidth}
          />

          <Text style={styles.graphDescription}>
            แสดงแนวโน้มจากข้อมูลล่าสุด {graphLogs.length} รายการ
          </Text>
        </View>

        {/* Recent Logs */}
        <View style={styles.cardSection}>
          <View style={styles.logHeaderRow}>
            <Text style={styles.sectionTitle}>📋 ประวัติบันทึกเหตุการณ์</Text>
            
              <TouchableOpacity                        //show the button 
                style={styles.exportBadge}
                onPress={() => setIsExpanded((prev) => !prev)}
              >
                <Text style={styles.exportBadgeText}>
                  {isExpanded ? 'ย่อลง' : 'ดูทั้งหมด'}
                  </Text>
              </TouchableOpacity>
          </View>

          {historyLogs.length === 0 ? (
            <Text style={styles.emptyText}>ยังไม่มีข้อมูลบันทึก</Text>
          ) : (
            // ปรับตรงนี้: ถ้าไม่ขยาย (isExpanded = false) จะตัดแสดงแค่ 3 รายการล่าสุด!
            (isExpanded ? historyLogs : historyLogs.slice(0, 3)).map((item) => (
              <View key={item.id} style={styles.logItemCard}>
                <View
                  style={[
                    styles.sideIndicator,
                    {
                      backgroundColor: item.isTempHigh
                        ? '#FF3B30'
                        : item.isSittingTooLong
                        ? '#FF9500'
                        : item.isHumidHigh
                        ? '#0288D1'
                        : '#34C759',
                    },
                  ]}
                />
                <View style={styles.logContent}>
                  <View style={styles.logTopRow}>
                    <Text style={styles.logTimeText}>{formatTime(item.time)} น.</Text>
                    {item.isTempHigh && <Text style={styles.criticalBadge}>🚨 วิกฤต</Text>}
                    {!item.isTempHigh && item.isSittingTooLong && (
                      <Text style={styles.warningBadge}>⚠️ นั่งนานเกินไป</Text>
                    )}
                  </View>

                  <View style={styles.logSubRow}>
                    <Text style={styles.logDetailText}>
                      แรงกด: ซ้าย{' '}
                      <Text style={item.leftPressed ? styles.textRed : styles.textGreen}>
                        {item.leftPressed ? 'High' : 'Low'}
                      </Text>
                      {' | '}ขวา{' '}
                      <Text style={item.rightPressed ? styles.textRed : styles.textGreen}>
                        {item.rightPressed ? 'High' : 'Low'}
                      </Text>
                    </Text>
                    <Text style={styles.logMetricText}>
                      อุณหภูมิ:{' '}
                      <Text style={item.isTempHigh ? styles.textRed : styles.textDark}>
                        {item.temperature} °C
                      </Text>
                      {'  '}
                      ชื้น:{' '}
                      <Text style={item.isHumidHigh ? styles.textBlue : styles.textDark}>
                        {item.humidity}% 💧
                      </Text>
                    </Text>
                  </View>

                  {item.calculatedPosition === 'CENTER' && (
                    <Text style={styles.sittingTimerText}>
                      🪑 นั่งตรงกลางต่อเนื่อง: {item.sittingSeconds} วินาที
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F4F6F9',
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
    color: '#4464D0',
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
    color: '#1C1C1E',
  },

  // Summary Cards
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  cardValueText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  cardLabelText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },

  // Pressure Balance
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
  },
  leftPercentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  rightPercentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
  },
  balanceBarContainer: {
    height: 12,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
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
    marginTop: 8,
  },

  // Metric Toggle Buttons
  graphSubTitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    marginBottom: 12,
  },
  metricToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
    gap: 4,
  },
  metricButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  metricButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeMetricText: {
    color: '#FFFFFF',
  },
  humidityActiveBtn: {
    backgroundColor: '#4A90E2',
  },
  pressureActiveBtn: {
    backgroundColor: '#F15B4A',
  },
  tempActiveBtn: {
    backgroundColor: '#FF9500',
  },

  // Chart Wrapper
  chartWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
  xAxisTitle: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: -8,
  },
  graphDescription: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyGraphContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGraphText: {
    color: '#8E8E93',
    fontSize: 12,
  },

  // Logs Section
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exportBadge: {
    backgroundColor: '#4464D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exportBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 10,
  },
  logItemCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sideIndicator: {
    width: 5,
  },
  logContent: {
    flex: 1,
    padding: 10,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  criticalBadge: {
    fontSize: 11,
    color: '#FF3B30',
    fontWeight: '600',
  },
  warningBadge: {
    fontSize: 11,
    color: '#FF9500',
    fontWeight: '600',
  },
  logSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  logDetailText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  logMetricText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  sittingTimerText: {
    fontSize: 11,
    color: '#4464D0',
    marginTop: 4,
    fontWeight: '500',
  },
  textRed: { color: '#FF3B30', fontWeight: '600' },
  textGreen: { color: '#34C759', fontWeight: '600' },
  textBlue: { color: '#0288D1', fontWeight: '600' },
  textDark: { color: '#1C1C1E', fontWeight: '600' },
});