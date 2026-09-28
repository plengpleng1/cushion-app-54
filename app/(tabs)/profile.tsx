import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();

  // State สำหรับเก็บข้อมูลที่จะแสดงผล
  const [fullName, setFullName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [username, setUsername] = useState('');

  // ดึงข้อมูลเมื่อเข้าสู่หน้า Profile
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // 1. ดึง ชื่อ - นามสกุล และ เลขบัตรประชาชน จาก @patient_info
        const patientDataJson = await AsyncStorage.getItem('@patient_info');
        if (patientDataJson) {
          const patientData = JSON.parse(patientDataJson);
          setFullName(patientData.fullName || '');
          setIdCard(patientData.idCard || '');
        }

        // 2. ดึง Username จาก @current_user
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
  }, []);

  // ฟังก์ชัน Log out และเปลี่ยนกลับไปหน้า Login
  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            // 1. ลบ Session ผู้ใช้ปัจจุบันออก
            await AsyncStorage.removeItem('@current_user');
            
            // 2. เคลียร์ History Stack แล้วนำทางกลับไปหน้า /login
            if (router.canDismiss()) {
              router.dismissAll();
            }
            router.replace('/login');
          } catch (error) {
            // กรณีรันบนเว็บหรือ Alert มีปัญหา ให้บังคับย้ายหน้าทันที
            router.replace('/login');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* หัวข้อ Cushion Sense */}
        <Text style={styles.brandTitle}>Cushion Sense</Text>

        <View style={styles.cardContainer}>
          {/* ช่องที่ 1: ชื่อ - นามสกุล */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{fullName || 'ชื่อ - นามสกุล'}</Text>
          </View>

          {/* ช่องที่ 2: เลขบัตรประจำตัวประชาชน */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{idCard || 'เลขประชาชน'}</Text>
          </View>

          {/* ช่องที่ 3: Username : <ชื่อผู้ใช้> */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {username ? `Username : ${username}` : 'Username'}
            </Text>
          </View>

          {/* ปุ่ม Log out สีแดง */}
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