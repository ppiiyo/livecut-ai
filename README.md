# LiveCut Studio

Клиентский веб-конфигуратор и генератор готового пакета файлов (`config.toml`, `.env.example` / `.env`, `apply_en_patch.py`, `SETUP_RU.md`, `README.md` и ZIP-архив) для Python-конвейера автонарезки стримов [`Teodorox/livecut-ai`](https://github.com/Teodorox/livecut-ai).

- **Live Demo (GitHub Pages)**: https://ppiiyo.github.io/livecut-ai/
- **Релизные пакеты (ZIP)**: раздел [Releases](https://github.com/ppiiyo/livecut-ai/releases)

## Возможности

- **Конфигуратор конвейера и каналов**: стартовые пресеты (`EN GTA 6`, `RU GTA 6`, `EN Gaming`), редактор таблицы `[[canais]]` со строгой проверкой slug'ов Twitch / Kick / YouTube и координатами `facecam = [x, y, w, h]`, калькулятор дневного/месячного расхода Claude (`claude-opus-5-5` / `claude-sonnet-5-5`), редактор `SYSTEM`-промпта и хэштегов.
- **Экспорт и импорт JSON-бэкапа**: сохранение и перенос конфигурации (`schemaVersion: 2`) между браузерами. Секретные ключи в бэкап никогда не попадают.
- **Симулятор детектора и клипов**: предпросмотр `9:16 vertical` и `4:5 noticia`, симуляция кнопок Telegram-куратора, тестирование rate-spike детектора и одиночных сообщений чата на реакции и спам-маски (`*`-стемминг).
- **Безопасный конструктор `.env` и экспорт в ZIP**: секреты живут только в памяти текущей вкладки (не записываются в `localStorage`), по умолчанию маскируются в `.env.example`, а сборка ZIP выполняется полностью локально.
- **Совместимый патч `apply_en_patch.py`**: автоматические резервные копии в `_backup_pre_en/`, проверка `ast.parse` и `tomllib.loads`, защита существующего `config.toml` (создание sidecar `config.en.toml` + `SKIP`). Сам патч-скрипт работает на Python 3.10+, тогда как конвейер `livecut-ai` требует **Python ≥3.12** (PEP 701 f-строки в `render.py`).

## Безопасность и приватность

LiveCut Studio — **100% клиентское статическое приложение**: без бэкенда, баз данных, внешних CDN (шрифты `@fontsource-variable/*` встроены локально) и телеметрии. В production-сборке (`npm run build`) в `index.html` внедряется строгий `Content-Security-Policy` с `connect-src 'none'`. Подробнее: [`SECURITY.md`](./SECURITY.md) и [`PRIVACY.md`](./PRIVACY.md).

## Локальный запуск и разработка

Используется единый пакетный менеджер `npm` (`package-lock.json`).

```bash
npm ci
npm run dev
```

Приложение откроется на `http://localhost:3000`.

### Проверка и сборка

```bash
npm run lint           # ESLint + tsc --noEmit
npm test               # unit и golden тесты (node:test)
npm run test:coverage  # покрытие кода тестами
npm run build          # production-сборка (dist/)
npm run check:bundle   # контроль бюджета начального JS-бандла (<= 250 KB gzip)
npm run make:kit       # генерация дефолтного кита в kit-dist/
npm run test:e2e       # Playwright smoke-тест на production preview
```

Для сборки под GitHub Pages (`base: '/livecut-ai/'`):

```bash
GITHUB_PAGES=true npm run build
```

## Backlog

Функции, вынесенные за рамки `1.0.0` (не входят в текущий релиз):
- PWA / offline-режим Studio
- Переключаемый EN-интерфейс конфигуратора
- Импорт существующего `config.toml` обратно в интерфейс Studio
- Предпросмотр видеофрагментов на `ffmpeg.wasm`
- Расширение `chat_youtube` / поддержка чата Kick → YouTube
- Реальный HTTP `/status`-сервер конвейера
- Автопостинг в TikTok / YouTube Shorts (gated за одобрением API)
- Docker / Linux-порт Python-конвейера
- Параллельный worker-рендер клипов

## Документация и лицензия

- Архитектура: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Руководство контрибьютора и откат: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- История изменений: [`CHANGELOG.md`](./CHANGELOG.md)
- Лицензия LiveCut Studio: [MIT](./LICENSE). Внешний конвейер `Teodorox/livecut-ai` является отдельным upstream-проектом со своей лицензией и условиями распространения.
