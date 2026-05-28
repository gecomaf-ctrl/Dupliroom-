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
  History,
  Languages
} from 'lucide-react';

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

  // Editing state for rename
  const [isRenaming, setIsRenaming] = useState(false);
  const [customName, setCustomName] = useState(tournament.name);

  const activeRound = tournament.rounds[tournament.currentRoundNumber];
  const roundStatus = activeRound?.status || 'idle';

  // Automatically update the input fields with the pre-loaded solver's top plays
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

  // Submissions for active round
  const currentSubmissions = tournament.submissions[tournament.currentRoundNumber] || {};
  const activePlayers = Object.values(tournament.players).filter(p => !p.isArbitre);

  return (
    <div className="flex flex-col gap-6" id="console-arbitre">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-1.5 z-10 w-full">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 font-mono text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
              Console Arbitre Principale
            </span>
            <span className={`text-[10px] uppercase font-bold py-0.5 px-2 rounded ${
              tournament.state === 'finished' ? 'bg-zinc-700 text-zinc-200' : 'bg-emerald-600/30 text-emerald-400'
            }`}>
              Mode {tournament.mode}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {isRenaming ? (
              <div className="flex items-center gap-2 w-full max-w-sm">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="bg-slate-800 text-white border border-emerald-600 rounded-lg px-2 py-1 text-sm focus:outline-none"
                />
                <button
                  onClick={() => {
                    onPlayerAction('rename', undefined, customName);
                    setIsRenaming(false);
                  }}
                  className="bg-emerald-500 text-slate-950 px-2 py-1 rounded text-xs font-bold"
                >
                  OK
                </button>
              </div>
            ) : (
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                {tournament.name}
                <button 
                  onClick={() => setIsRenaming(true)}
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                  title="Renommer le tournoi"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </h2>
            )}
          </div>
          <p className="text-xs text-slate-400">Arbitré en direct par : <strong className="text-slate-200">{tournament.arbitreName}</strong></p>
        </div>

        <div className="shrink-0 flex gap-2 z-10 w-full md:w-auto">
          <button
            onClick={() => onPlayerAction('lock')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              tournament.locked 
                ? 'bg-rose-950/40 border-rose-800 text-rose-200' 
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {tournament.locked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{tournament.locked ? 'Salle verrouillée' : 'Verrouiller salle'}</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Voulez-vous clôturer officiellement le tournoi et publier les classements finaux ?')) {
                onPlayerAction('terminate');
              }
            }}
            disabled={tournament.state === 'finished'}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md select-none"
          >
            Terminer tournoi
          </button>
        </div>
      </div>

      {/* 2. Main Work Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Coup / Timer Controls */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Section: Déclarer le TOP du coup */}
          {tournament.currentRoundNumber > 0 && activeRound && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                Déclarer / Publier le TOP du Coup {tournament.currentRoundNumber}
              </h3>

              <div className="bg-linear-to-br from-indigo-50/40 to-cyan-50/30 p-4 rounded-2xl border border-indigo-100/50 flex flex-col gap-3">
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
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Coords (e.g. H8)</span>
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
                    La publication du TOP placera officieusement le mot sur tous les plateaux des joueurs, arrêtera définitivement le chrono, calculera les pertes (points perdus = TOP - score joueur), et effectuera l'archivage.
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (topWord.trim().length === 0 || isNaN(topPoints) || topCoords.trim().length === 0) {
                      alert('Veuillez renseigner le mot, les points et l\'emplacement (coordonnées) du TOP.');
                      return;
                    }
                    onValidateTop(topWord, topPoints, topCoords);
                    // Clear fields
                    setTopWord('');
                    setTopPoints(0);
                    setTopCoords('');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-300 font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md select-none border border-indigo-950/20"
                >
                  <span>Jouer & Publier le TOP</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Invitations directes */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-center gap-5">
            <div className="shrink-0">
              <QRCodeVisual value={tournament.code} size={110} />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Partager l'invitation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Les joueurs rejoignent sur téléphone ou ordinateur. Partagez le lien direct ou donnez le code à saisir.
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <button
                  onClick={copyLink}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                    copied 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? 'Lien copié !' : 'Copier le lien'}</span>
                </button>

                <button
                  onClick={shareWhatsApp}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Active Player List & Submissions tracker */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Section: Joueurs Connectés */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-700" />
                Joueurs Connectés ({activePlayers.length})
              </h3>
            </div>

            <div className="flex flex-col gap-2 max-h-[220px] overflow-auto custom-scrollbar pr-1">
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
                        <span className={`w-2 h-2 rounded-full ${
                          player.active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'
                        }`} />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{player.username}</span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold">Points cumulés : {player.score}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Status tag */}
                        {tournament.currentRoundNumber > 0 && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            playerSub 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-yellow-50 text-yellow-800 animate-pulse'
                          }`}>
                            {playerSub ? 'Pris' : 'En saisie...'}
                          </span>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Expulser le joueur ${player.username} définitivement ?`)) {
                              onPlayerAction('kick', player.id);
                            }
                          }}
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

          {/* Section: Audit & Logs panel */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              Journal de l'Arbitre (Audit Logs)
            </h3>

            <div className="bg-zinc-900 rounded-2xl p-4 text-xs font-mono text-zinc-300 max-h-[220px] overflow-auto custom-scrollbar flex flex-col gap-2 shadow-inner border border-zinc-950">
              {tournament.auditLogs.length === 0 ? (
                <div className="text-zinc-500 text-center py-4 italic">Aucun log enregistré.</div>
              ) : (
                tournament.auditLogs.map((log, index) => {
                  const logTime = new Date(log.timestamp).toLocaleTimeString('fr-FR');
                  let colorClass = 'text-green-400';
                  if (log.type === 'warning') colorClass = 'text-yellow-400';
                  if (log.type === 'error' || log.type === 'security') colorClass = 'text-pink-400';

                  return (
                    <div key={index} className="flex gap-2 divide-x divide-zinc-800/85 text-[11px] leading-tight select-text">
                      <span className="text-zinc-500 shrink-0 select-none pr-1.5">{logTime}</span>
                      <p className={`pl-1.5 ${colorClass}`}>{log.message}</p>
                    </div>
                  );
                })
              ).reverse()}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
