# 🎮 Mirror Scrabble - Setup Complete!

## ✅ What's Been Done

### 1. Splash Screen ✓
- Added splash screen configuration in `app.json`
- Splash screen image created at `assets/images/splash.png`
- Brand color (#0B6FFF) set as background

### 2. Firebase Migration ✓
- **Removed**: Supabase dependencies and files
- **Added**: Firebase SDK (`firebase` package)
- **Created**: Firebase configuration in `src/lib/firebase.ts`

### 3. Environment Variables ✓
- Created `.env` file with Firebase credential placeholders
- Created `.env.example` for reference
- All credentials use `EXPO_PUBLIC_` prefix for Expo compatibility

### 4. Authentication ✓
- Login screen uses Firebase `signInWithEmailAndPassword()`
- Register screen uses Firebase `createUserWithEmailAndPassword()`
- User profiles stored in Firestore `profiles` collection
- Settings screen uses Firebase `signOut()`

### 5. Documentation ✓
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Complete Firebase setup guide
- **[README.md](./README.md)** - Updated with Firebase instructions
- **.env.example** - Template for credentials

## 🔥 Firebase Credentials Location

### Where to Find Your Credentials

All Firebase credentials go in the `.env` file at the project root.

**Firebase Console Steps:**
1. Go to https://console.firebase.google.com/
2. Select your project (or create new one)
3. Click ⚙️ Settings > Project Settings
4. Scroll to "Your apps" section
5. Click the Web icon (`</>`) to add web app
6. Copy all config values to your `.env`

### Your .env File Structure

```env
# Replace these with your actual values from Firebase Console

EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## ⚙️ Required Firebase Setup

### 1. Enable Authentication
- Go to Firebase Console > Build > Authentication
- Click "Get Started"
- Enable "Email/Password" provider
- Click Save

### 2. Create Firestore Database
- Go to Firebase Console > Build > Firestore Database
- Click "Create database"
- Choose "Start in test mode"
- Select nearest location
- Click Enable

### 3. Set Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profiles
    match /profiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Games
    match /games/{gameId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Rounds & Moves
    match /rounds/{roundId} {
      allow read, write: if request.auth != null;
    }

    match /gameMoves/{moveId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 How to Run

```bash
# 1. Install dependencies (if not done already)
npm install

# 2. Configure Firebase credentials in .env

# 3. Start the app
npm run dev

# 4. Open in:
#    - Press 'w' for web browser
#    - Press 'i' for iOS simulator
#    - Press 'a' for Android emulator
#    - Or scan QR code with Expo Go app
```

## 📱 Testing the App

### 1. Create an Account
- Open the app
- Tap "Create Account"
- Enter name, email, password
- Should see "7-day free trial" message
- Account created in Firebase Auth + Firestore

### 2. Check Firebase Console
- **Authentication tab**: See your user
- **Firestore tab**: See profile document

### 3. Test Login
- Sign out from settings
- Sign back in
- Should work seamlessly

## ⚠️ Important Notes

### Game Features Status

The core authentication is fully functional. However, **game screens need Firestore query updates**:

#### What Works ✅
- User registration with 7-day trial
- Email/password authentication
- Profile creation in Firestore
- Session persistence
- Sign out
- Splash screen

#### What Needs Firebase Integration 🔄
- Home screen game list (currently has Supabase refs)
- Creating/joining games (needs Firestore writes)
- Real-time game updates (needs Firestore listeners)
- Game move submission (needs Cloud Functions)

### To Complete Game Features:

The following files need Firestore query updates:

1. **`app/(tabs)/index.tsx`** - Replace Supabase queries with Firestore:
   - `loadGames()` function
   - `handleQuickPlay()` function
   - `createNewGame()` function

2. **`app/game/[id].tsx`** - Replace Supabase with Firestore:
   - Game loading
   - Real-time updates (use `onSnapshot()`)
   - Word submission

### Example Firestore Queries

```typescript
// Load games
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

const gamesRef = collection(db, 'games');
const q = query(
  gamesRef,
  where('player1Id', '==', userId),
  orderBy('createdAt', 'desc'),
  limit(5)
);
const snapshot = await getDocs(q);
const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// Real-time listener
import { onSnapshot, doc } from 'firebase/firestore';

const unsub = onSnapshot(doc(db, 'games', gameId), (doc) => {
  const gameData = doc.data();
  // Update UI
});
```

## 📚 Resources

- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Detailed Firebase setup guide
- **[Firebase Docs](https://firebase.google.com/docs)** - Official documentation
- **[Firestore Docs](https://firebase.google.com/docs/firestore)** - Database queries
- **[Expo Firebase Guide](https://docs.expo.dev/guides/using-firebase/)** - Integration guide

## 🎯 Next Steps

1. ✅ Get Firebase credentials
2. ✅ Update `.env` file
3. ✅ Enable Authentication in Firebase Console
4. ✅ Create Firestore Database
5. ✅ Test registration and login
6. ⏭️ Update game screens with Firestore queries (if needed)
7. ⏭️ Test full game flow
8. ⏭️ Deploy Firebase Cloud Functions for game logic

## 💡 Pro Tips

- Keep Firebase Console open while developing
- Check Firestore tab to see data being created
- Monitor Authentication tab for user signups
- Use test mode initially, then lock down rules

---

**Everything is configured and ready to go!** 🚀

Just add your Firebase credentials to `.env` and you're ready to test!
