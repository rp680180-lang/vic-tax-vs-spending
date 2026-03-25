interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export default function StatCard({ title, value, subtitle, trend, trendValue }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {(subtitle || trendValue) && (
        <div className="flex items-center gap-2 mt-1">
          {trendValue && (
            <span
              className={`text-xs font-medium ${
                trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-400"
              }`}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </span>
          )}
          {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
