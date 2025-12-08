// import { useEffect, useState } from 'react';
// import { router } from 'expo-router';
// import { View, Text, StyleSheet, Dimensions } from 'react-native';
// import { useDispatch } from 'react-redux';
// import { LinearGradient } from 'expo-linear-gradient';
// import { onAuthStateChanged } from 'firebase/auth';
// import { doc, getDoc } from 'firebase/firestore';
// import { auth, db } from '../src/lib/firebase';
// import { setUser, setProfile } from '../src/store/slices/authSlice';
// import { setSubscriptionData } from '../src/store/slices/subscriptionSlice';
// import { colors } from '../src/theme/colors';

// const { width } = Dimensions.get('window');

// export default function Index() {
//   const dispatch = useDispatch();
//   const [showSplash, setShowSplash] = useState(true);

//   useEffect(() => {
//     const splashTimer = setTimeout(() => {
//       setShowSplash(false);
//     }, 2000);

//     return () => clearTimeout(splashTimer);
//   }, []);

//   useEffect(() => {
//     if (showSplash) return;

//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         dispatch(setUser({
//           uid: user.uid,
//           email: user.email,
//           displayName: user.displayName,
//           photoURL: user.photoURL,
//           emailVerified: user.emailVerified,
//         }));

//         const profileDoc = await getDoc(doc(db, 'profiles', user.uid));

//         if (profileDoc.exists()) {
//           const profileData = profileDoc.data();
//           dispatch(setProfile({
//             id: user.uid,
//             display_name: profileData.displayName,
//             subscription_status: profileData.subscriptionStatus,
//             subscription_provider: profileData.subscriptionProvider,
//             trial_starts_at: profileData.trialStartsAt,
//             trial_ends_at: profileData.trialEndsAt,
//             current_period_end: profileData.currentPeriodEnd,
//             games_played: profileData.gamesPlayed || 0,
//             games_won: profileData.gamesWon || 0,
//             total_score: profileData.totalScore || 0,
//             highest_word_score: profileData.highestWordScore || 0,
//             created_at: profileData.createdAt,
//             updated_at: profileData.updatedAt,
//           }));

//           dispatch(setSubscriptionData({
//             status: profileData.subscriptionStatus,
//             provider: profileData.subscriptionProvider || null,
//             trialEndsAt: profileData.trialEndsAt || null,
//             currentPeriodEnd: profileData.currentPeriodEnd || null,
//           }));
//         }

//         router.replace('/(tabs)');
//       } else {
//         router.replace('/(auth)/login');
//       }
//     });

//     return () => unsubscribe();
//   }, [showSplash]);

//   if (!showSplash) {
//     return (
//       <View style={styles.loadingContainer}>
//         <View style={styles.logo}>
//           <View style={styles.letterBox}>
//             <Text style={styles.letter}>W</Text>
//           </View>
//           <View style={styles.letterBox}>
//             <Text style={styles.letter}>O</Text>
//           </View>
//           <View style={styles.letterBox}>
//             <Text style={styles.letter}>R</Text>
//           </View>
//           <View style={styles.letterBox}>
//             <Text style={styles.letter}>D</Text>
//           </View>
//           <View style={styles.letterBox}>
//             <Text style={styles.letter}>S</Text>
//           </View>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <LinearGradient
//         colors={[colors.splash.blue, colors.splash.darkBlue]}
//         style={styles.gradient}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       >
//         {Array.from({ length: 30 }).map((_, index) => (
//           <View
//             key={index}
//             style={[
//               styles.stripe,
//               {
//                 top: -width + (index * width) / 6,
//                 left: -width / 2,
//               },
//             ]}
//           />
//         ))}

