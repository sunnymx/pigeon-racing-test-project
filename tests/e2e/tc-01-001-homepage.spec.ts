/**
 * tc-01-001-homepage.spec.ts - TC-01-001: 首頁賽事列表
 *
 * 對應規格：USER_JOURNEY_RECORD_V2.md 記錄點 #01
 *
 * 5 個獨立測試：
 * - 1.1 首頁載入 (P0)
 * - 1.2 賽事卡片數量 (P0)
 * - 1.3 搜尋功能可用 (P1)
 * - 1.4 年份篩選可用 (P1)
 * - 1.5 進入賽事成功 (P0)
 */

import { test, expect } from '@playwright/test';
import { setupHomepage, DEFAULT_TIMEOUT } from '../helpers/fixtures';

test.describe('TC-01-001: 首頁賽事列表 @P0', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(DEFAULT_TIMEOUT);
    await setupHomepage(page);
  });

  test('1.1 首頁載入', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('1.2 賽事卡片數量', async ({ page }) => {
    const cards = await page.locator('mat-card, .race-card, [class*="card"]').count();
    expect(cards).toBeGreaterThanOrEqual(10);
  });

  test('1.3 搜尋功能可用', async ({ page }) => {
    // 多重選擇器策略：支援簡繁體
    const selectors = [
      'input[aria-label*="搜寻"]',
      'input[aria-label*="搜尋"]',
      'input[placeholder*="搜寻赛事"]',
      'input[placeholder*="搜尋賽事"]',
      'input[type="search"]',
      'mat-form-field input',
    ];

    let found = false;
    for (const sel of selectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test('1.4 年份篩選可用', async ({ page }) => {
    const select = page.locator('mat-select, select, [class*="year"]').first();
    await expect(select).toBeVisible();
  });

  test('1.5 進入賽事成功', async ({ page }) => {
    // 對應規格：USER_JOURNEY_RECORD #01 檢查點 1.4
    const enterButton = page.getByRole('button', { name: /进入|進入/ }).first();
    await enterButton.click();
    // 驗證進入賽事詳情頁：賽事標題 heading 應出現（使用 .first() 避免多元素衝突）
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible({ timeout: 10000 });
  });
});
