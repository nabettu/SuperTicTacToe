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
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/game?mode=cpu&level=easy')}
        >
          <Text style={styles.buttonText}>CPU対戦（かんたん）</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/game?mode=cpu&level=normal')}
        >
          <Text style={styles.buttonText}>CPU対戦（ふつう）</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/game?mode=cpu&level=hard')}
        >
          <Text style={styles.buttonText}>CPU対戦（むずかしい）</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/game?mode=local')}
        >
          <Text style={styles.buttonText}>ローカル対戦</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.howToPlayButton]}
          onPress={() => setHowToPlayVisible(true)}
        >
          <Text style={styles.buttonText}>遊び方</Text>
        </TouchableOpacity>
      </View>
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
  },
  howToPlayButton: {
    marginTop: 20,
    backgroundColor: 'rgba(0, 128, 255, 0.1)',
  },
  buttonText: {
    fontFamily: 'Orbitron-Regular',
    color: '#0ff',
    fontSize: 18,
  },
});
