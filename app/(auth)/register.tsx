import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../src/lib/firebase';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { colors, spacing, typography } from '../../src/theme/colors';
import { useDispatch } from 'react-redux';
import { setProfile, setUser } from '../../src/store/slices/authSlice';
import { setSubscriptionData } from '../../src/store/slices/subscriptionSlice';

export default function RegisterScreen() {
  const dispatch = useDispatch();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    if (!displayName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: displayName,
      });

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const profileData = {
        displayName: displayName,
        email: email.trim(),
        subscriptionStatus: 'trialing' as const,
        trialStartsAt: new Date().toISOString(),
        trialEndsAt: trialEndsAt.toISOString(),
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        highestWordScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'profiles', user.uid), profileData);

      dispatch(
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        })
      );

      dispatch(
        setProfile({
          id: user.uid,
          display_name: profileData.displayName,
          subscription_status: profileData.subscriptionStatus,
          subscription_provider: undefined,
          trial_starts_at: profileData.trialStartsAt,
          trial_ends_at: profileData.trialEndsAt,
          current_period_end: undefined,
          games_played: profileData.gamesPlayed,
          games_won: profileData.gamesWon,
          total_score: profileData.totalScore,
          highest_word_score: profileData.highestWordScore,
          created_at: profileData.createdAt,
          updated_at: profileData.updatedAt,
        })
      );

      dispatch(
        setSubscriptionData({
          status: profileData.subscriptionStatus,
          provider: null,
          trialEndsAt: profileData.trialEndsAt,
          currentPeriodEnd: null,
        })
      );

      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logo}>
              <View style={styles.letterBox}>
                <Text style={styles.letter}>W</Text>
              </View>
              <View style={styles.letterBox}>
                <Text style={styles.letter}>O</Text>
              </View>
              <View style={styles.letterBox}>
                <Text style={styles.letter}>R</Text>
              </View>
              <View style={styles.letterBox}>
                <Text style={styles.letter}>D</Text>
              </View>
              <View style={styles.letterBox}>
                <Text style={styles.letter}>S</Text>
              </View>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your 7-day free trial</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              autoCapitalize="words"
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              autoCapitalize="none"
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              autoCapitalize="none"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            />

            <Button
              title="Already have an account? Sign In"
              onPress={() => router.back()}
              variant="outline"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  inner: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  logo: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  letterBox: {
    width: 38,
    height: 38,
    backgroundColor: colors.tile,
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderBottomWidth: 3,
    borderBottomColor: colors.tileBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  letter: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.tileText,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  button: {
    marginBottom: spacing.md,
  },
  error: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
