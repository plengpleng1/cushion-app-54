import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
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
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);

  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showError = (message: string) => {
    setErrorMessage(message);
  };

  const validatePassword = (pass: string) => {
    const hasMinLength = pass.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return hasMinLength && hasLetter && hasNumber;
  };

  // แปลง Username เป็น Email สำหรับ Supabase Auth
  const formatEmail = (input: string) => {
    const trimmed = input.trim();
    return trimmed.includes('@') ? trimmed : `${trimmed}@cushionsense.local`;
  };

  // ฟังก์ชันช่วยบันทึกหรืออัปเดตลงตาราง profiles
  const syncUserProfile = async (userId: string, email: string, defaultUsername: string) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      const finalUsername = existingProfile?.username || defaultUsername;

      await supabase.from('profiles').upsert({
        id: userId,
        email: email,
        username: finalUsername,
        updated_at: new Date(),
      });

      await AsyncStorage.setItem(
        '@current_user',
        JSON.stringify({
          id: userId,
          email: email,
          username: finalUsername,
        })
      );
    } catch (e) {
      console.error('Error syncing profile:', e);
    }
  };

  // 1. สมัครสมาชิกผ่าน Supabase Auth
  const handleSignUp = async () => {
    setErrorMessage('');
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedUsername || !trimmedPassword || !trimmedConfirm) {
      showError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (!validatePassword(trimmedPassword)) {
      showError('Password ต้องมีอย่างน้อย 8 ตัว (ตัวอักษรและตัวเลข)');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      showError('Password และ Confirm Password ไม่ตรงกัน');
      return;
    }

    try {
      const email = formatEmail(trimmedUsername);
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: trimmedPassword,
        options: {
          data: { username: trimmedUsername },
        },
      });

      if (error) {
        showError(error.message);
        return;
      }

      if (data.user) {
        await syncUserProfile(data.user.id, email, trimmedUsername);
      }

      Alert.alert('สำเร็จ', 'สมัครสมาชิกเรียบร้อยแล้ว');
      setPassword('');
      setConfirmPassword('');
      setIsSignUp(false);
    } catch (error) {
      showError('เกิดข้อผิดพลาดในการลงทะเบียน');
    }
  };

  // 2. เข้าสู่ระบบผ่าน Supabase Auth
  const handleSignIn = async () => {
    setErrorMessage('');
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      showError('กรุณากรอก Username และ Password');
      return;
    }

    try {
      const email = formatEmail(trimmedUsername);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: trimmedPassword,
      });

      if (error) {
        showError('เข้าสู่ระบบไม่สำเร็จ: Username หรือ Password ไม่ถูกต้อง');
        return;
      }

      if (data.user) {
        const userDisplayName = data.user.user_metadata?.username || trimmedUsername;
        await syncUserProfile(data.user.id, data.user.email || email, userDisplayName);
      }

      router.push('/patient-info' as any);
    } catch (error) {
      showError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
    }
  };

  // 3. เข้าสู่ระบบด้วย Google Sign-In
  async function handleOAuthRedirect(url: string) {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) {
      showError(errorCode);
      return;
    }

    const { access_token, refresh_token } = params;
    if (!access_token || !refresh_token) {
      showError('ไม่พบ Session tokens');
      return;
    }

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      showError(error.message);
    } else if (data.user) {
      const googleUsername =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        data.user.email?.split('@')[0] ||
        'User';

      await syncUserProfile(data.user.id, data.user.email || '', googleUsername);
      router.push('/patient-info' as any);
    }
  }

  async function signInWithGoogle() {
    setErrorMessage('');
    try {
      // แก้ไข scheme ให้เป็น cushionsense
      const redirectTo = makeRedirectUri({
        scheme: 'cushionsense',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        showError(error.message);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success') {
        await handleOAuthRedirect(result.url);
      }
    } catch (err) {
      showError('เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sign-In');
    }
  }

  const handleSubmit = () => {
    if (isSignUp) handleSignUp();
    else handleSignIn();
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'web' && (
        <style>{`input::-ms-reveal, input::-ms-clear { display: none !important; }`}</style>
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
            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username or Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username or email"
                placeholderTextColor="#A0A0A0"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errorMessage) setErrorMessage('');
                }}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  ref={passwordInputRef}
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
                  onSubmitEditing={() => {
                    if (isSignUp) confirmPasswordInputRef.current?.focus();
                    else handleSubmit();
                  }}
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

            {/* Error Message */}
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
              <Text style={styles.primaryButtonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Toggle Mode */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setPassword('');
                  setConfirmPassword('');
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                  setErrorMessage('');
                }}
              >
                <Text style={styles.toggleLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* เส้นคั่น OR */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ปุ่ม Sign in with Google */}
            <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
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
    marginTop: 16,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#888888',
  },
  googleButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  googleButtonText: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '600',
  },
});