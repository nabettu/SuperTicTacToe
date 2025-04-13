import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import HowToPlayModal from './components/HowToPlayModal';
import { checkIfFirstLaunch } from './utils/storage';

export default function TitleScreen() {
  const router = useRouter();
  const [howToPlayVisible, setHowToPlayVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('normal');

  // 初回起動時の処理
  useEffect(() => {
    const checkFirstLaunch = async () => {
      const isFirstLaunch = await checkIfFirstLaunch();
      if (isFirstLaunch) {
        setHowToPlayVisible(true);
      }
    };

    checkFirstLaunch();
  }, []);

  const handleCpuGame = () => {
    router.push(`/game?mode=cpu&level=${selectedLevel}`);
  };

  return (
    <LinearGradient colors={['#000420', '#000000']} style={styles.container}>
      {/* 遊び方モーダル */}
      <HowToPlayModal
        visible={howToPlayVisible}
        onClose={() => setHowToPlayVisible(false)}
      />

      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Super</Text>
        <View style={styles.iconContainer}>
          <Ionicons
            name="ellipse-outline"
            size={36}
            color="#0ff"
            style={styles.icon}
          />
          <Ionicons name="close" size={44} color="#0ff" style={styles.icon} />
        </View>
        <Text style={styles.titleText}>Game</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleCpuGame}>
          <Ionicons
            name="laptop-outline"
            size={20}
            color="#0ff"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>CPU対戦</Text>
        </TouchableOpacity>

        <View style={styles.levelButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.levelButton,
              selectedLevel === 'easy' && styles.selectedLevelButton,
            ]}
            onPress={() => setSelectedLevel('easy')}
          >
            <Text
              style={[
                styles.levelButtonText,
                selectedLevel === 'easy' && styles.selectedLevelButtonText,
              ]}
            >
              EASY
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.levelButton,
              selectedLevel === 'normal' && styles.selectedLevelButton,
            ]}
            onPress={() => setSelectedLevel('normal')}
          >
            <Text
              style={[
                styles.levelButtonText,
                selectedLevel === 'normal' && styles.selectedLevelButtonText,
              ]}
            >
              NORMAL
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.levelButton,
              selectedLevel === 'hard' && styles.selectedLevelButton,
            ]}
            onPress={() => setSelectedLevel('hard')}
          >
            <Text
              style={[
                styles.levelButtonText,
                selectedLevel === 'hard' && styles.selectedLevelButtonText,
              ]}
            >
              HARD
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionLabelContainer}>
          <Text style={styles.sectionLabelText}>対人戦</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/game?mode=local')}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color="#0ff"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>ローカル対戦</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/matching' as any)}
        >
          <Ionicons
            name="globe-outline"
            size={20}
            color="#0ff"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>オンライン対戦</Text>
        </TouchableOpacity>
      </View>

      {/* 遊び方ボタン（右下固定） */}
      <TouchableOpacity
        style={styles.helpButton}
        onPress={() => setHowToPlayVisible(true)}
      >
        <Ionicons name="help" size={24} color="#0ff" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  titleText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 32,
    color: '#0ff',
    textShadowColor: '#0ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  icon: {
    textShadowColor: '#0ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  buttonContainer: {
    gap: 20,
  },
  button: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 15,
  },
  levelButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#0ff',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedLevelButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    borderColor: '#0ff',
    borderWidth: 2,
  },
  levelButtonText: {
    fontFamily: 'Orbitron-Regular',
    color: '#0ff',
    fontSize: 14,
  },
  selectedLevelButtonText: {
    fontWeight: 'bold',
  },
  howToPlayButton: {
    marginTop: 20,
    backgroundColor: 'rgba(0, 128, 255, 0.1)',
  },
  onlineButton: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
  },
  buttonText: {
    fontFamily: 'Orbitron-Regular',
    color: '#0ff',
    fontSize: 18,
  },
  buttonIcon: {
    marginRight: 10,
  },
  sectionLabelContainer: {
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 255, 0.3)',
    paddingBottom: 5,
    width: '100%',
  },
  sectionLabelText: {
    fontFamily: 'Orbitron-Regular',
    color: '#0ff',
    fontSize: 16,
    textAlign: 'center',
  },
  helpButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 128, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#0ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});
