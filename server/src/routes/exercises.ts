import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../db.js";
import { requireTrainer } from "../middleware/auth.js";
import { isS3Enabled, uploadFile } from "../lib/storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const videoStorage = isS3Enabled()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: path.join(__dirname, "../../uploads/videos"),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
      },
    });

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only mp4, mov, avi, and webm video files are allowed"));
    }
  },
});

// GET /api/exercises/search?q= — autocomplete
router.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json([]);
  const { rows } = await pool.query(
    "SELECT * FROM exercises WHERE exercise_name ILIKE $1 ORDER BY exercise_name LIMIT 10",
    [`%${q}%`]
  );
  res.json(rows);
});

// GET /api/exercises — both roles
router.get("/", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM exercises ORDER BY exercise_name"
  );
  res.json(rows);
});

// GET /api/exercises/:id — both roles
router.get("/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM exercises WHERE id = $1", [
    req.params.id,
  ]);
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// POST /api/exercises — trainer only
router.post("/", requireTrainer, async (req, res) => {
  const { exercise_name, description, video_url, thumbnail_url } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO exercises (exercise_name, description, video_url, thumbnail_url)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [exercise_name, description, video_url, thumbnail_url]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/exercises/:id — trainer only
router.put("/:id", requireTrainer, async (req, res) => {
  const { exercise_name, description, video_url, thumbnail_url } = req.body;
  const { rows } = await pool.query(
    `UPDATE exercises SET exercise_name=$1, description=$2, video_url=$3,
     thumbnail_url=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
    [exercise_name, description, video_url, thumbnail_url, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// DELETE /api/exercises/:id — trainer only
router.delete("/:id", requireTrainer, async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM exercises WHERE id = $1", [
    req.params.id,
  ]);
  if (!rowCount) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

// POST /api/exercises/:id/video — trainer only, upload video file
router.post("/:id/video", requireTrainer, videoUpload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No video file uploaded" });

  let videoPath: string;
  if (isS3Enabled()) {
    const ext = path.extname(req.file.originalname);
    const key = `videos/${Date.now()}${ext}`;
    await uploadFile(key, req.file.buffer, req.file.mimetype);
    videoPath = key;
  } else {
    videoPath = `/uploads/videos/${req.file.filename}`;
  }

  const { rows } = await pool.query(
    "UPDATE exercises SET video_path=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
    [videoPath, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

export default router;
