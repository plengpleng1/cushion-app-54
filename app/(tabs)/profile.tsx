import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
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
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            const fetchedEmail = user.email || "";
            const fetchedUsername = user.user_metadata?.username || "";

            setEmail(fetchedEmail);
            setUsername(fetchedUsername);
            return;
          }

          // 2. ดึงข้อมูลจาก AsyncStorage (กรณีล็อกอินแบบ Local/Custom)
          const currentUserJson = await AsyncStorage.getItem(STORAGE_CURRENT_USER);

          if (currentUserJson) {
            const currentUser = JSON.parse(currentUserJson);

            setUsername(currentUser.username || "");
            
            // ซ่อน email ภายในระบบถ้ามี
            if (currentUser.email && !currentUser.email.includes("@cushionsense.internal")) {
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
    }, [])
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
      if (window.confirm("Are you sure you want to sign out?")) {
        performLogout();
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
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
          source={require('../../assets/images/cushion.png')} // เปลี่ยน path ไปยังไฟล์รูปโลโก้ของคุณ
          style={styles.logoImage}
          resizeMode="contain"
        />
        </Text>

        <View style={styles.cardContainer}>
          {/* แสดง Username */}
          {username ? (
            <View style={styles.infoBoxWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.infoScrollContent}
              >
                <Text style={styles.infoText}>Username: {username}</Text>
              </ScrollView>
            </View>
          ) : null}

          {/* แสดง Email */}
          {email ? (
            <View style={styles.infoBoxWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.infoScrollContent}
              >
                <Text style={styles.infoText}>Email: {email}</Text>
              </ScrollView>
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
    width: 350,  // ปรับความกว้างของโลโก้ตามต้องการ
    height: 200,  // ปรับความสูงของโลโก้ตามสัดส่วนจริง
    alignSelf: 'center', // จัดให้อยู่กึ่งกลางหน้าจอ
    marginBottom: 5,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 355,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 30,
  },
  infoBoxWrapper: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#C9C9C9",
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    overflow: "hidden",
  },
  infoScrollContent: {
    alignItems: "center",
    paddingHorizontal: 16,
    flexGrow: 1,
    justifyContent: "center",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  logoutButton: {
    width: "100%",
    height: 70,
    backgroundColor: "#C82828",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 8,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});