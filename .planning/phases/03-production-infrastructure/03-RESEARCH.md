# Phase 3: Production Infrastructure - Research

**Researched:** 2026-02-07
**Domain:** Cloud deployment, PostgreSQL hosting, HTTPS, error monitoring, file storage
**Confidence:** HIGH

## Summary

This phase deploys the PT Tracker Express/PostgreSQL server to production with HTTPS, proper secrets management, file storage for uploads, and error monitoring. The app is a solo-trainer tool (single user, not SaaS) with 11 API routes, file uploads (client photos, progress photos, exercise videos), a push notification scheduler, and 12 SQL migrations.

The recommended approach is **Railway** for hosting (server + PostgreSQL + storage bucket), **Sentry** free tier for error monitoring, and a **compiled TypeScript build** (tsc to JavaScript) for production runtime. Railway provides automatic HTTPS on its `*.up.railway.app` domains, built-in secret management, S3-compatible storage buckets for file uploads, and usage-based pricing that will cost roughly $5-10/month for this small app.

**Primary recommendation:** Deploy to Railway with a PostgreSQL plugin, a storage bucket for file uploads, compiled JS for production, and Sentry free tier for error tracking.

## Standard Stack

### Core (Hosting & Infrastructure)

| Service | Purpose | Why Standard | Cost |
|---------|---------|--------------|------|
| Railway (Hobby plan) | Server hosting | Usage-based pricing, auto-HTTPS, GitHub deploy, built-in PostgreSQL & S3 buckets | $5/mo base + usage (typically $5-10 total) |
| Railway PostgreSQL | Production database | One-click provision, auto-provides DATABASE_URL, included in usage credits | Included in usage |
| Railway Storage Bucket | File uploads (photos, videos) | S3-compatible, free egress, free API ops, $0.015/GB-mo storage | ~$0.015/GB-mo |
| Sentry (Developer plan) | Error tracking & monitoring | Free tier for solo dev, Express integration, alerts via email | Free |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sentry/node | ^10.38.0 | Server error tracking | Always -- captures unhandled errors + Express request context |
| @aws-sdk/client-s3 | latest | S3-compatible bucket uploads | Replaces multer diskStorage for production file uploads |
| @aws-sdk/s3-request-presigner | latest | Generate presigned URLs for serving files | Serve uploaded photos/videos to mobile app |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Railway | Render (Starter $7/mo) | Render has no built-in S3 buckets; free PG expires in 30 days; persistent disk costs extra. Railway is simpler for this stack. |
| Railway | Fly.io | More complex (Docker required, CLI-heavy), better for global distribution which this app does not need |
| Railway | DigitalOcean | More powerful but higher complexity/cost ($12+/mo), overkill for a single-user app |
| Railway Storage Bucket | AWS S3 | AWS S3 charges for egress ($0.09/GB) and API calls; Railway buckets have free egress and free API calls. No AWS account needed. |
| Railway Storage Bucket | Railway Volume | Volume works but limited to 5GB on Hobby, one volume per service, files not CDN-served. Bucket is better for user-uploaded media. |
| Sentry | BetterStack / LogRocket | Sentry is the industry standard for error tracking, has a generous free tier, and specific Express integration |

**Installation (new server dependencies):**
```bash
cd server && npm install @sentry/node @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Architecture Patterns

### Production Build Strategy

The server currently runs via `tsx` (TypeScript execution without compilation). For production on Railway, **compile TypeScript to JavaScript** with `tsc`:

**Why compile instead of using tsx in production:**
- Eliminates transpilation overhead at startup
- No dependency on `tsx` in production (smaller deployment)
- Required for Sentry's `--import` flag to work with ESM (Sentry instrument file must be `.mjs`, not `.ts`)
- Industry standard for production Node.js TypeScript apps

**package.json scripts to add:**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node --import ./dist/instrument.mjs dist/index.js",
    "migrate": "tsx src/migrate.ts",
    "seed": "tsx src/seed.ts"
  }
}
```

