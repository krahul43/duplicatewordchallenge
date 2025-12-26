import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Share, Alert } from 'react-native';
import { Copy, Share2 } from 'lucide-react-native';
import { colors, typography, spacing } from '../theme/colors';

interface Props {
  joinCode: string;
  gameId: string;
  onCancel: () => void;
  expiresAt?: string;
}

export function WaitingForFriendScreen({ joinCode, gameId, onCancel, expiresAt }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
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

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleCopyCode = async () => {
    setCopied(true);
    Alert.alert('Code Copied!', `Game code ${joinCode} has been copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Scrabble game! Use code: ${joinCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Animated.View style={[styles.iconCircle, { transform: [{ rotate }] }]}>
          <View style={styles.segment1} />
          <View style={styles.segment2} />
          <View style={styles.segment3} />
        </Animated.View>
        <Text style={styles.iconEmoji}>👥</Text>
      </Animated.View>

      <Text style={styles.title}>Waiting for Friend</Text>
      <Text style={styles.subtitle}>Share this code with your friend to join</Text>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Game Code</Text>
        <View style={styles.codeBox}>
          <Text style={styles.code}>{joinCode}</Text>
        </View>
        {timeRemaining && (
          <Text style={styles.expiryText}>
            {timeRemaining === 'Expired' ? '⏰ Code Expired' : `⏰ Expires in ${timeRemaining}`}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCopyCode}>
          <View style={styles.actionIconWrapper}>
            <Copy size={24} color="#fff" />
          </View>
          <Text style={styles.actionText}>Copy Code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={handleShare}>
          <View style={[styles.actionIconWrapper, styles.shareIconWrapper]}>
            <Share2 size={24} color="#fff" />
          </View>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel Game</Text>
      </TouchableOpacity>

      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={styles.dot} />
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
  iconContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  iconCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
  },
  segment1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  segment2: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  segment3: {
    position: 'absolute',
    top: 0,
    right: 40,
    width: 40,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconEmoji: {
    fontSize: 70,
    zIndex: 10,
  },
  title: {
    ...typography.h1,
    color: '#fff',
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  codeContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  codeLabel: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  codeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  code: {
    fontSize: 36,
    fontWeight: '700',
    color: '#66BB6A',
    letterSpacing: 4,
  },
  expiryText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  shareButton: {
    backgroundColor: '#4CAF50',
  },
  actionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cancelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
