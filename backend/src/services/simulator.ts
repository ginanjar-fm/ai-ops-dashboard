import type { MetricPoint } from '../models/types.js';

export class MetricsSimulator {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private tickCount = 0;
  private onMetric: ((metric: MetricPoint) => void) | null = null;

  constructor(callback: (metric: MetricPoint) => void) {
    this.onMetric = callback;
  }

  start(): void {
    if (this.intervalId) return;
    console.log('MetricsSimulator started');
    this.intervalId = setInterval(() => {
      const metric = this.generate();
      this.onMetric?.(metric);
    }, 2000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('MetricsSimulator stopped');
    }
  }

  generate(): MetricPoint {
    this.tickCount++;
    const injectAnomaly = this.tickCount % 15 === 0; // every ~30s (15 ticks * 2s)

    let cpu_usage = this.randomInRange(20, 60);
    let memory_usage = this.randomInRange(40, 70);
    let api_latency_ms = this.randomInRange(50, 200);
    let error_rate = this.randomInRange(0, 2);
    let request_count = Math.floor(this.randomInRange(100, 500));

    if (injectAnomaly) {
      const anomalyType = Math.floor(Math.random() * 3);
      switch (anomalyType) {
        case 0:
          cpu_usage = this.randomInRange(90, 99);
          break;
        case 1:
          api_latency_ms = this.randomInRange(1000, 3000);
          break;
        case 2:
          error_rate = this.randomInRange(15, 40);
          break;
      }
    }

    return {
      cpu_usage: Math.round(cpu_usage * 100) / 100,
      memory_usage: Math.round(memory_usage * 100) / 100,
      api_latency_ms: Math.round(api_latency_ms * 100) / 100,
      error_rate: Math.round(error_rate * 100) / 100,
      request_count,
      timestamp: new Date(),
    };
  }

  private randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