**Railway auto-detection:** Railpack (Railway's new builder, replacing deprecated Nixpacks) automatically detects Node.js projects, runs `npm run build`, then `npm run start`.

### File Upload Architecture Change

**Current (development):** multer writes to local `./uploads/` directory, Express serves via `express.static`, database stores relative paths like `/uploads/progress/filename.jpg`, mobile app prepends `UPLOADS_BASE` (server hostname).

**Production (Railway bucket):** Replace multer diskStorage with S3 upload to Railway's bucket. Database stores the S3 object key. Serve files via presigned URLs or a proxy endpoint.

**Three routes need updating:**
1. `routes/clients.ts` -- client profile photos (multer to S3)
2. `routes/exercises.ts` -- exercise demo videos (multer to S3)
3. `routes/progressPhotos.ts` -- progress photos (multer to S3)

**Pattern for S3 uploads:**
```typescript
// src/lib/storage.ts -- centralized S3 client
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.BUCKET_REGION || "us-east-1",
  endpoint: process.env.BUCKET_ENDPOINT,
  credentials: {
    accessKeyId: process.env.BUCKET_ACCESS_KEY_ID!,
    secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for Railway buckets
});

const BUCKET = process.env.BUCKET_NAME!;

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return key;
}

export async function getSignedFileUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}
```

**Pattern for updating routes (multer memoryStorage + S3 upload):**
```typescript
// Switch from diskStorage to memoryStorage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// In route handler:
router.post("/", upload.single("photo"), async (req, res) => {
  const key = `progress/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  await uploadFile(key, req.file!.buffer, req.file!.mimetype);
  // Store key in database instead of /uploads/... path
  await pool.query("INSERT INTO progress_photos (photo_url, ...) VALUES ($1, ...)", [key]);
});
```

**Pattern for serving files (presigned URL endpoint):**
```typescript
// GET /api/files/:key(*) -- serve any uploaded file via presigned redirect
router.get("/files/*", requireAuth, async (req, res) => {
  const key = req.params[0]; // Everything after /files/
  const url = await getSignedFileUrl(key);
  res.redirect(url);
});
```

### Mobile App API URL Configuration

**Current:** Hardcoded `DEV_HOST` IP in `mobile/src/api.ts`. For production, use environment variables via Expo.

```typescript
// mobile/src/api.ts -- production-aware
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://192.168.1.68:3000";

const BASE = `${API_URL}/api`;
export const UPLOADS_BASE = API_URL;
```

Configure via `app.json` or `app.config.ts`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-app.up.railway.app"
    }
  }
}
```

### Sentry Initialization (ESM + Compiled JS)

**Critical constraint:** Sentry's `--import` flag requires a compiled `.mjs` file, not TypeScript. The instrument file must be loaded before any other modules.

```typescript
// src/instrument.ts (compiled to dist/instrument.mjs by tsc)
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 0.2, // 20% of requests for performance monitoring
  sendDefaultPii: false,
});
```

**In index.ts (after Sentry loads via --import):**
```typescript
import * as Sentry from "@sentry/node";
// ... app setup ...
// MUST be after all routes, before custom error handlers
Sentry.setupExpressErrorHandler(app);
```

### Environment Variables (Railway)

| Variable | Source | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Railway PostgreSQL plugin (auto-injected) | Database connection string |
| `JWT_SECRET` | Railway Variables tab (manual) | JWT signing key |
| `TRAINER_PASSWORD` | Railway Variables tab (manual) | Trainer login password |
| `SENTRY_DSN` | Railway Variables tab (manual, from Sentry dashboard) | Error tracking endpoint |
| `BUCKET_ENDPOINT` | Railway Storage Bucket (auto from credentials tab) | S3-compatible endpoint |
| `BUCKET_ACCESS_KEY_ID` | Railway Storage Bucket (auto) | S3 access key |
| `BUCKET_SECRET_ACCESS_KEY` | Railway Storage Bucket (auto) | S3 secret key |
| `BUCKET_NAME` | Railway Storage Bucket (auto) | Bucket name |
| `BUCKET_REGION` | Railway Storage Bucket (auto) | Bucket region |
| `PORT` | Railway (auto-injected) | Server listen port |
| `NODE_ENV` | Railway Variables tab (set to "production") | Environment indicator |

**Railway reference syntax:** Use `${{Postgres.DATABASE_URL}}` to reference the PostgreSQL service's DATABASE_URL from the server service.

