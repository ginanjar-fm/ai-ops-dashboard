import type { AiAnalysis, Alert } from '../types';

interface AIInsightsPanelProps {
  latestAnalysis: AiAnalysis | null;
  alerts: Alert[];
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  info: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function AIInsightsPanel({ latestAnalysis, alerts }: AIInsightsPanelProps) {
  const recentAnomalyAlerts = alerts.filter((a) => a.anomaly_detected).slice(0, 3);

  return (
    <div className="rounded-xl border border-gray-800 bg-[#161820] p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">AI Insights</h2>

      {latestAnalysis ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                severityColors[latestAnalysis.severity] || severityColors.info
              }`}
            >
              {latestAnalysis.severity.toUpperCase()}
            </span>
            {latestAnalysis.anomaly_detected && (
              <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
                Anomaly Detected
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-gray-300">{latestAnalysis.description}</p>

          {latestAnalysis.recommended_action && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
              <p className="mb-1 text-xs font-medium text-blue-400">Recommended Action</p>
              <p className="text-sm text-gray-300">{latestAnalysis.recommended_action}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-3 h-8 w-8 animate-pulse rounded-full bg-gray-700" />
          <p className="text-sm text-gray-500">Awaiting AI analysis...</p>
        </div>
      )}

      {recentAnomalyAlerts.length > 0 && (
        <div className="mt-5 border-t border-gray-800 pt-4">
          <p className="mb-2 text-xs font-medium text-gray-500">Recent Anomalies</p>
          <div className="space-y-2">
            {recentAnomalyAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border border-gray-800 bg-gray-900/50 p-2.5"
              >
                <p className="text-xs font-medium text-gray-300">{alert.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
