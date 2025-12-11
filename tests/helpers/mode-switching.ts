/**
 * mode-switching.ts - 2D 模式切換 helper
 *
 * 職責：處理 2D 靜態/動態模式切換
 * - 偵測當前視圖模式
 * - 切換靜態/動態模式
 *
 * 模式判斷標準：
 * - 2D 靜態：標記點 ≥ 15 個
 * - 2D 動態：標記點 < 5 個
 */

import { Page } from '@playwright/test';

// ============================================================================
// 常量定義
// ============================================================================

const MODE_SWITCH_WAIT = 2000;  // 模式切換後等待時間

// ============================================================================
// 模式偵測
// ============================================================================

/**
 * 偵測當前視圖模式
 *
 * @returns '2D-static' | '2D-dynamic' | '3D' | 'unknown'
 */
export async function detectCurrentViewMode(
  page: Page
): Promise<'2D-static' | '2D-dynamic' | '3D' | 'unknown'> {
  // 檢查 3D 特徵（視角按鈕，支援簡繁體）
  const view1Button = page.getByRole('button', { name: /[视視]角1/ });
  const is3D = await view1Button.isVisible().catch(() => false);

  if (is3D) {
    return '3D';
  }

  // 檢查 2D 模式下的標記數量
  const markerCount = await page.locator('.amap-icon > img').count();

  if (markerCount >= 15) {
    return '2D-static';
  } else if (markerCount > 0 && markerCount < 5) {
    return '2D-dynamic';
  }

  // 檢查是否有 AMap 容器（確認在 2D）
  const hasAMap = await page.locator('.amap-container').isVisible().catch(() => false);
  if (hasAMap) {
    return '2D-static'; // 預設回傳靜態
  }

  return 'unknown';
}

// ============================================================================
// 模式切換
// ============================================================================

/**
 * 在 2D 模式下切換靜態/動態
 *
 * 策略：點擊 timeline 按鈕或動態/靜態切換按鈕
 *
 * @param page - Playwright Page 物件
 * @param targetSubMode - 'static' | 'dynamic'
 */
export async function switchSubMode2D(
  page: Page,
  targetSubMode: 'static' | 'dynamic'
): Promise<void> {
  const currentMode = await detectCurrentViewMode(page);

  // 檢查是否在 2D 模式
  if (!currentMode.startsWith('2D')) {
    throw new Error(`當前不在 2D 模式（當前：${currentMode}）`);
  }

  // 檢查是否已在目標模式
  const isAlreadyTarget =
    (targetSubMode === 'static' && currentMode === '2D-static') ||
    (targetSubMode === 'dynamic' && currentMode === '2D-dynamic');

  if (isAlreadyTarget) {
    return; // 已在目標模式
  }

  // 嘗試點擊切換按鈕
  // 優先：「切換動態/靜態模式」按鈕
  const toggleButton = page.getByRole('button', {
    name: /切換動態\/靜態模式|切换动态\/静态模式/,
  });

  if (await toggleButton.isVisible().catch(() => false)) {
    await toggleButton.first().click();
  } else {
    // 備選：timeline 按鈕
    const timelineButton = page.getByRole('button').filter({ hasText: 'timeline' });
    await timelineButton.click();
  }

  await page.waitForTimeout(MODE_SWITCH_WAIT);

  // 驗證切換成功
  const newMode = await detectCurrentViewMode(page);
  const expectedMode = targetSubMode === 'static' ? '2D-static' : '2D-dynamic';

  if (newMode !== expectedMode) {
    throw new Error(`切換失敗：預期 ${expectedMode}，實際 ${newMode}`);
  }
}
