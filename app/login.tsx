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

  // ฟังก์ชันแสดงข้อความแจ้งเตือน (รองรับทั้ง Web และ Mobile)
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // ตรวจสอบความปลอดภัย Password (อย่างน้อย 8 ตัวอักษร มีทั้งตัวอักษรและตัวเลข)
  const validatePassword = (pass: string) => {
    const hasMinLength = pass.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return hasMinLength && hasLetter && hasNumber;
  };

  // 1. ฟังก์ชันสมัครสมาชิก (Sign Up)
  const handleSignUp = async () => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedUsername || !trimmedPassword || !trimmedConfirm) {
      showAlert('กรอกข้อมูลไม่ครบ', 'กรุณากรอก Username, Password และ Confirm Password ให้ครบถ้วน');
      return;
    }

    // ตรวจสอบความปลอดภัยรหัสผ่าน
    if (!validatePassword(trimmedPassword)) {
      showAlert(
        'รหัสผ่านไม่ปลอดภัย',
        'Password ต้องมีความยาวอย่างน้อย 8 ตัวอักษร และต้องประกอบด้วยทั้งตัวอักษรและตัวเลข'
      );
      return;
    }

    // ตรวจสอบการยืนยันรหัสผ่าน (Case-Sensitive ตรงกันทุกตัวอักษร)
    if (trimmedPassword !== trimmedConfirm) {
      showAlert('รหัสผ่านไม่ตรงกัน', 'กรุณายืนยัน Password ให้ตรงกันเป๊ะๆ');
      return;
    }

    try {
      const existingUsersJson = await AsyncStorage.getItem('@user_accounts');
      const users = existingUsersJson ? JSON.parse(existingUsersJson) : [];

      // ตรวจสอบ Username ซ้ำ
      const isExist = users.some((u: any) => u.username === trimmedUsername);
      if (isExist) {
        showAlert('สมัครไม่สำเร็จ', 'Username นี้ถูกใช้งานแล้ว');
        return;
      }

      // บันทึกเข้า AsyncStorage
      users.push({
        username: trimmedUsername,
        password: trimmedPassword,
      });

      await AsyncStorage.setItem('@user_accounts', JSON.stringify(users));

      showAlert('สำเร็จ', 'สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ');

      setPassword('');
      setConfirmPassword('');
      setIsSignUp(false);
    } catch (error) {
      showAlert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  // 2. ฟังก์ชันเข้าสู่ระบบ (Sign In)
  const handleSignIn = async () => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      showAlert('กรอกข้อมูลไม่ครบ', 'กรุณากรอก Username และ Password');
      return;
    }

    try {
      const existingUsersJson = await AsyncStorage.getItem('@user_accounts');
      const users = existingUsersJson ? JSON.parse(existingUsersJson) : [];

      const foundUser = users.find(
        (u: any) => u.username === trimmedUsername && u.password === trimmedPassword
      );

      if (foundUser) {
        await AsyncStorage.setItem(
          '@current_user',
          JSON.stringify({
            username: foundUser.username,
          })
        );
        router.push("/(patient-info)"as any);
      } else {
        showAlert('เข้าสู่ระบบไม่สำเร็จ', 'Username หรือ Password ไม่ถูกต้อง');
      }
    } catch (error) {
      showAlert('ข้อผิดพลาด', 'เกิดปัญหาในการตรวจสอบข้อมูล');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header ด้านบน */}
          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>Welcome</Text>
            
            {/* แยกสไตล์ Cushion (หนา) และ Sense (บาง) */}
            <Text style={styles.brandContainer}>
              <Text style={styles.brandBold}>Cushion </Text>
              <Text style={styles.brandLight}>Sense</Text>
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Username */}
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

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder={
                  isSignUp
                    ? 'At least 8 chars (letters & numbers)'
                    : 'Enter your password'
                }
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
            </View>

            {/* Confirm Password */}
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
                  autoCapitalize="none"
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

            {/* Toggle Mode Button */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUp
                  ? 'Already have an account? '
                  : "Don't have an account? "}
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
    fontSize: 58,
    fontWeight: '900',
    color: '#4464D0',
    textAlign: 'center',
  },
  brandContainer: {
    textAlign: 'center',
    marginTop: 4,
  },
  brandBold: {
    fontSize: 42,
    fontStyle: 'italic',
    fontWeight: '700', // ตัวหนา
    color: '#4464D0',
  },
  brandLight: {
    fontSize: 42,
    fontStyle: 'italic',
    fontWeight: '400', // ตัวบาง
    color: '#4464D0',
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