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
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
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
            fontSize: 12,
          },

          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline"
              size={20}
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
            fontSize: 12,
          },

          tabBarIcon: ({ color }) => (
            <Octicons
              name="graph"
              size={20}
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
            fontSize: 12,
          },

          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="clipboard-list-outline"
              size={20}
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
            fontSize: 12,
          },

          tabBarIcon: ({ color }) => (
            <Ionicons
              name="person-outline"
              size={20}
              color={color}
            />
          ),
        }}
      />

    </Tabs>
  );
}