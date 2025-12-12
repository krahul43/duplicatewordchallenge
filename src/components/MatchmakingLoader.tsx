import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, typography, spacing } from '../theme/colors';

interface Props {
  message?: string;
}

export function MatchmakingLoader({ message = 'Finding opponent...' }: Props) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const dotsAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 3,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnimation.start();
    scaleAnimation.start();
    dotsAnimation.start();

    return () => {
      rotateAnimation.stop();
      scaleAnimation.stop();
      dotsAnimation.stop();
    };
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.loaderWrapper}>
        <Animated.View
          style={[
            styles.outerCircle,
            {
              transform: [{ rotate }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.circleSegment1} />
          <View style={styles.circleSegment2} />
          <View style={styles.circleSegment3} />
          <View style={styles.circleSegment4} />
        </Animated.View>

        <View style={styles.innerCircle}>
          <Text style={styles.iconText}>🎮</Text>
        </View>
      </View>

      <Text style={styles.message}>{message}</Text>
      <Text style={styles.subMessage}>This usually takes a few seconds</Text>

      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: dotsAnim.interpolate({
                  inputRange: [index, index + 1, index + 2],
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#66BB6A',
    padding: spacing.xl,
  },
  loaderWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  outerCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
  },
  circleSegment1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  circleSegment2: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circleSegment3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  circleSegment4: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  innerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  iconText: {
    fontSize: 60,
  },
  message: {
    ...typography.h2,
    color: '#fff',
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subMessage: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
});
