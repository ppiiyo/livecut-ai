# SETUP — livecut-en (гайд на русском)

## 0. Системные требования
- Windows 10/11, постоянно включённый ПК (конвейер пишет буфер 24/7).
- Python 3.11–3.13 (при установке отметить "Add Python to PATH").
- ffmpeg: `winget install --id Gyan.FFmpeg -e` (после установки перезапустите терминал).
- NVIDIA GPU желательна (Whisper large-v3-turbo + NVENC). Без GPU код перейдёт на CPU/Whisper small.
- ~20+ ГБ свободного места на диске и стабильный безлимитный интернет.

## 1. Установка
```bat
git clone https://github.com/Teodorox/livecut-ai.git livecut-en
cd livecut-en
python apply_en_patch.py
py -3.13 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install nvidia-cublas-cu12 nvidia-cudnn-cu12   :: только если есть NVIDIA GPU
```

## 2. Ключи (.env)
- `ANTHROPIC_API_KEY` — console.anthropic.com (из РФ нужен системный VPN или `HTTPS_PROXY` в `.env`).
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

## 4. Полный автомат
Установите `aprovacao_manual = false` в `config.toml`. Бот будет присылать уже готовые нарезки с подписью и хэштегами (#gta6 #gta #fyp #shorts). Ваша задача: посмотреть -> выложить -> нажать **Posted**.

## 5. Бюджет и команды
- Текущая модель в конфигурации: `claude-opus-5-5` (дневной лимит $5.00, до 20 анализов/час).
- Команды Telegram-боту: `/status`, `/clip <имя>`, `/refazer <id>`, `/saldo`, `/saldo 25.00`.
