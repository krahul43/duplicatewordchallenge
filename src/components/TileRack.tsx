import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Tile } from '../types/game';
import { colors, spacing } from '../theme/colors';

interface Props {
  tiles: Tile[];
  onTilePress: (tile: Tile, index: number) => void;
}

export function TileRack({ tiles, onTilePress }: Props) {
  return (
    <View style={styles.container}>
      {tiles.map((tile, index) => (
        <TileComponent
          key={index}
          tile={tile}
          onPress={() => onTilePress(tile, index)}
        />
      ))}
    </View>
  );
}

interface TileProps {
  tile: Tile;
  onPress: () => void;
}

function TileComponent({ tile, onPress }: TileProps) {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.9);
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
      runOnJS(onPress)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.tile, animatedStyle]}>
        <Text style={styles.letter}>{tile.letter}</Text>
        <Text style={styles.points}>{tile.points}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  tile: {
    width: 45,
    height: 50,
    backgroundColor: colors.tile,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  letter: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.tileText,
  },
  points: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.tileText,
    position: 'absolute',
    bottom: 2,
    right: 4,
  },
});
