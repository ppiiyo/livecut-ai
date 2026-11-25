# SETUP — livecut-en (гайд на русском)

## 0. Системные требования
- Windows 10/11, постоянно включённый ПК (конвейер пишет буфер 24/7).
- Python 3.12–3.13 (при установке отметить "Add Python to PATH"; сам `apply_en_patch.py` запускается и на Python 3.10+, но конвейер использует PEP 701 f-строки в `render.py`).
- ffmpeg: `winget install --id Gyan.FFmpeg -e` (после установки перезапустите терминал).
- NVIDIA GPU желательна (Whisper large-v3-turbo + NVENC). Без GPU код перейдёт на CPU (для EN/RU рекомендуется задать `WHISPER_CPU_MODEL=medium` в `.env`).
- ~20+ ГБ свободного места на диске и стабильный безлимитный интернет.

## 1. Установка
```bat
git clone https://github.com/Teodorox/livecut-ai.git livecut-en
cd livecut-en
python apply_en_patch.py
py -3.12 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install nvidia-cublas-cu12 nvidia-cudnn-cu12   :: только если есть NVIDIA GPU
```

## 2. Ключи (.env)
- `ANTHROPIC_API_KEY` — console.anthropic.com (пополните баланс $10–20; из РФ нужен системный VPN или `HTTPS_PROXY` в `.env`).
- `TELEGRAM_BOT_TOKEN` — @BotFather -> /newbot.
- `TELEGRAM_CHAT_ID` — напишите боту, затем откройте `https://api.telegram.org/bot<TOKEN>/getUpdates`.
- `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` — dev.twitch.tv/console (для «дождя клипов»).
- `YOUTUBE_API_KEY` — console.cloud.google.com -> YouTube Data API v3 (для YouTube-чатов).

## 3. Калибровка (2–3 дня)
```bat
python -m clipper.main --canal twitch:theburntpeanut:en
python -m clipper.main
```
- При `aprovacao_manual = true` в Telegram приходят превью с кнопками **Analyze with AI / Discard / Use full segment**.
- Много мусора -> повысьте `nota_minima` (6 -> 7) и `min_msgs`.
- Мало клипов -> снизьте `multiplicador_minimo` (2.5 -> 2.0) или `min_msgs`.

## 4. Полный автомат и 24/7 автозапуск
- Установите `aprovacao_manual = false` в `config.toml`. Бот будет присылать готовые ролики с подписью и хэштегами (#gta6 #gta #fyp #shorts).
- Для автозапуска на Windows используйте **Планировщик заданий (Task Scheduler)** с триггером «При входе пользователя» и «Выполнять только при входе» (чтобы процесс видел NVIDIA GPU) либо цикл перезапуска `iniciar.bat`.

## 5. Бюджет и легальные требования
- Модель `claude-opus-5-5` ~$0.04 за анализ, `claude-sonnet-5-5` ~$0.02 (настройка `CLAUDE_MODEL`). Дневной лимит $5.00, до 20 анализов/час (~$25–70/мес при стабильной калибровке).
- Команды Telegram-боту: `/status`, `/clip <имя>`, `/refazer <id>`, `/saldo`, `/saldo 25.00`.
- Публикуйте только короткие трансформированные нарезки с субтитрами, заголовком и указанием стримера (кредит `Live: streamer`), соблюдая правила платформ и разрешения авторов.
