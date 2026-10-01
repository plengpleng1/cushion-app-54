import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
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

  const [displayValue, setDisplayValue] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            if (user.app_metadata?.provider === "google" || user.email?.endsWith("@gmail.com")) {
              setDisplayValue(user.email || "");
              return;
            }

            if (user.user_metadata?.username) {
              setDisplayValue(user.user_metadata.username);
              return;
            }
          }

          const currentUserJson = await AsyncStorage.getItem(STORAGE_CURRENT_USER);

          if (currentUserJson) {
            const currentUser = JSON.parse(currentUserJson);

            if (currentUser.type === "google" && currentUser.email) {
              setDisplayValue(currentUser.email);
              return;
            }

            if (currentUser.username) {
              setDisplayValue(currentUser.username);
              return;
            }

            if (currentUser.email && !currentUser.email.includes("@cushionsense.internal")) {
              setDisplayValue(currentUser.email);
              return;
            }
          }

          setDisplayValue("");
        } catch (error) {
          console.error("Failed to load profile:", error);
          setDisplayValue("");
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
          {/* แสดง Username หรือ Email แบบเลื่อนซ้าย-ขวาได้ */}
          {displayValue ? (
            <View style={styles.infoBoxWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.infoScrollContent}
              >
                <Text style={styles.infoText}>{displayValue}</Text>
              </ScrollView>
            </View>
          ) : null}

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
  infoBoxWrapper: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#C9C9C9",
    borderRadius: 10,
    marginBottom: 20,
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
    height: 50,
    backgroundColor: "#C82828",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});