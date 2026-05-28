import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Shuffle, 
  Trash2, 
  HelpCircle, 
  Sparkles, 
  ChevronRight, 
  AlertCircle,
  Clock,
  BookOpen,
  Info
} from 'lucide-react';
import { BoardCell } from '../types.js';
import { ScrabbleBoard } from './ScrabbleBoard.tsx';
import { ScrabbleRack } from './ScrabbleRack.tsx';
import { 
  FRENCH_TILE_BAG, 
  drawScrabbleLetters, 
  scorePlacedWord, 
  formatCoordinates,
  PlacementLetter
} from '../scrabble.js';

interface TrainingModeProps {
  onClose: () => void;
}

interface GameRoundHistory {
  roundNumber: number;
  letters: string;
  word: string;
  points: number;
  coords: string;
  topWord: string;
  topPoints: number;
  topCoords: string;
  isCustomRack: boolean;
}

export function TrainingMode({ onClose }: TrainingModeProps) {
  // Board & Rack States
  const [boardState, setBoardState] = useState<BoardCell[][]>(() => 
    Array(15).fill(null).map(() => 
      Array(15).fill(null).map(() => ({ 
        letter: null, 
        roundPlaced: null, 
        isTopLetter: false 
      }))
    )
  );

  const [tileBag, setTileBag] = useState<{ letter: string; count: number }[]>(() =>
    JSON.parse(JSON.stringify(FRENCH_TILE_BAG))
  );

  const [letters, setLetters] = useState<string>('');
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [maxTopScore, setMaxTopScore] = useState<number>(0);
  
  // Placement State
  const [tempPlacement, setTempPlacement] = useState<{ [key: string]: string }>({});
  const [selectedRackLetter, setSelectedRackLetter] = useState<{ letter: string; index: number } | null>(null);
  const [jokerSelection, setJokerSelection] = useState<{ r: number; c: number } | null>(null);

  // Configuration States
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<number>(120); // 120 sec by default
  const [timerLeft, setTimerLeft] = useState<number>(120);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  
  // Rule Settings
  // 'duplicate' -> board advances with TOP play
  // 'classic' -> board advances with your valid words
  const [placementRule, setPlacementRule] = useState<'duplicate' | 'classic'>('duplicate');

  // Round Resolution
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  
  const [roundResults, setRoundResults] = useState<{
    playerWord: string;
    playerPoints: number;
    playerCoords: string;
    topWord: string;
    topPoints: number;
    topCoords: string;
    topPlay: any[];
    definition: string;
    topDefinition: string;
  } | null>(null);

  const [odsWarning, setOdsWarning] = useState<string | null>(null);
  const [history, setHistory] = useState<GameRoundHistory[]>([]);
  
  // Custom rack overrides
  const [customLettersInput, setCustomLettersInput] = useState<string>('');
  const [showCustomRackAlert, setShowCustomRackAlert] = useState<boolean>(false);

  // Timer Ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initial Draw on Mount
  useEffect(() => {
    restartGame();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Timer Interval Manager
  useEffect(() => {
    if (isTimerEnabled && isTimerActive && timerLeft > 0 && !isValidated) {
      timerIntervalRef.current = setInterval(() => {
        setTimerLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            // Timeout -> Auto-validate what is currently on the board
            handleAutoSubmitOnTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerEnabled, isTimerActive, timerLeft, isValidated]);

  // Restart functions
  const restartGame = () => {
    const blankBoard = Array(15).fill(null).map(() => 
      Array(15).fill(null).map(() => ({ 
        letter: null, 
        roundPlaced: null, 
        isTopLetter: false 
      }))
    );
    const freshBag = JSON.parse(JSON.stringify(FRENCH_TILE_BAG));
    
    // Draw 7 letters for round 1
    const { drawn, updatedBag } = drawScrabbleLetters(1, freshBag);
    
    setBoardState(blankBoard);
    setTileBag(updatedBag);
    setLetters(drawn);
    setRoundNumber(1);
    setPlayerScore(0);
    setMaxTopScore(0);
    setTempPlacement({});
    setSelectedRackLetter(null);
    setIsValidated(false);
    setRoundResults(null);
    setOdsWarning(null);
    setHistory([]);
    setCustomLettersInput('');
    
    if (isTimerEnabled) {
      setTimerLeft(timerDuration);
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
    }
  };

  // Automated draw routine for next round
  const startNextRound = () => {
    if (!roundResults) return;

    // 1. Advance the board according to Chosen Rule
    const finalBoard = boardState.map(row => row.map(cell => ({ ...cell })));
    const actualPlayToPlace = placementRule === 'duplicate' 
      ? roundResults.topPlay 
      : (roundResults.playerPoints > 0 ? getPlacedLettersList() : roundResults.topPlay);

    // Place permanetly on board
    if (actualPlayToPlace && actualPlayToPlace.length > 0) {
      actualPlayToPlace.forEach((p: any) => {
        finalBoard[p.r][p.c] = {
          letter: p.letter.toUpperCase(),
          roundPlaced: roundNumber,
          isTopLetter: true
        };
      });
    }

    // 2. Accumulate overall scores
    setPlayerScore(prev => prev + roundResults.playerPoints);
    setMaxTopScore(prev => prev + roundResults.topPoints);

    // 3. Save to logs history
    const isCustom = letters === customLettersInput.toUpperCase();
    setHistory(prev => [
      ...prev,
      {
        roundNumber,
        letters,
        word: roundResults.playerWord,
        points: roundResults.playerPoints,
        coords: roundResults.playerCoords,
        topWord: roundResults.topWord,
        topPoints: roundResults.topPoints,
        topCoords: roundResults.topCoords,
        isCustomRack: isCustom
      }
    ]);

    // 4. Draw for next coup
    const nextRoundNum = roundNumber + 1;
    let newLetters = '';
    let nextBag = [...tileBag];

    // Check if bag is empty of enough tiles
    const totalRem = nextBag.reduce((sum, item) => sum + item.count, 0);
    if (totalRem < 7) {
      // Refresh bag
      nextBag = JSON.parse(JSON.stringify(FRENCH_TILE_BAG));
    }

    const drawRes = drawScrabbleLetters(nextRoundNum, nextBag);
    newLetters = drawRes.drawn;
    setTileBag(drawRes.updatedBag);

    // 5. Reset round parameters
    setBoardState(finalBoard);
    setLetters(newLetters);
    setRoundNumber(nextRoundNum);
    setTempPlacement({});
    setSelectedRackLetter(null);
    setIsValidated(false);
    setRoundResults(null);
    setOdsWarning(null);
    setCustomLettersInput('');

    if (isTimerEnabled) {
      setTimerLeft(timerDuration);
      setIsTimerActive(true);
    }
  };

  // Compute calculated metrics of active placement
  const getPlacedLettersList = (): PlacementLetter[] => {
    return Object.entries(tempPlacement).map(([key, letter]) => {
      const [r, c] = key.split(',').map(Number);
      return { r, c, letter: letter as string };
    });
  };

  const previewCalc = scorePlacedWord(
    getPlacedLettersList(),
    boardState.map(row => row.map(cell => ({ letter: cell.letter })))
  );

  let previewWord = '';
  let previewCoordinatesStr = '';

  const placedList = getPlacedLettersList();
  if (placedList.length > 0) {
    const sorted = [...placedList].sort((a, b) => {
      if (a.r === b.r) return a.c - b.c;
      return a.r - b.r;
    });

    const isHorizontal = sorted.every(s => s.r === sorted[0].r);
    const row = sorted[0].r;
    const col = sorted[0].c;
    
    let startCol = col;
    while (startCol > 0 && (boardState[row][startCol - 1].letter !== null || tempPlacement[`${row},${startCol - 1}`])) {
      startCol--;
    }
    let endCol = col;
    while (endCol < 14 && (boardState[row][endCol + 1].letter !== null || tempPlacement[`${row},${endCol + 1}`])) {
      endCol++;
    }

    if (isHorizontal) {
      for (let c = startCol; c <= endCol; c++) {
        previewWord += tempPlacement[`${row},${c}`] || boardState[row][c].letter || '_';
      }
      previewCoordinatesStr = formatCoordinates(row, startCol, 'H');
    } else {
      let startRow = sorted[0].r;
      while (startRow > 0 && (boardState[startRow - 1][col].letter !== null || tempPlacement[`${startRow - 1},${col}`])) {
        startRow--;
      }
      let endRow = sorted[0].r;
      while (endRow < 14 && (boardState[endRow + 1][col].letter !== null || tempPlacement[`${endRow + 1},${col}`])) {
        endRow++;
      }
      for (let r = startRow; r <= endRow; r++) {
        previewWord += tempPlacement[`${r},${col}`] || boardState[r][col].letter || '_';
      }
      previewCoordinatesStr = formatCoordinates(startRow, col, 'V');
    }
  }

  // Interactive Board Click logic (Same as App.tsx)
  const getAvailableRackLetters = () => {
    let arr = letters.split('');
    Object.values(tempPlacement).forEach(placedLetter => {
      const letterStr = placedLetter as string;
      const isJoker = letterStr === letterStr.toLowerCase() && letterStr !== letterStr.toUpperCase();
      const literalToLookFor = isJoker ? '?' : letterStr;
      const idx = arr.indexOf(literalToLookFor);
      if (idx !== -1) {
        arr.splice(idx, 1);
      }
    });
    return arr.join('');
  };

  const handleCellClick = (r: number, c: number) => {
    if (isValidated) return; // cannot edit after validation

    const key = `${r},${c}`;
    const hasTempLetter = tempPlacement[key];

    if (hasTempLetter) {
      const updated = { ...tempPlacement };
      delete updated[key];
      setTempPlacement(updated);
      setSelectedRackLetter(null);
    } else if (selectedRackLetter) {
      if (selectedRackLetter.letter === '?') {
        // Trigger Selection dialog instead of directly placing '?'
        setJokerSelection({ r, c });
      } else {
        setTempPlacement(prev => ({
          ...prev,
          [key]: selectedRackLetter.letter
        }));
        setSelectedRackLetter(null);
      }
    }
  };

  const handleSelectRackLetter = (letter: string, index: number) => {
    if (isValidated) return;
    setSelectedRackLetter(prev => {
      if (prev && prev.index === index) {
        return null;
      }
      return { letter, index };
    });
  };

  const handleShuffleLetters = () => {
    if (isValidated) return;
    const currentList = getAvailableRackLetters().split('');
    for (let i = currentList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentList[i], currentList[j]] = [currentList[j], currentList[i]];
    }
    const rebuiltString = [...currentList, ...Object.values(tempPlacement)].join('');
    setLetters(rebuiltString);
  };

  const handleRecallAllTemp = () => {
    if (isValidated) return;
    setTempPlacement({});
    setSelectedRackLetter(null);
  };

  // Manual Trigger submitting the current layout & comparing with TOP play
  const validatePlacementTurn = async (forceValidation = false) => {
    setIsResolving(true);
    setOdsWarning(null);

    let finalPlayerWord = 'PAS_DE_COUP';
    let finalPlayerPoints = 0;
    let finalPlayerCoords = '-';
    let wordIsValid = true;
    let definitionStr = 'Aucun mot valide placé.';

    // 1. Evaluate player's play
    if (placedList.length > 0) {
      if (previewCalc.error) {
        // Player placement is invalid structurally (not aligned, no overlap, etc.)
        if (!forceValidation) {
          setIsResolving(false);
          alert(`Placement invalide : ${previewCalc.error || 'Pas connecté ou direction ambiguë.'}`);
          return;
        } else {
          wordIsValid = false;
        }
      }

      if (!previewCalc.error) {
        finalPlayerWord = previewWord.toUpperCase();
        finalPlayerPoints = previewCalc.score;
        finalPlayerCoords = previewCoordinatesStr;

        // Query server to see if word is in ODS9
        try {
          const checkRes = await fetch(`/api/ods/${finalPlayerWord}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            wordIsValid = checkData.isValid;
            definitionStr = checkData.definition || 'Mot valide.';
          }
        } catch (e) {
          console.error("ODS verification failure. Defaulting to local structure validation.", e);
        }

        if (!wordIsValid && !forceValidation) {
          setIsResolving(false);
          setOdsWarning(`Le mot "${finalPlayerWord}" n'est pas dans le dictionnaire ODS-9. Vous pouvez corriger vos lettres ou "Forcer la validation".`);
          return;
        }

        if (!wordIsValid && forceValidation) {
          // Player forced it, give them points anyway
          definitionStr = `[Validé manuellement] ${finalPlayerWord} n'est pas répertorié à l'ODS9.`;
        }
      }
    }

    // 2. Fetch or trigger TOP resolver from backend
    let solverWord = 'PAS_DE_COUP';
    let solverPoints = 0;
    let solverCoords = '-';
    let solverPlay: any[] = [];
    let solverDefinition = 'Aucune définition';

    try {
      const solveRes = await fetch('/api/solve-top', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letters: letters,
          boardState: boardState
        })
      });

      if (solveRes.ok) {
        const solved = await solveRes.json();
        solverWord = solved.word || 'PAS_DE_COUP';
        solverPoints = solved.points || 0;
        solverCoords = solved.coords || 'H8';
        solverPlay = solved.play || [];

        // Lookup definition for top word
        if (solverWord !== 'PAS_DE_COUP') {
          const defRes = await fetch(`/api/ods/${solverWord}`);
          if (defRes.ok) {
            const defData = await defRes.json();
            solverDefinition = defData.definition || '';
          }
        }
      }
    } catch (err) {
      console.error("Solver backend execution failed", err);
      // Fallback fallback simple
    }

    // If solver didn't find anything, the TOP is PAS_DE_COUP 0
    setIsResolving(false);
    setIsValidated(true);
    setIsTimerActive(false);

    setRoundResults({
      playerWord: finalPlayerWord,
      playerPoints: wordIsValid ? finalPlayerPoints : 0,
      playerCoords: finalPlayerCoords,
      topWord: solverWord,
      topPoints: solverPoints,
      topCoords: solverCoords,
      topPlay: solverPlay,
      definition: definitionStr,
      topDefinition: solverDefinition
    });
  };

  const handleAutoSubmitOnTimeout = () => {
    // Timeout triggers standard validation automatically
    validatePlacementTurn(true);
  };

  // Custom rack letters manual override
  const handleApplyCustomLetters = () => {
    const cleaned = customLettersInput.toUpperCase().replace(/[^A-Z?]/g, '').slice(0, 7);
    if (cleaned.length < 2) {
      alert("Entrez au moins 2 lettres.");
      return;
    }
    setLetters(cleaned);
    setTempPlacement({});
    setSelectedRackLetter(null);
    setOdsWarning(null);
    setShowCustomRackAlert(true);
    setTimeout(() => setShowCustomRackAlert(false), 3000);
  };

  // Simple statistics
  const playerPercent = maxTopScore > 0 ? Math.round((playerScore / maxTopScore) * 100) : 100;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out]" id="training-screen">
      
      {/* 1. Header Navigation Bar */}
      <div className="relative">
        {/* Double Frame Offset Shadow */}
        <div className="absolute inset-0 border-2 border-[#D4AF37]/10 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
        
        <div className="relative bg-white border border-gray-100/80 rounded-[28px] p-5 shadow-[0_8px_25px_rgba(212,175,55,0.02)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 bg-stone-100 hover:bg-stone-250 transition-colors rounded-2xl text-stone-600 hover:text-[#1A2A6C] cursor-pointer"
              title="Quitter l'entraînement"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#1A2A6C] leading-tight flex items-center gap-1.5 font-serif">
                <span>Entraînement Solo</span>
                <span className="text-[9px] uppercase font-black tracking-widest bg-[#FAF7ED] border border-[#D4AF37]/30 text-[#D4AF37] px-2.5 py-1 rounded font-mono">
                  PRO
                </span>
              </h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">S'exercer au Top Arbitral & perfectionner les coups</p>
            </div>
          </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Rule engine selection segmented */}
          <div className="flex bg-slate-100 p-0.5 rounded-2xl border border-slate-200 shrink-0">
            <button
              onClick={() => {
                if (isValidated) {
                  alert("Veuillez terminer le coup actuel avant de changer la règle.");
                  return;
                }
                setPlacementRule('duplicate');
              }}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all ${
                placementRule === 'duplicate' 
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Duplicate : Le dictionnaire applique le coup de l'ordinateur à la fin de chaque tour."
            >
              Règle Duplicate
            </button>
            <button
              onClick={() => {
                if (isValidated) {
                  alert("Veuillez terminer le coup actuel avant de changer la règle.");
                  return;
                }
                setPlacementRule('classic');
              }}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all ${
                placementRule === 'classic' 
                  ? 'bg-white text-indigo-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Classique : Le plateau applique votre mot réel plutôt que le TOP."
            >
              Règle Classique
            </button>
          </div>

          <button
            onClick={() => {
              if (window.confirm("Voulez-vous réinitialiser la table et recommencer à zéro ?")) {
                restartGame();
              }
            }}
            className="flex items-center gap-1 bg-stone-100 hover:bg-stone-200 transition-colors text-xs font-bold text-stone-700 py-2 px-3 rounded-2xl border border-stone-200/50 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>
    </div>

      {/* 2. Top Banner Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative">
          <div className="absolute inset-0 border border-[#D4AF37]/10 rounded-3xl translate-x-1 translate-y-1 pointer-events-none" />
          <div className="relative bg-white border border-gray-100/80 rounded-3xl p-4.5 shadow-sm flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Score Joueur</span>
            <span className="text-2xl font-black font-mono text-[#1A2A6C] mt-1">{playerScore} pts</span>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 border border-[#D4AF37]/10 rounded-3xl translate-x-1 translate-y-1 pointer-events-none" />
          <div className="relative bg-white border border-gray-100/80 rounded-3xl p-4.5 shadow-sm flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Score TOP Match</span>
            <span className="text-2xl font-black font-mono text-stone-700 mt-1">{maxTopScore} pts</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 border border-[#D4AF37]/10 rounded-3xl translate-x-1 translate-y-1 pointer-events-none" />
          <div className="relative bg-[#FAF7ED]/45 border border-[#D4AF37]/15 rounded-3xl p-4.5 shadow-sm flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#c19532]">Efficacité globale</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-2xl font-black font-mono ${
                playerPercent >= 90 ? 'text-emerald-700' : playerPercent >= 75 ? 'text-amber-500' : 'text-stone-600'
              }`}>
                {playerPercent}%
              </span>
              <span className="text-[9px] text-[#c19532]/70 font-black uppercase tracking-wider">TOP</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 border border-[#D4AF37]/10 rounded-3xl translate-x-1 translate-y-1 pointer-events-none" />
          <div className="relative bg-white border border-gray-100/80 rounded-3xl p-4.5 shadow-sm flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Sac de Lettres</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-[#0B673C]">
                {tileBag.reduce((sum, item) => sum + item.count, 0)} / 102
              </span>
              <span className="text-[10px] text-gray-400 font-extrabold font-sans uppercase">coup {roundNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Gameplay Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Playable Left Pane */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ScrabbleBoard
            boardState={boardState}
            tempPlacement={tempPlacement}
            selectedRackLetter={selectedRackLetter}
            onCellClick={handleCellClick}
            onClearTemp={handleRecallAllTemp}
            letters={letters}
          />

          <ScrabbleRack
            letters={getAvailableRackLetters()}
            selectedRackLetter={selectedRackLetter}
            onSelectLetter={handleSelectRackLetter}
            onShuffle={handleShuffleLetters}
            onRecall={handleRecallAllTemp}
          />
        </div>

        {/* Right Pane Sidebar controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* A. Timer panel */}
          <div className="relative">
            <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
            
            <div className="relative bg-white border border-gray-100/80 rounded-[28px] p-5 shadow-[0_8px_25px_rgba(212,175,55,0.02)] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <span className="text-xs font-black uppercase tracking-widest text-[#1A2A6C] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                  Réflexion coup
                </span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTimerEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsTimerEnabled(checked);
                      setIsTimerActive(checked);
                      if (checked) {
                        setTimerLeft(timerDuration);
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Activer</span>
                </label>
              </div>

              {isTimerEnabled ? (
                <div className="flex items-center justify-between bg-[#F1F3F5] p-3 rounded-xl border border-transparent gap-3">
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className={`text-2xl font-black ${
                      !isTimerActive
                        ? 'text-[#1A2A6C]/40'
                        : timerLeft < 15
                          ? 'text-rose-500 animate-pulse'
                          : timerLeft < 35
                            ? 'text-amber-500'
                            : 'text-[#1A2A6C]'
                    }`}>
                      {Math.floor(timerLeft / 60).toString().padStart(2, '0')}:{(timerLeft % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">s</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsTimerActive(!isTimerActive)}
                      disabled={isValidated}
                      className="p-1.5 px-3 bg-white hover:bg-[#F1F3F5] border border-gray-100 rounded-xl text-xs font-black text-stone-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {isTimerActive ? <Pause className="w-3 h-3 inline mr-1" /> : <Play className="w-3 h-3 inline mr-1" />}
                      {isTimerActive ? 'Pause' : 'Play'}
                    </button>
                    <select
                      value={timerDuration}
                      disabled={isValidated}
                      onChange={(e) => {
                        const dur = Number(e.target.value);
                        setTimerDuration(dur);
                        setTimerLeft(dur);
                      }}
                      className="bg-white px-2 py-1.5 text-xs font-black border border-gray-100 rounded-xl text-stone-700 shadow-sm"
                    >
                      <option value="60">1 min</option>
                      <option value="120">2 min</option>
                      <option value="180">3 min</option>
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-semibold italic text-center py-2">Chronomètre en pause libre. Prenez le temps requis.</p>
              )}
            </div>
          </div>

          {/* B. Submit and compare */}
          <div className="relative">
            <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
            
            <div className="relative bg-white border border-gray-100/80 rounded-[28px] p-5 shadow-[0_8px_25px_rgba(212,175,55,0.02)] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#1A2A6C] flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>Votre Proposition</span>
                </h3>
                <span className="font-mono bg-[#FAF7ED] text-[#c19532] border border-[#D4AF37]/20 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Coup {roundNumber}
                </span>
              </div>

              {/* If NOT resolved and verified */}
              {!isValidated ? (
                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-col bg-[#F1F3F5] p-4 rounded-2xl border border-transparent gap-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Mot Formé</span>
                      <span className="font-black tracking-widest text-[#1A2A6C] font-sans text-sm uppercase">
                        {previewWord || 'PAS_DE_COUP'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Coordonnées</span>
                        <span className="font-mono font-black text-[#1A2A6C] text-xs">
                          {previewCoordinatesStr || '-'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Points Estimés</span>
                        <span className="font-mono font-black text-[#0B673C] text-xs">
                          {previewCalc.error ? '?' : `${previewCalc.score} pts`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {odsWarning && (
                    <div className="bg-rose-50 text-rose-900 justify-between p-3.5 rounded-2xl border border-rose-250 flex flex-col gap-2">
                      <div className="flex gap-1.5 items-start">
                        <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-semibold leading-normal">{odsWarning}</p>
                      </div>
                      <button
                        onClick={() => validatePlacementTurn(true)}
                        className="text-[10px] bg-rose-750 hover:bg-rose-800 text-white rounded-lg px-2 py-1.5 self-end font-black tracking-wide transition-all uppercase cursor-pointer"
                      >
                        Forcer la validation
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => validatePlacementTurn(false)}
                    disabled={isResolving}
                    className="w-full bg-gradient-to-r from-[#0C7645] to-[#065C34] hover:brightness-105 border border-[#149959]/10 text-white disabled:opacity-40 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow cursor-pointer text-center"
                  >
                    {isResolving ? 'Calcul & Recherche du TOP...' : 'Valider mon coup'}
                  </button>
                </div>
              ) : (
                // RESOLVED REVIEW PANEL (Analysis and next round button)
                <div className="flex flex-col gap-4 animate-fade-in">
                  {roundResults && (
                    <div className="flex flex-col gap-3.5">
                      
                      {/* Visual Comparison result grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#F1F3F5] border border-transparent p-3 rounded-2xl">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Votre coup</span>
                          <div className="font-black text-[#1A2A6C] truncate text-sm mt-0.5">{roundResults.playerWord}</div>
                          <div className="font-mono text-xs font-bold text-[#1A2A6C] mt-1">
                            {roundResults.playerPoints} pts <span className="opacity-50">({roundResults.playerCoords})</span>
                          </div>
                        </div>

                        <div className="bg-[#FAF7ED] border border-[#D4AF37]/20 p-3 rounded-2xl">
                          <span className="text-[9px] font-black text-[#c19532] uppercase tracking-wider">Le TOP</span>
                          <div className="font-black text-[#c19532] truncate text-sm mt-0.5">{roundResults.topWord}</div>
                          <div className="font-mono text-xs font-bold text-[#0B673C] mt-1">
                            {roundResults.topPoints} pts <span className="opacity-60">({roundResults.topCoords})</span>
                          </div>
                        </div>
                      </div>

                      {/* Dictionary Definitions of played words */}
                      <div className="bg-[#F1F3F5] rounded-2xl p-3.5 border border-transparent flex flex-col gap-2">
                        <div className="flex items-center gap-1 border-b border-gray-200 pb-1.5 self-start">
                          <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                          <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Linguistique ODS-9</span>
                        </div>

                        <div className="flex flex-col gap-2 divide-y divide-gray-200/50">
                          {roundResults.playerWord !== 'PAS_DE_COUP' && (
                            <div className="flex flex-col gap-0.5 pt-1.5 first:pt-0">
                              <span className="text-[9px] font-black text-[#1A2A6C] uppercase tracking-wider">Définition : {roundResults.playerWord}</span>
                              <p className="text-[11px] text-stone-600 leading-relaxed font-semibold font-sans">{roundResults.definition}</p>
                            </div>
                          )}

                          {roundResults.topWord !== roundResults.playerWord && roundResults.topWord !== 'PAS_DE_COUP' && (
                            <div className="flex flex-col gap-0.5 pt-2">
                              <span className="text-[9px] font-black text-[#0B673C] uppercase tracking-wider">Définition : {roundResults.topWord} (TOP)</span>
                              <p className="text-[11px] text-[#0B673C] leading-relaxed font-semibold font-sans">{roundResults.topDefinition || "Mot validé dans l'ODS9."}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Loss assessment info */}
                      <div className="text-center font-mono text-xs">
                        {roundResults.topPoints === roundResults.playerPoints ? (
                          <p className="text-[#0B673C] font-extrabold flex items-center justify-center gap-1">
                            🌟 Excellent ! Vous avez trouvé le TOP ! (+0 écart)
                          </p>
                        ) : (
                          <p className="text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                            Écart relatif au TOP : <span className="text-red-650 font-black bg-rose-50 px-2 py-0.5 rounded-full ml-1 font-mono">-{roundResults.topPoints - roundResults.playerPoints} pts</span>
                          </p>
                        )}
                      </div>

                      <button
                        onClick={startNextRound}
                        className="w-full bg-gradient-to-r from-[#0C7645] to-[#065C34] hover:brightness-105 border border-[#149959]/15 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <span>Coup suivant</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

          {/* C. Collapsible custom override tool */}
          <div className="relative">
            <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
            
            <div className="relative bg-white border border-gray-100/80 rounded-[28px] p-5 shadow-[0_8px_25px_rgba(212,175,55,0.02)] flex flex-col gap-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Remplacer le tirage (Optionnel)</span>
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest cursor-pointer hover:underline" onClick={() => setCustomLettersInput('')}>
                  vider
                </span>
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: AEINRTS (ou ? pour joker)"
                  value={customLettersInput}
                  onChange={(e) => setCustomLettersInput(e.target.value.toUpperCase())}
                  disabled={isValidated}
                  className="flex-1 bg-[#F1F3F5] border border-transparent rounded-xl px-2.5 py-2.5 text-xs font-black focus:border-[#D4AF37]/35 focus:outline-none uppercase font-mono tracking-widest text-[#1A2A6C]"
                />
                <button
                  onClick={handleApplyCustomLetters}
                  disabled={isValidated || !customLettersInput}
                  className="bg-stone-100 hover:bg-stone-200 text-[#1A2A6C] disabled:opacity-40 font-black px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Appliquer
                </button>
              </div>

              {showCustomRackAlert && (
                <p className="text-[9px] text-[#0B673C] bg-[#0C7645]/10 p-1.5 rounded-md font-black uppercase text-center tracking-wider animate-pulse">
                  Tirage personnalisé appliqué !
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Historic logs card */}
      <div className="relative">
        <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
        
        <div className="relative bg-white border border-gray-100/80 rounded-[28px] p-5 shadow-[0_8px_25px_rgba(212,175,55,0.02)] flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#1A2A6C] border-b border-gray-100 pb-2.5">
            Journal des Coups & Historique de la partie solo
          </h3>

          <div className="overflow-x-auto border border-gray-100/10 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                  <th className="py-2.5 font-bold uppercase text-[9px]">Coup</th>
                  <th className="py-2.5 font-bold uppercase text-[9px]">Tirage</th>
                  <th className="py-2.5 font-bold uppercase text-[9px]">Votre Mot</th>
                  <th className="py-2.5 font-bold uppercase text-[9px] text-right">Points</th>
                  <th className="py-2.5 font-bold uppercase text-[9px]">Coords</th>
                  <th className="py-2.5 font-bold uppercase text-[9px]">Le TOP</th>
                  <th className="py-2.5 font-bold uppercase text-[9px] text-right">Pts TOP</th>
                  <th className="py-2.5 font-bold uppercase text-[9px]">Coords TOP</th>
                  <th className="py-2.5 font-bold uppercase text-[9px] text-right">Écart</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => {
                  const diff = h.topPoints - h.points;
                  return (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-stone-50/50 transition-colors">
                      <td className="py-2.5 font-mono font-black text-stone-500">{h.roundNumber}</td>
                      <td className="py-2.5 font-mono font-black text-[#1A2A6C] tracking-wider">
                        {h.letters}
                        {h.isCustomRack && <span className="ml-1 text-[8px] bg-amber-100 border border-amber-300 text-amber-800 px-1 rounded uppercase">perso</span>}
                      </td>
                      <td className="py-2.5 font-sans font-black text-stone-700">{h.word}</td>
                      <td className="py-2.5 font-mono font-black text-[#1A2A6C] text-right">{h.points}</td>
                      <td className="py-2.5 font-mono text-stone-400">{h.coords}</td>
                      <td className="py-2.5 font-sans font-black text-[#0B673C]">{h.topWord}</td>
                      <td className="py-2.5 font-mono font-black text-[#0B673C] text-right">{h.topPoints}</td>
                      <td className="py-2.5 font-mono text-stone-400">{h.topCoords}</td>
                      <td className="py-2.5 font-mono text-right">
                        {diff === 0 ? (
                          <span className="text-[#0B673C] font-black">TOP</span>
                        ) : (
                          <span className="text-red-500 font-black">-{diff}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-gray-400 italic font-semibold">
                      Aucun coup complété pour le moment. Placez des lettres, valisez votre proposition et analysez vos résultats.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Joker Selection Modal */}
      {jokerSelection && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-md w-full flex flex-col gap-4 animate-scale-up">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Choix de la lettre Joker
              </h4>
              <p className="text-xs text-slate-500">
                Sélectionnez la lettre que ce joker doit représenter (vaut 0 pt).
              </p>
            </div>

            <div className="grid grid-cols-6 gap-2 p-1">
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(char => (
                <button
                  id={`joker-select-train-${char}`}
                  key={char}
                  onClick={() => {
                    const key = `${jokerSelection.r},${jokerSelection.c}`;
                    setTempPlacement(prev => ({
                      ...prev,
                      [key]: char.toLowerCase() // lowercase = Joker
                    }));
                    setJokerSelection(null);
                    setSelectedRackLetter(null);
                  }}
                  className="bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-955 font-black py-2.5 rounded-xl text-center text-sm transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  {char}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setJokerSelection(null);
                setSelectedRackLetter(null);
              }}
              className="mt-1 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer select-none"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
