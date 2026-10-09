import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchSensorData, SensorData } from "../../services/sensorService";

import { useAudioPlayer } from "expo-audio";

type PrimaryStatus = "ACTIVE" | "STANDBY";
type PressureSide = "left" | "right" | "both" | "none";

const SELECTED_PATIENT_KEY = "selectedPatientId";

export default function HomeScreen() {
  const player = useAudioPlayer(
    require("../../assets/sounds/change-position.mp3")
  );
  const alarm2Player = useAudioPlayer(
  require('../../assets/sounds/alarm.mp3')
  );

  const alarmPlayedRef = useRef(false);
  const alarmFlashAnim = useRef(new Animated.Value(0)).current;
  const warningBlinkAnim = useRef(new Animated.Value(1)).current;

  const { width: windowWidth } = useWindowDimensions();
  const maxContainerWidth = Math.min(windowWidth - 32, 500);

  const [seconds, setSeconds] = useState(0);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sensorConnected, setSensorConnected] = useState<boolean>(false);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );

  const [mainStatus, setMainStatus] =
    useState<PrimaryStatus>("STANDBY");

  const [pressureSide, setPressureSide] =
    useState<PressureSide>("none");

  const [isHumidHigh, setIsHumidHigh] =
    useState<boolean>(false);

  const [isTempHigh, setIsTempHigh] =
    useState<boolean>(false);

  // ==================================================
  // โหลด Patient ที่เลือกจาก AsyncStorage
  // ==================================================
  useEffect(() => {
    const loadSelectedPatient = async () => {
      try {
        const savedPatientId = await AsyncStorage.getItem(
          SELECTED_PATIENT_KEY
        );

        setSelectedPatientId(savedPatientId);
      } catch (error) {
        console.error("โหลดผู้ป่วยที่เลือกไม่สำเร็จ:", error);
      }
    };

    loadSelectedPatient();
  }, []);

  // ==================================================
  // Timer
  // ==================================================
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (pressureSide === "both") {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [pressureSide]);


  // ==================================================
  // Alarm เมื่ออยู่ตรงกลางครบ 2 นาที
  // ==================================================
  useEffect(() => {
    if (pressureSide === "both" && seconds >= 120) {
      if (!alarmPlayedRef.current) {
        alarmPlayedRef.current = true;

        player.seekTo(0);
        player.play();
      }
    }

    if (pressureSide !== "both") {
      alarmPlayedRef.current = false;
    }
  }, [seconds, pressureSide]);

  //================ all alarm ========================
  const isAlarmActive =
  pressureSide === "both" &&
  seconds >= 120;       // red flash 120
  
  const isSecondAlarmActive =
  pressureSide === "both" &&
  seconds >= 135;       // 135

  useEffect(() => {
  if (isSecondAlarmActive) {
    alarm2Player.seekTo(0);
    alarm2Player.play();
  } else {
    alarm2Player.pause();
    alarm2Player.seekTo(0);
  }
  }, [isSecondAlarmActive]);

   // ==================================================
  // Alarm Flash Animation
  // ==================================================
  useEffect(() => {
    if (isAlarmActive) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(alarmFlashAnim, {
            toValue: 0.35,
            duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),

          Animated.timing(alarmFlashAnim, {
            toValue: 0,
            duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();

      return () => {
        animation.stop();
      };
    }

    alarmFlashAnim.stopAnimation();
    alarmFlashAnim.setValue(0);
 }, [isAlarmActive]);

// ==================================================
// Warning Blink Animation
// ==================================================
    useEffect(() => {
      if (isSecondAlarmActive) {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(warningBlinkAnim, {
              toValue: 0,
              duration: 350,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),

            Animated.timing(warningBlinkAnim, {
              toValue: 1,
              duration: 350,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );

        animation.start();

        return () => {
          animation.stop();
        };
      }

      warningBlinkAnim.stopAnimation();
      warningBlinkAnim.setValue(1);
    }, [isSecondAlarmActive]);

  // ==================================================
  // ดึงข้อมูล Sensor
  // ==================================================
  useEffect(() => {
    let isMounted = true;
    let lastFetchedTime: string | null = null;

    const loadData = async () => {
      try {
          //console.log("⏱️ Fetch start:",new Date().toLocaleTimeString());
        const data = await fetchSensorData();
          
          //console.log(
          //"⏱️ Fetch result:",new Date().toLocaleTimeString(),data
          //  ? `S1=${data.sensor1}, S2=${data.sensor2}`
          //  : "NULL"
          //);

        // ถ้าดึงข้อมูลไม่ได้
        if (!data || !isMounted) {
          setSensorConnected(false);
          setPressureSide("none");
          setSeconds(0);
          setMainStatus("STANDBY");
          return;
        }

        setSensorConnected(true);

        // เช็กว่ามีข้อมูลใหม่เข้ามาหรือไม่
        const isNewData =
          !!data.time &&
          data.time !== lastFetchedTime;

        if (isNewData) {
          lastFetchedTime = data.time;
        }

        // ==================================================
        // เก็บข้อมูล Sensor ล่าสุด
        // ==================================================
        setSensorData(data);
        setLoading(false);

        // ==================================================
        // Humidity
        // ==================================================
        const humidHigh =
          (data.humidity || 0) > 75;

        setIsHumidHigh(humidHigh);

        // ==================================================
        // Pressure Sensor
        // ==================================================
        const isLeftPressed =
          (data.sensor1 ?? 4095) < 500;

        const isRightPressed =
          (data.sensor2 ?? 4095) < 500;

        const correctedPressure =
          isLeftPressed || isRightPressed
            ? "HIGH"
            : "LOW";

        // แก้ค่า Pressure ให้ตรงกับ Sensor จริง
        data.pressure = correctedPressure;

        let calcPos:
          | "left"
          | "right"
          | "both"
          | "none" = "none";

        if (isLeftPressed && isRightPressed) {
          calcPos = "both";
        } else if (isLeftPressed) {
          calcPos = "left";
        } else if (isRightPressed) {
          calcPos = "right";
        } else {
          calcPos = "none";
        }

        //console.log("📍 Pressure:",
          //`S1=${data.sensor1}`,
          //`S2=${data.sensor2}`,
          //`Position=${calcPos}`,
          //new Date().toLocaleTimeString()
        //);

        setPressureSide(calcPos);

        // ==================================================
        // Status
        // ==================================================
        if (data.status) {
          const normalizedStatus =
            String(data.status).toUpperCase() as
              | "ACTIVE"
              | "STANDBY";

          setMainStatus(normalizedStatus);
        }

        // ==================================================
        // Temperature
        // ==================================================
        const tempHigh =
          (data.temperature || 0) > 38;

        setIsTempHigh(tempHigh);
      } catch (error) {
        console.error(
          "โหลดข้อมูล Sensor ไม่สำเร็จ:",
          error
        );
      }
    };

    // โหลดครั้งแรกทันที
    let timeout: ReturnType<typeof setTimeout>;

const run = async () => {
  await loadData();

  if (isMounted) {
    timeout = setTimeout(run, 2000);
  }
};

run();

return () => {
  isMounted = false;
  clearTimeout(timeout);
};
  }, []);

  // ==================================================
  // Position
  // ==================================================
  
  //console.log("🎨 Render Pressure Map:",pressureSide,new Date().toLocaleTimeString());
  
  const getDisplayPosition = () => {
    switch (pressureSide) {
      case "left":
        return "LEFT";

      case "right":
        return "RIGHT";

      case "both":
        return "CENTER";

      case "none":
      default:
        return "NONE";
    }
  };

  // ==================================================
  // Timer Card Style
  // ==================================================
  const getTimerCardStyle = () => {
    if (pressureSide === "none") {
      return {
        backgroundColor: "#F2F2F7",
      };
    }

    if (
      pressureSide === "left" ||
      pressureSide === "right"
    ) {
      return {
        backgroundColor: "#E5E5EA",
      };
    }

    if (seconds >= 120) {
      return {
        backgroundColor: "#FF3B30",
      };
    }

    return {
      backgroundColor: "#34C759",
    };
  };

  // ==================================================
  // Timer Text Color
  // ==================================================
  const getTimerTextColor = () => {
    if (pressureSide === "both") {
      return "#FFFFFF";
    }

    return "#8E8E93";
  };

  // ==================================================
  // Format Timer
  // ==================================================
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(
      totalSeconds / 3600
    );

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const secs = totalSeconds % 60;

    return `${hours
      .toString()
      .padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // ==================================================
  // Loading
  // ==================================================
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#4464D0"
        />

        <Text style={styles.loadingText}>
          กำลังโหลดข้อมูลจาก Google Sheet...
        </Text>
      </View>
    );
  }

  const isActive =
    mainStatus === "ACTIVE";

  // ==================================================
  // Format Update Time
  // ==================================================
  const formatUpdateTime = (
    dateString?: string,
    timeString?: string
  ) => {
    // ถ้าไม่มีข้อมูล หรือเจอปี 1899
    if (
      !dateString ||
      !timeString ||
      String(dateString).includes("1899")
    ) {
      const now = new Date();

      return `${now.toLocaleTimeString(
        "th-TH",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      )} น. ${now.toLocaleDateString(
        "en-GB"
      )}`;
    }

    try {
      const fullDateTimeString =
        timeString.includes("T") ||
        timeString.includes("-")
          ? timeString
          : `${dateString.split("T")[0]}T${timeString}`;

      const time = new Date(
        fullDateTimeString
      );

      if (
        isNaN(time.getTime()) ||
        time.getFullYear() <= 1900
      ) {
        throw new Error("Invalid date");
      }

      const formattedTime =
        time.toLocaleTimeString(
          "th-TH",
          {
            timeZone: "Asia/Bangkok",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }
        );

      const date = new Date(
        dateString
      );

      const formattedDate =
        date.toLocaleDateString(
          "en-GB",
          {
            timeZone: "Asia/Bangkok",
            day: "numeric",
            month: "numeric",
            year: "numeric",
          }
        );

      return `${formattedTime} น. ${formattedDate}`;
    } catch {
      const now = new Date();

      return `${now.toLocaleTimeString(
        "th-TH",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      )} น. ${now.toLocaleDateString(
        "en-GB"
      )}`;
    }
  };

  // ==================================================
  // UI
  // ==================================================
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
      >
        <View
          style={[
            styles.mainWrapper,
            {
              width: maxContainerWidth,
            },
          ]}
        >
          {/* Logo */}
          <Image
            source={require("../../assets/images/cushion.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />

          {/* Last Update */}
          <Text style={styles.lastUpdateText}>
            อัปเดตล่าสุด:{" "}
            {formatUpdateTime(
              sensorData?.date,
              sensorData?.time
            )}
          </Text>

          {/* ==================================================
              Alarm Alert
          ================================================== */}
          {(isHumidHigh ||
            isTempHigh ||
            seconds >= 120) && (
            <View style={styles.alarmCard}>
              <Text style={styles.alarmTitle}>
                🚨 แจ้งเตือนระบบ (Alarm Alert)
              </Text>

              {seconds >= 120 && (
                <Text style={styles.alarmText}>
                  • นั่งตรงกลางเกิน 2 นาทีแล้ว กรุณาปรับเปลี่ยนท่านั่ง
                </Text>
              )}

              {isHumidHigh && (
                <Text style={styles.alarmText}>
                  • ตรวจพบความชื้นสูงเกินกำหนด (
                  {sensorData?.humidity ?? 0}
                  %)
                </Text>
              )}

              {isTempHigh && (
                <Text style={styles.alarmText}>
                  • ตรวจพบอุณหภูมิสูงเกินกำหนด (
                  {sensorData?.temperature ?? 0}
                  °C)
                </Text>
              )}
            </View>
          )}

          {/* ==================================================
              Status + Timer
          ================================================== */}
          <View style={styles.row}>
            {/* Status */}
            <View
              style={[
                styles.card,
                styles.thirdCard,
                {
                  backgroundColor: isActive
                    ? "#EAF9EC"
                    : "#F2F2F7",
                },
              ]}
            >
              <Text style={[styles.cardLabel, { fontSize: 20 }]}>
                Status
              </Text>

              <Text
                style={[
                  styles.cardValue,
                  {
                    color: isActive
                      ? "#34C759"
                      : "#8E8E93",
                  },
                ]}
              >
                {mainStatus}
              </Text>

              <Text style={styles.subText}>
                {isActive
                  ? "มีการลงน้ำหนัก"
                  : "ไม่มีการลงน้ำหนัก"}
              </Text>
            </View>

            {/* Timer */}
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
                    color:
                      getTimerTextColor(),
                      fontSize: 20,
                  },
                ]}
              >
                Timer
              </Text>

              <Text
                style={[
                  styles.timerValue,
                  {
                    color:
                      getTimerTextColor(),
                  },
                ]}
              >
                {formatTime(seconds)}
              </Text>
            </View>
          </View>

          {/* ==================================================
              Position & Pressure Map
          ================================================== */}
          <View style={styles.card}>
            <View style={styles.positionHeader}>
              <Text style={styles.cardLabel}>
                Position & Pressure Map (
                {getDisplayPosition()})
              </Text>

              <View 
              style={styles.badgeContainer}
              >
                {isTempHigh && (
                  <Text 
                style={styles.tempBadge}>
                    🌡️ Temp High
                  </Text>
                )}

                {isHumidHigh && (
                  <Text
                style={styles.humidBadge}
                >
                    💧 Humid High
                  </Text>
                )}
              </View>
            </View>

            <View
              style={[
                styles.cushionContainer,

                pressureSide === "both" &&
                  seconds < 120 &&
                  styles.centerCushionContainer,

                isTempHigh &&
                  styles.warningBorder,

                isHumidHigh &&
                  styles.humidWarningBorder,
              ]}
            >
              {/* Left */}
              <View
                style={[
                  styles.cushionHalf,
                  styles.leftHalf,

                  (pressureSide === "left" ||
                    pressureSide === "both") &&
                    styles.activePressureHalf,

                  pressureSide === "both" &&
                    seconds < 120 &&
                    styles.centerPressureHalf,
                ]}
              >
                {(pressureSide === "left" ||
                  pressureSide === "both") && (
                  <View
                    style={[
                      styles.heatSpot,

                      pressureSide ===
                        "both" &&
                        seconds < 120 &&
                        styles.centerHeatSpot,
                    ]}
                  />
                )}
              </View>

              {/* Right */}
              <View
                style={[
                  styles.cushionHalf,
                  styles.rightHalf,

                  (pressureSide === "right" ||
                    pressureSide === "both") &&
                    styles.activePressureHalf,

                  pressureSide === "both" &&
                    seconds < 120 &&
                    styles.centerPressureHalf,
                ]}
              >
                {(pressureSide === "right" ||
                  pressureSide === "both") && (
                  <View
                    style={[
                      styles.heatSpot,

                      pressureSide ===
                        "both" &&
                        seconds < 120 &&
                        styles.centerHeatSpot,
                    ]}
                  />
                )}
              </View>
            </View>
          </View>

          {/* ==================================================
              Sensor Cards
          ================================================== */}
          <View style={styles.sensorRow}>
            {/* Pressure */}
            <View
              style={[
                styles.card,
                styles.pressureCard,
              ]}
            >
              <Text style={styles.cardLabel}>
                Pressure
              </Text>

              <Text style={styles.cardValue}>
                {pressureSide === "none"
                  ? "LOW"
                  : "HIGH"}
              </Text>
            </View>

            {/* Temperature */}
            <View
              style={[
                styles.card,
                styles.thirdCard,
                isTempHigh &&
                  styles.tempWarningCard,
              ]}
            >
              <Text style={styles.cardLabel}>
                Temperature
              </Text>

              <Text
                style={[
                  styles.cardValue,
                  isTempHigh &&
                    styles.tempWarningText,
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
                isHumidHigh &&
                  styles.humidWarningCard,
              ]}
            >
              <Text style={styles.cardLabel}>
                Humid
              </Text>

              <Text
                style={[
                  styles.cardValue,
                  isHumidHigh &&
                    styles.humidWarningText,
                ]}
              >
                {sensorData?.humidity ?? 0} %
              </Text>
            </View>
          </View>

          {/* ==================================================
              Medical Note
          ================================================== */}
          <Text
            style={styles.notMedicalInformation}
          >
            หมายเหตุ: Cushion Sense เป็นระบบเฝ้าระวังปัจจัยเสี่ยงที่สามารถทำให้แผลกดทับเท่านั้น ไม่สามารถแทนการวินิจฉัยการเกิดโรคแผลกดทับหรือการรักษาทางการแพทย์ได้
          </Text>
        </View>
      </ScrollView>

      {isSecondAlarmActive && (
      <>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.alarmFlashOverlay,
            {
              opacity: alarmFlashAnim,
            },
          ]}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.warningContent,
            {
              opacity: warningBlinkAnim,
            },
          ]}
        >
          <Ionicons
            name="warning"
            size={70}
            color="#b40808"
          />

          <Text style={styles.warningText}>
            WARNING
          </Text>
        </Animated.View>
      </>
    )}

      </View>
  );
}

// ======================================================
// Styles
// ======================================================

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 130,
    backgroundColor: "#F4F6F9",
    flexGrow: 1,
    alignItems: "center",
  },

  mainWrapper: {
    alignSelf: "center",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },

  loadingText: {
    marginTop: 10,
    color: "#8E8E93",
  },

  logoImage: {
    width: 400,
    height: 150,
    alignSelf: "center",
    marginBottom: 5,
  },

  lastUpdateText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 13,
    marginTop: 2,
  },

  notMedicalInformation: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 13,
    marginTop: 2,
    textAlign: "justify",
    paddingHorizontal: 16,
  },

  // ==================================================
  // Alarm
  // ==================================================

  alarmCard: {
    backgroundColor: "#FFE5E5",
    borderLeftWidth: 5,
    borderLeftColor: "#FF3B30",
    padding: 10,
    borderRadius: 12,
    marginBottom: 13,
  },

  alarmTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF3B30",
    marginBottom: 6,
  },

  alarmText: {
    fontSize: 15,
    color: "#D70000",
    fontWeight: "500",
    marginBottom: 3,
  },

  alarmFlashOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "#FF3B30",
  zIndex: 10,
},
warningContent: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  elevation: 1000,
},

warningText: {
  fontSize: 28,
  fontWeight: "bold",
  color: "#FF3B30",
  letterSpacing: 2,
},


  // ==================================================
  // Cards
  // ==================================================

  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 13,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,

    elevation: 3,
  },

  cardLabel: {
    fontSize: 14.7,
    color: "#8E8E93",
    fontWeight: "600",
    marginBottom: 4,
  },

  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1C1E",
  },

  subText: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 4,
  },

  timerValue: {
    fontSize: 22,
    fontWeight: "bold",
  },

  row: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },

  sensorRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },

  thirdCard: {
    flex: 1,
    minHeight: 90,
    justifyContent: "center",
  },

  pressureCard: {
    flex: 1,
    minHeight: 90,
    justifyContent: "center",
  },

  twoThirdsCard: {
    flex: 2,
    minHeight: 90,
    justifyContent: "center",
  },

  // ==================================================
  // Position
  // ==================================================

  positionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  badgeContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },

  humidBadge: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0288D1",
    backgroundColor: "#E0F7FA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  tempBadge: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF3B30",
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  // ==================================================
  // Cushion
  // ==================================================

  cushionContainer: {
    height: 150,
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#333333",
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    overflow: "hidden",
    padding: 2,
  },

  warningBorder: {
    borderColor: "#FF3B30",
    borderWidth: 3,
  },

  cushionHalf: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F3F5",
  },

  leftHalf: {
    borderRightWidth: 1,
    borderRightColor: "#c3c5c9",
    borderStyle: "dashed",
  },

  rightHalf: {},

  activePressureHalf: {
    backgroundColor: "#FFD8D8",
  },

  heatSpot: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: "#FF8A80",
    opacity: 0.85,
  },

  centerCushionContainer: {
    borderColor: "#34C759",
    borderWidth: 2.5,
  },

  centerPressureHalf: {
    backgroundColor: "#E8F5E9",
  },

  centerHeatSpot: {
    backgroundColor: "#81C784",
  },

  // ==================================================
  // Temperature
  // ==================================================

  tempWarningCard: {
    backgroundColor: "#FFF0F0",
  },

  tempWarningText: {
    color: "#FF3B30",
  },

  // ==================================================
  // Humidity
  // ==================================================

  humidWarningCard: {
    backgroundColor: "#E0F7FA",
  },

  humidWarningBorder: {
    borderColor: "#0288D1",
    borderWidth: 3,
  },

  humidWarningText: {
    color: "#0288D1",
  },
});