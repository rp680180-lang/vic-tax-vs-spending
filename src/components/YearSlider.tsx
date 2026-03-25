"use client";

interface YearSliderProps {
  year: number;
  onChange: (year: number) => void;
  min?: number;
  max?: number;
}

export default function YearSlider({ year, onChange, min = 2014, max = 2023 }: YearSliderProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-slate-400 whitespace-nowrap">Year: {year}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={year}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-xs text-slate-500 min-w-[80px]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
