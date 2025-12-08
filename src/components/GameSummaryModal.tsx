import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { GameSummary } from '../types/game';

interface GameSummaryModalProps {
  visible: boolean;
  summary: GameSummary | null;
  currentPlayerId: string;
  player1Name: string;
  player2Name: string;
  onClose: () => void;
  onPlayAgain?: () => void;
}

export function GameSummaryModal({
  visible,
  summary,
  currentPlayerId,
  player1Name,
  player2Name,
  onClose,
  onPlayAgain,
}: GameSummaryModalProps) {
  if (!summary) return null;

  const isPlayer1 = currentPlayerId === summary.player1_id;
  const didWin = currentPlayerId === summary.winner_id;
  const opponentName = isPlayer1 ? player2Name : player1Name;

  const myScore = isPlayer1 ? summary.player1_score : summary.player2_score;
  const opponentScore = isPlayer1 ? summary.player2_score : summary.player1_score;
  const myHighestWord = isPlayer1 ? summary.player1_highest_word : summary.player2_highest_word;
  const myHighestScore = isPlayer1 ? summary.player1_highest_score : summary.player2_highest_score;
  const opponentHighestWord = isPlayer1 ? summary.player2_highest_word : summary.player1_highest_word;
  const opponentHighestScore = isPlayer1 ? summary.player2_highest_score : summary.player1_highest_score;
  const myMoves = isPlayer1 ? summary.player1_moves_count : summary.player2_moves_count;
  const opponentMoves = isPlayer1 ? summary.player2_moves_count : summary.player1_moves_count;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.overlay}>
        <View style={styles.modal}>

          
          {/* <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color={'#fff'} fontWeight= {'700'}/>
          </TouchableOpacity> */}
          

          <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
            <View>
              <Text style={styles.resultTitle}>
                {didWin ? 'You Won!' : 'You Lost'}
              </Text>
              {summary.resigned && (
              <Text style={styles.resignedText}>
                {opponentName} resigned
              </Text>
              )}
            </View>
            <TouchableOpacity style={{borderWidth:1, borderColor:'#AAAAAA', borderRadius:6, height:40, width:40, alignItems:'center', justifyContent:'center'}} onPress={onClose}>
              {/* <Text style={{fontSize:20, fontWeight:'700', backgroundColor:'#e4e4ec', width:36, height:35, borderRadius:6, textAlign:'center', }}>×</Text> */}
              <Image style={{height:32, width:32, borderRadius:6, backgroundColor:'#e4e4ec',}} source={require('../../assets/images/closeimage.png')} resizeMode='contain'/>
            </TouchableOpacity>
          </View>
         



          {/* <View style={styles.confetti}>
            <Text style={styles.confettiText}>🎉</Text>
            <Text style={styles.confettiText}>✨</Text>
            <Text style={styles.confettiText}>🎊</Text>
          </View> */}

          {/* <Text style={styles.resultTitle}>
            {didWin ? 'You Won!' : 'You Lost'}
          </Text> */}

          {/* {summary.resigned && (
            <Text style={styles.resignedText}>
              {opponentName} resigned
            </Text>
          )} */}


          <View style={styles.playersContainer}>
            <View style={styles.playerAvatar}>
              <Text style={styles.avatarText}>
                {(isPlayer1 ? player1Name : player2Name)[0].toUpperCase()}
              </Text>
            </View>
            {/* <View style={styles.vsText}>
              <Text style={styles.vsLabel}>VS</Text>
            </View> */}
            <View style={styles.playerAvatar}>
              <Text style={styles.avatarText}>
                {opponentName[0].toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.namesContainer}>
            <Text style={styles.playerName}>{isPlayer1 ? player1Name : player2Name}</Text>
            {/* <View style={styles.heartIcon}>
              <Text>♥</Text>
            </View> */}
            <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
            <Image style={{height:15, width:15}} source={require('../../assets/images/hearticon.png')} resizeMode='contain'></Image>
            <Text style={styles.playerName}>{opponentName}</Text>
            </View>
          </View>


              <View>

                <View style={styles.sectionContainer}>
                  <View style={styles.line} />
                    <Text style={styles.sectionText}>Top Word</Text>
                  <View style={styles.line} />
                </View> 
                <View style={{  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom:20}}>
                  <View style={styles.statValue}>
                    <Text style={styles.statPoints}>{myHighestScore || 0} Points</Text>
                  </View>
                  <View style={styles.statValue}>
                    <Text style={styles.statPoints}>{opponentHighestScore || 0} Points</Text>
                  </View>
                </View>

                <View style={styles.sectionContainer}>
                  <View style={styles.line} />
                    <Text style={styles.sectionText}>Game Score</Text>
                  <View style={styles.line} />
                </View>
                <View style={[styles.statRow, {marginBottom:15}]}>
                  <Text style={styles.scoreValue}>{myScore}</Text>
                  <Text style={styles.scoreValue}>{opponentScore}</Text>
                </View>

                <View style={styles.sectionContainer}>
                  <View style={styles.line} />
                    <Text style={styles.sectionText}>Time Penalties</Text>
                  <View style={styles.line} />
                </View>
                <View style={[styles.statRow, {marginBottom:0}]}>
                  <Text style={styles.scoreValue}>{myMoves}</Text>
                  <Text style={styles.scoreValue}>{opponentMoves}</Text>
                </View>






