import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

const BLUE = "#4464D0";

type UserPatientRow = {
  id: string;
  patient_id: string | null;
  name: string | null;
  citizen_id: string | null;
  gender: string | null;
  age: string | null;
  phone: string | null;
};

export default function PatientInfo() {
  const router = useRouter();

  const { citizenId: selectedCitizenId } = useLocalSearchParams<{
    citizenId?: string;
  }>();

  // =========================================================
  // Refs
  // =========================================================

  const patientIdRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const citizenIdRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  // =========================================================
  // State
  // =========================================================

  const [patientId, setPatientId] = useState("");
  const [name, setName] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");

  const [genderOpen, setGenderOpen] = useState(false);

  const [errors, setErrors] = useState({
    patientId: "",
    name: "",
    citizenId: "",
    gender: "",
    age: "",
    phone: "",
  });

  // =========================================================
  // Load Existing Patient
  // =========================================================

  useEffect(() => {
    const loadPatient = async () => {
      // ถ้าเป็น New Patient ไม่ต้องโหลดข้อมูล
      if (!selectedCitizenId) {
        setPatientId("");
        setName("");
        setCitizenId("");
        setGender("");
        setAge("");
        setPhone("");

        setErrors({
          patientId: "",
          name: "",
          citizenId: "",
          gender: "",
          age: "",
          phone: "",
        });

        return;
      }

      try {
        // ตรวจสอบคนที่ Login
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          Alert.alert("ไม่พบผู้ใช้งาน", "กรุณา Login ใหม่");
          router.replace("/login");
          return;
        }

        // โหลด Patient ของ User นี้เท่านั้น
        const { data, error } = await supabase
          .from("user_patients")
          .select("id, patient_id, name, citizen_id, gender, age, phone")
          .eq("user_id", user.id)
          .eq("citizen_id", String(selectedCitizenId))
          .maybeSingle<UserPatientRow>();

        if (error) {
          console.error("Load patient error:", error);

          Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลผู้ป่วยได้");
          return;
        }

        if (!data) {
          Alert.alert("ไม่พบข้อมูล", "ไม่พบข้อมูลผู้ป่วยในระบบ");
          return;
        }

        // เติมข้อมูลลง Form
        setPatientId(data.patient_id ?? "");
        setName(data.name ?? "");
        setCitizenId(data.citizen_id ?? "");
        setGender(data.gender ?? "");
        setAge(data.age ?? "");
        setPhone(data.phone ?? "");

        setErrors({
          patientId: "",
          name: "",
          citizenId: "",
          gender: "",
          age: "",
          phone: "",
        });
      } catch (error) {
        console.error("Load patient error:", error);

        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลผู้ป่วยได้");
      }
    };

    loadPatient();
  }, [selectedCitizenId]);

  // =========================================================
  // Validation
  // =========================================================

  const validatePatientId = (_value: string) => {
    // Patient ID ไม่บังคับ
    return "";
  };

  const validateName = (value: string) => {
    if (!value.trim()) {
      return "กรุณากรอกชื่อ - นามสกุล";
    }

    return "";
  };

  const validateCitizenId = (value: string) => {
    if (!value) {
      return "กรุณากรอกเลขบัตรประชาชนให้ถูกต้อง";
    }

    if (!/^\d{13}$/.test(value)) {
      return "กรุณากรอกเลขบัตรประชาชนให้ถูกต้อง";
    }

    return "";
  };

  const validateGender = (value: string) => {
    if (!value) {
      return "กรุณาเลือกเพศ";
    }

    return "";
  };

  const validateAge = (value: string) => {
    if (!value) {
      return "กรุณากรอกอายุให้ถูกต้อง";
    }

    const number = Number(value);

    if (number < 1 || number > 120) {
      return "กรุณากรอกอายุให้ถูกต้อง";
    }

    return "";
  };

  const validatePhone = (value: string) => {
    if (!value) {
      return "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง";
    }

    if (!/^\d{10}$/.test(value)) {
      return "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง";
    }

    return "";
  };

  // =========================================================
  // Save
  // =========================================================

  const handleNext = async () => {
    const newErrors = {
      patientId: validatePatientId(patientId),
      name: validateName(name),
      citizenId: validateCitizenId(citizenId),
      gender: validateGender(gender),
      age: validateAge(age),
      phone: validatePhone(phone),
    };

    setErrors(newErrors);

    const hasError = Object.values(newErrors).some((error) => error !== "");

    if (hasError) {
      return;
    }

    try {
      // =====================================================
      // Get Current User
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("ไม่พบผู้ใช้งาน", "กรุณา Login ใหม่");

        router.replace("/login");
        return;
      }

      // =====================================================
      // เตรียมข้อมูล
      // =====================================================

      const patientData = {
        patient_id: patientId.trim() || null,
        name: name.trim(),
        citizen_id: citizenId.trim(),
        gender,
        age,
        phone: phone.trim(),
      };

      // =====================================================
      // NEW PATIENT
      // =====================================================

      if (!selectedCitizenId) {
        // ตรวจ Citizen ID ซ้ำ
        const { data: citizenExists, error: citizenError } = await supabase
          .from("user_patients")
          .select("id")
          .eq("user_id", user.id)
          .eq("citizen_id", patientData.citizen_id)
          .maybeSingle();

        if (citizenError) {
          console.error("Check citizen ID error:", citizenError);

          Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถตรวจสอบเลขบัตรประชาชนได้");
          return;
        }

        if (citizenExists) {
          setErrors({
            ...newErrors,
            citizenId: "เลขบัตรประชาชนนี้มีอยู่แล้ว",
          });
          return;
        }

        // ตรวจ Patient ID ซ้ำ
        if (patientData.patient_id) {
          const { data: patientIdExists, error: patientIdError } =
            await supabase
              .from("user_patients")
              .select("id")
              .eq("user_id", user.id)
              .eq("patient_id", patientData.patient_id)
              .maybeSingle();

          if (patientIdError) {
            console.error("Check patient ID error:", patientIdError);

            Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถตรวจสอบ Patient ID ได้");
            return;
          }

          if (patientIdExists) {
            setErrors({
              ...newErrors,
              patientId: "Patient ID นี้มีอยู่แล้ว",
            });
            return;
          }
        }

        // INSERT
        const { error: insertError } = await supabase
          .from("user_patients")
          .insert({
            user_id: user.id,
            ...patientData,
          } as never);

        if (insertError) {
          console.error("Insert patient error:", insertError);

          Alert.alert("บันทึกไม่สำเร็จ", insertError.message);
          return;
        }
      }

      // =====================================================
      // EXISTING PATIENT
      // =====================================================
      else {
        // หา Patient เดิม
        const { data: existingPatient, error: findError } = await supabase
          .from("user_patients")
          .select("id")
          .eq("user_id", user.id)
          .eq("citizen_id", String(selectedCitizenId))
          .maybeSingle();

        if (findError) {
          console.error("Find patient error:", findError);

          Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถค้นหาผู้ป่วยได้");
          return;
        }

        if (!existingPatient) {
          Alert.alert("ไม่พบผู้ป่วย", "ไม่พบข้อมูลผู้ป่วยในระบบ");
          return;
        }

        // ตรวจ Patient ID ซ้ำกับคนอื่น
        if (patientData.patient_id) {
          const { data: duplicatePatientId, error: duplicateError } =
            await supabase
              .from("user_patients")
              .select("id")
              .eq("user_id", user.id)
              .eq("patient_id", patientData.patient_id)
              .neq("id", (existingPatient as { id: string }).id)
              .maybeSingle();

          if (duplicateError) {
            console.error("Duplicate patient ID error:", duplicateError);

            Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถตรวจสอบ Patient ID ได้");
            return;
          }

          if (duplicatePatientId) {
            setErrors({
              ...newErrors,
              patientId: "Patient ID นี้มีอยู่แล้ว",
            });
            return;
          }
        }

        // UPDATE
        const { error: updateError } = await supabase
          .from("user_patients")
          .update(patientData as never)
          .eq("id", (existingPatient as { id: string }).id)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Update patient error:", updateError);

          Alert.alert("บันทึกไม่สำเร็จ", updateError.message);
          return;
        }
      }

      // =====================================================
      // ไปหน้า Main
      // =====================================================

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Save patient error:", error);

      Alert.alert("ไม่สามารถบันทึกข้อมูลได้", "กรุณาลองใหม่อีกครั้ง");
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      {/* =====================================================
          Header แบบเดียวกับ Existing Patient
          ===================================================== */}

      <Stack.Screen
        options={{
          headerShown: true,
          title: "Patient Information",
          headerTitleAlign: "left",

          headerRight: () => (
            <Image
              source={require("../assets/images/logo-app.jpg")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          ),
        }}
      />

      <ScrollView
        style={styles.background}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===================================================
            Page Header
            =================================================== */}

        <View style={styles.header}>
          <Text style={styles.welcome}>Patient Information</Text>

          <Text style={styles.logo}>
            Cushion <Text style={styles.sense}>Sense</Text>
          </Text>
        </View>

        {/* ===================================================
            Form
            =================================================== */}

        <View style={styles.card}>
          {/* Patient ID */}

          <TextInput
            ref={patientIdRef}
            style={[styles.input, errors.patientId !== "" && styles.inputError]}
            placeholder="Patient ID"
            placeholderTextColor="#777"
            value={patientId}
            onChangeText={(text) => {
              setPatientId(text);

              if (errors.patientId) {
                setErrors({
                  ...errors,
                  patientId: validatePatientId(text),
                });
              }
            }}
            returnKeyType="next"
            onSubmitEditing={() => {
              nameRef.current?.focus();
            }}
            blurOnSubmit={false}
          />

          <Text style={styles.noteText}>ระบุหากมี</Text>

          {errors.patientId !== "" && (
            <Text style={styles.errorText}>{errors.patientId}</Text>
          )}

          {/* Name */}

          <TextInput
            ref={nameRef}
            style={[styles.input, errors.name !== "" && styles.inputError]}
            placeholder="ชื่อ - นามสกุล"
            placeholderTextColor="#777"
            value={name}
            onChangeText={(text) => {
              setName(text);

              if (errors.name) {
                setErrors({
                  ...errors,
                  name: validateName(text),
                });
              }
            }}
            onBlur={() => {
              setErrors({
                ...errors,
                name: validateName(name),
              });
            }}
            returnKeyType="next"
            onSubmitEditing={() => {
              citizenIdRef.current?.focus();
            }}
            blurOnSubmit={false}
          />

          {errors.name !== "" && (
            <Text style={styles.errorText}>{errors.name}</Text>
          )}

          {/* Citizen ID */}

          <TextInput
            ref={citizenIdRef}
            style={[styles.input, errors.citizenId !== "" && styles.inputError]}
            placeholder="เลขบัตรประจำตัวประชาชน"
            placeholderTextColor="#777"
            value={citizenId}
            onChangeText={(text) => {
              const onlyNumbers = text.replace(/[^0-9]/g, "");

              if (onlyNumbers.length <= 13) {
                setCitizenId(onlyNumbers);

                if (errors.citizenId) {
                  setErrors({
                    ...errors,
                    citizenId: validateCitizenId(onlyNumbers),
                  });
                }
              }
            }}
            keyboardType="number-pad"
            maxLength={13}
            onBlur={() => {
              setErrors({
                ...errors,
                citizenId: validateCitizenId(citizenId),
              });
            }}
            returnKeyType="next"
            onSubmitEditing={() => {
              ageRef.current?.focus();
            }}
            blurOnSubmit={false}
          />

          {errors.citizenId !== "" && (
            <Text style={styles.errorText}>{errors.citizenId}</Text>
          )}

          {/* Gender + Age */}

          <View style={styles.row}>
            {/* Gender */}

            <View style={styles.halfContainer}>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.dropdown,
                  errors.gender !== "" && styles.inputError,
                ]}
                onPress={() => setGenderOpen(!genderOpen)}
              >
                <Text
                  style={gender ? styles.selectedText : styles.placeholderText}
                >
                  {gender || "เพศ"}
                </Text>

                <Text style={styles.arrow}>{genderOpen ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {genderOpen && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      setGender("ชาย");
                      setGenderOpen(false);

                      setErrors({
                        ...errors,
                        gender: "",
                      });

                      ageRef.current?.focus();
                    }}
                  >
                    <Text style={styles.optionText}>ชาย</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      setGender("หญิง");
                      setGenderOpen(false);

                      setErrors({
                        ...errors,
                        gender: "",
                      });

                      ageRef.current?.focus();
                    }}
                  >
                    <Text style={styles.optionText}>หญิง</Text>
                  </TouchableOpacity>
                </View>
              )}

              {errors.gender !== "" && (
                <Text style={styles.errorText}>{errors.gender}</Text>
              )}
            </View>

            {/* Age */}

            <View style={styles.halfContainer}>
              <TextInput
                ref={ageRef}
                style={[styles.input, errors.age !== "" && styles.inputError]}
                placeholder="อายุ"
                placeholderTextColor="#777"
                value={age}
                onChangeText={(text) => {
                  const onlyNumbers = text.replace(/[^0-9]/g, "");

                  setAge(onlyNumbers);

                  if (errors.age) {
                    setErrors({
                      ...errors,
                      age: validateAge(onlyNumbers),
                    });
                  }
                }}
                keyboardType="number-pad"
                maxLength={3}
                onBlur={() => {
                  setErrors({
                    ...errors,
                    age: validateAge(age),
                  });
                }}
                returnKeyType="next"
                onSubmitEditing={() => {
                  phoneRef.current?.focus();
                }}
                blurOnSubmit={false}
              />

              {errors.age !== "" && (
                <Text style={styles.errorText}>{errors.age}</Text>
              )}
            </View>
          </View>

          {/* Phone */}

          <TextInput
            ref={phoneRef}
            style={[styles.input, errors.phone !== "" && styles.inputError]}
            placeholder="เบอร์โทรศัพท์"
            placeholderTextColor="#777"
            value={phone}
            onChangeText={(text) => {
              const onlyNumbers = text.replace(/[^0-9]/g, "");

              if (onlyNumbers.length <= 10) {
                setPhone(onlyNumbers);

                if (errors.phone) {
                  setErrors({
                    ...errors,
                    phone: validatePhone(onlyNumbers),
                  });
                }
              }
            }}
            keyboardType="phone-pad"
            maxLength={10}
            onBlur={() => {
              setErrors({
                ...errors,
                phone: validatePhone(phone),
              });
            }}
            returnKeyType="done"
            onSubmitEditing={handleNext}
          />

          {errors.phone !== "" && (
            <Text style={styles.errorText}>{errors.phone}</Text>
          )}

          {/* Next */}

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

