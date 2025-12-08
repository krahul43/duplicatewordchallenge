import { router } from 'expo-router';
import { User as UserIcon, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { gameService } from '../../src/services/gameService';
import { RootState } from '../../src/store';
import { colors, spacing, typography } from '../../src/theme/colors';
import { Game } from '../../src/types/game';

export default function HomeScreen() {
  const profile = useSelector((state: RootState) => state.auth.profile);
  const subscription = useSelector((state: RootState) => state.subscription);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    if (!profile) return;

    try {
      const playerGames = await gameService.getPlayerGames(profile.id);
      setGames(playerGames.filter(g => g.status === 'playing'));
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  }

  async function handleQuickPlay() {
    if (!canPlay()) {
      router.push('/subscription-required');
      return;
    }

    if (!profile?.id) return;

    setLoading(true);

    try {
      const waitingGame = await gameService.findWaitingGame(profile.id);

      if (waitingGame) {
        await gameService.joinGame(waitingGame.id, profile.id);
        router.push(`/game/${waitingGame.id}`);
      } else {
        await createNewGame(false);
      }
    } catch (error) {
      console.error('Failed to quick play:', error);
    } finally {
      setLoading(false);
    }
  }

    async function createNewGame(isPrivate: boolean) {
    if (!canPlay()) {
      router.push('/subscription-required');
      return;
    }

    if (!profile?.id) return;

    setLoading(true);

    try {
      const gameId = await gameService.createGame(profile.id, isPrivate);
      router.push(`/game/${gameId}`);
    } catch (error) {
      console.error('Failed to create game:', error);
    } finally {
      setLoading(false);
    }
  }

  function canPlay(): boolean {
    return subscription.status === 'trialing' || subscription.status === 'active';
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {games.length > 0 && (
          <TouchableOpacity
            style={styles.gameInProgressBanner}
            onPress={() => router.push(`/game/${games[0].id}`)}
          >
            <Text style={styles.bannerText}>You have a game in progress play</Text>
          </TouchableOpacity>
        )}


        {/* <View style={styles.logoContainer}>
          <View style={styles.zigzagLeft} />
          <View style={styles.logoBox}>
          <Text style={styles.logoSubtext}>The Classic Crossword Game</Text>
          <Text style={styles.logoText}>SCRABBLE</Text>
          </View>
          <View style={styles.zigzagRight} />
        </View> */}




{/* 
<View style={styles.logoContainer}>
  <View style={styles.zigzagSideLeft}>
    <View style={styles.triangleLeft} />
    <View style={styles.triangleLeft} />
    <View style={styles.triangleLeft} />
  </View>

  <View style={styles.logoBox}>
    <Text style={styles.logoSubtext}>The Classic Crossword Game</Text>
    <Text style={styles.logoText}>SCRABBLE</Text>
  </View>

  <View style={styles.zigzagSideRight}>
    <View style={styles.triangleRight} />
    <View style={styles.triangleRight} />
    <View style={styles.triangleRight} />
  </View>
</View> */}


        <Image style={{height:125, width:300}} source={require('../../assets/images/bannerimage.png')} />



        <Text style={styles.description}>
          Play your favorite game of Scrabble with friends and family or practice against the computer in real-time. Play Scrabble online for free now!
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleQuickPlay}
            disabled={loading}
          >
            <View style={[styles.iconWrapper, styles.pinkIcon]}>
              <Users size={24} color={colors.surface} />
            </View>
            <Text style={styles.actionButtonText}>Find a Match</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => createNewGame(true)}
            disabled={loading}
          >
            <View style={[styles.iconWrapper, styles.yellowIcon]}>
              <UserIcon size={24} color={colors.surface} />
            </View>
            <Text style={styles.actionButtonText}>Play a Friend</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  gameInProgressBanner: {
    backgroundColor: '#FBD59A',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  bannerText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },








//   logoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: spacing.xl,
//     marginTop: spacing.xl,
//   },
// zigzagLeft: {
//   width: 12,
//   height: '100%',
//   backgroundColor: 'transparent',
//   borderRightWidth: 10,
//   borderRightColor: '#FFFFFF',
//   borderStyle: 'dashed',
//   opacity: 0.7,
//   marginRight: -6,
// },
//   logoBox: {
//     backgroundColor: '#E64D3C',
//     paddingHorizontal: spacing.xl * 1.5,
//     paddingVertical: spacing.lg,
//     borderRadius: 12,
//     alignItems: 'center',
//     // SHADOW 
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     elevation: 8,
//     overflow: 'visible',
//   },
//   logoSubtext: {
//   fontSize: 14,
//   color: '#FFFFFF',
//   marginTop: spacing.sm,
//   fontWeight: '500',
// },
//   logoText: {
//     fontSize: 44,
//   fontWeight: '900',
//   color: '#FFFFFF',
//   textAlign: 'center',
//   lineHeight: 44,
//   letterSpacing: 3,
// },
// zigzagRight: {
//   width: 12,
//   height: '100%',
//   backgroundColor: 'transparent',
//   borderLeftWidth: 10,
//   borderLeftColor: '#FFFFFF',
//   borderStyle: 'dashed',
//   opacity: 0.7,
//   marginLeft: -6,
// },












// logoContainer: {
//   flexDirection: "row",
//   alignItems: "center",
//   justifyContent: "center",
//   marginVertical: 30,
// },
// zigzagSideLeft: {
//   justifyContent: "center",
//   marginRight: -8,
// },
// zigzagSideRight: {
//   justifyContent: "center",
//   marginLeft: -8,
// },
// triangleLeft: {
//   width: 0,
//   height: 0,
//   borderTopWidth: 10,
//   borderBottomWidth: 10,
//   borderRightWidth: 20,
//   borderTopColor: "transparent",
//   borderBottomColor: "transparent",
//   borderRightColor: "#E64D3C",
//   marginVertical: 2,
// },
// triangleRight: {
//   width: 0,
//   height: 0,
//   borderTopWidth: 10,
//   borderBottomWidth: 10,
//   borderLeftWidth: 20,
//   borderTopColor: "transparent",
//   borderBottomColor: "transparent",
//   borderLeftColor: "#E64D3C",
//   marginVertical: 2,
// },
// logoBox: {
//   backgroundColor: "#E64D3C",
//   paddingHorizontal: 40,
//   paddingVertical: 14,
//   borderRadius: 12,
//   alignItems: "center",
// },
// logoSubtext: {
//   fontSize: 14,
//   color: "#fff",
//   marginBottom: 6,
//   fontWeight: "500",
// },
// logoText: {
//   fontSize: 40,
//   fontWeight: "900",
//   color: "#fff",
//   letterSpacing: 4,
// },





















  description: {
    fontSize:14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pinkIcon: {
    backgroundColor: colors.button.pink,
  },
  yellowIcon: {
    backgroundColor: colors.button.yellow,
  },
  actionButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
});
