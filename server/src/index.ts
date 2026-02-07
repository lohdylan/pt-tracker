import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import clientsRouter from "./routes/clients.js";
import sessionsRouter from "./routes/sessions.js";
import workoutLogsRouter from "./routes/workoutLogs.js";
import templatesRouter from "./routes/templates.js";
import measurementsRouter from "./routes/measurements.js";
import analyticsRouter from "./routes/analytics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/clients", clientsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/sessions/:sessionId/logs", workoutLogsRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/clients/:clientId/measurements", measurementsRouter);
app.use("/api/analytics", analyticsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
