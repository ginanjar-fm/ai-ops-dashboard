import { Router } from 'express';
import { pool } from '../database.js';

const router = Router();

/**
 * @openapi
 * /api/metrics/current:
 *   get:
 *     summary: Get the latest metric data point
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Latest metric point
 */
router.get('/current', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM metrics_history ORDER BY timestamp DESC LIMIT 1'
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching current metrics:', error);
    res.status(500).json({ error: 'Failed to fetch current metrics' });
  }
});

/**
 * @openapi
 * /api/metrics/history:
 *   get:
 *     summary: Get historical metric data
 *     tags: [Metrics]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h]
 *           default: 1h
 *         description: Time range for historical data
 *     responses:
 *       200:
 *         description: Array of metric data points
 */
router.get('/history', async (req, res) => {
  try {
    const range = (req.query.range as string) || '1h';

    let interval: string;
    let limit: number;
    switch (range) {
      case '6h':
        interval = '6 hours';
        limit = 1080;
        break;
      case '24h':
        interval = '24 hours';
        limit = 4320;
        break;
      case '1h':
      default:
        interval = '1 hour';
        limit = 180;
        break;
    }

    const result = await pool.query(
      `SELECT * FROM metrics_history
       WHERE timestamp > NOW() - INTERVAL '${interval}'
       ORDER BY timestamp ASC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching metrics history:', error);
    res.status(500).json({ error: 'Failed to fetch metrics history' });
  }
});

export default router;
