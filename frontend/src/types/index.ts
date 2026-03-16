export interface MetricPoint {
  id: number;
  cpu_usage: number;
  memory_usage: number;
  api_latency_ms: number;
  error_rate: number;
  request_count: number;
  timestamp: string;
}

export interface Alert {
  id: number;
  analysis_id: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  acknowledged: boolean;
  created_at: string;
  anomaly_detected?: boolean;
  recommended_action?: string;
  metrics_snapshot?: Record<string, number>;
}

export interface AiAnalysis {
  anomaly_detected: boolean;
  severity: string;
  description: string;
  recommended_action: string;
}
