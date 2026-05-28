import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  validateWordODS9, 
  drawScrabbleLetters, 
  scorePlacedWord, 
  FRENCH_TILE_BAG, 
  ALPHABET, 
  parseCoordinates,
  solveTopPlay,
  setOds9Dictionary
} from './src/scrabble.js';
import { Tournament, Player, Round, Submission, BoardCell, MoveHistory } from './src/types.js';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Supabase Configuration using local environment variables and robust sanitization
function sanitizeSupabaseConfig(url: string, key: string) {
  let cleanUrl = (url || '').trim();
  let cleanKey = (key || '').trim();

  // Remove surrounding quotes (both single and double)
  if (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) {
    cleanUrl = cleanUrl.slice(1, -1);
  }
  if (cleanUrl.startsWith("'") && cleanUrl.endsWith("'")) {
    cleanUrl = cleanUrl.slice(1, -1);
  }
  if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
    cleanKey = cleanKey.slice(1, -1);
  }
  if (cleanKey.startsWith("'") && cleanKey.endsWith("'")) {
    cleanKey = cleanKey.slice(1, -1);
  }

  cleanUrl = cleanUrl.trim();
  cleanKey = cleanKey.trim();

  // Strip trailing slashes
  cleanUrl = cleanUrl.replace(/\/+$/, '');

  // Extract only the origin to prevent duplicate path segments like "/rest/v1" or similar
  if (cleanUrl) {
    try {
      if (cleanUrl.includes('://')) {
        const parsed = new URL(cleanUrl);
        cleanUrl = parsed.origin;
      }
    } catch {
      cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '');
    }
  }

  return { cleanUrl, cleanKey };
}

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const { cleanUrl: supabaseUrl, cleanKey: supabaseAnonKey } = sanitizeSupabaseConfig(rawSupabaseUrl, rawSupabaseAnonKey);

const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// In-memory local cache mirroring Supabase state for instant performance and polling responses
const tournaments: { [code: string]: Tournament } = {};

// Fallback flag to prevent continuous errors when Supabase table does not yet exist
let isTournamentsTableMissing = false;

// Helper to save tournament state to Supabase
async function saveTournament(t: Tournament) {
  if (!supabase || isTournamentsTableMissing) return;
  try {
    const { error } = await supabase
      .from('tournaments')
      .upsert({
        code: t.code,
        name: t.name,
        state: t.state,
        data: t,
        updated_at: new Date().toISOString()
      });
    if (error) {
      if (
        error.message.includes("Could not find the table") || 
        error.message.includes("does not exist") || 
        error.code === 'PGRST116' ||
        error.code === '42P01'
      ) {
        isTournamentsTableMissing = true;
        console.warn(`[Supabase Status] La table 'public.tournaments' n'est pas configurée dans la base de données. DupliRoom bascule en mode persistant mémoire local de manière transparente.`);
      } else {
        console.error(`[Supabase Error] failed to save tournament ${t.code}:`, error.message);
      }
    }
  } catch (err) {
    console.error(`[Supabase Exception] Failed to save tournament ${t.code}:`, err);
  }
}

// Helper to load tournament state from Supabase first, caching in memory
async function loadTournament(code: string): Promise<Tournament | null> {
  const upperCode = code.toUpperCase().trim();
  if (tournaments[upperCode]) {
    return tournaments[upperCode];
  }
  if (!supabase || isTournamentsTableMissing) return null;
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('data')
      .eq('code', upperCode)
      .maybeSingle();

    if (error) {
      if (
        error.message.includes("Could not find the table") || 
        error.message.includes("does not exist") || 
        error.code === 'PGRST116' ||
        error.code === '42P01'
      ) {
        isTournamentsTableMissing = true;
        console.warn(`[Supabase Status] La table 'public.tournaments' n'est pas configurée dans la base de données. DupliRoom bascule en mode persistant mémoire local de manière transparente.`);
      } else {
        console.error(`[Supabase Error] failed to load tournament ${upperCode}:`, error.message);
      }
      return null;
    }
    if (data && data.data) {
      const t = data.data as Tournament;
      tournaments[upperCode] = t;
      return t;
    }
  } catch (err) {
    console.error(`[Supabase Exception] Failed to load tournament ${upperCode}:`, err);
  }
  return null;
}

