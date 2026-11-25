## Описание изменений

<!-- Кратко опишите, что и зачем изменено -->

## Чек-лист перед ревью

- [ ] `npm run lint` (`eslint . && tsc --noEmit`) проходит без ошибок
- [ ] `npm test` и `npm run test:coverage` проходят (при изменении генерации обновлены `tests/golden/`)
- [ ] `npm run build && npm run check:bundle` проходит (initial JS gzip <= 250 KB)
- [ ] Секреты (`env`) по-прежнему не сохраняются в `localStorage` и JSON-бэкапах
- [ ] При изменении `generator.ts` проверена совместимость якорных строк с `Teodorox/livecut-ai`
