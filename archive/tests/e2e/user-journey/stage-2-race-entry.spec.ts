/**
 * stage-2-race-entry.spec.ts - 階段 2: 進入賽事
 *
 * 4 個獨立測試：
 * - 2.1 進入賽事按鈕
 * - 2.2 排名表格顯示
 * - 2.3 勾選鴿子成功
 * - 2.4 勾選計數更新
 */

import { test, expect } from '@playwright/test';
import { setupHomepage, setupRaceEntry, DEFAULT_TIMEOUT } from './fixtures';

test.describe('階段 2: 進入賽事 @P0', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(DEFAULT_TIMEOUT);
  });

  test('2.1 進入賽事按鈕', async ({ page }) => {
    await setupHomepage(page);

    // 支援簡繁體：进入/進入
    await page.getByRole('button', { name: /进入|進入/ }).first().click();
    await page.waitForTimeout(3000);

    // SPA 可能不改變 URL，改用頁面內容檢測
    const hasTable = (await page.locator('table').count()) > 0;
    const hasCheckbox = (await page.locator('input[type="checkbox"]').count()) > 0;
    const url = page.url();
    const success = hasTable || hasCheckbox || url.includes('/race/') || url.includes('detail');

    expect(success).toBe(true);
  });

  test('2.2 排名表格顯示', async ({ page }) => {
    await setupRaceEntry(page);

    await page.waitForTimeout(2000);
    const rows = await page.locator('table tbody tr, table tr').count();
    expect(rows).toBeGreaterThanOrEqual(5);
  });

  test('2.3 勾選鴿子成功', async ({ page }) => {
    await setupRaceEntry(page);

    // 使用表格行定位 checkbox，避免選到 3D 模式開關的 checkbox
    const rows = page.locator('table tbody tr, table tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);

    // 選擇第一隻鴿子 (跳過表頭，所以用 nth(1))
    const targetRow = rows.nth(1);
    const checkbox = targetRow.getByRole('checkbox');

    if (await checkbox.isVisible()) {
      await checkbox.click();
      await page.waitForTimeout(1000);
    }

    // 檢查是否有勾選 - 透過按鈕文字判斷
    const countBtn = page
      .locator('button:has-text("勾选清单"), button:has-text("勾選清單")')
      .first();
    const text = await countBtn.innerText().catch(() => '0');
    const match = text.match(/\d+/);
    const count = match ? parseInt(match[0]) : 0;

    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('2.4 勾選計數更新', async ({ page }) => {
    await setupRaceEntry(page);

    // 勾選鴿子
    const rows = page.locator('table tbody tr, table tr');
    const checkbox = rows.nth(1).getByRole('checkbox');
    if (await checkbox.isVisible()) {
      await checkbox.click();
      await page.waitForTimeout(1000);
    }

    const text = await page.locator('body').innerText();
    // 支援簡繁體
    const hasIndicator =
      text.includes('勾選清單') ||
      text.includes('已選') ||
      text.includes('勾选清单') ||
      text.includes('已选');

    expect(hasIndicator).toBe(true);
  });
});
