import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const STORAGE_CURRENT_USER = "@cushionsense_current_user";

export default function ProfileScreen() {
  const router = useRouter();

  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          // 1. ดึงข้อมูลจาก Supabase Auth
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const fetchedEmail = user.email || "";
            const fetchedUsername = user.user_metadata?.username || "";

            setEmail(fetchedEmail);
            setUsername(fetchedUsername);
            return;
          }

          // 2. ดึงข้อมูลจาก AsyncStorage (กรณีล็อกอินแบบ Local/Custom)
          const currentUserJson =
            await AsyncStorage.getItem(STORAGE_CURRENT_USER);

          if (currentUserJson) {
            const currentUser = JSON.parse(currentUserJson);

            setUsername(currentUser.username || "");

            // ซ่อน email ภายในระบบถ้ามี
            if (
              currentUser.email &&
              !currentUser.email.includes("@cushionsense.internal")
            ) {
              setEmail(currentUser.email);
            } else {
              setEmail("");
            }
            return;
          }

          setUsername("");
          setEmail("");
        } catch (error) {
          console.error("Failed to load profile:", error);
          setUsername("");
          setEmail("");
        }
      };

      loadProfile();
    }, []),
  );

  const performLogout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem(STORAGE_CURRENT_USER);
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace("/login");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
        performLogout();
      }
    } else {
      Alert.alert("Sign Out", "ต้องการออกจากระบบใช่หรือไม่?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: performLogout,
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* แก้ไขส่วน Logo: ถอดแท็ก <Text> ออกเพื่อไม่ให้ Layout เพี้ยน */}
        <Image
          source={require("../../assets/images/cushion.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <View style={styles.cardContainer}>
          {/* แสดง Username */}
          {username ? (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Username</Text>

              <View style={styles.infoBoxWrapper}>
                <Text style={styles.infoText}>{username}</Text>
              </View>
            </View>
          ) : null}

          {/* แสดง Email */}
          {email ? (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>

              <View style={styles.infoBoxWrapper}>
                <Text style={styles.infoText}>{email}</Text>
              </View>
            </View>
          ) : null}

          {/* ปุ่ม Sign Out */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F9",
  },
  content: {
    flex: 1,
    justifyContent: "flex-start", // เปลี่ยนจาก center ให้จัดเรียงชิดด้านบน
    alignItems: "center",
    paddingHorizontal: 24,
    // ปรับค่านี้เพิ่มขึ้นหรือลดลงเพื่อขยับภาพรวมทั้งก้อนขึ้น-ลงได้ตามชอบ
  },
  logoImage: {
    width: "140%",
    maxWidth: 900,
    height: 120,
    alignSelf: "center",
    marginBottom: 20,
    marginTop: 65, // เพิ่มค่าติดลบ เช่น -20 หรือลดลงได้ถ้าต้องการให้ชิดขอบบนมากขึ้นอีก
  },
  cardContainer: {
    width: "100%",
    maxWidth: 400, // ปรับขนาดการ์ดให้พอดี ไม่กว้างเกินไป
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 0, // เอาค่าติดลบ -110 ออก
  },
  infoBoxWrapper: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    borderColor: "#D1D5DB",
  },
  infoText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333333",
  },
  logoutButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#C82828",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  fieldContainer: {
    width: "100%",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 6,
  },
});
