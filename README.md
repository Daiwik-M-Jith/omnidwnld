# 🚀 OmniDwnld - Universal Media Downloader

![OmniDwnld Banner](https://img.shields.io/badge/OmniDwnld-Universal_Downloader-purple?style=for-the-badge)

**Download videos, audio, and content from 100+ platforms** - No signup, No limits, Completely free!

## ✨ Features

- 🎬 **100+ Platform Support** - YouTube, Instagram, TikTok, Twitter, Facebook, and many more
- 🎵 **Multiple Formats** - Video (MP4, 1080p, 720p, 480p) & Audio (MP3, various bitrates)
- ⚡ **Lightning Fast** - Optimized download engine for maximum speed
- 🎨 **Beautiful UI** - Modern glassmorphic design with smooth animations
- 📊 **Download History** - Track all your downloads with SQLite
- 🔒 **Privacy First** - No signup required, no data collection
- 💯 **Always Free** - Completely free to use, forever

## 🎯 Supported Platforms

### Video Platforms
# OmniDwnld — Universal Media Downloader

OmniDwnld is a locally-run, privacy-first media downloader built with Next.js and TypeScript. It provides a polished UI for downloading videos and audio from many platforms and includes a job-based background downloader with realtime progress reporting.

This repository contains a production-ready, well-documented project intended for developer use and self-hosting. See the Deployment section for one-click deployment to Vercel.

---

## Quick Links

- Website (local): `http://localhost:3000`
- Build: `npm run build`
- Dev: `npm run dev`

---

## Why OmniDwnld?

- Privacy-first: No account needed, no telemetry collected by default.
- Fast: Background job-based downloads and ffmpeg remux/re-encode fallbacks.
- Friendly UI: Modern, responsive design with real-time progress and easy controls.
- Extensible: Add new converters by editing `lib/converters.ts`.

---

## Features

- Realtime progress bar (Server-Sent Events)
- Cancel, retry, and download history (SQLite)
- yt-dlp-based downloader with ffmpeg post-processing
- Tailwind CSS + Framer Motion UI
- Designed to be deployed to Vercel or run locally

---

## Requirements

- Node 18+ (recommended)
- npm (or pnpm/yarn)
- On Windows: ensure `ffmpeg` is available — the project uses `ffmpeg-static` by default. For full codec support, install an ffmpeg build with libx264/aac support if you plan to re-encode.

---

## Setup (Developer)

1. Clone the repo

```bash
git clone https://github.com/Daiwik-M-Jith/omnidwnld.git
cd omnidwnld
```

2. Install dependencies

```bash
npm install
```

3. Run development server

```bash
npm run dev
```

4. Build for production (used by Vercel)

```bash
npm run build
```

---

## Environment & Deployment

No required environment variables are needed for basic local testing. If you integrate external services or enable analytics, document those variables in a `.env` file and add instructions here.

Vercel deployment is supported — this repository uses the Next.js app router and works with Vercel defaults. To deploy:

1. Push this repository to GitHub.
2. Import the repo into Vercel (https://vercel.com/new).
3. Use the default build command `npm run build` and output directory is handled by Next.js.

Notes for production:

- Verify `ffmpeg` availability on the target environment if you require post-processing (remux/encode). Vercel serverless nodes may not include ffmpeg; prefer building a server environment for heavy processing or use a cloud function with ffmpeg support.

---

## Usage (User)

1. Open the site locally or on your deployment.
2. Pick a converter from the grid (e.g. YouTube Video, YouTube Audio).
3. Paste the media URL and choose the desired format.
4. Click Download — a background job will start and display realtime progress.
5. After completion, click the file link to download. Some files may download as `.webm` depending on format and source; rename to `.mp4` or convert via ffmpeg if needed.

---

## Extending & Production Hardening

To make this project production-ready for commercial use, consider these steps:

- Use a persistent database (Postgres) instead of local SQLite for scale.
- Move heavy ffmpeg processing to a worker (separate service) or use a queue (Redis + BullMQ).
- Add authentication & rate-limiting for paid tiers.
- Implement monitoring & logging (Sentry / Datadog).
- Add end-to-end tests and CI (GitHub Actions) to run builds and tests on each PR.
- Harden security headers in `next.config.js` and add CSP.

---

## Contributing

Contributions are welcome. For major changes, please open an issue first to discuss. Keep commits atomic and document behavior in the README or inline in code.

Suggested workflow:

```bash
git checkout -b feature/my-awesome-feature
# make changes
git add -A
git commit -m "feat: describe feature"
git push origin feature/my-awesome-feature
```

---

## License

This repository is released under the MIT License — see `LICENSE` for details.

---

If you'd like, I can also:

- Add a `CONTRIBUTING.md` and `SECURITY.md`.
- Create a GitHub Actions workflow to run `npm run build` and `npm run lint` on PRs.
- Attempt the `git push --force` to `https://github.com/Daiwik-M-Jith/omnidwnld` (I will only run this if you confirm).

---

Made with ❤️ — OmniDwnld Team
