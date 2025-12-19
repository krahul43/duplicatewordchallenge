import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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

      try {
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
      } catch (profileError) {
        console.error('Error loading profile:', profileError);
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
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
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue your word adventure</Text>
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
              showPasswordToggle
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
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.7,
    height: 140,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
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
