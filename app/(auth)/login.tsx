import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../src/lib/firebase';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { colors, spacing, typography } from '../../src/theme/colors';
import { useDispatch } from 'react-redux';
import { setProfile, setUser } from '../../src/store/slices/authSlice';
import { setSubscriptionData } from '../../src/store/slices/subscriptionSlice';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      dispatch(
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        })
      );

      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();

        dispatch(
          setProfile({
            id: user.uid,
            display_name: profileData.displayName,
            subscription_status: profileData.subscriptionStatus,
            subscription_provider: profileData.subscriptionProvider,
            trial_starts_at: profileData.trialStartsAt,
            trial_ends_at: profileData.trialEndsAt,
            current_period_end: profileData.currentPeriodEnd,
            games_played: profileData.gamesPlayed || 0,
            games_won: profileData.gamesWon || 0,
            total_score: profileData.totalScore || 0,
            highest_word_score: profileData.highestWordScore || 0,
            created_at: profileData.createdAt,
            updated_at: profileData.updatedAt,
          })
        );

        dispatch(
          setSubscriptionData({
            status: profileData.subscriptionStatus,
            provider: profileData.subscriptionProvider || null,
            trialEndsAt: profileData.trialEndsAt || null,
            currentPeriodEnd: profileData.currentPeriodEnd || null,
          })
        );
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue playing</Text>
          </View>

          <View style={styles.form}>
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
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />

            <Button
              title="Create Account"
              onPress={() => router.push('/(auth)/register')}
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
    color: colors.muted,
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