//         <View style={styles.logoContainer}>
//           <View style={styles.logo}>
//             <View style={styles.letterBox}>
//               <Text style={styles.letter}>W</Text>
//             </View>
//             <View style={styles.letterBox}>
//               <Text style={styles.letter}>O</Text>
//             </View>
//             <View style={styles.letterBox}>
//               <Text style={styles.letter}>R</Text>
//             </View>
//             <View style={styles.letterBox}>
//               <Text style={styles.letter}>D</Text>
//             </View>
//             <View style={styles.letterBox}>
//               <Text style={styles.letter}>S</Text>
//             </View>
//           </View>
//           <View style={styles.subtitle}>
//             <Text style={styles.withText}>with</Text>
//             <Text style={styles.friendsText}>friends</Text>
//             <Text style={styles.classicText}>CLASSIC</Text>
//           </View>
//         </View>
//       </LinearGradient>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   gradient: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     overflow: 'hidden',
//   },
//   stripe: {
//     position: 'absolute',
//     width: width * 2,
//     height: 2,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     transform: [{ rotate: '45deg' }],
//   },
//   logoContainer: {
//     alignItems: 'center',
//   },
//   logo: {
//     flexDirection: 'row',
//     marginBottom: 8,
//   },
//   letterBox: {
//     width: 42,
//     height: 42,
//     backgroundColor: colors.tile,
//     marginHorizontal: 2,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 4,
//     borderBottomWidth: 3,
//     borderBottomColor: colors.tileBorder,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3,
//     elevation: 5,
//   },
//   letter: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: colors.tileText,
//   },
//   subtitle: {
//     alignItems: 'center',
//   },
//   withText: {
//     fontSize: 14,
//     color: '#FFFFFF',
//     fontWeight: '400',
//   },
//   friendsText: {
//     fontSize: 20,
//     color: '#FFFFFF',
//     fontWeight: '700',
//     marginTop: -2,
//   },
//   classicText: {
//     fontSize: 12,
//     color: '#FFFFFF',
//     fontWeight: '600',
//     letterSpacing: 2,
//     marginTop: 2,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: colors.surface,
//   },
// });


























import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Dimensions, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { auth, db } from '../src/lib/firebase';
import { setProfile, setUser } from '../src/store/slices/authSlice';
import { setSubscriptionData } from '../src/store/slices/subscriptionSlice';

const { width } = Dimensions.get('window');

