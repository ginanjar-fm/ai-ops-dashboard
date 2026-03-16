import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

import { pool, initDatabase } from './database.js';
import { MetricsSimulator } from './services/simulator.js';
import { AnomalyDetector } from './services/anomaly-detector.js';
import metricsRouter from './routes/metrics.js';
import alertsRouter from './routes/alerts.js';
import configRouter from './routes/config.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' },
});

// Middleware
app.use(cors());
app.use(express.json());

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Ops Dashboard API',
      version: '1.0.0',
      description: 'Backend API for the AI-powered operations dashboard',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/metrics', metricsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/config', configRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start services
async function startServer(retries = 5): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await initDatabase();
      break;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Database not ready, retrying in ${2 * (i + 1)}s... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }

  // Metrics simulator
  const simulator = new MetricsSimulator(async (metric) => {
    try {
      await pool.query(
        `INSERT INTO metrics_history (cpu_usage, memory_usage, api_latency_ms, error_rate, request_count, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [metric.cpu_usage, metric.memory_usage, metric.api_latency_ms, metric.error_rate, metric.request_count, metric.timestamp]
      );
      io.emit('metrics_update', metric);
    } catch (error) {
      console.error('Failed to save metric:', error);
    }
  });

  // Anomaly detector
  const detector = new AnomalyDetector((event, data) => {
    io.emit(event, data);
  });

  simulator.start();
  detector.start();

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down...');
    simulator.stop();
    detector.stop();
    server.close();
    void pool.end();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app, server, io };
