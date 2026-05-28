import React from 'react';

interface QRCodeVisualProps {
  value: string;
  size?: number;
}

export function QRCodeVisual({ value, size = 120 }: QRCodeVisualProps) {
  // Generate a premium-looking decorative Matrix QR code deterministically based on the string value
  // This uses pure SVG blocks and is fully scalable and lightweight.
  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seed = hashString(value);
  const matrixSize = 21; // 21x21 QR Grid
  const cellSize = size / matrixSize;

  // Let's predefined typical QR alignment grids
  const isFinderPattern = (r: number, c: number): boolean => {
    // Top Left
    if (r < 7 && c < 7) {
      return r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
    }
    // Top Right
    if (r < 7 && c >= matrixSize - 7) {
      const adjustedC = c - (matrixSize - 7);
      return r === 0 || r === 6 || adjustedC === 0 || adjustedC === 6 || (r >= 2 && r <= 4 && adjustedC >= 2 && adjustedC <= 4);
    }
    // Bottom Left
    if (r >= matrixSize - 7 && c < 7) {
      const adjustedR = r - (matrixSize - 7);
      return adjustedR === 0 || adjustedR === 6 || c === 0 || c === 6 || (adjustedR >= 2 && adjustedR <= 4 && c >= 2 && c <= 4);
    }
    return false;
  };

  const dots: React.ReactNode[] = [];

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (isFinderPattern(r, c)) {
        // Finder pattern blocks are handled collectively below
        continue;
      }

      // Quiet zones around finders
      if ((r < 8 && c < 8) || (r < 8 && c >= matrixSize - 8) || (r >= matrixSize - 8 && c < 8)) {
        continue;
      }

      // Draw random but deterministic pixel dot based on string hash
      const itemSeed = (seed + r * 13 + c * 37) % 100;
      if (itemSeed > 42) { // ~58% fill rate
        dots.push(
          <rect
            key={`${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize - 0.5}
            height={cellSize - 0.5}
            rx={cellSize / 3}
            className="fill-emerald-950 dark:fill-emerald-400"
          />
        );
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl shadow-sm border border-emerald-100">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="text-slate-900">
        {/* Top-Left Finder */}
        <path
          d={`M 0 0 L ${7 * cellSize} 0 L ${7 * cellSize} ${7 * cellSize} L 0 ${7 * cellSize} Z`}
          className="fill-emerald-900"
        />
        <path
          d={`M ${cellSize} ${cellSize} L ${6 * cellSize} ${cellSize} L ${6 * cellSize} ${6 * cellSize} L ${cellSize} ${6 * cellSize} Z`}
          className="fill-white"
        />
        <path
          d={`M ${2 * cellSize} ${2 * cellSize} L ${5 * cellSize} ${2 * cellSize} L ${5 * cellSize} ${5 * cellSize} L ${2 * cellSize} ${5 * cellSize} Z`}
          className="fill-emerald-700"
        />

        {/* Top-Right Finder */}
        <path
          d={`M ${(matrixSize - 7) * cellSize} 0 L ${matrixSize * cellSize} 0 L ${matrixSize * cellSize} ${7 * cellSize} L ${(matrixSize - 7) * cellSize} ${7 * cellSize} Z`}
          className="fill-emerald-900"
        />
        <path
          d={`M ${(matrixSize - 6) * cellSize} ${cellSize} L ${(matrixSize - 1) * cellSize} ${cellSize} L ${(matrixSize - 1) * cellSize} ${6 * cellSize} L ${(matrixSize - 6) * cellSize} ${6 * cellSize} Z`}
          className="fill-white"
        />
        <path
          d={`M ${(matrixSize - 5) * cellSize} ${2 * cellSize} L ${(matrixSize - 2) * cellSize} ${2 * cellSize} L ${(matrixSize - 2) * cellSize} ${5 * cellSize} L ${(matrixSize - 5) * cellSize} ${5 * cellSize} Z`}
          className="fill-emerald-700"
        />

        {/* Bottom-Left Finder */}
        <path
          d={`M 0 ${(matrixSize - 7) * cellSize} L ${7 * cellSize} ${(matrixSize - 7) * cellSize} L ${7 * cellSize} ${matrixSize * cellSize} L 0 ${matrixSize * cellSize} Z`}
          className="fill-emerald-900"
        />
        <path
          d={`M ${cellSize} ${(matrixSize - 6) * cellSize} L ${6 * cellSize} ${(matrixSize - 6) * cellSize} L ${6 * cellSize} ${(matrixSize - 1) * cellSize} L ${cellSize} ${(matrixSize - 1) * cellSize} Z`}
          className="fill-white"
        />
        <path
          d={`M ${2 * cellSize} ${(matrixSize - 5) * cellSize} L ${5 * cellSize} ${(matrixSize - 5) * cellSize} L ${5 * cellSize} ${(matrixSize - 2) * cellSize} L ${2 * cellSize} ${(matrixSize - 2) * cellSize} Z`}
          className="fill-emerald-700"
        />

        {/* Deterministic QR Dots */}
        {dots}
      </svg>
      <span className="text-[10px] font-bold text-emerald-800 tracking-wider mt-2 bg-emerald-50 px-2 py-0.5 rounded-full select-all uppercase">
        {value}
      </span>
    </div>
  );
}
