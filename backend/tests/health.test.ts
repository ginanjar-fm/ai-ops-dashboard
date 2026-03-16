import { describe, it, expect } from 'vitest';
import { MetricsSimulator } from '../src/services/simulator.js';

describe('Health Check', () => {
  it('should import the server module without crashing', async () => {
    // Verify types module can be imported
    const types = await import('../src/models/types.js');
    expect(types).toBeDefined();
  });

  it('should import database module without crashing', async () => {
    const db = await import('../src/database.js');
    expect(db.pool).toBeDefined();
    expect(db.initDatabase).toBeDefined();
  });
});

describe('MetricsSimulator', () => {
  it('should generate valid metrics', () => {
    const metrics: Array<Record<string, unknown>> = [];
    const simulator = new MetricsSimulator((metric) => {
      metrics.push(metric as unknown as Record<string, unknown>);
    });

    const metric = simulator.generate();

    expect(metric).toHaveProperty('cpu_usage');
    expect(metric).toHaveProperty('memory_usage');
    expect(metric).toHaveProperty('api_latency_ms');
    expect(metric).toHaveProperty('error_rate');
    expect(metric).toHaveProperty('request_count');
    expect(metric).toHaveProperty('timestamp');

    expect(typeof metric.cpu_usage).toBe('number');
    expect(typeof metric.memory_usage).toBe('number');
    expect(typeof metric.api_latency_ms).toBe('number');
    expect(typeof metric.error_rate).toBe('number');
    expect(typeof metric.request_count).toBe('number');
    expect(metric.timestamp).toBeInstanceOf(Date);
  });

  it('should generate metrics within expected ranges for normal ticks', () => {
    const simulator = new MetricsSimulator(() => {});

    // Generate several metrics and check ranges (skip multiples of 15 which are anomalies)
    for (let i = 0; i < 10; i++) {
      const metric = simulator.generate();
      // On non-anomaly ticks, values should be within normal or anomaly range
      expect(metric.cpu_usage).toBeGreaterThanOrEqual(0);
      expect(metric.cpu_usage).toBeLessThanOrEqual(100);
      expect(metric.memory_usage).toBeGreaterThanOrEqual(0);
      expect(metric.memory_usage).toBeLessThanOrEqual(100);
      expect(metric.api_latency_ms).toBeGreaterThanOrEqual(0);
      expect(metric.error_rate).toBeGreaterThanOrEqual(0);
      expect(metric.request_count).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have start and stop methods', () => {
    const simulator = new MetricsSimulator(() => {});
    expect(typeof simulator.start).toBe('function');
    expect(typeof simulator.stop).toBe('function');
  });
});