// =========================================================
// Styles
// =========================================================

const styles = StyleSheet.create({
  // =======================================================
  // Logo ด้านขวาบน
  // ใช้ขนาดเดียวกับ Existing Patient
  // =======================================================

  headerLogo: {
    width: 105,
    height: 35,
    marginRight: 25,
  },

  // =======================================================
  // Background
  // =======================================================

  background: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  // =======================================================
  // Scroll
  // =======================================================

  scrollContainer: {
    alignItems: "center",
    paddingVertical: 55,
    paddingHorizontal: 20,
  },

  // =======================================================
  // Page Header
  // =======================================================

  header: {
    alignItems: "center",
    marginBottom: 35,
  },

  welcome: {
    fontSize: 38,
    fontWeight: "700",
    color: BLUE,
    marginBottom: 4,
  },

  logo: {
    fontSize: 32,
    fontStyle: "italic",
    fontWeight: "700",
    color: BLUE,
  },

  sense: {
    fontStyle: "italic",
    fontWeight: "400",
  },

  // =======================================================
  // Form Card
  // =======================================================

  card: {
    width: "100%",
    maxWidth: 475,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 15,
    paddingHorizontal: 38,
    paddingVertical: 35,
  },

  // =======================================================
  // Input
  // =======================================================

  input: {
    width: "100%",
    height: 60,
    borderWidth: 1,
    borderColor: "#C9C9C9",
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 17,
    color: "#222",
    backgroundColor: "#FFFFFF",
    marginBottom: 15,
  },

  inputError: {
    borderColor: "#FF0000",
    borderWidth: 1.5,
  },

  // =======================================================
  // Note
  // =======================================================

  noteText: {
    fontSize: 12,
    color: "#888",
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 5,
  },

  // =======================================================
  // Error
  // =======================================================

  errorText: {
    color: "#FF0000",
    fontSize: 13,
    marginTop: -8,
    marginBottom: 15,
  },

  // =======================================================
  // Gender + Age
  // =======================================================

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    zIndex: 10,
  },

  halfContainer: {
    flex: 1,
  },

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  placeholderText: {
    color: "#777",
    fontSize: 17,
  },

  selectedText: {
    color: "#222",
    fontSize: 17,
  },

  arrow: {
    fontSize: 12,
    color: "#666",
  },

  // =======================================================
  // Dropdown
  // =======================================================

  dropdownMenu: {
    position: "absolute",
    top: 65,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C9C9C9",
    borderRadius: 10,
    zIndex: 100,
    elevation: 5,
  },

  option: {
    height: 50,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  optionText: {
    fontSize: 17,
    color: "#222",
  },

  // =======================================================
  // Next Button
  // =======================================================

  nextButton: {
    width: "40%",
    height: 40,
    backgroundColor: BLUE,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: 20,
  },

  nextText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
});
