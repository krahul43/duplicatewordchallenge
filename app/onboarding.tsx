import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Sparkles, Trophy, Users, Zap } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
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
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: <Sparkles size={80} color="#fff" fill="#fff" />,
    title: 'Welcome to Duplicate Word Challenge',
    description: 'The ultimate word game experience! Challenge friends and test your vocabulary skills.',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: '2',
    icon: <Users size={80} color="#fff" strokeWidth={2} />,
    title: 'Play with Friends',
    description: 'Create private games or join random matches. Connect with players worldwide!',
    gradient: ['#f093fb', '#f5576c'],
  },
  {
    id: '3',
    icon: <Trophy size={80} color="#fff" strokeWidth={2} />,
    title: 'Compete & Win',
    description: 'Build the best words, score points, and climb to the top of the leaderboard!',
    gradient: ['#4facfe', '#00f2fe'],
  },
  {
    id: '4',
    icon: <Zap size={80} color="#fff" fill="#fff" />,
    title: 'Start Your Journey',
    description: 'Get 7 days free trial! Start playing now and unleash your word mastery.',
    gradient: ['#43e97b', '#38f9d7'],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/login');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={item.gradient}
        style={styles.slideGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconContainer}>
          {item.icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {currentIndex < slides.length - 1 ? (
            <>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.nextButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.nextText}>Next</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={handleGetStarted} style={styles.fullWidthButton}>
              <LinearGradient
                colors={['#43e97b', '#38f9d7']}
                style={styles.getStartedButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    width,
    height,
  },
  slideGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 60,
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#fff',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  nextButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  nextText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  fullWidthButton: {
    flex: 1,
  },
  getStartedButton: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  getStartedText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
});
