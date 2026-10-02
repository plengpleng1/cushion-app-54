import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const BLUE = "#2D69CA";
const SELECTED_PATIENT_KEY = "selectedPatientId";

type Patient = {
  id: string;
  patientId: string | null;
  name: string;
  citizenId: string;
  gender: string;
  age: string;
  phone: string;
};

export default function PatientListScreen() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [patientId, setPatientId] = useState("");
  const [name, setName] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");

  const [genderOpen, setGenderOpen] = useState(false);

  // =========================================================
  // Refs
  // =========================================================

  const patientIdRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const citizenIdRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  // =========================================================
  // Errors
  // =========================================================

  const [errors, setErrors] = useState({
    name: "",
    citizenId: "",
    gender: "",
    age: "",
    phone: "",
    patientId: "",
  });

  // =========================================================
  // Load Selected Patient
  // =========================================================

  const loadSelectedPatient = async () => {
    try {
      const savedPatientId = await AsyncStorage.getItem(SELECTED_PATIENT_KEY);

      setSelectedPatientId(savedPatientId ?? "");
    } catch (error) {
      console.error("Load selected patient error:", error);
      setSelectedPatientId("");
    }
  };

  // =========================================================
  // Load Patient List
  // =========================================================

  const loadPatients = async () => {
    try {
      // =====================================================
      // Current User
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("ไม่พบ User:", userError);

        setPatients([]);
        return;
      }

      // =====================================================
      // Load Patients ของ User นี้
      // =====================================================

      const { data, error } = await supabase
        .from("user_patients")
        .select("id, patient_id, name, citizen_id, gender, age, phone")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load Patient List error:", error);

        setPatients([]);
        return;
      }

      const formattedPatients: Patient[] = (data ?? []).map(
        (patient: {
          id: string;
          patient_id: string;
          name: string | null;
          citizen_id: string | null;
          gender: string | null;
          age: string | number | null;
          phone: string | null;
        }) => ({
          id: patient.id,
          patientId: patient.patient_id,
          name: patient.name ?? "",
          citizenId: patient.citizen_id ?? "",
          gender: patient.gender ?? "",
          age: patient.age == null ? "" : String(patient.age),
          phone: patient.phone ?? "",
        }),
      );

      setPatients(formattedPatients);
    } catch (error) {
      console.error("ไม่สามารถโหลด Patient List ได้:", error);

      setPatients([]);
    }
  };

  // =========================================================
  // Load ใหม่ทุกครั้งที่กลับเข้าหน้า Patient List
  // =========================================================

  useFocusEffect(
    useCallback(() => {
      loadPatients();
      loadSelectedPatient();
    }, []),
  );

  // =========================================================
  // Clear Form
  // =========================================================

  const clearForm = () => {
    setPatientId("");
    setName("");
    setCitizenId("");
    setGender("");
    setAge("");
    setPhone("");

    setGenderOpen(false);
    setEditingId(null);

    setErrors({
      name: "",
      citizenId: "",
      gender: "",
      age: "",
      phone: "",
      patientId: "",
    });
  };

  // =========================================================
  // Add
  // =========================================================

  const openAddPatient = () => {
    clearForm();
    setModalVisible(true);
  };

  // =========================================================
  // Edit
  // =========================================================

  const openEditPatient = (patient: Patient) => {
    setEditingId(patient.id);

    setPatientId(patient.patientId || "");
    setName(patient.name || "");
    setCitizenId(patient.citizenId || "");
    setGender(patient.gender || "");
    setAge(patient.age || "");
    setPhone(patient.phone || "");

    setGenderOpen(false);

    setErrors({
      name: "",
      citizenId: "",
      gender: "",
      age: "",
      phone: "",
      patientId: "",
    });

    setModalVisible(true);
  };

  // =========================================================
  // Validation
  // =========================================================

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

  const validateAll = () => {
    const newErrors = {
      name: validateName(name),
      citizenId: validateCitizenId(citizenId),
      gender: validateGender(gender),
      age: validateAge(age),
      phone: validatePhone(phone),
      patientId: "",
    };

    setErrors(newErrors);

    return !Object.values(newErrors).some((error) => error !== "");
  };

  // =========================================================
  // Save
  // =========================================================

  const savePatient = async () => {
    if (!validateAll()) {
      return;
    }

    try {
      // =====================================================
      // Current User
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

      const trimmedPatientId = patientId.trim() || null;

      const trimmedCitizenId = citizenId.trim();

      // =====================================================
      // ตรวจ Citizen ID ซ้ำ
      // =====================================================

      let citizenQuery = supabase
        .from("user_patients")
        .select("id")
        .eq("user_id", user.id)
        .eq("citizen_id", trimmedCitizenId);

      if (editingId) {
        citizenQuery = citizenQuery.neq("id", editingId);
      }

      const { data: duplicateCitizen, error: citizenError } =
        await citizenQuery.maybeSingle();

      if (citizenError) {
        console.error("Check citizen ID error:", citizenError);

        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถตรวจสอบเลขบัตรประชาชนได้");

        return;
      }

      if (duplicateCitizen) {
        setErrors((prev) => ({
          ...prev,
          citizenId: "เลขบัตรประชาชนนี้มีอยู่แล้ว",
        }));

        return;
      }

      // =====================================================
      // ตรวจ Patient ID ซ้ำ
      // =====================================================

      if (trimmedPatientId) {
        let patientIdQuery = supabase
          .from("user_patients")
          .select("id")
          .eq("user_id", user.id)
          .eq("patient_id", trimmedPatientId);

        if (editingId) {
          patientIdQuery = patientIdQuery.neq("id", editingId);
        }

        const { data: duplicatePatientId, error: patientIdError } =
          await patientIdQuery.maybeSingle();

        if (patientIdError) {
          console.error("Check Patient ID error:", patientIdError);

          Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถตรวจสอบ Patient ID ได้");

          return;
        }

        if (duplicatePatientId) {
          setErrors((prev) => ({
            ...prev,
            patientId: "Patient ID นี้มีอยู่แล้ว",
          }));

          return;
        }
      }

      // =====================================================
      // ข้อมูลที่จะบันทึก
      // =====================================================

      const patientData = {
        patient_id: trimmedPatientId,
        name: name.trim(),
        citizen_id: trimmedCitizenId,
        gender,
        age,
        phone: phone.trim(),
      };

      // =====================================================
      // EDIT
      // =====================================================

      if (editingId) {
        const { error: updateError } = await supabase
          .from("user_patients")
          .update(patientData as never)
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Update patient error:", updateError);

          Alert.alert("บันทึกไม่สำเร็จ", updateError.message);

          return;
        }
      }

      // =====================================================
      // ADD
      // =====================================================
      else {
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
      // Reload
      // =====================================================

      await loadPatients();

      setModalVisible(false);
      clearForm();
    } catch (error) {
      console.error("Save patient error:", error);

      if (Platform.OS === "web") {
        window.alert("ไม่สามารถบันทึกข้อมูลได้");
      } else {
        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
      }
    }
  };

  // =========================================================
  // Select Patient
  // =========================================================

  const selectPatient = (patient: Patient) => {
    const confirmSelect = async () => {
      try {
        await AsyncStorage.setItem(SELECTED_PATIENT_KEY, patient.citizenId);

        setSelectedPatientId(patient.citizenId);

        router.push({
          pathname: "/patient-info",
          params: {
            citizenId: patient.citizenId,
          },
        });
      } catch (error) {
        console.error("Save selected patient error:", error);

        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกผู้ป่วยที่เลือกได้");
      }
    };

    if (Platform.OS === "web") {
      const result = window.confirm(
        `ต้องการเลือกผู้ป่วย ${patient.name} ใช่หรือไม่?`,
      );

      if (result) {
        confirmSelect();
      }
    } else {
      Alert.alert("เลือกผู้ป่วย", `ต้องการเลือก ${patient.name} หรือไม่?`, [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "เลือก",
          onPress: confirmSelect,
        },
      ]);
    }
  };

  // =========================================================
  // Delete Patient
  // =========================================================

  const deletePatient = (patient: Patient) => {
    const performDelete = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          Alert.alert("ไม่พบผู้ใช้งาน", "กรุณา Login ใหม่");

          return;
        }

        // ===================================================
        // Delete เฉพาะ row ของ User นี้
        // ===================================================

        const { error } = await supabase
          .from("user_patients")
          .delete()
          .eq("id", patient.id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Delete patient error:", error);

          Alert.alert("ลบไม่สำเร็จ", error.message);

          return;
        }

        // ถ้าลบ Patient ที่กำลังเลือกอยู่
        if (selectedPatientId === patient.citizenId) {
          setSelectedPatientId("");

          await AsyncStorage.removeItem(SELECTED_PATIENT_KEY);
        }

        await loadPatients();
      } catch (error) {
        console.error("Delete patient error:", error);

        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถลบผู้ป่วยได้");
      }
    };

    if (Platform.OS === "web") {
      const result = window.confirm(`ต้องการลบ ${patient.name} หรือไม่?`);

      if (result) {
        performDelete();
      }
    } else {
      Alert.alert("ลบผู้ป่วย", `ต้องการลบ ${patient.name} หรือไม่?`, [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ลบ",
          style: "destructive",
          onPress: performDelete,
        },
      ]);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patient Lists</Text>

        <Text style={styles.subtitle}>รายการผู้ป่วย</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {patients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>ไม่พบข้อมูลผู้ป่วย</Text>
          </View>
        ) : (
          patients.map((patient) => {
            const isSelected = selectedPatientId === patient.citizenId;

            return (
              <View
                key={patient.id}
                style={[styles.patientCard, isSelected && styles.selectedCard]}
              >
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.name}</Text>

                  <Text style={styles.patientText}>
                    Patient ID: {patient.patientId || "-"}
                  </Text>

                  <Text style={styles.patientText}>
                    เลขบัตรประชาชน: {patient.citizenId}
                  </Text>

                  <Text style={styles.patientText}>เพศ: {patient.gender}</Text>

                  <Text style={styles.patientText}>อายุ: {patient.age} ปี</Text>

                  <Text style={styles.patientText}>
                    เบอร์โทรศัพท์: {patient.phone}
                  </Text>
                </View>

                <View style={styles.cardButtons}>
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      isSelected && styles.selectedButton,
                    ]}
                    onPress={() => selectPatient(patient)}
                  >
                    <Text style={styles.selectButtonText}>
                      {isSelected ? "Selected" : "Select"}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.smallButtonsRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditPatient(patient)}
                    >
                      <Text style={styles.editText}>✎</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deletePatient(patient)}
                    >
                      <Text style={styles.deleteButtonText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ADD BUTTON */}

      <TouchableOpacity style={styles.addButton} onPress={openAddPatient}>
        <Text style={styles.plus}>+</Text>
      </TouchableOpacity>

      {/* MODAL */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          clearForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingId ? "Edit Patient" : "Add Patient"}
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Patient ID */}

              <TextInput
                ref={patientIdRef}
                style={[
                  styles.modalInput,
                  errors.patientId !== "" && styles.inputError,
                ]}
                placeholder="Patient ID"
                placeholderTextColor="#777"
                value={patientId}
                onChangeText={(text) => {
                  setPatientId(text);

                  if (errors.patientId) {
                    setErrors((prev) => ({
                      ...prev,
                      patientId: "",
                    }));
                  }
                }}
                returnKeyType="next"
                onSubmitEditing={() => nameRef.current?.focus()}
                blurOnSubmit={false}
              />

              <Text style={styles.patientIdNote}>ระบุหากมี</Text>

              {errors.patientId !== "" && (
                <Text style={styles.errorText}>{errors.patientId}</Text>
              )}

              {/* Name */}

              <TextInput
                ref={nameRef}
                style={[
                  styles.modalInput,
                  errors.name !== "" && styles.inputError,
                ]}
                placeholder="ชื่อ - นามสกุล"
                placeholderTextColor="#777"
                value={name}
                onChangeText={(text) => {
                  setName(text);

                  if (errors.name) {
                    setErrors((prev) => ({
                      ...prev,
                      name: validateName(text),
                    }));
                  }
                }}
                onBlur={() => {
                  setErrors((prev) => ({
                    ...prev,
                    name: validateName(name),
                  }));
                }}
                returnKeyType="next"
                onSubmitEditing={() => citizenIdRef.current?.focus()}
                blurOnSubmit={false}
              />

              {errors.name !== "" && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

              {/* Citizen ID */}

              <TextInput
                ref={citizenIdRef}
                style={[
                  styles.modalInput,
                  errors.citizenId !== "" && styles.inputError,
                ]}
                placeholder="เลขบัตรประจำตัวประชาชน"
                placeholderTextColor="#777"
                value={citizenId}
                onChangeText={(text) => {
                  const onlyNumbers = text.replace(/[^0-9]/g, "").slice(0, 13);

                  setCitizenId(onlyNumbers);

                  if (errors.citizenId) {
                    setErrors((prev) => ({
                      ...prev,
                      citizenId: validateCitizenId(onlyNumbers),
                    }));
                  }
                }}
                keyboardType="number-pad"
                maxLength={13}
                onBlur={() => {
                  setErrors((prev) => ({
                    ...prev,
                    citizenId: validateCitizenId(citizenId),
                  }));
                }}
                returnKeyType="next"
                onSubmitEditing={() => ageRef.current?.focus()}
                blurOnSubmit={false}
              />

              {errors.citizenId !== "" && (
                <Text style={styles.errorText}>{errors.citizenId}</Text>
              )}

              {/* Gender + Age */}

              <View style={styles.row}>
                <View style={styles.halfContainer}>
                  <TouchableOpacity
                    style={[
                      styles.modalInput,
                      styles.genderInput,
                      errors.gender !== "" && styles.inputError,
                    ]}
                    onPress={() => setGenderOpen(!genderOpen)}
                  >
                    <Text
                      style={
                        gender ? styles.selectedText : styles.placeholderText
                      }
                    >
                      {gender || "เพศ"}
                    </Text>

                    <Text style={styles.arrow}>{genderOpen ? "▲" : "▼"}</Text>
                  </TouchableOpacity>

                  {genderOpen && (
                    <View style={styles.genderMenu}>
                      <TouchableOpacity
                        style={styles.genderOption}
                        onPress={() => {
                          setGender("ชาย");
                          setGenderOpen(false);

                          setErrors((prev) => ({
                            ...prev,
                            gender: "",
                          }));

                          ageRef.current?.focus();
                        }}
                      >
                        <Text style={styles.optionText}>ชาย</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.genderOption}
                        onPress={() => {
                          setGender("หญิง");
                          setGenderOpen(false);

                          setErrors((prev) => ({
                            ...prev,
                            gender: "",
                          }));

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

                <View style={styles.halfContainer}>
                  <TextInput
                    ref={ageRef}
                    style={[
                      styles.modalInput,
                      errors.age !== "" && styles.inputError,
                    ]}
                    placeholder="อายุ"
                    placeholderTextColor="#777"
                    value={age}
                    onChangeText={(text) => {
                      const onlyNumbers = text
                        .replace(/[^0-9]/g, "")
                        .slice(0, 3);

                      setAge(onlyNumbers);

                      if (errors.age) {
                        setErrors((prev) => ({
                          ...prev,
                          age: validateAge(onlyNumbers),
                        }));
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                    onBlur={() => {
                      setErrors((prev) => ({
                        ...prev,
                        age: validateAge(age),
                      }));
                    }}
                    returnKeyType="next"
                    onSubmitEditing={() => phoneRef.current?.focus()}
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
                style={[
                  styles.modalInput,
                  errors.phone !== "" && styles.inputError,
                ]}
                placeholder="เบอร์โทรศัพท์"
                placeholderTextColor="#777"
                value={phone}
                onChangeText={(text) => {
                  const onlyNumbers = text.replace(/[^0-9]/g, "").slice(0, 10);

                  setPhone(onlyNumbers);

                  if (errors.phone) {
                    setErrors((prev) => ({
                      ...prev,
                      phone: validatePhone(onlyNumbers),
                    }));
                  }
                }}
                keyboardType="phone-pad"
                maxLength={10}
                onBlur={() => {
                  setErrors((prev) => ({
                    ...prev,
                    phone: validatePhone(phone),
                  }));
                }}
                returnKeyType="done"
                onSubmitEditing={savePatient}
              />

              {errors.phone !== "" && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}

              {/* Buttons */}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setModalVisible(false);
                    clearForm();
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={savePatient}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =========================================================
// Styles
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 25,
    paddingTop: 45,
  },

  header: {
    alignItems: "center",
    marginBottom: 25,
  },

  title: {
    fontSize: 38,
    fontWeight: "700",
    color: BLUE,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "#888",
    marginTop: 3,
    textAlign: "center",
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 100,
  },

  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },

  emptyText: {
    fontSize: 17,
    color: "#888",
  },

  patientCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D5D5D5",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectedCard: {
    borderColor: BLUE,
    borderWidth: 2.5,
  },

  patientInfo: {
    flex: 1,
    paddingRight: 10,
  },

  patientName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },

  patientText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },

  cardButtons: {
    alignItems: "center",
    marginLeft: 8,
  },

  selectButton: {
    backgroundColor: BLUE,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 8,
    marginBottom: 10,
  },

  selectedButton: {
    backgroundColor: "#6F85DE",
  },

  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  smallButtonsRow: {
    flexDirection: "row",
    gap: 7,
  },

  editButton: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  editText: {
    fontSize: 21,
    color: BLUE,
    fontWeight: "600",
  },

  deleteButton: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FDECEC",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    fontSize: 18,
  },

  addButton: {
    position: "absolute",
    right: 30,
    bottom: 110, // เดิม 55
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  plus: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "300",
    lineHeight: 42,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
  },

  modalTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: BLUE,
    marginBottom: 20,
    textAlign: "center",
  },

  modalInput: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: "#C9C9C9",
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 17,
    color: "#222",
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },

  patientIdNote: {
    fontSize: 13,
    color: "#888",
    marginTop: -7,
    marginBottom: 12,
    marginLeft: 4,
  },

  inputError: {
    borderColor: "#FF0000",
    borderWidth: 1.5,
  },

  errorText: {
    color: "#FF0000",
    fontSize: 13,
    marginTop: -7,
    marginBottom: 12,
    marginLeft: 1,
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

  genderInput: {
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
    fontSize: 13,
    color: "#555",
  },

  genderMenu: {
    position: "absolute",
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C9C9C9",
    borderRadius: 10,
    zIndex: 100,
    elevation: 5,
    overflow: "hidden",
  },

  genderOption: {
    height: 45,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  optionText: {
    fontSize: 16,
    color: "#222",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 10,
  },

  cancelButton: {
    height: 45,
    paddingHorizontal: 22,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#BBBBBB",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "600",
  },

  saveButton: {
    height: 45,
    paddingHorizontal: 25,
    borderRadius: 9,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
