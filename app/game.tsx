import { useEffect, useState } from 'react';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Player, Board, PieceMeta, CpuLevel } from './types';
import { getCpuMove } from './utils/cpuStrategy';
import { listenToRoomUpdates, updateGameState } from './utils/firebase';

// ユーティリティ関数：指定されたミリ秒待機する Promise を返す
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// CPUレベルの日本語表示用
const cpuLevelText = {
  easy: 'かんたん',
  normal: 'ふつう',
  hard: 'むずかしい',
};

// ユーティリティ関数を修正
const renderPlayerIcon = (
  player: Player | null,
  size: number = 24,
  color: string = '#0ff'
) => {
  if (Platform.OS === 'web') {
    // Webではテキストに置き換え（シャドウ付き）
    const webStyle = {
      color: color,
      fontSize: size,
      fontWeight: 'bold' as const,
      fontFamily: 'monospace',
    };

    // @ts-ignore: テキストシャドウはWebのみで有効
    if (Platform.OS === 'web') {
      // @ts-ignore: Web用のスタイル
      webStyle.textShadow = `0 0 10px ${color}`;
    }

    return (
      <Text style={webStyle}>
        {player === 'O' ? '○' : player === 'X' ? '×' : ''}
      </Text>
    );
  }

  if (player === 'O') {
    return (
      <View style={styles.iconShadow}>
        <Ionicons name="ellipse-outline" size={size} color={color} />
      </View>
    );
  } else if (player === 'X') {
    return (
      <View style={styles.iconShadow}>
        <Ionicons name="close" size={size} color={color} />
      </View>
    );
  }
  return null;
};

