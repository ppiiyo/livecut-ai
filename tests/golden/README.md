# livecut-en

Automated 24/7 livestream-to-short-clip pipeline powered by `faster-whisper`, Claude curation, and FFmpeg rendering, built on [Teodorox/livecut-ai](https://github.com/Teodorox/livecut-ai) (MIT).

## Profile Summary

- **Channels:** IShowSpeed / TheBurntPeanut / Kai Cenat / CaseOh
- **Target format:** 9:16 Vertical · Subtitle style: `karaoke`
- **Fixed tags:** `[streamer]`, `gta6`, `gta`, `fyp`, `shorts`
- **Claude model:** `claude-opus-5-5` (overridable via `CLAUDE_MODEL` in `.env`)
- **Daily guardrails:** `$5.00/day` · max `20/hr` · min score `6/10`

## Quickstart (Windows 10/11)

### 1. Prerequisites
- **Python 3.12 or 3.13** (Python 3.11 is unsupported due to PEP 701 f-strings in `clipper/render.py`)
- **FFmpeg & ffprobe** in `PATH` (`winget install Gyan.FFmpeg`)
- Optional NVIDIA GPU for `large-v3-turbo` Whisper + `h264_nvenc`

### 2. Install Dependencies
```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure `.env`
Copy `.env.example` to `.env` (never commit `.env` or `config.toml`) and fill in:
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)
- `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID` — from `@BotFather` and `@userinfobot` (send `/start` to your bot first)
- `YOUTUBE_API_KEY` — YouTube Data API v3 key (for YouTube live chat)
- `WHISPER_CPU_MODEL=medium` — recommended when running on CPU without CUDA

### 4. Smoke Test & Run 24/7
```powershell
python -m clipper.main --canal youtube:IShowSpeed:en:chat
.\iniciar.bat
```

- **Calibration (days 1–3):** Keep `aprovacao_manual = true` in `config.toml` and review previews in Telegram (**Analyze with AI / Discard / Use full segment**).
- **Autopilot:** Set `aprovacao_manual = false` once false positives are low, and run `iniciar.bat` via Windows Task Scheduler (**At log on**, logged-in session for GPU access).
- **Telegram commands:** `/status`, `/clip <streamer>`, `/refazer <id>`, `/saldo`, `/saldo 25.00`, `/ajuda`.

Russian setup guide: [SETUP_RU.md](SETUP_RU.md). Upstream `Teodorox/livecut-ai` is MIT-licensed (Copyright (c) 2026 Teodorox).