// Helper to construct empty 15x15 board
function createEmptyBoard(): BoardCell[][] {
  const board: BoardCell[][] = [];
  for (let r = 0; r < 15; r++) {
    const row: BoardCell[] = [];
    for (let c = 0; c < 15; c++) {
      row.push({
        letter: null,
        roundPlaced: null,
        isTopLetter: false
      });
    }
    board.push(row);
  }
  return board;
}

// Generate code DR-XXXX
function generateRoomCode(): string {
  let code = '';
  do {
    const digits = Math.floor(1000 + Math.random() * 9000);
    code = `DR-${digits}`;
  } while (tournaments[code]);
  return code;
}

// Bootstrap a mock demo tournament representing Sprint 4 so the app has instant, engaging demo data!
function bootstrapDemoTournament() {
  const code = 'DR-4821';
  const board = createEmptyBoard();
  
  // Placement of some initial words on demo board (e.g., SCRABBLE at center, TRAINES elsewhere)
  // Let's place "SCRABBLE" horizontally at Row 7 (H), starting at Col 3 (D) to Col 10 (K)
  const scrabbleWord = 'SCRABBLE';
  for (let i = 0; i < scrabbleWord.length; i++) {
    board[7][3 + i] = {
      letter: scrabbleWord[i],
      roundPlaced: 1,
      isTopLetter: true
    };
  }

  // "TRAINES" vertically at Col 7 (H), starting at Row 2 (3) to Row 8 (9)
  const trainesWord = 'TRAINES';
  for (let i = 0; i < trainesWord.length; i++) {
    board[2 + i][7] = {
      letter: trainesWord[i],
      roundPlaced: 2,
      isTopLetter: true
    };
  }

  const demoTourney: Tournament = {
    code,
    name: 'Championnat Grand Est',
    tileBag: JSON.parse(JSON.stringify(FRENCH_TILE_BAG)),
    arbitreName: 'Serge (Arbitre)',
    state: 'playing',
    type: 'classic',
    mode: 'hybride',
    timerDuration: 120,
    maxPlayers: 10,
    locked: false,
    currentRoundNumber: 3,
    rounds: {
      1: {
        roundNumber: 1,
        letters: 'ABCEKLR',
        status: 'ended',
        timerLeft: 0,
        duration: 120,
        timerStartedAt: null,
        topWord: 'SCRABBLE',
        topPoints: 50,
        topCoords: 'D8',
        topPlay: scrabbleWord.split('').map((l, i) => ({ r: 7, c: 3 + i, letter: l })),
        submissionsCount: 3
      },
      2: {
        roundNumber: 2,
        letters: 'AEINRTS',
        status: 'ended',
        timerLeft: 0,
        duration: 120,
        timerStartedAt: null,
        topWord: 'TRAINES',
        topPoints: 74,
        topCoords: 'H3',
        topPlay: trainesWord.split('').map((l, i) => ({ r: 2 + i, c: 7, letter: l })),
        submissionsCount: 3
      },
      3: {
        roundNumber: 3,
        letters: 'AEGHIMN',
        status: 'composing',
        timerLeft: 120,
        duration: 120,
        timerStartedAt: Date.now(),
        topWord: '',
        topPoints: 0,
        topCoords: '',
        topPlay: [],
        submissionsCount: 0
      }
    },
    players: {
      'p-serge': {
        id: 'p-serge',
        username: 'Serge',
        roomCode: code,
        isArbitre: false,
        active: true,
        score: 118,
        lostPoints: 6,
        lastActive: Date.now(),
        roundScores: { 1: 50, 2: 68 },
        roundLosses: { 1: 0, 2: 6 },
        roundWords: { 1: 'SCRABBLE', 2: 'SAINTER' }
      },
      'p-aminata': {
        id: 'p-aminata',
        username: 'Aminata',
        roomCode: code,
        isArbitre: false,
        active: true,
        score: 124,
        lostPoints: 0,
        lastActive: Date.now(),
        roundScores: { 1: 50, 2: 74 },
        roundLosses: { 1: 0, 2: 0 },
        roundWords: { 1: 'SCRABBLE', 2: 'TRAINES' }
      },
      'p-evariste': {
        id: 'p-evariste',
        username: 'Evariste',
        roomCode: code,
        isArbitre: false,
        active: true,
        score: 94,
        lostPoints: 30,
        lastActive: Date.now(),
        roundScores: { 1: 30, 2: 64 },
        roundLosses: { 1: 20, 2: 10 },
        roundWords: { 1: 'CABLE', 2: 'ANIER' }
      },
      'arb-serge': {
        id: 'arb-serge',
        username: 'Serge (Arbitre)',
        roomCode: code,
        isArbitre: true,
        active: true,
        score: 0,
        lostPoints: 0,
        lastActive: Date.now(),
        roundScores: {},
        roundLosses: {},
        roundWords: {}
      }
    },
    submissions: {
      1: {
        'p-serge': { playerId: 'p-serge', username: 'Serge', roundNumber: 1, word: 'SCRABBLE', points: 50, coords: 'D8', validated: true, accepted: true, loss: 0 },
        'p-aminata': { playerId: 'p-aminata', username: 'Aminata', roundNumber: 1, word: 'SCRABBLE', points: 50, coords: 'D8', validated: true, accepted: true, loss: 0 },
        'p-evariste': { playerId: 'p-evariste', username: 'Evariste', roundNumber: 1, word: 'CABLE', points: 30, coords: 'D8', validated: true, accepted: true, loss: 20 }
      },
      2: {
        'p-serge': { playerId: 'p-serge', username: 'Serge', roundNumber: 2, word: 'SAINTER', points: 68, coords: 'H3', validated: true, accepted: true, loss: 6 },
        'p-aminata': { playerId: 'p-aminata', username: 'Aminata', roundNumber: 2, word: 'TRAINES', points: 74, coords: 'H3', validated: true, accepted: true, loss: 0 },
        'p-evariste': { playerId: 'p-evariste', username: 'Evariste', roundNumber: 2, word: 'ANIER', points: 64, coords: 'H5', validated: true, accepted: true, loss: 10 }
      },
      3: {}
    },
    boardState: board,
    moveHistory: [
      { roundNumber: 1, letters: 'ABCEKLR', word: 'SCRABBLE', points: 50, coords: 'D8', placedByArbitre: true },
      { roundNumber: 2, letters: 'AEINRTS', word: 'TRAINES', points: 74, coords: 'H3', placedByArbitre: true }
    ],
    auditLogs: [
      { timestamp: Date.now() - 300000, message: 'Création du tournoi Championnat Grand Est.', type: 'info' },
      { timestamp: Date.now() - 250000, message: 'Début du coup 1. Tirage: ABCEKLR', type: 'info' },
      { timestamp: Date.now() - 150000, message: 'TOP validé pour coup 1: SCRABBLE (50 pts - D8)', type: 'info' },
      { timestamp: Date.now() - 120000, message: 'Début du coup 2. Tirage: AEINRTS', type: 'info' },
      { timestamp: Date.now() - 20000, message: 'TOP validé pour coup 2: TRAINES (74 pts - H3)', type: 'info' },
      { timestamp: Date.now(), message: 'Début du coup 3. Tirage: AEGHIMN', type: 'info' }
    ]
  };

  tournaments[code] = demoTourney;
}

