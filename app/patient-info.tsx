import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BLUE = "#4464D0";

type Patient = {
  patientId: string;
  name: string;
  citizenId: string;
  gender: string;
  age: string;
  phone: string;
};

export default function PatientInfo() {
  const router = useRouter();

  // =========================================================
  // รับ Citizen ID จาก Existing Patient
  // =========================================================

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
  // Existing Patient
  // โหลดข้อมูลจาก Patient List
  // =========================================================

  useEffect(() => {
    const loadPatient = async () => {
      try {
        // =====================================================
        // ถ้าไม่มี Citizen ID
        // แปลว่าเป็น New Patient
        // =====================================================

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

        // =====================================================
        // โหลด Patient List
        // =====================================================

        const data = await AsyncStorage.getItem("patientList");

        if (!data) {
          console.log("ไม่พบ patientList");
          return;
        }

        const patients: Patient[] = JSON.parse(data);

        // =====================================================
        // ค้นหาผู้ป่วยด้วย Citizen ID
        // =====================================================

        const patient = patients.find(
          (item) => String(item.citizenId) === String(selectedCitizenId),
        );

        // =====================================================
        // ไม่พบผู้ป่วย
        // =====================================================

        if (!patient) {
          console.log("ไม่พบผู้ป่วย Citizen ID:", selectedCitizenId);

          return;
        }

        // =====================================================
        // พบผู้ป่วย
        // เติมข้อมูลลงในช่องทั้งหมด
        // =====================================================

        setPatientId(patient.patientId || "");

        setName(patient.name || "");

        setCitizenId(patient.citizenId || "");

        setGender(patient.gender || "");

        setAge(patient.age || "");

        setPhone(patient.phone || "");

        // ล้าง Error
        setErrors({
          patientId: "",
          name: "",
          citizenId: "",
          gender: "",
          age: "",
          phone: "",
        });
      } catch (error) {
        console.error("ไม่สามารถโหลดข้อมูลผู้ป่วยได้:", error);
      }
    };

    loadPatient();
  }, [selectedCitizenId]);

  // =========================================================
  // Validation
  // =========================================================

  // Patient ID ไม่บังคับ
  const validatePatientId = (value: string) => {
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
  // Next
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
      // โหลด Patient List
      // =====================================================

      const storedData = await AsyncStorage.getItem("patientList");

      let patients: Patient[] = storedData ? JSON.parse(storedData) : [];

      // =====================================================
      // ข้อมูลผู้ป่วยใหม่
      // =====================================================

      const newPatient: Patient = {
        patientId: patientId.trim(),

        name: name.trim(),

        citizenId: citizenId.trim(),

        gender,

        age,

        phone: phone.trim(),
      };

      // =====================================================
      // New Patient
      // =====================================================

      if (!selectedCitizenId) {
        // ตรวจ Citizen ID ซ้ำ
        const duplicateCitizenId = patients.some(
          (patient) => patient.citizenId === newPatient.citizenId,
        );

        if (duplicateCitizenId) {
          setErrors({
            ...newErrors,

            citizenId: "เลขบัตรประชาชนนี้มีอยู่แล้ว",
          });

          return;
        }

        // =================================================
        // ตรวจ Patient ID ซ้ำ
        // เฉพาะกรณีที่ผู้ใช้กรอก
        // =================================================

        if (newPatient.patientId) {
          const duplicatePatientId = patients.some(
            (patient) =>
              patient.patientId &&
              patient.patientId.toLowerCase() ===
                newPatient.patientId.toLowerCase(),
          );

          if (duplicatePatientId) {
            setErrors({
              ...newErrors,

              patientId: "Patient ID นี้มีอยู่แล้ว",
            });

            return;
          }
        }

        // เพิ่มผู้ป่วยใหม่
        patients.push(newPatient);
      }

      // =====================================================
      // Existing Patient
      // =====================================================
      else {
        const index = patients.findIndex(
          (patient) => patient.citizenId === selectedCitizenId,
        );

        if (index !== -1) {
          // =================================================
          // ตรวจ Patient ID ซ้ำ
          // =================================================

          if (newPatient.patientId) {
            const duplicatePatientId = patients.some(
              (patient, patientIndex) =>
                patientIndex !== index &&
                patient.patientId &&
                patient.patientId.toLowerCase() ===
                  newPatient.patientId.toLowerCase(),
            );

            if (duplicatePatientId) {
              setErrors({
                ...newErrors,

                patientId: "Patient ID นี้มีอยู่แล้ว",
              });

              return;
            }
          }

          // อัปเดตข้อมูลผู้ป่วยเดิม
          patients[index] = newPatient;
        }
      }

      // =====================================================
      // บันทึก Patient List
      // =====================================================

      await AsyncStorage.setItem("patientList", JSON.stringify(patients));

      // =====================================================
      // บันทึกผู้ป่วยที่เลือก
      // =====================================================

      await AsyncStorage.setItem("selectedPatientId", newPatient.citizenId);

      // =====================================================
      // บันทึก Patient Info
      // =====================================================

      await AsyncStorage.setItem("patientInfo", JSON.stringify(newPatient));

      // =====================================================
      // ไปหน้า Main
      // =====================================================

      router.replace("/(tabs)");
    } catch (error) {
      console.error("ไม่สามารถบันทึกข้อมูลได้:", error);

      alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่");
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <ScrollView
      style={styles.background}
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}

      <View style={styles.header}>
        <Text style={styles.welcome}>Patient Information</Text>

        <Text style={styles.logo}>
          Cushion <Text style={styles.sense}>Sense</Text>
        </Text>
      </View>

      {/* Form */}

      <View style={styles.card}>
        {/* ================================================= */}
        {/* Patient ID */}
        {/* ================================================= */}

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

        {/* ================================================= */}
        {/* Name */}
        {/* ================================================= */}

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

        {/* ================================================= */}
        {/* Citizen ID */}
        {/* ================================================= */}

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

        {/* ================================================= */}
        {/* Gender + Age */}
        {/* ================================================= */}

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

            {/* Dropdown */}

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

        {/* ================================================= */}
        {/* Phone */}
        {/* ================================================= */}

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

        {/* ================================================= */}
        {/* Next */}
        {/* ================================================= */}

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// =========================================================
// Styles
// =========================================================

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  scrollContainer: {
    alignItems: "center",
    paddingVertical: 55,
    paddingHorizontal: 20,
  },

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

  noteText: {
    fontSize: 12,
    color: "#888",
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 5,
  },

  errorText: {
    color: "#FF0000",
    fontSize: 13,
    marginTop: -8,
    marginBottom: 15,
  },

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
