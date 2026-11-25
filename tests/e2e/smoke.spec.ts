import fs from 'node:fs';
import { test, expect } from '@playwright/test';

test.describe('LiveCut Studio smoke suite', () => {
  test('renders Russian UI without console/page errors, verifies CSP, preset confirm, slug validation, ZIP download, and zero secret persistence', async ({
    page
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`console.error: ${msg.text()}`);
      }
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/LiveCut Studio/);
    await expect(page.getByRole('heading', { name: /Конвейер и каналы/i })).toBeVisible();

    // Production CSP meta tag should be injected in preview build
    const cspMeta = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(cspMeta).toHaveAttribute('content', /connect-src 'none'/);

    // Preset switch opens accessible ConfirmDialog and updates preset
    await page.getByRole('button', { name: /GTA 6 · Русский/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Заменить' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Bratishkinoff', exact: true })).toBeVisible();

    // Invalid Twitch channel slug triggers inline error and disables Add button
    await page.getByLabel('Имя стримера').fill('BadChannel');
    await page.getByLabel('Канал / @handle').fill('@bad!');
    await expect(page.getByText(/без @ и пробелов/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Добавить' })).toBeDisabled();
    await page.getByLabel('Канал / @handle').fill('');

    // Secret entered in SetupView must never persist to localStorage or survive reload
    await page.getByRole('button', { name: 'Ключи и чек-лист' }).click();
    const anthropicInput = page.getByLabel(/ANTHROPIC_API_KEY/);
    await anthropicInput.fill('sk-ant-smoke-secret-value');

    const storedRaw = await page.evaluate(() => localStorage.getItem('livecut-studio-v2') ?? '');
    expect(storedRaw).not.toContain('sk-ant-smoke-secret-value');

    // Download ZIP bundle in ExportView
    await page.getByRole('button', { name: 'Сборка и экспорт' }).click();
    await expect(page.getByRole('cell', { name: '.env.example' }).or(page.getByText('.env.example').first())).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Скачать пакет (.zip)' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/-kit\.zip$/);
    const downloadedPath = await download.path();
    expect(downloadedPath).toBeTruthy();
    if (downloadedPath) {
      const stat = fs.statSync(downloadedPath);
      expect(stat.size).toBeGreaterThan(1000);
    }

    // Reload clears in-memory secret while keeping non-secret preset state
    await page.reload();
    await expect(page.getByRole('cell', { name: 'Bratishkinoff', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Ключи и чек-лист' }).click();
    await expect(page.getByLabel(/ANTHROPIC_API_KEY/)).toHaveValue('');

    expect(errors).toEqual([]);
  });
});