// Bootstrap once
bootstrapDemoTournament();

// ----------------------------------------------------
// Core API Enpoints
// ----------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', onlinePlayersCount: Object.keys(tournaments).reduce((sum, k) => sum + Object.keys(tournaments[k].players).length, 0) });
});

// ODS9 Word Lookup Help
app.get('/api/ods/:word', (req, res) => {
  const result = validateWordODS9(req.params.word);
  res.json(result);
});

// Solve TOP Play (used by Solo Training Mode)
app.post('/api/solve-top', (req, res) => {
  const { letters, boardState } = req.body;
  if (!letters || !boardState) {
    return res.status(400).json({ error: 'Lettres et etat du plateau requis.' });
  }
  try {
    const solved = solveTopPlay(letters, boardState);
    res.json(solved);
  } catch (err: any) {
    console.error("Error solving top play:", err);
    res.status(500).json({ error: err.message || 'Erreur lors de la resolution du top.' });
  }
});

// Create Tournament
app.post('/api/tournament/create', async (req, res) => {
  const { name, arbitreName, timerDuration, type, mode, maxPlayers, drawMode } = req.body;
  if (!name || !arbitreName) {
    return res.status(400).json({ error: 'Nom du tournoi et de l\'arbitre requis.' });
  }

  const code = generateRoomCode();
  const newTournament: Tournament = {
    code,
    name: name.trim(),
    arbitreName: arbitreName.trim(),
    state: 'lobby',
    tileBag: JSON.parse(JSON.stringify(FRENCH_TILE_BAG)),
    type: type || 'classic',
    mode: mode || 'online',
    timerDuration: Number(timerDuration) || 120,
    maxPlayers: Number(maxPlayers) || 20,
    locked: false,
    currentRoundNumber: 0,
    rounds: {},
    players: {},
    submissions: {},
    boardState: createEmptyBoard(),
    moveHistory: [],
    drawMode: drawMode || 'auto',
    auditLogs: [{
      timestamp: Date.now(),
      message: `Création du tournoi "${name}" par l'arbitre ${arbitreName}. Code: ${code}`,
      type: 'info'
    }]
  };

  // Add the referee player as a member with high permission
  const refId = `arb-${Math.random().toString(36).substr(2, 6)}`;
  const refPlayer: Player = {
    id: refId,
    username: arbitreName.trim(),
    roomCode: code,
    isArbitre: true,
    active: true,
    score: 0,
    lostPoints: 0,
    lastActive: Date.now(),
    roundScores: {},
    roundLosses: {},
    roundWords: {}
  };
  newTournament.players[refId] = refPlayer;

  tournaments[code] = newTournament;
  await saveTournament(newTournament);
  res.json({ tournamentCode: code, playerId: refId, player: refPlayer });
});

