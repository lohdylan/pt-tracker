import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../db.js";
import { requireTrainer, requireOwnClient } from "../middleware/auth.js";
import { isS3Enabled, uploadFile } from "../lib/storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router({ mergeParams: true });

type P = { clientId: string; photoId?: string };

const photoStorage = isS3Enabled()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: path.join(__dirname, "../../uploads/progress"),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
      },
    });

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// GET /api/clients/:clientId/progress-photos
router.get("/", requireOwnClient("clientId"), async (req, res) => {
  const { clientId } = req.params as unknown as P;
  const category = req.query.category as string | undefined;
  let query = "SELECT * FROM progress_photos WHERE client_id = $1";
  const params: (string | number)[] = [Number(clientId)];
  if (category && ["front", "side", "back", "other"].includes(category)) {
    query += " AND category = $2";
    params.push(category);
  }
  query += " ORDER BY taken_at DESC";
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// POST /api/clients/:clientId/progress-photos
router.post("/", requireTrainer, photoUpload.single("photo"), async (req, res) => {
  const { clientId } = req.params as unknown as P;
  if (!req.file) return res.status(400).json({ error: "No photo uploaded" });

  let photoUrl: string;
  if (isS3Enabled()) {
    const ext = path.extname(req.file.originalname);
    const key = `progress/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    await uploadFile(key, req.file.buffer, req.file.mimetype);
    photoUrl = key;
  } else {
    photoUrl = `/uploads/progress/${req.file.filename}`;
  }

  const { category, notes, taken_at } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO progress_photos (client_id, photo_url, category, notes, taken_at)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [clientId, photoUrl, category || "front", notes || null, taken_at || new Date().toISOString()]
  );
  res.status(201).json(rows[0]);
});

// DELETE /api/clients/:clientId/progress-photos/:photoId
router.delete("/:photoId", requireTrainer, async (req, res) => {
  const { clientId, photoId } = req.params as unknown as P;
  const { rowCount } = await pool.query(
    "DELETE FROM progress_photos WHERE id = $1 AND client_id = $2",
    [photoId, clientId]
  );
  if (!rowCount) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

export default router;
