import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function TitleScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#000420', '#000000']} style={styles.container}>
      <Text style={styles.title}>スーパーマルバツゲーム</Text>
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
  title: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 32,
    color: '#0ff',
    textShadowColor: '#0ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 60,
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
  buttonText: {
    fontFamily: 'Orbitron-Regular',
    color: '#0ff',
    fontSize: 18,
  },
});
