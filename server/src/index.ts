import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";
import clientsRouter from "./routes/clients.js";
import sessionsRouter from "./routes/sessions.js";
import workoutLogsRouter from "./routes/workoutLogs.js";
import templatesRouter from "./routes/templates.js";
import measurementsRouter from "./routes/measurements.js";
import analyticsRouter from "./routes/analytics.js";
import exercisesRouter from "./routes/exercises.js";
import progressPhotosRouter from "./routes/progressPhotos.js";
import notificationsRouter from "./routes/notifications.js";
import messagesRouter from "./routes/messages.js";
import { startScheduler } from "./services/scheduler.js";
import * as Sentry from "@sentry/node";
import { isS3Enabled, getSignedFileUrl } from "./lib/storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Public routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// File proxy -- serves uploaded files via S3 presigned URL redirect
app.get("/api/files/*key", requireAuth, async (req, res) => {
  if (!isS3Enabled()) {
    return res.status(404).json({ error: "S3 not configured" });
  }
  try {
    const key = (req.params as Record<string, string>).key;
    const url = await getSignedFileUrl(key);
    res.redirect(url);
  } catch (err) {
    console.error("File proxy error:", err);
    res.status(500).json({ error: "Failed to generate file URL" });
  }
});

app.use("/api/auth", authRouter);

// Protected routes — requireAuth applied per-router
app.use("/api/clients", requireAuth, clientsRouter);
app.use("/api/sessions", requireAuth, sessionsRouter);
app.use("/api/sessions/:sessionId/logs", requireAuth, workoutLogsRouter);
app.use("/api/templates", requireAuth, templatesRouter);
app.use("/api/clients/:clientId/measurements", requireAuth, measurementsRouter);
app.use("/api/analytics", requireAuth, analyticsRouter);
app.use("/api/exercises", requireAuth, exercisesRouter);
app.use("/api/clients/:clientId/progress-photos", requireAuth, progressPhotosRouter);
app.use("/api/notifications", requireAuth, notificationsRouter);
app.use("/api/messages", requireAuth, messagesRouter);

// Sentry error handler -- must be after all routes, before custom error handlers
Sentry.setupExpressErrorHandler(app);

// Fallback error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`DATABASE_URL set: ${!!process.env.DATABASE_URL} (host: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'NOT SET'})`);
  startScheduler();
});
