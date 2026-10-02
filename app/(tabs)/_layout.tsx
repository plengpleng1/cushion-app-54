import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>

        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let icon;

          if (route.name === 'index') {
            icon = (
              <Ionicons
                name="home-outline"
                size={25}
                color={isFocused ? '#2D69CA' : '#999999'}
              />
            );
          }

          if (route.name === 'history') {
            icon = (
              <Octicons
                name="graph"
                size={25}
                color={isFocused ? '#2D69CA' : '#999999'}
              />
            );
          }

          if (route.name === 'lists') {
            icon = (
              <MaterialCommunityIcons
                name="clipboard-list-outline"
                size={25}
                color={isFocused ? '#2D69CA' : '#999999'}
              />
            );
          }

          if (route.name === 'profile') {
            icon = (
              <Ionicons
                name="person-outline"
                size={25}
                color={isFocused ? '#2D69CA' : '#999999'}
              />
            );
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.selectedTab,
                  !isFocused && styles.unselectedTab,
                ]}
              >
                {icon}

                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused
                        ? '#2D69CA'
                        : '#999999',
                    },
                  ]}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}

      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
//======================= ชื่อแถบ ============================\\
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
        }}
      />

      <Tabs.Screen
        name="lists"
        options={{
          title: 'Lists',
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
//======================= ชื่อแถบ ============================\\

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },

  tabBar: {
    height: 75,
    borderRadius: 40,

    backgroundColor: 'rgba(242, 242, 247, 0.8)',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',

    paddingHorizontal: 8,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,

    elevation: 5,
  },

  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // กรอบขุ่นของ Tab ที่ถูกเลือก
  selectedTab: {
    minWidth: 75,
    height: 52,

    borderRadius: 26,

    backgroundColor: 'rgba(255, 255, 255, 0.65)',

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 14,
  },

  // Tab ที่ไม่ได้เลือกจะไม่มีพื้น
  unselectedTab: {
    backgroundColor: 'transparent',
  },

  tabLabel: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
});