// Join Tournament Room
app.post('/api/tournament/join', async (req, res) => {
  let { roomCode, username } = req.body;
  if (!roomCode || !username) {
    return res.status(400).json({ error: 'Code de salle et Pseudo requis.' });
  }

  const code = roomCode.toUpperCase().trim();
  const t = await loadTournament(code);
  if (!t) {
    return res.status(404).json({ error: 'Tournoi introuvable. Veuillez vérifier le code.' });
  }

  if (t.locked) {
    return res.status(403).json({ error: 'Cette salle est verrouillée par l\'arbitre.' });
  }

  const activePlayers = Object.values(t.players).filter(p => !p.isArbitre);
  if (activePlayers.length >= t.maxPlayers) {
    return res.status(403).json({ error: 'Salle pleine. Le nombre maximal de joueurs est atteint.' });
  }

  // Ensure unique pseudo
  const userJoined = username.trim();
  const isDuplicate = Object.values(t.players).some(p => p.username.toLowerCase() === userJoined.toLowerCase());
  if (isDuplicate) {
    return res.status(400).json({ error: 'Ce pseudo est déjà utilisé dans cette salle.' });
  }

  const pId = `p-${Math.random().toString(36).substr(2, 6)}`;
  const newPlayer: Player = {
    id: pId,
    username: userJoined,
    roomCode: code,
    isArbitre: false,
    active: true,
    score: 0,
    lostPoints: 0,
    lastActive: Date.now(),
    roundScores: {},
    roundLosses: {},
    roundWords: {}
  };

  t.players[pId] = newPlayer;
  t.auditLogs.push({
    timestamp: Date.now(),
    message: `Le joueur ${userJoined} a rejoint la salle.`,
    type: 'info'
  });

  await saveTournament(t);
  res.json({ tournamentCode: code, playerId: pId, player: newPlayer });
});

// Get Room Status
app.get('/api/tournament/:code/status', async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const t = await loadTournament(code);
  if (!t) {
    return res.status(404).json({ error: 'Tournoi non trouvé.' });
  }

  // Update online presence for this retrieval
  res.json(t);
});

// Player Submission entry
app.post('/api/tournament/:code/player/submit', async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const { playerId, word, points, coords } = req.body;
  const t = await loadTournament(code);

  if (!t) return res.status(404).json({ error: 'Tournoi inexistant.' });

  const p = t.players[playerId];
  if (!p) return res.status(403).json({ error: 'Joueur non enregistré.' });

  const rNum = t.currentRoundNumber;
  const r = t.rounds[rNum];
  if (!r) return res.status(400).json({ error: 'Aucun coup disponible.' });

  if (r.status !== 'composing') {
    return res.status(400).json({ error: 'Le temps de soumission est écoulé ou le coup n\'a pas démarré.' });
  }

  // Validate spelling against ODS9
  const validation = validateWordODS9(word);
  
  const formattedWord = word.toUpperCase().trim();

  const newSub: Submission = {
    playerId,
    username: p.username,
    roundNumber: rNum,
    word: formattedWord,
    points: Number(points) || 0,
    coords: (coords || '').toUpperCase().trim(),
    validated: validation.isValid,
    accepted: validation.isValid, // True by default if valid, arbitre can disallow or override
    loss: 0 // Will compile at round end once TOP is calculated
  };

  if (!t.submissions[rNum]) {
    t.submissions[rNum] = {};
  }
  t.submissions[rNum][playerId] = newSub;
  p.roundWords[rNum] = formattedWord;

  t.auditLogs.push({
    timestamp: Date.now(),
    message: `Proposition reçue pour ${p.username} : "${formattedWord}" (${points} pts, ${coords})`,
    type: 'info'
  });

  // Count submissions
  r.submissionsCount = Object.keys(t.submissions[rNum] || {}).length;

  await saveTournament(t);
  res.json({ status: 'success', submission: newSub });
});

