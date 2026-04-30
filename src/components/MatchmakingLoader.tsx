import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../theme/colors';

interface Props {
  message?: string;
}

export function MatchmakingLoader({ message = 'Finding opponent...' }: Props) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const makeDotAnim = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(800),
        ])
      );

    rotateAnimation.start();
    pulseAnimation.start();
    makeDotAnim(dot1Anim, 0).start();
    makeDotAnim(dot2Anim, 260).start();
    makeDotAnim(dot3Anim, 520).start();

    return () => {
      rotateAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#2E7D32', '#43A047', '#66BB6A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topDecor}>
        <Text style={styles.decorTile}>W</Text>
        <Text style={styles.decorTile}>O</Text>
        <Text style={styles.decorTile}>R</Text>
        <Text style={styles.decorTile}>D</Text>
      </View>

      <Animated.View style={[styles.loaderWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <Animated.View style={[styles.outerRing, { transform: [{ rotate }] }]}>
          <View style={styles.ringSegment1} />
          <View style={styles.ringSegment2} />
          <View style={styles.ringSegment3} />
          <View style={styles.ringSegment4} />
        </Animated.View>

        <View style={styles.innerCircle}>
          <Text style={styles.iconText}>⚔️</Text>
        </View>
      </Animated.View>

      <View style={styles.textSection}>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.subMessage}>Matching you with a worthy opponent</Text>
      </View>

      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { opacity: dot1Anim, transform: [{ scale: dot1Anim }] }]} />
        <Animated.View style={[styles.dot, styles.dotMid, { opacity: dot2Anim, transform: [{ scale: dot2Anim }] }]} />
        <Animated.View style={[styles.dot, { opacity: dot3Anim, transform: [{ scale: dot3Anim }] }]} />
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>Place tiles on bonus squares for extra points!</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  topDecor: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.xl * 1.5,
  },
  decorTile: {
    width: 40,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 44,
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    overflow: 'hidden',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  loaderWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  outerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
  },
  ringSegment1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  ringSegment2: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  ringSegment3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  ringSegment4: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconText: {
    fontSize: 52,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  message: {
    ...typography.h2,
    color: '#fff',
    fontWeight: '800',
    marginBottom: spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subMessage: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl * 1.5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  dotMid: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    gap: spacing.sm,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
