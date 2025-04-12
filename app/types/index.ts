/**
 * プレイヤーを表す型
 * O: 先手（通常はプレイヤー）
 * X: 後手（CPUモードの場合はCPU）
 */
export type Player = 'O' | 'X';

/**
 * ゲームのボードを表す型
 * null: 空のマス
 * Player: プレイヤーのコマが置かれているマス
 */
export type Board = (Player | null)[];

/**
 * ボードのメタデータを表す型
 * player: どのプレイヤーのコマか
 * moveOrder: コマが置かれた順番
 */
export type PieceMeta = { player: Player; moveOrder: number } | null;

/**
 * CPUの難易度レベル
 */
export type CpuLevel = 'easy' | 'normal' | 'hard';
