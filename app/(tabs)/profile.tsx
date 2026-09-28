import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [username, setUsername] = useState('');

  // ดึงข้อมูลผู้ใช้เมื่อสลับมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      const loadProfileData = async () => {
        try {
          const patientDataJson = await AsyncStorage.getItem('@patient_info');
          if (patientDataJson) {
            const patientData = JSON.parse(patientDataJson);
            setFullName(patientData.fullName || '');
            setIdCard(patientData.idCard || '');
          }

          const currentUserJson = await AsyncStorage.getItem('@current_user');
          if (currentUserJson) {
            const currentUser = JSON.parse(currentUserJson);
            setUsername(currentUser.username || '');
          }
        } catch (error) {
          console.error('Failed to load profile data:', error);
        }
      };

      loadProfileData();
    }, [])
  );

  // ฟังก์ชันบังคับออกจากระบบและกลับหน้า Login
  const performLogout = async () => {
    try {
      // 1. ลบข้อมูลผู้ใช้ปัจจุบัน
      await AsyncStorage.removeItem('@current_user');
    } catch (error) {
      console.error('Logout storage error:', error);
    } finally {
      // 2. เคลียร์ Stack และบังคับย้ายไปหน้า Login ทันที
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/login');
    }
  };

  // ฟังก์ชันกด Log out
  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // บน Web ใช้ confirm ของ browser
      if (window.confirm('Are you sure you want to log out?')) {
        performLogout();
      }
    } else {
      // บน Mobile ใช้ Alert
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: performLogout,
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brandTitle}>Cushion Sense</Text>

        <View style={styles.cardContainer}>
          {/* ชื่อ - นามสกุล */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{fullName || 'ชื่อ - นามสกุล'}</Text>
          </View>

          {/* เลขบัตรประชาชน */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{idCard || 'เลขประชาชน'}</Text>
          </View>

          {/* Username */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {username ? `Username : ${username}` : 'Username'}
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#4464D0',
    marginBottom: 32,
    textAlign: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
  },
  infoBox: {
    height: 52,
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  infoText: {
    fontSize: 16,
    color: '#333333',
  },
  logoutButton: {
    height: 48,
    backgroundColor: '#C82828',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 12,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});