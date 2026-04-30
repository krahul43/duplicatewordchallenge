import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  emoji: string;
  badge: string;
  title: string;
  description: string;
  gradients: [string, string, string];
  accentColor: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    emoji: '🎯',
    badge: 'WORD CHALLENGE',
    title: 'Outsmart Your Opponent',
    description: 'Place tiles strategically, form words, and rack up points. Every move matters in this battle of vocabulary.',
    gradients: ['#1a1a2e', '#16213e', '#0f3460'],
    accentColor: '#e94560',
  },
  {
    id: '2',
    emoji: '🌍',
    badge: 'MULTIPLAYER',
    title: 'Play with Anyone, Anywhere',
    description: 'Challenge your friends with a private code or jump into a random match with players around the world.',
    gradients: ['#0d1b2a', '#1b263b', '#415a77'],
    accentColor: '#00b4d8',
  },
  {
    id: '3',
    emoji: '🏆',
    badge: 'COMPETITION',
    title: 'Rise Through the Ranks',
    description: 'Every game earns you points. Build the highest-scoring words, land on bonus squares, and dominate the board.',
    gradients: ['#1a0a00', '#3d1c02', '#7b3f00'],
    accentColor: '#f4a261',
  },
  {
    id: '4',
    emoji: '⚡',
    badge: 'FREE TRIAL',
    title: 'Start Playing Today',
    description: 'Your first 7 days are completely free. Unleash your inner word master — no credit card required.',
    gradients: ['#0a2e0a', '#1b5e20', '#2e7d32'],
    accentColor: '#69f0ae',
  },
];

function SlideItem({ item, index, scrollX }: { item: OnboardingSlide; index: number; scrollX: Animated.Value }) {
  const iconScale = useRef(new Animated.Value(0.5)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(40)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const listener = scrollX.addListener(({ value }) => {
      const opacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
    });

    Animated.parallel([
      Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(iconOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(textSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.15, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 0.9, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    glow.start();

    return () => {
      scrollX.removeListener(listener);
      glow.stop();
    };
  }, []);

  return (
    <LinearGradient colors={item.gradients} style={styles.slide} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}>
      <View style={styles.slideContent}>
        <View style={styles.iconArea}>
          <Animated.View style={[styles.glowCircle, { borderColor: item.accentColor, transform: [{ scale: glowScale }] }]} />
          <Animated.View style={[styles.iconCircle, { borderColor: item.accentColor, transform: [{ scale: iconScale }], opacity: iconOpacity }]}>
            <Text style={styles.iconEmoji}>{item.emoji}</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.textArea, { transform: [{ translateY: textSlide }], opacity: textOpacity }]}>
          <View style={[styles.badgeContainer, { borderColor: item.accentColor }]}>
            <Text style={[styles.badgeText, { color: item.accentColor }]}>{item.badge}</Text>
          </View>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>
        </Animated.View>

        <View style={styles.decorRow}>
          {['W', 'O', 'R', 'D', 'S'].map((letter, i) => (
            <View key={i} style={[styles.decorTile, { opacity: 0.08 + i * 0.04 }]}>
              <Text style={styles.decorTileText}>{letter}</Text>
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentIndex + 1) / slides.length,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index || 0);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const pressBtn = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handleNext = () => {
    pressBtn();
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => handleGetStarted();

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/login');
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item, index }) => <SlideItem item={item} index={index} scrollX={scrollX} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      />

      <View style={styles.footer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: currentSlide.accentColor }]} />
        </View>

        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && [styles.dotActive, { backgroundColor: currentSlide.accentColor }],
              ]}
            />
          ))}
        </View>

        <View style={styles.btnRow}>
          {currentIndex < slides.length - 1 ? (
            <>
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                <TouchableOpacity
                  style={[styles.nextBtn, { backgroundColor: currentSlide.accentColor }]}
                  onPress={handleNext}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nextText}>Next →</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            <Animated.View style={[{ flex: 1, transform: [{ scale: btnScale }] }]}>
              <TouchableOpacity
                style={[styles.getStartedBtn, { backgroundColor: currentSlide.accentColor }]}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.getStartedText}>Get Started ✦</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    width,
    height,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: height * 0.1,
    paddingBottom: 180,
    justifyContent: 'space-between',
  },
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  glowCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    opacity: 0.2,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 80,
  },
  textArea: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 24,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 18,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  slideTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 42,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  slideDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  decorRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 24,
  },
  decorTile: {
    width: 38,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  decorTileText: {
    fontSize: 18,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.5)',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: 48,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  skipBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  nextBtn: {
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 50,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  getStartedBtn: {
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
