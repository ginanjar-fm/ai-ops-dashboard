export interface MetricPoint {
  id?: number;
  cpu_usage: number;
  memory_usage: number;
  api_latency_ms: number;
  error_rate: number;
  request_count: number;
  timestamp: Date | string;
}

export interface AiAnalysis {
  id?: number;
  anomaly_detected: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  description: string;
  recommended_action: string;
  metrics_snapshot: MetricPoint[] | Record<string, unknown>;
  created_at?: Date | string;
}

export interface Alert {
  id?: number;
  analysis_id: number;
  severity: string;
  title: string;
  description: string;
  acknowledged: boolean;
  created_at?: Date | string;
  analysis?: AiAnalysis;
}

export interface Config {
  id?: number;
  key: string;
  value: ThresholdConfig | Record<string, unknown>;
  updated_at?: Date | string;
}

export interface ThresholdConfig {
  cpu_usage: number;
  memory_usage: number;
  api_latency_ms: number;
  error_rate: number;
}

export interface MetricsAggregate {
  avg_cpu: number;
  max_cpu: number;
  min_cpu: number;
  avg_memory: number;
  max_memory: number;
  min_memory: number;
  avg_latency: number;
  max_latency: number;
  min_latency: number;
  avg_error_rate: number;
  max_error_rate: number;
  min_error_rate: number;
  avg_requests: number;
  total_requests: number;
  point_count: number;
}
