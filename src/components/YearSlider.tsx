"use client";

interface YearSliderProps {
  year: number;
  onChange: (year: number) => void;
  min?: number;
  max?: number;
  labels?: string[];
}

export default function YearSlider({ year, onChange, min = 0, max = 8, labels }: YearSliderProps) {
  const displayMin = labels ? labels[min] : String(min);
  const displayMax = labels ? labels[max] : String(max);
  const displayCurrent = labels ? labels[year] : String(year);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-400 whitespace-nowrap">{displayMin}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={year}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-sm font-medium text-slate-400 whitespace-nowrap">{displayMax}</span>
      </div>
      <div className="flex justify-center">
        <span className="text-lg font-bold text-white">{displayCurrent}</span>
      </div>
    </div>
  );
}
