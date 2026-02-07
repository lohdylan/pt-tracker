import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/templates
router.get("/", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM workout_templates ORDER BY name"
  );
  res.json(rows);
});

// POST /api/templates
router.post("/", async (req, res) => {
  const { name, exercises } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO workout_templates (name, exercises) VALUES ($1,$2) RETURNING *`,
    [name, JSON.stringify(exercises || [])]
  );
  res.status(201).json(rows[0]);
});

// GET /api/templates/:id
router.get("/:id", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM workout_templates WHERE id = $1",
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// PUT /api/templates/:id
router.put("/:id", async (req, res) => {
  const { name, exercises } = req.body;
  const { rows } = await pool.query(
    `UPDATE workout_templates SET name=$1, exercises=$2, updated_at=NOW()
     WHERE id=$3 RETURNING *`,
    [name, JSON.stringify(exercises || []), req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// DELETE /api/templates/:id
router.delete("/:id", async (req, res) => {
  const { rowCount } = await pool.query(
    "DELETE FROM workout_templates WHERE id = $1",
    [req.params.id]
  );
  if (!rowCount) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

export default router;
