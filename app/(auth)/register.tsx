import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { auth, db } from '../../src/lib/firebase';
import { setProfile, setUser } from '../../src/store/slices/authSlice';
import { setSubscriptionData } from '../../src/store/slices/subscriptionSlice';
import { colors, spacing, typography } from '../../src/theme/colors';

const { width } = Dimensions.get('window');

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
    <LinearGradient
      colors={['#eff6ff', '#f0f9ff', '#fef3c7']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create Account</Text>
            <View style={styles.trialBadge}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.trialGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.trialText}>7 Days Free Trial</Text>
              </LinearGradient>
            </View>
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
              showPasswordToggle
              autoCapitalize="none"
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              showPasswordToggle
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.7,
    height: 140,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  trialBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  trialGradient: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  trialText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  form: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  button: {
    marginBottom: spacing.md,
  },
  error: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
  },
});
