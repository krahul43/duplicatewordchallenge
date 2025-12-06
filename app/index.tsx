import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../src/lib/firebase';
import { setUser, setProfile } from '../src/store/slices/authSlice';
import { setSubscriptionData } from '../src/store/slices/subscriptionSlice';
import { colors } from '../src/theme/colors';

export default function Index() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        dispatch(setUser(user));

        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));

        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          dispatch(setProfile({
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
          }));

          dispatch(setSubscriptionData({
            status: profileData.subscriptionStatus,
            provider: profileData.subscriptionProvider || null,
            trialEndsAt: profileData.trialEndsAt || null,
            currentPeriodEnd: profileData.currentPeriodEnd || null,
          }));
        }

        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