### Recommended Project Structure Changes

```
server/
├── src/
│   ├── instrument.ts     # NEW: Sentry initialization (loaded via --import)
│   ├── index.ts          # Add Sentry error handler after routes
│   ├── lib/
│   │   └── storage.ts    # NEW: S3 upload/download helpers
│   ├── db.ts             # No changes (already uses DATABASE_URL)
│   ├── migrate.ts        # No changes
│   ├── seed.ts           # May need tweaks for production seeding
│   ├── routes/           # Update 3 files for S3 uploads
│   ├── services/         # No changes (scheduler works as-is)
│   └── middleware/        # No changes
├── dist/                 # NEW: Compiled JS output (gitignored)
├── tsconfig.json         # Update for build output
└── package.json          # Add build + start scripts
```

### Anti-Patterns to Avoid

- **Running tsx in production:** Use compiled JS. tsx adds startup overhead and complicates Sentry's --import flag.
- **Storing files on Railway's ephemeral filesystem:** Files written to the container filesystem (without a volume or bucket) are lost on every deploy. Use the storage bucket.
- **Hardcoding the API URL in the mobile app:** Use Expo config/environment variables so dev and prod URLs can coexist.
- **Using multer diskStorage in production:** Switch to memoryStorage + S3 upload. diskStorage writes to the container filesystem.
- **Committing .env files or secrets:** Use Railway's Variables tab. Never hardcode JWT_SECRET or TRAINER_PASSWORD.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTPS/TLS termination | Custom certificate management | Railway auto-HTTPS | Railway automatically provisions Let's Encrypt certificates for all domains |
| File storage service | Custom file server or volume management | Railway Storage Bucket | S3-compatible, free egress, handles scaling, encryption at rest |
| Error tracking | Custom error logging to file/DB | Sentry free tier | Captures stack traces, request context, alerts, grouping -- impossible to replicate well |
| Database provisioning | Manual PostgreSQL install | Railway PostgreSQL plugin | One-click, auto-provides connection string, managed backups |
| CI/CD pipeline | Custom deploy scripts | Railway GitHub integration | Auto-deploys on push to branch, zero-downtime with health checks |
| Process management | PM2 or custom restart logic | Railway container management | Auto-restarts crashed processes, health check rollbacks |
| Secret management | .env files on server | Railway Variables | Encrypted, per-environment, supports cross-service references |

## Common Pitfalls

### Pitfall 1: Forgetting to Update Database Photo URLs
**What goes wrong:** The database currently stores file paths like `/uploads/progress/filename.jpg`. After moving to S3 bucket storage, new uploads store S3 keys like `progress/filename.jpg`. Old data in the database still has the old path format.
**Why it happens:** Migration of storage backend without migrating existing data.
**How to avoid:** Since this is pre-launch (no production data yet), this is not an issue. The seed script will create fresh data. But be aware that the mobile app's URL construction pattern (`UPLOADS_BASE + photo_url`) will need to change -- either serve via presigned URLs or a proxy endpoint.
**Warning signs:** Broken images in the mobile app after deployment.

### Pitfall 2: Sentry --import Flag with tsx/ESM
**What goes wrong:** Sentry's `--import ./instrument.mjs` flag does not work with TypeScript files when using tsx. The instrument file must be compiled JavaScript.
**Why it happens:** Node's `--import` runs before any loaders (including tsx's TypeScript transpiler), so it cannot parse TypeScript.
**How to avoid:** Use `tsc` to compile the project, then run `node --import ./dist/instrument.mjs dist/index.js`. Do not use tsx in the production start command.
**Warning signs:** `SyntaxError: Cannot use import statement` or Sentry silently failing to initialize.

### Pitfall 3: Railway PostgreSQL Connection String with SSL
**What goes wrong:** Railway's PostgreSQL requires SSL connections. The `pg` library may reject the connection if SSL is not configured.
**Why it happens:** Default `pg.Pool` config does not enable SSL.
**How to avoid:** Update `db.ts` to handle SSL:
```typescript
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});
```
**Warning signs:** `ECONNREFUSED` or SSL handshake errors in production logs.