export default function GameScreen() {
  const router = useRouter();
  const { mode, level, roomId, role } = useLocalSearchParams<{
    mode: string;
    level: CpuLevel;
    roomId: string;
    role: string;
  }>();
  const cpuLevel = (level as CpuLevel) || 'normal';
  const isOnlineMode = mode === 'online';
  const isHost = role === 'host';

  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [boardMeta, setBoardMeta] = useState<PieceMeta[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('O');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [fadingPieceIndex, setFadingPieceIndex] = useState<number | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState<boolean>(false);
  const [opponentDisconnected, setOpponentDisconnected] =
    useState<boolean>(false);

  // オンラインモードの自分のプレイヤー種別を設定
  const myPlayer: Player | null = isOnlineMode ? (isHost ? 'O' : 'X') : null;

  const checkWinner = (squares: Board): Player | 'draw' | null => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    for (const [a, b, c] of lines) {
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return squares[a] as Player;
      }
    }

    if (squares.every((square) => square !== null)) {
      return 'draw';
    }

    return null;
  };

  const countPlayerPieces = (player: Player) => {
    return boardMeta.filter((meta) => meta?.player === player).length;
  };

  const getOldestPieceIndex = (player: Player) => {
    let oldestMoveOrder = Infinity;
    let oldestIndex = -1;

    boardMeta.forEach((meta, index) => {
      if (meta?.player === player && meta.moveOrder < oldestMoveOrder) {
        oldestMoveOrder = meta.moveOrder;
        oldestIndex = index;
      }
    });

    return oldestIndex;
  };

  useEffect(() => {
    const playerPieceCount = countPlayerPieces(currentPlayer);
    if (playerPieceCount >= 3 && !winner) {
      const oldestPieceIndex = getOldestPieceIndex(currentPlayer);
      if (oldestPieceIndex !== -1) {
        setFadingPieceIndex(oldestPieceIndex);
      }
    } else {
      setFadingPieceIndex(null);
    }
  }, [currentPlayer, winner]);

  // オンラインモード用の部屋状態同期
  useEffect(() => {
    if (isOnlineMode && roomId) {
      // 最初はホストがマッチング待ちの状態に
      if (isHost) {
        setWaitingForOpponent(true);

        // 対戦開始時にランダムで先攻を決定
        const isFirstPlayerRandom = Math.random() >= 0.5 ? 'O' : 'X';
        setCurrentPlayer(isFirstPlayerRandom);
      }

      // 部屋の状態変化を監視
      const unsubscribe = listenToRoomUpdates(roomId, (roomData) => {
        if (!roomData) return;

        // 対戦相手がいない場合（ゲストの場合は起こらない）
        if (isHost && !roomData.guestId) {
          setWaitingForOpponent(true);
          return;
        }

        // 対戦相手が見つかった
        if (isHost && roomData.guestId && waitingForOpponent) {
          setWaitingForOpponent(false);

          // 対戦開始時の状態をFirebaseに保存
          updateGameState(
            roomId,
            board,
            boardMeta,
            currentPlayer,
            null,
            moveCount
          );
        }

        // ゲーム状態の同期
        if (roomData.status === 'playing') {
          setBoard(roomData.board);
          setBoardMeta(roomData.boardMeta);
          setCurrentPlayer(roomData.currentPlayer);
          setWinner(roomData.winner);
          setMoveCount(roomData.moveCount);
        }
      });

      // クリーンアップ関数
      return () => {
        unsubscribe();
      };
    }
  }, [isOnlineMode, roomId, isHost]);

  // 手を指す処理
  const makeMove = async (index: number) => {
    // オンラインモードで自分のターンでない場合は何もしない
    if (isOnlineMode && currentPlayer !== myPlayer) return;

    // すでにコマがある場所、または勝敗が決まっている場合は何もしない
    if (board[index] || winner) return;

    const playerPieceCount = countPlayerPieces(currentPlayer);
    const newBoard = [...board];
    const newBoardMeta = [...boardMeta];

    if (playerPieceCount >= 3) {
      const oldestPieceIndex = getOldestPieceIndex(currentPlayer);
      if (oldestPieceIndex === -1) return;

      newBoard[oldestPieceIndex] = null;
      newBoardMeta[oldestPieceIndex] = null;
    }

    newBoard[index] = currentPlayer;
    newBoardMeta[index] = { player: currentPlayer, moveOrder: moveCount };

    // ローカル状態の更新
    setBoard(newBoard);
    setBoardMeta(newBoardMeta);
    setMoveCount(moveCount + 1);
    setFadingPieceIndex(null);

    const newWinner = checkWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);

      // オンラインモードの場合、勝敗結果をFirebaseに保存
      if (isOnlineMode && roomId) {
        await updateGameState(
          roomId,
          newBoard,
          newBoardMeta,
          currentPlayer,
          newWinner,
          moveCount + 1
        );
      }
      return;
    }

    const nextPlayer = currentPlayer === 'O' ? 'X' : 'O';
    setCurrentPlayer(nextPlayer);

    // オンラインモードの場合、状態をFirebaseに保存
    if (isOnlineMode && roomId) {
      await updateGameState(
        roomId,
        newBoard,
        newBoardMeta,
        nextPlayer,
        null,
        moveCount + 1
      );
    }
  };

  useEffect(() => {
    // async 関数を定義して即時実行
    const makeCpuMove = async () => {
      if (mode === 'cpu' && currentPlayer === 'X' && !winner) {
        // sleep 関数を使って待機
        await sleep(500);

        const cpuMoveIndex = getCpuMove(board, boardMeta, cpuLevel);
        if (cpuMoveIndex !== -1) {
          makeMove(cpuMoveIndex);
        }
      }
    };

    makeCpuMove();
  }, [currentPlayer, mode]);

  const getPlayerColor = (player: Player | null) => {
    if (player === 'O') return '#00ff00';
    if (player === 'X') return '#ffff00';
    return '#0ff';
  };

  const getTurnText = () => {
    if (winner === 'draw') {
      return '引き分け!';
    } else if (winner) {
      return (
        <View style={styles.winnerContainer}>
          {renderPlayerIcon(winner, 28, getPlayerColor(winner))}
          <Text style={[styles.turnText, { color: getPlayerColor(winner) }]}>
            の勝利!
          </Text>
        </View>
      );
    }

    if (mode === 'cpu') {
      return (
        <View style={styles.turnContainer}>
          {currentPlayer === 'O' ? (
            <>
              <Text
                style={[
                  styles.turnText,
                  { color: getPlayerColor(currentPlayer) },
                ]}
              >
                あなた
              </Text>
              {renderPlayerIcon(
                currentPlayer,
                28,
                getPlayerColor(currentPlayer)
              )}
              <Text
                style={[
                  styles.turnText,
                  { color: getPlayerColor(currentPlayer) },
                ]}
              >
                のターン
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.turnText,
                  { color: getPlayerColor(currentPlayer) },
                ]}
              >
                CPU
              </Text>
              {renderPlayerIcon(
                currentPlayer,
                28,
                getPlayerColor(currentPlayer)
              )}
              <Text
                style={[
                  styles.turnText,
                  { color: getPlayerColor(currentPlayer) },
                ]}
              >
                のターン
              </Text>
            </>
          )}
        </View>
      );
    }

    // オンラインモードのターン表示を修正
    if (isOnlineMode) {
      const isMyTurn = currentPlayer === myPlayer;
      return (
        <View style={styles.turnContainer}>
          <Text
            style={[styles.turnText, { color: getPlayerColor(currentPlayer) }]}
          >
            {isMyTurn ? 'あなた' : '相手'}
          </Text>
          {renderPlayerIcon(currentPlayer, 28, getPlayerColor(currentPlayer))}
          <Text
            style={[styles.turnText, { color: getPlayerColor(currentPlayer) }]}
          >
            のターン
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.turnContainer}>
        {renderPlayerIcon(currentPlayer, 28, getPlayerColor(currentPlayer))}
        <Text
          style={[styles.turnText, { color: getPlayerColor(currentPlayer) }]}
        >
          のターン
        </Text>
      </View>
    );
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setBoardMeta(Array(9).fill(null));
    setCurrentPlayer('O');
    setWinner(null);
    setMoveCount(0);
    setFadingPieceIndex(null);
    if (isOnlineMode && roomId) {
      updateGameState(
        roomId,
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        'X',
        null,
        0
      );
    }
  };

  const renderPlayerSymbol = (player: Player | null) => {
    if (!player) return null;

    if (player === 'O') {
      return renderPlayerIcon(player, 40, getPlayerColor(player));
    } else {
      return renderPlayerIcon(player, 48, getPlayerColor(player));
    }
  };

  return (
    <LinearGradient colors={['#000420', '#000000']} style={styles.container}>
      <View style={styles.header}>{getTurnText()}</View>

      <View style={styles.board}>
        {board.map((cell, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.cell,
              fadingPieceIndex === index && { opacity: 0.5 },
            ]}
            onPress={() => makeMove(index)}
          >
            {renderPlayerSymbol(cell)}
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'cpu' && (
        <View style={styles.levelContainer}>
          <Text style={styles.levelText}>
            CPU レベル：{cpuLevelText[cpuLevel]}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {/* オンラインモードでは勝敗が決まった場合のみリセットボタンを表示する、さらにホストだけに表示 */}
        {(mode !== 'online' || (winner && isHost)) && (
          <TouchableOpacity style={styles.button} onPress={resetGame}>
            <Text style={styles.buttonText}>リセット</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/')}
        >
          <Text style={styles.buttonText}>タイトルへ</Text>
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
  header: {
    marginBottom: 40,
  },
  turnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turnText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 24,
    textShadowColor: '#0ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  board: {
    width: 300,
    height: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: '#0ff',
  },
  cell: {
    width: '33.33%',
    height: '33.33%',
    borderWidth: 1,
    borderColor: '#0ff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
  },
  cellText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 40,
  },
  levelContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  levelText: {
    fontFamily: 'Orbitron-Regular',
    color: '#0ff',
    fontSize: 16,
    textShadowColor: '#0ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  button: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ff',
  },
  buttonText: {
    fontFamily: 'Orbitron-Regular',
    color: '#0ff',
    fontSize: 16,
  },
  iconShadow: {
    shadowColor: '#0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5, // Androidでの対応
  },
});
