import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setSubscriptionData } from '../store/slices/subscriptionSlice';

export function useSubscription() {
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.auth.profile);
  const subscription = useSelector((state: RootState) => state.subscription);

  useEffect(() => {
    if (profile) {
      dispatch(setSubscriptionData({
        status: profile.subscription_status,
        provider: profile.subscription_provider || null,
        trialEndsAt: profile.trial_ends_at || null,
        currentPeriodEnd: profile.current_period_end || null,
      }));
    }
  }, [profile]);

  const canPlay = subscription.status === 'trialing' || subscription.status === 'active';

  return {
    subscription,
    canPlay,
    isTrialing: subscription.status === 'trialing',
    isActive: subscription.status === 'active',
    daysLeftInTrial: subscription.daysLeftInTrial,
  };
}
