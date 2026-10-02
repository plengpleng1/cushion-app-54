import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);

  // Timer state สำหรับ Resend OTP
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Input Refs
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  // States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ระบบนับถอยหลัง 60 วินาทีสำหรับการส่ง OTP อีกครั้ง
  useEffect(() => {
    let interval: any;
    if (isOtpStep && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [isOtpStep, timer]);

  const showError = (message: string) => {
    setErrorMessage(message);
  };

  const validatePassword = (pass: string) => {
    const hasMinLength = pass.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return hasMinLength && hasLetter && hasNumber;
  };

  const validateEmail = (targetEmail: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(targetEmail);
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage('');
    setIsOtpStep(false);
    setTimer(60);
    setCanResend(false);
  };

  // 1. Sign Up Logic (แก้ไขมาใช้ signUp แบบถูกต้อง)
  const handleSignUp = async () => {
    setErrorMessage('');
    const rawUsername = username.trim();
    const rawEmail = email.trim().toLowerCase();
    const rawPassword = password;
    const rawConfirm = confirmPassword;

    if (!rawUsername || !rawEmail || !rawPassword || !rawConfirm) {
      showError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    if (!validateEmail(rawEmail)) {
      showError('กรุณากรอกรูปแบบ Email ให้ถูกต้อง');
      return;
    }

    if (!validatePassword(rawPassword)) {
      showError('Password ต้องมีความยาวอย่างน้อย 8 ตัวอักษร และต้องประกอบด้วยทั้งตัวอักษรและตัวเลข');
      return;
    }

    if (rawPassword !== rawConfirm) {
      showError('Password และ Confirm Password ไม่ตรงกัน');
      return;
    }

    try {
      setLoading(true);

      // ใช้ signUp เพื่อส่งรหัส OTP 6 หลักเข้าอีเมล
      const { data, error } = await supabase.auth.signUp({
        email: rawEmail,
        password: rawPassword,
        options: {
          data: {
            username: rawUsername,
          },
        },
      });

      if (error) {
        showError(error.message);
        return;
      }

      setIsOtpStep(true);
      setTimer(60);
      setCanResend(false);

    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันส่ง OTP ใหม่อีกครั้ง (Resend OTP)
  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMessage('');

    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

      if (error) {
        showError(error.message);
        return;
      }

      setTimer(60);
      setCanResend(false);
      alert('ส่งรหัส OTP ใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว');
    } catch (err: any) {
      showError('ไม่สามารถส่ง OTP ใหม่ได้ กรุณาลองอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP Logic
  const handleVerifyOtp = async () => {
    setErrorMessage('');
    const rawEmail = email.trim().toLowerCase();
    const rawOtp = otp.trim();

    if (rawOtp.length !== 6) {
      showError('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.verifyOtp({
        email: rawEmail,
        token: rawOtp,
        type: 'signup', // ใช้ type เป็น signup
      });

      if (error) {
        showError('รหัส OTP ไม่ถูกต้องหรือหมดอายุ');
        return;
      }

      // ยืนยัน OTP สำเร็จ พาเข้าสู่ระบบทันที
      resetForm();
      router.replace('/select' as any);

    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการยืนยัน OTP');
    } finally {
      setLoading(false);
    }
  };

  // 3. Sign In Logic
  const handleSignIn = async () => {
    setErrorMessage('');
    const rawInput = username.trim();
    const rawPassword = password;

    if (!rawInput || !rawPassword) {
      showError('กรุณากรอก Username และ Password');
      return;
    }

    try {
      setLoading(true);
      let loginEmail = rawInput;

      if (!rawInput.includes('@')) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', rawInput)
          .maybeSingle<{ email: string }>();

        if (profileError || !profileData?.email) {
          showError('เข้าสู่ระบบไม่สำเร็จ: Username หรือ Password ไม่ถูกต้อง');
          setLoading(false);
          return;
        }

        loginEmail = profileData.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: rawPassword,
      });

      if (error) {
        showError('เข้าสู่ระบบไม่สำเร็จ: Username/Password ไม่ถูกต้อง');
        return;
      }

      if (data.user) {
        router.replace('/select' as any);
      }
    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isOtpStep) {
      handleVerifyOtp();
    } else if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'web' && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
            input::-ms-reveal,
            input::-ms-clear { display: none !important; }
          `,
          }}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.brandContainer}>
              <Text style={styles.brandBold}>Cushion </Text>
              <Text style={styles.brandLight}>Sense</Text>
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* --- หน้าต่างที่ 1: กรอก OTP 6 หลัก --- */}
            {isOtpStep ? (
              <View>
                <Text style={styles.otpTitle}>Verify Your Email</Text>
                <Text style={styles.otpSubTitle}>
                  เราได้ส่งรหัส OTP 6 หลักไปที่{'\n'}
                  <Text style={{ fontWeight: '700', color: '#4464D0' }}>{email}</Text>
                </Text>

                <View style={styles.inputGroup}>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="123456"
                    placeholderTextColor="#A0A0A0"
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                  />
                </View>

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>

                {/* ปุ่มส่ง OTP อีกครั้ง / ตัวนับถอยหลัง */}
                <View style={{ marginTop: 16, alignItems: 'center' }}>
                  {canResend ? (
                    <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                      <Text style={{ color: '#4464D0', fontWeight: '700', fontSize: 14 }}>
                        ส่งรหัส OTP อีกครั้ง
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: '#888888', fontSize: 13 }}>
                      ส่งรหัสอีกครั้งได้ใน {timer} วินาที
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={{ marginTop: 16, alignItems: 'center' }}
                  onPress={() => setIsOtpStep(false)}
                >
                  <Text style={{ color: '#666666', fontSize: 14 }}>
                    ← กลับไปแก้ไขข้อมูล
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* --- หน้าต่างที่ 2: ฟอร์ม Sign In / Sign Up ปกติ --- */
              <View>
                {/* ช่อง Username / Identifier */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {isSignUp ? 'Username' : 'Username or Email'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      isSignUp ? 'Enter your username' : 'Enter username or email'
                    }
                    placeholderTextColor="#A0A0A0"
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      if (isSignUp) {
                        emailInputRef.current?.focus();
                      } else {
                        passwordInputRef.current?.focus();
                      }
                    }}
                  />
                </View>

                {/* ช่อง Email (แสดงเฉพาะตอน Sign Up) */}
                {isSignUp && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      ref={emailInputRef}
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#A0A0A0"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="off"
                      textContentType="none"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                    />
                  </View>
                )}

                {/* ช่อง Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      ref={passwordInputRef}
                      style={[styles.input, styles.passwordInput]}
                      placeholder={
                        isSignUp
                          ? 'At least 8 chars with letters & numbers'
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
                      autoCorrect={false}
                      autoComplete="off"
                      textContentType="none"
                      returnKeyType={isSignUp ? 'next' : 'done'}
                      onSubmitEditing={() => {
                        if (isSignUp) {
                          confirmPasswordInputRef.current?.focus();
                        } else {
                          handleSubmit();
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={22}
                        color="#666666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ช่อง Confirm Password (แสดงเฉพาะตอน Sign Up) */}
                {isSignUp && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordWrapper}>
                      <TextInput
                        ref={confirmPasswordInputRef}
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
                        autoCorrect={false}
                        autoComplete="off"
                        textContentType="none"
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? 'eye-off-outline'
                              : 'eye-outline'
                          }
                          size={22}
                          color="#666666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* แสดง Error Message */}
                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                {/* ปุ่ม Sign In / Sign Up */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {isSignUp ? 'Sign Up' : 'Sign In'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* ปุ่มสลับระหว่าง Sign In และ Sign Up */}
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleText}>
                    {isSignUp
                      ? 'Already have an account? '
                      : "Don't have an account? "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsSignUp(!isSignUp);
                      resetForm();
                    }}
                  >
                    <Text style={styles.toggleLink}>
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#D92D20',
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
  otpTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  otpSubTitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 10,
    fontWeight: '700',
    color: '#4464D0',
  },
});