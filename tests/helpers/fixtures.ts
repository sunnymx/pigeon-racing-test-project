/**
 * fixtures.ts - 共用測試設定和 setup 函數
 *
 * 簡化版：僅包含首頁測試所需函數
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
