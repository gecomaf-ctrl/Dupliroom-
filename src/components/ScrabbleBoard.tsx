import React, { useState } from 'react';
import { BoardCell, Tournament } from '../types.js';
import { getCellMultiplier, ALPHABET, scorePlacedWord, formatCoordinates, getLetterPoints } from '../scrabble.js';
import { RotateCw, SquarePower, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ScrabbleBoardProps {
  boardState: BoardCell[][];
  tempPlacement: { [key: string]: string }; // "r,c" -> letter
  submittedPlacement?: { [key: string]: string }; // "r,c" -> letter (locked after submission)
  selectedRackLetter: { letter: string; index: number } | null;
  onCellClick: (r: number, c: number) => void;
  onClearTemp: () => void;
  letters: string; // current round letters
}

export function ScrabbleBoard({
  boardState,
  tempPlacement,
  submittedPlacement = {},
  selectedRackLetter,
  onCellClick,
  onClearTemp,
  letters
}: ScrabbleBoardProps) {
  const [zoom, setZoom] = useState<number>(1.0);

  // Simple zoom buttons
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.7));

  // Build temporary 15x15 board to compute preview scores
  const previewGrid = boardState.map((row, r) =>
    row.map((cell, c) => {
      const key = `${r},${c}`;
      const tempLetter = tempPlacement[key];
      const submittedLetter = submittedPlacement[key];
      const activeLetter = tempLetter || submittedLetter;
      return {
        letter: activeLetter || cell.letter,
        isTemp: !!tempLetter,
        isSubmitted: !tempLetter && !!submittedLetter,
        isTop: cell.isTopLetter,
        roundPlaced: cell.roundPlaced
      };
    })
  );

  // Compute stats of placed word
  const placedList = Object.entries(tempPlacement).map(([key, letter]) => {
    const [r, c] = key.split(',').map(Number);
    return { r, c, letter };
  });

  const calculation = scorePlacedWord(
    placedList,
    boardState.map(row => row.map(cell => ({ letter: cell.letter })))
  );

  // Discover coordinate and orientation
  let currentCoordinatesStr = '-';
  if (placedList.length > 0) {
    const rows = placedList.map(p => p.r);
    const cols = placedList.map(p => p.c);
    const minR = Math.min(...rows);
    const minC = Math.min(...cols);
    const isHorizontal = rows.every(r => r === rows[0]);
    currentCoordinatesStr = formatCoordinates(minR, minC, isHorizontal ? 'H' : 'V');
  }

  // Generate word string
  let formedWord = '';
  if (placedList.length > 0) {
    // Sort placed list by position to form the spelling string
    const sorted = [...placedList].sort((a, b) => {
      if (a.r === b.r) return a.c - b.c;
      return a.r - b.r;
    });

    // Let's expand horizontally/vertically to match formed word
    const isHorizontal = sorted.every(s => s.r === sorted[0].r);
    const row = sorted[0].r;
    const col = sorted[0].c;

    if (isHorizontal) {
      // Find limits
      let startCol = col;
      while (startCol > 0 && (boardState[row][startCol - 1].letter !== null || tempPlacement[`${row},${startCol - 1}`])) {
        startCol--;
      }
      let endCol = col;
      while (endCol < 14 && (boardState[row][endCol + 1].letter !== null || tempPlacement[`${row},${endCol + 1}`])) {
        endCol++;
      }
      for (let c = startCol; c <= endCol; c++) {
        formedWord += tempPlacement[`${row},${c}`] || boardState[row][c].letter || '_';
      }
    } else {
      let startRow = row;
      while (startRow > 0 && (boardState[startRow - 1][col].letter !== null || tempPlacement[`${startRow - 1},${col}`])) {
        startRow--;
      }
      let endRow = row;
      while (endRow < 14 && (boardState[endRow + 1][col].letter !== null || tempPlacement[`${endRow + 1},${col}`])) {
        endRow++;
      }
      for (let r = startRow; r <= endRow; r++) {
        formedWord += tempPlacement[`${r},${col}`] || boardState[r][col].letter || '_';
      }
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full" id="plateau-scrabble">
      {/* Header controls for the board */}
      <div className="flex flex-wrap items-center justify-between bg-emerald-900 text-white rounded-2xl px-4 py-3 shadow-md gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1 px-2.5 bg-emerald-800 text-emerald-200 text-xs font-bold font-mono rounded-lg uppercase tracking-wider">
            Plateau duplicate
          </span>
          {formedWord && (
            <div className="flex items-center gap-3 animate-fade-in text-sm">
              <span className="hidden sm:inline">|</span>
              <span>Mot : <strong className="text-emerald-300 tracking-wider font-sans">{formedWord}</strong></span>
              <span>Coord : <strong className="text-pink-300 font-mono text-xs">{currentCoordinatesStr}</strong></span>
              <span>Points : <strong className="text-cyan-300 font-mono">{calculation.error ? '?' : calculation.score}</strong></span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {placedList.length > 0 && (
            <button
              onClick={onClearTemp}
              className="flex items-center gap-1.5 bg-emerald-800/80 hover:bg-red-950/80 hover:text-red-200 transition-all text-xs font-medium px-3 py-1.5 rounded-lg border border-emerald-700/60"
              title="Vider le plateau provisoire"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Effacer</span>
            </button>
          )}

          <div className="flex items-center bg-emerald-950 rounded-lg p-0.5 border border-emerald-800/80">
            <button
              onClick={zoomOut}
              disabled={zoom <= 0.7}
              className="p-1.5 rounded text-white/80 hover:text-white disabled:opacity-40 hover:bg-emerald-900 transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs px-2 font-mono font-medium text-emerald-300 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={zoom >= 1.5}
              className="p-1.5 rounded text-white/80 hover:text-white disabled:opacity-40 hover:bg-emerald-900 transition-colors"
              title="Zoom avant"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {calculation.error && (
        <div className="bg-red-50 text-red-700 text-xs py-2 px-3 rounded-xl border border-red-100 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
          <span>{calculation.error}</span>
        </div>
      )}

      {/* Responsive Board viewport with Zoom wrapper */}
      <div className="w-full bg-slate-50 dark:bg-emerald-950/20 border border-slate-200/80 rounded-2xl overflow-auto custom-scrollbar p-1 flex justify-center shadow-inner select-none max-h-[520px]" style={{ touchAction: 'pan-x pan-y' }}>
        <div 
          className="origin-top-left select-none flex-shrink-0"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', width: '100%', minWidth: '460px', maxWidth: '620px', marginBottom: zoom > 1 ? `${(zoom - 1) * 400}px` : undefined }}
        >
          {/* 15x15 Scrabble grid */}
          <div className="grid gap-[2px] p-2 bg-emerald-900/90 rounded-xl w-full aspect-square" style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
            
            {/* Top index corners */}
            <div className="flex items-center justify-center text-[10px] text-emerald-200/50 font-bold font-mono"></div>
            {ALPHABET.slice(0, 15).split('').map(letter => (
              <div key={letter} className="flex items-center justify-center text-[11px] text-emerald-200/80 font-mono font-black py-0.5">
                {letter}
              </div>
            ))}

            {/* Matrix board values */}
            {previewGrid.map((row, r) => (
              <React.Fragment key={`row-${r}`}>
                {/* Horizontal side row index */}
                <div className="flex items-center justify-center text-[11px] text-emerald-200/80 font-mono font-black h-full pr-1.5">
                  {r + 1}
                </div>

                {row.map((cell, c) => {
                  const mult = getCellMultiplier(r, c);
                  
                  // Styles depending on letter presence or cell multipliers
                  let cellStyle = mult.cssClass;
                  let content: React.ReactNode = null;
                  
                  if (cell.letter) {
                    const isJoker = cell.letter === cell.letter.toLowerCase() && cell.letter !== cell.letter.toUpperCase();

                    if (cell.isTemp) {
                      cellStyle = isJoker
                        ? "bg-amber-100 text-rose-650 border-2 border-rose-400 font-black shadow-md ring-1 ring-amber-300"
                        : "bg-amber-300 text-amber-950 font-black shadow-md border-2 border-amber-600 ring-1 ring-amber-400";
                    } else if (cell.isSubmitted) {
                      cellStyle = isJoker
                        ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-400 font-black shadow-md"
                        : "bg-indigo-200 text-indigo-900 border-2 border-indigo-500 font-black shadow-md";
                    } else if (cell.isTop) {
                      cellStyle = isJoker
                        ? "bg-rose-50 text-rose-700 border border-rose-250 font-extrabold shadow-sm"
                        : "bg-orange-100 text-amber-900 border border-amber-300 font-bold shadow-sm";
                    } else {
                      cellStyle = isJoker
                        ? "bg-slate-50 text-rose-700 border-b-2 border-slate-350 font-bold"
                        : "bg-slate-100 text-slate-800 border-b-2 border-slate-300 font-medium";
                    }

                    const ptValue = getLetterPoints(cell.letter);

                    content = (
                      <div className="flex flex-col items-center justify-center h-full w-full relative font-sans">
                        <span className={`text-[13px] sm:text-[15px] font-black leading-none mt-0.5 ${isJoker ? 'text-rose-600 font-extrabold' : ''}`}>
                          {cell.letter.toUpperCase()}
                        </span>
                        
                        {/* Valeur de la lettre (coefficient) */}
                        <span className={`absolute bottom-[1px] right-[2px] text-[7.5px] font-mono leading-none font-bold ${
                          cell.isTemp ? 'text-amber-950/60' : cell.isSubmitted ? 'text-indigo-700/70' : 'text-slate-500/80'
                        }`}>
                          {ptValue}
                        </span>

                        {cell.isTemp && (
                          <span className="absolute top-[1.5px] left-[2.5px] text-[6.5px] font-black tracking-tighter text-amber-850 bg-amber-200/50 px-0.5 rounded uppercase leading-none scale-90" title="Provisoire">
                            P
                          </span>
                        )}
                        {cell.isSubmitted && (
                          <span className="absolute top-[1.5px] left-[2.5px] text-[6.5px] font-black tracking-tighter text-indigo-700 bg-indigo-100/70 px-0.5 rounded uppercase leading-none scale-90" title="Validé">
                            ✓
                          </span>
                        )}
                        {!cell.isTemp && !cell.isSubmitted && isJoker && (
                          <span className="absolute top-[1.5px] left-[2.5px] text-[7px] font-extrabold text-rose-500 leading-none">
                            ★
                          </span>
                        )}
                      </div>
                    );
                  } else {
                    // Empty cell multipliers representation
                    const isCenter = r === 7 && c === 7;
                    if (isCenter) {
                      content = (
                        <div className="text-[12px] text-pink-700 animate-pulse select-none">
                          ★
                        </div>
                      );
                    } else if (mult.type !== 'NONE') {
                      content = (
                        <div className="flex flex-col items-center justify-center leading-none text-center h-full select-none">
                          <span className="text-[7.5px] font-extrabold tracking-tighter opacity-90 font-mono">
                            {mult.label}
                          </span>
                        </div>
                      );
                    }
                  }

                  const cellSelected = selectedRackLetter !== null;

                  return (
                    <button
                      id={`cell-${r}-${c}`}
                      key={`r${r}c${c}`}
                      onClick={() => onCellClick(r, c)}
                      disabled={cell.letter && (!cell.isTemp || cell.isSubmitted)} // Can only clear temporary letter or place new ones; submitted cells are locked
                      className={`aspect-square rounded-sm text-center flex flex-col items-center justify-center cursor-pointer transition-all border border-emerald-950/10 focus:outline-none overflow-hidden relative group select-none ${cellStyle} ${
                        cellSelected && !cell.letter ? 'hover:bg-emerald-300 hover:scale-[1.05]' : ''
                      }`}
                    >
                      {content}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}
