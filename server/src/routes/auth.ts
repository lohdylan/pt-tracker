import { Router } from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// POST /api/auth/trainer-login
router.post("/trainer-login", async (req, res) => {
  const { password } = req.body;
  const trainerPassword = process.env.TRAINER_PASSWORD;

  if (!trainerPassword) {
    return res.status(500).json({ error: "TRAINER_PASSWORD env var not set" });
  }

  if (password !== trainerPassword) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = jwt.sign({ role: "trainer" }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { role: "trainer" } });
});

// POST /api/auth/client-login
router.post("/client-login", async (req, res) => {
  const { access_code } = req.body;

  if (!access_code) {
    return res.status(400).json({ error: "Access code is required" });
  }

  const { rows } = await pool.query(
    "SELECT id, first_name, last_name, is_active FROM clients WHERE access_code = $1",
    [access_code]
  );

  if (!rows.length) {
    return res.status(401).json({ error: "Invalid access code" });
  }

  const client = rows[0];
  if (!client.is_active) {
    return res.status(401).json({ error: "Account is inactive" });
  }

  const token = jwt.sign(
    { role: "client", clientId: client.id },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.json({
    token,
    user: {
      role: "client",
      clientId: client.id,
      firstName: client.first_name,
      lastName: client.last_name,
    },
  });
});

export default router;
