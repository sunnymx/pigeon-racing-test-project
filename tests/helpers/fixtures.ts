/**
 * fixtures.ts - 共用測試設定和 setup 函數
 *
 * 支援記錄點 #01, #02 測試
 * 完整版參考：tests/archive/e2e/user-journey/fixtures.ts
 */

import { Page } from '@playwright/test';

// ============================================================================
// 常量定義
// ============================================================================

export const BASE_URL = 'https://skyracing.com.cn/';
export const DEFAULT_TIMEOUT = 60000;
export const NAVIGATION_TIMEOUT = 3000;

// ============================================================================
// Setup 函數
// ============================================================================

/**
 * 設置首頁 - 最基本的 setup
 *
 * 已處理 Known Issue #5: 使用 domcontentloaded 避免地圖瓦片載入超時
 */
export async function setupHomepage(page: Page): Promise<void> {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(NAVIGATION_TIMEOUT);
}

/**
 * 設置賽事頁 - 點擊「進入」按鈕進入賽事詳情
 *
 * 對應規格：USER_JOURNEY_RECORD #02
 */
export async function setupRaceEntry(page: Page): Promise<void> {
  await setupHomepage(page);
  // 支援簡繁體：进入/進入
  await page.getByRole('button', { name: /进入|進入/ }).first().click();
  await page.waitForTimeout(NAVIGATION_TIMEOUT);
}

/**
 * 設置 2D 軌跡頁 - 從賽事詳情進入 2D 靜態軌跡視圖
 *
 * 對應規格：USER_JOURNEY_RECORD #03
 * 處理已知問題 #1: 2D 軌跡初次加載失敗，使用重試機制
 * 參考實現：tests/archive/helpers/trajectory-reload.ts
 */
export async function setup2DTrajectory(page: Page): Promise<void> {
  const isCI = !!process.env.CI;
  const maxRetries = isCI ? 3 : 2;
  const maxWait = isCI ? 45000 : 15000; // CI 延長到 45 秒
  const pollInterval = 500;
  const shortWait = isCI ? 1500 : 500;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 確保在賽事頁面
      if (attempt === 0) {
        await setupRaceEntry(page);
      } else {
        // 重試時返回鴿子列表
        // 先關閉可能打開的 drawer（參考 archive）
        const drawerBackdrop = page.locator('.mat-drawer-backdrop');
        if (await drawerBackdrop.isVisible().catch(() => false)) {
          await drawerBackdrop.click();
          await page.waitForTimeout(500);
        }

        const backButton = page.getByRole('button').filter({ hasText: 'menu' }).first();
        if (await backButton.isVisible().catch(() => false)) {
          await backButton.click({ force: true });
          await page.waitForTimeout(shortWait * 2);
        }

        // 確保表格出現
        await page.waitForSelector('table tbody tr', { timeout: 10000 });
      }

      // 取消之前的選擇
      const checkedBox = page.locator('input[type="checkbox"]:checked').first();
      if (await checkedBox.isVisible().catch(() => false)) {
        await checkedBox.click();
        await page.waitForTimeout(shortWait);
      }

      // 選擇第一隻鴿子
      const checkbox = page.locator('table').getByRole('checkbox').first();
      await checkbox.click();
      await page.waitForTimeout(shortWait);

      // 確保 2D 偏好選中（關鍵！否則會進入 3D 模式）
      const toggle3D = page.getByRole('button', { name: '3D', exact: true });
      if (await toggle3D.isVisible().catch(() => false)) {
        const is3DSelected = await toggle3D.evaluate((el) =>
          el.classList.contains('mat-button-toggle-checked')
        ).catch(() => false);
        if (is3DSelected) {
          const toggle2D = page.getByRole('button', { name: '2D', exact: true });
          await toggle2D.click({ force: true });
          await page.waitForTimeout(300);
        }
      }

      // 點擊查看軌跡（使用 getByText 避免按鈕嵌套問題）
      const viewText = page.getByText(/查看[轨軌][迹跡]/);
      await viewText.click();

      // 等待頁面加載狀態（參考 archive）
      await page.waitForLoadState(isCI ? 'domcontentloaded' : 'networkidle');
      await page.waitForTimeout(isCI ? 5000 : 2000);

      // 輪詢等待標記點加載
      let elapsed = 0;
      while (elapsed < maxWait) {
        const markerCount = await page.locator('.amap-icon > img').count();
        const timelineVisible = await page.getByRole('button')
          .filter({ hasText: 'timeline' })
          .isVisible()
          .catch(() => false);
        const mapVisible = await page.locator('.amap-container')
          .isVisible()
          .catch(() => false);

        // 成功條件：標記點 >= 1 且 timeline 可見且地圖可見
        if (markerCount >= 1 && timelineVisible && mapVisible) {
          await page.waitForTimeout(NAVIGATION_TIMEOUT);
          return; // 成功！
        }

        await page.waitForTimeout(pollInterval);
        elapsed += pollInterval;
      }
      // 本次嘗試失敗，繼續下一次重試
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw new Error(`2D 軌跡加載失敗，已重試 ${maxRetries} 次`);
      }
    }
  }

  // 所有重試都失敗
  throw new Error(`2D 軌跡加載失敗，已重試 ${maxRetries} 次`);
}
