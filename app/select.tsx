import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

const BLUE = "#4966D5";

export default function SelectScreen() {
  const router = useRouter();

  const [hasPatients, setHasPatients] = useState(false);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // ตรวจสอบว่ามี Patient หรือไม่
  // =========================================================

  const checkPatients = async () => {
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
        console.error("ไม่พบ User ที่ Login อยู่:", userError);

        setHasPatients(false);
        return;
      }

      // =====================================================
      // ตรวจ Patient ของ User นี้
      // =====================================================

      const { count, error } = await supabase
        .from("user_patients")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("ไม่สามารถตรวจสอบ Patient List ได้:", error);

        setHasPatients(false);
        return;
      }

      setHasPatients((count ?? 0) > 0);
    } catch (error) {
      console.error("เกิดข้อผิดพลาด:", error);

      setHasPatients(false);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // โหลดใหม่ทุกครั้งที่กลับเข้าหน้า
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      checkPatients();
    }, []),
  );

  // =========================================================
  // New Patient
  // =========================================================

  const goToNewPatient = () => {
    router.push("/patient-info");
  };

  // =========================================================
  // Existing Patient
  // =========================================================

  const goToExistingPatient = () => {
    if (!hasPatients) return;

    router.push("/existing-patient");
  };

  // =========================================================
  // Header
  // =========================================================

  const headerOptions = {
    headerShown: true,
    title: "Select",
    headerTitleAlign: "left" as const,

    // ลูกศรย้อนกลับ
    headerLeft: () => (
      <TouchableOpacity
        onPress={() => router.replace("/login")}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#222222" />
      </TouchableOpacity>
    ),

    // Logo ด้านขวา
    headerRight: () => (
      <Image
        source={require("../assets/images/logo-app.jpg")}
        style={styles.headerLogo}
        resizeMode="contain"
      />
    ),
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
      <Stack.Screen options={headerOptions} />

      <View style={styles.container}>
        {/* ===================================================
            Page Title
            =================================================== */}

        <View style={styles.header}>
          <Text style={styles.title}>Select Patient</Text>

          <Text style={styles.logo}>
            Cushion <Text style={styles.sense}>Sense</Text>
          </Text>
        </View>

        {/* ===================================================
            Buttons
            =================================================== */}

        <View style={styles.card}>
          {/* Existing Patient */}

          <TouchableOpacity
            style={[styles.button, !hasPatients && styles.disabledButton]}
            disabled={!hasPatients}
            onPress={goToExistingPatient}
          >
            <Text
              style={[styles.buttonText, !hasPatients && styles.disabledText]}
            >
              Existing Patient
            </Text>
          </TouchableOpacity>

          {/* New Patient */}

          <TouchableOpacity style={styles.button} onPress={goToNewPatient}>
            <Text style={styles.buttonText}>New Patient</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

// =========================================================
// Styles
// =========================================================

const styles = StyleSheet.create({
  // =======================================================
  // Logo ด้านขวาบน
  // เหมือน Existing Patient
  // =======================================================

  headerLogo: {
    width: 105,
    height: 35,
    marginRight: 25,
  },

  // =======================================================
  // ลูกศรด้านซ้ายบน
  // =======================================================

  backButton: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },

  // =======================================================
  // Main Container
  // =======================================================

  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  // =======================================================
  // Loading
  // =======================================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },

  // =======================================================
  // Page Header
  // =======================================================

  header: {
    alignItems: "center",
    marginBottom: 35,
  },

  title: {
    fontSize: 38,
    fontWeight: "700",
    color: BLUE,
    marginBottom: 4,
  },

  logo: {
    fontSize: 32,
    fontStyle: "italic",
    fontWeight: "700",
    color: BLUE,
  },

  sense: {
    fontStyle: "italic",
    fontWeight: "400",
  },

  // =======================================================
  // Card
  // =======================================================

  card: {
    width: "100%",
    maxWidth: 475,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 15,
    paddingHorizontal: 38,
    paddingVertical: 35,
  },

  // =======================================================
  // Button
  // =======================================================

  button: {
    height: 60,
    width: "100%",
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  disabledButton: {
    backgroundColor: "#D5D5D5",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "600",
  },

  disabledText: {
    color: "#888888",
  },
});
