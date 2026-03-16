import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MetricPoint } from '../types';

type TimeRange = 'live' | '1h' | '6h' | '24h';

interface RealtimeChartProps {
  metricsHistory: MetricPoint[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const ranges: TimeRange[] = ['live', '1h', '6h', '24h'];

const series = [
  { key: 'cpu_usage', label: 'CPU %', color: '#3b82f6' },
  { key: 'memory_usage', label: 'Memory %', color: '#8b5cf6' },
  { key: 'api_latency_ms', label: 'Latency ms', color: '#f59e0b' },
  { key: 'error_rate', label: 'Error Rate %', color: '#ef4444' },
] as const;

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface TooltipPayloadEntry {
  color: string;
  name: string;
  value: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-gray-700 bg-[#1e1f2b] p-3 shadow-xl">
      <p className="mb-2 text-xs text-gray-400">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-300">{entry.name}:</span>
          <span className="font-semibold text-white">{entry.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function RealtimeChart({
  metricsHistory,
  timeRange,
  onTimeRangeChange,
}: RealtimeChartProps) {
  const data = metricsHistory.map((m) => ({
    ...m,
    time: formatTime(m.timestamp),
  }));

  return (
    <div className="rounded-xl border border-gray-800 bg-[#161820] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">System Metrics</h2>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => onTimeRangeChange(r)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                timeRange === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              stroke="#2e303a"
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} stroke="#2e303a" />
            <Tooltip content={<CustomTooltip />} />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={s.color}
                fillOpacity={0.08}
                animationDuration={300}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
