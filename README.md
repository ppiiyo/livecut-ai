# LiveCut Studio

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-2563eb?style=flat-square)](https://ppiiyo.github.io/livecut-ai/)
[![Release](https://img.shields.io/github/v/release/ppiiyo/livecut-ai?style=flat-square&color=16a34a)](https://github.com/ppiiyo/livecut-ai/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/ppiiyo/livecut-ai/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/ppiiyo/livecut-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-slate?style=flat-square)](./LICENSE)

**Zero-backend configurator, spike simulator, and patch-kit generator for turning 24/7 livestreams into ready-to-post TikTok & YouTube Shorts.**

- **Live Web App:** https://ppiiyo.github.io/livecut-ai/
- **Prebuilt Release Kits:** [GitHub Releases (`v1.0.0`)](https://github.com/ppiiyo/livecut-ai/releases)
- **Upstream Pipeline:** [`Teodorox/livecut-ai`](https://github.com/Teodorox/livecut-ai) (MIT)

---

## How the Full Product Works

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. LiveCut Studio (Browser)                                             │
│    Pick presets · Validate channels & facecam · Simulate chat spikes    │
│    Export livecut-en-kit.zip (config.toml, .env, apply_en_patch.py)     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. livecut-en Pipeline (Windows 10/11 · Python 3.12+ · FFmpeg)          │
│    Twitch / Kick / YouTube ──► Rolling buffer ──► Chat / Audio / Clips  │
│    ──► faster-whisper ──► Claude Curator ──► 9:16 or 4:5 Render         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. Telegram Delivery                                                    │
│    Preview (Approve / Discard / Full) ──► Final MP4 + Hook + Hashtags   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Quickstart: Launch & Setup (5 Minutes)

### Prerequisites
- **OS:** Windows 10/11 (recommended for `iniciar.bat` & Task Scheduler; NVIDIA RTX GPU optional for `large-v3-turbo` Whisper + NVENC)
- **Python:** **3.12 or 3.13** (`winget install Python.Python.3.12` — Python 3.11 is unsupported due to PEP 701 f-strings in `clipper/render.py`)
- **FFmpeg & ffprobe** in `PATH` (`winget install Gyan.FFmpeg`)
- **API Keys:** Anthropic (`ANTHROPIC_API_KEY`), Telegram Bot (`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`), and optionally YouTube Data API v3 (`YOUTUBE_API_KEY`) / Twitch / Kick credentials

### 1. Configure & Export Your Kit
1. Open **[LiveCut Studio](https://ppiiyo.github.io/livecut-ai/)**.
2. Choose a starter preset (e.g., **GTA 6 · English**) or customize `[[canais]]` channels, `facecam = [x, y, w, h]` coordinates, Claude daily budget, and the curator `SYSTEM` prompt.
3. Open **Сборка и экспорт** and click **Скачать пакет (.zip)** to download `livecut-en-kit.zip` (or grab the default kit from [Releases](https://github.com/ppiiyo/livecut-ai/releases)).

### 2. Fork/Clone Pipeline & Apply the Patch
```powershell
git clone https://github.com/Teodorox/livecut-ai.git livecut-en
cd livecut-en

py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```
*(Optional NVIDIA CUDA 12 acceleration: `pip install nvidia-cublas-cu12 nvidia-cudnn-cu12`)*

Extract `livecut-en-kit.zip` into the `livecut-en` root folder and apply the patch:
```powershell
python apply_en_patch.py
```
Verify the summary prints **`CRITICAL FAILURES: 0`**. Existing `config.toml` files are automatically preserved (`config.en.toml` sidecar + backups in `_backup_pre_en/`).

### 3. Configure `.env` Secrets
Open `.env` (never commit `.env` or `config.toml`) and fill in your credentials:

| Variable | Required | Description / Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | [console.anthropic.com](https://console.anthropic.com) (fund $5–$10 to start) |
| `TELEGRAM_BOT_TOKEN` | Yes | Create a bot via `@BotFather` in Telegram |
| `TELEGRAM_CHAT_ID` | Yes | Get your numeric ID via `@userinfobot` (send `/start` to your bot first) |
| `CLAUDE_MODEL` | Optional | Defaults to configured model (e.g. `claude-sonnet-4-5` / `claude-opus-5-5`) |
| `YOUTUBE_API_KEY` | YouTube chat | Google Cloud Console → **YouTube Data API v3** |
| `WHISPER_CPU_MODEL` | CPU-only | Recommended `medium` when running without an NVIDIA GPU |
| `TWITCH_CLIENT_ID` / `SECRET` | Optional | [dev.twitch.tv](https://dev.twitch.tv) for Twitch clip-rain detection |
| `KICK_CLIENT_ID` / `SECRET` + `NGROK_*` | Optional | Kick official chat webhook (falls back to audio detection if omitted) |

### 4. Test, Calibrate & Run 24/7
Run a single-channel smoke test first:
```powershell
python -m clipper.main --canal twitch:kaicenat:en:ambos
```
Then start full monitoring:
```powershell
.\iniciar.bat
```
- **Calibration (first 2–3 days):** Keep `aprovacao_manual = true` in `config.toml`. The bot sends lightweight 480p previews to Telegram so you only pay for Claude curation when clicking **Analyze with AI**. Tune `min_msgs`, `multiplicador_minimo`, or `nota_minima` based on hit rate.
- **Full Autopilot (24/7):** Switch `aprovacao_manual = false` in `config.toml` and schedule `iniciar.bat` via **Windows Task Scheduler** (`At log on` + `Run only when user is logged on` so CUDA/GPU remains accessible).
- **Telegram Commands:** `/status`, `/clip <streamer>`, `/refazer <id>`, `/saldo`, `/saldo 25.00`, `/ajuda`.

---

## LiveCut Studio Capabilities & Security

- **100% Client-Side Static App:** Zero backend, zero databases, zero external CDNs (fonts bundled locally via `@fontsource-variable/*`), zero telemetry.
- **Strict Production CSP:** `connect-src 'none'`, `object-src 'none'`, `font-src 'self' data:` injected at build time (`vite.config.ts`).
- **Zero Secret Persistence:** API keys entered in the UI live strictly in React tab memory, are excluded from `localStorage` and `schemaVersion: 2` JSON backups, and are masked by default in `.env.example`.
- **Upstream Anchor Safety:** Generated `apply_en_patch.py` is continuously verified via weekly GitHub Actions (`kit-e2e.yml`) against `Teodorox/livecut-ai` with `ast.parse` and `tomllib.loads` validation.

---

## Local Studio Development

Requires Node.js 22+ and `npm` (`package-lock.json` is the single lockfile).

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

### Verification Suite
```bash
npm run lint           # ESLint 10 + tsc --noEmit
npm test               # Unit & golden snapshot tests (node:test)
npm run test:coverage  # Line & branch coverage report
npm run build          # Production build (dist/)
npm run check:bundle   # Enforce initial JS gzip <= 250 KB
npm run make:kit       # Generate default release kit into kit-dist/
npm run test:e2e       # Playwright Chromium E2E smoke suite
```

Build with GitHub Pages subpath (`/livecut-ai/`):
```bash
GITHUB_PAGES=true npm run build
```

---

## Roadmap (Post-`1.0.0` Backlog)

- PWA / offline Studio mode
- Switchable English / Russian Studio UI toggle
- Round-trip `config.toml` importer back into Studio
- Client-side clip preview via `ffmpeg.wasm`
- Pipeline HTTP `/status` & `/health` dashboard integration
- Docker / Linux port and multi-worker parallel rendering

## Documentation & License

- Architecture: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Contributing & Rollback: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)
- Security & Privacy: [`SECURITY.md`](./SECURITY.md) · [`PRIVACY.md`](./PRIVACY.md)
- License: LiveCut Studio is licensed under the [MIT License](./LICENSE). The upstream pipeline [`Teodorox/livecut-ai`](https://github.com/Teodorox/livecut-ai) is a separate project licensed under the MIT License (Copyright (c) 2026 Teodorox).
