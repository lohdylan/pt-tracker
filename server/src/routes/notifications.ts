import { Router } from "express";
import pool from "../db.js";

const router = Router();

// POST /api/notifications/register — register push token
router.post("/register", async (req, res) => {
  const { expo_push_token, device_name } = req.body;
  if (!expo_push_token) return res.status(400).json({ error: "expo_push_token required" });

  const role = req.user!.role;
  const clientId = req.user!.clientId || null;

  await pool.query(
    `INSERT INTO push_tokens (role, client_id, expo_push_token, device_name, is_active)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (expo_push_token)
     DO UPDATE SET is_active = true, device_name = $4, role = $1, client_id = $2`,
    [role, clientId, expo_push_token, device_name || null]
  );
  res.json({ success: true });
});

// POST /api/notifications/unregister — deactivate push token
router.post("/unregister", async (req, res) => {
  const { expo_push_token } = req.body;
  if (!expo_push_token) return res.status(400).json({ error: "expo_push_token required" });
  await pool.query(
    "UPDATE push_tokens SET is_active = false WHERE expo_push_token = $1",
    [expo_push_token]
  );
  res.json({ success: true });
});

// GET /api/notifications/preferences
router.get("/preferences", async (req, res) => {
  const role = req.user!.role;
  const clientId = req.user!.clientId || null;

  const { rows } = await pool.query(
    "SELECT * FROM notification_preferences WHERE role = $1 AND client_id IS NOT DISTINCT FROM $2",
    [role, clientId]
  );

  if (rows.length === 0) {
    // Return defaults
    return res.json({
      session_reminders: true,
      workout_logged: true,
      measurement_recorded: true,
      reminder_minutes_before: 60,
    });
  }
  res.json(rows[0]);
});

// PUT /api/notifications/preferences
router.put("/preferences", async (req, res) => {
  const role = req.user!.role;
  const clientId = req.user!.clientId || null;
  const { session_reminders, workout_logged, measurement_recorded, reminder_minutes_before } = req.body;

  const { rows } = await pool.query(
    `INSERT INTO notification_preferences (role, client_id, session_reminders, workout_logged, measurement_recorded, reminder_minutes_before)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (role, client_id)
     DO UPDATE SET session_reminders=$3, workout_logged=$4, measurement_recorded=$5, reminder_minutes_before=$6, updated_at=NOW()
     RETURNING *`,
    [role, clientId, session_reminders ?? true, workout_logged ?? true, measurement_recorded ?? true, reminder_minutes_before ?? 60]
  );
  res.json(rows[0]);
});

// POST /api/notifications/test — send test notification to self
router.post("/test", async (req, res) => {
  const role = req.user!.role;
  const clientId = req.user!.clientId || null;

  let query = "SELECT expo_push_token FROM push_tokens WHERE role = $1 AND is_active = true";
  const params: (string | number | null)[] = [role];
  if (clientId) {
    query += " AND client_id = $2";
    params.push(clientId);
  }
  const { rows } = await pool.query(query, params);

  if (rows.length === 0) {
    return res.status(400).json({ error: "No push tokens registered" });
  }

  const messages = rows.map((r) => ({
    to: r.expo_push_token,
    title: "Test Notification",
    body: "This is a test notification from PT Tracker!",
  }));

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
    res.json({ success: true, sent_to: rows.length });
  } catch {
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

export default router;
