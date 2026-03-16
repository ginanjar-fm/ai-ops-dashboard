import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  trend: number[];
  color: string;
  icon: string;
}

function getStatus(title: string, value: number): 'normal' | 'warning' | 'critical' {
  const lower = title.toLowerCase();
  if (lower.includes('cpu') || lower.includes('memory')) {
    if (value > 80) return 'critical';
    if (value > 60) return 'warning';
    return 'normal';
  }
  if (lower.includes('latency')) {
    if (value > 500) return 'critical';
    if (value > 200) return 'warning';
    return 'normal';
  }
  if (lower.includes('error')) {
    if (value > 5) return 'critical';
    if (value > 2) return 'warning';
    return 'normal';
  }
  return 'normal';
}

const statusBorder: Record<string, string> = {
  normal: 'border-green-500/30',
  warning: 'border-yellow-500/30',
  critical: 'border-red-500/30',
};

const statusGlow: Record<string, string> = {
  normal: 'shadow-green-500/5',
  warning: 'shadow-yellow-500/5',
  critical: 'shadow-red-500/10',
};

export default function MetricCard({ title, value, unit, trend, color, icon }: MetricCardProps) {
  const status = getStatus(title, value);
  const sparkData = trend.slice(-20).map((v, i) => ({ i, v }));

  return (
    <div
      className={`rounded-xl border bg-[#161820] p-5 shadow-lg ${statusBorder[status]} ${statusGlow[status]}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="mb-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-white">
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
      {sparkData.length > 1 && (
        <div className="h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#grad-${title})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
