import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BLUE = "#4966D5";

export default function PatientInfo() {
  const router = useRouter();

  const nameRef = useRef<TextInput>(null);
  const citizenIdRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const [name, setName] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");

  const [genderOpen, setGenderOpen] = useState(false);

  const [errors, setErrors] = useState({
    name: "",
    citizenId: "",
    gender: "",
    age: "",
    phone: "",
  });

  // =========================
  // ตรวจสอบชื่อ
  // =========================
  const validateName = (value: string) => {
    if (!value.trim()) {
      return "กรุณากรอกชื่อ - นามสกุล";
    }

    return "";
  };

  // =========================
  // ตรวจสอบเลขบัตรประชาชน
  // =========================
  const validateCitizenId = (value: string) => {
    if (!value) {
      return "กรุณากรอกเลขบัตรประชาชน";
    }

    if (!/^\d{13}$/.test(value)) {
      return "กรุณากรอกเลขบัตรประชาชน";
    }

    return "";
  };

  // =========================
  // ตรวจสอบเพศ
  // =========================
  const validateGender = (value: string) => {
    if (!value) {
      return "กรุณาเลือกเพศ";
    }

    return "";
  };

  // =========================
  // ตรวจสอบอายุ
  // =========================
  const validateAge = (value: string) => {
    if (!value) {
      return "กรุณากรอกอายุ";
    }

    const number = Number(value);

    if (number < 1 || number > 120) {
      return "กรุณากรอกอายุ";
    }

    return "";
  };

  // =========================
  // ตรวจสอบเบอร์โทร
  // =========================
  const validatePhone = (value: string) => {
    if (!value) {
      return "กรุณากรอกเบอร์โทรศัพท์";
    }

    if (!/^\d{10}$/.test(value)) {
      return "กรุณากรอกเบอร์โทรศัพท์";
    }

    return "";
  };

  // =========================
  // ฟังก์ชัน Next
  // ใช้ได้ทั้งปุ่ม Next และ Enter
  // =========================
  const handleNext = async () => {
    const newErrors = {
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

    const patientInfo = {
      name: name.trim(),
      citizenId,
      gender,
      age,
      phone,
    };

    try {
      await AsyncStorage.setItem("patientInfo", JSON.stringify(patientInfo));

      router.replace("/(tabs)");
    } catch (error) {
      console.error("ไม่สามารถบันทึกข้อมูลได้:", error);
      alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่");
    }
  };

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
        {/* =========================
            Name
        ========================= */}
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

        {/* =========================
            Citizen ID
        ========================= */}
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

        {/* =========================
            Gender + Age
        ========================= */}
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

        {/* =========================
            Phone
        ========================= */}
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
          // =========================
          // กด Enter = Next
          // =========================
          returnKeyType="done"
          onSubmitEditing={handleNext}
        />

        {errors.phone !== "" && (
          <Text style={styles.errorText}>{errors.phone}</Text>
        )}

        {/* =========================
            Next Button
        ========================= */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

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
