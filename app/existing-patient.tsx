import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

const BLUE = "#2D69CA";

type Patient = {
  id: string;
  patientId: string | null;
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
  // โหลด Patient ของ User ที่ Login อยู่
  // =========================================================

  const loadPatients = async () => {
    try {
      setLoading(true);

      // =====================================================
      // Get Current User
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("ไม่พบผู้ใช้งาน", "กรุณา Login ใหม่");

        router.replace("/login");
        return;
      }

      // =====================================================
      // Load Patients
      // =====================================================

      const { data, error } = await supabase
        .from("user_patients")
        .select("id, patient_id, name, citizen_id, gender, age, phone")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load patients error:", error);

        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลผู้ป่วยได้");

        setPatients([]);
        return;
      }

      const formattedPatients: Patient[] = (
        (data ?? []) as unknown as {
          id: string;
          patient_id: string | null;
          name: string | null;
          citizen_id: string | null;
          gender: string | null;
          age: string | null;
          phone: string | null;
        }[]
      ).map((patient) => ({
        id: patient.id,
        patientId: patient.patient_id,
        name: patient.name ?? "",
        citizenId: patient.citizen_id ?? "",
        gender: patient.gender ?? "",
        age: patient.age ?? "",
        phone: patient.phone ?? "",
      }));

      setPatients(formattedPatients);
    } catch (error) {
      console.error("Load patients error:", error);

      setPatients([]);

      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลผู้ป่วยได้");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // โหลดใหม่ทุกครั้งที่กลับเข้าหน้า
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, []),
  );

  // =========================================================
  // เลือก Patient
  // =========================================================

  const selectPatient = (patient: Patient) => {
    setSelectedId(patient.citizenId);

    // ส่ง citizenId ไปยัง patient-info
    router.replace({
      pathname: "/patient-info",
      params: {
        citizenId: patient.citizenId,
        from: "existing",
      },
    });
  };

  // =========================================================
  // Header
  // =========================================================

  const headerOptions = {
    headerShown: true,

    // ลบคำว่า Existing Patient ออกจากด้านบน
    title: "",

    headerTitleAlign: "left" as const,

    // ลูกศร + Logo อยู่ด้านบนซ้าย
    headerLeft: () => (
      <View style={styles.headerLeftContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>

        <Image
          source={require("../assets/images/cushion.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>
    ),

    // ไม่มีอะไรด้านขวา
    headerRight: () => null,
  };

  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      </>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      {/* =====================================================
          Header
          ===================================================== */}

      <Stack.Screen options={headerOptions} />

      <View style={styles.container}>
        {/* ===================================================
            Page Title
            =================================================== */}

        <View style={styles.header}>
          <Text style={styles.title}>Select Patient</Text>

          <Text style={styles.subtitle}>กรุณาเลือกผู้ป่วย</Text>
        </View>

        {/* ===================================================
            Patient List
            =================================================== */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {patients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>ไม่พบข้อมูลผู้ป่วย</Text>
            </View>
          ) : (
            patients.map((patient) => {
              const isSelected = selectedId === patient.citizenId;

              return (
                <TouchableOpacity
                  key={patient.id}
                  activeOpacity={0.8}
                  onPress={() => selectPatient(patient)}
                  style={[
                    styles.patientCard,
                    isSelected && styles.selectedCard,
                  ]}
                >
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patient.name}</Text>

                    <Text style={styles.patientText}>
                      Patient ID : {patient.patientId || "-"}
                    </Text>

                    <Text style={styles.patientText}>
                      เลขบัตรประชาชน : {patient.citizenId}
                    </Text>

                    <Text style={styles.patientText}>
                      เพศ : {patient.gender}
                    </Text>

                    <Text style={styles.patientText}>
                      อายุ : {patient.age} ปี
                    </Text>

                    <Text style={styles.patientText}>
                      เบอร์โทรศัพท์ : {patient.phone}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </>
  );
}

// =========================================================
// Styles
// =========================================================

const styles = StyleSheet.create({
  // =======================================================
  // ลูกศร + Logo ด้านซ้ายบน
  // =======================================================

  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 5,
  },

  backButton: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
  },

  headerLogo: {
    width: 105,
    height: 35,
    marginLeft: 5,
  },

  // =======================================================
  // Main Container
  // =======================================================

  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 25,
    paddingTop: 45,
  },

  // =======================================================
  // Loading
  // =======================================================

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  // =======================================================
  // Header
  // =======================================================

  header: {
    alignItems: "center",
    marginBottom: 25,
  },

  title: {
    fontSize: 37,
    fontWeight: "700",
    color: BLUE,
    textAlign: "center",
    marginTop: -10,
  },

  subtitle: {
    fontSize: 15,
    color: "#888",
    marginTop: 4,
  },

  // =======================================================
  // Scroll
  // =======================================================

  scrollView: {
    flex: 1,
    marginRight: -20,
  },

  scrollContent: {
    paddingBottom: 40,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  // =======================================================
  // Empty
  // =======================================================

  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },

  emptyText: {
    fontSize: 17,
    color: "#888",
  },

  // =======================================================
  // Patient Card
  // =======================================================

  patientCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    marginTop: -8,
    marginLeft: -15,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
});
