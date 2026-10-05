import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, FeGaussianBlur, Filter } from 'react-native-svg';

export function BlurredBackground({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();

  // จำกัดขนาดไม่ให้ใหญ่เกินไปแม้จะเปิดบนจอคอม (Max width limit ที่ 600px)
  const isWebOrLargeScreen = width > 600;
  const scaleFactor = isWebOrLargeScreen ? 600 : width;

  const baseRadius = scaleFactor * 0.45;

  return (
    <View style={styles.container}>
      {/* ส่วนฉากหลังแสงฟุ้ง SVG */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <Filter id="blur-effect" x="-50%" y="-50%" width="200%" height="200%">
              <FeGaussianBlur stdDeviation={scaleFactor * 0.1} />
            </Filter>
          </Defs>

         {/* จุดสีฟ้ามุมซ้ายบน */}
          <Circle
            cx={-20}
            cy={400} // ปรับค่า cy ตรงนี้ให้เลื่อนลงมา (เช่น height * 0.25 หรือใส่เป็นตัวเลข เช่น 150 - 200)
            r={baseRadius * 0.85}
            fill="#b8d7fe"
            opacity="0.8"
            filter="url(#blur-effect)"
          />

          {/* จุดสีฟ้ามุมขวาบน */}
          <Circle
            cx={width + 20}
            cy={isWebOrLargeScreen ? 150 : 100}
            r={baseRadius * 0.8}
            fill="#b8d7fe"
            opacity="0.75"
            filter="url(#blur-effect)"
          />

          {/* จุดสีฟ้าด้านล่างซ้าย */}
          <Circle
            cx={width / 2.2}
            cy={height + 30}
            r={baseRadius * 0.8}
            fill="#b8d7fe"
            opacity="0.7"
            filter="url(#blur-effect)"
          />

          {/* จุดสีฟ้าด้านล่างขวา */}
          <Circle
            cx={width / 1.8}
            cy={height + 30}
            r={baseRadius * 0.8}
            fill="#A5CDFF"
            opacity="0.7"
            filter="url(#blur-effect)"
          />
        </Svg>
      </View>

      {/* เนื้อหาภายในหน้าจอ */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});