import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/sessions?from=&to=&client_id=
router.get("/", async (req, res) => {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (req.query.from) {
    conditions.push(`s.scheduled_at >= $${i++}`);
    params.push(req.query.from);
  }
  if (req.query.to) {
    conditions.push(`s.scheduled_at <= $${i++}`);
    params.push(req.query.to);
  }
  if (req.query.client_id) {
    conditions.push(`s.client_id = $${i++}`);
    params.push(req.query.client_id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `SELECT s.*, c.first_name, c.last_name
     FROM sessions s JOIN clients c ON s.client_id = c.id
     ${where} ORDER BY s.scheduled_at`,
    params
  );
  res.json(rows);
});

// POST /api/sessions
router.post("/", async (req, res) => {
  const { client_id, scheduled_at, duration_min, notes } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO sessions (client_id, scheduled_at, duration_min, notes)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [client_id, scheduled_at, duration_min || 60, notes]
  );
  res.status(201).json(rows[0]);
});

// GET /api/sessions/:id
router.get("/:id", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.*, c.first_name, c.last_name
     FROM sessions s JOIN clients c ON s.client_id = c.id
     WHERE s.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// PUT /api/sessions/:id
router.put("/:id", async (req, res) => {
  const { client_id, scheduled_at, duration_min, status, notes } = req.body;
  const { rows } = await pool.query(
    `UPDATE sessions SET client_id=$1, scheduled_at=$2, duration_min=$3,
     status=$4, notes=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
    [client_id, scheduled_at, duration_min, status, notes, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// DELETE /api/sessions/:id
router.delete("/:id", async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM sessions WHERE id = $1", [
    req.params.id,
  ]);
  if (!rowCount) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

export default router;
