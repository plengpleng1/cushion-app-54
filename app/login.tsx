import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

  // States สำหรับซ่อน/แสดง Password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State สำหรับเก็บข้อความแจ้งเตือนสีแดง
  const [errorMessage, setErrorMessage] = useState('');

  // ฟังก์ชันตั้งค่าข้อความเตือน
  const showError = (message: string) => {
    setErrorMessage(message);
  };

  // ตรวจสอบความปลอดภัย Password
  const validatePassword = (pass: string) => {
    const hasMinLength = pass.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return hasMinLength && hasLetter && hasNumber;
  };

  // 1. ฟังก์ชันสมัครสมาชิก (Sign Up)
  const handleSignUp = async () => {
    setErrorMessage(''); // ล้างข้อความเตือนเก่า
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedUsername || !trimmedPassword || !trimmedConfirm) {
      showError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (!validatePassword(trimmedPassword)) {
      showError('Password ต้องมีอย่างน้อย 8 ตัว (ต้องประกอบด้วยตัวอักษรและตัวเลข)');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      showError('Password และ Confirm Password ไม่ตรงกัน');
      return;
    }

    try {
      const existingUsersJson = await AsyncStorage.getItem('@user_accounts');
      const users = existingUsersJson ? JSON.parse(existingUsersJson) : [];

      const isExist = users.some((u: any) => u.username === trimmedUsername);
      if (isExist) {
        showError('สมัครไม่สำเร็จ: Username นี้ถูกใช้งานแล้ว');
        return;
      }

      users.push({
        username: trimmedUsername,
        password: trimmedPassword,
      });

      await AsyncStorage.setItem('@user_accounts', JSON.stringify(users));

      setPassword('');
      setConfirmPassword('');
      setIsSignUp(false);
      setErrorMessage(''); // สำเร็จ ล้างข้อความเตือน
    } catch (error) {
      showError('ข้อผิดพลาด: ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  // 2. ฟังก์ชันเข้าสู่ระบบ (Sign In)
  const handleSignIn = async () => {
    setErrorMessage(''); // ล้างข้อความเตือนเก่า
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      showError('กรุณากรอก Username และ Password');
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
        router.push('/patient-info' as any);
      } else {
        showError('เข้าสู่ระบบไม่สำเร็จ: Username หรือ Password ไม่ถูกต้อง');
      }
    } catch (error) {
      showError('ข้อผิดพลาด: เกิดปัญหาในการตรวจสอบข้อมูล');
    }
  };

  // ฟังก์ชันรองรับการกด Enter บนคีย์บอร์ด
  const handleSubmit = () => {
    if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ซ่อนลูกกะตาของ Web Browser */}
      {Platform.OS === 'web' && (
        <style>
          {`
            input::-ms-reveal,
            input::-ms-clear {
              display: none !important;
            }
          `}
        </style>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header ด้านบน */}
          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>Welcome</Text>

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
                onChangeText={(text) => {
                  setUsername(text);
                  if (errorMessage) setErrorMessage('');
                }}
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder={
                    isSignUp
                      ? 'At least 8 chars (letters & numbers)'
                      : 'Enter your password'
                  }
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="none"
                  returnKeyType={isSignUp ? 'next' : 'done'}
                  onSubmitEditing={isSignUp ? undefined : handleSubmit}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#666666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password (เฉพาะ Sign Up) */}
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#A0A0A0"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={22}
                      color="#666666"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ข้อความแจ้งเตือนสีแดง เหนือปุ่ม Sign In / Sign Up */}
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
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
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                  setErrorMessage(''); // ล้างข้อความเตือนเมื่อสลับโหมด
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
    fontWeight: '700',
    color: '#4464D0',
  },
  brandLight: {
    fontSize: 42,
    fontStyle: 'italic',
    fontWeight: '400',
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
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#D92D20', // สีแดงเตือน
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryButton: {
    height: 48,
    backgroundColor: '#4464D0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 4,
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