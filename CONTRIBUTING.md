# Contributing to LiveCut Studio

Спасибо за интерес к развитию **LiveCut Studio**!

## Требования к окружению

- Node.js 22+
- npm 10+
- Python 3.11+ (для проверки синтаксиса генерируемого `apply_en_patch.py` и `config.toml`)

## Локальная разработка и проверки

```bash
npm ci
npm run dev          # http://localhost:3000
npm run lint         # eslint . && tsc --noEmit
npm test             # unit + golden тесты
npm run test:coverage
npm run build && npm run check:bundle
npm run test:e2e     # Playwright smoke на preview-сборке
```

## Правила изменений

1. **Якорные строки в `generatePatchScript` (`src/utils/generator.ts`)** должны оставаться совместимыми с исходниками `Teodorox/livecut-ai`. При изменении генерации артефактов обновите golden-снимки:
   ```bash
   npm run test:golden:update
   ```
   и проверьте diff в `tests/golden/`.
2. **Не добавляйте серверные API-вызовы, телеметрию и внешние CDN**: приложение должно проходить строгий `connect-src 'none'` в продакшене и укладываться в бюджет начального JS-бандла `<= 250 KB gzip` (`npm run check:bundle`).
3. **Никаких секретов в `localStorage`, JSON-бэкапах и отчётах об ошибках**: проверяйте это тестами в `src/utils/validation.test.ts` и `tests/e2e/smoke.spec.ts`.
4. Используйте формат коммитов [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `ci:`).

## Откат изменений (Rollback)

### Откат конфигурации в LiveCut Studio
- Нажмите **«Сбросить к дефолтам»** в боковом меню (или очистите `localStorage` ключ `livecut-studio-v2`).
- Если у вас сохранён JSON-бэкап, восстановите его через **«Загрузить бэкап»** в разделе «01. Ниша и стартовый пресет».

### Откат патча `apply_en_patch.py` в репозитории `Teodorox/livecut-ai`
При каждом запуске `apply_en_patch.py` автоматически сохраняет оригинальные файлы рядом в формате `<filename>.bak_<timestamp>`:

```bash
# Вариант 1: откат через git в рабочей копии livecut-ai
git checkout -- main.py detector.py curator.py publisher.py settings.py

# Вариант 2: восстановление из .bak_* файлов
ls -la *.bak_*
```
