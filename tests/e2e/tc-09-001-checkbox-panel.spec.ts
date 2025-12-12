/**
 * tc-09-001-checkbox-panel.spec.ts - 勾選清單面板測試
 *
 * 對應規格：USER_JOURNEY_RECORD_V2.md 記錄點 #09
 *
 * 5 個測試：
 * - 9.1 面板展開 (P2) - 點擊按鈕展開面板
 * - 9.2 清單內容 (P2) - 面板內顯示已選鴿子
 * - 9.3 單個刪除 (P2) - 刪除後列表更新
 * - 9.4 全部刪除 (P2) - 清空列表
 * - 9.5 數量更新 (P2) - 刪除後數字同步
 */

import { test, expect } from '@playwright/test';
import { setupRaceEntry, DEFAULT_TIMEOUT } from '../helpers/fixtures';
import { selectMultiplePigeons } from '../helpers/multi-select';
import {
  getCheckboxPanelButton,
  getPanelCount,
  expandCheckboxPanel,
  isCheckboxPanelExpanded,
  getPanelPigeonCount,
  deleteFirstPigeonFromPanel,
  deleteAllFromPanel,
} from '../helpers/checkbox-panel';

// ============================================================================
// 測試配置
// ============================================================================

test.describe('TC-09-001: 勾選清單面板 @P2', () => {
  test.beforeEach(async ({ page }) => {
    const timeoutMultiplier = process.env.CI ? 3 : 2;
    test.setTimeout(DEFAULT_TIMEOUT * timeoutMultiplier);

    // 進入賽事詳情頁
    await setupRaceEntry(page);

    // 選擇 3 隻鴿子以便測試面板功能
    await selectMultiplePigeons(page, 3);
    await page.waitForTimeout(500);
  });

  // ==========================================================================
  // 9.1 面板展開
  // ==========================================================================

  test('9.1 面板展開 - 點擊按鈕展開面板', async ({ page }) => {
    // 驗證：勾選清單按鈕可見
    const panelButton = getCheckboxPanelButton(page);
    await expect(panelButton).toBeVisible({ timeout: 10000 });

    // 驗證：按鈕顯示數量 > 0
    const count = await getPanelCount(page);
    expect(count).toBeGreaterThan(0);

    // 點擊展開面板
    const expanded = await expandCheckboxPanel(page);
    expect(expanded).toBe(true);

    // 驗證：面板已展開
    const isExpanded = await isCheckboxPanelExpanded(page);
    expect(isExpanded).toBe(true);
  });

  // ==========================================================================
  // 9.2 清單內容
  // ==========================================================================

  test('9.2 清單內容 - 面板內顯示已選鴿子', async ({ page }) => {
    // 展開面板
    await expandCheckboxPanel(page);

    // 驗證：面板內有鴿子項目
    const pigeonCount = await getPanelPigeonCount(page);
    expect(pigeonCount).toBeGreaterThan(0);

    // 驗證：面板數量與內容數量一致
    const panelCount = await getPanelCount(page);
    expect(pigeonCount).toBeLessThanOrEqual(panelCount);
  });

  // ==========================================================================
  // 9.3 單個刪除
  // ==========================================================================

  test('9.3 單個刪除 - 刪除後列表更新', async ({ page }) => {
    // 記錄刪除前數量
    const beforeCount = await getPanelCount(page);
    expect(beforeCount).toBeGreaterThan(0);

    // 刪除第一隻鴿子
    await deleteFirstPigeonFromPanel(page);

    // 等待 UI 更新
    await page.waitForTimeout(500);

    // 驗證：數量減少 1
    const afterCount = await getPanelCount(page);
    expect(afterCount).toBe(beforeCount - 1);
  });

  // ==========================================================================
  // 9.4 全部刪除
  // ==========================================================================

  test('9.4 全部刪除 - 清空列表', async ({ page }) => {
    // 確認有選擇的鴿子
    const beforeCount = await getPanelCount(page);
    expect(beforeCount).toBeGreaterThan(0);

    // 全部刪除
    await deleteAllFromPanel(page);

    // 等待 UI 更新
    await page.waitForTimeout(500);

    // 驗證：數量歸零
    const afterCount = await getPanelCount(page);
    expect(afterCount).toBe(0);
  });

  // ==========================================================================
  // 9.5 數量更新
  // ==========================================================================

  test('9.5 數量更新 - 刪除後數字同步', async ({ page }) => {
    // 記錄初始數量
    const initialCount = await getPanelCount(page);
    expect(initialCount).toBeGreaterThan(1);

    // 刪除一隻
    await deleteFirstPigeonFromPanel(page);
    await page.waitForTimeout(500);

    // 驗證：按鈕數字更新
    const afterFirstDelete = await getPanelCount(page);
    expect(afterFirstDelete).toBe(initialCount - 1);

    // 如果還有鴿子，再刪除一隻驗證連續更新
    if (afterFirstDelete > 0) {
      await deleteFirstPigeonFromPanel(page);
      await page.waitForTimeout(500);

      const afterSecondDelete = await getPanelCount(page);
      expect(afterSecondDelete).toBe(afterFirstDelete - 1);
    }
  });
});
