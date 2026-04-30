# Duplicate Word Challenge

A multiplayer Scrabble-like word game built with Expo / React Native.

## Stack
- **Frontend**: Expo (React Native), expo-router (file-based routing)
- **State**: Redux Toolkit
- **Backend**: Firebase Firestore (real-time), Firebase Auth
- **Gestures**: react-native-gesture-handler, react-native-reanimated
- **Gradients**: expo-linear-gradient
- **Icons**: lucide-react-native
- **Payments**: RevenueCat (credentials pending — UI ready, integrated later)

## Architecture
- `app/` — All screens (expo-router file-based)
  - `(auth)/login.tsx`, `(auth)/register.tsx` — Auth screens (dark premium theme)
  - `(tabs)/index.tsx` — Home screen (with trial warning banner ≤3 days)
  - `(tabs)/games.tsx` — Game history
  - `(tabs)/settings.tsx` — Profile & stats
  - `onboarding.tsx` — Onboarding slideshow (per-slide accent colors)
  - `join-game.tsx` — Join with code (Scrabble tile-style input)
  - `game/[id].tsx` — Main gameplay screen
  - `matchmaking/[id].tsx` — Matchmaking waiting screen
  - `subscription-required.tsx` — Premium paywall (monthly/yearly plan selector)
- `src/components/` — Shared components
  - `GameBoard.tsx` — 15×15 board rendering
  - `DraggableTile.tsx` — Tile drag logic
  - `TileRack.tsx` — Player's letter rack
  - `MatchmakingLoader.tsx` — Matchmaking animation (dark animated)
  - `WaitingForFriendScreen.tsx` — Friend game waiting screen (dark animated)
  - `GameEndModal.tsx` — End-of-game modal (dark premium)
- `src/services/` — Firebase service wrappers
  - `gameService.ts` — Game CRUD; CRLF file (use sed for edits)
- `src/store/` — Redux slices (auth, game, subscription)
- `src/theme/colors.ts` — Design tokens

## Visual Design
All screens use a **premium dark theme**:
- Background: `['#0d0d1a', '#13132a', '#0d0d1a']` dark gradient
- Accent colors: purple (#6366f1, #8b5cf6), teal, blue, green, red
- Tab bar: dark `#0d0d1a` background with purple active tint
- Cards: frosted glass `rgba(255,255,255,0.05)` with subtle borders

## Subscription / Trial System
- **7-day free trial** set at registration in Firestore: `subscriptionStatus: 'trialing'`, `trialEndsAt`
- Subscription state hydrated via Redux `subscriptionSlice`
- `canPlay()` checks `status === 'trialing' || 'active'`
- When trial expires, home screen gates with redirect to `subscription-required`
- **Trial warning banner** appears on home screen when ≤3 days remain
- `subscription-required.tsx`: premium paywall with monthly/yearly plan selector (RevenueCat to be wired)

## Key Bugs Fixed
- **Tile drop accuracy** (`app/game/[id].tsx` → `getCellFromCoordinates`):
  - `adjustedY = relativeY - PADDING - MARGIN` (was missing MARGIN)
  - `rowHeight = CELL_SIZE + MARGIN * 2` (was just CELL_SIZE)
  - `columnWidth = CELL_SIZE + GAP + MARGIN * 2` (was CELL_SIZE + GAP)
- **End-of-game scoring** (`src/services/gameService.ts` → `endGame()`):
  - Now saves `player1_remaining_tiles` and `player2_remaining_tiles` so tile penalty scoring works
  - Fixed draw detection: `winner_id = null` when scores are equal (was defaulting to player2)

## Notes
- CRLF files: `app/game/[id].tsx`, `src/services/gameService.ts`, most `.ts`/`.tsx` files — use `sed -i` for edits, `write` tool for new files
- Game board: 15×15 cells, `margin: 1`, `gap: 2` (horizontal), container `padding: 4`
- No test runner configured; test manually via Expo
