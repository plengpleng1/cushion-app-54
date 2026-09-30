import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [idCard, setIdCard] = useState("");
  const [username, setUsername] = useState("");

  // ดึงข้อมูลผู้ใช้เมื่อสลับมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      const loadProfileData = async () => {
        try {
          // 1. ดึงข้อมูลผู้ป่วยจากคีย์ "patientInfo"
          const patientDataJson = await AsyncStorage.getItem("patientInfo");
          if (patientDataJson) {
            const patientData = JSON.parse(patientDataJson);
            setFullName(patientData.name || "");
            setIdCard(patientData.citizenId || "");
          }

          // 2. ดึง Username
          const currentUserJson = await AsyncStorage.getItem("@current_user");
          if (currentUserJson) {
            const currentUser = JSON.parse(currentUserJson);
            setUsername(currentUser.username || "");
          }
        } catch (error) {
          console.error("Failed to load profile data:", error);
        }
      };

      loadProfileData();
    }, []),
  );

  // ฟังก์ชันสลับหน้ากลับไป Login
  const performLogout = async () => {
    try {
      await AsyncStorage.removeItem("@current_user");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace("/login");
    }
  };

  // ฟังก์ชัน Log Out
  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to log out?")) {
        performLogout();
      }
    } else {
      Alert.alert("Log Out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: performLogout },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* แยกสไตล์ Cushion (หนา) และ Sense (บาง) */}
        <Text style={styles.brandTitle}>
          <Text style={styles.brandBold}>Cushion </Text>
          <Text style={styles.brandLight}>Sense</Text>
        </Text>

        <View style={styles.cardContainer}>
          {/* ช่องที่ 1: ชื่อ - นามสกุล */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{fullName || "ชื่อ - นามสกุล"}</Text>
          </View>

          {/* ช่องที่ 2: เลขบัตรประจำตัวประชาชน */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{idCard || "เลขประชาชน"}</Text>
          </View>

          {/* ช่องที่ 3: Username */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {username ? `Username : ${username}` : "Username"}
            </Text>
          </View>

          {/* ปุ่ม Log out */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  brandTitle: {
    marginBottom: 32,
    textAlign: "center",
  },

  brandBold: {
    fontSize: 33,
    fontStyle: "italic",
    fontWeight: "700",
    color: "#4464D0",
  },

  brandLight: {
    fontSize: 33,
    fontStyle: "italic",
    fontWeight: "400",
    color: "#4464D0",
  },

  cardContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 15,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },

  infoBox: {
    width: "100%",
    height: 60,
    borderWidth: 1,
    borderColor: "#C9C9C9",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
  },

  infoText: {
    fontSize: 17,
    color: "#333333",
  },

  logoutButton: {
    width: "100%",
    height: 60,
    backgroundColor: "#C82828",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 5,
  },

  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
});
