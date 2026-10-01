import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
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
      <View style={styles.header}>
        <Text style={styles.title}>Select Patient</Text>

        <Text style={styles.logo}>
          Cushion <Text style={styles.sense}>Sense</Text>
        </Text>
      </View>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },

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
