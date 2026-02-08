import pool from "../db.js";
import { sendPushNotifications, getTokensForRole } from "./pushService.js";

async function sendSessionReminders() {
  try {
    // Find upcoming sessions within reminder window that haven't been notified
    const { rows: sessions } = await pool.query(
      `SELECT s.id, s.client_id, s.scheduled_at, s.duration_min,
              c.first_name, c.last_name,
              COALESCE(np.reminder_minutes_before, 60) as reminder_minutes
       FROM sessions s
       JOIN clients c ON s.client_id = c.id
       LEFT JOIN notification_preferences np ON np.role = 'client' AND np.client_id = s.client_id
       WHERE s.status = 'scheduled'
         AND s.reminder_sent = false
         AND s.scheduled_at > NOW()
         AND s.scheduled_at <= NOW() + (COALESCE(np.reminder_minutes_before, 60) || ' minutes')::interval`
    );

    for (const session of sessions) {
      // Notify client
      const clientTokens = await getTokensForRole("client", session.client_id);
      if (clientTokens.length > 0) {
        const minutesUntil = Math.round(
          (new Date(session.scheduled_at).getTime() - Date.now()) / 60000
        );
        await sendPushNotifications(
          clientTokens.map((to) => ({
            to,
            title: "Session Reminder",
            body: `Your session is in ${minutesUntil} minutes`,
            data: { type: "session_reminder", sessionId: session.id },
          }))
        );
      }

      // Notify trainer
      const trainerTokens = await getTokensForRole("trainer");
      if (trainerTokens.length > 0) {
        await sendPushNotifications(
          trainerTokens.map((to) => ({
            to,
            title: "Upcoming Session",
            body: `${session.first_name} ${session.last_name} session coming up`,
            data: { type: "session_reminder", sessionId: session.id },
          }))
        );
      }

      // Mark as sent
      await pool.query("UPDATE sessions SET reminder_sent = true WHERE id = $1", [session.id]);
    }
  } catch (err) {
    console.error("Scheduler error:", err);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startScheduler() {
  console.log("Starting notification scheduler (5 min interval)");
  // Run immediately once
  sendSessionReminders();
  // Then every 5 minutes
  intervalId = setInterval(sendSessionReminders, 5 * 60 * 1000);
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
