# Duplicate Word Challenge

A multiplayer Scrabble-like word game built with Expo / React Native.

## Stack
- **Frontend**: Expo (React Native), expo-router (file-based routing)
- **State**: Redux Toolkit
- **Backend**: Firebase Firestore (real-time), Firebase Auth
- **Gestures**: react-native-gesture-handler, react-native-reanimated
- **Gradients**: expo-linear-gradient
- **Icons**: lucide-react-native

## Architecture
- `app/` — All screens (expo-router file-based)
  - `(auth)/login.tsx`, `(auth)/register.tsx` — Auth screens (dark premium theme)
  - `(tabs)/index.tsx` — Home screen
  - `(tabs)/games.tsx` — Game history
  - `(tabs)/settings.tsx` — Profile & stats
  - `onboarding.tsx` — Onboarding slideshow
  - `join-game.tsx` — Join with code screen
  - `game/[id].tsx` — Main gameplay screen
  - `matchmaking/[id].tsx` — Matchmaking waiting screen
- `src/components/` — Shared components
  - `GameBoard.tsx` — 15×15 board rendering
  - `DraggableTile.tsx` — Tile drag logic
  - `TileRack.tsx` — Player's letter rack
  - `MatchmakingLoader.tsx` — Matchmaking animation
  - `WaitingForFriendScreen.tsx` — Friend game waiting screen
  - `GameEndModal.tsx` — End-of-game modal
- `src/services/` — Firebase service wrappers
- `src/store/` — Redux slices (auth, game, subscription)
- `src/theme/colors.ts` — Design tokens

## Visual Design
All screens use a **premium dark theme**:
- Background: `['#0d0d1a', '#13132a', '#0d0d1a']` dark gradient
- Accent colors: purple (#6366f1, #8b5cf6), teal, blue, green
- Tab bar: dark `#0d0d1a` background with purple active tint
- Cards: frosted glass `rgba(255,255,255,0.05)` with subtle borders

## Key Bugs Fixed
- **Tile drop accuracy** (`app/game/[id].tsx` → `getCellFromCoordinates`):
  - `adjustedY = relativeY - PADDING - MARGIN` (was missing MARGIN)
  - `rowHeight = CELL_SIZE + MARGIN * 2` (was just CELL_SIZE)
  - `columnWidth = CELL_SIZE + GAP + MARGIN * 2` (was CELL_SIZE + GAP)

## Notes
- `app/game/[id].tsx` has Windows CRLF line endings — use `sed -i` for edits
- Game board: 15×15 cells, `margin: 1`, `gap: 2` (horizontal), container `padding: 4`
- No test runner configured; test manually via Expo
