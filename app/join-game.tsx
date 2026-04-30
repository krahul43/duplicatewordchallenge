import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { ChevronLeft, KeyRound, Zap } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { db } from '../src/lib/firebase';
import { gameService } from '../src/services/gameService';
import { RootState } from '../src/store';

const { width, height } = Dimensions.get('window');

export default function JoinGameScreen() {
  const profile = useSelector((state: RootState) => state.auth.profile);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const btnScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const pressBtn = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  async function handleJoinGame() {
    if (!profile?.id) return;
    if (joinCode.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-character game code');
      shake();
      return;
    }

    pressBtn();
    setLoading(true);

    try {
      const gamesRef = collection(db, 'games');
      const q = query(
        gamesRef,
        where('join_code', '==', joinCode.toUpperCase()),
        where('status', '==', 'waiting'),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert('Game Not Found', 'No game found with this code. Please check and try again.');
        shake();
        setLoading(false);
        return;
      }

      const gameDoc = snapshot.docs[0];
      const gameData = gameDoc.data();

      if (gameData.player1_id === profile.id) {
        Alert.alert('Cannot Join', 'You cannot join your own game');
        setLoading(false);
        return;
      }

      if (gameData.join_code_expires_at) {
        const expiresAt = new Date(gameData.join_code_expires_at).getTime();
        if (Date.now() > expiresAt) {
          Alert.alert('Code Expired', 'This game code has expired. Please ask your friend for a new code.');
          setLoading(false);
          return;
        }
      }

      await gameService.joinGame(gameDoc.id, profile.id);
      router.replace(`/game/${gameDoc.id}`);
    } catch (error) {
      console.error('Failed to join game:', error);
      Alert.alert('Error', 'Failed to join game. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const codeChars = joinCode.padEnd(6, ' ').split('');
  const isReady = joinCode.length === 6;

  return (
    <LinearGradient colors={['#0d0d1a', '#0f2027', '#0d0d1a']} style={styles.container}>
      <View style={styles.bgDecor}>
        <View style={[styles.bgBlob, { top: -40, right: -60, backgroundColor: '#0e7490', width: 180, height: 180 }]} />
        <View style={[styles.bgBlob, { bottom: 80, left: -40, backgroundColor: '#1e40af', width: 160, height: 160 }]} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Game</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconArea}>
          <LinearGradient
            colors={['#0284c7', '#0369a1']}
            style={styles.iconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <KeyRound size={48} color="#fff" strokeWidth={1.8} />
          </LinearGradient>
          <View style={styles.iconGlow} />
        </View>

        <Text style={styles.title}>Enter Game Code</Text>
        <Text style={styles.subtitle}>Ask your friend for their 6-character game code to join their private match</Text>

        <Animated.View style={[styles.codeSection, { transform: [{ translateX: shakeAnim }] }]}>
          <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={1}>
            <View style={styles.tilesRow}>
              {codeChars.map((char, i) => (
                <View
                  key={i}
                  style={[
                    styles.codeTile,
                    char.trim() && styles.codeTileFilled,
                    i === joinCode.length && styles.codeTileActive,
                  ]}
                >
                  <Text style={[styles.codeTileLetter, char.trim() ? styles.codeTileLetterFilled : {}]}>
                    {char.trim()}
                  </Text>
                  {char.trim() && (
                    <View style={styles.codeTileScore}>
                      <Text style={styles.codeTileScoreText}>{i + 1}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={joinCode}
            onChangeText={(text) => setJoinCode(text.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!loading}
          />
        </Animated.View>

        <Animated.View style={{ width: '100%', transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[styles.joinBtn, !isReady && styles.joinBtnDisabled]}
            onPress={handleJoinGame}
            disabled={!isReady || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isReady ? ['#0284c7', '#0369a1'] : ['#1e293b', '#1e293b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Zap size={20} color="#fff" fill={isReady ? '#fff' : 'none'} />
                  <Text style={[styles.joinText, !isReady && styles.joinTextDisabled]}>
                    {isReady ? 'Join Game' : 'Enter Code Above'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.randomBtn} onPress={() => router.back()}>
          <Text style={styles.randomText}>Find a Random Match</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgBlob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  iconGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#0284c7',
    opacity: 0.08,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  codeSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 28,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  codeTile: {
    width: 44,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  codeTileActive: {
    borderColor: '#0284c7',
    borderBottomColor: '#0369a1',
    backgroundColor: 'rgba(2,132,199,0.1)',
  },
  codeTileFilled: {
    backgroundColor: '#f8f5e4',
    borderColor: '#d4c8a8',
    borderBottomColor: '#a89b7a',
  },
  codeTileLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 0,
  },
  codeTileLetterFilled: {
    color: '#2d2d2d',
  },
  codeTileScore: {
    position: 'absolute',
    bottom: 3,
    right: 4,
  },
  codeTileScoreText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#8b7355',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  joinBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 24,
  },
  joinBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  joinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  joinText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  joinTextDisabled: {
    color: 'rgba(255,255,255,0.35)',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  randomBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  randomText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
});
