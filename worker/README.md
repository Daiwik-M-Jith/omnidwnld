# OmniDwnld Worker

This worker processes download jobs enqueued into a Redis-backed queue and performs the heavy lifting (yt-dlp download, ffmpeg remux/re-encode, and S3 upload).

Quick start (development):

1. Install dependencies inside `worker/`

```powershell
cd worker
npm install
```

2. Start a Redis instance (local or remote). Set `REDIS_URL` accordingly.

3. Configure environment variables (example `.env`):

```
REDIS_URL=redis://127.0.0.1:6379
S3_BUCKET=your-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

4. Start the worker

```bash
npm run start
```

How it communicates progress
- The worker publishes progress messages to Redis pub/sub channels named `progress:<jobId>` as JSON strings. Your Next.js app should subscribe to these channels (e.g., using a small Redis subscriber or a server-side bridge) and relay updates to clients, or replace the in-memory job EventEmitter with Redis pub/sub.

Docker
- Build: `docker build -t omnidwnld-worker .`
- Run: `docker run -e REDIS_URL=redis://... -e S3_BUCKET=... omnidwnld-worker`

Notes
- This is a scaffold and is not production hardened. Add logging, retries, auth, metrics, and monitoring before using this in production.
