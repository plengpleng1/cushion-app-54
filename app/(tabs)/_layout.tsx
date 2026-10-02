import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';
import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          position: 'absolute', // ทำให้แถบลอยเหนือหน้าจอ
          bottom: 24,           // ระยะห่างจากขอบล่าง
          left: 20,             // ระยะห่างจากขอบซ้าย
          right: 20,            // ระยะห่างจากขอบขวา
          elevation: 5,         // เงาสำหรับ Android
          backgroundColor: 'rgba(255, 253, 249, 0.8)', // สีพื้นหลังแคปซูล (ปรับเปลี่ยนได้ตามชอบ) เดิม #FFFDF9
          borderRadius: 40,     // ความโค้งมนของขอบแคปซูล
          height: 75,           // ความสูงของบาร์
          paddingBottom: 10,    // ปรับระยะด้านล่างของไอคอน/ข้อความ
          paddingTop: 10,
          shadowColor: '#000',  // เงาสำหรับ iOS
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          borderTopWidth: 0,    // เอาเส้นขอบด้านบนที่ติดมากับค่าเริ่มต้นออก
        },

        // สีตอนเลือก
        tabBarActiveTintColor: '#4464D0',

        // สีตอนไม่เลือก
        tabBarInactiveTintColor: '#999999',
      }}
    >

      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{title: 'Home',
          tabBarLabelStyle: {
            fontSize: 20,
          },

          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline"
              size={25}
              color={color}
            />
          ),
        }}
      />

      {/* HISTORY */}
      <Tabs.Screen
        name="history"
        options={{title: 'History',

          tabBarLabelStyle: {
            fontSize: 20,
          },

          tabBarIcon: ({ color }) => (
            <Octicons
              name="graph"
              size={25}
              color={color}
            />
          ),
        }}
      />

      {/* List */}
      <Tabs.Screen
        name="lists"
        options={{title: 'Lists',
          tabBarLabelStyle: {
            fontSize: 20,
          },

          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="clipboard-list-outline"
              size={25}
              color={color}
            />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',

          tabBarLabelStyle: {
            fontSize: 20,
          },

          tabBarIcon: ({ color }) => (
            <Ionicons
              name="person-outline"
              size={25}
              color={color}
            />
          ),
        }}
      />

    </Tabs>
  );
}