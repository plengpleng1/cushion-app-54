import React, { useState, useEffect, useRef } from 'react';
import {View,Text,StyleSheet,ScrollView,TouchableOpacity,ActivityIndicator,Dimensions,} from 'react-native';
import Svg, {Path,Circle,Line,Text as SvgText,} from 'react-native-svg';
import {fetchSensorData,SensorData,} from '../../services/sensorService';

type TabType = 'today' | 'week';

interface HistoryLog extends SensorData {
  id: string;

  calculatedPosition:
    | 'LEFT'
    | 'RIGHT'
    | 'CENTER'
    | 'NONE';

  isTempHigh: boolean;
  isHumidHigh: boolean;

  leftPressed: boolean;
  rightPressed: boolean;

  // จำนวนวินาทีที่นั่ง CENTER ต่อเนื่อง
  sittingSeconds: number;

  // ครบ 2 นาทีหรือยัง
  isSittingTooLong: boolean;
}

const screenWidth = Dimensions.get('window').width;

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

// =====================================================
// Clamp 0 - 100
// =====================================================

const clamp = (value: number) => {
  return Math.min(Math.max(value, 0), 100);
};

// =====================================================
// Trend Chart (แก้ไขการคำนวณขนาดให้อยู่ภายในกล่อง)
// =====================================================

interface TrendChartProps {
  logs: HistoryLog[];
}

