import pg from "pg";

const dbUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/pt_tracker";
const isInternal = dbUrl.includes(".railway.internal");

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl:
    process.env.NODE_ENV === "production" && !isInternal
      ? { rejectUnauthorized: false }
      : false,
});

export default pool;
