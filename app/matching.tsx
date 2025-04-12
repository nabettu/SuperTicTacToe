import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  createRoom,
  joinRoom,
  listenToRoomUpdates,
  getWaitingRoomsForUser,
  getRoomData,
  getCurrentUser,
  updateGameState,
} from './utils/firebase';

export default function MatchingScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [activeRooms, setActiveRooms] = useState<string[]>([]);

  // コンポーネントマウント時にデバイスID取得
  useEffect(() => {
    const initializeDevice = async () => {
      try {
        setIsLoading(true);

        // デバイスIDを取得
        const user = await getCurrentUser();
        console.log('デバイスID', user);

        if (user) {
          setUserId(user.uid);
          setIsLoggedIn(true);

          // ログイン後にアクティブな部屋があるか確認
          checkForActiveRooms(user.uid);
        } else {
          throw new Error('デバイスIDの取得に失敗しました');
        }
      } catch (error) {
        console.error('初期化エラー:', error);
        Alert.alert(
          'エラー',
          'デバイスIDの取得に失敗しました。もう一度お試しください。'
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeDevice();
  }, []);

  // アクティブな部屋があるか確認
  const checkForActiveRooms = async (uid: string) => {
    try {
      const rooms = await getWaitingRoomsForUser(uid);
      setActiveRooms(rooms);

      if (rooms.length > 0) {
        // アクティブな部屋が見つかった場合、最初の部屋を選択
        const activeRoomId = rooms[0];
        setRoomId(activeRoomId);

        // 部屋の情報を取得して役割（host/guest）を確認
        const roomData = await getRoomData(activeRoomId);

        if (roomData) {
          const role = roomData.hostId === uid ? 'host' : 'guest';
          // 既存の部屋に接続
          router.replace(
            `/game?mode=online&roomId=${activeRoomId}&role=${role}`
          );
        }
      }
    } catch (error) {
      console.error('部屋の確認エラー:', error);
    }
  };

  // 部屋を作成する
  const handleCreateRoom = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const newRoomId = await createRoom(userId);
      setRoomId(newRoomId);
      setIsJoining(true);

      // 部屋のデータ変更を監視
      listenToRoomUpdates(newRoomId, (roomData) => {
        if (roomData && roomData.guestId) {
          setOpponentJoined(true);

          // ゲーム画面に遷移
          router.push(`/game?mode=online&roomId=${newRoomId}&role=host`);
        }
      });
    } catch (error) {
      console.error('部屋作成エラー:', error);
      Alert.alert(
        'エラー',
        '部屋の作成に失敗しました。もう一度お試しください。'
      );
      setIsLoading(false);
    }
  };

  // 部屋に参加する
  const handleJoinRoom = async () => {
    if (!userId || !roomId) return;

    try {
      setIsLoading(true);
      const success = await joinRoom(roomId, userId);

      if (success) {
        // 参加成功したらゲーム画面に遷移
        router.push(`/game?mode=online&roomId=${roomId}&role=guest`);
      } else {
        Alert.alert(
          'エラー',
          '部屋への参加に失敗しました。部屋IDを確認してください。'
        );
        setIsLoading(false);
      }
    } catch (error) {
      console.error('部屋参加エラー:', error);
      Alert.alert(
        'エラー',
        '部屋への参加に失敗しました。もう一度お試しください。'
      );
      setIsLoading(false);
    }
  };

  // 待機画面
  const renderWaitingScreen = () => {
    return (
      <View style={styles.waitingContainer}>
        <Text style={styles.waitingTitle}>対戦相手を待っています...</Text>
        <ActivityIndicator
          size="large"
          color="#0ff"
          style={styles.waitingSpinner}
        />

        <View style={styles.roomIdContainer}>
          <Text style={styles.roomIdLabel}>部屋ID:</Text>
          <Text style={styles.roomIdText}>{roomId}</Text>
          <Text style={styles.roomIdHint}>
            この部屋IDを友達に教えてください
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => {
            setIsJoining(false);
            setIsLoading(false);
            // 監視をクリーンアップする処理を追加（utils/firebaseに実装必要）
            if (roomId) {
              // 監視を停止する関数を呼び出す
            }
          }}
        >
          <Text style={styles.buttonText}>キャンセル</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ローディング表示
  if (isLoading && !isJoining) {
    return (
      <LinearGradient colors={['#000420', '#000000']} style={styles.container}>
        <ActivityIndicator size="large" color="#0ff" />
        <Text style={styles.loadingText}>ログイン中...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000420', '#000000']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#0ff" />
        </TouchableOpacity>
        <Text style={styles.title}>オンライン対戦</Text>
      </View>

      {userId && (
        <View style={styles.userIdContainer}>
          <Text style={styles.userIdLabel}>あなたのID:</Text>
          <Text style={styles.userIdText}>{userId}</Text>
        </View>
      )}

      <View style={styles.content}>
        {isLoggedIn ? (
          isJoining ? (
            renderWaitingScreen()
          ) : (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={handleCreateRoom}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#0ff" />
                ) : (
                  <Text style={styles.buttonText}>部屋を作る</Text>
                )}
              </TouchableOpacity>

              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>または</Text>
                <View style={styles.separatorLine} />
              </View>

              <View style={styles.joinContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="部屋IDを入力"
                  placeholderTextColor="#555"
                  value={roomId}
                  onChangeText={setRoomId}
                />
                <TouchableOpacity
                  style={[styles.button, !roomId && styles.buttonDisabled]}
                  onPress={handleJoinRoom}
                  disabled={!roomId || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#0ff" />
                  ) : (
                    <Text style={styles.buttonText}>部屋に入る</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )
        ) : (
          <Text style={styles.loadingText}>ログイン中...</Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 24,
    color: '#0ff',
    marginLeft: 10,
    textShadowColor: '#0ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ff',
    minWidth: 250,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
    borderColor: '#555',
  },
  buttonText: {
    fontFamily: 'Orbitron-Regular',
    color: '#0ff',
    fontSize: 18,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
    width: '80%',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#444',
  },
  separatorText: {
    color: '#888',
    paddingHorizontal: 10,
  },
  joinContainer: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    color: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    width: '80%',
    fontFamily: 'Orbitron-Regular',
  },
  loadingText: {
    color: '#0ff',
    marginTop: 10,
    fontFamily: 'Orbitron-Regular',
  },
  waitingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  waitingTitle: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    color: '#0ff',
    marginBottom: 30,
    textAlign: 'center',
  },
  waitingSpinner: {
    marginBottom: 30,
  },
  roomIdContainer: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0ff',
    alignItems: 'center',
    marginBottom: 30,
    width: '80%',
  },
  roomIdLabel: {
    color: '#888',
    marginBottom: 5,
  },
  roomIdText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 24,
    color: '#0ff',
    letterSpacing: 2,
    marginVertical: 10,
  },
  roomIdHint: {
    color: '#888',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: '#f55',
    marginTop: 20,
  },
  userIdContainer: {
    backgroundColor: 'rgba(0, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ff',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
    width: '80%',
  },
  userIdLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  userIdText: {
    fontFamily: 'Orbitron-Regular',
    fontSize: 14,
    color: '#0ff',
    letterSpacing: 1,
  },
});
