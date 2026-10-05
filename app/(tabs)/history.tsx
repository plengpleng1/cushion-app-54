import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import Svg, {
    Circle,
    Line,
    Path,
    Text as SvgText,
} from 'react-native-svg';

import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import {
    HistoryLog,
    loadHistoryFromSupabase,
} from '../../services/historyService';

type TabType = 'today' | 'week';
type MetricType =
  | 'humidity'
  | 'pressure'
  | 'temperature';

// =====================================================
// Format Time
// =====================================================
const formatTime = (time?: string) => {
  if (!time) return '-';

  if (time.includes('T')) {
    const date = new Date(time);

    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('th-TH', {
        timeZone: 'Asia/Bangkok',
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
// Clamp
// =====================================================
const clamp = (value: number) => {
  return Math.min(Math.max(value, 0), 100);
};

// =====================================================
// Dynamic Trend Chart
// =====================================================
interface GraphLog extends HistoryLog {
  graphLabel?: string;
  graphPressure?: number;
}

interface TrendChartProps {
  logs: GraphLog[];
  selectedMetric: MetricType;
  containerWidth: number;
}

const TrendChart = ({
  logs,
  selectedMetric,
  containerWidth,
}: TrendChartProps) => {
  const chartWidth = Math.max(
    containerWidth - 32,
    280
  );

  const chartHeight = 240;

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 60;

  const plotWidth =
    chartWidth -
    paddingLeft -
    paddingRight;

  const plotHeight =
    chartHeight -
    paddingTop -
    paddingBottom;

  if (logs.length === 0) {
    return (
      <View style={styles.emptyGraphContainer}>
        <Text style={styles.emptyGraphText}>
          ยังไม่มีข้อมูลสำหรับแสดงกราฟ
        </Text>
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
      getValue: (item: HistoryLog) =>
        clamp(Number(item.humidity) || 0),
    },

    pressure: {
      color: '#F15B4A',
      yMin: 0,
      yMax: 100,
      unit: '',
      gridValues: [100, 75, 50, 25, 0],
      getValue: (item: GraphLog) =>
        item.graphPressure ??
        (item.leftPressed ||
        item.rightPressed
          ? 80
          : 20),
    },

    temperature: {
      color: '#FF9500',
      yMin: 20,
      yMax: 45,
      unit: '°C',
      gridValues: [
        45,
        40,
        35,
        30,
        25,
        20,
      ],
      getValue: (item: HistoryLog) =>
        Number(item.temperature) || 0,
    },
  };

  const currentConfig =
    metricConfig[selectedMetric];

  const rawValues = logs.map(
    currentConfig.getValue
  );

  const getX = (index: number) => {
    if (logs.length === 1) {
      return (
        paddingLeft +
        plotWidth / 2
      );
    }

    return (
      paddingLeft +
      (index / (logs.length - 1)) *
        plotWidth
    );
  };

  const getY = (val: number) => {
    const {
      yMin,
      yMax,
    } = currentConfig;

    const clampedVal = Math.min(
      Math.max(val, yMin),
      yMax
    );

    const percentage =
      (clampedVal - yMin) /
      (yMax - yMin);

    return (
      paddingTop +
      plotHeight -
      percentage * plotHeight
    );
  };

  const createPath = (
    values: number[]
  ) => {
    if (values.length === 0) {
      return '';
    }

    return values.reduce(
      (acc, val, index) => {
        const x = getX(index);
        const y = getY(val);

        return index === 0
          ? `M ${x} ${y}`
          : `${acc} L ${x} ${y}`;
      },
      ''
    );
  };

  const linePath =
    createPath(rawValues);

  return (
    <View
      style={styles.chartWrapper}
    >
      <Svg
        width={chartWidth}
        height={chartHeight}
      >
        {currentConfig.gridValues.map(
          (val) => {
            const y = getY(val);

            return (
              <React.Fragment
                key={val}
              >
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={
                    chartWidth -
                    paddingRight
                  }
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />

                <SvgText
                  x={
                    paddingLeft - 8
                  }
                  y={y + 3}
                  fontSize="10"
                  fill="#8E8E93"
                  textAnchor="end"
                >
                  {`${val}${currentConfig.unit}`}
                </SvgText>
              </React.Fragment>
            );
          }
        )}

        <Line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={
            paddingTop +
            plotHeight
          }
          stroke="#D1D1D6"
          strokeWidth={1}
        />

        <Line
          x1={paddingLeft}
          y1={
            paddingTop +
            plotHeight
          }
          x2={
            chartWidth -
            paddingRight
          }
          y2={
            paddingTop +
            plotHeight
          }
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

        {rawValues.map(
          (val, index) => {
            const x = getX(index);
            const y = getY(val);

            return (
              <Circle
                key={`point-${index}`}
                cx={x}
                cy={y}
                r={5}
                fill={
                  currentConfig.color
                }
              />
            );
          }
        )}

        {logs.map(
          (item, index) => {
            const x = getX(index);

            const label =
              item.graphLabel ??
              formatTime(item.time).slice(0, 5);

            const shouldShowLabel = 
              index === 0 || 
              index === logs.length - 1 || 
              index % 6 === 0;

            if (!shouldShowLabel) return null;

            return (
              <React.Fragment key={`time-${index}`}>
                <Line
                  x1={x}
                  y1={paddingTop + plotHeight}
                  x2={x}
                  y2={paddingTop + plotHeight + 4}
                  stroke="#8E8E93"
                  strokeWidth={1}
                />
                
                <SvgText
                  x={x}
                  y={chartHeight - 32}
                  fontSize="9"
                  fill="#8E8E93"
                  textAnchor="middle"
                  transform={`rotate(45 ${x} ${chartHeight - 32})`}
                >
                  {label}
                </SvgText>
              </React.Fragment>
            );
          }
        )}
      </Svg>

      <Text
        style={styles.xAxisTitle}
      >
        เวลา (น.)
      </Text>
    </View>
  );
};

// =====================================================
// จัดข้อมูลสำหรับกราฟ "วันนี้"
// =====================================================
const getLogDateKeyForGraph = (
  dateString: string
) => {
  if (!dateString) {
    return '';
  }

  if (dateString.includes('/')) {
    const [
      day,
      month,
      year,
    ] = dateString.split('/');

    return `${year}-${month}-${day}`;
  }

  return dateString.split('T')[0];
};

const getTodayGraphLogs = (
  logs: HistoryLog[]
): GraphLog[] => {
  if (logs.length === 0) {
    return [];
  }

  const result: HistoryLog[] = [];
  let lastTime = 0;

  const sortedLogs = [...logs].reverse();

  sortedLogs.forEach((log) => {
    const [day, month, year] =
      log.date.split('/');

    const logTime = new Date(
      `${year}-${month}-${day}T${log.time}+07:00`
    ).getTime();

    if (
      lastTime === 0 ||
      logTime - lastTime >= 5 * 60 * 1000
    ) {
      result.push(log);
      lastTime = logTime;
    }
  });

  return result;
};

// =====================================================
// จัดข้อมูลสำหรับกราฟ "สัปดาห์นี้"
// =====================================================
const getWeeklyGraphLogs = (
  logs: HistoryLog[]
): GraphLog[] => {
  if (logs.length === 0) {
    return [];
  }

  const grouped: {
    [key: string]: HistoryLog[];
  } = {};

  logs.forEach((log) => {
    const dateKey =
      getLogDateKeyForGraph(log.date);

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }

    grouped[dateKey].push(log);
  });

  return Object.entries(grouped)
    .sort(
      ([dateA], [dateB]) =>
        new Date(dateA).getTime() -
        new Date(dateB).getTime()
    )
    .map(([date, dayLogs]) => {
      const avgTemperature =
        dayLogs.reduce(
          (sum, log) =>
            sum +
            (Number(log.temperature) || 0),
          0
        ) / dayLogs.length;

      const avgHumidity =
        dayLogs.reduce(
          (sum, log) =>
            sum +
            (Number(log.humidity) || 0),
          0
        ) / dayLogs.length;

      const pressureValues =
        dayLogs.map((log) =>
          log.leftPressed ||
          log.rightPressed
            ? 80
            : 20
        );

      const avgPressure =
        pressureValues.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / pressureValues.length;

      const [
        year,
        month,
        day,
      ] = date.split('-');

      const graphLabel =
        `${day}/${month}`;

      return {
        ...dayLogs[dayLogs.length - 1],
        date,
        temperature: Number(
          avgTemperature.toFixed(1)
        ),
        humidity: Number(
          avgHumidity.toFixed(1)
        ),
        graphPressure: Number(
          avgPressure.toFixed(1)
        ),
        graphLabel,
      };
    });
};

// =====================================================
// History Screen
// =====================================================
export default function HistoryScreen() {
  const {
    width: windowWidth,
  } = useWindowDimensions();

  const maxContainerWidth =
    Math.min(
      windowWidth - 32,
      480
    );

  const cardWidth =
    (maxContainerWidth - 12) /
    2;

  const [
    activeTab,
    setActiveTab,
  ] = useState<TabType>('today');

  const [
    clearedAt,
    setClearedAt,
  ] = useState<{
    today: number | null;
    week: number | null;
  }>({
    today: null,
    week: null,
  });

  const [
    selectedMetric,
    setSelectedMetric,
  ] =
    useState<MetricType>(
      'humidity'
    );

  const [
    loading,
    setLoading,
  ] = useState<boolean>(true);

  const [
    historyLogs,
    setHistoryLogs,
  ] = useState<HistoryLog[]>(
    []
  );

  const [
    isExpanded,
    setIsExpanded,
  ] = useState<boolean>(false);

  // State ควบคุม Modal View All
  const [
    isModalVisible,
    setIsModalVisible,
  ] = useState<boolean>(false);

  // =====================================================
  // วันที่ปัจจุบัน
  // =====================================================
  const [
    currentDate,
    setCurrentDate,
  ] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  });

  // =====================================================
  // Patient ID ปัจจุบัน
  // =====================================================
  const patientIdRef =
    useRef<string | null>(null);

  const handleClearHistory = () => {
    const now = Date.now();
    setClearedAt((prev) => ({
      ...prev,
      [activeTab]: now,
    }));
    setIsExpanded(false);
  };

  // =====================================================
  // จัดรูปแบบวันที่สำหรับเปรียบเทียบ
  // =====================================================
  const getLogDateKey = (
    dateString: string
  ) => {
    if (!dateString) {
      return '';
    }

    if (dateString.includes('/')) {
      const parts =
        dateString.split('/');

      if (parts.length === 3) {
        const [
          day,
          month,
          year,
        ] = parts;

        return `${Number(year)}-${Number(month)}-${Number(day)}`;
      }
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return '';
    }

    const thailandDate =
      new Intl.DateTimeFormat(
        'en-CA',
        {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }
      ).formatToParts(date);

    const year =
      thailandDate.find(
        (part) => part.type === 'year'
      )?.value;

    const month =
      thailandDate.find(
        (part) => part.type === 'month'
      )?.value;

    const day =
      thailandDate.find(
        (part) => part.type === 'day'
      )?.value;

    return `${year}-${Number(month)}-${Number(day)}`;
  };

  const isToday = (
    dateString: string
  ) => {
    return (
      getLogDateKey(dateString) === currentDate
    );
  };

  useEffect(() => {
    const checkDate = () => {
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

      setCurrentDate(
        (prevDate) => {
          if (prevDate !== todayKey) {
            return todayKey;
          }
          return prevDate;
        }
      );
    };

    checkDate();
    const interval = setInterval(checkDate, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = historyLogs.filter((log) => {
    if (
      activeTab === 'today' &&
      !isToday(log.date)
    ) {
      return false;
    }
    return true;
  });

  const eventLogs = filteredLogs.filter((log) => {
    const clearTime = clearedAt[activeTab];

    if (!clearTime) {
      return true;
    }

    const [day, month, year] =
      log.date.split('/');

    const logDateTime = new Date(
      `${year}-${month}-${day}T${log.time}+07:00`
    ).getTime();

    return logDateTime > clearTime;
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const startHistory = async () => {
        try {
          setLoading(true);

          const selectedPatientId =
            await AsyncStorage.getItem('selectedPatientId');

          if (!isActive) return;

          if (!selectedPatientId) {
            patientIdRef.current = null;
            setHistoryLogs([]);
            setLoading(false);
            return;
          }

          patientIdRef.current = selectedPatientId;

          const savedLogs =
            await loadHistoryFromSupabase(
              selectedPatientId
            );

          if (!isActive) return;

          setHistoryLogs(savedLogs);
          setLoading(false);

        } catch (error) {
          console.error(
            'ไม่สามารถเริ่ม History ได้:',
            error
          );
          setLoading(false);
        }
      };

      startHistory();

      return () => {
        isActive = false;
      };
    }, [])
  );

  useEffect(() => {
    const refreshHistory = async () => {
      const patientId = patientIdRef.current;
      if (!patientId) return;

      try {
        const savedLogs =
          await loadHistoryFromSupabase(
            patientId
          );
        setHistoryLogs(savedLogs);
      } catch (error) {
        console.error(
          'ไม่สามารถ Refresh History ได้:',
          error
        );
      }
    };

    const interval = setInterval(refreshHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const getDashboardStats = () => {
    const total = filteredLogs.length || 1;
    let leftCount = 0;
    let rightCount = 0;
    let tempSum = 0;
    let alertCount = 0;
    let moveCount = 0;

    filteredLogs.forEach((log, idx) => {
      if (log.leftPressed) leftCount++;
      if (log.rightPressed) rightCount++;
      tempSum += log.temperature || 0;

      if (
        log.isTempHigh ||
        log.isHumidHigh ||
        log.isSittingTooLong
      ) {
        alertCount++;
      }

      if (
        idx > 0 &&
        log.calculatedPosition !==
          filteredLogs[idx - 1].calculatedPosition
      ) {
        moveCount++;
      }
    });

    const totalPressureSide =
      leftCount + rightCount || 1;

    const leftPercent = Math.round(
      (leftCount / totalPressureSide) * 100
    );
    const rightPercent = 100 - leftPercent;

    const avgTemp = (
      tempSum / total
    ).toFixed(1);

    const totalMinutes = Math.floor(
      (filteredLogs.length * 3) / 60
    );
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const sittingTimeStr =
      hours > 0
        ? `${hours} ชม. ${mins} นาที`
        : `${mins} นาที`;

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

  if (
    loading &&
    historyLogs.length === 0
  ) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2D69CA"
        />
        <Text style={styles.loadingText}>
          กำลังโหลดข้อมูล Dashboard...
        </Text>
      </View>
    );
  }

  const graphLogs =
    activeTab === 'today'
      ? getTodayGraphLogs(filteredLogs)
      : getWeeklyGraphLogs(filteredLogs);

  // บนหน้าจอหลักแสดงแค่ 3 รายการล่าสุด
  const displayedLogs = eventLogs.slice(0, 3);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
    >
      <View
        style={[
          styles.mainWrapper,
          { width: maxContainerWidth },
        ]}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>
          Clinical Dashboard
        </Text>

        <Text style={styles.subHeaderTitle}>
          รายงานวิเคราะห์พฤติกรรมทางการแพทย์
        </Text>

        {/* Tab */}
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

        {/* Summary Cards */}
        <View style={styles.gridContainer}>
          <View
            style={[
              styles.summaryCard,
              { width: cardWidth },
            ]}
          >
            <Text style={styles.cardIcon}>⏱️</Text>
            <Text style={styles.cardValueText}>
              {stats.sittingTimeStr}
            </Text>
            <Text style={styles.cardLabelText}>
              เวลานั่งรวม
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { width: cardWidth },
            ]}
          >
            <Text style={styles.cardIcon}>🚶</Text>
            <Text style={styles.cardValueText}>
              {stats.moveCount} ครั้ง
            </Text>
            <Text style={styles.cardLabelText}>
              ขยับเปลี่ยนท่า
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { width: cardWidth },
            ]}
          >
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

          <View
            style={[
              styles.summaryCard,
              { width: cardWidth },
            ]}
          >
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

        {/* Pressure Balance */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>
            ⚖ สัดส่วนการพบแรงกดสูง
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
                { flex: stats.leftPercent || 1 },
              ]}
            />
            <View
              style={[
                styles.rightBar,
                { flex: stats.rightPercent || 1 },
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

        {/* Daily Trend */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>
            📈{' '}
            {activeTab === 'today'
              ? 'ภาพรวมวันนี้ (Daily Trend)'
              : 'ภาพรวมสัปดาห์นี้ (Weekly Trend)'}
          </Text>

          <Text style={styles.graphSubTitle}>
            เลือกกดเลือกระบุตัวแปรที่ต้องการดูแนวโน้ม
          </Text>

          <View style={styles.metricToggleContainer}>
            <TouchableOpacity
              style={[
                styles.metricButton,
                selectedMetric === 'humidity' &&
                  styles.humidityActiveBtn,
              ]}
              onPress={() =>
                setSelectedMetric('humidity')
              }
            >
              <Text
                style={[
                  styles.metricButtonText,
                  selectedMetric === 'humidity' &&
                    styles.activeMetricText,
                ]}
              >
                💧 ความชื้น
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.metricButton,
                selectedMetric === 'pressure' &&
                  styles.pressureActiveBtn,
              ]}
              onPress={() =>
                setSelectedMetric('pressure')
              }
            >
              <Text
                style={[
                  styles.metricButtonText,
                  selectedMetric === 'pressure' &&
                    styles.activeMetricText,
                ]}
              >
                🎈 แรงกด
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.metricButton,
                selectedMetric === 'temperature' &&
                  styles.tempActiveBtn,
              ]}
              onPress={() =>
                setSelectedMetric('temperature')
              }
            >
              <Text
                style={[
                  styles.metricButtonText,
                  selectedMetric === 'temperature' &&
                    styles.activeMetricText,
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
            {activeTab === 'today'
              ? `แสดงแนวโน้มจากข้อมูลทุกประมาณ 5 นาที จำนวน ${graphLogs.length} จุด`
              : `แสดงค่าเฉลี่ยของแต่ละวัน จำนวน ${graphLogs.length} วัน`}
          </Text>
        </View>

        {/* Recent Logs */}
        <View style={styles.cardSection}>
          <View style={styles.logHeaderRow}>
            <Text style={styles.sectionTitle}>
              📋 ประวัติบันทึกเหตุการณ์
            </Text>

            <View style={styles.logHeaderButtons}>
              {/* ปุ่มล้างประวัติ */}
              <TouchableOpacity
                style={styles.clearHistoryBadge}
                onPress={handleClearHistory}
              >
                <View
                  style={
                    styles.clearHistoryBadgeContent
                  }
                >
                  <FontAwesome5
                    name="trash"
                    size={16}
                    color="#9c1717"
                  />
                </View>
              </TouchableOpacity>

              {/* ปุ่มดูทั้งหมด (เปิด Modal) */}
              <TouchableOpacity
                style={styles.exportBadge}
                onPress={() =>
                  setIsModalVisible(true)
                }
              >
                <Text style={styles.exportBadgeText}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {displayedLogs.length === 0 ? (
            <Text style={styles.emptyText}>
              ยังไม่มีข้อมูลบันทึก
            </Text>
          ) : (
            displayedLogs.map((item) => (
              <View
                key={item.id}
                style={styles.logItemCard}
              >
                <View
                  style={[
                    styles.sideIndicator,
                    {
                      backgroundColor:
                        item.isTempHigh
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
                    <Text style={styles.logTimeText}>
                      {formatTime(item.time)} น.
                    </Text>

                    {item.isTempHigh && (
                      <Text style={styles.criticalBadge}>
                        🚨 วิกฤต
                      </Text>
                    )}

                    {!item.isTempHigh &&
                      item.isSittingTooLong && (
                        <Text style={styles.warningBadge}>
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
                  </View>

                  <View style={styles.logSubRow}>
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

                      {'  '}ชื้น:{' '}

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

                  {item.calculatedPosition ===
                    'CENTER' && (
                    <Text
                      style={styles.sittingTimerText}
                    >
                      🪑 นั่งตรงกลางต่อเนื่อง:{' '}
                      {item.sittingSeconds} วินาที
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* ===================================================== */}
        {/* Modal แสดงประวัติเหตุการณ์ทั้งหมด (View All) */}
        {/* ===================================================== */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() =>
            setIsModalVisible(false)
          }
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { width: maxContainerWidth },
              ]}
            >
              {/* Header ของ Modal */}
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitleText}>
                  📋 ประวัติเหตุการณ์ทั้งหมด ({eventLogs.length} รายการ)
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() =>
                    setIsModalVisible(false)
                  }
                >
                  <Text style={styles.modalCloseButtonText}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {/* รายการทั้งหมดแบบ Scroll ได้ */}
              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={true}
              >
                {eventLogs.length === 0 ? (
                  <Text style={styles.emptyText}>
                    ยังไม่มีข้อมูลบันทึก
                  </Text>
                ) : (
                  eventLogs.map((item) => (
                    <View
                      key={`modal-${item.id}`}
                      style={styles.logItemCard}
                    >
                      <View
                        style={[
                          styles.sideIndicator,
                          {
                            backgroundColor:
                              item.isTempHigh
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
                          <Text style={styles.logTimeText}>
                            {formatTime(item.time)} น.
                          </Text>

                          {item.isTempHigh && (
                            <Text
                              style={
                                styles.criticalBadge
                              }
                            >
                              🚨 วิกฤต
                            </Text>
                          )}

                          {!item.isTempHigh &&
                            item.isSittingTooLong && (
                              <Text
                                style={
                                  styles.warningBadge
                                }
                              >
                                ⚠️ นั่งนานเกินไป
                              </Text>
                            )}
                        </View>

                        <View style={styles.logSubRow}>
                          <Text
                            style={
                              styles.logDetailText
                            }
                          >
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
                        </View>

                        <View style={styles.logSubRow}>
                          <Text
                            style={
                              styles.logMetricText
                            }
                          >
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

                            {'  '}ชื้น:{' '}

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

                        {item.calculatedPosition ===
                          'CENTER' && (
                          <Text
                            style={
                              styles.sittingTimerText
                            }
                          >
                            🪑 นั่งตรงกลางต่อเนื่อง:{' '}
                            {item.sittingSeconds}{' '}
                            วินาที
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

// =====================================================
// Styles
// =====================================================
const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 130,
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
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#2D69CA',
  },

  subHeaderTitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 2,
  },

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
    color: '#2D69CA',
  },

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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    backgroundColor: '#2D69CA',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  pressureActiveBtn: {
    backgroundColor: '#F15B4A',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  tempActiveBtn: {
    backgroundColor: '#FF9500',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

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

  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },

  warningBadge: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },

  logSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6, // เพิ่มระยะห่างระหว่างบรรทัดเล็กน้อยเพื่อให้ไม่ชิดกันเกินไปเมื่อฟอนต์ใหญ่ขึ้น
  },

  logDetailText: {
    fontSize: 13, // ขยายขนาดตัวอักษรบรรทัดแรงกด
    color: '#8E8E93',
  },

  logMetricText: {
    fontSize: 13, // ขยายขนาดตัวอักษรบรรทัดอุณหภูมิและความชื้น
    color: '#8E8E93',
  },

  sittingTimerText: {
    fontSize: 13, // ขยายขนาดตัวอักษรบรรทัดเวลานั่งต่อเนื่อง
    color: '#2D69CA',
    marginTop: 6,
    fontWeight: '500',
  },

  textRed: {
    color: '#FF3B30',
    fontWeight: '600',
  },

  textGreen: {
    color: '#34C759',
    fontWeight: '600',
  },

  textBlue: {
    color: '#0288D1',
    fontWeight: '600',
  },

  textDark: {
    color: '#1C1C1E',
    fontWeight: '600',
  },

  logHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  exportBadge: {
    backgroundColor: '#2D69CA',
    height: 29,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  exportBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  clearHistoryBadge: {
    backgroundColor: '#FFE5E5',
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  clearHistoryBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  // --- สไตล์สำหรับ Modal View All ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 8,
  },
  modalTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  modalScrollView: {
    maxHeight: 450,
  },
});