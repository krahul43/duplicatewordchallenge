import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { auth, db } from '../src/lib/firebase';
import { setProfile, setUser } from '../src/store/slices/authSlice';
import { setSubscriptionData } from '../src/store/slices/subscriptionSlice';

const { width } = Dimensions.get('window');

export default function Index() {
  const dispatch = useDispatch();
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboarding(seen === 'true');
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (showSplash || hasSeenOnboarding === null) return;

    if (!hasSeenOnboarding) {
      router.replace('/onboarding');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
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
      } else {
        router.replace('/(auth)/login');
      }
    });

    return () => unsubscribe();
  }, [showSplash, hasSeenOnboarding]);

  if (showSplash) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.splashContainer}
      >
     <Image
  source={require('../assets/images/splashImage.png')}
  style={styles.fullScreenImage}
  resizeMode="cover"
/>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.loadingContainer}
    >
      <Image
        source={require('../assets/images/splashImage.png')}
        style={styles.fullScreenImage}
        resizeMode="cover"
      />
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  fullScreenImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
