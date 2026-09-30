import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BLUE = "#4966D5";

export default function SelectScreen() {
  const router = useRouter();

  const [hasPatients, setHasPatients] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPatients = async () => {
    try {
      const data = await AsyncStorage.getItem("patientList");

      if (!data) {
        setHasPatients(false);
        return;
      }

      const patients = JSON.parse(data);

      setHasPatients(Array.isArray(patients) && patients.length > 0);
    } catch (error) {
      console.error("ไม่สามารถโหลด Patient List ได้:", error);

      setHasPatients(false);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      checkPatients();
    }, []),
  );

  const goToNewPatient = () => {
    router.push("/patient-info");
  };

  // เปลี่ยนตรงนี้
  const goToExistingPatient = () => {
    router.push("/existing-patient");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BLUE} />
      </View>
    );
  }

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
