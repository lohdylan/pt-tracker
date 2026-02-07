import { Router } from "express";
import pool from "../db.js";

const router = Router({ mergeParams: true });

type P = { sessionId: string; logId?: string };

// GET /api/sessions/:sessionId/logs
router.get("/", async (req, res) => {
  const { sessionId } = req.params as unknown as P;
  const { rows } = await pool.query(
    "SELECT * FROM workout_logs WHERE session_id = $1 ORDER BY sort_order",
    [sessionId]
  );
  res.json(rows);
});

// POST /api/sessions/:sessionId/logs
router.post("/", async (req, res) => {
  const { sessionId } = req.params as unknown as P;
  const { exercise_name, sets, reps, weight, sort_order } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO workout_logs (session_id, exercise_name, sets, reps, weight, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [sessionId, exercise_name, sets, reps, weight, sort_order || 0]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/sessions/:sessionId/logs/:logId
router.put("/:logId", async (req, res) => {
  const { sessionId, logId } = req.params as unknown as P;
  const { exercise_name, sets, reps, weight, sort_order } = req.body;
  const { rows } = await pool.query(
    `UPDATE workout_logs SET exercise_name=$1, sets=$2, reps=$3, weight=$4, sort_order=$5
     WHERE id=$6 AND session_id=$7 RETURNING *`,
    [exercise_name, sets, reps, weight, sort_order, logId, sessionId]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// DELETE /api/sessions/:sessionId/logs/:logId
router.delete("/:logId", async (req, res) => {
  const { sessionId, logId } = req.params as unknown as P;
  const { rowCount } = await pool.query(
    "DELETE FROM workout_logs WHERE id = $1 AND session_id = $2",
    [logId, sessionId]
  );
  if (!rowCount) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

export default router;
