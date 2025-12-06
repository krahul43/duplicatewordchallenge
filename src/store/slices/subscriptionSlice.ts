import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SubscriptionStatus } from '../../types/game';

interface SubscriptionState {
  status: SubscriptionStatus;
  provider: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  daysLeftInTrial: number;
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  status: 'none',
  provider: null,
  trialEndsAt: null,
  currentPeriodEnd: null,
  daysLeftInTrial: 0,
  loading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscriptionStatus: (state, action: PayloadAction<SubscriptionStatus>) => {
      state.status = action.payload;
    },
    setSubscriptionData: (state, action: PayloadAction<{
      status: SubscriptionStatus;
      provider: string | null;
      trialEndsAt: string | null;
      currentPeriodEnd: string | null;
    }>) => {
      state.status = action.payload.status;
      state.provider = action.payload.provider;
      state.trialEndsAt = action.payload.trialEndsAt;
      state.currentPeriodEnd = action.payload.currentPeriodEnd;

      if (action.payload.trialEndsAt) {
        const now = new Date();
        const trialEnd = new Date(action.payload.trialEndsAt);
        const diffTime = trialEnd.getTime() - now.getTime();
        state.daysLeftInTrial = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      } else {
        state.daysLeftInTrial = 0;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSubscriptionStatus,
  setSubscriptionData,
  setLoading,
  setError,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
