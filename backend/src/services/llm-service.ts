import Anthropic from '@anthropic-ai/sdk';
import type { MetricPoint, AiAnalysis } from '../models/types.js';

const apiKey = process.env.ANTHROPIC_API_KEY;

let anthropic: Anthropic | null = null;
if (apiKey) {
  anthropic = new Anthropic({ apiKey, baseURL: 'https://openrouter.ai/api' });
}

interface LlmResponse {
  anomaly_detected: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  description: string;
  recommended_action: string;
}

export async function analyzeMetrics(metricsWindow: MetricPoint[]): Promise<AiAnalysis> {
  if (!anthropic) {
    return mockAnalysis(metricsWindow);
  }

  try {
    const prompt = buildPrompt(metricsWindow);

    const message = await anthropic.messages.create({
      model: 'anthropic/claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = message.content.find(b => b.type === 'text');
    const text = textBlock ? textBlock.text : '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('LLM response did not contain valid JSON, using mock');
      return mockAnalysis(metricsWindow);
    }

    const parsed: LlmResponse = JSON.parse(jsonMatch[0]);

    return {
      anomaly_detected: parsed.anomaly_detected,
      severity: parsed.severity,
      description: parsed.description,
      recommended_action: parsed.recommended_action,
      metrics_snapshot: metricsWindow,
    };
  } catch (error) {
    console.error('LLM analysis failed:', error);
    return mockAnalysis(metricsWindow);
  }
}

function buildPrompt(metrics: MetricPoint[]): string {
  const summary = metrics.map((m, i) => (
    `[${i}] CPU: ${m.cpu_usage}%, Mem: ${m.memory_usage}%, Latency: ${m.api_latency_ms}ms, Errors: ${m.error_rate}%, Requests: ${m.request_count}`
  )).join('\n');

  return `You are an AI Ops analyst. Analyze these system metrics and detect anomalies.

Metrics window (${metrics.length} data points):
${summary}

Normal ranges:
- CPU: 20-60%
- Memory: 40-70%
- API Latency: 50-200ms
- Error Rate: 0-2%
- Requests: 100-500/interval

Respond ONLY with a JSON object (no markdown):
{
  "anomaly_detected": true/false,
  "severity": "critical" | "high" | "medium" | "low" | "none",
  "description": "Brief description of what you observe",
  "recommended_action": "What should be done"
}`;
}

function mockAnalysis(metricsWindow: MetricPoint[]): AiAnalysis {
  const latest = metricsWindow[metricsWindow.length - 1];
  if (!latest) {
    return {
      anomaly_detected: false,
      severity: 'none',
      description: 'No metrics data available for analysis.',
      recommended_action: 'Ensure metrics collection is running.',
      metrics_snapshot: metricsWindow,
    };
  }

  const hasCpuSpike = metricsWindow.some(m => m.cpu_usage > 85);
  const hasLatencySpike = metricsWindow.some(m => m.api_latency_ms > 500);
  const hasErrorSpike = metricsWindow.some(m => m.error_rate > 10);

  const anomaly_detected = hasCpuSpike || hasLatencySpike || hasErrorSpike;

  let severity: AiAnalysis['severity'] = 'none';
  let description = 'All metrics within normal parameters.';
  let recommended_action = 'No action required. Continue monitoring.';

  if (hasCpuSpike && hasErrorSpike) {
    severity = 'critical';
    description = 'CPU usage spike detected alongside elevated error rates. System may be under heavy load or experiencing a failure cascade.';
    recommended_action = 'Investigate running processes, consider scaling horizontally, and check application logs for errors.';
  } else if (hasCpuSpike) {
    severity = 'high';
    description = 'CPU usage exceeded normal thresholds. Possible resource-intensive process or traffic surge.';
    recommended_action = 'Monitor CPU-bound processes and consider scaling compute resources.';
  } else if (hasLatencySpike) {
    severity = 'medium';
    description = 'API latency significantly above normal range. Possible downstream service degradation.';
    recommended_action = 'Check downstream dependencies and database query performance.';
  } else if (hasErrorSpike) {
    severity = 'high';
    description = 'Error rate spike detected. Application may be experiencing failures.';
    recommended_action = 'Review application logs and recent deployments for breaking changes.';
  }

  return {
    anomaly_detected,
    severity,
    description,
    recommended_action,
    metrics_snapshot: metricsWindow,
  };
}
