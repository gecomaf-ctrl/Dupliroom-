import React, { useState } from 'react';
import { FRENCH_LETTER_VALUES } from '../scrabble.js';
import { Shuffle, HelpCircle, ArrowDownToLine, PlusCircle } from 'lucide-react';

interface ScrabbleRackProps {
  letters: string; // e.g. "AEINRTS"
  selectedRackLetter: { letter: string; index: number } | null;
  onSelectLetter: (letter: string, index: number) => void;
  onShuffle: () => void;
  onRecall: () => void;
  isArbitre?: boolean;
  onDrawLetters?: (letters: string, auto: boolean) => void;
  tournamentDrawMode?: 'auto' | 'manual';
  nextRoundNumber?: number;
  isDrawDisabled?: boolean;
  children?: React.ReactNode;
}

export function ScrabbleRack({
  letters = '',
  selectedRackLetter,
  onSelectLetter,
  onShuffle,
  onRecall,
  isArbitre = false,
  onDrawLetters,
  tournamentDrawMode = 'auto',
  nextRoundNumber = 1,
  isDrawDisabled = false,
  children,
}: ScrabbleRackProps) {
  const rackTiles = letters.split('');
  const [manualInput, setManualInput] = useState('');

  return (
    <div className="flex flex-col gap-2.5 bg-gradient-to-b from-stone-100 to-stone-200/60 p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-md" id="votre-chevalet">
      {/* Title block */}
      <div className="flex items-center justify-between text-xs font-semibold text-stone-600 tracking-wide uppercase px-1 select-none">
        <span className="flex items-center gap-1.5">
          <SquarePower className="w-4 h-4 text-emerald-700" />
          Votre chevalet (Rack)
        </span>
        <span className="text-[10px] bg-stone-300/60 px-2 py-0.5 rounded-full lowercase font-normal italic">
          {rackTiles.length} lettres restantes
        </span>
      </div>

      {/* Wooden rack board container */}
      <div className="bg-amber-800/90 border-t border-amber-700 shadow-lg rounded-xl p-3 sm:p-4 px-4 sm:px-6 relative flex flex-col items-center justify-center">
        {/* Physical ledge */}
        <div className="flex items-center gap-2 sm:gap-3 py-1 relative z-10 flex-wrap justify-center">
          {rackTiles.map((letter, index) => {
            const isSelected = selectedRackLetter !== null && selectedRackLetter.index === index;
            const points = FRENCH_LETTER_VALUES[letter.toUpperCase()] || 0;

            return (
              <button
                key={`${letter}-${index}`}
                onClick={() => onSelectLetter(letter, index)}
                className={`w-11 h-11 sm:w-13 sm:h-13 bg-linear-to-b from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 rounded-lg cursor-pointer flex flex-col items-center justify-center relative font-sans select-none shadow border transition-all ${
                  isSelected 
                    ? 'ring-3 ring-emerald-500 scale-[1.08] -translate-y-2 bg-emerald-50 border-emerald-300 font-extrabold z-20 shadow-lg' 
                    : 'border-b-4 border-amber-300 hover:-translate-y-0.5 shadow-md active:translate-y-0 active:border-b-2'
                }`}
              >
                {/* Central character display */}
                <span className="text-[18px] sm:text-[22px] font-black leading-none text-amber-950 tracking-wide">
                  {letter === '?' ? '' : letter}
                </span>

                {/* Scrabble point value corner indicator */}
                <span className="absolute bottom-[3px] right-[4.5px] text-[8px] sm:text-[9px] font-mono leading-none font-bold text-amber-900/60">
                  {points > 0 ? points : ''}
                </span>

                {letter === '?' && (
                  <HelpCircle className="w-5 h-5 absolute text-amber-700 opacity-20" />
                )}
              </button>
            );
          })}
        </div>

        {/* Physical shadow line bottom rack */}
        <div className="absolute bottom-1 left-0 right-0 h-2.5 bg-amber-950/40 rounded-b-xl z-0" />
      </div>

      {/* Arbitre actions underneath physical rack */}
      {isArbitre && onDrawLetters && (
        <div className="mt-1 flex flex-col gap-2 items-center justify-center">
          {tournamentDrawMode === 'manual' ? (
            <div className="w-full max-w-sm bg-white/95 border border-slate-200/60 rounded-xl p-3 flex flex-col gap-1.5 shadow-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Tirage Manuel de Lettres</span>
                <span className="text-[9px] text-slate-400 italic">Saisissez les lettres pour le Coup {nextRoundNumber} (ex: AEINRTS)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  disabled={isDrawDisabled}
                  onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                  placeholder="AEINRTS"
                  maxLength={15}
                  className="flex-1 bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                />
                <button
                  disabled={isDrawDisabled}
                  onClick={() => {
                    if (manualInput.trim().length === 0) {
                      alert('Veuillez saisir des lettres pour le tirage.');
                      return;
                    }
                    onDrawLetters(manualInput, false);
                    setManualInput('');
                  }}
                  className={`font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer select-none ${
                    isDrawDisabled 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50' 
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  }`}
                  title={isDrawDisabled ? "Le coup actuel n'est pas encore fini." : ""}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Confirmer</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              disabled={isDrawDisabled}
              onClick={() => onDrawLetters('', true)}
              className={`w-full max-w-xs flex items-center justify-center gap-1.5 font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm select-none ${
                isDrawDisabled
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
              }`}
              title={isDrawDisabled ? "Le coup actuel n'est pas encore fini." : ""}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouveau tirage (Coup {nextRoundNumber})</span>
            </button>
          )}
        </div>
      )}

      {/* Action buttons below rack */}
      {!isArbitre && (
        <div className="flex flex-col gap-2 mt-1 sm:mt-2">
          <button
            onClick={onRecall}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 transition-all font-semibold py-2 px-3 rounded-xl border border-stone-200 text-xs shadow-xs"
            title="Faire revenir toutes les lettres non validées"
          >
            <ArrowDownToLine className="w-4.5 h-4.5 text-emerald-800" />
            <span>Rappeler tout</span>
          </button>
          {children}
        </div>
      )}
    </div>
  );
}

// Inline support definition
function SquarePower({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 17V7h4v5H7" />
      <path d="m13 13 4 4" />
      <path d="m17 13-4 4" />
    </svg>
  );
}
