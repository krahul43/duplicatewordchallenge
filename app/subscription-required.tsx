import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Check, ChevronLeft, Crown, RotateCcw, Sparkles, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../src/store';

const { width } = Dimensions.get('window');

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$4.99',
    period: '/ month',
    savings: null,
    features: ['Unlimited games', 'All word challenges', 'Game history', 'Stats & rankings'],
    gradient: ['#4f46e5', '#6366f1'] as [string, string],
    popular: false,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '$39.99',
    period: '/ year',
    savings: 'Save 33%',
    features: ['Unlimited games', 'All word challenges', 'Game history', 'Stats & rankings', 'Priority support'],
    gradient: ['#7c3aed', '#9333ea'] as [string, string],
    popular: true,
  },
];

export default function SubscriptionRequiredScreen() {
  const subscription = useSelector((state: RootState) => state.subscription);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);

  const isTrialing = subscription.status === 'trialing';
  const headline = isTrialing
    ? `${subscription.daysLeftInTrial || 0} Days Left in Trial`
    : 'Unlock Full Access';
  const subline = isTrialing
    ? 'Subscribe now to keep playing after your trial ends'
    : 'Your trial has ended. Subscribe to continue';

  function handleSubscribe() {
    Alert.alert(
      'Coming Soon',
      'Subscription payments will be enabled soon. Your account is ready — we\'ll notify you when billing goes live.',
      [{ text: 'Got it', style: 'cancel' }]
    );
  }

  function handleRestore() {
    Alert.alert(
      'Restore Purchase',
      'Purchase restoration will be available once billing is enabled.',
      [{ text: 'OK', style: 'cancel' }]
    );
  }

  const selected = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <LinearGradient colors={['#0d0d1a', '#13132a', '#0d0d1a']} style={styles.container}>
      <View style={styles.bgDecor}>
        <View style={[styles.bgBlob, { top: -60, right: -60, backgroundColor: '#4c1d95', width: 220, height: 220 }]} />
        <View style={[styles.bgBlob, { bottom: 100, left: -50, backgroundColor: '#1e3a5f', width: 180, height: 180 }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroSection}>
          <LinearGradient colors={['#7c3aed', '#9333ea']} style={styles.crownCircle}>
            <Crown size={44} color="#fff" strokeWidth={1.8} />
          </LinearGradient>
          <View style={styles.crownGlow} />
          <Text style={styles.heroTitle}>{headline}</Text>
          <Text style={styles.heroSubtitle}>{subline}</Text>
        </View>

        <View style={styles.plansRow}>
          {PLANS.map(plan => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selectedPlan === plan.id && styles.planCardSelected]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.8}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Sparkles size={10} color="#fff" />
                  <Text style={styles.popularText}>BEST VALUE</Text>
                </View>
              )}
              <Text style={styles.planLabel}>{plan.label}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
              {plan.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{plan.savings}</Text>
                </View>
              )}
              {selectedPlan === plan.id && (
                <View style={styles.selectedDot}>
                  <View style={styles.selectedDotInner} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Everything included</Text>
          {selected.features.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureCheckCircle}>
                <Check size={13} color="#a78bfa" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.subscribeBtn}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={selected.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subscribeBtnGradient}
          >
            <Zap size={20} color="#fff" fill="#fff" />
            <Text style={styles.subscribeBtnText}>
              Subscribe {selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} — {selected.price}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.7}>
          <RotateCcw size={14} color="rgba(255,255,255,0.4)" />
          <Text style={styles.restoreBtnText}>Restore Purchase</Text>
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          Cancel anytime. Billed through the App Store / Google Play.{'\n'}
          Subscription activates when billing goes live.
        </Text>
      </ScrollView>
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
    opacity: 0.18,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 40,
  },
  topRow: {
    marginBottom: 24,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  crownCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  crownGlow: {
    position: 'absolute',
    top: 52,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#7c3aed',
    opacity: 0.12,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  plansRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#a78bfa',
    backgroundColor: 'rgba(167,139,250,0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7c3aed',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  planLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  planPeriod: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    paddingBottom: 4,
  },
  savingsBadge: {
    backgroundColor: 'rgba(105,240,174,0.15)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#69f0ae',
  },
  selectedDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  featuresCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
    gap: 14,
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(167,139,250,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  subscribeBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  subscribeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 19,
  },
  subscribeBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginBottom: 16,
  },
  restoreBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
  },
  legalNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
