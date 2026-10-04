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
        {/* Logo */}
        <Text style={styles.logoImage}>
          <Image
            source={require("../../assets/images/cushion.png")} // เปลี่ยน path ไปยังไฟล์รูปโลโก้ของคุณ
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Text>

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
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoImage: {
    width: 325, // ปรับความกว้างของโลโก้ตามต้องการ
    height: 200, // ปรับความสูงของโลโก้ตามสัดส่วนจริง
    alignSelf: "center", // จัดให้อยู่กึ่งกลางหน้าจอ
    marginTop: -80,
    marginLeft: 3,
  },
  cardContainer: {
    width: "108%",
    maxWidth: 470,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 30,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: -110,
  },
  infoBoxWrapper: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    padding: -5,
    marginBottom: 15,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "flex-start",

    overflow: "hidden",
    borderColor: "#D1D5DB",
  },
  infoScrollContent: {
    alignItems: "center",
    paddingHorizontal: 16,
    flexGrow: 1,
    justifyContent: "center",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginLeft: 8,
  },
  logoutButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#C82828",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 8,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  fieldContainer: {
    width: "100%",
    marginBottom: -5,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 6,
  },
});
