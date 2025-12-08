/**
 * stage-1-homepage.spec.ts - 階段 1: 首頁探索
 *
 * 4 個獨立測試：
 * - 1.1 首頁載入
 * - 1.2 賽事卡片數量
 * - 1.3 搜尋功能可用
 * - 1.4 年份篩選可用
 */

import { test, expect } from '@playwright/test';
import { setupHomepage, DEFAULT_TIMEOUT } from './fixtures';

test.describe('階段 1: 首頁探索 @P0', () => {
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
});
