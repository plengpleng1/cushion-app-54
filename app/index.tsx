import { BlurredBackground } from '@/components/BlurredBackground';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View, useWindowDimensions } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // แอนิเมชันวิ่งหลอดโหลดเป็นเวลา 5000ms (5 วินาที)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(() => {
      // เมื่อโหลดครบ 5 วินาที เปลี่ยนไปยังหน้า Login อัตโนมัติ
      router.replace('/login');
    });
  }, [progressAnim, router]);

  // แปลงค่าจาก 0 -> 1 เป็น 0% -> 100% สำหรับความกว้างหลอดโหลด
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ใช้ค่าเปอร์เซ็นต์เดียวกันควบคุมตำแหน่ง left ของไอคอนให้วิ่งตามปลายเส้น
  const iconLeft = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <BlurredBackground>
      {/* ซ่อน Header Bar ด้านบนเฉพาะหน้านี้ */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* ส่วนแสดงภาพโลโก้ Cushion Sense */}
        <View style={styles.contentContainer}>
          <Image
            source={require('@/assets/images/cushion.png')}
            style={[styles.logoImage, { width: Math.min(width * 0.85, 700) }]}
            resizeMode="contain"
          />
        </View>

        {/* ส่วนแถบหลอดโหลดด้านล่าง พร้อมไอคอนวิ่งทับปลายเส้น */}
        <View style={[styles.bottomContainer, { maxWidth: Math.min(width * 0.85, 400) }]}>
          <View style={styles.progressBarTrack}>
            {/* หลอดโหลดที่กำลังวิ่ง */}
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />

            {/* ไอคอนที่วิ่งทับอยู่ตรงปลายเส้นพอดี */}
            <Animated.View style={[styles.iconContainer, { left: iconLeft }]}>
              <MaterialCommunityIcons name="wheelchair-accessibility" size={30} color="#2D69CA" />
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
    height: 10, // เพิ่มความหนาของเส้นขึ้นนิดหน่อยเพื่อให้ไอคอนอยู่ในเส้นสวยงาม
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: 5,
    overflow: 'visible', // เปิดให้ไอคอนล้นออกมาได้นิดหน่อยเวลากลางไอคอนทับขอบ
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
    marginTop: -22.5, // ดึงขึ้นครึ่งหนึ่งของความสูงไอคอนเพื่อให้อยู่กึ่งกลางแนวตั้งพอดี
    transform: [{ translateX: '-51%' }], // ดึงถอยหลัง 50% ของตัวไอคอนเองเพื่อให้จุดศูนย์กลางทับปลายเส้นเป๊ะๆ
    zIndex: 10,
  },
});