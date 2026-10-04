import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

const BLUE = "#2D69CA";

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
    router.push({
      pathname: "/patient-info",
      params: {
        from: "select",
      },
    });
  };

  // =========================================================
  // Existing Patient
  // =========================================================

  const goToExistingPatient = () => {
    if (!hasPatients) return;

    router.push("/existing-patient");
  };

  // =========================================================
  // Logout
  // =========================================================

  const handleLogout = async () => {
    try {
      // =====================================================
      // Web
      // =====================================================

      if (Platform.OS === "web") {
        const confirmed = window.confirm("ต้องการออกจากระบบใช่หรือไม่?");

        if (!confirmed) {
          return;
        }

        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error("Logout Error:", error);
          window.alert("ไม่สามารถออกจากระบบได้ กรุณาลองอีกครั้ง");
          return;
        }

        // กลับหน้า Login
        router.replace("/login");
        return;
      }

      // =====================================================
      // Mobile / iOS / Android
      // =====================================================

      Alert.alert("Logout", "Are you sure you want to sign out?", [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ยืนยัน",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.auth.signOut();

            if (error) {
              console.error("Logout Error:", error);

              Alert.alert(
                "เกิดข้อผิดพลาด",
                "ไม่สามารถออกจากระบบได้ กรุณาลองอีกครั้ง",
              );

              return;
            }

            // กลับหน้า Login
            router.replace("/login");
          },
        },
      ]);
    } catch (error) {
      console.error("Logout Error:", error);

      if (Platform.OS === "web") {
        window.alert("ไม่สามารถออกจากระบบได้ กรุณาลองอีกครั้ง");
      } else {
        Alert.alert(
          "เกิดข้อผิดพลาด",
          "ไม่สามารถออกจากระบบได้ กรุณาลองอีกครั้ง",
        );
      }
    }
  };

  // =========================================================
  // Header
  // =========================================================

  const headerOptions = {
    headerShown: true,
    title: "",
    headerTitleAlign: "left" as const,

    // =====================================================
    // Logo ด้านซ้าย
    // =====================================================

    headerLeft: () => (
      <Image
        source={require("../assets/images/cushion.png")}
        style={styles.headerLogo}
        resizeMode="contain"
      />
    ),

    // =====================================================
    // Logout ด้านขวา
    // =====================================================

    headerRight: () => (
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <FontAwesome6 name="power-off" size={18} color="#222222" />
      </TouchableOpacity>
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

          <Text style={styles.subtitle}>กรุณาเลือกผู้ป่วย</Text>
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
  // Logo ด้านซ้ายบน
  // =======================================================

  headerLogo: {
    width: 105,
    height: 35,
    marginLeft: 55,
  },

  // =======================================================
  // Logout ด้านขวาบน
  // =======================================================

  logoutButton: {
    width: 45,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  logoutText: {
    color: "#444444",
    fontSize: 15,
    fontWeight: "600",
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
    marginBottom: 25,
  },

  title: {
    fontSize: 37,
    fontWeight: "700",
    color: BLUE,
    marginTop: -232,
  },

  subtitle: {
    fontSize: 15,
    color: "#888",
    marginTop: 5,
    textAlign: "center",
  },

  // =======================================================
  // Card
  // =======================================================

  card: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 15,
    marginTop: -162,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // =======================================================
  // Button
  // =======================================================

  button: {
    height: 50,
    width: "100%",
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
    marginTop: 12,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  disabledButton: {
    backgroundColor: "#D5D5D5",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "500",
  },

  disabledText: {
    color: "#888888",
  },
});
