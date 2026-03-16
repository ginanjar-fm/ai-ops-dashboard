import { Router } from 'express';
import { pool } from '../database.js';

const router = Router();

/**
 * @openapi
 * /api/config:
 *   get:
 *     summary: Get current configuration
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Current configuration object
 */
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM configurations ORDER BY updated_at DESC`
    );
    const config: Record<string, unknown> = {};
    for (const row of result.rows) {
      config[row.key as string] = row.value;
    }
    res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

/**
 * @openapi
 * /api/config:
 *   post:
 *     summary: Update threshold configuration
 *     tags: [Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cpu_usage:
 *                 type: number
 *               memory_usage:
 *                 type: number
 *               api_latency_ms:
 *                 type: number
 *               error_rate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated configuration
 */
router.post('/', async (req, res) => {
  try {
    const thresholds = req.body;
    const result = await pool.query(
      `INSERT INTO configurations (key, value, updated_at)
       VALUES ('thresholds', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = NOW()
       RETURNING *`,
      [JSON.stringify(thresholds)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

export default router;
