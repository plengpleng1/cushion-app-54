import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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

  const [errors, setErrors] = useState({
    name: "",
    citizenId: "",
    gender: "",
    age: "",
    phone: "",
    patientId: "",
  });

  const patientIdRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const citizenIdRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  // =========================
  // Load Selected Patient
  // =========================
  const loadSelectedPatient = async () => {
    try {
      const selected = await AsyncStorage.getItem(SELECTED_PATIENT_KEY);

      setSelectedPatientId(selected || "");
    } catch (error) {
      console.error("Load selected patient error:", error);
    }
  };

  // =========================
  // Load Patients
  // =========================
  const loadPatients = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPatients([]);
        return;
      }

      const { data, error } = await supabase
        .from("user_patients")
        .select("id, patient_id, name, citizen_id, gender, age, phone")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load patients error:", error);
        return;
      }

      const formattedPatients: Patient[] = (data || []).map((patient: any) => ({
        id: patient.id,
        patientId: patient.patient_id,
        name: patient.name,
        citizenId: patient.citizen_id,
        gender: patient.gender,
        age: String(patient.age),
        phone: patient.phone,
      }));

      setPatients(formattedPatients);
    } catch (error) {
      console.error("Load patients error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPatients();
      loadSelectedPatient();
    }, []),
  );

  // =========================
  // Clear Form
  // =========================
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

  // =========================
  // Validation
  // =========================
  const validatePatientId = (value: string) => {
    if (!value.trim()) {
      return "";
    }

    if (!/^[A-Za-z0-9]+$/.test(value.trim())) {
      return "Patient ID ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษและตัวเลขเท่านั้น";
    }

    return "";
  };

  const validateName = (value: string) => {
    if (!value.trim()) {
      return "กรุณาระบุชื่อ - นามสกุล";
    }

    return "";
  };

  const validateCitizenId = (value: string) => {
    if (!value) {
      return "กรุณาระบุเลขบัตรประชาชนให้ถูกต้อง";
    }

    if (!/^\d{13}$/.test(value)) {
      return "กรุณาระบุเลขบัตรประชาชนให้ถูกต้อง";
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
      return "กรุณาระบุอายุให้ถูกต้อง";
    }

    const number = Number(value);

    if (number < 1 || number > 120) {
      return "กรุณาระบุอายุให้ถูกต้อง";
    }

    return "";
  };

  const validatePhone = (value: string) => {
    if (!value) {
      return "กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง";
    }

    if (!/^0\d{9}$/.test(value)) {
      return "กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง";
    }

    return "";
  };

  const validateAll = () => {
    const newErrors = {
      patientId: validatePatientId(patientId),
      name: validateName(name),
      citizenId: validateCitizenId(citizenId),
      gender: validateGender(gender),
      age: validateAge(age),
      phone: validatePhone(phone),
    };

    setErrors(newErrors);

    return !Object.values(newErrors).some((error) => error !== "");
  };

  // =========================
  // Save Patient
  // =========================
  const savePatient = async () => {
    if (!validateAll()) {
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const trimmedPatientId = patientId.trim() || null;
      const trimmedCitizenId = citizenId.trim();
      const trimmedPhone = phone.trim();

      // =========================
      // Check duplicate Citizen ID
      // ตรวจทั้งตาราง ไม่จำกัด user_id
      // =========================
      let citizenQuery = supabase
        .from("user_patients")
        .select("id")
        .eq("citizen_id", trimmedCitizenId)
        .limit(1);

      if (editingId) {
        citizenQuery = citizenQuery.neq("id", editingId);
      }

      const { data: duplicateCitizen, error: citizenError } =
        await citizenQuery;

      if (citizenError) {
        console.error("Check Citizen ID error:", citizenError);

        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถตรวจสอบเลขบัตรประชาชนได้");

        return;
      }

      if (duplicateCitizen && duplicateCitizen.length > 0) {
        setErrors((prev) => ({
          ...prev,
          citizenId: "กรุณาระบุเลขบัตรประชาชนให้ถูกต้อง",
        }));

        return;
      }

      // =========================
      // Check duplicate Patient ID
      // ตรวจทั้งตาราง ไม่จำกัด user_id
      // =========================
      if (trimmedPatientId) {
        let patientIdQuery = supabase
          .from("user_patients")
          .select("id")
          .eq("patient_id", trimmedPatientId)
          .limit(1);

        if (editingId) {
          patientIdQuery = patientIdQuery.neq("id", editingId);
        }

        const { data: duplicatePatientId, error: patientIdError } =
          await patientIdQuery;

        if (patientIdError) {
          console.error("Check Patient ID error:", patientIdError);

          Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถตรวจสอบ Patient ID ได้");

          return;
        }

        if (duplicatePatientId && duplicatePatientId.length > 0) {
          setErrors((prev) => ({
            ...prev,
            patientId: "กรุณาระบุ Patient ID ให้ถูกต้อง",
          }));

          return;
        }
      }

      // =========================
      // Check duplicate Phone
      // ตรวจทั้งตาราง ไม่จำกัด user_id
      // =========================
      let phoneQuery = supabase
        .from("user_patients")
        .select("id")
        .eq("phone", trimmedPhone)
        .limit(1);

      if (editingId) {
        phoneQuery = phoneQuery.neq("id", editingId);
      }

      const { data: duplicatePhone, error: phoneError } = await phoneQuery;

      if (phoneError) {
        console.error("Check phone error:", phoneError);

        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถตรวจสอบเบอร์โทรศัพท์ได้");

        return;
      }

      if (duplicatePhone && duplicatePhone.length > 0) {
        setErrors((prev) => ({
          ...prev,
          phone: "กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง",
        }));

        return;
      }

      // =========================
      // Patient Data
      // =========================
      const patientData = {
        patient_id: trimmedPatientId,
        name: name.trim(),
        citizen_id: trimmedCitizenId,
        gender,
        age,
        phone: trimmedPhone,
      };

      // =========================
      // Edit Existing Patient
      // =========================
      if (editingId) {
        const { error: updateError } = await supabase
          .from("user_patients")
          .update(patientData as never)
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Update patient error:", updateError);

          // =========================
          // UNIQUE constraint
          // =========================
          if (updateError.code === "23505") {
            const message = updateError.message;

            if (message.includes("citizen_id")) {
              setErrors((prev) => ({
                ...prev,
                citizenId: "กรุณาระบุเลขบัตรประชาชนให้ถูกต้อง",
              }));
              return;
            }

            if (message.includes("patient_id")) {
              setErrors((prev) => ({
                ...prev,
                patientId: "กรุณาระบุ Patient ID ให้ถูกต้อง",
              }));
              return;
            }

            if (message.includes("phone")) {
              setErrors((prev) => ({
                ...prev,
                phone: "กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง",
              }));
              return;
            }
          }

          Alert.alert("บันทึกไม่สำเร็จ", updateError.message);

          return;
        }
      }

      // =========================
      // Add New Patient
      // =========================
      else {
        const { error: insertError } = await supabase
          .from("user_patients")
          .insert({
            user_id: user.id,
            ...patientData,
          } as never);

        if (insertError) {
          // =========================
          // UNIQUE constraint
          // =========================
          if (insertError.code === "23505") {
            const message = insertError.message;

            if (message.includes("citizen_id")) {
              setErrors((prev) => ({
                ...prev,
                citizenId: "กรุณาระบุเลขบัตรประชาชนให้ถูกต้อง",
              }));
              return;
            }

            if (message.includes("patient_id")) {
              setErrors((prev) => ({
                ...prev,
                patientId: "กรุณาระบุ Patient ID ให้ถูกต้อง",
              }));
              return;
            }

            if (message.includes("phone")) {
              setErrors((prev) => ({
                ...prev,
                phone: "กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง",
              }));
              return;
            }
          }

          Alert.alert("บันทึกไม่สำเร็จ", insertError.message);

          return;
        }
      }

      // =========================
      // Reload Patient List
      // =========================
      await loadPatients();

      // =========================
      // Close Modal
      // =========================
      closeModal();
    } catch (error: any) {
      console.error("Save patient error:", error);

      const message = error?.message || "ไม่สามารถบันทึกข้อมูลได้";

      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("เกิดข้อผิดพลาด", message);
      }
    }
  };

  // =========================
  // Select Patient
  // =========================
  const selectPatient = async (patient: Patient) => {
    try {
      await AsyncStorage.setItem(SELECTED_PATIENT_KEY, patient.citizenId);

      setSelectedPatientId(patient.citizenId);

      router.push({
        pathname: "/patient-info",
        params: {
          citizenId: patient.citizenId,
          from: "patient-list",
        },
      });
    } catch (error) {
      console.error("Select patient error:", error);
    }
  };

  // =========================
  // Edit Patient
  // =========================
  const editPatient = (patient: Patient) => {
    setEditingId(patient.id);
    setPatientId(patient.patientId || "");
    setName(patient.name);
    setCitizenId(patient.citizenId);
    setGender(patient.gender);
    setAge(patient.age);
    setPhone(patient.phone);

    setErrors({
      name: "",
      citizenId: "",
      gender: "",
      age: "",
      phone: "",
      patientId: "",
    });

    setGenderOpen(false);
    setModalVisible(true);
  };

  // =========================
  // Delete Patient
  // =========================
  const deletePatient = async (patient: Patient) => {
    const performDelete = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const { error } = await supabase
          .from("user_patients")
          .delete()
          .eq("id", patient.id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Delete patient error:", error);

          Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถลบข้อมูลได้");

          return;
        }

        if (selectedPatientId === patient.citizenId) {
          await AsyncStorage.removeItem(SELECTED_PATIENT_KEY);

          setSelectedPatientId("");
        }

        await loadPatients();
      } catch (error) {
        console.error("Delete patient error:", error);

        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถลบข้อมูลได้");
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `ต้องการลบข้อมูล ${patient.name} หรือไม่?`,
      );

      if (confirmed) {
        await performDelete();
      }
    } else {
      Alert.alert("ยืนยันการลบ", `ต้องการลบข้อมูล ${patient.name} หรือไม่?`, [
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

  // =========================
  // Close Modal
  // =========================
  const closeModal = () => {
    setModalVisible(false);
  };

  // =========================
  // Open Add Modal
  // =========================
  const openAddModal = () => {
    clearForm();
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Patient Lists</Text>
        <Text style={styles.subtitle}>รายการผู้ป่วย</Text>
      </View>

      {/* Patient List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
      >
        {patients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>ไม่มีรายการผู้ป่วย</Text>
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
                    Patient ID : {patient.patientId || "-"}
                  </Text>

                  <Text style={styles.patientText}>
                    เลขบัตรประชาชน : {patient.citizenId}
                  </Text>

                  <Text style={styles.patientText}>เพศ : {patient.gender}</Text>

                  <Text style={styles.patientText}>
                    อายุ : {patient.age} ปี
                  </Text>

                  <Text style={styles.patientText}>
                    เบอร์โทรศัพท์ : {patient.phone}
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
                      onPress={() => editPatient(patient)}
                    >
                      <MaterialCommunityIcons
                        name="account-edit"
                        size={22}
                        color="#2D69CA"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deletePatient(patient)}
                    >
                      <FontAwesome5 name="trash" size={15} color="#9c1717" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Ionicons name="person-add" size={22} color="#ffffff" />
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
        onDismiss={() => {
          clearForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>
                {editingId ? "Edit Patient" : "Add Patient"}
              </Text>

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
                  const onlyEnglishAndNumbers = text.replace(
                    /[^A-Za-z0-9]/g,
                    "",
                  );

                  setPatientId(onlyEnglishAndNumbers);

                  if (errors.patientId) {
                    setErrors((prev) => ({
                      ...prev,
                      patientId: validatePatientId(onlyEnglishAndNumbers),
                    }));
                  }
                }}
                returnKeyType="next"
                onSubmitEditing={() => nameRef.current?.focus()}
                blurOnSubmit={false}
              />

              {errors.patientId !== "" ? (
                <Text style={styles.errorText}>{errors.patientId}</Text>
              ) : (
                <Text style={styles.patientIdNote}>ระบุหากมี</Text>
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
                placeholder="เลขบัตรประชาชน 13 หลัก"
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
                {/* Gender */}
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
                      {gender || "เลือกเพศ"}
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

                {/* Age */}
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
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={savePatient}
                >
                  <Text style={styles.saveText}>
                    {editingId ? "Save" : "Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
    fontSize: 48,
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
    marginRight: -25,
  },

  listContent: {
    paddingBottom: 150,
    paddingRight: 25,
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
    width: "75%",
    borderWidth: 1.5,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    marginLeft: "auto",
    marginRight: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    borderRadius: 10,
    marginBottom: 10,
  },

  selectedButton: {
    backgroundColor: "#6691d7",
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
    borderRadius: 10,
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
    borderRadius: 10,
    backgroundColor: "#FDECEC",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    fontSize: 18,
  },

  addButton: {
    position: "absolute",
    right: 38,
    bottom: 110,
    width: 58,
    height: 58,
    borderRadius: 40,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  modalTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: BLUE,
    marginBottom: 20,
    textAlign: "center",
  },

  modalInput: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 17,
    color: "#222",
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
