import { Router } from "express";
import pool from "../db.js";
import { requireTrainer, requireOwnClient } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

type P = { clientId: string; id?: string };

// GET /api/clients/:clientId/measurements — client can GET own
router.get("/", requireOwnClient("clientId"), async (req, res) => {
  const { clientId } = req.params as unknown as P;
  const { rows } = await pool.query(
    "SELECT * FROM measurements WHERE client_id = $1 ORDER BY recorded_at DESC",
    [clientId]
  );
  res.json(rows);
});

// POST /api/clients/:clientId/measurements
router.post("/", requireTrainer, async (req, res) => {
  const { clientId } = req.params as unknown as P;
  const {
    recorded_at,
    weight_lbs,
    body_fat_pct,
    chest_in,
    waist_in,
    hips_in,
    arm_in,
    thigh_in,
  } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO measurements
     (client_id, recorded_at, weight_lbs, body_fat_pct, chest_in, waist_in, hips_in, arm_in, thigh_in)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      clientId,
      recorded_at || new Date().toISOString(),
      weight_lbs,
      body_fat_pct,
      chest_in,
      waist_in,
      hips_in,
      arm_in,
      thigh_in,
    ]
  );

  // Send push notification to client
  try {
    const { notifyClient } = await import("../services/pushService.js");
    await notifyClient(Number(clientId), "New Measurement", "Your trainer recorded new measurements for you", { type: "measurement_recorded" });
  } catch { /* non-fatal */ }

  res.status(201).json(rows[0]);
});

// PUT /api/clients/:clientId/measurements/:id
router.put("/:id", requireTrainer, async (req, res) => {
  const { clientId, id } = req.params as unknown as P;
  const {
    recorded_at,
    weight_lbs,
    body_fat_pct,
    chest_in,
    waist_in,
    hips_in,
    arm_in,
    thigh_in,
  } = req.body;
  const { rows } = await pool.query(
    `UPDATE measurements SET recorded_at=$1, weight_lbs=$2, body_fat_pct=$3,
     chest_in=$4, waist_in=$5, hips_in=$6, arm_in=$7, thigh_in=$8
     WHERE id=$9 AND client_id=$10 RETURNING *`,
    [
      recorded_at,
      weight_lbs,
      body_fat_pct,
      chest_in,
      waist_in,
      hips_in,
      arm_in,
      thigh_in,
      id,
      clientId,
    ]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// DELETE /api/clients/:clientId/measurements/:id
router.delete("/:id", requireTrainer, async (req, res) => {
  const { clientId, id } = req.params as unknown as P;
  const { rowCount } = await pool.query(
    "DELETE FROM measurements WHERE id = $1 AND client_id = $2",
    [id, clientId]
  );
  if (!rowCount) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

export default router;
