# 03-03 Checkpoint Handoff

## Status
Plan 03-03 paused at Task 1 (checkpoint:human-action)
User is on **Step 3** of 6 (setting environment variables on Railway)

## Completed So Far
- Wave 1 fully complete (03-01 + 03-02)
- Sentry account created
- Railway project creation in progress (Step 3 of 6)

## Sentry DSN
```
https://c8522ff1526b586de3ec53de622cdb2e@o4510848077725696.ingest.us.sentry.io/4510848089980928
```

## Remaining Steps

### Step 3: Set environment variables (Railway server service → Variables tab)
- `NODE_ENV` = `production`
- `JWT_SECRET` = (run `openssl rand -hex 32` locally, paste result)
- `TRAINER_PASSWORD` = (choose a strong production password)
- `SENTRY_DSN` = `https://c8522ff1526b586de3ec53de622cdb2e@o4510848077725696.ingest.us.sentry.io/4510848089980928`
- `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- `BUCKET_ENDPOINT` = (from bucket Connect tab)
- `BUCKET_ACCESS_KEY_ID` = (from bucket Connect tab)
- `BUCKET_SECRET_ACCESS_KEY` = (from bucket Connect tab)
- `BUCKET_NAME` = (from bucket Connect tab)
- `BUCKET_REGION` = (from bucket Connect tab, likely `us-east-1`)

### Step 4: Run migrations
```bash
railway run npx tsx src/migrate.ts
```
Or use the Railway dashboard service shell.

### Step 5: Deploy
Push to connected branch or trigger manual deploy in Railway dashboard.

### Step 6: Get production URL
Settings → Networking → Generate Domain. Copy the URL.

## To Resume
Run `/gsd:execute-phase 3` — it will detect 03-01 and 03-02 are done (SUMMARYs exist) and pick up at 03-03.

Or just tell Claude:
```
Resume 03-03. I'm at the checkpoint. Here's my Railway URL: https://XXX.up.railway.app
Migrations ran successfully. Deploy completed. TRAINER_PASSWORD is XXX.
```

## After User Provides Info, Claude Will:
1. Set production URL in mobile/app.json extra.apiUrl
2. Verify health endpoint via curl
3. Verify auth endpoint via curl
4. Verify database routes work
5. Present final checkpoint for mobile app testing
6. Create 03-03-SUMMARY.md
7. Run phase verifier
8. Update ROADMAP.md and STATE.md