// Player Heartbeat to maintain visibility
app.post('/api/tournament/:code/player/heartbeat', async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const { playerId } = req.body;
  const t = await loadTournament(code);
  if (t && t.players[playerId]) {
    t.players[playerId].lastActive = Date.now();
    t.players[playerId].active = true;
    saveTournament(t);
    return res.json({ status: 'ok' });
  }
  res.status(404).json({ error: 'Joueur non trouvé.' });
});

// Admin Draw letters (Automatic or Manual input)
app.post('/api/tournament/:code/admin/draw', async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const { letters, autoGenerate, playerId } = req.body;
  const t = await loadTournament(code);

  if (!t) return res.status(404).json({ error: 'Tournoi introuvable.' });
  
  // Verify if player is indeed referee
  const p = t.players[playerId];
  if (!p || !p.isArbitre) {
    return res.status(403).json({ error: 'Réservé à l\'arbitre.' });
  }

  t.state = 'playing';
  const nextRoundNum = t.currentRoundNumber + 1;
  t.currentRoundNumber = nextRoundNum;

  if (!t.tileBag) {
    t.tileBag = JSON.parse(JSON.stringify(FRENCH_TILE_BAG));
  }

  let finalLetters = '';
  if (autoGenerate) {
    // Generate tiles with standard French frequencies from the tournament bag
    const result = drawScrabbleLetters(nextRoundNum, t.tileBag);
    finalLetters = result.drawn;
    t.tileBag = result.updatedBag;
  } else {
    // Arbitre supplied manual string of tiles
    const raw = (letters || '').toUpperCase().replace(/[^A-Z?]/g, '');
    if (raw.length === 0) {
      return res.status(400).json({ error: 'Veuillez renseigner un tirage de lettres valide.' });
    }
    finalLetters = raw;
    // Deduct from tileBag
    raw.split('').forEach((char: string) => {
      const match = t.tileBag?.find((item: any) => item.letter === char);
      if (match && match.count > 0) {
        match.count--;
      }
    });
  }

  const newRound: Round = {
    roundNumber: nextRoundNum,
    letters: finalLetters,
    status: 'composing', // Start automatically!
    timerLeft: t.timerDuration,
    duration: t.timerDuration,
    timerStartedAt: Date.now(),
    topWord: '',
    topPoints: 0,
    topCoords: '',
    topPlay: [],
    submissionsCount: 0
  };

  t.rounds[nextRoundNum] = newRound;
  t.submissions[nextRoundNum] = {};

  t.auditLogs.push({
    timestamp: Date.now(),
    message: `Coup ${nextRoundNum} généré. Tirage : ${finalLetters}.`,
    type: 'info'
  });

  await saveTournament(t);
  res.json(t);
});

// Admin start clock trigger
app.post('/api/tournament/:code/admin/start-timer', async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const { playerId } = req.body;
  const t = await loadTournament(code);

  if (!t) return res.status(404).json({ error: 'Tournoi introuvable.' });
  if (!t.players[playerId] || !t.players[playerId].isArbitre) {
    return res.status(403).json({ error: 'Réservé à l\'arbitre.' });
  }

  const activeNum = t.currentRoundNumber;
  const r = t.rounds[activeNum];
  if (!r) return res.status(400).json({ error: 'Pas de coup à démarrer.' });

  r.status = 'composing';
  r.timerStartedAt = Date.now();
  r.timerLeft = r.duration;

  t.auditLogs.push({
    timestamp: Date.now(),
    message: `Chronomètre démarré pour le coup ${activeNum} (${r.duration}s).`,
    type: 'info'
  });

  await saveTournament(t);
  res.json(t);
});

