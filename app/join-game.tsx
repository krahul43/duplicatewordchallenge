import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../src/store';
import { colors, spacing, typography } from '../src/theme/colors';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { gameService } from '../src/services/gameService';

export default function JoinGameScreen() {
  const profile = useSelector((state: RootState) => state.auth.profile);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoinGame() {
    if (!profile?.id) return;

    if (joinCode.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-character game code');
      return;
    }

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

      await gameService.joinGame(gameDoc.id, profile.id);
      router.replace(`/game/${gameDoc.id}`);
    } catch (error) {
      console.error('Failed to join game:', error);
      Alert.alert('Error', 'Failed to join game. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Game</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconEmoji}>🎮</Text>
        </View>

        <Text style={styles.title}>Enter Game Code</Text>
        <Text style={styles.subtitle}>Ask your friend for their 6-character game code</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={joinCode}
            onChangeText={(text) => setJoinCode(text.toUpperCase())}
            placeholder="ABCD12"
            placeholderTextColor="rgba(102, 187, 106, 0.4)"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.joinButton, (joinCode.length !== 6 || loading) && styles.joinButtonDisabled]}
          onPress={handleJoinGame}
          disabled={joinCode.length !== 6 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.joinButtonText}>Join Game</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Find Random Match</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#66BB6A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl + 10,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  iconEmoji: {
    fontSize: 60,
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
  inputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    fontSize: 32,
    fontWeight: '700',
    color: '#66BB6A',
    textAlign: 'center',
    letterSpacing: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  joinButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  joinButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  joinButtonText: {
    ...typography.h3,
    color: '#fff',
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: spacing.md,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  secondaryButtonText: {
    ...typography.h3,
    color: '#fff',
    fontWeight: '600',
  },
});
