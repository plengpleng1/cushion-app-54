import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
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

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // แปลง Username เป็น Email Format สำหรับ Supabase Auth
  const getFormattedEmail = (input: string) => {
    const trimmed = input.trim();
    if (trimmed.includes('@')) {
      return trimmed;
    }
    return `${trimmed.toLowerCase()}@cushionsense.app`;
  };

  const validatePassword = (pass: string) => {
    return pass.length >= 8;
  };

  // 1. สมัครสมาชิก
  const handleSignUp = async () => {
    setErrorMessage('');
    const trimmedUser = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedUser || !trimmedPassword || !trimmedConfirm) {
      showError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (!validatePassword(trimmedPassword)) {
      showError('Password ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      showError('Password และ Confirm Password ไม่ตรงกัน');
      return;
    }

    try {
      setLoading(true);
      const emailToUse = getFormattedEmail(trimmedUser);

      const { data, error } = await supabase.auth.signUp({
        email: emailToUse,
        password: trimmedPassword,
        options: {
          data: {
            username: trimmedUser,
          },
        },
      });

      if (error) {
        showError(error.message);
        return;
      }

      if (data.session) {
        router.push('/select' as any);
      } else {
        showError('สมัครสมาชิกสำเร็จ! กรุณาล็อกอินเพื่อเข้าสู่ระบบ');
        setIsSignUp(false);
      }
    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setLoading(false);
    }
  };

  // 2. เข้าสู่ระบบด้วย Username/Password
  const handleSignIn = async () => {
    setErrorMessage('');
    const trimmedUser = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUser || !trimmedPassword) {
      showError('กรุณากรอก Username และ Password');
      return;
    }

    try {
      setLoading(true);
      const emailToUse = getFormattedEmail(trimmedUser);

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: trimmedPassword,
      });

      if (error) {
        showError('เข้าสู่ระบบไม่สำเร็จ: Username หรือ Password ไม่ถูกต้อง');
        return;
      }

      router.push('/select' as any);
    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  // 3. เข้าสู่ระบบด้วย Google OAuth
  const createSessionFromUrl = async (url: string) => {
    const route = url.replace('#', '?');
    const queryParams = new URLSearchParams(route.split('?')[1]);

    const access_token = queryParams.get('access_token');
    const refresh_token = queryParams.get('refresh_token');

    if (!access_token || !refresh_token) {
      return;
    }

    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      showError(error.message);
    } else {
      router.push('/select' as any);
    }
  };

  const signInWithGoogle = async () => {
    setErrorMessage('');
    try {
      setLoading(true);
      const redirectTo = makeRedirectUri({
        scheme: 'cushionsense',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        showError(error.message);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      if (result.type === 'success' && result.url) {
        await createSessionFromUrl(result.url);
      }
    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการเปิด Google Login');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.brandContainer}>
              <Text style={styles.brandBold}>Cushion </Text>
              <Text style={styles.brandLight}>Sense</Text>
            </Text>
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
                onChangeText={(text) => {
                  setUsername(text);
                  if (errorMessage) setErrorMessage('');
                }}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.input, styles.passwordInput]}
                  placeholder={
                    isSignUp ? 'At least 8 characters' : 'Enter your password'
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
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#666666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field */}
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
                    onPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? 'eye-outline'
                          : 'eye-off-outline'
                      }
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
                  setErrorMessage('');
                }}
              >
                <Text style={styles.toggleLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={signInWithGoogle}
              disabled={loading}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color="#4285F4"
                style={styles.googleIcon}
              />
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
  justifyContent: 'center', // 🟢 แก้จาก justify เป็น justifyContent
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
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
},
  googleIcon: {
    marginRight: 8,
  },
  googleButtonText: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '600',
  },
});