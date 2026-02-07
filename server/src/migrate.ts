import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      ran_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const migrationDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith(".sql")).sort();
  const { rows: ran } = await pool.query("SELECT name FROM migrations");
  const ranNames = new Set(ran.map((r) => r.name));

  for (const file of files) {
    if (ranNames.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationDir, file), "utf-8");
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
    await pool.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
  }

  console.log("Migrations complete.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
