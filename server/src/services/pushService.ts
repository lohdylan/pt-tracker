import pool from "../db.js";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotifications(messages: PushMessage[]) {
  if (messages.length === 0) return;

  // Chunk into batches of 100 per Expo limit
  const chunks: PushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chunk),
      });
      const result = await res.json();
      // Deactivate invalid tokens
      if (result.data) {
        for (let i = 0; i < result.data.length; i++) {
          if (result.data[i].status === "error" && result.data[i].details?.error === "DeviceNotRegistered") {
            await pool.query("UPDATE push_tokens SET is_active = false WHERE expo_push_token = $1", [chunk[i].to]);
          }
        }
      }
    } catch (err) {
      console.error("Push notification error:", err);
    }
  }
}

export async function getTokensForRole(role: "trainer" | "client", clientId?: number): Promise<string[]> {
  let query = "SELECT expo_push_token FROM push_tokens WHERE role = $1 AND is_active = true";
  const params: (string | number)[] = [role];
  if (clientId) {
    query += " AND client_id = $2";
    params.push(clientId);
  }
  const { rows } = await pool.query(query, params);
  return rows.map((r) => r.expo_push_token);
}

export async function notifyTrainer(title: string, body: string, data?: Record<string, unknown>) {
  const tokens = await getTokensForRole("trainer");
  if (tokens.length === 0) return;
  await sendPushNotifications(tokens.map((to) => ({ to, title, body, data })));
}

export async function notifyClient(clientId: number, title: string, body: string, data?: Record<string, unknown>) {
  // Check client preferences first
  const { rows: prefs } = await pool.query(
    "SELECT * FROM notification_preferences WHERE role = 'client' AND client_id = $1",
    [clientId]
  );
  const pref = prefs[0];
  // If preferences exist and the relevant type is disabled, skip
  if (pref && data?.type === "workout_logged" && !pref.workout_logged) return;
  if (pref && data?.type === "measurement_recorded" && !pref.measurement_recorded) return;
  if (pref && data?.type === "session_reminder" && !pref.session_reminders) return;

  const tokens = await getTokensForRole("client", clientId);
  if (tokens.length === 0) return;
  await sendPushNotifications(tokens.map((to) => ({ to, title, body, data })));
}
