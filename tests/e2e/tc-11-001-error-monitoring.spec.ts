/**
 * tc-11-001-error-monitoring.spec.ts - 錯誤監控測試
 *
 * 對應規格：USER_JOURNEY_RECORD_V2.md 記錄點 #11
 *
 * 1 個測試包含 3 個驗證點：
 * - 11.1 Console 無嚴重錯誤 (P0)
 * - 11.2 網路請求成功 (P0)
 * - 11.3 頁面無崩潰 (P0)
 *
 * 設計原則：
 * - 執行一次完整用戶旅程，同時監控三種錯誤
 * - 使用白名單過濾已知可忽略的錯誤
 */

import { test, expect } from '@playwright/test';
import { setupHomepage, setupRaceEntry, setup2DTrajectory, DEFAULT_TIMEOUT } from '../helpers/fixtures';
import { ErrorMonitor } from '../helpers/error-monitor';

// ============================================================================
// 測試配置
// ============================================================================

test.describe('TC-11-001: 錯誤監控 @P0', () => {
  test('11.1-3 完整用戶旅程無嚴重錯誤', async ({ page }) => {
    // 設置較長超時（需執行完整流程）
    test.setTimeout(DEFAULT_TIMEOUT * 3);

    // 初始化錯誤監控
    const monitor = new ErrorMonitor();
    monitor.setup(page);

    // ========================================================================
    // 執行用戶旅程
    // ========================================================================

    // 階段 1: 首頁
    await setupHomepage(page);

    // 階段 2: 進入賽事
    await page.getByRole('button', { name: /进入|進入/ }).first().click();
    // 等待表格載入
    await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // 階段 3: 選擇鴿子
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await checkbox.isVisible()) {
      await checkbox.click();
      await page.waitForTimeout(500);
    }

    // 階段 4: 設置 2D 偏好（選取鴿子後按鈕才會啟用）
    const button2D = page.getByRole('button', { name: '2D', exact: true });
    await button2D.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await button2D.isEnabled().catch(() => false)) {
      await button2D.click();
      await page.waitForTimeout(300);
    }

    // 階段 5: 查看軌跡
    const viewButton = page.getByText(/查看[轨軌][迹跡]/);
    await viewButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await viewButton.isEnabled().catch(() => false)) {
      await viewButton.click();
      await page.waitForTimeout(3000);
    }

    // 階段 6: 基本互動（如果軌跡載入成功）
    const hasTrajectory = (await page.locator('.amap-icon > img').count()) > 0;
    if (hasTrajectory) {
      // 嘗試點擊軌跡點
      await page.locator('.amap-icon > img').first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // ========================================================================
    // 取得報告並驗證
    // ========================================================================

    const report = monitor.getReport();

    // 輸出摘要（用於除錯）
    monitor.printSummary();

    // 驗證點 11.1: Console 無嚴重錯誤
    expect(report.consoleErrors, '應無 Console 嚴重錯誤').toEqual([]);

    // 驗證點 11.2: 網路請求成功（無 5xx 錯誤）
    expect(report.networkErrors, '應無 5xx 網路錯誤').toEqual([]);

    // 驗證點 11.3: 頁面無崩潰
    expect(report.pageErrors, '應無頁面崩潰錯誤').toEqual([]);

    // 綜合驗證
    expect(report.hasCriticalIssues, '應無任何嚴重問題').toBe(false);
  });
});