### Pitfall 4: Scheduler Interval in Single-Instance Deployment
**What goes wrong:** The 5-minute `setInterval` scheduler works fine on a single instance. But if Railway ever scales to multiple instances (unlikely for this app, but possible), each instance runs its own scheduler, causing duplicate notifications.
**Why it happens:** In-process scheduling with no distributed lock.
**How to avoid:** For a single-user app, this is acceptable. The scheduler runs in-process with `setInterval`, which works fine on Railway's single container. Just be aware of this if scaling.
**Warning signs:** Clients receiving duplicate push notifications.

### Pitfall 5: Upload Size Limits on Railway
**What goes wrong:** Railway has default request body size limits. Large video uploads may fail silently.
**Why it happens:** Reverse proxy or container memory limits.
**How to avoid:** The current video upload limit is reasonable (multer `fileSize: 10MB` for photos, videos likely similar). Railway containers handle this fine. For larger files, consider presigned URL direct-to-bucket uploads.
**Warning signs:** 413 Payload Too Large errors or timeout during upload.

### Pitfall 6: Build Output Missing Migration SQL Files
**What goes wrong:** `tsc` compiles `.ts` files to `dist/` but does NOT copy `.sql` migration files. The migrate script looks for files relative to `__dirname`, which in production is `dist/`, not `src/`.
**Why it happens:** TypeScript compiler only processes `.ts` files.
**How to avoid:** Either (a) copy migration files to `dist/migrations/` in the build step, or (b) run migrations using tsx (not the compiled output) as a separate Railway service command, or (c) add a postbuild script to copy SQL files.
**Warning signs:** "Migration file not found" errors in production.

## Code Examples

### Sentry Setup (instrument.ts)
```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/express/install/esm/
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 0.2,
  sendDefaultPii: false,
});
```

### Sentry Error Handler in Express (index.ts addition)
```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/express/
import * as Sentry from "@sentry/node";

// After ALL route registrations, BEFORE any custom error handlers:
Sentry.setupExpressErrorHandler(app);

// Optional: custom fallback error handler AFTER Sentry's
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
```

### Railway Health Check (already exists)
```typescript
// Already in index.ts -- Railway uses this for zero-downtime deploys
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
```

### Database Connection with SSL (db.ts update)
```typescript
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/pt_tracker",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export default pool;
```

### tsconfig.json Update for Build
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true,
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src"]
}
```

### Running Migrations in Production
```bash
# Option A: Run migrate script using tsx (before server starts)
# In Railway, set a "deploy command" or use a one-off command:
npx tsx src/migrate.ts

# Option B: Add a migrate script that Railway runs before start
# package.json: "prestart": "npx tsx src/migrate.ts"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Nixpacks (Railway builder) | Railpack | 2025 | Nixpacks deprecated, Railpack auto-detected for new services. No action needed -- Railway handles this. |
| multer-s3 (v2, AWS SDK v2) | @aws-sdk/client-s3 + multer memoryStorage | 2023+ | multer-s3 last published 4 years ago. Use AWS SDK v3 directly with multer memoryStorage. |
| Sentry SDK v7 | @sentry/node v10.x (v8+ unified SDK) | 2024 | v8+ uses `@sentry/node` (not `@sentry/node` + `@sentry/tracing`). Single package for everything. |
| tsx in production | tsc build + node | Ongoing | tsx is fine for dev but compiled JS is standard for production deploys |
| Heroku | Railway/Render/Fly.io | 2022+ | Heroku killed free tier; Railway is the modern Heroku replacement |

**Deprecated/outdated:**
- `@sentry/tracing`: Merged into `@sentry/node` in v8+. Do not install separately.
- `multer-s3`: Last updated 4 years ago, uses AWS SDK v2. Use `@aws-sdk/client-s3` directly instead.
- `Nixpacks`: Deprecated by Railway, replaced by Railpack. Still works but no new features.

## Open Questions

1. **Railway bucket credential injection**
   - What we know: Railway provides S3 credentials for buckets, and they can be referenced via `${{BucketName.VARIABLE}}`
   - What's unclear: The exact variable names Railway auto-injects for bucket credentials (may need to check the Railway dashboard)
   - Recommendation: After creating the bucket, check the credentials tab and set up variable references. The AWS SDK v3 can also auto-detect credentials from standard AWS env vars.

