import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Play, 
  PlusCircle, 
  Users, 
  HelpCircle, 
  Award, 
  ShieldAlert, 
  Share2, 
  Clock, 
  Check, 
  LogOut, 
  RotateCcw, 
  Menu, 
  Sparkles, 
  Info,
  Calendar,
  Layers,
  ArrowRight,
  UserCheck,
  Lock,
  Unlock,
  ArrowLeft,
  ChevronDown,
  Home,
  Settings,
  User,
  Copy
} from 'lucide-react';
import { Tournament, Player, Submission } from './types.js';
import { ScrabbleBoard } from './components/ScrabbleBoard.tsx';
import { ScrabbleRack } from './components/ScrabbleRack.tsx';
import { ConsoleArbitre } from './components/ConsoleArbitre.tsx';
import { TournamentStats } from './components/TournamentStats.tsx';
import { TrainingMode } from './components/TrainingMode.tsx';
import { scorePlacedWord, formatCoordinates, validateWordODS9, PlacementLetter } from './scrabble.js';

export default function App() {
  // Navigation states
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'accueil' | 'creer' | 'rejoindre' | 'salle_attente' | 'partie' | 'stats' | 'entrainement'>('splash');
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Game credentials
  const [roomCode, setRoomCode] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [username, setUsername] = useState<string>('');

  // Active sync tournament data
  const [tournament, setTournament] = useState<Tournament | null>(null);

  // Board temp actions
  const [tempPlacement, setTempPlacement] = useState<{ [key: string]: string }>({});
  const [submittedPlacement, setSubmittedPlacement] = useState<{ [key: string]: string }>({});
  const [selectedRackLetter, setSelectedRackLetter] = useState<{ letter: string; index: number } | null>(null);
  const [jokerSelection, setJokerSelection] = useState<{ r: number; c: number } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: 'Championnat de la Ligue',
    arbitreName: 'Evariste (Arbitre)',
    timerDuration: '120',
    type: 'classic',
    mode: 'hybride',
    maxPlayers: '20',
    drawMode: 'auto'
  });

  const [joinData, setJoinData] = useState({
    code: '',
    pseudo: ''
  });

  // Client side audio alert check to keep track of notification events (unobtrusive UI alerts)
  const [alerts, setAlerts] = useState<string[]>([]);

  // 1. Splash screen animation timer
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if URL has join code direct e.g., ?join=DR-4821
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('join');
      if (codeParam) {
        setJoinData(prev => ({ ...prev, code: codeParam }));
        setCurrentScreen('rejoindre');
      } else {
        setCurrentScreen('accueil');
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // 2. Real-time active pooling from backend
  useEffect(() => {
    if (!roomCode) return;

    let active = true;

    const pullRoomStatus = async () => {
      try {
        const res = await fetch(`/api/tournament/${roomCode}/status`);
        if (!active) return;

        if (res.ok) {
          const data: Tournament = await res.json();
          if (!active) return;
          
          // Clear temporary and submitted letters if next round starts
          if (tournament && data.currentRoundNumber > tournament.currentRoundNumber) {
            setTempPlacement({});
            setSubmittedPlacement({});
            setSelectedRackLetter(null);
            triggerAlert(`Nouveau coup démarré ! Tirage du coup ${data.currentRoundNumber}`);
          }

          // Check for validated TOP publishes
          if (tournament && tournament.currentRoundNumber === data.currentRoundNumber) {
            const oldRound = tournament.rounds[tournament.currentRoundNumber];
            const newRound = data.rounds[data.currentRoundNumber];
            if (oldRound && newRound && oldRound.status !== 'ended' && newRound.status === 'ended') {
              triggerAlert(`TOP validé pour coup ${data.currentRoundNumber} : ${newRound.topWord} (${newRound.topPoints} pts) !`);
            }
          }

          setTournament(data);

          // Force transition to end stats screen if game finished
          if (data.state === 'finished' && currentScreen !== 'stats') {
            setCurrentScreen('stats');
          } else if (data.state === 'playing' && currentScreen === 'salle_attente') {
            setCurrentScreen('partie');
          }
        } else {
          // If 404 Room destroyed
          console.warn(`La salle de jeu ${roomCode} n'existe plus ou a été fermée.`);
          triggerAlert(`La salle de jeu ${roomCode} n'existe plus ou a été fermée.`);
          handleRestartNew();
        }
      } catch (err) {
        console.warn("Failed to pool tournament code", err);
      }
    };

    pullRoomStatus(); // Immediate first pull
    const interval = setInterval(pullRoomStatus, 1500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [roomCode, currentScreen, tournament]);

  // Player online heartbeat pulse
  useEffect(() => {
    if (!roomCode || !playerId) return;

    const pulse = () => {
      fetch(`/api/tournament/${roomCode}/player/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      }).catch(err => console.error(err));
    };

    pulse();
    const interval = setInterval(pulse, 8000);
    return () => clearInterval(interval);
  }, [roomCode, playerId]);



  // Helper to trigger live banners
  const triggerAlert = (message: string) => {
    setAlerts(prev => [...prev, message]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(msg => msg !== message));
    }, 4500);
  };

  // 3. API Handlers
  const handleCreateTournament = async () => {
    try {
      const res = await fetch('/api/tournament/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setRoomCode(data.tournamentCode);
        setPlayerId(data.playerId);
        setTournament(data.tournament);
        setUsername(formData.arbitreName);
        
        setCurrentScreen('salle_attente');
        triggerAlert("Tournoi créé ! En attente des joueurs.");
      } else {
        const err = await res.json();
        alert(err.error || "Erreur de création.");
      }
    } catch (e) {
      console.error(e);
      alert("Impossible de joindre le serveur.");
    }
  };

  const handleJoinTournament = async () => {
    try {
      const res = await fetch('/api/tournament/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: joinData.code,
          username: joinData.pseudo
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRoomCode(data.tournamentCode);
        setPlayerId(data.playerId);
        setUsername(joinData.pseudo);
        
        // Fetch full tournament
        const statusRes = await fetch(`/api/tournament/${data.tournamentCode}/status`);
        const statusData = await statusRes.json();
        setTournament(statusData);

        if (statusData.state === 'playing') {
          setCurrentScreen('partie');
        } else {
          setCurrentScreen('salle_attente');
        }
        triggerAlert(`Bienvenue ${joinData.pseudo}!`);
      } else {
        const err = await res.json();
        alert(err.error || "Impossible de rejoindre la salle.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur réseau backend.");
    }
  };

  // Admin Controls proxied to backend
  const handleAdminDrawLetters = async (letters: string, auto: boolean) => {
    if (!roomCode || !playerId) return;
    try {
      const res = await fetch(`/api/tournament/${roomCode}/admin/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, letters, autoGenerate: auto })
      });
      if (res.ok) {
        const data = await res.json();
        setTournament(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminStartTimer = async () => {
    if (!roomCode || !playerId) return;
    try {
      const res = await fetch(`/api/tournament/${roomCode}/admin/start-timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      if (res.ok) {
        const data = await res.json();
        setTournament(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminPauseTimer = async () => {
    if (!roomCode || !playerId) return;
    try {
      const res = await fetch(`/api/tournament/${roomCode}/admin/pause-timer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      if (res.ok) {
        const data = await res.json();
        setTournament(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminEndRoundEarly = async () => {
    if (!roomCode || !playerId) return;
    try {
      const res = await fetch(`/api/tournament/${roomCode}/admin/end-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      if (res.ok) {
        const data = await res.json();
        setTournament(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminValidateTop = async (word: string, points: number, coords: string) => {
    if (!roomCode || !playerId) return;
    try {
      const res = await fetch(`/api/tournament/${roomCode}/admin/validate-top`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, word, points, coords })
      });
      if (res.ok) {
        const data = await res.json();
        setTournament(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayerAction = async (action: string, targetId?: string, extra?: string) => {
    if (!roomCode || !playerId) return;
    try {
      const res = await fetch(`/api/tournament/${roomCode}/admin/player-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, targetPlayerId: targetId, action, newName: extra })
      });
      if (res.ok) {
        const data = await res.json();
        setTournament(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Player Submit Proposed word
  const handlePlayerSubmitProposed = async (word: string, points: number, coords: string) => {
    if (!roomCode || !playerId) return;
    try {
      const res = await fetch(`/api/tournament/${roomCode}/player/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, word, points, coords })
      });
      if (res.ok) {
        const data = await res.json();
        triggerAlert(`Votre mot "${word}" (${points} pts) a été enregistré.`);
        
        // Keep the submitted placement visible on the board; move tempPlacement to submittedPlacement
        setSubmittedPlacement({ ...tempPlacement });
        setTempPlacement({});
        setSelectedRackLetter(null);
      } else {
        const err = await res.json();
        alert(err.error || "Erreur de validation ODS9.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Interactive Board Grid Click logic (Placement mechanics)
  const activeRound = tournament?.rounds[tournament?.currentRoundNumber];
  const roundLetters = activeRound?.letters || '';

  // Get active rack list with placed letters subtracted (from both temp and submitted placements)
  const getAvailableRackLetters = () => {
    let arr = roundLetters.split('');
    // Combine both placements: submitted letters are locked, temp letters are in-progress
    const allPlaced = { ...submittedPlacement, ...tempPlacement };
    Object.values(allPlaced).forEach(placedLetter => {
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
    const key = `${r},${c}`;
    const hasTempLetter = tempPlacement[key];

    if (hasTempLetter) {
      // Recall letter to rack
      const updated = { ...tempPlacement };
      delete updated[key];
      setTempPlacement(updated);
      setSelectedRackLetter(null);
    } else if (selectedRackLetter) {
      if (selectedRackLetter.letter === '?') {
        // Trigger Selection dialog instead of directly placing '?'
        setJokerSelection({ r, c });
      } else {
        // Place character from selected rack index onto cell
        setTempPlacement(prev => ({
          ...prev,
          [key]: selectedRackLetter.letter
        }));
        setSelectedRackLetter(null);
      }
    }
  };

  const handleSelectRackLetter = (letter: string, index: number) => {
    setSelectedRackLetter(prev => {
      if (prev && prev.index === index) {
        return null; // deselect
      }
      return { letter, index };
    });
  };

  // Shuffle rack characters around (to discover anagrams)
  const handleShuffleLetters = () => {
    if (!activeRound) return;
    const currentList = getAvailableRackLetters().split('');
    // Fisher Yates shuffle
    for (let i = currentList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentList[i], currentList[j]] = [currentList[j], currentList[i]];
    }
    // Rebuild active letters by appending newly shuffeled ones, plus placed ones
    const placedLettersList = Object.values(tempPlacement);
    const rebuiltString = [...currentList, ...placedLettersList].join('');
    // Update local context
    if (tournament && tournament.rounds[tournament.currentRoundNumber]) {
      const updatedTourney = { ...tournament };
      updatedTourney.rounds[tournament.currentRoundNumber].letters = rebuiltString;
      setTournament(updatedTourney);
    }
  };

  const handleRecallAllTemp = () => {
    setTempPlacement({});
    setSelectedRackLetter(null);
  };

  // Remet le coup soumis en mode édition pour permettre une re-soumission
  const handleEditSubmission = () => {
    setTempPlacement({ ...submittedPlacement });
    setSubmittedPlacement({});
    setSelectedRackLetter(null);
  };

  // Reset to original screen
  const handleRestartNew = () => {
    setRoomCode('');
    setPlayerId('');
    setUsername('');
    setTournament(null);
    setTempPlacement({});
    setSubmittedPlacement({});
    setSelectedRackLetter(null);
    setCurrentScreen('accueil');
  };

  // Compute calculated metrics of active placement
  const tempPlacedList: PlacementLetter[] = Object.entries(tempPlacement).map(([key, letter]) => {
    const [r, c] = key.split(',').map(Number);
    return { r, c, letter: letter as string };
  });

  const previewCalc = scorePlacedWord(
    tempPlacedList,
    tournament?.boardState.map(row => row.map(cell => ({ letter: cell.letter }))) || []
  );

  let previewWord = '';
  let previewCoordinatesStr = '';

  if (tempPlacedList.length > 0 && tournament) {
    const sorted = [...tempPlacedList].sort((a, b) => {
      if (a.r === b.r) return a.c - b.c;
      return a.r - b.r;
    });

    const isHorizontal = sorted.every(s => s.r === sorted[0].r);
    const row = sorted[0].r;
    const col = sorted[0].c;
    
    // Find limits
    let startCol = col;
    while (startCol > 0 && (tournament.boardState[row][startCol - 1].letter !== null || tempPlacement[`${row},${startCol - 1}`])) {
      startCol--;
    }
    let endCol = col;
    while (endCol < 14 && (tournament.boardState[row][endCol + 1].letter !== null || tempPlacement[`${row},${endCol + 1}`])) {
      endCol++;
    }

    if (isHorizontal) {
      for (let c = startCol; c <= endCol; c++) {
        previewWord += tempPlacement[`${row},${c}`] || tournament.boardState[row][c].letter || '_';
      }
      previewCoordinatesStr = formatCoordinates(row, startCol, 'H');
    } else {
      let startRow = sorted[0].r;
      while (startRow > 0 && (tournament.boardState[startRow - 1][col].letter !== null || tempPlacement[`${startRow - 1},${col}`])) {
        startRow--;
      }
      let endRow = sorted[0].r;
      while (endRow < 14 && (tournament.boardState[endRow + 1][col].letter !== null || tempPlacement[`${endRow + 1},${col}`])) {
        endRow++;
      }
      for (let r = startRow; r <= endRow; r++) {
        previewWord += tempPlacement[`${r},${col}`] || tournament.boardState[r][col].letter || '_';
      }
      previewCoordinatesStr = formatCoordinates(startRow, col, 'V');
    }
  }

  // Check if player is the designated referee
  const isMeArbitre = tournament?.players[playerId]?.isArbitre || false;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased relative selection:bg-emerald-500 selection:text-white">
      
      {/* Visual background decor blocks */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-900 pointer-events-none" />

      {/* Dynamic Slide notifications */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none max-w-sm sm:max-w-md w-full px-4">
        {alerts.map((msg, idx) => (
          <div key={idx} className="bg-slate-900 text-teal-300 font-black text-xs py-3 px-4 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700/60 pointer-events-auto animate-bounce">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrimp-0" />
            <span>{msg}</span>
          </div>
        ))}
      </div>

      {/* 5. Switch Screens routing */}
      
      {/* A. Splash screen */}
      {currentScreen === 'splash' && (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#FAF7ED] p-6 select-none relative overflow-hidden" id="splash-screen">
          {/* Background elegant gradient blurs */}
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[#D4AF37]/10 rounded-full filter blur-3xl opacity-60" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#0C7645]/5 rounded-full filter blur-3xl opacity-40" />
          
          <div className="z-10 flex flex-col items-center text-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 border-2 border-[#D4AF37]/20 rounded-[32px] translate-x-2 translate-y-2 pointer-events-none" />
              <div className="w-28 h-28 bg-white rounded-[32px] shadow-[0_15px_35px_rgba(212,175,55,0.18)] border border-[#D4AF37]/10 flex items-center justify-center p-1.5">
                <img src="/drlog.png" alt="Logo DupliRoom" className="w-24 h-24 object-contain rounded-[24px]" />
              </div>
            </div>
            
            <div className="mt-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-[#1A2A6C] font-serif">
                DUPLIROOM
              </h1>
              <p className="text-xs font-black tracking-widest text-[#D4AF37] uppercase mt-1.5">
                Salle de Duplicate
              </p>
              <p className="text-[10px] font-semibold text-stone-500 tracking-wider uppercase mt-1.5">
                By EVARISTE GNONSKAN from ASACIS club
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#0C7645]/8 px-4 py-2 rounded-full mt-6">
              <div className="w-2.5 h-2.5 bg-[#0C7645] rounded-full animate-ping" />
              <span className="text-[10px] font-black text-[#0B673C] font-mono uppercase tracking-widest">
                Connexion Fédérale...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* B. Home Screen (Accueil selection) */}
      {currentScreen === 'accueil' && (
        <div className="min-h-screen bg-[#F8F9FA] p-6 text-[#1A2A6C] max-w-xl mx-auto w-full flex flex-col justify-between animate-[fadeIn_0.5s_ease-out]" id="screen-accueil">
          <div>
            {/* Header avec Logo et Ribbon de fond */}
            <div className="flex flex-col items-center mt-8 mb-10 relative">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FAF7ED]/40 to-transparent rounded-full filter blur-2xl opacity-80 -z-10" />
              
              <div className="w-24 h-24 bg-white rounded-[28px] shadow-[0_12px_32px_rgba(212,175,55,0.14)] border border-[#D4AF37]/10 flex items-center justify-center mb-5 p-1">
                <img src="/drlog.png" alt="Logo DupliRoom" className="w-20 h-20 object-contain rounded-[20px]" referrerPolicy="no-referrer" />
              </div>
              
              <h1 className="text-3xl font-extrabold text-[#1A2A6C] tracking-tight text-center font-serif">
                DUPLIROOM
              </h1>
              <p className="text-xs font-black text-[#D4AF37] tracking-widest uppercase mt-1.5">Salle de Duplicate</p>
              <p className="text-[10px] font-semibold text-stone-500 tracking-wider uppercase mt-1.5">By EVARISTE GNONSKAN from ASACIS club</p>
            </div>

            {/* Actions Stack designed with offset luxury panels */}
            <div className="space-y-6 max-w-sm mx-auto">
              {[
                { 
                  title: "Créer un tournoi", 
                  subtitle: "ARBITRE", 
                  icon: <Play className="text-[#D4AF37] fill-[#D4AF37]" size={20} />, 
                  desc: "Gérez les tirages manuels/auto et le chrono.",
                  action: () => setCurrentScreen('creer')
                },
                { 
                  title: "Rejoindre une salle", 
                  subtitle: "JOUEUR", 
                  icon: <Users className="text-[#D4AF37]" size={20} />, 
                  desc: "Saisissez votre pseudo et code de jeu.",
                  action: () => setCurrentScreen('rejoindre')
                },
                { 
                  title: "Entraînement Solo", 
                  subtitle: "ENTRAÎNER", 
                  icon: <Sparkles className="text-[#D4AF37]" size={20} />, 
                  desc: "Progressez seul et comparez-vous au TOP.",
                  action: () => setCurrentScreen('entrainement')
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  {/* Subtle 3D Offset Background Gold Outline */}
                  <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
                  
                  <button 
                    onClick={item.action}
                    className="relative w-full flex items-center p-5 bg-white rounded-[28px] border border-gray-100/80 shadow-[0_8px_25px_rgba(212,175,55,0.03)] hover:shadow-[0_12px_30px_rgba(212,175,55,0.08)] transition-all duration-300 active:scale-[0.98] group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-[#FAF7ED] rounded-[20px] flex items-center justify-center mr-4 group-hover:bg-[#FAF7ED]/80 transition-colors shrink-0">
                      {item.icon}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#1A2A6C]">{item.title}</span>
                        <span className="text-[9px] font-black text-[#FAF7ED] bg-[#D4AF37] px-2 py-0.5 rounded-full">{item.subtitle}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-medium leading-snug">{item.desc}</p>
                    </div>

                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#D4AF37] transition-colors shrink-0 ml-2" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Luxury Native Bottom Navigation Bar */}
          <div className="border-t border-gray-100/60 bg-[#FCFDFD] h-20 -mx-6 -mb-6 mt-12 rounded-b-[40px] px-6 flex items-center justify-between shadow-[0_-5px_25px_rgba(0,0,0,0.015)]">
            {/* 1. Home (Active state in gold) */}
            <div className="flex flex-col items-center justify-center flex-1 cursor-pointer">
              <Home size={22} className="text-[#D4AF37]" />
              <span className="text-[10px] font-black text-[#D4AF37] mt-1">Home</span>
            </div>

            {/* 2. Matches (can direct to Join code) */}
            <button 
              onClick={() => setCurrentScreen('rejoindre')}
              className="flex flex-col items-center justify-center flex-1 cursor-pointer"
            >
              <div className="w-10 h-7 rounded-full bg-[#FAF7ED] border border-[#D4AF37]/45 flex items-center justify-center text-xs font-black text-[#D4AF37] shadow-inner">
                0:0
              </div>
              <span className="text-[10px] font-black text-gray-400 mt-1">Matches</span>
            </button>

            {/* 3. Solo */}
            <button 
              onClick={() => setCurrentScreen('entrainement')}
              className="flex flex-col items-center justify-center flex-1 cursor-pointer"
            >
              <User size={22} className="text-gray-400 hover:text-[#D4AF37] transition-colors" />
              <span className="text-[10px] font-black text-gray-400 mt-1">Solo</span>
            </button>

            {/* 4. Settings */}
            <div className="flex flex-col items-center justify-center flex-1 cursor-pointer opacity-50">
              <Settings size={22} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 mt-1">Settings</span>
            </div>
          </div>
        </div>
      )}

      {/* C. Create Tournament Screen */}
      {currentScreen === 'creer' && (
        <div className="min-h-screen bg-[#F8F9FA] p-6 text-[#1A2A6C] max-w-xl mx-auto w-full flex flex-col justify-between animate-[fadeIn_0.5s_ease-out]" id="screen-creer">
          <div>
            {/* Header / Top Ribbon with Logo Tile */}
            <div className="flex flex-col items-center mt-6 mb-4 relative">
              {/* Background gradient blur */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FAF7ED]/40 to-transparent rounded-full filter blur-2xl opacity-80 -z-10" />
              
              <div className="w-24 h-24 bg-white rounded-[28px] shadow-[0_12px_32px_rgba(212,175,55,0.14)] border border-[#D4AF37]/10 flex items-center justify-center mb-5 p-1">
                <img src="/drlog.png" alt="Logo DupliRoom" className="w-20 h-20 object-contain rounded-[20px]" referrerPolicy="no-referrer" />
              </div>
            </div>

            {/* Display Title with Right-aligned visual plus decoration */}
            <div className="relative text-center mb-8 max-w-md mx-auto">
              <h1 className="text-3xl font-extrabold text-[#1A2A6C] tracking-tight leading-tight font-serif min-h-[72px]">
                Nouveau Tournoi <br /> Duplicate
              </h1>
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-9 h-9 rounded-xl bg-[#FAF7ED] border border-[#D4AF37]/40 flex items-center justify-center text-[#10B981] font-bold text-xl shadow-sm">
                  +
                </div>
              </div>
            </div>

            {/* Form Fields Stack */}
            <div className="space-y-6 max-w-md mx-auto">
              
              {/* 1. Nom du Tournoi */}
              <div className="relative">
                <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
                <div className="relative bg-white px-5 py-4 rounded-[28px] border border-gray-100/80 shadow-[0_8px_25px_rgba(212,175,55,0.03)]">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#1A2A6C]/80 mb-2.5 block text-left">Nom du Tournoi</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-5 py-4 rounded-[20px] bg-[#F1F3F5] text-sm font-bold text-[#1A2A6C] placeholder-gray-400 outline-none border border-transparent focus:border-[#D4AF37]/35 transition-all shadow-inner" 
                    placeholder="Nom du Tournoi" 
                  />
                </div>
              </div>

              {/* 2. FORMULE DU TOURNOI */}
              <div className="relative">
                <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
                <div className="relative bg-white px-5 py-4 rounded-[28px] border border-gray-100/80 shadow-[0_8px_25px_rgba(212,175,55,0.03)] pb-5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#1A2A6C]/80 mb-2.5 block text-left">FORMULE DU TOURNOI</label>
                  <div className="relative">
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-5 py-4 pr-12 rounded-[20px] bg-[#F1F3F5] text-sm font-bold text-[#1A2A6C] outline-none appearance-none cursor-pointer border border-transparent focus:border-[#D4AF37]/35 transition-all shadow-inner"
                    >
                      <option value="classic">Duplicate Classique</option>
                      <option value="rapid">Duplicate Rapide</option>
                      <option value="coydae">Coydae (Fédéral)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Side by Side - TEMPS PAR COUP & MAX JOUEURS */}
              <div className="grid grid-cols-2 gap-4">
                {/* Temps par coup */}
                <div className="relative">
                  <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
                  <div className="relative bg-white px-4 py-4 rounded-[28px] border border-gray-100/80 shadow-[0_8px_25px_rgba(212,175,55,0.03)] h-full flex flex-col justify-between pb-5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#1A2A6C]/80 mb-2 block text-left">TEMPS PAR COUP</label>
                    <div className="relative">
                      <select 
                        value={formData.timerDuration}
                        onChange={(e) => setFormData(prev => ({ ...prev, timerDuration: e.target.value }))}
                        className="w-full px-3 py-3 pr-10 rounded-[20px] bg-[#F1F3F5] text-sm font-bold text-[#1A2A6C] outline-none appearance-none cursor-pointer border border-transparent focus:border-[#D4AF37]/35 transition-all shadow-inner"
                      >
                        <option value="120">2</option>
                        <option value="180">3</option>
                        <option value="90">1.5</option>
                        <option value="60">1</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Max Joueurs */}
                <div className="relative">
                  <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
                  <div className="relative bg-white px-4 py-4 rounded-[28px] border border-gray-100/80 shadow-[0_8px_25px_rgba(212,175,55,0.02)] h-full flex flex-col justify-between pb-5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#1A2A6C]/80 mb-2.5 block text-left">MAX JOUEURS</label>
                    <input 
                      type="number"
                      value={formData.maxPlayers}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxPlayers: e.target.value }))}
                      className="w-full px-3 py-3 rounded-[20px] bg-[#F1F3F5] text-sm font-bold text-[#1A2A6C] outline-none border border-transparent focus:border-[#D4AF37]/35 transition-all shadow-inner" 
                    />
                  </div>
                </div>
              </div>

              {/* 4. RASSLOIR (Organisation Mode) */}
              <div className="relative">
                <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
                <div className="relative bg-white px-5 py-4 rounded-[28px] border border-gray-100/80 shadow-[0_8px_25px_rgba(212,175,55,0.03)] pb-5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#1A2A6C]/80 mb-2.5 block text-left">RASSLOIR</label>
                  <div className="relative">
                    <select 
                      value={formData.mode}
                      onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value as any }))}
                      className="w-full px-4 py-3.5 pr-12 rounded-[20px] bg-[#F1F3F5] text-sm font-bold text-[#1A2A6C] outline-none appearance-none cursor-pointer border border-transparent focus:border-[#D4AF37]/35 transition-all shadow-inner"
                    >
                      <option value="hybride">Joueur</option>
                      <option value="online">En ligne</option>
                      <option value="presentiel">Présentiel</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra functional setups (Pseudo d'arbitre & Generateur de Coup) so referee user remains completely operational */}
              <div className="grid grid-cols-2 gap-4">
                {/* Pseudo de l'arbitre */}
                <div className="relative">
                  <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
                  <div className="relative bg-white p-4 rounded-[28px] border border-gray-100 shadow-[0_4px_15px_rgba(212,175,55,0.02)]">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-[#1A2A6C]/70 mb-1.5 block text-left">Pseudo Arbitre</label>
                    <input 
                      type="text"
                      value={formData.arbitreName}
                      onChange={(e) => setFormData(prev => ({ ...prev, arbitreName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-[16px] bg-[#F1F3F5] text-xs font-bold text-[#1A2A6C] outline-none border border-transparent focus:border-[#D4AF37]/35 transition-all shadow-inner" 
                    />
                  </div>
                </div>

                {/* Générateur de Coups */}
                <div className="relative">
                  <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
                  <div className="relative bg-white p-4 rounded-[28px] border border-gray-100 shadow-[0_4px_15px_rgba(212,175,55,0.02)]">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-[#1A2A6C]/70 mb-1.5 block text-left">Générateur</label>
                    <div className="relative">
                      <select 
                        value={formData.drawMode}
                        onChange={(e) => setFormData(prev => ({ ...prev, drawMode: e.target.value }))}
                        className="w-full px-3 py-2 pr-8 rounded-[16px] bg-[#F1F3F5] text-xs font-bold text-[#1A2A6C] outline-none appearance-none cursor-pointer border border-transparent focus:border-[#D4AF37]/35 transition-all shadow-inner"
                      >
                        <option value="auto">Automatique</option>
                        <option value="manual">Manuel</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Buttons: Annuler (Sand/Amber Gradient) and Créer (Pure Forest Green) */}
            <div className="grid grid-cols-2 gap-4 mt-10 mb-8 max-w-md mx-auto">
              <button 
                onClick={() => setCurrentScreen('accueil')}
                className="py-4 rounded-[24px] bg-gradient-to-r from-[#DFB951] to-[#C09432] text-white hover:brightness-105 active:scale-95 transition-all text-sm font-black tracking-wide shadow-[0_6px_20px_rgba(212,175,55,0.22)] cursor-pointer text-center"
              >
                Annuler
              </button>
              
              <button 
                onClick={handleCreateTournament}
                className="py-4 rounded-[24px] bg-gradient-to-r from-[#0C7645] to-[#065C34] text-white hover:brightness-105 active:scale-95 transition-all text-sm font-black tracking-wide shadow-[0_6px_20px_rgba(8,108,62,0.22)] border border-[#149959]/20 cursor-pointer text-center"
              >
                Créer la salle
              </button>
            </div>
          </div>

          {/* Luxury Native Mobile Bottom Tab Bar */}
          <div className="border-t border-gray-100/60 bg-[#FCFDFD] h-20 -mx-6 -mb-6 mt-12 rounded-b-[40px] px-6 flex items-center justify-between shadow-[0_-5px_25px_rgba(0,0,0,0.015)]">
            {/* 1. Home (Active state in gold) */}
            <button 
              onClick={() => setCurrentScreen('accueil')}
              className="flex flex-col items-center justify-center flex-1 cursor-pointer"
            >
              <Home size={22} className="text-[#D4AF37]" />
              <span className="text-[10px] font-black text-[#D4AF37] mt-1">Home</span>
            </button>

            {/* 2. Matches */}
            <div className="flex flex-col items-center justify-center flex-1 cursor-pointer">
              <div className="w-10 h-7 rounded-full bg-[#FAF7ED] border border-[#D4AF37]/45 flex items-center justify-center text-xs font-black text-[#D4AF37] shadow-inner">
                0:0
              </div>
              <span className="text-[10px] font-black text-gray-400 mt-1">Matches</span>
            </div>

            {/* 3. Solo */}
            <button 
              onClick={() => setCurrentScreen('entrainement')}
              className="flex flex-col items-center justify-center flex-1 cursor-pointer"
            >
              <User size={22} className="text-gray-400 hover:text-[#D4AF37] transition-colors" />
              <span className="text-[10px] font-black text-gray-400 mt-1">Solo</span>
            </button>

            {/* 4. Settings */}
            <div className="flex flex-col items-center justify-center flex-1 cursor-pointer">
              <Settings size={22} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 mt-1">Settings</span>
            </div>
          </div>

        </div>
      )}

      {/* D. Join Tournament Screen */}
      {currentScreen === 'rejoindre' && (
        <div className="min-h-screen bg-[#F8F9FA] p-6 text-[#1A2A6C] max-w-xl mx-auto w-full flex flex-col justify-between animate-[fadeIn_0.5s_ease-out]" id="screen-rejoindre">
          <div>
            {/* Header / Top Ribbon with Logo Tile */}
            <div className="flex flex-col items-center mt-6 mb-4 relative">
              {/* Background gradient blur */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FAF7ED]/45 to-transparent rounded-full filter blur-2xl opacity-80 -z-10" />
              
              <div className="w-24 h-24 bg-white rounded-[28px] shadow-[0_12px_32px_rgba(212,175,55,0.14)] border border-[#D4AF37]/10 flex items-center justify-center mb-5 p-1 relative">
                <img src="/drlog.png" alt="Logo DupliRoom" className="w-20 h-20 object-contain rounded-[20px]" referrerPolicy="no-referrer" />
              </div>
              
              {/* Visual Plus decoration on the left / offset */}
              <button 
                onClick={() => setCurrentScreen('accueil')}
                className="absolute left-2 top-8 w-9 h-9 rounded-xl bg-[#FAF7ED] border border-[#D4AF37]/45 text-[#c19532] font-black text-sm flex items-center justify-center hover:bg-[#FAF7ED]/80 cursor-pointer active:scale-95 transition-all"
                title="Retour"
              >
                <ArrowLeft size={16} />
              </button>

              <div className="absolute right-2 top-8 w-9 h-9 rounded-xl bg-[#FAF7ED] border border-[#D4AF37]/45 text-[#10B981] font-bold text-xl flex items-center justify-center">
                +
              </div>

              <h1 className="text-3xl font-extrabold text-[#1A2A6C] tracking-tight text-center font-serif leading-none mt-2">
                Rejoindre un <br /> Tournoi
              </h1>
              <p className="text-[10px] font-black text-[#D4AF37] tracking-widest uppercase mt-2.5">ESPACE JOUEURS DIRECT</p>
            </div>

            {/* Form Offset Wrapper Box */}
            <div className="relative mt-8">
              {/* Subtle Offset Shadow Overlay */}
              <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
              
              <div className="relative bg-white px-5 py-6 rounded-[28px] border border-gray-100/80 shadow-[0_8px_25px_rgba(212,175,55,0.03)] flex flex-col gap-6">
                
                {/* Pseudo field */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#1A2A6C]/80 mb-2.5 block text-left">
                    Pseudo du Joueur
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={joinData.pseudo}
                      onChange={(e) => setJoinData(prev => ({ ...prev, pseudo: e.target.value }))}
                      placeholder="Ex : Serge, Aminata, Pierre..."
                      className="w-full px-5 py-4 rounded-[20px] bg-[#F1F3F5] text-sm font-bold text-[#1A2A6C] placeholder-gray-400 outline-none border border-transparent focus:border-[#D4AF37]/35 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Code de salle (DR-XXXX) */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#1A2A6C]/80 mb-2.5 block text-left">
                    Code de la Salle (DR-XXXX)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={joinData.code}
                      onChange={(e) => setJoinData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="Ex : DR-4821"
                      className="w-full px-5 py-4 rounded-[20px] bg-[#F1F3F5] text-sm font-mono tracking-widest font-black text-[#1A2A6C] placeholder-gray-400 outline-none border border-transparent focus:border-[#D4AF37]/35 transition-all shadow-inner uppercase"
                    />
                  </div>
                </div>

                {/* Submit Panel Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => setCurrentScreen('accueil')}
                    className="py-4 rounded-[24px] bg-gradient-to-r from-[#DFB951] to-[#C09432] text-white hover:brightness-105 active:scale-95 transition-all text-sm font-black tracking-wide shadow-[0_6px_20px_rgba(212,175,55,0.22)] border border-[#DFB951]/20 cursor-pointer text-center"
                  >
                    Retour l'accueil
                  </button>
                  <button
                    onClick={handleJoinTournament}
                    className="py-4 rounded-[24px] bg-gradient-to-r from-[#0C7645] to-[#065C34] text-white hover:brightness-105 active:scale-95 transition-all text-sm font-black tracking-wide shadow-[0_6px_20px_rgba(8,108,62,0.22)] border border-[#149959]/20 cursor-pointer text-center"
                  >
                    Rejoindre la salle
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Luxury Native Mobile Bottom Tab Bar */}
          <div className="border-t border-gray-100/60 bg-[#FCFDFD] h-20 -mx-6 -mb-6 mt-12 rounded-b-[40px] px-6 flex items-center justify-between shadow-[0_-5px_25px_rgba(0,0,0,0.015)]">
            <button 
              onClick={() => setCurrentScreen('accueil')}
              className="flex flex-col items-center justify-center flex-1 cursor-pointer"
            >
              <Home size={22} className="text-gray-400 hover:text-[#D4AF37] transition-colors" />
              <span className="text-[10px] font-black text-gray-400 mt-1">Home</span>
            </button>

            <div className="flex flex-col items-center justify-center flex-1 cursor-pointer">
              <div className="w-10 h-7 rounded-full bg-[#FAF7ED] border border-[#D4AF37]/45 flex items-center justify-center text-xs font-black text-[#D4AF37] shadow-inner">
                {joinData.code || '0:0'}
              </div>
              <span className="text-[10px] font-black text-[#D4AF37] mt-1">Matches</span>
            </div>

            <button 
              onClick={() => setCurrentScreen('entrainement')}
              className="flex flex-col items-center justify-center flex-1 cursor-pointer"
            >
              <User size={22} className="text-gray-400 hover:text-[#D4AF37] transition-colors" />
              <span className="text-[10px] font-black text-gray-400 mt-1">Solo</span>
            </button>

            <div className="flex flex-col items-center justify-center flex-1 cursor-pointer opacity-50">
              <Settings size={22} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 mt-1">Settings</span>
            </div>
          </div>

        </div>
      )}

      {/* E. Lobby / Wait Screen */}
      {currentScreen === 'salle_attente' && tournament && (
        <div className="min-h-screen bg-[#F8F9FA] p-6 text-[#1A2A6C] max-w-xl mx-auto w-full flex flex-col justify-between animate-[fadeIn_0.5s_ease-out]" id="screen-attente">
          <div>
            {/* Header / Top Ribbon with Logo Tile */}
            <div className="flex flex-col items-center mt-6 mb-4 relative">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FAF7ED]/45 to-transparent rounded-full filter blur-2xl opacity-80 -z-10" />
              
              <div className="w-24 h-24 bg-white rounded-[28px] shadow-[0_12px_32px_rgba(212,175,55,0.14)] border border-[#D4AF37]/10 flex items-center justify-center mb-5 p-1 relative">
                <img src="/drlog.png" alt="Logo DupliRoom" className="w-20 h-20 object-contain rounded-[20px]" referrerPolicy="no-referrer" />
              </div>

              <div className="absolute left-2 top-8 w-18 h-9 rounded-full bg-[#FAF7ED] border border-[#D4AF37]/45 text-[#c19532] font-black text-xs font-mono flex items-center justify-center">
                {tournament.code}
              </div>

              <div className="absolute right-2 top-8 w-9 h-9 rounded-xl bg-[#FAF7ED] border border-[#D4AF37]/45 text-[#10B981] font-bold text-xl flex items-center justify-center animate-pulse">
                •
              </div>

              <h1 className="text-3xl font-extrabold text-[#1A2A6C] tracking-tight text-center font-serif leading-none mt-2">
                Salle d'Attente <br /> Duplicate
              </h1>
              <p className="text-[10px] font-black text-[#D4AF37] tracking-widest uppercase mt-2.5">
                {tournament.name}
              </p>
            </div>

            {/* Main Wait Card Offset Frame */}
            <div className="relative mt-8">
              <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
              
              <div className="relative bg-white px-5 py-6 rounded-[28px] border border-gray-100/80 shadow-[0_8px_25px_rgba(212,175,55,0.03)] flex flex-col gap-5">
                
                {/* Lobby Details Title */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="text-center p-3 bg-[#FAF7ED]/60 rounded-2xl border border-[#D4AF37]/10 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-[9px] font-black text-[#c19532] uppercase tracking-wider">Arbitre principal</span>
                    <p className="text-xs font-black text-[#1A2A6C] truncate max-w-full">{tournament.arbitreName}</p>
                  </div>
                  
                  <div className="text-center p-3 bg-[#FAF7ED]/60 rounded-2xl border border-[#D4AF37]/10 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-[9px] font-black text-[#c19532] uppercase tracking-wider">Code de salle</span>
                    <p className="text-sm font-mono font-extrabold text-[#c19532] tracking-wider select-all">{tournament.code}</p>
                  </div>
                </div>

                {/* Copier & Partager WhatsApp */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col gap-2">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">Partager l'invitation à la salle</div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tournament.code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-[#1A2A6C] shadow-sm transition-all cursor-pointer select-none"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />}
                      <span>{copiedCode ? 'Copié !' : 'Copier le code'}</span>
                    </button>

                    <button
                      onClick={() => {
                        const directUrl = `${window.location.origin}/?join=${tournament.code}`;
                        const text = encodeURIComponent(
                          `Rejoins mon tournoi Duplicate Scrabble "DupliRoom" !\nNom : ${tournament.name}\nCode de salle : ${tournament.code}\nLien direct de connexion : ${directUrl}`
                        );
                        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#25D366] hover:brightness-105 active:scale-95 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer select-none"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Players Connected Area */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-[#1A2A6C]/80">
                      Joueurs connectés
                    </h4>
                    <span className="font-mono bg-[#0C7645]/10 text-[#0B673C] px-3 py-1 font-black rounded-full text-xs animate-pulse">
                      {Object.keys(tournament.players).filter(k => !(tournament.players[k] as Player).isArbitre).length} en ligne
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2.5 max-h-[160px] overflow-auto custom-scrollbar p-1">
                    {(Object.values(tournament.players) as Player[]).filter(p => !p.isArbitre).map(player => (
                      <div key={player.id} className="flex items-center gap-2 bg-[#F1F3F5] p-3 rounded-xl border border-transparent hover:border-[#D4AF37]/10 transition-colors">
                        <span className="w-2.5 h-2.5 bg-[#10B981] rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-[#1A2A6C]">{player.username}</span>
                        {player.id === playerId && (
                          <span className="text-[9px] bg-[#D4AF37] text-white font-black px-1.5 py-0.5 rounded-full ml-auto uppercase tracking-wide">
                            vous
                          </span>
                        )}
                      </div>
                    ))}
                    {(Object.values(tournament.players) as Player[]).filter(p => !p.isArbitre).length === 0 && (
                      <p className="text-xs text-gray-400 py-4 text-center italic font-medium">
                        En attente de connexion des premiers compétiteurs...
                      </p>
                    )}
                  </div>
                </div>

                {/* Start Match Options or Waiting indicators */}
                <div className="border-t border-gray-100 pt-3">
                  {isMeArbitre ? (
                    <button
                      onClick={() => {
                        handleAdminDrawLetters('', true);
                        setCurrentScreen('partie');
                      }}
                      className="w-full py-4 rounded-[24px] bg-gradient-to-r from-[#0C7645] to-[#065C34] text-white hover:brightness-105 active:scale-95 transition-all text-sm font-black tracking-wide shadow-[0_6px_20px_rgba(8,108,62,0.22)] border border-[#149959]/20 cursor-pointer text-center uppercase"
                    >
                      Démarrer la partie (Coup 1)
                    </button>
                  ) : (
                    <div className="text-center py-2 shrink-0 flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-slate-500 font-bold italic">L'arbitre prépare le premier tirage. Veuillez patienter...</p>
                    </div>
                  )}
                </div>

                {/* Exit lobby link */}
                <button
                  onClick={handleRestartNew}
                  className="text-stone-400 hover:text-stone-600 text-[10px] uppercase font-bold text-center flex items-center justify-center gap-1.5 self-center mt-1 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Quitter la salle</span>
                </button>

              </div>
            </div>
          </div>

          {/* Luxury Native Mobile Bottom Tab Bar */}
          <div className="border-t border-gray-100/60 bg-[#FCFDFD] h-20 -mx-6 -mb-6 mt-12 rounded-b-[40px] px-6 flex items-center justify-between shadow-[0_-5px_25px_rgba(0,0,0,0.015)]">
            <button 
              onClick={handleRestartNew}
              className="flex flex-col items-center justify-center flex-1 cursor-pointer"
            >
              <Home size={22} className="text-gray-400 hover:text-[#D4AF37] transition-colors" />
              <span className="text-[10px] font-black text-gray-400 mt-1">Home</span>
            </button>

            <div className="flex flex-col items-center justify-center flex-1 cursor-pointer">
              <div className="w-10 h-7 rounded-full bg-[#FAF7ED] border border-[#D4AF37]/45 flex items-center justify-center text-xs font-black text-[#D4AF37] shadow-inner">
                {tournament.code}
              </div>
              <span className="text-[10px] font-black text-[#D4AF37] mt-1">Matches</span>
            </div>

            <button 
              onClick={() => setCurrentScreen('entrainement')}
              className="flex flex-col items-center justify-center flex-1 cursor-pointer"
            >
              <User size={22} className="text-gray-400 hover:text-[#D4AF37] transition-colors" />
              <span className="text-[10px] font-black text-gray-400 mt-1">Solo</span>
            </button>

            <div className="flex flex-col items-center justify-center flex-1 cursor-pointer opacity-50">
              <Settings size={22} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 mt-1">Settings</span>
            </div>
          </div>

        </div>
      )}

      {/* F. Active Duplicate Game / Console Screen split */}
      {currentScreen === 'partie' && tournament && (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out]" id="screen-partie">
          
          {/* Top Panel stats */}
          <div className="relative">
            {/* Double Frame Offset Shadow */}
            <div className="absolute inset-0 border-2 border-[#D4AF37]/10 rounded-[24px] translate-x-1 translate-y-1 pointer-events-none" />
            
            <div className="relative bg-white border border-gray-100/80 rounded-[24px] p-5 shadow-[0_8px_25px_rgba(212,175,55,0.02)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-[#0C7645] to-[#044c2c] text-[#D4AF37] rounded-xl flex items-center justify-center font-black font-sans text-sm leading-none shrink-0 border border-[#D4AF37]/20 shadow-md">
                  DR
                </span>
                <div className="flex flex-col h-full justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-sm font-black text-[#1A2A6C] leading-none font-serif">{tournament.name}</h2>
                    <span className="text-[9px] tracking-widest font-black text-[#0B673C] bg-[#0C7645]/10 px-2 py-0.5 rounded font-mono uppercase border border-[#0C7645]/10 pl-2.5">
                      {tournament.code}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mt-1">Arbitre : {tournament.arbitreName}</p>
                </div>
              </div>

              {/* Timer visual block */}
              {activeRound && (
                <div className="flex items-center gap-4 border-l border-gray-100 sm:pl-4 flex-wrap">
                  <div className="flex flex-col pr-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Chronomètre</span>
                    <div className="flex items-baseline gap-1 font-mono">
                      <span className={`text-xl sm:text-2xl font-black ${
                        activeRound.status !== 'composing' 
                          ? 'text-zinc-400' 
                          : activeRound.timerLeft < 20 
                            ? 'text-red-500 animate-pulse' 
                            : activeRound.timerLeft < 45
                              ? 'text-amber-500'
                              : 'text-emerald-700'
                      }`}>
                        {Math.floor(activeRound.timerLeft / 60).toString().padStart(2, '0')}:{(activeRound.timerLeft % 60).toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
                        {activeRound.status === 'composing' ? 'live' : activeRound.status === 'validating' ? 'saisie close' : 'attente'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#FAF7ED]/80 p-2 rounded-xl border border-[#D4AF37]/15 flex flex-col px-3.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#c19532]">Pertes relative</span>
                    <span className="text-sm font-black font-mono text-stone-700">-{tournament.players[playerId]?.lostPoints || 0} pts</span>
                  </div>

                  <div className="bg-[#F1F3F5] p-2 rounded-xl border border-transparent flex flex-col px-3.5 min-w-[85px]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Sac de tirage</span>
                    <span className="text-sm font-black font-mono text-[#0B673C]">
                      {tournament.tileBag ? tournament.tileBag.reduce((sum, item) => sum + item.count, 0) : 102} / 102
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* L1. Left pane: Scrabble physics, board and rack */}
            <div className="lg:col-span-8 flex flex-col gap-6">

              {isMeArbitre && (
                <div className="flex gap-4">
                  <button
                    onClick={() => handlePlayerAction('lock')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 border rounded-[20px] text-xs font-black cursor-pointer transition-all ${
                      tournament.locked 
                        ? 'bg-rose-950/20 border-rose-800/60 text-rose-700' 
                        : 'bg-stone-800 hover:bg-stone-700 border-stone-805 text-white shadow-sm'
                    }`}
                  >
                    {tournament.locked ? <Lock className="w-3.5 h-3.5 text-rose-500" /> : <Unlock className="w-3.5 h-3.5 text-[#10B981]" />}
                    <span>{tournament.locked ? 'Salle verrouillée' : 'Verrouiller salle'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Voulez-vous clôturer officiellement le tournoi et publier les classements finaux ?')) {
                        handlePlayerAction('terminate');
                      }
                    }}
                    disabled={tournament.state === 'finished'}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:brightness-105 disabled:opacity-40 text-white font-black px-4 py-3.5 rounded-[20px] text-xs transition-all shadow-md select-none cursor-pointer"
                  >
                    Terminer Tournoi
                  </button>
                </div>
              )}
              
              <ScrabbleBoard
                boardState={tournament.boardState}
                tempPlacement={tempPlacement}
                submittedPlacement={submittedPlacement}
                selectedRackLetter={selectedRackLetter}
                onCellClick={handleCellClick}
                onClearTemp={handleRecallAllTemp}
                letters={roundLetters}
              />

              {activeRound && (
                <ScrabbleRack
                  letters={getAvailableRackLetters()}
                  selectedRackLetter={selectedRackLetter}
                  onSelectLetter={handleSelectRackLetter}
                  onShuffle={handleShuffleLetters}
                  onRecall={handleRecallAllTemp}
                  isArbitre={isMeArbitre}
                  onDrawLetters={handleAdminDrawLetters}
                  tournamentDrawMode={tournament?.drawMode}
                  nextRoundNumber={tournament ? tournament.currentRoundNumber + 1 : 1}
                  isDrawDisabled={activeRound.status !== 'ended'}
                >
                  {!isMeArbitre && (() => {
                    const hasSubmitted = Object.keys(submittedPlacement).length > 0;
                    const isComposing = activeRound.status === 'composing';

                    // Récupérer le mot soumis depuis l'état local
                    const submittedWord = tournament.submissions?.[tournament.currentRoundNumber]?.[playerId];

                    return (
                      <div className={`flex flex-col gap-2 mt-2 rounded-xl p-3 animate-fade-in text-center border ${
                        hasSubmitted && !previewWord
                          ? 'bg-indigo-50/70 border-indigo-200/60'
                          : 'bg-stone-50 border-stone-200/50'
                      }`}>
                        {/* En-tête : mot en cours ou soumis */}
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-stone-600 border-b border-stone-200/40 pb-2 mb-1.5 font-medium select-none">
                          {hasSubmitted && !previewWord ? (
                            <>
                              <span className="flex items-center gap-1.5 font-extrabold text-indigo-700">
                                <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Validé ✓</span>
                                <span className="uppercase tracking-wide">{submittedWord?.word || '—'}</span>
                              </span>
                              <span className="flex items-center gap-1.5 font-mono text-stone-500">
                                <span>Pos: <strong className="text-pink-600 font-extrabold">{submittedWord?.coords || '?'}</strong></span>
                                <span>•</span>
                                <span>Score: <strong className="text-indigo-600 font-extrabold">{submittedWord?.points ?? '?'} pts</strong></span>
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-extrabold text-[#1A2A6C]">
                                COUP {tournament.currentRoundNumber} : {previewWord || 'N/A'}
                              </span>
                              {previewWord && (
                                <span className="flex items-center gap-1.5 font-mono text-stone-500">
                                  <span>Pos: <strong className="text-pink-600 font-extrabold">{previewCoordinatesStr || '?'}</strong></span>
                                  <span>•</span>
                                  <span>Score: <strong className="text-[#0B673C] font-extrabold">{previewCalc.error ? '?' : `${previewCalc.score} pts`}</strong></span>
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Boutons d'action */}
                        {hasSubmitted && !previewWord ? (
                          // Coup soumis : proposer la modification si le temps n'est pas écoulé
                          <button
                            onClick={handleEditSubmission}
                            disabled={!isComposing}
                            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:brightness-105 border border-indigo-400/20 text-white disabled:opacity-40 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow cursor-pointer text-center"
                          >
                            {isComposing ? '✏️ Modifier mon coup' : 'Soumissions closes'}
                          </button>
                        ) : (
                          // Mode édition : bouton de validation
                          <button
                            onClick={() => {
                              if (previewWord.trim().length === 0 || !previewCoordinatesStr) {
                                alert('Veuillez d\'abord positionner vos lettres sur le plateau de jeu.');
                                return;
                              }
                              handlePlayerSubmitProposed(previewWord, previewCalc.score, previewCoordinatesStr);
                            }}
                            disabled={!isComposing}
                            className="w-full bg-gradient-to-r from-[#0C7645] to-[#065C34] hover:brightness-105 border border-[#149959]/15 text-white disabled:opacity-40 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow cursor-pointer text-center"
                          >
                            {!isComposing ? 'Soumissions closes' : hasSubmitted ? '↩ Re-valider mon coup' : 'Valider mon coup'}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </ScrabbleRack>
              )}

            </div>

            {/* L2. Right pane: Live rankings */}
            <div className="lg:col-span-4 flex flex-col gap-6">

              {/* Referee Console inline projection if player is the Judge */}

              {/* Miniature Live Ranking (Classement live) */}
              <div className="relative">
                {/* Offset Golden frame decoration */}
                <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
                
                <div className="relative bg-white border border-gray-100/80 rounded-[28px] p-5 shadow-[0_8px_25px_rgba(212,175,55,0.02)] flex flex-col gap-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <span>Classement Partiel</span>
                    <span className="text-[9px] font-black bg-[#FAF7ED] text-[#D4AF37] py-0.5 px-2.5 rounded-full lowercase italic">
                      en direct
                    </span>
                  </h3>

                  <div className="flex flex-col gap-1">
                    {(Object.values(tournament.players) as Player[])
                      .filter(p => !p.isArbitre)
                      .sort((a, b) => a.lostPoints - b.lostPoints)
                      .map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between text-xs py-2.5 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-[#D4AF37] w-4">{idx + 1}.</span>
                            <span className={`font-bold ${p.id === playerId ? 'text-[#1A2A6C] border-b border-[#D4AF37]/40 pb-0.5' : 'text-slate-700'}`}>
                              {p.username}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 font-mono">
                            <span className="text-stone-400">-{p.lostPoints} pts</span>
                            <span className="text-[#0B673C] font-black">{p.score} pts</span>
                          </div>
                        </div>
                      ))}
                    {(Object.values(tournament.players) as Player[]).filter(p => !p.isArbitre).length === 0 && (
                      <p className="text-slate-400 text-center py-4 italic text-xs font-semibold">Aucun classement de joueur disponible.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Historique des coups */}
              <div className="relative">
                {/* Offset Golden frame decoration */}
                <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
                
                <div className="relative bg-white border border-gray-100/80 rounded-[28px] p-5 shadow-[0_8px_25px_rgba(212,175,55,0.02)] flex flex-col gap-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <span>Historique des Coups</span>
                    <span className="text-[9px] font-black bg-[#0C7645]/10 text-[#0B673C] py-0.5 px-2.5 rounded-full font-sans uppercase">
                      {tournament.moveHistory.length} coup{tournament.moveHistory.length > 1 ? 's' : ''} joué{tournament.moveHistory.length > 1 ? 's' : ''}
                    </span>
                  </h3>

                  <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                    {tournament.moveHistory.length === 0 ? (
                      <p className="text-slate-400 text-center py-6 italic text-xs font-semibold">Le premier coup n'a pas encore été validé.</p>
                    ) : (
                      [...tournament.moveHistory].reverse().map((m) => {
                        const playerSub = !isMeArbitre ? tournament.submissions?.[m.roundNumber]?.[playerId] : null;
                        return (
                          <div key={m.roundNumber} className="flex flex-col gap-1.5 text-xs p-3 bg-stone-50 border border-transparent hover:border-gray-100 rounded-2xl transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-stone-600">Coup {m.roundNumber}</span>
                              <span className="font-mono text-[10px] bg-[#FAF7ED] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded font-black tracking-wider text-[#c19532]">
                                {m.letters}
                              </span>
                            </div>
                            {/* TOP du coup */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37] bg-[#FAF7ED] px-1.5 py-0.5 rounded">TOP</span>
                                <span className="font-black text-[#1A2A6C] tracking-wide uppercase">
                                  {m.word || '—'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="bg-[#0C7645]/10 text-[#0B673C] font-extrabold px-2 py-0.5 rounded text-[10px]">
                                  {m.points} pts
                                </span>
                                <span className="bg-stone-200 text-stone-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                  {m.coords || ''}
                                </span>
                              </div>
                            </div>
                            {/* Mot validé du joueur */}
                            {playerSub && (
                              <div className="flex items-center justify-between border-t border-stone-200/60 pt-1.5 mt-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">MON MOT</span>
                                  <span className={`font-black tracking-wide uppercase ${playerSub.accepted ? 'text-slate-700' : 'text-red-500 line-through'}`}>
                                    {playerSub.word || '—'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className={`font-extrabold px-2 py-0.5 rounded text-[10px] ${playerSub.accepted ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-500'}`}>
                                    {playerSub.points} pts
                                  </span>
                                  {playerSub.loss > 0 && (
                                    <span className="bg-red-50 text-red-500 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                      -{playerSub.loss}
                                    </span>
                                  )}
                                  <span className="bg-stone-200 text-stone-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                    {playerSub.coords || ''}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Reset shortcut */}
              <button
                onClick={handleRestartNew}
                className="text-stone-400 hover:text-stone-600 text-[10px] uppercase font-bold text-center flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Quitter & Retour Accueil</span>
              </button>

            </div>

          </div>
        </div>
      )}

      {/* G. Standings and Exports view */}
      {currentScreen === 'stats' && tournament && (
        <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col gap-5 animate-[fadeIn_0.5s_ease-out]" id="screen-stats">
          <div className="relative">
            {/* 3D Offset Gold Frame */}
            <div className="absolute inset-0 border-2 border-[#D4AF37]/15 rounded-[28px] translate-x-1.5 translate-y-1.5 pointer-events-none" />
            
            <div className="relative bg-[#FAF7ED]/90 backdrop-blur-xs p-5 border border-gray-100/50 rounded-[28px] shadow-[0_8px_30px_rgba(212,175,55,0.02)] flex justify-between items-center gap-4 no-print">
              <h2 className="text-base font-black text-[#1A2A6C] flex items-center gap-2 font-serif uppercase tracking-tight">
                <Trophy className="w-5 h-5 text-[#D4AF37] animate-bounce shrink-0" />
                <span>Fin de Manche — Résultats officiels</span>
              </h2>

              <button
                onClick={handleRestartNew}
                className="bg-gradient-to-r from-[#0C7645] to-[#065C34] text-white rounded-xl text-xs font-black py-2.5 px-4 cursor-pointer hover:brightness-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(8,108,62,0.15)] border border-[#149959]/10 uppercase tracking-wider"
              >
                Nouveau tournoi
              </button>
            </div>
          </div>

          <TournamentStats 
            tournament={tournament} 
            onRestartNew={handleRestartNew} 
          />
        </div>
      )}

      {/* H. Solo Training Mode Screen */}
      {currentScreen === 'entrainement' && (
        <TrainingMode onClose={handleRestartNew} />
      )}

      {/* Joker Selection Modal */}
      {jokerSelection && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-md w-full flex flex-col gap-4">
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
                  id={`joker-select-${char}`}
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
