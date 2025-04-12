import { initializeApp } from 'firebase/app';
import {
  signInAnonymously as firebaseSignInAnonymously,
  initializeAuth,
  User,
  onAuthStateChanged,
  indexedDBLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { Room } from '../types/room';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase設定
const firebaseConfig = {
  apiKey: 'AIzaSyDJU4eEHBlvpRQe1ZjO8nLFdl2BlRz4kfs',
  authDomain: 'super-tictactoe-game.firebaseapp.com',
  projectId: 'super-tictactoe-game',
  storageBucket: 'super-tictactoe-game.firebasestorage.app',
  messagingSenderId: '129652634226',
  appId: '1:129652634226:web:3ae15ae12ffaa7384b08eb',
  measurementId: 'G-JEZDTS7SXZ',
};

// Firebaseアプリの初期化
export const app = initializeApp(firebaseConfig);

// 各種サービスの初期化
// 認証サービス
export const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence,
});
// Firestoreデータベース
export const db = getFirestore(app);

// デバイスIDをローカルストレージから取得または新規生成するための定数
const DEVICE_ID_KEY = 'super_tictactoe_device_id';

// ------------------------------------------------------------------------
// デバイスID関連の関数
// ------------------------------------------------------------------------

/**
 * デバイスIDを取得する関数
 * デバイス固有のIDがない場合は生成して保存
 * @returns デバイスID
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    // まずAsyncStorageから取得を試みる
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      return storedId;
    }

    // なければデバイス固有のIDを取得またはランダムなIDを生成
    let deviceId = '';

    if (Platform.OS === 'ios') {
      deviceId = (await Application.getIosIdForVendorAsync()) || '';
    } else if (Platform.OS === 'android') {
      deviceId = Application.getAndroidId() || '';
    }

    // デバイスIDが取得できなかった場合はランダムなIDを生成
    if (!deviceId) {
      deviceId =
        'device_' +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    }

    // 生成したIDをAsyncStorageに保存
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch (error) {
    console.error('デバイスID取得エラー:', error);
    // エラー時もランダムなIDを返すが永続化はしない
    return 'device_' + Math.random().toString(36).substring(2, 15);
  }
};

/**
 * 現在のユーザー状態（デバイスID）を取得する関数
 * @returns Promise<string | null>
 */
export const getCurrentUser = async (): Promise<{ uid: string } | null> => {
  try {
    const deviceId = await getDeviceId();
    return deviceId ? { uid: deviceId } : null;
  } catch (error) {
    console.error('ユーザー状態取得エラー:', error);
    return null;
  }
};

// 匿名認証は不要になるため、簡易版のみ残す
export const signInAnonymously = async (): Promise<{ uid: string }> => {
  const deviceId = await getDeviceId();
  return { uid: deviceId };
};

// ------------------------------------------------------------------------
// 部屋関連の関数
// ------------------------------------------------------------------------

/**
 * 部屋を作成する関数
 * @param userId ユーザーID
 * @returns 作成された部屋のID
 */
export const createRoom = async (userId: string): Promise<string> => {
  try {
    const roomId = generateRoomId();
    const roomRef = doc(db, 'rooms', roomId);

    const roomData: Omit<Room, 'id'> = {
      hostId: userId,
      guestId: null,
      status: 'waiting', // waiting, playing, finished
      currentPlayer: 'O',
      board: Array(9).fill(null),
      boardMeta: Array(9).fill(null),
      winner: null,
      moveCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(roomRef, roomData);

    return roomId;
  } catch (error) {
    console.error('部屋作成エラー:', error);
    throw error;
  }
};

/**
 * 部屋に参加する関数
 * @param roomId 部屋ID
 * @param userId ユーザーID
 * @returns 成功したかどうか
 */
export const joinRoom = async (
  roomId: string,
  userId: string
): Promise<boolean> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      console.error('部屋が存在しません');
      return false;
    }

    const roomData = roomSnap.data() as Omit<Room, 'id'>;
    console.log('data', roomData);

    if (roomData.status !== 'waiting' || roomData.guestId) {
      console.error('部屋は既に埋まっているか、参加できない状態です');
      return false;
    }

    await updateDoc(roomRef, {
      guestId: userId,
      status: 'playing',
      updatedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('部屋参加エラー:', error);
    throw error;
  }
};