2. **Seed script in production**
   - What we know: The seed script deletes all data and re-creates it. This is fine for initial deployment but destructive thereafter.
   - What's unclear: Whether the trainer wants seed data in production or will enter real client data manually.
   - Recommendation: Run seed once for initial setup (minus the DELETE commands for safety), or create a production-specific seed that only creates the trainer account if it does not exist.

3. **Custom domain vs Railway subdomain**
   - What we know: Railway provides `*.up.railway.app` domains with auto-HTTPS. Custom domains are supported with auto Let's Encrypt certificates.
   - What's unclear: Whether the trainer wants a custom domain (e.g., `api.mytrainerapp.com`)
   - Recommendation: Start with Railway's provided domain. Add custom domain later if desired. Both get HTTPS automatically.

4. **Photo URL migration strategy**
   - What we know: Database stores paths like `/uploads/progress/filename.jpg`. Mobile app constructs full URLs as `UPLOADS_BASE + photo_url`. Moving to S3 changes the URL format.
   - What's unclear: Whether to store full S3 URLs, S3 keys, or keep the `/uploads/` prefix in the database.
   - Recommendation: Store S3 object keys (e.g., `progress/filename.jpg`) in the database. Create a `/api/files/*` proxy endpoint that generates presigned URLs. Update `UPLOADS_BASE` usage in mobile to point to this endpoint. This way the mobile app pattern stays similar.

## Sources

### Primary (HIGH confidence)
- Railway Docs -- Express deployment guide (https://docs.railway.com/guides/express)
- Railway Docs -- PostgreSQL setup (https://docs.railway.com/databases/postgresql)
- Railway Docs -- Storage Buckets (https://docs.railway.com/storage-buckets)
- Railway Docs -- Volumes reference (https://docs.railway.com/reference/volumes)
- Railway Docs -- Public Networking/HTTPS (https://docs.railway.com/guides/public-networking)
- Railway Docs -- Environment Variables (https://docs.railway.com/guides/variables)
- Railway Docs -- Deploy Express API guide (https://docs.railway.com/guides/deploy-node-express-api-with-auto-scaling-secrets-and-zero-downtime)
- Sentry Docs -- Express integration (https://docs.sentry.io/platforms/javascript/guides/express/)
- Sentry Docs -- ESM setup (https://docs.sentry.io/platforms/javascript/guides/express/install/esm/)
- Sentry Docs -- ESM without --import flag (https://docs.sentry.io/platforms/javascript/guides/express/install/esm-without-import/)
- Railpack Docs -- Node.js (https://railpack.com/languages/node/)
- @sentry/node v10.38.0 (verified via npm)

### Secondary (MEDIUM confidence)
- Railway pricing comparison -- Northflank blog (https://northflank.com/blog/railway-vs-render)
- Railway vs Render vs Fly.io ROI -- Medium (https://medium.com/ai-disruption/railway-vs-fly-io-vs-render-which-cloud-gives-you-the-best-roi-2e3305399e5b)
- Sentry pricing page (https://sentry.io/pricing/) -- free Developer plan confirmed, exact event limits unverified
- Sentry + tsx --import discussion (https://github.com/getsentry/sentry-javascript/discussions/12423)

### Tertiary (LOW confidence)
- tsx production performance claims (https://betterstack.com/community/guides/scaling-nodejs/tsx-vs-native-nodejs-typescript/) -- general guidance, not Railway-specific

## Metadata

**Confidence breakdown:**
- Standard stack (Railway + Sentry): HIGH -- verified via official Railway and Sentry docs, pricing confirmed
- Architecture (build strategy, S3 uploads): HIGH -- patterns verified against official docs and npm packages
- Pitfalls (SSL, Sentry ESM, migration files): HIGH -- identified from official docs and GitHub discussions
- Pricing: MEDIUM -- Railway Hobby $5/mo confirmed, exact usage costs depend on actual resource consumption
- Sentry free tier limits: LOW -- Developer plan confirmed free, exact monthly event quota not found in docs

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days -- these platforms update pricing/features regularly)