// Admin pause/resume clock
app.post('/api/tournament/:code/admin/pause-timer', async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const { playerId } = req.body;
  const t = await loadTournament(code);

  if (!t) return res.status(404).json({ error: 'Tournoi.' });
  if (!t.players[playerId] || !t.players[playerId].isArbitre) {
    return res.status(403).json({ error: 'Arbitre.' });
  }

  const r = t.rounds[t.currentRoundNumber];
  if (!r) return res.status(400).json({ error: 'Pas de coup.' });

  if (r.status === 'composing') {
    r.status = 'idle'; // Hold clock
    t.auditLogs.push({
      timestamp: Date.now(),
      message: `Chronomètre mis en pause par l'arbitre.`,
      type: 'info'
    });
  } else {
    r.status = 'composing';
    t.auditLogs.push({
      timestamp: Date.now(),
      message: `Chronomètre relancé par l'arbitre.`,
      type: 'info'
    });
  }

  await saveTournament(t);
  res.json(t);
});

// Helper to automatically apply the best solver layout/score once time wraps up!
function finalizeRoundWithTopPlay(t: Tournament, rNum: number) {
  const r = t.rounds[rNum];
  if (!r) return;

  // 1. Solve top play now at the end of the timer/compose period!
  const solved = solveTopPlay(r.letters, t.boardState);
  r.topWord = solved.word;
  r.topPoints = solved.points;
  r.topCoords = solved.coords;
  r.topPlay = solved.play;

  // 2. Overlay solver's best play onto the official board state
  if (r.topPlay && r.topPlay.length > 0) {
    r.topPlay.forEach((p: any) => {
      t.boardState[p.r][p.c] = {
        letter: p.letter,
        roundPlaced: rNum,
        isTopLetter: true
      };
    });
  }

  // 3. Wrap status to ended
  r.status = 'ended';
  r.timerLeft = 0;

  // 4. Score all participants for this round in duplicate rules (Points perdus = TOP - score)
  const rPoints = r.topPoints || 0;
  const submissionsGroup = t.submissions[rNum] || {};

  Object.values(t.players).forEach(player => {
    if (player.isArbitre) return;

    const sub = submissionsGroup[player.id];
    const gainedPoints = sub && sub.validated && sub.accepted ? sub.points : 0;
    const loss = Math.max(0, rPoints - gainedPoints);

    player.roundScores[rNum] = gainedPoints;
    player.roundLosses[rNum] = loss;
    player.score += gainedPoints;
    player.lostPoints += loss;

    if (sub) {
      sub.loss = loss;
    }
  });

  // 4. Archive in moveHistory log
  t.moveHistory.push({
    roundNumber: rNum,
    letters: r.letters,
    word: r.topWord,
    points: r.topPoints,
    coords: r.topCoords,
    placedByArbitre: true
  });

  t.auditLogs.push({
    timestamp: Date.now(),
    message: `TOP appliqué pour le coup ${rNum} : ${r.topWord || 'PASS'} (${rPoints} pts - ${r.topCoords || ''})`,
    type: 'info'
  });

  // 5. Sweep tileBag depletion limit
  const remainingCount = t.tileBag ? t.tileBag.reduce((sum, item) => sum + item.count, 0) : 0;
  if (remainingCount === 0) {
    t.state = 'finished';
    t.auditLogs.push({
      timestamp: Date.now(),
      message: `Toutes les 102 lettres du sac de tirage ont été épuisées. Fin officielle de la partie DupliRoom !`,
      type: 'info'
    });
  }
}

// Admin end compose slide early
app.post('/api/tournament/:code/admin/end-round', async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const { playerId } = req.body;
  const t = await loadTournament(code);

  if (!t) return res.status(404).json({ error: 'Tournoi non trouvé.' });
  if (!t.players[playerId] || !t.players[playerId].isArbitre) {
    return res.status(403).json({ error: 'Réservé à l\'arbitre.' });
  }

  const rNum = t.currentRoundNumber;
  const r = t.rounds[rNum];
  if (r) {
    finalizeRoundWithTopPlay(t, rNum);
    t.auditLogs.push({
      timestamp: Date.now(),
      message: `Coup ${rNum} abrégé par l'arbitre. Saisie terminée et TOP appliqué.`,
      type: 'info'
    });
  }

  await saveTournament(t);
  res.json(t);
});

