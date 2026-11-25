# Security Policy

## Архитектура безопасности

LiveCut Studio — **100% клиентское статическое веб-приложение** без собственного бэкенда, баз данных, внешних сетевых запросов и телеметрии:

- В production-сборке (`npm run build`) в `index.html` внедряется строгий `Content-Security-Policy` с `connect-src 'none'`, `script-src 'self'`, `font-src 'self'` (все шрифты self-hosted через `@fontsource-variable/*`).
- Секретные ключи (Anthropic API Key, Telegram Bot Token, Twitch/TikTok credentials), введённые на вкладке «Ключи и чек-лист», хранятся **исключительно в памяти React** на время текущей сессии.
- При сохранении в `localStorage` (`serializeStateWithoutSecrets`), экспорте JSON-бэкапа (`exportStateBackupJson`) и копировании отчёта `ErrorBoundary` объект `env` полностью исключается.
- По умолчанию на вкладке «Сборка и экспорт» чекбокс «Включить введённые ключи в .env» выключен, а экспортируется безопасный шаблон `.env.example` с плейсхолдерами.
- Примечание по статическому хостингу: на GitHub Pages заголовок `X-Frame-Options` / `frame-ancestors` не задаётся на уровне HTTP-ответа (директива `frame-ancestors` игнорируется браузерами внутри `<meta>`). Для self-hosted развёртывания за Nginx/Cloudflare рекомендуется добавить `X-Frame-Options: DENY` и `Content-Security-Policy: frame-ancestors 'none'` в HTTP-заголовки.

## Поддерживаемые версии

| Версия | Поддержка безопасности |
| ------ | ---------------------- |
| 1.0.x  | Активно поддерживается |

## Сообщить об уязвимости

Если вы обнаружили уязвимость (например, утечку секретов в сериализации или инъекцию в генерируемом `apply_en_patch.py`), пожалуйста, **не открывайте публичный issue с эксплойтом**:

1. Используйте **GitHub Private Vulnerability Reporting** во вкладке Security репозитория `ppiiyo/livecut-ai`.
2. Опишите шаги воспроизведения, ожидаемое и фактическое поведение.
3. Подтверждение получения и первичная оценка — в течение 72 часов.
