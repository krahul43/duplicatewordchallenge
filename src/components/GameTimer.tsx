import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography } from '../theme/colors';
import { formatTime } from '../utils/gameLogic';

interface Props {
  seconds: number;
  totalSeconds: number;
}

export function GameTimer({ seconds, totalSeconds }: Props) {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(seconds / totalSeconds, { duration: 1000 });
  }, [seconds, totalSeconds]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const isLow = seconds < 30;

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progress,
            animatedStyle,
            { backgroundColor: isLow ? colors.error : colors.primary }
          ]}
        />
      </View>
      <Text style={[styles.time, isLow && styles.timeLow]}>
        {formatTime(seconds)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: 120,
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 4,
  },
  time: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  timeLow: {
    color: colors.error,
  },
});
