import { BlurredBackground } from '@/components/BlurredBackground';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { supabase } from '@/lib/supabase';

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        // =====================================================
        // ถ้า Login อยู่แล้ว
        // → เข้า Home ทันที
        // → ไม่แสดง Splash 5 วินาที
        // =====================================================

        if (session) {
          router.replace('/(tabs)');
          return;
        }

        // =====================================================
        // ถ้ายังไม่ได้ Login 
        // → แสดง Splash 5 วินาที *****
        // → แล้วไป Login
        // =====================================================
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: false,
        }).start(() => {
          if (!isMounted) {
            return;
          }
          router.replace('/login');
        });
      } catch (error) {
        console.error(
          'ตรวจสอบ Session ไม่สำเร็จ:',
          error
        );

        if (!isMounted) {
          return;
        }

        // ถ้าตรวจ Session ไม่ได้
        // ให้ทำงานเหมือนยังไม่ได้ Login
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: false,
        }).start(() => {
          if (isMounted) {
            router.replace('/login');
          }
        });
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [progressAnim, router]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const iconLeft = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <BlurredBackground>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <Image
            source={require('@/assets/images/cushion.png')}
            style={[
              styles.logoImage,
              {
                width: Math.min(
                  width * 0.85,
                  700
                ),
              },
            ]}
            resizeMode="contain"
          />
        </View>

        <View
          style={[
            styles.bottomContainer,
            {
              maxWidth: Math.min(
                width * 0.85,
                400
              ),
            },
          ]}
        >
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressWidth,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.iconContainer,
                {
                  left: iconLeft,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="wheelchair-accessibility"
                size={30}
                color="#2D69CA"
              />
            </Animated.View>
          </View>
        </View>
      </View>
    </BlurredBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },

  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  logoImage: {
    aspectRatio: 2.5,
    height: undefined,
  },

  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
  },

  progressBarTrack: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: 5,
    overflow: 'visible',
    position: 'relative',
    justifyContent: 'center',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#5ca8f9',
    borderRadius: 5,
  },

  iconContainer: {
    position: 'absolute',
    top: '50%',
    marginTop: -22.5,
    transform: [
      {
        translateX: '-55%',
      },
    ],
    zIndex: 10,
  },
});

