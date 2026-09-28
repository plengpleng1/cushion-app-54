import { router } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PatientInfo() {
  const [name, setName] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");

  const handleNext = () => {
    if (!name || !citizenId || !gender || !age || !phone) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    router.replace("../tabs");
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        {/* ชื่อ - นามสกุล */}
        <TextInput
          style={styles.input}
          placeholder="ชื่อ - นามสกุล"
          placeholderTextColor="#111"
          value={name}
          onChangeText={setName}
        />

        {/* เลขบัตรประชาชน */}
        <TextInput
          style={styles.input}
          placeholder="เลขบัตรประจำตัวประชาชน"
          placeholderTextColor="#111"
          value={citizenId}
          onChangeText={setCitizenId}
          keyboardType="numeric"
          maxLength={13}
        />

        {/* เพศ + อายุ */}
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="เพศ"
            placeholderTextColor="#111"
            value={gender}
            onChangeText={setGender}
          />

          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="อายุ"
            placeholderTextColor="#111"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>

        {/* เบอร์ติดต่อ */}
        <TextInput
          style={styles.input}
          placeholder="เบอร์ติดต่อ"
          placeholderTextColor="#111"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {/* Next */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  formContainer: {
    flex: 1,
    paddingHorizontal: 95,
    paddingTop: 115,
  },

  input: {
    height: 120,
    borderWidth: 2,
    borderColor: "#222",
    paddingHorizontal: 30,
    fontSize: 25,
    color: "#111",
    marginBottom: 58,
    backgroundColor: "#fff",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  halfInput: {
    width: "46%",
  },

  nextButton: {
    alignSelf: "flex-end",
    backgroundColor: "#4966D5",
    paddingHorizontal: 27,
    paddingVertical: 15,
    borderRadius: 4,
    marginTop: -5,
  },

  nextText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "500",
  },
});
