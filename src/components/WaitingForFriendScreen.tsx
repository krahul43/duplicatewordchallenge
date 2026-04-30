import { LinearGradient } from 'expo-linear-gradient';
import { Copy, Share2, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { spacing, typography } from '../theme/colors';

interface Props {
  joinCode: string;
  gameId: string;
  onCancel: () => void;
  expiresAt?: string;
}

export function WaitingForFriendScreen({ joinCode, gameId, onCancel, expiresAt }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );

    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
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

    pulse.start();
    rotate.start();
    makeDotAnim(dot1Anim, 0).start();
    makeDotAnim(dot2Anim, 260).start();
    makeDotAnim(dot3Anim, 520).start();

    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, []);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const rotateInterp = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleCopyCode = async () => {
    setCopied(true);
    Alert.alert('Code Copied!', `Game code ${joinCode} has been copied`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Word Game! Use code: ${joinCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const isExpired = timeRemaining === 'Expired';

  return (
    <LinearGradient
      colors={['#1B5E20', '#2E7D32', '#43A047']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <Animated.View style={[styles.spinRing, { transform: [{ rotate: rotateInterp }] }]}>
          <View style={styles.seg1} />
          <View style={styles.seg2} />
          <View style={styles.seg3} />
        </Animated.View>
        <View style={styles.iconInner}>
          <Text style={styles.iconEmoji}>👥</Text>
        </View>
      </Animated.View>

      <Text style={styles.title}>Waiting for Friend</Text>
      <Text style={styles.subtitle}>Share the code below and they'll join instantly</Text>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>GAME CODE</Text>
        <View style={styles.codeLetters}>
          {joinCode.split('').map((char, i) => (
            <View key={i} style={styles.codeTile}>
              <Text style={styles.codeTileText}>{char}</Text>
            </View>
          ))}
        </View>
        {timeRemaining ? (
          <View style={[styles.timerRow, isExpired && styles.timerRowExpired]}>
            <Text style={styles.timerIcon}>{isExpired ? '⛔' : '⏱'}</Text>
            <Text style={[styles.timerText, isExpired && styles.timerExpiredText]}>
              {isExpired ? 'Code Expired' : `Expires in ${timeRemaining}`}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, copied && styles.actionBtnCopied]}
          onPress={handleCopyCode}
          activeOpacity={0.8}
        >
          <Copy size={22} color="#fff" strokeWidth={2.5} />
          <Text style={styles.actionBtnText}>{copied ? 'Copied!' : 'Copy Code'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={handleShare} activeOpacity={0.8}>
          <Share2 size={22} color="#fff" strokeWidth={2.5} />
          <Text style={styles.actionBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { opacity: dot1Anim, transform: [{ scale: dot1Anim }] }]} />
        <Animated.View style={[styles.dot, styles.dotMid, { opacity: dot2Anim, transform: [{ scale: dot2Anim }] }]} />
        <Animated.View style={[styles.dot, { opacity: dot3Anim, transform: [{ scale: dot3Anim }] }]} />
      </View>

      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
        <X size={18} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />
        <Text style={styles.cancelText}>Cancel Game</Text>
      </TouchableOpacity>
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
  iconWrapper: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  spinRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
  },
  seg1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 75,
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  seg2: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 37,
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  seg3: {
    position: 'absolute',
    top: 0,
    right: 37,
    width: 38,
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.17)',
  },
  iconInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconEmoji: {
    fontSize: 50,
  },
  title: {
    ...typography.h1,
    color: '#fff',
    fontWeight: '800',
    marginBottom: spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.xl,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  codeCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  codeLetters: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  codeTile: {
    width: 42,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },
  codeTileText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2E7D32',
    letterSpacing: 0,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  timerRowExpired: {
    backgroundColor: 'rgba(220,53,69,0.3)',
  },
  timerIcon: {
    fontSize: 14,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  timerExpiredText: {
    color: '#ff8a80',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.xl,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: spacing.md,
    borderRadius: 14,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionBtnCopied: {
    backgroundColor: '#1B5E20',
  },
  shareBtn: {
    backgroundColor: '#388E3C',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
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
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    fontSize: 15,
  },
});
