import React, { useState } from 'react';
import { Tournament, Player, Round } from '../types.js';
import { QRCodeVisual } from './QRCodeVisual.tsx';
import { 
  Play, 
  Pause, 
  Clock, 
  UserMinus, 
  Lock, 
  Unlock, 
  Edit3, 
  Sparkles, 
  RotateCcw, 
  PlusCircle, 
  CheckCircle2, 
  Settings, 
  Share2, 
  AlertTriangle,
  Languages,
  Shuffle,
  ChevronRight
} from 'lucide-react';

// French Scrabble letter point values
const LETTER_POINTS: Record<string, number> = {
  A:1,E:1,I:1,L:1,N:1,O:1,R:1,S:1,T:1,U:1,
  D:2,G:2,M:2,
  B:3,C:3,P:3,
  F:4,H:4,V:4,
  J:8,Q:8,
  K:10,W:10,X:10,Y:10,Z:10,
  '?':0
};

interface ConsoleArbitreProps {
  tournament: Tournament;
  playerId: string;
  onDrawLetters: (letters: string, auto: boolean) => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onEndRoundEarly: () => void;
  onValidateTop: (word: string, points: number, coords: string) => void;
  onPlayerAction: (action: string, targetId?: string, extra?: string) => void;
}

export function ConsoleArbitre({
  tournament,
  playerId,
  onDrawLetters,
  onStartTimer,
  onPauseTimer,
  onEndRoundEarly,
  onValidateTop,
  onPlayerAction,
}: ConsoleArbitreProps) {
  // TOP Input Form
  const [topWord, setTopWord] = useState('');
  const [topPoints, setTopPoints] = useState<number>(0);
  const [topCoords, setTopCoords] = useState('');

  // Draw mode
  const [manualLetters, setManualLetters] = useState('');
  const [drawMode, setDrawMode] = useState<'auto' | 'manual'>('auto');
  const [isDrawing, setIsDrawing] = useState(false);

  // Editing state for rename
  const [isRenaming, setIsRenaming] = useState(false);
  const [customName, setCustomName] = useState(tournament.name);

  const activeRound = tournament.rounds[tournament.currentRoundNumber];
  const roundStatus = activeRound?.status || 'idle';
  const currentLetters = activeRound?.letters || '';

  // Sync TOP fields when round changes
  React.useEffect(() => {
    if (activeRound) {
      if (activeRound.topWord) {
        setTopWord(activeRound.topWord);
        setTopPoints(activeRound.topPoints);
        setTopCoords(activeRound.topCoords);
      } else {
        setTopWord('');
        setTopPoints(0);
        setTopCoords('');
      }
    }
  }, [tournament.currentRoundNumber, activeRound?.topWord]);

  // Copy shareable link helper
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/?join=${tournament.code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Rejoins mon tournoi Duplicate Scrabble "DupliRoom" !\nNom : ${tournament.name}\nCode de salle : ${tournament.code}\nLien direct de connexion : ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDraw = async () => {
    setIsDrawing(true);
    if (drawMode === 'auto') {
      await onDrawLetters('', true);
    } else {
      const cleaned = manualLetters.toUpperCase().replace(/[^A-Z?]/g, '');
      if (cleaned.length < 2) {
        alert('Saisissez au moins 2 lettres.');
        setIsDrawing(false);
        return;
      }
      await onDrawLetters(cleaned, false);
      setManualLetters('');
    }
    setIsDrawing(false);
  };

  // Submissions for active round
  const currentSubmissions = tournament.submissions[tournament.currentRoundNumber] || {};
  const activePlayers = Object.values(tournament.players).filter(p => !p.isArbitre);

  return (
    <div className="flex flex-col gap-5" id="console-arbitre">

      {/* ── Tournoi header compact ── */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex flex-col gap-0.5">
          {isRenaming ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A2A6C] text-[#1A2A6C] font-bold"
              />
              <button
                onClick={() => { onPlayerAction('rename', undefined, customName); setIsRenaming(false); }}
                className="bg-[#1A2A6C] text-white px-2 py-1 rounded text-xs font-bold"
              >OK</button>
            </div>
          ) : (
            <h2 className="text-base font-extrabold text-[#1A2A6C] flex items-center gap-1.5">
              {tournament.name}
              <button onClick={() => setIsRenaming(true)} className="text-slate-400 hover:text-[#1A2A6C] p-0.5 rounded transition-colors">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </h2>
          )}
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Coup {tournament.currentRoundNumber} &nbsp;·&nbsp; {activePlayers.length} joueur(s) &nbsp;·&nbsp; {tournament.code}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onPlayerAction('lock')}
            className={`flex items-center gap-1 px-3 py-1.5 border rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
              tournament.locked
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tournament.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {tournament.locked ? 'Verrouillée' : 'Verrouiller'}
          </button>
          <button
            onClick={() => { if (window.confirm('Clôturer le tournoi ?')) onPlayerAction('terminate'); }}
            disabled={tournament.state === 'finished'}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold rounded-xl text-[11px] transition-all"
          >
            Terminer
          </button>
        </div>
      </div>

      {/* ── Carte Chevalet : tirage du coup ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        <div className="px-5 pt-5 pb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1A2A6C] uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              Tirage — Coup {tournament.currentRoundNumber + 1}
            </h3>
            {/* Mode toggle */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setDrawMode('auto')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${drawMode === 'auto' ? 'bg-white shadow text-[#1A2A6C]' : 'text-slate-400'}`}
              >Auto</button>
              <button
                onClick={() => setDrawMode('manual')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${drawMode === 'manual' ? 'bg-white shadow text-[#1A2A6C]' : 'text-slate-400'}`}
              >Manuel</button>
            </div>
          </div>

          {/* Letter tiles display */}
          {currentLetters.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center py-2">
              {currentLetters.split('').map((letter, i) => (
                <div
                  key={i}
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.18)] select-none"
                  style={{ background: letter === '?' ? '#e2e8f0' : 'linear-gradient(135deg,#f5e79e,#e8ca5c)' }}
                >
                  <span className={`text-lg font-black leading-none ${letter === '?' ? 'text-slate-500' : 'text-[#1A1000]'}`}>
                    {letter === '?' ? '★' : letter}
                  </span>
                  <span className="absolute bottom-0.5 right-1 text-[8px] font-black text-amber-900/70">
                    {LETTER_POINTS[letter] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center py-4 text-xs text-slate-400 italic">
              Aucun tirage pour l'instant — lancez le premier coup.
            </div>
          )}

          {/* Manual input */}
          {drawMode === 'manual' && (
            <input
              type="text"
              value={manualLetters}
              onChange={(e) => setManualLetters(e.target.value.toUpperCase().replace(/[^A-Z?]/g, '').slice(0, 7))}
              placeholder="Ex : AEINRTS"
              maxLength={7}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-black tracking-widest uppercase text-[#1A2A6C] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-center"
            />
          )}

          {/* Draw button */}
          <button
            onClick={handleDraw}
            disabled={isDrawing || tournament.state === 'finished'}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm tracking-wide transition-all disabled:opacity-40 shadow-md active:scale-[.98] select-none"
            style={{ background: 'linear-gradient(135deg,#1A2A6C,#2a3d8c)', color: '#D4AF37' }}
          >
            <Shuffle className="w-4 h-4" />
            {isDrawing
              ? 'Tirage en cours...'
              : currentLetters.length > 0
                ? 'Nouveau tirage (coup suivant)'
                : 'Lancer le coup 1'}
          </button>
        </div>
      </div>

      {/* ── Déclarer le TOP ── */}
      {tournament.currentRoundNumber > 0 && activeRound && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            TOP du Coup {tournament.currentRoundNumber}
          </h3>

          <div className="bg-gradient-to-br from-indigo-50/40 to-cyan-50/30 p-4 rounded-2xl border border-indigo-100/50 flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mot</span>
                <input
                  type="text"
                  value={topWord}
                  onChange={(e) => setTopWord(e.target.value.toUpperCase())}
                  placeholder="TRAINES"
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black uppercase text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Points</span>
                <input
                  type="number"
                  value={topPoints || ''}
                  onChange={(e) => setTopPoints(Number(e.target.value))}
                  placeholder="74"
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Coords</span>
                <input
                  type="text"
                  value={topCoords}
                  onChange={(e) => setTopCoords(e.target.value.toUpperCase())}
                  placeholder="H8"
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="text-[10px] text-indigo-800 leading-normal bg-indigo-50 px-3 py-2 rounded-xl flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />
              <span>
                Publie le mot TOP sur tous les plateaux, arrête le chrono, calcule les écarts et archive le coup.
              </span>
            </div>

            <button
              onClick={() => {
                if (topWord.trim().length === 0 || isNaN(topPoints) || topCoords.trim().length === 0) {
                  alert('Renseignez le mot, les points et les coordonnées du TOP.');
                  return;
                }
                onValidateTop(topWord, topPoints, topCoords);
                setTopWord(''); setTopPoints(0); setTopCoords('');
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-300 font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md select-none border border-indigo-950/20"
            >
              Jouer &amp; Publier le TOP
            </button>
          </div>
        </div>
      )}

      {/* ── Joueurs connectés ── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex flex-col gap-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-700" />
          Joueurs ({activePlayers.length})
        </h3>

        <div className="flex flex-col gap-2 max-h-[200px] overflow-auto pr-1">
          {activePlayers.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-2xl text-xs text-slate-400 font-medium">
              Aucun joueur connecté pour le moment.
            </div>
          ) : (
            activePlayers.map((player) => {
              const playerSub = currentSubmissions[player.id];
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${player.active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{player.username}</span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">{player.score} pts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tournament.currentRoundNumber > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        playerSub ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-50 text-yellow-800 animate-pulse'
                      }`}>
                        {playerSub ? 'Pris' : 'En saisie…'}
                      </span>
                    )}
                    <button
                      onClick={() => { if (window.confirm(`Expulser ${player.username} ?`)) onPlayerAction('kick', player.id); }}
                      className="text-stone-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-all"
                      title="Expulser"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Invitation QR ── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-center gap-5">
        <div className="shrink-0">
          <QRCodeVisual value={tournament.code} size={100} />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Partager l'invitation</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Partagez le lien direct ou donnez le code aux joueurs.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <button
              onClick={copyLink}
              className={`px-3 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                copied ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? 'Lien copié !' : 'Copier le lien'}
            </button>
            <button
              onClick={shareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Languages className="w-3.5 h-3.5" />
              WhatsApp
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
