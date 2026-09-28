import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 1. ฟังก์ชันสมัครสมาชิก (Sign Up)
  const handleSignUp = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณากรอก Username และ Password ให้ครบถ้วน');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('รหัสผ่านไม่ตรงกัน', 'กรุณายืนยัน Password ให้ตรงกัน');
      return;
    }

    try {
      // ดึงรายชื่อผู้ใช้ที่เคยสมัครไว้ใน AsyncStorage
      const existingUsersJson = await AsyncStorage.getItem('@user_accounts');
      const users = existingUsersJson ? JSON.parse(existingUsersJson) : [];

      // เช็คว่า Username ซ้ำหรือไม่
      const isExist = users.some((u: any) => u.username === username);
      if (isExist) {
        Alert.alert('สมัครไม่สำเร็จ', 'Username นี้ถูกใช้งานแล้ว');
        return;
      }

      // บันทึกผู้ใช้ใหม่ลงใน Array
      users.push({ username, password });
      await AsyncStorage.setItem('@user_accounts', JSON.stringify(users));

      Alert.alert('สำเร็จ', 'สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ');

      // ล้างช่อง Password และสลับกลับมาโหมด Sign In อัตโนมัติ
      setPassword('');
      setConfirmPassword('');
      setIsSignUp(false);
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  // 2. ฟังก์ชันเข้าสู่ระบบ (Sign In)
  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณากรอก Username และ Password');
      return;
    }

    try {
      const existingUsersJson = await AsyncStorage.getItem('@user_accounts');
      const users = existingUsersJson ? JSON.parse(existingUsersJson) : [];

      // ตรวจสอบ Username และ Password กับข้อมูลที่เคย Sign Up ไว้
      const foundUser = users.find(
        (u: any) => u.username === username && u.password === password
      );

      if (foundUser) {
        // บันทึก session ผู้ใช้ปัจจุบันแล้วข้ามไปหน้า Patient Info
        await AsyncStorage.setItem('@current_user', JSON.stringify(foundUser));
        router.push('/patient-info');
      } else {
        Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'Username หรือ Password ไม่ถูกต้อง');
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'เกิดปัญหาในการตรวจสอบข้อมูล');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.brandText}>Cushion Sense</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Username Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#A0A0A0"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Confirm Password (แสดงเฉพาะโหมด Sign Up) */}
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={isSignUp ? handleSignUp : handleSignIn}
            >
              <Text style={styles.primaryButtonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Switch Mode Button */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.toggleLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#4464D0',
    textAlign: 'center',
  },
  brandText: {
    fontSize: 32,
    fontStyle: 'italic',
    fontWeight: '500',
    color: '#4464D0',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  primaryButton: {
    height: 48,
    backgroundColor: '#4464D0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  toggleText: {
    color: '#666666',
    fontSize: 14,
  },
  toggleLink: {
    color: '#4464D0',
    fontSize: 14,
    fontWeight: '700',
  },
});