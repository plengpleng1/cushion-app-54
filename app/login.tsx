import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PatientInfoScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
  });

  const handleNext = () => {
    // เมื่อกรอกข้อมูลเสร็จ นำทางไปยังหน้าหลักของแอป (Tabs / MainScreen)
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Patient Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name - Surname</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter age"
            keyboardType="numeric"
            value={formData.age}
            onChangeText={(text) => setFormData({ ...formData, age: text })}
          />

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter weight"
            keyboardType="numeric"
            value={formData.weight}
            onChangeText={(text) => setFormData({ ...formData, weight: text })}
          />

          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter height"
            keyboardType="numeric"
            value={formData.height}
            onChangeText={(text) => setFormData({ ...formData, height: text })}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4464D0',
    marginTop: 20,
    marginBottom: 30,
  },
  inputGroup: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  button: {
    width: '100%',
    maxWidth: 360,
    height: 50,
    backgroundColor: '#4464D0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});