export default function Index() {
  const dispatch = useDispatch();
  const [showSplash, setShowSplash] = useState(true);

  // Splash screen timer
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, []);

  // Auth check after splash disappears
  useEffect(() => {
    if (showSplash) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // store user to redux
        dispatch(
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
          })
        );

        // load profile document
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();

          dispatch(
            setProfile({
              id: user.uid,
              display_name: profileData.displayName,
              subscription_status: profileData.subscriptionStatus,
              subscription_provider: profileData.subscriptionProvider,
              trial_starts_at: profileData.trialStartsAt,
              trial_ends_at: profileData.trialEndsAt,
              current_period_end: profileData.currentPeriodEnd,
              games_played: profileData.gamesPlayed || 0,
              games_won: profileData.gamesWon || 0,
              total_score: profileData.totalScore || 0,
              highest_word_score: profileData.highestWordScore || 0,
              created_at: profileData.createdAt,
              updated_at: profileData.updatedAt,
            })
          );

          dispatch(
            setSubscriptionData({
              status: profileData.subscriptionStatus,
              provider: profileData.subscriptionProvider || null,
              trialEndsAt: profileData.trialEndsAt || null,
              currentPeriodEnd: profileData.currentPeriodEnd || null,
            })
          );
        }

        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    });

    return () => unsubscribe();
  }, [showSplash]);

  // ---------------- SPLASH "LOADING PHASE" SCREEN ----------------
  if (showSplash) {
    return (
      <View style={styles.stripesBackground}>
        {Array.from({ length: 40 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.stripe,
              { top: -width + (i * width) / 7 },
            ]}
          />
        ))}

        <View style={styles.logoRow1}>
          <View style={{ flexDirection: 'row', alignItems: 'center', height:20 }}>
            <View style={styles.letterBox1}><Text style={styles.letter1}>W</Text></View>
            <View style={styles.letterBox1}><Text style={styles.letter1}>O</Text></View>
            <View style={styles.letterBox1}><Text style={styles.letter1}>R</Text></View>
            <View style={styles.letterBox1}><Text style={styles.letter1}>D</Text></View>
            <View style={styles.letterBox1}><Text style={styles.letter1}>S</Text></View>
          </View>
          
          {/* <View style={styles.textRight1}> */}
            <ImageBackground style={{width:135}}  source={require('../assets/images/messagelogo.png')} resizeMode='contain' tintColor={'black'} >
            <Text style={styles.withText1}>with</Text>
            <Text style={styles.friendsText1}>friends</Text>
            <Text style={styles.classicText1}>CLASSIC</Text>
             </ImageBackground>
          {/* </View> */}
        </View>
        
       

      </View>
    );
  }

  // ---------------- AFTER SPLASH CHECK AUTH ----------------
  return (
    <View style={styles.loadingContainer}>
      {/* <View style={styles.logoRow}>
        <View style={styles.letterBox}><Text style={styles.letter}>W</Text></View>
        <View style={styles.letterBox}><Text style={styles.letter}>O</Text></View>
        <View style={styles.letterBox}><Text style={styles.letter}>R</Text></View>
        <View style={styles.letterBox}><Text style={styles.letter}>D</Text></View>
        <View style={styles.letterBox}><Text style={styles.letter}>S</Text></View>
        <View style={styles.textRight}>
          <Text style={styles.withText}>with</Text>
          <Text style={styles.friendsText}>friends</Text>
          <Text style={styles.classicText}>CLASSIC</Text>
        </View>
      </View> */}
          <View style={styles.logoRow1}>
            <View style={{ flexDirection: 'row', alignItems: 'center', height:20 }}>
              <View style={styles.letterBox1}><Text style={styles.letter1}>W</Text></View>
              <View style={styles.letterBox1}><Text style={styles.letter1}>O</Text></View>
              <View style={styles.letterBox1}><Text style={styles.letter1}>R</Text></View>
              <View style={styles.letterBox1}><Text style={styles.letter1}>D</Text></View>
              <View style={styles.letterBox1}><Text style={styles.letter1}>S</Text></View>
            </View>
            <ImageBackground style={{width:135}}  source={require('../assets/images/messagelogo.png')} resizeMode='contain' tintColor={'black'} >
              <Text style={styles.withText1}>with</Text>
              <Text style={styles.friendsText1}>friends</Text>
              <Text style={styles.classicText1}>CLASSIC</Text>
            </ImageBackground>
          </View>
    </View>
  );
}


const styles = StyleSheet.create({
  stripesBackground: {
    flex: 1,
    backgroundColor: '#0A5ECF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    width: width * 2,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.08)',
    transform: [{ rotate: '45deg' }],
  },
  logoRow1:{
      flexDirection: 'row',
      alignItems: 'center',
      gap:10
  },
  letterBox1:{
    width: 35,
    height: 30,
    backgroundColor: '#FFC94D',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    // marginHorizontal: 3,
    borderBottomWidth: 4,
    borderBottomColor: '#FFC94D'
  },
  letter1:{
   fontSize: 20,
    fontWeight: '800',
    color: '#4A2A00',
  },
  textRight1: {
    marginLeft: 10,
    alignItems: 'flex-start',
    // backgroundColor:'pink'
  },
  withText1: {
    color: '#fff',
    fontSize: 25,
    alignSelf:'flex-end',
    marginRight:35,
    marginBottom:-22,
    fontWeight:'bold',
    letterSpacing: 1.5,
  },
  friendsText1: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '700',
    marginTop: -2,
  },
  classicText1: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: -13,
    alignSelf:'flex-end',
    marginRight:5,
  },








  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  letterBox: {
    width: 48,
    height: 48,
    backgroundColor: '#FFC94D',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    borderBottomWidth: 4,
    borderBottomColor: '#D69D00',
  },
  letter: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4A2A00',
  },
  textRight: {
    marginLeft: 10,
    alignItems: 'flex-start',
  },
  withText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 25,
    marginBottom:-9
  },
  friendsText: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '700',
    marginTop: -2,
  },
  classicText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A5ECF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