/**
 * 部屋のリアルタイム監視を行う関数
 * @param roomId 部屋ID
 * @param callback コールバック関数
 * @returns unsubscribe関数
 */
export const listenToRoomUpdates = (
  roomId: string,
  callback: (data: Omit<Room, 'id'> | null) => void
) => {
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(roomRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as Omit<Room, 'id'>);
    } else {
      console.error('部屋が存在しません');
      callback(null);
    }
  });
};

/**
 * ゲーム状態を更新する関数
 * @param roomId 部屋ID
 * @param board ボード状態
 * @param boardMeta ボードメタデータ
 * @param currentPlayer 現在のプレイヤー
 * @param winner 勝者
 * @param moveCount 手数
 */
export const updateGameState = async (
  roomId: string,
  board: Array<string | null>,
  boardMeta: Array<any>,
  currentPlayer: string,
  winner: string | null,
  moveCount: number,
  status?: string
) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const updateData: any = {
      board,
      boardMeta,
      currentPlayer,
      winner,
      moveCount,
      updatedAt: new Date().toISOString(),
    };
    if (status) {
      updateData.status = status;
    }
    await updateDoc(roomRef, updateData);
  } catch (error) {
    console.error('ゲーム状態更新エラー:', error);
    throw error;
  }
};

/**
 * 部屋を削除する関数
 * @param roomId 部屋ID
 */
export const deleteRoom = async (roomId: string) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await deleteDoc(roomRef);
  } catch (error) {
    console.error('部屋削除エラー:', error);
    throw error;
  }
};

/**
 * ランダムな部屋IDを生成する関数
 * @returns 部屋ID
 */
const generateRoomId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

/**
 * 部屋のデータを取得する関数
 * @param roomId 部屋ID
 * @returns 部屋データ
 */
export const getRoomData = async (roomId: string): Promise<Room | null> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      console.error('部屋が存在しません');
      return null;
    }

    return {
      id: roomSnap.id,
      ...(roomSnap.data() as Omit<Room, 'id'>),
    };
  } catch (error) {
    console.error('部屋データ取得エラー:', error);
    throw error;
  }
};

/**
 * ユーザーがアクティブに参加している部屋を取得する関数
 * @param userId ユーザーID
 * @returns 部屋IDのリスト
 */
export const getWaitingRoomsForUser = async (
  userId: string
): Promise<string[]> => {
  try {
    const rooms: string[] = [];
    const roomsCollection = collection(db, 'rooms'); // コレクション参照を先に取得

    // ホストとして参加している 'waiting' 状態の部屋を検索
    const hostQuery = query(
      roomsCollection,
      where('hostId', '==', userId),
      where('status', '==', 'waiting')
    );
    const hostQuerySnapshot = await getDocs(hostQuery);
    hostQuerySnapshot.forEach((doc) => {
      if (!rooms.includes(doc.id)) {
        // 重複追加を避ける
        rooms.push(doc.id);
      }
    });

    // ゲストとして参加している 'waiting' 状態の部屋を検索
    const guestQuery = query(
      roomsCollection,
      where('guestId', '==', userId),
      where('status', '==', 'waiting')
    );
    const guestQuerySnapshot = await getDocs(guestQuery);
    guestQuerySnapshot.forEach((doc) => {
      if (!rooms.includes(doc.id)) {
        // 重複追加を避ける
        rooms.push(doc.id);
      }
    });
    return rooms;
  } catch (error) {
    console.error('アクティブな部屋の取得エラー:', error);
    throw error; // エラーを呼び出し元に伝える
  }
};

// App.tsx などで認証状態を監視するために onAuthStateChanged をエクスポート
export { onAuthStateChanged };
