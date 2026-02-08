import { Router } from "express";
import pool from "../db.js";
import { requireTrainer } from "../middleware/auth.js";

const router = Router();

// GET /api/messages/conversations — trainer gets all threads, client gets own
router.get("/conversations", async (req, res) => {
  if (req.user?.role === "trainer") {
    const { rows } = await pool.query(
      `SELECT c.id as client_id, c.first_name, c.last_name, c.photo_url,
              m.content as last_message, m.created_at as last_message_at, m.sender_role,
              (SELECT COUNT(*)::int FROM messages WHERE client_id = c.id AND read_at IS NULL AND sender_role = 'client') as unread_count
       FROM clients c
       LEFT JOIN LATERAL (
         SELECT content, created_at, sender_role FROM messages WHERE client_id = c.id ORDER BY created_at DESC LIMIT 1
       ) m ON true
       WHERE c.is_active = true
       ORDER BY m.created_at DESC NULLS LAST`
    );
    return res.json(rows);
  }

  // Client — return just their conversation summary
  const clientId = req.user?.clientId;
  const { rows } = await pool.query(
    `SELECT $1::int as client_id,
            (SELECT COUNT(*)::int FROM messages WHERE client_id = $1 AND read_at IS NULL AND sender_role = 'trainer') as unread_count,
            m.content as last_message, m.created_at as last_message_at, m.sender_role
     FROM (SELECT content, created_at, sender_role FROM messages WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1) m`,
    [clientId]
  );
  res.json(rows);
});

// GET /api/messages/conversations/:clientId — message history
router.get("/conversations/:clientId", async (req, res) => {
  const clientId = Number(req.params.clientId);

  // Client can only view own messages
  if (req.user?.role === "client" && req.user.clientId !== clientId) {
    return res.status(403).json({ error: "Access denied" });
  }

  const limit = Number(req.query.limit) || 50;
  const before = req.query.before as string | undefined;

  let query = "SELECT * FROM messages WHERE client_id = $1";
  const params: (number | string)[] = [clientId];
  if (before) {
    query += " AND created_at < $2";
    params.push(before);
  }
  query += " ORDER BY created_at DESC LIMIT $" + (params.length + 1);
  params.push(limit);

  const { rows } = await pool.query(query, params);
  res.json(rows.reverse());
});

// POST /api/messages/conversations/:clientId — send message
router.post("/conversations/:clientId", async (req, res) => {
  const clientId = Number(req.params.clientId);
  const { content } = req.body;

  if (!content?.trim()) return res.status(400).json({ error: "content is required" });

  // Client can only send to own thread
  if (req.user?.role === "client" && req.user.clientId !== clientId) {
    return res.status(403).json({ error: "Access denied" });
  }

  const senderRole = req.user!.role;
  const senderId = senderRole === "client" ? req.user!.clientId : null;

  const { rows } = await pool.query(
    `INSERT INTO messages (client_id, sender_role, sender_id, content)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [clientId, senderRole, senderId, content.trim()]
  );

  // Send push notification to the other side
  try {
    const { notifyClient, notifyTrainer } = await import("../services/pushService.js");
    if (senderRole === "trainer") {
      const { rows: clientRows } = await pool.query("SELECT first_name FROM clients WHERE id = $1", [clientId]);
      const name = clientRows[0]?.first_name || "Client";
      await notifyClient(clientId, "New Message", `Your trainer sent you a message`, { type: "message", clientId });
    } else {
      const { rows: clientRows } = await pool.query("SELECT first_name, last_name FROM clients WHERE id = $1", [clientId]);
      const name = clientRows[0] ? `${clientRows[0].first_name} ${clientRows[0].last_name}` : "A client";
      await notifyTrainer("New Message", `${name}: ${content.trim().slice(0, 50)}`, { type: "message", clientId });
    }
  } catch {
    // Non-fatal — message still saved
  }

  res.status(201).json(rows[0]);
});

// PUT /api/messages/conversations/:clientId/read — mark all as read
router.put("/conversations/:clientId/read", async (req, res) => {
  const clientId = Number(req.params.clientId);
  const readerRole = req.user!.role;

  // Mark messages from the OTHER role as read
  const otherRole = readerRole === "trainer" ? "client" : "trainer";

  // Client can only mark own thread
  if (readerRole === "client" && req.user!.clientId !== clientId) {
    return res.status(403).json({ error: "Access denied" });
  }

  await pool.query(
    "UPDATE messages SET read_at = NOW() WHERE client_id = $1 AND sender_role = $2 AND read_at IS NULL",
    [clientId, otherRole]
  );
  res.json({ success: true });
});

// GET /api/messages/unread-count
router.get("/unread-count", async (req, res) => {
  if (req.user?.role === "trainer") {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int as count FROM messages WHERE sender_role = 'client' AND read_at IS NULL"
    );
    return res.json({ count: rows[0].count });
  }

  const clientId = req.user?.clientId;
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int as count FROM messages WHERE client_id = $1 AND sender_role = 'trainer' AND read_at IS NULL",
    [clientId]
  );
  res.json({ count: rows[0].count });
});

export default router;
