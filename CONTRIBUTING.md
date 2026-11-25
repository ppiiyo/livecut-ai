# Contributing to LiveCut Studio

Спасибо за интерес к развитию **LiveCut Studio**!

## Требования к окружению

- Node.js 22+
- **Пакетный менеджер: исключительно `npm`** (`npm ci` и `package-lock.json`; не добавляйте `bun.lock` или `yarn.lock`).
- Python 3.12+ (для проверки синтаксиса конвейера `livecut-ai` и `tomllib`; сам генерируемый патч `apply_en_patch.py` совместим с Python 3.10+).

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
При каждом запуске `apply_en_patch.py` автоматически сохраняет оригинальные файлы рядом в папку `_backup_pre_en/`:

```bash
# Вариант 1: откат через git в рабочей копии livecut-en
git checkout -- clipper/ config.toml .gitignore

# Вариант 2: восстановление оригиналов из _backup_pre_en/
dir _backup_pre_en
```
