# Architecture Overview — LiveCut Studio

LiveCut Studio (`ppiiyo/livecut-ai`) — это **100% клиентское SPA-приложение** (React 19, TypeScript, Vite 8, Tailwind CSS v4) для настройки и генерации пакета конфигурации внешнего Python-конвейера [`Teodorox/livecut-ai`](https://github.com/Teodorox/livecut-ai).

## Ключевые принципы

1. **Zero-backend и отсутствие сетевых вызовов**: вся генерация (`config.toml`, `.env.example`/`.env`, `apply_en_patch.py`, `SETUP_RU.md`, `README.md` и ZIP-архив) выполняется локально в браузере. Production-сборка защищена директивой CSP `connect-src 'none'`.
2. **Разделение секретов и конфигурации**:
   - Несекретное состояние сохраняется в `localStorage` (`livecut-studio-v2`) и может экспортироваться/импортироваться через версионированный JSON-бэкап (`schemaVersion: 2`).
   - Секреты (`env.*`) хранятся только в памяти React и исключаются из `localStorage`, JSON-бэкапов, отчётов `ErrorBoundary` и `.env.example`.
3. **Совместимость с upstream `Teodorox/livecut-ai`**:
   - Типы `ChannelLayout` (`auto | fundo | facecam`), `DetectionMode` (`chat | audio | ambos`) и португальские ключи `config.toml` строго соответствуют парсеру `settings.py`.
   - Патч-скрипт `apply_en_patch.py` использует точные якорные замены с резервными копиями `.bak_*`, проверкой `ast.parse`/`tomllib.loads` и защитой существующего `config.toml` (создаёт `config.en.toml` sidecar, если файл уже существует).

## Структура модулей

- `src/types/pipeline.ts` — доменные типы состояния, каналов, детектора, ИИ и симулятора.
- `src/data/presets.ts` — пресеты (`en-gta6`, `ru-gta6`, `en-gaming`), базовые словари реакций/спама, шаблонный чек-лист.
- `src/utils/generator.ts` — чистые функции генерации TOML, `.env`, Markdown-инструкций, Python-патча, калькулятор бюджета и симулятор детектора (`simulateRateSpike`, `testChatMessage`).
- `src/utils/zip.ts` — самодостаточный генератор store-mode ZIP-архивов с CRC32 IEEE 802.3 (без внешних зависимостей).
- `src/utils/validation.ts` — строгая проверка slug'ов Twitch/Kick/YouTube, `perfil_tiktok`, GitHub-репозитория и блокировка невалидного экспорта.
- `src/utils/storage.ts` — валидация схемы состояния при чтении из `localStorage` и JSON-бэкапов.
- `src/components/` — `Sidebar`, лениво подгружаемые вкладки (`SimulatorView`, `SetupView`, `ExportView`), `PipelineView`, `ConfirmDialog` (с focus-trap), `ErrorBoundary`.
- `scripts/make-kit.ts` — CLI-генератор дефолтного пакета в `kit-dist/` для CI, релизов и E2E-проверок против upstream.
- `tests/` — модульные и golden-тесты (`node:test`), а также Playwright E2E smoke-тест (`tests/e2e/smoke.spec.ts`).
