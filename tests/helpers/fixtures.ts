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
 */
export async function setup2DTrajectory(page: Page): Promise<void> {
  const maxRetries = process.env.CI ? 3 : 2;
  const maxWait = process.env.CI ? 30000 : 15000;
  const pollInterval = 500;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // 確保在賽事頁面
    if (attempt === 0) {
      await setupRaceEntry(page);
    } else {
      // 重試時返回鴿子列表
      const backButton = page.getByRole('button').filter({ hasText: 'menu' }).first();
      if (await backButton.isVisible().catch(() => false)) {
        await backButton.click({ force: true });
        await page.waitForTimeout(1500);
      }
    }

    // 取消之前的選擇
    const checkedBox = page.locator('input[type="checkbox"]:checked').first();
    if (await checkedBox.isVisible().catch(() => false)) {
      await checkedBox.click();
      await page.waitForTimeout(300);
    }

    // 選擇第一隻鴿子
    const checkbox = page.locator('table').getByRole('checkbox').first();
    await checkbox.click();
    await page.waitForTimeout(1000); // 等待按鈕狀態更新

    // 確保 2D 偏好選中（關鍵！否則會進入 3D 模式）
    // 注意：按鈕選擇鴿子後才會啟用，使用 force: true 跳過啟用檢查
    const toggle2D = page.getByRole('button', { name: '2D', exact: true });
    if (await toggle2D.isVisible().catch(() => false)) {
      // 檢查是否需要切換（3D 選中時才需要點擊 2D）
      const toggle3D = page.getByRole('button', { name: '3D', exact: true });
      const is3DSelected = await toggle3D.evaluate((el) =>
        el.classList.contains('mat-button-toggle-checked')
      ).catch(() => false);
      if (is3DSelected) {
        await toggle2D.click({ force: true });
        await page.waitForTimeout(300);
      }
    }

    // 點擊查看軌跡（使用 getByText 避免按鈕嵌套問題）
    const viewText = page.getByText(/查看[轨軌][迹跡]/);
    await viewText.click();

    // 等待導航完成（地圖容器出現或 URL 變化）
    await page.waitForTimeout(2000);

    // 輪詢等待標記點加載
    let elapsed = 0;
    let markerCount = 0;
    while (elapsed < maxWait) {
      markerCount = await page.locator('.amap-icon > img').count();
      if (markerCount >= 15) {
        await page.waitForTimeout(NAVIGATION_TIMEOUT);
        return; // 加載成功
      }
      await page.waitForTimeout(pollInterval);
      elapsed += pollInterval;
    }

    // 檢查是否加載成功（即使不到 15 也驗證 timeline 按鈕）
    const timelineVisible = await page.getByRole('button')
      .filter({ hasText: 'timeline' })
      .isVisible()
      .catch(() => false);

    if (markerCount >= 1 && timelineVisible) {
      await page.waitForTimeout(NAVIGATION_TIMEOUT);
      return; // 部分加載但在 2D 模式
    }
  }

  // 最後一次嘗試後仍等待
  await page.waitForTimeout(NAVIGATION_TIMEOUT);
}
