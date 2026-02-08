import { Router } from "express";
import pool from "../db.js";
import { requireTrainer } from "../middleware/auth.js";

const router = Router();

// GET /api/analytics/dashboard — trainer only
router.get("/dashboard", requireTrainer, async (_req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  // Monday of current week
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [
    activeClientsRes,
    todaySessionsRes,
    weekSessionsRes,
    completionRateRes,
    weeklyTrendRes,
    recentActivityRes,
  ] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM clients WHERE is_active = true"),

    pool.query(
      `SELECT s.id, s.client_id, c.first_name, c.last_name, s.scheduled_at, s.duration_min, s.status
       FROM sessions s JOIN clients c ON s.client_id = c.id
       WHERE s.scheduled_at >= $1 AND s.scheduled_at < $2
       ORDER BY s.scheduled_at`,
      [todayStart, todayEnd]
    ),

    pool.query(
      "SELECT COUNT(*)::int AS count FROM sessions WHERE scheduled_at >= $1 AND scheduled_at < $2",
      [weekStart.toISOString(), weekEnd.toISOString()]
    ),

    pool.query(
      `SELECT
         CASE WHEN COUNT(*) FILTER (WHERE status IN ('completed','cancelled','no_show')) = 0 THEN 0
         ELSE ROUND(
           COUNT(*) FILTER (WHERE status = 'completed') * 100.0 /
           COUNT(*) FILTER (WHERE status IN ('completed','cancelled','no_show'))
         )::int END AS rate
       FROM sessions
       WHERE scheduled_at >= NOW() - INTERVAL '30 days'`
    ),

    pool.query(
      `SELECT d.day::date::text AS day,
              COALESCE(COUNT(s.id), 0)::int AS count
       FROM generate_series($1::date, ($2::date - INTERVAL '1 day')::date, '1 day') AS d(day)
       LEFT JOIN sessions s ON s.scheduled_at::date = d.day::date
       GROUP BY d.day ORDER BY d.day`,
      [weekStart.toISOString(), weekEnd.toISOString()]
    ),

    pool.query(
      `(SELECT 'session_completed' AS type,
              'Completed session with ' || c.first_name || ' ' || c.last_name AS description,
              s.updated_at AS timestamp
       FROM sessions s JOIN clients c ON s.client_id = c.id
       WHERE s.status = 'completed'
       ORDER BY s.updated_at DESC LIMIT 10)
       UNION ALL
       (SELECT 'new_client' AS type,
              'New client: ' || first_name || ' ' || last_name AS description,
              created_at AS timestamp
       FROM clients ORDER BY created_at DESC LIMIT 10)
       UNION ALL
       (SELECT 'measurement_recorded' AS type,
              'Measurement recorded for ' || c.first_name || ' ' || c.last_name AS description,
              m.created_at AS timestamp
       FROM measurements m JOIN clients c ON m.client_id = c.id
       ORDER BY m.created_at DESC LIMIT 10)
       ORDER BY timestamp DESC LIMIT 10`
    ),
  ]);

  res.json({
    stats: {
      active_clients: activeClientsRes.rows[0].count,
      today_sessions: todaySessionsRes.rows.length,
      week_sessions: weekSessionsRes.rows[0].count,
      completion_rate: completionRateRes.rows[0].rate,
    },
    today_sessions: todaySessionsRes.rows,
    weekly_trend: weeklyTrendRes.rows,
    recent_activity: recentActivityRes.rows,
  });
});

export default router;
