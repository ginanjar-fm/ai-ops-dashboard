import { Router } from 'express';
import { pool } from '../database.js';

const router = Router();

/**
 * @openapi
 * /api/alerts:
 *   get:
 *     summary: List recent alerts
 *     tags: [Alerts]
 *     responses:
 *       200:
 *         description: Array of alerts, newest first
 */
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * @openapi
 * /api/alerts/{id}:
 *   get:
 *     summary: Get a single alert with its associated AI analysis
 *     tags: [Alerts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Alert ID
 *     responses:
 *       200:
 *         description: Alert with joined analysis data
 *       404:
 *         description: Alert not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
         a.*,
         aa.anomaly_detected AS analysis_anomaly_detected,
         aa.severity AS analysis_severity,
         aa.description AS analysis_description,
         aa.recommended_action AS analysis_recommended_action,
         aa.metrics_snapshot AS analysis_metrics_snapshot,
         aa.created_at AS analysis_created_at
       FROM alerts a
       LEFT JOIN ai_analyses aa ON a.analysis_id = aa.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    const row = result.rows[0];
    const alert = {
      id: row.id,
      analysis_id: row.analysis_id,
      severity: row.severity,
      title: row.title,
      description: row.description,
      acknowledged: row.acknowledged,
      created_at: row.created_at,
      analysis: row.analysis_id ? {
        id: row.analysis_id,
        anomaly_detected: row.analysis_anomaly_detected,
        severity: row.analysis_severity,
        description: row.analysis_description,
        recommended_action: row.analysis_recommended_action,
        metrics_snapshot: row.analysis_metrics_snapshot,
        created_at: row.analysis_created_at,
      } : null,
    };

    res.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

export default router;
