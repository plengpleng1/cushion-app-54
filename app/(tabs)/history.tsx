import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import Svg, {
  Circle,
  Line,
  Text as SvgText,
} from 'react-native-svg';

// ดึงข้อมูลจาก sensorService
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
// แปลงเวลา
// =====================================================
const formatTime = (time?: string) => {
  if (!time) return '-';

  // Google Sheet อาจส่งมาแบบ
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

  return time;
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
  // โหลดข้อมูล Sensor
  // ===================================================
  const loadHistoryData = async () => {
    try {
      const data = await fetchSensorData();

      if (data) {
        // -----------------------------
        // ตรวจแรงกดซ้าย
        // -----------------------------
        const isLeftPressed =
          (data.sensor1 ?? 4095) < 500;

        // -----------------------------
        // ตรวจแรงกดขวา
        // -----------------------------
        const isRightPressed =
          (data.sensor2 ?? 4095) < 500;

        // -----------------------------
        // หาตำแหน่ง
        // -----------------------------
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
        }

        // -----------------------------
        // Temperature สูง
        // -----------------------------
        const tempHigh =
          (data.temperature || 0) > 38;

        // -----------------------------
        // Humidity สูง
        // -----------------------------
        const humidHigh =
          (data.humidity || 0) > 75;

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

          // เพิ่มข้อมูลใหม่ด้านบน
          return [newLog, ...prev];
        });
      }

    } catch (error) {

      console.error(
        'Error loading history data:',
        error
      );

    } finally {

      setLoading(false);

    }
  };

  // ===================================================
  // โหลดข้อมูลทุก 3 วินาที
  // ===================================================
  useEffect(() => {

    loadHistoryData();

    const interval = setInterval(() => {
      loadHistoryData();
    }, 3000);

    return () => {
      clearInterval(interval);
    };

  }, []);

  // ===================================================
  // Dashboard Stats
  // ===================================================
  const getDashboardStats = () => {

    const total =
      historyLogs.length || 1;

    let leftCount = 0;
    let rightCount = 0;
    let tempSum = 0;
    let alertCount = 0;
    let moveCount = 0;

    historyLogs.forEach(
      (log, index) => {

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
          log.isHumidHigh
        ) {
          alertCount++;
        }

        // ตรวจการเปลี่ยนท่า
        if (
          index > 0 &&
          log.calculatedPosition !==
            historyLogs[index - 1]
              .calculatedPosition
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
      (
        tempSum / total
      ).toFixed(1);

    // ประมาณเวลานั่ง
    const totalMinutes =
      Math.floor(
        (historyLogs.length * 3) /
          60
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

  const stats =
    getDashboardStats();

  // ===================================================
  // Loading
  // ===================================================
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

  // ===================================================
  // เอาข้อมูลสำหรับกราฟ
  // ===================================================
  const graphLogs =
    historyLogs
      .slice(0, 7)
      .reverse();

  // ===================================================
  // UI
  // ===================================================
  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >

      {/* =================================================
          HEADER
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
          TAB
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
          SUMMARY
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

          <Text
            style={
              styles.cardValueText
            }
          >
            {stats.moveCount} ครั้ง
          </Text>

          <Text
            style={
              styles.cardLabelText
            }
          >
            ขยับเปลี่ยนท่า
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
          PRESSURE BALANCE
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
                  stats.leftPercent ||
                  1,
              },
            ]}
          />

          <View
            style={[
              styles.rightBar,
              {
                flex:
                  stats.rightPercent ||
                  1,
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
          STAR MAP GRAPH
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
          📈 แนวโน้มตลอดวัน (Daily Trend)
        </Text>

        {/* Legend */}
        <View
          style={
            styles.legendRow
          }
        >

          <View
            style={
              styles.legendItem
            }
          >
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    '#0288D1',
                },
              ]}
            />

            <Text
              style={
                styles.legendText
              }
            >
              Humid (%)
            </Text>
          </View>

          <View
            style={
              styles.legendItem
            }
          >
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    '#FF3B30',
                },
              ]}
            />

            <Text
              style={
                styles.legendText
              }
            >
              Pressure
            </Text>
          </View>

          <View
            style={
              styles.legendItem
            }
          >
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    '#FF9500',
                },
              ]}
            />

            <Text
              style={
                styles.legendText
              }
            >
              Temp (°C)
            </Text>
          </View>

        </View>

        {/* =================================================
            STAR MAP
        ================================================= */}
        <View
          style={
            styles.starMapContainer
          }
        >

          <Svg
            width="100%"
            height={260}
            viewBox="0 0 340 260"
          >

            {/* ================================
                GRID
            ================================= */}

            <Line
              x1="30"
              y1="40"
              x2="320"
              y2="40"
              stroke="#E5E5EA"
              strokeWidth="1"
              strokeDasharray="4 5"
            />

            <Line
              x1="30"
              y1="80"
              x2="320"
              y2="80"
              stroke="#E5E5EA"
              strokeWidth="1"
              strokeDasharray="4 5"
            />

            <Line
              x1="30"
              y1="120"
              x2="320"
              y2="120"
              stroke="#E5E5EA"
              strokeWidth="1"
              strokeDasharray="4 5"
            />

            <Line
              x1="30"
              y1="160"
              x2="320"
              y2="160"
              stroke="#E5E5EA"
              strokeWidth="1"
              strokeDasharray="4 5"
            />

            <Line
              x1="30"
              y1="200"
              x2="320"
              y2="200"
              stroke="#E5E5EA"
              strokeWidth="1"
              strokeDasharray="4 5"
            />

            {/* ================================
                HUMIDITY
            ================================= */}

            {graphLogs.map(
              (item, index) => {

                const count =
                  graphLogs.length;

                const x =
                  count <= 1
                    ? 175
                    : 30 +
                      index *
                        (290 /
                          (count - 1));

                const humidity =
                  Math.min(
                    Math.max(
                      Number(
                        item.humidity
                      ) || 0,
                      0
                    ),
                    100
                  );

                const y =
                  200 -
                  (humidity / 100) *
                    160;

                const previous =
                  graphLogs[
                    index - 1
                  ];

                if (!previous) {
                  return (
                    <React.Fragment
                      key={`humid-${index}`}
                    >

                      <Circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill="#0288D1"
                      />

                      <Circle
                        cx={x}
                        cy={y}
                        r="11"
                        fill="none"
                        stroke="#0288D1"
                        strokeWidth="1"
                        opacity="0.25"
                      />

                    </React.Fragment>
                  );
                }

                const previousHumidity =
                  Math.min(
                    Math.max(
                      Number(
                        previous.humidity
                      ) || 0,
                      0
                    ),
                    100
                  );

                const previousX =
                  count <= 1
                    ? 175
                    : 30 +
                      (index - 1) *
                        (290 /
                          (count - 1));

                const previousY =
                  200 -
                  (previousHumidity /
                    100) *
                    160;

                return (
                  <React.Fragment
                    key={`humid-${index}`}
                  >

                    <Line
                      x1={previousX}
                      y1={previousY}
                      x2={x}
                      y2={y}
                      stroke="#0288D1"
                      strokeWidth="2"
                      strokeDasharray="6 5"
                    />

                    <Circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill="#0288D1"
                    />

                    <Circle
                      cx={x}
                      cy={y}
                      r="11"
                      fill="none"
                      stroke="#0288D1"
                      strokeWidth="1"
                      opacity="0.25"
                    />

                  </React.Fragment>
                );
              }
            )}

            {/* ================================
                PRESSURE
            ================================= */}

            {graphLogs.map(
              (item, index) => {

                const count =
                  graphLogs.length;

                const x =
                  count <= 1
                    ? 175
                    : 30 +
                      index *
                        (290 /
                          (count - 1));

                // ใช้ sensor1 เป็น Pressure
                const sensor =
                  Math.min(
                    Math.max(
                      Number(
                        item.sensor1
                      ) || 0,
                      0
                    ),
                    4095
                  );

                // sensor ต่ำ = แรงกดสูง
                const pressure =
                  ((4095 - sensor) /
                    4095) *
                  100;

                const y =
                  200 -
                  (pressure / 100) *
                    160;

                const previous =
                  graphLogs[
                    index - 1
                  ];

                if (!previous) {
                  return (
                    <Circle
                      key={`pressure-${index}`}
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#FF3B30"
                    />
                  );
                }

                const previousSensor =
                  Math.min(
                    Math.max(
                      Number(
                        previous.sensor1
                      ) || 0,
                      0
                    ),
                    4095
                  );

                const previousPressure =
                  ((4095 -
                    previousSensor) /
                    4095) *
                  100;

                const previousX =
                  count <= 1
                    ? 175
                    : 30 +
                      (index - 1) *
                        (290 /
                          (count - 1));

                const previousY =
                  200 -
                  (previousPressure /
                    100) *
                    160;

                return (
                  <React.Fragment
                    key={`pressure-${index}`}
                  >

                    <Line
                      x1={previousX}
                      y1={previousY}
                      x2={x}
                      y2={y}
                      stroke="#FF3B30"
                      strokeWidth="2"
                      strokeDasharray="4 5"
                    />

                    <Circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#FF3B30"
                    />

                  </React.Fragment>
                );
              }
            )}

            {/* ================================
                TEMPERATURE
            ================================= */}

            {graphLogs.map(
              (item, index) => {

                const count =
                  graphLogs.length;

                const x =
                  count <= 1
                    ? 175
                    : 30 +
                      index *
                        (290 /
                          (count - 1));

                const temperature =
                  Math.min(
                    Math.max(
                      Number(
                        item.temperature
                      ) || 0,
                      0
                    ),
                    45
                  );

                const y =
                  200 -
                  (temperature / 45) *
                    160;

                const previous =
                  graphLogs[
                    index - 1
                  ];

                if (!previous) {
                  return (
                    <Circle
                      key={`temp-${index}`}
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#FF9500"
                    />
                  );
                }

                const previousTemperature =
                  Math.min(
                    Math.max(
                      Number(
                        previous.temperature
                      ) || 0,
                      0
                    ),
                    45
                  );

                const previousX =
                  count <= 1
                    ? 175
                    : 30 +
                      (index - 1) *
                        (290 /
                          (count - 1));

                const previousY =
                  200 -
                  (previousTemperature /
                    45) *
                    160;

                return (
                  <React.Fragment
                    key={`temp-${index}`}
                  >

                    <Line
                      x1={previousX}
                      y1={previousY}
                      x2={x}
                      y2={y}
                      stroke="#FF9500"
                      strokeWidth="2"
                      strokeDasharray="6 5"
                    />

                    <Circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#FF9500"
                    />

                  </React.Fragment>
                );
              }
            )}

            {/* ================================
                TIME
            ================================= */}

            {graphLogs.map(
              (item, index) => {

                const count =
                  graphLogs.length;

                const x =
                  count <= 1
                    ? 175
                    : 30 +
                      index *
                        (290 /
                          (count - 1));

                return (
                  <SvgText
                    key={`time-${index}`}
                    x={x}
                    y="235"
                    fill="#8E8E93"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {formatTime(
                      item.time
                    )}
                  </SvgText>
                );
              }
            )}

          </Svg>

        </View>

        {/* ถ้ายังมีข้อมูลไม่ถึง 2 จุด */}
        {graphLogs.length < 2 && (
          <Text
            style={
              styles.graphHint
            }
          >
            กำลังรอข้อมูลเพิ่มเติมเพื่อสร้างเส้นแนวโน้ม...
          </Text>
        )}

      </View>

      {/* =================================================
          RECENT LOGS
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

          <View
            style={
              styles.exportBadge
            }
          >
            <Text
              style={
                styles.exportBadgeText
              }
            >
              LIVE
            </Text>
          </View>

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

                {/* Indicator */}
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

                <View
                  style={
                    styles.logContent
                  }
                >

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
                      item.calculatedPosition ===
                        'CENTER' && (
                        <Text
                          style={
                            styles.warningBadge
                          }
                        >
                          ⚠️ นั่งนานเกินไป
                        </Text>
                      )}

                  </View>

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
// STYLES
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

  // ===================================================
  // TAB
  // ===================================================

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

  // ===================================================
  // SUMMARY
  // ===================================================

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

  // ===================================================
  // CARD
  // ===================================================

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

  // ===================================================
  // BALANCE
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
  // LEGEND
  // ===================================================

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    marginBottom: 8,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 5,
  },

  legendText: {
    fontSize: 11,
    color: '#8E8E93',
  },

  // ===================================================
  // STAR MAP
  // ===================================================

  starMapContainer: {
    width: '100%',
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  graphHint: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 11,
    marginTop: -4,
  },

  // ===================================================
  // LOG
  // ===================================================

  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  exportBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  exportBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
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