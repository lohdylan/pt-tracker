import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import pool from "../db.js";
import { requireTrainer } from "../middleware/auth.js";
import { isS3Enabled, uploadFile } from "../lib/storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const storage = isS3Enabled()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: path.join(__dirname, "../../uploads"),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
      },
    });
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function generateAccessCode(): string {
  // 6-char alphanumeric uppercase
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

// GET /api/clients
router.get("/", requireTrainer, async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM clients ORDER BY last_name, first_name"
  );
  res.json(rows);
});

// POST /api/clients
router.post("/", requireTrainer, async (req, res) => {
  const { first_name, last_name, email, phone, goals, notes } = req.body;
  const access_code = generateAccessCode();
  const { rows } = await pool.query(
    `INSERT INTO clients (first_name, last_name, email, phone, goals, notes, access_code)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [first_name, last_name, email, phone, goals, notes, access_code]
  );
  res.status(201).json(rows[0]);
});

// GET /api/clients/:id
router.get("/:id", async (req, res) => {
  // Trainer can view any; client can view own
  if (req.user?.role === "client" && req.user.clientId !== Number(req.params.id)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const { rows } = await pool.query("SELECT * FROM clients WHERE id = $1", [
    req.params.id,
  ]);
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// PUT /api/clients/:id
router.put("/:id", requireTrainer, async (req, res) => {
  const { first_name, last_name, email, phone, goals, notes, is_active } =
    req.body;
  const { rows } = await pool.query(
    `UPDATE clients SET first_name=$1, last_name=$2, email=$3, phone=$4,
     goals=$5, notes=$6, is_active=$7, updated_at=NOW()
     WHERE id=$8 RETURNING *`,
    [first_name, last_name, email, phone, goals, notes, is_active, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// DELETE /api/clients/:id
router.delete("/:id", requireTrainer, async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM clients WHERE id = $1", [
    req.params.id,
  ]);
  if (!rowCount) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

// POST /api/clients/:id/photo
router.post("/:id/photo", requireTrainer, upload.single("photo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  let photoUrl: string;
  if (isS3Enabled()) {
    const ext = path.extname(req.file.originalname);
    const key = `clients/${Date.now()}${ext}`;
    await uploadFile(key, req.file.buffer, req.file.mimetype);
    photoUrl = key;
  } else {
    photoUrl = `/uploads/${req.file.filename}`;
  }

  const { rows } = await pool.query(
    "UPDATE clients SET photo_url=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
    [photoUrl, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// POST /api/clients/:id/regenerate-code
router.post("/:id/regenerate-code", requireTrainer, async (req, res) => {
  const access_code = generateAccessCode();
  const { rows } = await pool.query(
    "UPDATE clients SET access_code=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
    [access_code, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

export default router;
