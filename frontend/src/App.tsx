import { useState, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import MetricCard from './components/MetricCard';
import RealtimeChart from './components/RealtimeChart';
import AIInsightsPanel from './components/AIInsightsPanel';
import AlertFeed from './components/AlertFeed';
import AlertDetailModal from './components/AlertDetailModal';
import type { MetricPoint, Alert } from './types';

type TimeRange = 'live' | '1h' | '6h' | '24h';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const { connected, latestMetric, metricsHistory, alerts, latestAnalysis } = useWebSocket();
  const [timeRange, setTimeRange] = useState<TimeRange>('live');
  const [historicalMetrics, setHistoricalMetrics] = useState<MetricPoint[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const handleTimeRangeChange = useCallback(async (range: TimeRange) => {
    setTimeRange(range);
    if (range === 'live') return;
    try {
      const res = await fetch(`${API_URL}/api/metrics/history?range=${range}`);
      if (res.ok) {
        const data = (await res.json()) as MetricPoint[];
        setHistoricalMetrics(data);
      }
    } catch {
      // API might not be available yet
    }
  }, []);

  const displayMetrics = timeRange === 'live' ? metricsHistory : historicalMetrics;

  const cpuValues = metricsHistory.map((m) => m.cpu_usage);
  const memValues = metricsHistory.map((m) => m.memory_usage);
  const latValues = metricsHistory.map((m) => m.api_latency_ms);
  const errValues = metricsHistory.map((m) => m.error_rate);

  return (
    <div className="min-h-screen bg-[#0f1117] p-4 md:p-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Ops Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time monitoring powered by AI</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="text-sm text-gray-400">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Top row: Metric Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="CPU Usage"
          value={latestMetric?.cpu_usage ?? 0}
          unit="%"
          trend={cpuValues}
          color="#3b82f6"
          icon="🖥"
        />
        <MetricCard
          title="Memory Usage"
          value={latestMetric?.memory_usage ?? 0}
          unit="%"
          trend={memValues}
          color="#8b5cf6"
          icon="💾"
        />
        <MetricCard
          title="API Latency"
          value={latestMetric?.api_latency_ms ?? 0}
          unit="ms"
          trend={latValues}
          color="#f59e0b"
          icon="⚡"
        />
        <MetricCard
          title="Error Rate"
          value={latestMetric?.error_rate ?? 0}
          unit="%"
          trend={errValues}
          color="#ef4444"
          icon="⚠"
        />
      </div>

      {/* Middle row: Chart + AI Insights */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RealtimeChart
            metricsHistory={displayMetrics}
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
          />
        </div>
        <div>
          <AIInsightsPanel latestAnalysis={latestAnalysis} alerts={alerts} />
        </div>
      </div>

      {/* Bottom: Alert Feed */}
      <AlertFeed alerts={alerts} onAlertClick={setSelectedAlert} />

      {/* Modal */}
      <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  );
}

export default App;