<Image source={require('../../assets/images/infoicon.png')} style={{height:20, width:20, alignSelf:'center', tintColor:'gray', marginBottom:12}} resizeMode='contain'/>

{/* color. image of info */}

                <View style={styles.sectionContainer}>
                  <View style={styles.line} />
                    <Text style={styles.sectionText}>Leftover Tiles</Text>
                  <View style={styles.line} />
                </View>
                <View style={[styles.statRow, {marginBottom:20}]}>
                  <Text style={styles.scoreValue}>{myMoves}</Text>
                  <Text style={styles.scoreValue}>{opponentMoves}</Text>
                </View>

                <View style={styles.sectionContainer}>
                  <View style={styles.line} />
                    <Text style={styles.sectionText}>Total Score</Text>
                  <View style={styles.line} />
                </View>
                 <View style={styles.statRow}>
                    <Text style={[styles.totalScore, didWin && styles.winnerScore]}>{myScore}</Text>
                    <Text style={[styles.sectionText, {color:'lightgray'}]}>Close Game!</Text>
                    <Text style={[styles.totalScore, !didWin && styles.winnerScore]}>{opponentScore}</Text>
                  </View>

              </View>




                <View style={[styles.sectionContainer, {marginTop:20}]}>
                  <View style={styles.line} />
                    <View style={[styles.word_style,{marginRight:5}]}>
                    <Text style={styles.sectionText1}>P</Text>
                    </View>
                     <View style={[styles.word_style,{marginRight:5}]}>
                    <Text style={styles.sectionText1}>L</Text>
                    </View>
                     <View style={[styles.word_style,{marginRight:5}]}>
                    <Text style={styles.sectionText1}>A</Text>
                    </View>
                     <View style={styles.word_style}>
                    <Text style={styles.sectionText1}>Y</Text>
                    </View>
                  <View style={styles.line} />
                </View>





          {/* <View style={styles.statsContainer}>
            <View style={styles.statSection}>
              <Text style={styles.statLabel}>Top Word</Text>
              <View style={styles.statRow}>
                <View style={styles.statValue}>
                  <Text style={styles.statWord}>{myHighestWord || '-'}</Text>
                  <Text style={styles.statPoints}>{myHighestScore || 0} Points</Text>
                </View>
                <View style={styles.statValue}>
                  <Text style={styles.statWord}>{opponentHighestWord || '-'}</Text>
                  <Text style={styles.statPoints}>{opponentHighestScore || 0} Points</Text>
                </View>
              </View>
            </View>
            <View style={styles.statSection}>
              <Text style={styles.statLabel}>Game Score</Text>
              <View style={styles.statRow}>
                <Text style={styles.scoreValue}>{myScore}</Text>
                <Text style={styles.scoreValue}>{opponentScore}</Text>
              </View>
            </View>
            <View style={styles.statSection}>
              <Text style={styles.statLabel}>Total Moves</Text>
              <View style={styles.statRow}>
                <Text style={styles.scoreValue}>{myMoves}</Text>
                <Text style={styles.scoreValue}>{opponentMoves}</Text>
              </View>
            </View>
            <View style={styles.statSection}>
              <Text style={styles.statLabel}>Game Duration</Text>
              <View style={styles.statRow}>
                <Text style={styles.scoreValue} numberOfLines={1}>
                  {summary.duration_minutes} min
                </Text>
              </View>
            </View>
            <View style={styles.statSection}>
              <Text style={styles.statLabel}>Total Score</Text>
              <View style={styles.statRow}>
                <Text style={[styles.totalScore, didWin && styles.winnerScore]}>{myScore}</Text>
                <Text style={[styles.totalScore, !didWin && styles.winnerScore]}>{opponentScore}</Text>
              </View>
            </View>
          </View> */}









          <View style={{flexDirection:'row', paddingVertical:25, justifyContent:'center', gap:30}}>
              <View style={{alignItems:'center'}}>
              <TouchableOpacity style={{ backgroundColor:'#ed9898', borderColor:'#960000', borderRadius:10, borderWidth:0.5, height:45, width:48, alignItems:'center', justifyContent:'center'}} onPress={onClose}>
                <Image source={require('../../assets/images/gameconsole.png')} style={{height:35, width:35, borderWidth:0.5, borderColor:'#960000', borderRadius:6,  backgroundColor:'#d22b2b',}} resizeMode='contain'/>
              </TouchableOpacity>
              <Text style={{fontSize:17, textAlign:'center',}}>ONLINE</Text>
            </View>

          <View style={{alignItems:'center'}}>
              <TouchableOpacity style={{ backgroundColor:'#fff8dc', borderColor:'#fad5a5', borderRadius:10, borderWidth:0.5, height:45, width:48, alignItems:'center', justifyContent:'center'}} onPress={onClose}>
                <Image source={require('../../assets/images/usericon.png')} style={{height:35, width:35, borderWidth:0.5, borderColor:'#fad5a5', borderRadius:6,  backgroundColor:'#ffd700',}} resizeMode='contain'/>
              </TouchableOpacity>
              <Text style={{fontSize:17, textAlign:'center',}}>FRIEND</Text>
            </View>
            <View style={{alignItems:'center'}}>
              <TouchableOpacity style={{ backgroundColor:'#b4d6d6', borderColor:'#088f8f', borderRadius:10, borderWidth:0.5, height:45, width:48, alignItems:'center', justifyContent:'center'}} onPress={onClose}>
                <Image source={require('../../assets/images/computericon.png')} style={{height:35, width:35, borderWidth:0.5, borderColor:'#088f8f', borderRadius:6,  backgroundColor:'#57abab',}} resizeMode='contain'/>
              </TouchableOpacity>
              <Text style={{fontSize:17, textAlign:'center',}}>COMPUTER</Text>
            </View>
           
          </View>










          {onPlayAgain && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.playAgainButton} onPress={onPlayAgain}>
                <Text style={styles.playAgainText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      </ScrollView>

    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    // padding: spacing.lg,
  },
  modal: {
    backgroundColor: '#fff',
    // borderRadius: 20,
    // padding: spacing.xl,
    width: '100%',
    height:'100%',
    // maxWidth: 400,
    // position: 'relative',
    paddingLeft:20,
    paddingVertical:20,
    paddingRight:30
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    width: 36,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'#C9D2D9',
    borderRadius:6,
  },
  confetti: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  confettiText: {
    fontSize: 28,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '800',
    // textAlign: 'center',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  resignedText: {
    fontSize: 14,
    color: colors.text.secondary,
    // textAlign: 'center',
    marginBottom: spacing.md,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  playerAvatar: {
    width: 36,
    height: 35,
    // borderRadius: 30,
    borderRadius:6,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  vsText: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  vsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  namesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width:'100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
    // paddingHorizontal: spacing.md,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    // flex: 1,
    // textAlign: 'center',
  },
  heartIcon: {
    marginHorizontal: spacing.sm,
  },
  statsContainer: {
    gap: spacing.md,
  },
  statSection: {
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  statValue: {
    // flex: 1,
    alignItems: 'center',
  },
  statWord: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  statPoints: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  scoreValue: {
    fontSize: 24,
    // fontWeight: '700',
    color: 'gray',
    // flex: 1,
    textAlign: 'center',
  },
  totalScore: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    // flex: 1,
    textAlign: 'center',
  },
  winnerScore: {
    color: colors.success,
  },
  actionsContainer: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  playAgainButton: {
    // backgroundColor: colors.primary,
    backgroundColor:colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 2,
    shadowOffset: { width: 10, height: 13 },
    shadowRadius: 6,
    elevation: 6,
  },



  playAgainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },










word_style:{
  backgroundColor:'#ffe4b5',
  height:35,
  width:35,
  alignItems:'center',
  justifyContent:'center',
  borderWidth:2,
  borderRadius:6,
  borderColor:'#ffd700',
},








  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // marginVertical: 15,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E2E8',
    minWidth: 40,       // ⭐ left-right line size match ho jayega
  },
  sectionText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: 'gray',
    fontWeight: '600',
    textAlign: 'center',
  },

    sectionText1:{
       marginHorizontal: 12,
    fontSize: 14,
    color: 'black',
    fontWeight: '900',
    textAlign: 'center',
    },


});
