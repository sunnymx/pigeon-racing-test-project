/**
 * tc-02-001-race-entry.spec.ts - TC-02-001: 賽事詳情 - 鴿子列表
 *
 * 對應規格：USER_JOURNEY_RECORD_V2.md 記錄點 #02
 *
 * 5 個獨立測試：
 * - 2.1 鴿子列表載入 (P0)
 * - 2.2 鴿子選擇 (P0)
 * - 2.3 環號搜尋 (P1)
 * - 2.4 名次查詢 (P1)
 * - 2.5 查看軌跡啟用 (P0)
 */

import { test, expect } from '@playwright/test';
import { setupRaceEntry, DEFAULT_TIMEOUT } from '../helpers/fixtures';

test.describe('TC-02-001: 賽事詳情 - 鴿子列表 @P0', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(DEFAULT_TIMEOUT);
    await setupRaceEntry(page);
  });

  test('2.1 鴿子列表載入', async ({ page }) => {
    // 驗證表格存在並有數據行
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // 驗證有 checkbox（鴿子選擇框）- 使用表格內的 checkbox
    const checkboxes = page.locator('table').getByRole('checkbox');
    const checkboxCount = await checkboxes.count();
    expect(checkboxCount).toBeGreaterThan(0);
  });

  test('2.2 鴿子選擇', async ({ page }) => {
    // 選擇第二行的鴿子（第一行可能是表頭）
    const rows = page.locator('table tbody tr, table tr');
    const checkbox = rows.nth(1).getByRole('checkbox');

    // 點擊選擇
    await checkbox.click();

    // 驗證勾選清單計數出現（支援簡繁體）
    const checkedCount = page.locator('button').filter({ hasText: /勾[选選]清[单單]/ });
    await expect(checkedCount).toBeVisible({ timeout: 5000 });
  });

  test('2.3 環號搜尋', async ({ page }) => {
    // 找到環號搜尋輸入框（支援簡繁體）
    const searchInput = page.locator('input').filter({
      hasText: /环号|環號/,
    }).or(page.locator('input[placeholder*="环号"], input[placeholder*="環號"]'));

    // 如果找不到直接的輸入框，嘗試 mat-form-field
    const inputField = searchInput.first().or(
      page.locator('mat-form-field input').first()
    );

    // 驗證搜尋功能可用
    const isVisible = await inputField.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('2.4 名次查詢', async ({ page }) => {
    // 找到名次查詢按鈕（支援簡繁體）
    const queryButton = page.getByRole('button').filter({
      hasText: /查[询詢]名次|查[询詢]环号|查[询詢]環號/,
    });

    // 驗證查詢按鈕可用
    const isVisible = await queryButton.first().isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('2.5 查看軌跡啟用', async ({ page }) => {
    // 選擇一隻鴿子
    const checkboxes = page.locator('table').getByRole('checkbox');
    await checkboxes.first().click();
    await page.waitForTimeout(500);

    // 驗證「查看軌跡」按鈕可用（支援簡繁體，使用 .first() 避免多元素衝突）
    const viewButton = page.getByRole('button').filter({
      hasText: /查看[轨軌][迹跡]/,
    }).first();
    await expect(viewButton).toBeEnabled({ timeout: 5000 });
  });
});
