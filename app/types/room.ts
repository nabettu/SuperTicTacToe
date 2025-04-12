import { Player, PieceMeta } from '.';

export interface Room {
  id: string;
  hostId: string;
  guestId: string | null;
  status: 'waiting' | 'playing' | 'finished';
  currentPlayer: Player;
  board: Array<Player | null>;
  boardMeta: Array<PieceMeta | null>;
  winner: Player | 'draw' | null;
  moveCount: number;
  createdAt: string;
  updatedAt: string;
}
