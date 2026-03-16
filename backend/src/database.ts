import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aiops';

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS metrics_history (
        id SERIAL PRIMARY KEY,
        cpu_usage FLOAT NOT NULL,
        memory_usage FLOAT NOT NULL,
        api_latency_ms FLOAT NOT NULL,
        error_rate FLOAT NOT NULL,
        request_count INT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id SERIAL PRIMARY KEY,
        anomaly_detected BOOLEAN NOT NULL,
        severity VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        recommended_action TEXT NOT NULL,
        metrics_snapshot JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        analysis_id INT REFERENCES ai_analyses(id),
        severity VARCHAR(20) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        acknowledged BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS configurations (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Insert default thresholds if not exists
    await client.query(`
      INSERT INTO configurations (key, value)
      VALUES ('thresholds', $1::jsonb)
      ON CONFLICT (key) DO NOTHING;
    `, [JSON.stringify({
      cpu_usage: 85,
      memory_usage: 90,
      api_latency_ms: 500,
      error_rate: 10,
    })]);

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}
