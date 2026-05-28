import React from 'react';
import { Tournament, Player, MoveHistory } from '../types.js';
import { 
  Trophy, 
  Printer, 
  FileSpreadsheet, 
  BookOpen, 
  TrendingUp, 
  Sparkles, 
  Award,
  ArrowRight,
  ListOrdered,
  RotateCcw
} from 'lucide-react';

interface TournamentStatsProps {
  tournament: Tournament;
  onRestartNew?: () => void;
}

export function TournamentStats({ tournament, onRestartNew }: TournamentStatsProps) {
  const playersList = Object.values(tournament.players).filter(p => !p.isArbitre);

  // Score duplicate rules: Rank players by "plus faible perte totale" (lowest accumulated loss)
  // Second criterion is max score gathered.
  const rankedPlayers = [...playersList].sort((a, b) => {
    if (a.lostPoints !== b.lostPoints) {
      return a.lostPoints - b.lostPoints; // lower is better
    }
    return b.score - a.score; // higher points as fallback
  });

  // Calculate some aggregate statistics as request (V2 and Sprint 5 stats)
  // 1. Calculate how many TOPs each player hit:
  const getTopsCount = (p: Player) => {
    let count = 0;
    Object.keys(p.roundLosses).forEach(roundNum => {
      if (p.roundLosses[Number(roundNum)] === 0) {
        count++;
      }
    });
    return count;
  };

  // 2. Average loss per round:
  const getAverageLoss = (p: Player) => {
    const roundsPlayed = Object.keys(p.roundLosses).length;
    if (roundsPlayed === 0) return 0;
    return Math.round((p.lostPoints / roundsPlayed) * 10) / 10;
  };

  // Trigger Excel CSV export 
  const exportCSV = () => {
    const headers = ['Rang', 'Joueur', 'Points Cumules', 'Pertes Cumules', 'TOPs Trouves', 'Moyenne Perte'];
    const rows = rankedPlayers.map((p, i) => [
      i + 1,
      p.username,
      p.score,
      p.lostPoints,
      getTopsCount(p),
      getAverageLoss(p)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DupliRoom_Resultats_${tournament.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger print document (flawlessly aligned via CSS print rules)
  const triggerPrint = () => {
    window.print();
  };

  const totalPossibleRounds = tournament.currentRoundNumber;

  return (
    <div className="flex flex-col gap-6" id="stats-tournoi">
      {/* Printable CSS style container */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Print Wrapper */}
      <div id="print-area" className="flex flex-col gap-6">

        {/* Podium Top 3 celebration */}
        {rankedPlayers.length > 0 && (
          <div className="bg-gradient-to-tr from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden select-none">
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <Trophy className="w-12 h-12 text-amber-400 mb-2 animate-bounce mt-1" />
            <h2 className="text-xl font-bold tracking-tight mb-4">Classement Général de la Manche</h2>

            {/* Visual Podium blocks layout */}
            <div className="flex items-end justify-center gap-4 sm:gap-8 mt-4 w-full max-w-md">
              {/* 2nd Place */}
              {rankedPlayers[1] && (
                <div className="flex flex-col items-center flex-1">
                  <span className="text-[10px] uppercase font-bold text-slate-300 truncate max-w-full text-center pb-1">
                    🥈 {rankedPlayers[1].username}
                  </span>
                  <div className="bg-slate-700/80 w-full h-16 rounded-t-xl flex flex-col items-center justify-center text-xs font-black shadow border-t border-slate-600/50">
                    <span className="text-stone-300">- {rankedPlayers[1].lostPoints} pts</span>
                    <span className="text-[9px] text-zinc-400 font-mono mt-0.5">{rankedPlayers[1].score} pts</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {rankedPlayers[0] && (
                <div className="flex flex-col items-center flex-1">
                  <Award className="w-5 h-5 text-amber-300 mb-0.5 animate-pulse" />
                  <span className="text-xs uppercase font-extrabold text-amber-300 truncate max-w-full text-center pb-1">
                    🥇 {rankedPlayers[0].username}
                  </span>
                  <div className="bg-amber-500/90 w-full h-22 rounded-t-xl flex flex-col items-center justify-center text-sm font-black text-slate-950 shadow-lg border-t-2 border-amber-300">
                    <span>- {rankedPlayers[0].lostPoints} pts</span>
                    <span className="text-[10px] text-amber-950 font-mono mt-0.5">{rankedPlayers[0].score} pts</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {rankedPlayers[2] && (
                <div className="flex flex-col items-center flex-1">
                  <span className="text-[10px] uppercase font-bold text-amber-600/90 truncate max-w-full text-center pb-1">
                    🥉 {rankedPlayers[2].username}
                  </span>
                  <div className="bg-yellow-750/70 w-full h-12 rounded-t-xl flex flex-col items-center justify-center text-xs font-black text-amber-100 shadow border-t border-yellow-700/50">
                    <span>- {rankedPlayers[2].lostPoints} pts</span>
                    <span className="text-[9px] text-yellow-200/50 font-mono mt-0.5">{rankedPlayers[2].score} pts</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Panel for export (Hides in print area automatically) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm no-print">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-bold text-slate-800">Partager & Sauvegarder les Fiches</h3>
            <p className="text-xs text-slate-500">Exporter les fiches de score pour l'homologation de la manche.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold py-2 px-3.5 rounded-xl border border-slate-200 shadow-sm cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Exporter Excel / CSV</span>
            </button>

            <button
              onClick={triggerPrint}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-teal-300 text-xs font-extrabold py-2 px-3.5 rounded-xl border border-teal-950 shadow-md cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimer la Fiche (PDF)</span>
            </button>
          </div>
        </div>

        {/* Standings Table Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 px-0.5">
            <ListOrdered className="w-4 h-4 text-emerald-700" />
            Classement du Tournoi (Duplicate Standard)
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="py-3 px-4 text-center w-12">Rang</th>
                  <th className="py-3 px-4 text-left">Pseudo</th>
                  <th className="py-3 px-4 text-right">Points Gagnés</th>
                  <th className="py-3 px-4 text-right">Pertes Cumulées</th>
                  <th className="py-3 px-4 text-center">TOPs Trouvés</th>
                  <th className="py-3 px-4 text-right">Perte Moyenne</th>
                  <th className="py-3 px-4 text-right">Précision (% du Top)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rankedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">Aucun joueur dans la manche.</td>
                  </tr>
                ) : (
                  rankedPlayers.map((p, index) => {
                    const tops = getTopsCount(p);
                    const avgLoss = getAverageLoss(p);
                    const maxScore = Object.values(tournament.rounds).reduce((sum, r) => sum + r.topPoints, 0);
                    const accuracy = maxScore > 0 ? Math.round((p.score / maxScore) * 100) : 100;

                    let rankEmoji = '';
                    if (index === 0) rankEmoji = '🥇';
                    else if (index === 1) rankEmoji = '🥈';
                    else if (index === 2) rankEmoji = '🥉';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-center">
                          {rankEmoji ? rankEmoji : `${index + 1}`}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">{p.username}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">{p.score} pt</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-500">
                          {p.lostPoints === 0 ? '0 (TOP)' : `-${p.lostPoints}`}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full font-mono">
                            {tops} / {totalPossibleRounds}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-500">-{avgLoss} pt</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[11px] text-slate-600">{accuracy}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                              <div className="bg-emerald-600 h-full" style={{ width: `${accuracy}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Round to Round Archive Details ("Historique tournoi") */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 px-0.5">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            Historique & Archive des Coups
          </h3>

          <div className="flex flex-col gap-3">
            {tournament.moveHistory.length === 0 ? (
              <div className="text-slate-400 py-6 text-center text-xs">Aucun coup n'a été complété dans l'historique pour le moment.</div>
            ) : (
              tournament.moveHistory.map((m, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 last:border-b-0 pb-3 last:pb-0 gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 bg-zinc-900 text-amber-400 font-black text-xs flex items-center justify-center rounded-xl font-mono shrink-0 select-none">
                      #{m.roundNumber}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-950 uppercase tracking-widest">{m.word}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs text-indigo-700 font-black tracking-wider uppercase font-mono">{m.coords}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs font-mono font-bold text-emerald-800">+{m.points} pts</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Tirage : {m.letters}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] sm:text-right text-slate-400 font-medium">
                    <div className="flex flex-col">
                      <span>Placé par : <strong>L'Arbitre</strong></span>
                      <span>Formule : Duplicate Classique</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reset system trigger */}
        {onRestartNew && (
          <div className="flex justify-center mt-2 no-print">
            <button
              onClick={onRestartNew}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 py-2.5 px-6 font-bold text-xs rounded-2xl transition-all border border-slate-200 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Créer / Faire un autre tournoi</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
