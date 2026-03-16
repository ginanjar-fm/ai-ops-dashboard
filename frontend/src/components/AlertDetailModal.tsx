import { useEffect, useRef } from 'react';
import type { Alert } from '../types';

interface AlertDetailModalProps {
  alert: Alert | null;
  onClose: () => void;
}

const severityBadge: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function AlertDetailModal({ alert, onClose }: AlertDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!alert) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-lg rounded-xl border border-gray-700 bg-[#1a1b25] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                severityBadge[alert.severity]
              }`}
            >
              {alert.severity.toUpperCase()}
            </span>
            {alert.anomaly_detected && (
              <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs text-red-400">
                Anomaly
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <h3 className="mb-2 text-lg font-semibold text-white">{alert.title}</h3>
        <p className="mb-1 text-xs text-gray-500">
          {new Date(alert.created_at).toLocaleString()}
        </p>

        <p className="mb-4 text-sm leading-relaxed text-gray-300">{alert.description}</p>

        {alert.recommended_action && (
          <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="mb-1 text-xs font-medium text-blue-400">Recommended Action</p>
            <p className="text-sm text-gray-300">{alert.recommended_action}</p>
          </div>
        )}

        {alert.metrics_snapshot && Object.keys(alert.metrics_snapshot).length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-gray-500">Metrics Snapshot</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(alert.metrics_snapshot).map(([key, val]) => (
                <div key={key} className="rounded-lg bg-gray-800/50 px-3 py-2">
                  <p className="text-[10px] text-gray-500">{key}</p>
                  <p className="text-sm font-semibold text-white">{val.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
