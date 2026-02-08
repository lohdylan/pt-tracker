import { Router } from "express";
import pool from "../db.js";
import { requireTrainer } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

type P = { sessionId: string; logId?: string };

// GET /api/sessions/:sessionId/logs
router.get("/", async (req, res) => {
  const { sessionId } = req.params as unknown as P;

  // Client can only view logs for their own sessions
  if (req.user?.role === "client") {
    const { rows: sessionRows } = await pool.query(
      "SELECT client_id FROM sessions WHERE id = $1",
      [sessionId]
    );
    if (!sessionRows.length || sessionRows[0].client_id !== req.user.clientId) {
      return res.status(403).json({ error: "Access denied" });
    }
  }

  const { rows } = await pool.query(
    "SELECT * FROM workout_logs WHERE session_id = $1 ORDER BY sort_order",
    [sessionId]
  );
  res.json(rows);
});

// POST /api/sessions/:sessionId/logs
router.post("/", requireTrainer, async (req, res) => {
  const { sessionId } = req.params as unknown as P;
  const { exercise_name, exercise_id, sets, reps, weight, sort_order, sets_detail, notes } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO workout_logs (session_id, exercise_name, exercise_id, sets, reps, weight, sort_order, sets_detail, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [sessionId, exercise_name, exercise_id || null, sets, reps, weight, sort_order || 0, JSON.stringify(sets_detail || []), notes || null]
  );
  res.status(201).json(rows[0]);
});

// POST /api/sessions/:sessionId/logs/batch — bulk insert in transaction
router.post("/batch", requireTrainer, async (req, res) => {
  const { sessionId } = req.params as unknown as P;
  const { logs } = req.body as { logs: Array<{
    exercise_name: string;
    exercise_id?: number;
    sets?: number;
    reps?: number;
    weight?: number;
    sort_order?: number;
    sets_detail?: unknown[];
    notes?: string;
  }> };

  if (!Array.isArray(logs) || logs.length === 0) {
    return res.status(400).json({ error: "logs array is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const results = [];
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const { rows } = await client.query(
        `INSERT INTO workout_logs (session_id, exercise_name, exercise_id, sets, reps, weight, sort_order, sets_detail, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          sessionId,
          log.exercise_name,
          log.exercise_id || null,
          log.sets ?? null,
          log.reps ?? null,
          log.weight ?? null,
          log.sort_order ?? i,
          JSON.stringify(log.sets_detail || []),
          log.notes || null,
        ]
      );
      results.push(rows[0]);
    }
    await client.query("COMMIT");
    res.status(201).json(results);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

// PUT /api/sessions/:sessionId/logs/reorder — bulk sort_order update
router.put("/reorder", requireTrainer, async (req, res) => {
  const { sessionId } = req.params as unknown as P;
  const { order } = req.body as { order: Array<{ id: number; sort_order: number }> };

  if (!Array.isArray(order)) {
    return res.status(400).json({ error: "order array is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of order) {
      await client.query(
        "UPDATE workout_logs SET sort_order=$1 WHERE id=$2 AND session_id=$3",
        [item.sort_order, item.id, sessionId]
      );
    }
    await client.query("COMMIT");
    const { rows } = await pool.query(
      "SELECT * FROM workout_logs WHERE session_id = $1 ORDER BY sort_order",
      [sessionId]
    );
    res.json(rows);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

// PUT /api/sessions/:sessionId/logs/:logId
router.put("/:logId", requireTrainer, async (req, res) => {
  const { sessionId, logId } = req.params as unknown as P;
  const { exercise_name, exercise_id, sets, reps, weight, sort_order, sets_detail, notes } = req.body;
  const { rows } = await pool.query(
    `UPDATE workout_logs SET exercise_name=$1, sets=$2, reps=$3, weight=$4, sort_order=$5,
     exercise_id=$6, sets_detail=$7, notes=$8
     WHERE id=$9 AND session_id=$10 RETURNING *`,
    [exercise_name, sets, reps, weight, sort_order, exercise_id || null, JSON.stringify(sets_detail || []), notes || null, logId, sessionId]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// DELETE /api/sessions/:sessionId/logs/:logId
router.delete("/:logId", requireTrainer, async (req, res) => {
  const { sessionId, logId } = req.params as unknown as P;
  const { rowCount } = await pool.query(
    "DELETE FROM workout_logs WHERE id = $1 AND session_id = $2",
    [logId, sessionId]
  );
  if (!rowCount) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

export default router;
