import { useState } from 'react';
import type { Alert } from '../types';

interface AlertFeedProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
}

const severityDot: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

const severityBadge: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-blue-500/20 text-blue-400',
};

export default function AlertFeed({ alerts, onAlertClick }: AlertFeedProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="rounded-xl border border-gray-800 bg-[#161820] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Alert Feed</h2>
        <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400">
          {alerts.length} alerts
        </span>
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">No alerts yet</p>
        ) : (
          sorted.map((alert) => {
            const isExpanded = expandedId === alert.id;
            return (
              <div
                key={alert.id}
                className="cursor-pointer rounded-lg border border-gray-800 bg-gray-900/40 p-3 transition-colors hover:border-gray-700 hover:bg-gray-900/60"
                onClick={() => {
                  if (isExpanded) {
                    setExpandedId(null);
                  } else {
                    setExpandedId(alert.id);
                  }
                }}
                onDoubleClick={() => onAlertClick(alert)}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${severityDot[alert.severity]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-gray-200">
                        {alert.title}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${severityBadge[alert.severity]}`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                    {!isExpanded && (
                      <p className="mt-1 truncate text-xs text-gray-500">{alert.description}</p>
                    )}
                    {isExpanded && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm leading-relaxed text-gray-400">
                          {alert.description}
                        </p>
                        {alert.recommended_action && (
                          <div className="rounded border border-blue-500/20 bg-blue-500/5 p-2">
                            <p className="text-[10px] font-medium text-blue-400">
                              Recommended Action
                            </p>
                            <p className="mt-0.5 text-xs text-gray-300">
                              {alert.recommended_action}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