// Admin validate TOP word play
// Inserts the top word on the board permanently, computes duplicate losses
app.post('/api/tournament/:code/admin/validate-top', async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const { playerId, word, points, coords, startR, startC, orientation } = req.body;
  const t = await loadTournament(code);

  if (!t) return res.status(404).json({ error: 'Tournoi.' });
  if (!t.players[playerId] || !t.players[playerId].isArbitre) {
    return res.status(403).json({ error: 'Ref.' });
  }

  const rNum = t.currentRoundNumber;
  const r = t.rounds[rNum];
  if (!r) return res.status(400).json({ error: 'Aucun coup.' });

  // Preserve lowercase casing to distinguish manual and solver Jokers
  const formattedWord = (word || '').replace(/[^a-zA-Z]/g, '');
  const rPoints = Number(points) || 0;
  const formattedCoords = (coords || '').toUpperCase().trim();

  // Draw TOP letters on the official board state!
  // To avoid manual interface coordination errors, we place the letters cell-by-cell.
  // We parsed custom letter alignments (orientation H or V, starting from row/col).
  let resolvedR = Number(startR);
  let resolvedC = Number(startC);
  let resolvedDir = (orientation || 'H') as 'H' | 'V';

  const coordLookup = parseCoordinates(formattedCoords);
  if (coordLookup) {
    resolvedR = coordLookup.r;
    resolvedC = coordLookup.c;
    resolvedDir = coordLookup.direction;
  }

  const topCells: { r: number; c: number; letter: string }[] = [];
  if (formattedWord.length > 0 && !isNaN(resolvedR) && !isNaN(resolvedC)) {
    for (let i = 0; i < formattedWord.length; i++) {
      const curR = resolvedDir === 'V' ? resolvedR + i : resolvedR;
      const curC = resolvedDir === 'H' ? resolvedC + i : resolvedC;

      if (curR >= 0 && curR < 15 && curC >= 0 && curC < 15) {
        t.boardState[curR][curC] = {
          letter: formattedWord[i],
          roundPlaced: rNum,
          isTopLetter: true
        };
        topCells.push({ r: curR, c: curC, letter: formattedWord[i] });
      }
    }
  }

  // Set top outputs in round structure
  r.status = 'ended';
  r.topWord = formattedWord;
  r.topPoints = rPoints;
  r.topCoords = formattedCoords || `${ALPHABET[resolvedC || 0]}${(resolvedR || 0) + 1}`;
  r.topPlay = topCells;

  // Compile round results for all participants (Score duplicate points calculations)
  // Scoring formula: Points perdus = TOP - score joueur
  const submissionsGroup = t.submissions[rNum] || {};
  Object.values(t.players).forEach(player => {
    if (player.isArbitre) return;
    
    const sub = submissionsGroup[player.id];
    const gainedPoints = sub && sub.validated && sub.accepted ? sub.points : 0;
    const loss = rPoints - gainedPoints;

    player.roundScores[rNum] = gainedPoints;
    player.roundLosses[rNum] = loss;
    player.score += gainedPoints;
    player.lostPoints += loss;

    if (sub) {
      sub.loss = loss;
    }
  });

  // Archive in move history
  t.moveHistory.push({
    roundNumber: rNum,
    letters: r.letters,
    word: r.topWord,
    points: r.topPoints,
    coords: r.topCoords,
    placedByArbitre: true
  });

  t.auditLogs.push({
    timestamp: Date.now(),
    message: `TOP validé coup ${rNum} : ${formattedWord} (${rPoints} pts - ${r.topCoords})`,
    type: 'info'
  });

  // Check if no tiles remain in the tournament tileBag
  const remainingCount = t.tileBag ? t.tileBag.reduce((sum, item) => sum + item.count, 0) : 0;
  if (remainingCount === 0) {
    t.state = 'finished';
    t.auditLogs.push({
      timestamp: Date.now(),
      message: `Toutes les 102 lettres du sac de tirage ont été épuisées. Fin officielle de la partie DupliRoom !`,
      type: 'info'
    });
  }

  await saveTournament(t);
  res.json(t);
});