const TrendChart = ({ logs }: TrendChartProps) => {
  const [containerWidth, setContainerWidth] = useState(0);

  const chartHeight = 220;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 40;

  // คำนวณ plotWidth Dynamic ตามขนาด container จริง
  const plotWidth = Math.max(containerWidth - paddingLeft - paddingRight, 0);
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  if (logs.length === 0) {
    return (
      <Text style={styles.emptyGraphText}>
        ยังไม่มีข้อมูลสำหรับแสดงกราฟ
      </Text>
    );
  }

  // ===================================================
  // Humidity / Pressure / Temperature
  // ===================================================

  const humidityValues = logs.map((item) =>
    clamp(Number(item.humidity) || 0)
  );

  const pressureValues = logs.map((item) => {
    if (item.leftPressed || item.rightPressed) {
      return 80;
    }
    return 20;
  });

  const temperatureValues = logs.map((item) =>
    clamp(((Number(item.temperature) || 0) / 45) * 100)
  );

  // ===================================================
  // X & Y Calculation
  // ===================================================

  const getX = (index: number) => {
    if (logs.length <= 1) {
      return paddingLeft + plotWidth / 2;
    }
    return paddingLeft + (index / (logs.length - 1)) * plotWidth;
  };

  const getY = (value: number) => {
    return paddingTop + plotHeight - (value / 100) * plotHeight;
  };

  // ===================================================
  // Path Creator
  // ===================================================

  const createPath = (values: number[]) => {
    if (values.length === 0) return '';
    let path = '';
    values.forEach((value, index) => {
      const x = getX(index);
      const y = getY(value);
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    return path;
  };

  const humidityPath = createPath(humidityValues);
  const pressurePath = createPath(pressureValues);
  const temperaturePath = createPath(temperatureValues);

  const gridValues = [100, 75, 50, 25, 0];

  return (
    <View
      style={styles.chartWrapper}
      onLayout={(e) => {
        // ดึงขนาดความกว้างจริงของกล่อง Card ออกมาโดยอัตโนมัติ
        setContainerWidth(e.nativeEvent.layout.width);
      }}
    >
      {containerWidth > 0 && (
        <Svg width={containerWidth} height={chartHeight}>
          {/* Grid Lines & Y Axis Labels */}
          {gridValues.map((value) => {
            const y = getY(value);
            return (
              <React.Fragment key={value}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={containerWidth - paddingRight}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
                <SvgText
                  x={paddingLeft - 6}
                  y={y + 3}
                  fontSize="10"
                  fill="#8E8E93"
                  textAnchor="end"
                >
                  {value}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Y Axis Line */}
          <Line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + plotHeight}
            stroke="#D1D1D6"
            strokeWidth={1}
          />

          {/* X Axis Line */}
          <Line
            x1={paddingLeft}
            y1={paddingTop + plotHeight}
            x2={containerWidth - paddingRight}
            y2={paddingTop + plotHeight}
            stroke="#D1D1D6"
            strokeWidth={1}
          />

          {/* Lines */}
          <Path
            d={humidityPath}
            fill="none"
            stroke="#4A90E2"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={pressurePath}
            fill="none"
            stroke="#F15B4A"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={temperaturePath}
            fill="none"
            stroke="#FF9500"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points - Humidity */}
          {humidityValues.map((value, index) => (
            <Circle
              key={`humidity-${index}`}
              cx={getX(index)}
              cy={getY(value)}
              r={4}
              fill="#4A90E2"
            />
          ))}

          {/* Points - Pressure */}
          {pressureValues.map((value, index) => (
            <Circle
              key={`pressure-${index}`}
              cx={getX(index)}
              cy={getY(value)}
              r={4}
              fill="#F15B4A"
            />
          ))}

          {/* Points - Temperature */}
          {temperatureValues.map((value, index) => (
            <Circle
              key={`temperature-${index}`}
              cx={getX(index)}
              cy={getY(value)}
              r={4}
              fill="#FF9500"
            />
          ))}

          {/* X Axis Labels (Time) */}
          {logs.map((item, index) => {
            const x = getX(index);
            const time = formatTime(item.time);
            return (
              <SvgText
                key={`time-${index}`}
                x={x}
                y={paddingTop + plotHeight + 16}
                fontSize="9"
                fill="#8E8E93"
                textAnchor="middle"
              >
                {time.slice(0, 5)}
              </SvgText>
            );
          })}
        </Svg>
      )}

      <Text style={styles.xAxisTitle}>เวลา (น.)</Text>
    </View>
  );
};

// =====================================================
// History Screen
// =====================================================

export default function HistoryScreen() {

  const [activeTab, setActiveTab] =
    useState<TabType>('today');

  const [loading, setLoading] =
    useState<boolean>(true);

  const [historyLogs, setHistoryLogs] =
    useState<HistoryLog[]>([]);

  // ===================================================
  // IMPORTANT
  // ใช้ REF สำหรับจับเวลา CENTER
  // ===================================================

  const centerStartTimeRef =
    useRef<number | null>(null);

  // ===================================================
  // Load Data
  // ===================================================

  const loadHistoryData = async () => {

    try {

      const data = await fetchSensorData();

      if (!data) {
        return;
      }

      // =================================================
      // 1. ตรวจแรงกดซ้าย / ขวา
      // =================================================

      const isLeftPressed =
        (data.sensor1 ?? 4095) < 500;

      const isRightPressed =
        (data.sensor2 ?? 4095) < 500;

      let calcPos:
        | 'LEFT'
        | 'RIGHT'
        | 'CENTER'
        | 'NONE' = 'NONE';

      if (
        isLeftPressed &&
        isRightPressed
      ) {

        calcPos = 'CENTER';

      } else if (isLeftPressed) {

        calcPos = 'LEFT';

      } else if (isRightPressed) {

        calcPos = 'RIGHT';

      } else {

        calcPos = 'NONE';

      }

      // =================================================
      // 2. Temperature
      // =================================================

      const temperature =
        Number(data.temperature) || 0;

      const tempHigh =
        temperature > 38;

      // =================================================
      // 3. Humidity
      // =================================================

      const humidity =
        Number(data.humidity) || 0;

      const humidHigh =
        humidity > 75;

      // =================================================
      // 4. CENTER TIMER
      // =================================================

      let sittingSeconds = 0;

      // -----------------------------------------------
      // ถ้าอยู่ CENTER
      // -----------------------------------------------

      if (calcPos === 'CENTER') {

        // ถ้าเพิ่งเริ่ม CENTER
        if (
          centerStartTimeRef.current === null
        ) {

          centerStartTimeRef.current =
            Date.now();

        }

        // เวลาที่นั่ง CENTER
        sittingSeconds = Math.floor(
          (
            Date.now() -
            centerStartTimeRef.current
          ) / 1000
        );

      } else {

        // ---------------------------------------------
        // ไม่ได้ CENTER
        // RESET TIMER
        // ---------------------------------------------

        centerStartTimeRef.current =
          null;

        sittingSeconds = 0;
      }

      // =================================================
      // 5. ตรวจครบ 2 นาที
      // =================================================

      const isSittingTooLong =
        calcPos === 'CENTER' &&
        sittingSeconds >= 120;

      // =================================================
      // 6. สร้าง Log
      // =================================================

      const newLog: HistoryLog = {

        ...data,

        id:
          `${data.date}_${data.time}_${Date.now()}`,

        calculatedPosition:
          calcPos,

        isTempHigh:
          tempHigh,

        isHumidHigh:
          humidHigh,

        leftPressed:
          isLeftPressed,

        rightPressed:
          isRightPressed,

        sittingSeconds:
          sittingSeconds,

        isSittingTooLong:
          isSittingTooLong,
      };

      // =================================================
      // 7. เพิ่ม History
      // =================================================

      setHistoryLogs((prev) => {

        const alreadyExists =
          prev.some(
            (item) =>
              item.time === data.time &&
              item.date === data.date
          );

        if (alreadyExists) {
          return prev;
        }

        return [
          newLog,
          ...prev,
        ];
      });

    } catch (error) {

      console.error(
        'Error loading history data:',
        error
      );

    } finally {

      setLoading(false);

    }
  };

  // =====================================================
  // โหลดทุก 3 วินาที
  // =====================================================

  useEffect(() => {

    // เริ่มหน้าใหม่ = reset timer
    centerStartTimeRef.current =
      null;

    // โหลดทันที
    loadHistoryData();

    // โหลดทุก 3 วินาที
    const interval =
      setInterval(() => {

        loadHistoryData();

      }, 3000);

    return () => {

      clearInterval(interval);

      // ออกจากหน้า = reset
      centerStartTimeRef.current =
        null;

    };

  }, []);

  // =====================================================
  // Dashboard Stats
  // =====================================================

  const getDashboardStats = () => {

    const total =
      historyLogs.length || 1;

    let leftCount = 0;
    let rightCount = 0;
    let tempSum = 0;
    let alertCount = 0;
    let moveCount = 0;

    historyLogs.forEach(
      (log, idx) => {

        if (log.leftPressed) {
          leftCount++;
        }

        if (log.rightPressed) {
          rightCount++;
        }

        tempSum +=
          log.temperature || 0;

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
            historyLogs[
              idx - 1
            ].calculatedPosition
        ) {
          moveCount++;
        }

      }
    );

    const totalPressureSide =
      leftCount + rightCount || 1;

    const leftPercent =
      Math.round(
        (leftCount /
          totalPressureSide) *
          100
      );

    const rightPercent =
      100 - leftPercent;

    const avgTemp =
      (tempSum / total).toFixed(1);

    const totalMinutes =
      Math.floor(
        (historyLogs.length * 3) / 60
      );

    const hours =
      Math.floor(
        totalMinutes / 60
      );

    const mins =
      totalMinutes % 60;

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

  const stats =
    getDashboardStats();

  // =====================================================
  // Loading
  // =====================================================

  if (
    loading &&
    historyLogs.length === 0
  ) {

    return (
      <View
        style={
          styles.loadingContainer
        }
      >

        <ActivityIndicator
          size="large"
          color="#4464D0"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          กำลังโหลดข้อมูล Dashboard...
        </Text>

      </View>
    );
  }

  // =====================================================
  // Graph Data
  // =====================================================

  const graphLogs =
    historyLogs
      .slice(0, 10)
      .reverse();

  // =====================================================
  // UI
  // =====================================================

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >

      {/* =================================================
          Header
      ================================================= */}

      <Text
        style={
          styles.headerTitle
        }
      >
        Clinical Dashboard
      </Text>

      <Text
        style={
          styles.subHeaderTitle
        }
      >
        รายงานวิเคราะห์พฤติกรรมทางการแพทย์
      </Text>

      {/* =================================================
          Tab
      ================================================= */}

      <View
        style={
          styles.tabContainer
        }
      >

        <TouchableOpacity
          style={[
            styles.tabButton,

            activeTab === 'today' &&
              styles.activeTabButton,
          ]}
          onPress={() =>
            setActiveTab('today')
          }
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
          onPress={() =>
            setActiveTab('week')
          }
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

      {/* =================================================
          Summary Cards
      ================================================= */}

      <View
        style={
          styles.gridContainer
        }
      >

        <View
          style={
            styles.summaryCard
          }
        >

          <Text
            style={
              styles.cardIcon
            }
          >
            ⏱️
          </Text>

          <Text
            style={
              styles.cardValueText
            }
          >
            {stats.sittingTimeStr}
          </Text>

          <Text
            style={
              styles.cardLabelText
            }
          >
            เวลานั่งรวม
          </Text>

        </View>

        <View
          style={
            styles.summaryCard
          }
        >

          <Text
            style={
              styles.cardIcon
            }
          >
            🚶
          </Text>

          <Text style={styles.cardValueText}>{stats.moveCount} ครั้ง</Text>
          <Text style={styles.cardLabelText}>ขยับเปลี่ยนท่า</Text>
        </View>

        <View
          style={
            styles.summaryCard
          }
        >

          <Text
            style={
              styles.cardIcon
            }
          >
            🌡️
          </Text>

          <Text
            style={[
              styles.cardValueText,
              {
                color: '#FF9500',
              },
            ]}
          >
            {stats.avgTemp} °C
          </Text>

          <Text
            style={
              styles.cardLabelText
            }
          >
            อุณหภูมิเฉลี่ย
          </Text>

        </View>

        <View
          style={
            styles.summaryCard
          }
        >

          <Text
            style={
              styles.cardIcon
            }
          >
            🚨
          </Text>

          <Text
            style={[
              styles.cardValueText,
              {
                color: '#FF3B30',
              },
            ]}
          >
            {stats.alertCount} ครั้ง
          </Text>

          <Text
            style={
              styles.cardLabelText
            }
          >
            เตือนวิกฤต/ชื้น
          </Text>

        </View>

      </View>

      {/* =================================================
          Pressure Balance
      ================================================= */}

      <View
        style={
          styles.cardSection
        }
      >

        <Text
          style={
            styles.sectionTitle
          }
        >
          ⚖️ สัดส่วนการพบแรงกดสูง
        </Text>

        <View
          style={
            styles.balanceHeader
          }
        >

          <Text
            style={
              styles.leftPercentText
            }
          >
            ซ้าย {stats.leftPercent}%
          </Text>

          <Text
            style={
              styles.rightPercentText
            }
          >
            ขวา {stats.rightPercent}%
          </Text>

        </View>

        <View
          style={
            styles.balanceBarContainer
          }
        >

          <View
            style={[
              styles.leftBar,
              {
                flex:
                  stats.leftPercent || 1,
              },
            ]}
          />

          <View
            style={[
              styles.rightBar,
              {
                flex:
                  stats.rightPercent || 1,
              },
            ]}
          />

        </View>

        <Text
          style={
            styles.evalText
          }
        >
          💡 ประเมิน:{' '}

          {Math.abs(
            stats.leftPercent -
              stats.rightPercent
          ) < 20

            ? 'การลงน้ำหนักซ้าย-ขวาอยู่ในเกณฑ์สมดุล'

            : 'ตรวจพบการลงน้ำหนักเอียงไปฝั่งใดฝั่งหนึ่งมากเกินไป'}
        </Text>

      </View>

      {/* =================================================
          Daily Trend
      ================================================= */}

      <View
        style={
          styles.cardSection
        }
      >

        <Text
          style={
            styles.sectionTitle
          }
        >
          📈 ภาพรวมวันนี้ (Daily Trend)
        </Text>

        <Text
          style={
            styles.graphSubTitle
          }
        >
          แนวโน้มความชื้น อุณหภูมิ และแรงกดตามเวลา
        </Text>

        {/* Legend */}

        <View
          style={
            styles.chartLegend
          }
        >

          <View
            style={
              styles.chartLegendItem
            }
          >

            <View
              style={[
                styles.legendCircle,
                {
                  backgroundColor:
                    '#4A90E2',
                },
              ]}
            />

            <Text
              style={
                styles.chartLegendText
              }
            >
              ความชื้น (%)
            </Text>

          </View>

          <View
            style={
              styles.chartLegendItem
            }
          >

            <View
              style={[
                styles.legendCircle,
                {
                  backgroundColor:
                    '#F15B4A',
                },
              ]}
            />

            <Text
              style={
                styles.chartLegendText
              }
            >
              แรงกด
            </Text>

          </View>

          <View
            style={
              styles.chartLegendItem
            }
          >

            <View
              style={[
                styles.legendCircle,
                {
                  backgroundColor:
                    '#FF9500',
                },
              ]}
            />

            <Text
              style={
                styles.chartLegendText
              }
            >
              อุณหภูมิ
            </Text>

          </View>

        </View>

        <TrendChart
          logs={graphLogs}
        />

        <Text
          style={
            styles.graphDescription
          }
        >
          แสดงแนวโน้มจากข้อมูลล่าสุด{' '}
          {graphLogs.length} รายการ
        </Text>

      </View>

      {/* =================================================
          Recent Logs
      ================================================= */}

      <View
        style={
          styles.cardSection
        }
      >

        <View
          style={
            styles.logHeaderRow
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            📋 ประวัติบันทึกเหตุการณ์
          </Text>

          <TouchableOpacity
            style={
              styles.exportBadge
            }
          >

            <Text
              style={
                styles.exportBadgeText
              }
            >
              ย่อลง
            </Text>

          </TouchableOpacity>

        </View>

        {historyLogs.length === 0 ? (

          <Text
            style={
              styles.emptyText
            }
          >
            ยังไม่มีข้อมูลบันทึก
          </Text>

        ) : (

          historyLogs.map(
            (item) => (

              <View
                key={item.id}
                style={
                  styles.logItemCard
                }
              >

                {/* -----------------------------------------
                    Indicator
                ------------------------------------------ */}

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

                <View
                  style={
                    styles.logContent
                  }
                >

                  {/* ---------------------------------------
                      Top Row
                  ---------------------------------------- */}

                  <View
                    style={
                      styles.logTopRow
                    }
                  >

                    <Text
                      style={
                        styles.logTimeText
                      }
                    >
                      {formatTime(
                        item.time
                      )}{' '}
                      น.
                    </Text>

                    {/* Temperature Critical */}

                    {item.isTempHigh && (

                      <Text
                        style={
                          styles.criticalBadge
                        }
                      >
                        🚨 วิกฤต
                      </Text>

                    )}

                    {/* Sitting Too Long */}

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

                  {/* ---------------------------------------
                      Pressure / Sensor
                  ---------------------------------------- */}

                  <View
                    style={
                      styles.logSubRow
                    }
                  >

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

                  {/* ---------------------------------------
                      แสดงเวลานั่ง CENTER
                      เฉพาะตอนกำลัง CENTER
                  ---------------------------------------- */}

                  {item.calculatedPosition ===
                    'CENTER' && (

                    <Text
                      style={
                        styles.sittingTimerText
                      }
                    >
                      🪑 นั่งตรงกลางต่อเนื่อง:{' '}
                      {item.sittingSeconds} วินาที

                    </Text>

                  )}

                </View>

              </View>

            )
          )

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

  headerTitle: {             // Clinical Dashboard
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

  // ===================================================
  // Tab
  // ===================================================

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E0E5EC',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
    width: '40%',          // แก้ขนาดกล่อง
    alignSelf:'center',    // แก้ตำแหน่งกล่อง
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
  activeTabText: {          // แถบวันนี้, สัปดาห์นี้
    color: '#4464D0',
  },
  // ===================================================
  // Summary
  // ===================================================

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    width: '40%',          // แก้ขนาดกล่อง
    alignSelf:'center',    // แก้ตำแหน่งกล่อง
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
  // ===================================================
  // Section
  // ===================================================

  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    width: '40%',          // แก้ขนาดกล่อง
    alignSelf:'center',    // แก้ตำแหน่งกล่อง
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },

  // ===================================================
  // Balance
  // ===================================================

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

  // แถบสัดส่วนการพบแรงกด
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

  // ===================================================
  // Graph
  // ===================================================

  chartWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },

  graphSubTitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: -6,
    marginBottom: 8,
  },

  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },

  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },

  chartLegendText: {
    fontSize: 10,
    color: '#8E8E93',
  },

  graphDescription: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },

  emptyGraphText: {
    textAlign: 'center',
    color: '#8E8E93',
    paddingVertical: 20,
    fontSize: 12,
  },

  xAxisTitle: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: -4,
  },

  // ===================================================
  // Recent Logs
  // ===================================================

  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  exportBadge: {
    backgroundColor: '#4464D0',
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
    color: '#4464D0',
    fontWeight: 'bold',
  },

  textDark: {
    color: '#1C1C1E',
    fontWeight: 'bold',
  },

  // ===================================================
  // Sitting Timer
  // ===================================================

  sittingTimerText: {
    marginTop: 6,
    fontSize: 10,
    color: '#8E8E93',
  },

});