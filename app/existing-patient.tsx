import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BLUE = "#4966D5";

type Patient = {
  patientId: string;
  name: string;
  citizenId: string;
  gender: string;
  age: string;
  phone: string;
};

export default function ExistingPatientScreen() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  // =========================================================
  // โหลด Patient List
  // =========================================================

  const loadPatients = async () => {
    try {
      const data = await AsyncStorage.getItem("patientList");

      if (!data) {
        setPatients([]);
        return;
      }

      const patientData = JSON.parse(data);

      if (Array.isArray(patientData)) {
        setPatients(patientData);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error("ไม่สามารถโหลดข้อมูลผู้ป่วยได้:", error);

      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // โหลดใหม่ทุกครั้งที่กลับเข้าหน้านี้
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPatients();
    }, []),
  );

  // =========================================================
  // เลือกผู้ป่วย
  // =========================================================

  const selectPatient = async (patient: Patient) => {
    // ใช้ Citizen ID เป็นตัวระบุผู้ป่วย
    // เพราะ Patient ID สามารถว่างได้
    setSelectedId(patient.citizenId);

    try {
      // บันทึกผู้ป่วยที่กำลังเลือก
      await AsyncStorage.setItem("selectedPatientId", patient.citizenId);

      // เก็บข้อมูลผู้ป่วยปัจจุบัน
      await AsyncStorage.setItem("patientInfo", JSON.stringify(patient));

      // รอเล็กน้อยเพื่อให้เห็นขอบสีฟ้า
      setTimeout(() => {
        router.replace({
          pathname: "/patient-info",

          // สำคัญมาก:
          // patient-info รับค่าเป็น citizenId
          params: {
            citizenId: patient.citizenId,
          },
        });
      }, 150);
    } catch (error) {
      console.error("ไม่สามารถเลือกผู้ป่วยได้:", error);
    }
  };

  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BLUE} />
      </View>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <Text style={styles.title}>Select Patient</Text>

        <Text style={styles.subtitle}>เลือกผู้ป่วย</Text>
      </View>

      {/* Patient List */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {patients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>ไม่พบข้อมูลผู้ป่วย</Text>
          </View>
        ) : (
          patients.map((patient, index) => {
            // ใช้ Citizen ID เป็นตัวตรวจว่ากำลังเลือกใคร
            const isSelected = selectedId === patient.citizenId;

            return (
              <TouchableOpacity
                key={`${patient.citizenId}-${index}`}
                activeOpacity={0.8}
                onPress={() => selectPatient(patient)}
                style={[styles.patientCard, isSelected && styles.selectedCard]}
              >
                {/* Patient Information */}

                <View style={styles.patientInfo}>
                  {/* Name */}

                  <Text style={styles.patientName}>{patient.name}</Text>

                  {/* Patient ID */}

                  <Text style={styles.patientText}>
                    Patient ID: {patient.patientId || "-"}
                  </Text>

                  {/* Citizen ID */}

                  <Text style={styles.patientText}>
                    เลขบัตรประชาชน: {patient.citizenId}
                  </Text>

                  {/* Gender */}

                  <Text style={styles.patientText}>เพศ: {patient.gender}</Text>

                  {/* Age */}

                  <Text style={styles.patientText}>อายุ: {patient.age} ปี</Text>

                  {/* Phone */}

                  <Text style={styles.patientText}>
                    เบอร์โทรศัพท์: {patient.phone}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// =========================================================
// Styles
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 25,
    paddingTop: 45,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 25,
  },

  title: {
    fontSize: 38,
    fontWeight: "700",
    color: BLUE,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: "#888",
    marginTop: 4,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },

  emptyText: {
    fontSize: 17,
    color: "#888",
  },

  // ============================
  // Patient Card
  // ============================

  patientCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D5D5D5",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },

  selectedCard: {
    borderColor: BLUE,
    borderWidth: 3,
  },

  patientInfo: {
    width: "100%",
  },

  patientName: {
    fontSize: 21,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },

  patientText: {
    fontSize: 15,
    color: "#666",
    marginBottom: 5,
  },
});