// Admin lock room / actions
app.post('/api/tournament/:code/admin/player-action', async (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const { playerId, targetPlayerId, action, newName } = req.body;
  const t = await loadTournament(code);

  if (!t) return res.status(404).json({ error: 'Tournoi.' });
  if (!t.players[playerId] || !t.players[playerId].isArbitre) {
    return res.status(403).json({ error: 'Réservé à l\'arbitre.' });
  }

  if (action === 'kick') {
    const target = t.players[targetPlayerId];
    if (target) {
      t.auditLogs.push({
        timestamp: Date.now(),
        message: `L'joueur ${target.username} a été expulsé par l'arbitre.`,
        type: 'warning'
      });
      delete t.players[targetPlayerId];
    }
  } else if (action === 'lock') {
    t.locked = !t.locked;
  } else if (action === 'rename' && newName) {
    t.name = newName.trim();
  } else if (action === 'terminate') {
    t.state = 'finished';
  }

  await saveTournament(t);
  res.json(t);
});

// Periodic offline checker sweeps to label player inactivity
setInterval(() => {
  const now = Date.now();
  for (const code of Object.keys(tournaments)) {
    const t = tournaments[code];
    let needsSave = false;

    Object.values(t.players).forEach(p => {
      // If no communication for 15 seconds, tag as inactive (excluding arbitre)
      if (!p.isArbitre && now - p.lastActive > 15000 && p.active) {
        p.active = false;
        t.auditLogs.push({
          timestamp: now,
          message: `${p.username} semble déconnecté (inactif).`,
          type: 'warning'
        });
        needsSave = true;
      }
    });

    // Tick down clock server-side!
    if (t.state === 'playing') {
      const activeNum = t.currentRoundNumber;
      const r = t.rounds[activeNum];
      if (r && r.status === 'composing') {
        if (r.timerLeft > 0) {
          r.timerLeft--;
          if (r.timerLeft === 0) {
            t.auditLogs.push({
              timestamp: now,
              message: `Temps écoulé pour le coup ${activeNum}.`,
              type: 'info'
            });
            finalizeRoundWithTopPlay(t, activeNum);
            needsSave = true;
          }
        }
      }
    }

    if (needsSave) {
      saveTournament(t);
    }
  }
}, 1000);

// Set up server
async function startServer() {
  // Ensure the public directory exists and populate PWA logo icons on startup
  const pPublicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(pPublicDir)) {
    fs.mkdirSync(pPublicDir, { recursive: true });
  }

  const srcLogoDrMain = path.join(process.cwd(), 'assets', '.aistudio', 'drlog.png');
  const destLogoDrMain = path.join(pPublicDir, 'drlog.png');

  const isRealFile = (filePath: string) => {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
    } catch {
      return false;
    }
  };

  try {
    if (isRealFile(srcLogoDrMain)) {
      const size = fs.statSync(srcLogoDrMain).size;
      console.log(`[PWA Startup] Copying drlog.png (${size} bytes) from assets to public folder...`);
      fs.copyFileSync(srcLogoDrMain, destLogoDrMain);
    } else {
      // Look for any fallback
      if (fs.existsSync(srcLogoDrMain)) {
        fs.copyFileSync(srcLogoDrMain, destLogoDrMain);
      }
      console.log(`[PWA Startup] Fallback copying executed for drlog.png in public`);
    }
  } catch (copyErr) {
    console.error(`[PWA Startup] Failed to copy logodr asset files:`, copyErr);
  }

  // Load ODS9 dictionary from assets/.aistudio/ods9.json
  const dictionaryPath = path.join(process.cwd(), 'assets', '.aistudio', 'ods9.json');
  try {
    if (fs.existsSync(dictionaryPath)) {
      console.log(`[DupliRoom] Loading ODS9 dictionary from ${dictionaryPath}...`);
      const data = fs.readFileSync(dictionaryPath, 'utf8');
      const words = data.split(/\r?\n/).map(w => w.trim().toUpperCase()).filter(w => w.length > 0);
      setOds9Dictionary(words);
      console.log(`[DupliRoom] Successfully loaded ${words.length} words into ODS9 dictionary Set!`);
    } else {
      console.warn(`[DupliRoom] ODS9 dictionary not found at ${dictionaryPath}. Falling back to default list.`);
    }
  } catch (err) {
    console.error("[DupliRoom] Failed to load ODS9 dictionary:", err);
  }

  // Serve static UI assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DupliRoom Backend] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
