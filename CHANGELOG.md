# Changelog

Все заметные изменения **LiveCut Studio** фиксируются в этом файле.
Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), проект придерживается [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-25

### Added
- **Версионированный JSON-бэкап состояния** (`schemaVersion: 2`): экспорт («Скачать бэкап (.json)») и импорт («Загрузить бэкап») настроек в `PipelineView` со строгой проверкой схемы и гарантированным исключением секретных ключей.
- **Копирование отчёта об ошибке в `ErrorBoundary`**: кнопка «Скопировать отчёт» сохраняет стек ошибки и санитизированное состояние без секретов.
- **Полная доступность модальных окон и навигации**: focus-trap в `ConfirmDialog`, skip-link к основному содержимому и `aria-live="polite"` уведомления при копировании и импорте.
- **Self-hosted шрифты и строгий CSP**: локальные пакеты `@fontsource-variable/inter`, `@fontsource-variable/manrope`, `@fontsource-variable/jetbrains-mono` и production CSP `<meta>` (`connect-src 'none'`, `font-src 'self'`).
- **Инфраструктура качества и CI/CD**: ESLint 9 + Prettier, golden-тесты (`tests/golden/`), покрытие `node:test`, проверка бюджета бандла (`<= 250 KB gzip` с ленивой загрузкой вкладок), Playwright E2E smoke-тесты, CLI `scripts/make-kit.ts`, GitHub Pages deploy, release workflow и еженедельный E2E-тест `apply_en_patch.py` против `Teodorox/livecut-ai`.
- **Документация и безопасность**: `ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `PRIVACY.md`, шаблоны issue/PR и `dependabot.yml`.

### Fixed
- Строгая типизация `targetPlatforms` (`youtubeShorts`), очистка зависимостей от неиспользуемых серверных пакетов и совместимость пути сборки для AI Studio preview и GitHub Pages.
