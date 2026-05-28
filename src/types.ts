export type TournamentType = 'classic' | 'rapid';
export type TournamentMode = 'presentiel' | 'online' | 'hybride';
export type TournamentState = 'lobby' | 'playing' | 'finished';
export type RoundStatus = 'idle' | 'composing' | 'validating' | 'ended';

export interface Player {
  id: string; // socket/session ID
  username: string;
  roomCode: string;
  isArbitre: boolean;
  active: boolean;
  score: number;
  lostPoints: number;
  lastActive: number;
  roundScores: { [roundNum: number]: number }; // points gained for each round
  roundLosses: { [roundNum: number]: number }; // loss relative to TOP for each round
  roundWords: { [roundNum: number]: string };  // words played in each round
}

export interface Round {
  roundNumber: number;
  letters: string; // e.g. "AEINRTS"
  status: RoundStatus;
  timerLeft: number; // in seconds
  duration: number; // preset in seconds, e.g. 180, 120
  timerStartedAt: number | null; // Milliseconds timestamp
  topWord: string;
  topPoints: number;
  topCoords: string; // e.g., "H8" or "8H"
  topPlay: { r: number; c: number; letter: string }[]; // letters placed for top
  submissionsCount: number;
}

export interface Submission {
  playerId: string;
  username: string;
  roundNumber: number;
  word: string;
  points: number;
  coords: string; // e.g. "H8"
  validated: boolean;
  accepted: boolean; // Arbitre approved
  loss: number; // topPoints - points
  cheatingDetected?: boolean;
}

export interface BoardCell {
  letter: string | null;
  roundPlaced: number | null; // which round placed of top
  isTopLetter: boolean; // letters kept as standard top play
}

export interface MoveHistory {
  roundNumber: number;
  letters: string;
  word: string;
  points: number;
  coords: string;
  placedByArbitre: boolean;
}

export interface AuditLog {
  timestamp: number;
  message: string;
  type: 'info' | 'warning' | 'error' | 'security';
}

export interface Tournament {
  code: string; // e.g. "DR4821"
  name: string;
  arbitreName: string;
  state: TournamentState;
  type: TournamentType;
  mode: TournamentMode;
  timerDuration: number; // 60, 90, 120, 180
  maxPlayers: number;
  locked: boolean;
  currentRoundNumber: number;
  rounds: { [num: number]: Round };
  players: { [id: string]: Player };
  submissions: { [roundNum: number]: { [playerId: string]: Submission } };
  boardState: BoardCell[][]; // 15x15 grid of the official board
  moveHistory: MoveHistory[];
  auditLogs: AuditLog[];
  tileBag?: { letter: string; count: number }[]; // optional remaining tile frequencies in the bag
  drawMode?: 'auto' | 'manual';
}

export interface ODSValidationResponse {
  word: string;
  isValid: boolean;
  definition?: string;
}
