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

  const [displayType, setDisplayType] = useState<"username" | "email" | "">("");
  const [displayValue, setDisplayValue] = useState("");

  // โหลดข้อมูลผู้ใช้ทุกครั้งที่เข้าหน้า Profile
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const currentUserJson = await AsyncStorage.getItem("@current_user");

          if (!currentUserJson) {
            setDisplayType("");
            setDisplayValue("");
            return;
          }

          const currentUser = JSON.parse(currentUserJson);

          const email = currentUser.email || "";
          const username = currentUser.username || "";

          // ถ้ามี loginType
          if (currentUser.loginType === "username") {
            setDisplayType("username");
            setDisplayValue(username);
            return;
          }

          if (currentUser.loginType === "email") {
            setDisplayType("email");
            setDisplayValue(email);
            return;
          }

          // ถ้าไม่มี loginType
          // Username จะถูกแปลงเป็น @cushionsense.local
          if (email.endsWith("@cushionsense.local")) {
            setDisplayType("username");
            setDisplayValue(username);
            return;
          }

          // Email จริง
          if (email) {
            setDisplayType("email");
            setDisplayValue(email);
            return;
          }

          // กรณีมีแค่ Username
          if (username) {
            setDisplayType("username");
            setDisplayValue(username);
            return;
          }

          setDisplayType("");
          setDisplayValue("");
        } catch (error) {
          console.error("Failed to load profile:", error);

          setDisplayType("");
          setDisplayValue("");
        }
      };

      loadProfile();
    }, []),
  );

  // =========================
  // LOG OUT
  // =========================
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

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to log out?")) {
        performLogout();
      }
    } else {
      Alert.alert("Log Out", "Are you sure you want to log out?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: performLogout,
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Text style={styles.brandTitle}>
          <Text style={styles.brandBold}>Cushion </Text>

          <Text style={styles.brandLight}>Sense</Text>
        </Text>

        <View style={styles.cardContainer}>
          {/* Username */}
          {displayType === "username" && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{displayValue}</Text>
            </View>
          )}

          {/* Email */}
          {displayType === "email" && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{displayValue}</Text>
            </View>
          )}

          {/* Log out */}
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
    paddingHorizontal: 30,
    paddingVertical: 30,
  },

  infoBox: {
    width: "100%",
    minHeight: 60,
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
