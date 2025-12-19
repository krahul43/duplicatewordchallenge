import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../theme/colors';
import { formatTime } from '../utils/gameLogic';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  seconds: number;
  totalSeconds: number;
}

export function GameTimer({ seconds, totalSeconds }: Props) {
  const progress = useSharedValue(1);
  const radius = 50;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withTiming(seconds / totalSeconds, { duration: 1000 });
  }, [seconds, totalSeconds]);

  const animatedCircleStyle = useAnimatedStyle(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    const color = interpolateColor(
      progress.value,
      [0, 0.16, 1],
      ['#EF4444', '#F59E0B', '#10B981']
    );

    return {
      strokeDashoffset,
      stroke: color,
    };
  });

  const isLow = seconds < 30;
  const isCritical = seconds < 10;

  return (
    <View style={styles.container}>
      <View style={styles.timerWrapper}>
        <Svg width={radius * 2 + strokeWidth * 2} height={radius * 2 + strokeWidth * 2}>
          <Circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
            animatedProps={animatedCircleStyle}
          />
        </Svg>
        <View style={styles.timeContainer}>
          <Text style={[styles.time, isLow && styles.timeLow, isCritical && styles.timeCritical]}>
            {formatTime(seconds)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeLow: {
    color: '#F59E0B',
  },
  timeCritical: {
    color: '#EF4444',
  },
});
