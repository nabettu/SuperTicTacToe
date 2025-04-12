import { Player, Board, PieceMeta, CpuLevel } from '../types';

/**
 * CPUの次の手を決定する関数 - レベルに応じた戦略を選択
 * @param currentBoard 現在のボード状態
 * @param currentMeta 現在のボードのメタデータ
 * @param level CPU難易度
 * @returns 次に置くマスのインデックス（有効な手がない場合は-1）
 */
export const getCpuMove = (
  currentBoard: Board,
  currentMeta: PieceMeta[],
  level: CpuLevel = 'normal'
): number => {
  // レベルに応じた戦略を選択
  switch (level) {
    case 'easy':
      return getRandomMove(currentBoard);
    case 'normal':
      // 70%の確率で賢い手を、30%の確率でランダムな手を選ぶ
      return Math.random() < 0.7
        ? getSmartMove(currentBoard, currentMeta)
        : getRandomMove(currentBoard);
    case 'hard':
      return getSmartMove(currentBoard, currentMeta);
    default:
      return getRandomMove(currentBoard);
  }
};

/**
 * ランダムな手を選ぶ（簡単レベル）
 */
const getRandomMove = (currentBoard: Board): number => {
  const availableSpots = currentBoard
    .map((spot: Player | null, index: number) => (spot === null ? index : -1))
    .filter((index: number) => index !== -1);

  if (availableSpots.length === 0) return -1;

  return availableSpots[Math.floor(Math.random() * availableSpots.length)];
};

/**
 * 自分の駒の中で一番古い駒のインデックスを取得
 */
const getOldestPieceIndex = (
  player: Player,
  boardMeta: PieceMeta[]
): number => {
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

/**
 * プレイヤーの駒の数をカウント
 */
const countPlayerPieces = (player: Player, boardMeta: PieceMeta[]): number => {
  return boardMeta.filter((meta) => meta?.player === player).length;
};

/**
 * 賢い手を選ぶ（通常/難しいレベル）
 * - 勝てる手があればその手を選ぶ（ただし自分の一番古い駒が消えることを考慮）
 * - 相手が次のターンで勝てる手があればブロックする
 * - 中央を優先
 * - 角を次に優先
 * - それ以外はランダム
 */
const getSmartMove = (
  currentBoard: Board,
  currentMeta: PieceMeta[]
): number => {
  const cpuPlayer = 'X';
  const humanPlayer = 'O';
  const cpuPieceCount = countPlayerPieces(cpuPlayer, currentMeta);
  const oldestCpuPieceIndex =
    cpuPieceCount >= 3 ? getOldestPieceIndex(cpuPlayer, currentMeta) : -1;

  // 自分が３つ以上コマを持っているか確認（次のターンで一番古いコマが消える）
  if (cpuPieceCount >= 3 && oldestCpuPieceIndex !== -1) {
    // 消える駒を考慮した勝利手を探す（一番古い駒が消えても勝てる手）
    const simulatedBoard = [...currentBoard];
    simulatedBoard[oldestCpuPieceIndex] = null; // 一番古い駒が消えたと仮定

    // 一番古い駒が消えた状態でも勝てる手があればそれを選択
    const winningMoveConsideringRemoval = findWinningMove(
      simulatedBoard,
      cpuPlayer
    );
    if (winningMoveConsideringRemoval !== -1) {
      return winningMoveConsideringRemoval;
    }
  } else {
    // 3つ未満の場合は通常の勝利手を探す
    const winningMove = findWinningMove(currentBoard, cpuPlayer);
    if (winningMove !== -1) return winningMove;
  }

  // 相手のターンで、相手の一番古い駒が消えるかを考慮してブロック
  const humanPieceCount = countPlayerPieces(humanPlayer, currentMeta);
  const oldestHumanPieceIndex =
    humanPieceCount >= 3 ? getOldestPieceIndex(humanPlayer, currentMeta) : -1;

  if (humanPieceCount >= 3 && oldestHumanPieceIndex !== -1) {
    // 相手の一番古い駒が消えると仮定したボード
    const simulatedBoard = [...currentBoard];
    simulatedBoard[oldestHumanPieceIndex] = null;

    // その状態で相手が勝てる手があればブロック
    const blockingMoveConsideringRemoval = findWinningMove(
      simulatedBoard,
      humanPlayer
    );
    if (blockingMoveConsideringRemoval !== -1) {
      return blockingMoveConsideringRemoval;
    }
  }

  // 通常のブロック手を探す
  const blockingMove = findWinningMove(currentBoard, humanPlayer);
  if (blockingMove !== -1) return blockingMove;

  // 中央が空いていれば中央を選ぶ
  if (currentBoard[4] === null) return 4;

  // 角が空いていれば角を選ぶ
  const corners = [0, 2, 6, 8].filter((i) => currentBoard[i] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // それ以外の場合はランダムな手を選ぶ
  return getRandomMove(currentBoard);
};

/**
 * 指定したプレイヤーが勝てる手を探す
 */
const findWinningMove = (currentBoard: Board, player: Player): number => {
  // 勝利パターン
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // 横
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // 縦
    [0, 4, 8],
    [2, 4, 6], // 斜め
  ];

  // 各ラインをチェック
  for (const [a, b, c] of lines) {
    // 2つが自分の駒で1つが空の場合、その空のマスを選ぶ
    const boardValues = [currentBoard[a], currentBoard[b], currentBoard[c]];
    const playerCount = boardValues.filter((v) => v === player).length;
    const nullCount = boardValues.filter((v) => v === null).length;

    if (playerCount === 2 && nullCount === 1) {
      // 空いているマスを返す
      if (currentBoard[a] === null) return a;
      if (currentBoard[b] === null) return b;
      return c;
    }
  }

  return -1;
};
