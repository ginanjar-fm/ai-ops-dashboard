import { useState, useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { MetricPoint, Alert, AiAnalysis } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const MAX_HISTORY = 100;

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [latestMetric, setLatestMetric] = useState<MetricPoint | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<AiAnalysis | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const addMetric = useCallback((metric: MetricPoint) => {
    setLatestMetric(metric);
    setMetricsHistory((prev) => {
      const next = [...prev, metric];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
  }, []);

  const addAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => [alert, ...prev]);
  }, []);

  useEffect(() => {
    const socket = io(API_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('metrics_update', (data: MetricPoint) => {
      addMetric(data);
    });

    socket.on('new_alert', (data: Alert) => {
      addAlert(data);
    });

    socket.on('anomaly_detected', (data: AiAnalysis) => {
      setLatestAnalysis(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [addMetric, addAlert]);

  return {
    connected,
    latestMetric,
    metricsHistory,
    alerts,
    latestAnalysis,
  };
}
