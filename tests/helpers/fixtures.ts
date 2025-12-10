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
