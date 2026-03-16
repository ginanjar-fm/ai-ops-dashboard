import { pool } from '../database.js';
import { analyzeMetrics } from './llm-service.js';
import type { MetricPoint, AiAnalysis, Alert } from '../models/types.js';

export type AnomalyCallback = (event: 'anomaly_detected' | 'new_alert', data: AiAnalysis | Alert) => void;

export class AnomalyDetector {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onEvent: AnomalyCallback | null = null;

  constructor(callback: AnomalyCallback) {
    this.onEvent = callback;
  }

  start(): void {
    if (this.intervalId) return;
    console.log('AnomalyDetector started');
    this.intervalId = setInterval(() => {
      void this.runAnalysis();
    }, 30_000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('AnomalyDetector stopped');
    }
  }

  async runAnalysis(): Promise<void> {
    try {
      // Query last 5 minutes of metrics
      const result = await pool.query<MetricPoint>(
        `SELECT cpu_usage, memory_usage, api_latency_ms, error_rate, request_count, timestamp
         FROM metrics_history
         WHERE timestamp > NOW() - INTERVAL '5 minutes'
         ORDER BY timestamp ASC`
      );

      const metricsWindow = result.rows;
      if (metricsWindow.length === 0) {
        console.log('No recent metrics to analyze');
        return;
      }

      // Call LLM service
      const analysis = await analyzeMetrics(metricsWindow);

      // Store analysis in DB
      const insertResult = await pool.query(
        `INSERT INTO ai_analyses (anomaly_detected, severity, description, recommended_action, metrics_snapshot)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, anomaly_detected, severity, description, recommended_action, metrics_snapshot, created_at`,
        [analysis.anomaly_detected, analysis.severity, analysis.description, analysis.recommended_action, JSON.stringify(analysis.metrics_snapshot)]
      );

      const savedAnalysis: AiAnalysis = insertResult.rows[0];

      if (analysis.anomaly_detected) {
        // Create alert
        const alertResult = await pool.query(
          `INSERT INTO alerts (analysis_id, severity, title, description)
           VALUES ($1, $2, $3, $4)
           RETURNING id, analysis_id, severity, title, description, acknowledged, created_at`,
          [
            savedAnalysis.id,
            analysis.severity,
            `${analysis.severity.toUpperCase()}: Anomaly Detected`,
            analysis.description,
          ]
        );

        const alert: Alert = alertResult.rows[0];

        this.onEvent?.('anomaly_detected', savedAnalysis);
        this.onEvent?.('new_alert', alert);

        console.log(`Anomaly detected [${analysis.severity}]: ${analysis.description}`);
      }
    } catch (error) {
      console.error('Anomaly detection failed:', error);
    }
  }
}
