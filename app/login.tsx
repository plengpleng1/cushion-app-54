import { BlurredBackground } from "@/components/BlurredBackground";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { supabase } from "../lib/supabase";

export default function LoginScreen() {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);

  // State เพิ่มเติมสำหรับระบบ Forgot Password
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPasswordStep, setIsResetPasswordStep] = useState(false);

  const [loading, setLoading] = useState(false);

  // Timer state สำหรับ Resend OTP
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Input Refs
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  // States
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // States สำหรับแจ้งเตือนสีแดงใต้ช่องแต่ละช่อง (Inline Validation)
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // =========================================================
  // Timer สำหรับ Resend OTP
  // =========================================================

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
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setNewPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage("");
    setUsernameError("");
    setEmailError("");
    setIsOtpStep(false);
    setIsForgotPassword(false);
    setIsResetPasswordStep(false);
    setTimer(60);
    setCanResend(false);
  };

  // =========================================================
  // Functions ตรวจสอบ Username และ Email ซ้ำในระบบ
  // =========================================================

  const checkUsernameExists = async (inputUsername: string) => {
    const rawUsername = inputUsername.trim();
    if (!rawUsername || !isSignUp) return false;

    try {
      setIsCheckingUsername(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", rawUsername)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUsernameError("Username นี้ถูกใช้งานแล้วในระบบ");
        return true;
      } else {
        setUsernameError("");
        return false;
      }
    } catch (err) {
      console.error("Check username error:", err);
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const checkEmailExists = async (inputEmail: string) => {
    const rawEmail = inputEmail.trim().toLowerCase();
    if (!rawEmail || !isSignUp) return false;

    if (!validateEmail(rawEmail)) {
      setEmailError("กรุณากรอกรูปแบบ Email ให้ถูกต้อง");
      return false;
    }

    try {
      setIsCheckingEmail(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", rawEmail)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEmailError("Email นี้ถูกใช้งานแล้วในระบบ");
        return true;
      } else {
        setEmailError("");
        return false;
      }
    } catch (err) {
      console.error("Check email error:", err);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // =========================================================
  // 1. Forgot Password Flow
  // =========================================================

  // 1.1 Request Reset OTP
  const handleRequestResetOtp = async () => {
    setErrorMessage("");
    const rawEmail = email.trim().toLowerCase();

    if (!rawEmail) {
      showError("กรุณากรอก Email ที่ใช้ลงทะเบียน");
      return;
    }

    if (!validateEmail(rawEmail)) {
      showError("กรุณากรอกรูปแบบ Email ให้ถูกต้อง");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(rawEmail);

      if (error) {
        showError(error.message);
        return;
      }

      setIsOtpStep(true);
      setTimer(60);
      setCanResend(false);
    } catch (err: any) {
      showError("เกิดข้อผิดพลาดในการส่ง OTP");
    } finally {
      setLoading(false);
    }
  };

  // 1.2 Verify Recovery OTP
  const handleVerifyRecoveryOtp = async () => {
    setErrorMessage("");
    const rawEmail = email.trim().toLowerCase();
    const rawOtp = otp.trim();

    if (rawOtp.length !== 6) {
      showError("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email: rawEmail,
        token: rawOtp,
        type: "recovery",
      });

      if (error) {
        showError("รหัส OTP ไม่ถูกต้องหรือหมดอายุ");
        return;
      }

      setIsOtpStep(false);
      setIsResetPasswordStep(true);
    } catch (err: any) {
      showError("เกิดข้อผิดพลาดในการยืนยัน OTP");
    } finally {
      setLoading(false);
    }
  };

  // 1.3 Save New Password
  const handleSaveNewPassword = async () => {
    setErrorMessage("");

    if (!validatePassword(newPassword)) {
      showError(
        "Password ต้องมีความยาวอย่างน้อย 8 ตัวอักษร และต้องประกอบด้วยทั้งตัวอักษรและตัวเลข",
      );
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        showError(error.message);
        return;
      }

      alert("เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
      resetForm();
    } catch (err: any) {
      showError("เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 2. Sign Up Logic
  // =========================================================

  const handleSignUp = async () => {
    setErrorMessage("");

    const rawUsername = username.trim();
    const rawEmail = email.trim().toLowerCase();
    const rawPassword = password;
    const rawConfirm = confirmPassword;

    if (!rawUsername || !rawEmail || !rawPassword || !rawConfirm) {
      showError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    // ตรวจสอบความถูกต้องของ Email และรหัสผ่านก่อน Submit
    if (!validateEmail(rawEmail)) {
      setEmailError("กรุณากรอกรูปแบบ Email ให้ถูกต้อง");
      return;
    }

    if (!validatePassword(rawPassword)) {
      showError(
        "Password ต้องมีความยาวอย่างน้อย 8 ตัวอักษร และต้องประกอบด้วยทั้งตัวอักษรและตัวเลข",
      );
      return;
    }

    if (rawPassword !== rawConfirm) {
      showError("Password และ Confirm Password ไม่ตรงกัน");
      return;
    }

    try {
      setLoading(true);

      // ตรวจสอบอีกครั้งก่อนส่งข้อมูลสมัคร
      const isUsernameTaken = await checkUsernameExists(rawUsername);
      const isEmailTaken = await checkEmailExists(rawEmail);

      if (isUsernameTaken || isEmailTaken) {
        showError("โปรดแก้ไขข้อมูลที่มีในระบบแล้วก่อนดำเนินการต่อ");
        return;
      }

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
      showError("เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // Resend OTP
  // =========================================================

  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMessage("");

    try {
      setLoading(true);
      const targetEmail = email.trim().toLowerCase();

      if (isForgotPassword) {
        const { error } =
          await supabase.auth.resetPasswordForEmail(targetEmail);
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: targetEmail,
        });
        if (error) throw error;
      }

      setTimer(60);
      setCanResend(false);
      alert("ส่งรหัส OTP ใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว");
    } catch (err: any) {
      showError(err.message || "ไม่สามารถส่ง OTP ใหม่ได้ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // Verify SignUp OTP Logic
  // =========================================================

  const handleVerifySignUpOtp = async () => {
    setErrorMessage("");

    const rawEmail = email.trim().toLowerCase();
    const rawOtp = otp.trim();

    if (rawOtp.length !== 6) {
      showError("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.verifyOtp({
        email: rawEmail,
        token: rawOtp,
        type: "signup",
      });

      if (error) {
        showError("รหัส OTP ไม่ถูกต้องหรือหมดอายุ");
        return;
      }

      resetForm();
      router.replace("/select" as any);
    } catch (err: any) {
      showError("เกิดข้อผิดพลาดในการยืนยัน OTP");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 3. Sign In Logic
  // =========================================================

  const handleSignIn = async () => {
    setErrorMessage("");

    const rawInput = username.trim();
    const rawPassword = password;

    if (!rawInput || !rawPassword) {
      showError("กรุณากรอก Username และ Password");
      return;
    }

    try {
      setLoading(true);

      let loginEmail = rawInput;

      if (!rawInput.includes("@")) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", rawInput)
          .maybeSingle<{ email: string }>();

        if (profileError || !profileData?.email) {
          showError("เข้าสู่ระบบไม่สำเร็จ: Username/Password ไม่ถูกต้อง");
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
        showError("เข้าสู่ระบบไม่สำเร็จ: Username/Password ไม่ถูกต้อง");
        return;
      }

      if (data.user) {
        router.replace("/select" as any);
      }
    } catch (err: any) {
      showError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // Submit Route
  // =========================================================

  const handleSubmit = () => {
    if (isResetPasswordStep) {
      handleSaveNewPassword();
    } else if (isOtpStep) {
      if (isForgotPassword) {
        handleVerifyRecoveryOtp();
      } else {
        handleVerifySignUpOtp();
      }
    } else if (isForgotPassword) {
      handleRequestResetOtp();
    } else if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  return (
    <SafeAreaView style={styles.container as ViewStyle}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ครอบเนื้อหาทั้งหมดด้วย BlurredBackground */}
      <BlurredBackground>
        {Platform.OS === "web" && (
          <style
            dangerouslySetInnerHTML={{
              __html: `
                input::-ms-reveal,
                input::-ms-clear {
                  display: none !important;
                }
              `,
            }}
          />
        )}

        {/* TOP HEADER */}
        <View style={styles.topHeader as ViewStyle}>
          <Text style={styles.topHeaderTitle}>
            {isForgotPassword
              ? "Reset Password"
              : isSignUp
                ? "Sign Up"
                : "Sign In"}
          </Text>
        </View>

        <View style={styles.headerLine as ViewStyle} />

        {/* MAIN CONTENT */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Welcome Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.welcomeText}>Welcome</Text>

              <Image
                source={require("../assets/images/cushion.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* FORM CONTAINER */}
            <View style={styles.formContainer}>
              {/* STEP 1: RESTORE / SET NEW PASSWORD */}
              {isResetPasswordStep ? (
                <View>
                  <Text style={styles.otpTitle}>Set New Password</Text>
                  <Text style={styles.otpSubTitle}>
                    กรุณากรอกรหัสผ่านใหม่เพื่อเข้าใช้งานระบบ
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.passwordWrapper}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="At least 8 chars with letters & numbers"
                        placeholderTextColor="#A0A0A0"
                        secureTextEntry={!showPassword}
                        value={newPassword}
                        onChangeText={(text) => {
                          setNewPassword(text);
                          if (errorMessage) setErrorMessage("");
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={handleSaveNewPassword}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={22}
                          color="#666666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {errorMessage ? (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSaveNewPassword}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        Save New Password
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : isOtpStep ? (
                /* STEP 2: VERIFY OTP (SIGN UP OR FORGOT PASSWORD) */
                <View>
                  <Text style={styles.otpTitle}>Verify Your Email</Text>

                  <Text style={styles.otpSubTitle}>
                    เราได้ส่งรหัส OTP 6 หลักไปที่{"\n"}
                    <Text style={{ fontWeight: "700", color: "#2D69CA" }}>
                      {email}
                    </Text>
                  </Text>

                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      placeholder="123456"
                      placeholderTextColor="#A0A0A0"
                      value={otp}
                      onChangeText={(text) => {
                        setOtp(text);
                        if (errorMessage) setErrorMessage("");
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>

                  {errorMessage ? (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Verify OTP</Text>
                    )}
                  </TouchableOpacity>

                  {/* Resend OTP */}
                  <View style={{ marginTop: 16, alignItems: "center" }}>
                    {canResend ? (
                      <TouchableOpacity
                        onPress={handleResendOtp}
                        disabled={loading}
                      >
                        <Text
                          style={{
                            color: "#2D69CA",
                            fontWeight: "700",
                            fontSize: 15,
                          }}
                        >
                          ส่งรหัส OTP อีกครั้ง
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={{ color: "#666666", fontSize: 14 }}>
                        ส่งรหัส OTP อีกครั้งได้ใน {timer} วินาที
                      </Text>
                    )}
                  </View>

                  {/* Back */}
                  <TouchableOpacity
                    style={{ marginTop: 16, alignItems: "center" }}
                    onPress={() => setIsOtpStep(false)}
                  >
                    <Text style={{ color: "#555555", fontSize: 15 }}>
                      ← ย้อนกลับเพื่อแก้ไขข้อมูล
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : isForgotPassword ? (
                /* STEP 3: REQUEST FORGOT PASSWORD EMAIL */
                <View>
                  <Text style={styles.otpTitle}>Forgot Password</Text>
                  <Text style={styles.otpSubTitle}>
                    กรอก Email ที่ใช้ลงทะเบียน{"\n"}เพื่อรับรหัส OTP
                    สำหรับตั้งรหัสผ่านใหม่
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#A0A0A0"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errorMessage) setErrorMessage("");
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleRequestResetOtp}
                    />
                  </View>

                  {errorMessage ? (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleRequestResetOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Send OTP Code</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ marginTop: 16, alignItems: "center" }}
                    onPress={() => {
                      setIsForgotPassword(false);
                      setErrorMessage("");
                    }}
                  >
                    <Text style={{ color: "#666666", fontSize: 14 }}>
                      ← Back to Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* STEP 4: SIGN IN / SIGN UP */
                <View>
                  {/* Username */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      {isSignUp ? "Username" : "Username or Email"}
                    </Text>

                    <TextInput
                      style={[
                        styles.input,
                        isSignUp && usernameError ? styles.inputError : null,
                      ]}
                      placeholder={
                        isSignUp
                          ? "Enter your username"
                          : "Enter username or email"
                      }
                      placeholderTextColor="#A0A0A0"
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        if (usernameError) setUsernameError("");
                        if (errorMessage) setErrorMessage("");
                      }}
                      onBlur={() => {
                        if (isSignUp) checkUsernameExists(username);
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        if (isSignUp) {
                          emailInputRef.current?.focus();
                        } else {
                          passwordInputRef.current?.focus();
                        }
                      }}
                    />

                    {/* Inline Error สำหรับ Username ในหน้า Sign Up */}
                    {isSignUp && isCheckingUsername && (
                      <Text style={styles.infoText}>
                        กำลังตรวจสอบ Username...
                      </Text>
                    )}
                    {isSignUp && usernameError ? (
                      <Text style={styles.fieldErrorText}>{usernameError}</Text>
                    ) : null}
                  </View>

                  {/* Email - Sign Up only */}
                  {isSignUp && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email</Text>

                      <TextInput
                        ref={emailInputRef}
                        style={[
                          styles.input,
                          emailError ? styles.inputError : null,
                        ]}
                        placeholder="Enter your email"
                        placeholderTextColor="#A0A0A0"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (emailError) setEmailError("");
                          if (errorMessage) setErrorMessage("");
                        }}
                        onBlur={() => {
                          if (isSignUp) checkEmailExists(email);
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                      />

                      {/* Inline Error สำหรับ Email ในหน้า Sign Up */}
                      {isCheckingEmail && (
                        <Text style={styles.infoText}>กำลังตรวจสอบ Email...</Text>
                      )}
                      {emailError ? (
                        <Text style={styles.fieldErrorText}>{emailError}</Text>
                      ) : null}
                    </View>
                  )}

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>

                    <View style={styles.passwordWrapper}>
                      <TextInput
                        ref={passwordInputRef}
                        style={[styles.input, styles.passwordInput]}
                        placeholder={
                          isSignUp
                            ? "At least 8 chars with letters & numbers"
                            : "Enter your password"
                        }
                        placeholderTextColor="#A0A0A0"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (errorMessage) setErrorMessage("");
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType={isSignUp ? "next" : "done"}
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
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={22}
                          color="#666666"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Forgot Password Link */}
                    {!isSignUp && (
                      <TouchableOpacity
                        style={styles.forgotPasswordContainer}
                        onPress={() => {
                          setIsForgotPassword(true);
                          setErrorMessage("");
                        }}
                      >
                        <Text style={styles.forgotPasswordText}>
                          Forgot Password?
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Confirm Password - Sign Up only */}
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
                            if (errorMessage) setErrorMessage("");
                          }}
                          autoCapitalize="none"
                          autoCorrect={false}
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
                                ? "eye-off-outline"
                                : "eye-outline"
                            }
                            size={22}
                            color="#666666"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Error Message รวม */}
                  {errorMessage ? (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  ) : null}

                  {/* Sign In / Sign Up Button */}
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {isSignUp ? "Sign Up" : "Sign In"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Toggle Sign In / Sign Up */}
                  <View style={styles.toggleContainer}>
                    <Text style={styles.toggleText}>
                      {isSignUp
                        ? "Already have an account? "
                        : "Don't have an account? "}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        setIsSignUp(!isSignUp);
                        resetForm();
                      }}
                    >
                      <Text style={styles.toggleLink}>
                        {isSignUp ? "Sign In" : "Sign Up"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </BlurredBackground>
    </SafeAreaView>
  );
}

// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  topHeader: {
    height: 0,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    backgroundColor: "#fffefe",
  },
  topHeaderTitle: {
    fontSize: 0,
    fontWeight: "500",
    color: "#000000",
  } as TextStyle,
  headerLine: {
    height: 1,
    width: "100%",
    backgroundColor: "#D8D8D8",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 76,
    fontWeight: "800",
    color: "#2D69CA",
    textAlign: "center",
    marginBottom: -12,
  },
  logoImage: {
    width: 290,
    height: 100,
    alignSelf: "center",
    marginBottom: 5,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  },
  otpSubTitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#333333",
    backgroundColor: "#FAFAFA",
  },
  inputError: {
    borderColor: "#E53E3E",
  },
  otpInput: {
    textAlign: "center",
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: "700",
  },
  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 13.5,
    color: "#2D69CA",
    fontWeight: "600",
  },
  primaryButton: {
    height: 48,
    backgroundColor: "#2D69CA",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  toggleText: {
    fontSize: 14,
    color: "#666666",
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D69CA",
  },
  errorText: {
    color: "#E53E3E",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  fieldErrorText: {
    color: "#E53E3E",
    fontSize: 12,
    marginTop: 4,
  },
  infoText: {
    color: "#666666",
    fontSize: 12,
    marginTop: 4,
  },
});
