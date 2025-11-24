/**
 * navigation.ts - 導航相關輔助函數
 *
 * 職責：自動化基本用戶流程
 * - 進入賽事
 * - 選擇鴿子
 * - 打開軌跡視圖
 *
 * 參考文檔：docs/architecture/test-framework.md
 */

import { Page, expect } from '@playwright/test';

/**
 * 進入指定索引的賽事
 *
 * @param page - Playwright Page 物件
 * @param raceIndex - 賽事索引（預設為 0，即第一個賽事）
 * @throws 如果賽事不存在或載入失敗
 */
export async function enterRace(page: Page, raceIndex: number = 0): Promise<void> {
  // 導航到首頁
  await page.goto('/', { waitUntil: 'networkidle' });

  // 等待賽事卡片載入
  await page.waitForSelector('mat-card', { timeout: 10000 });

  // 獲取所有「進入」按鈕
  // UI 目前改成簡體「进入」，因此使用中英混合的 Regex 以避免找不到按鈕
  const enterButtons = page.getByRole('button', { name: /\s*(进入|進入)\s*/ });
  const count = await enterButtons.count();

  if (count === 0) {
    throw new Error('找不到任何賽事的「進入」按鈕');
  }

  if (raceIndex >= count) {
    throw new Error(`賽事索引 ${raceIndex} 超出範圍，共有 ${count} 個賽事`);
  }

  // 點擊指定索引的「進入」按鈕
  await enterButtons.nth(raceIndex).click();

  // 等待賽事詳情頁載入
  await page.waitForLoadState('networkidle');

  // 驗證排名列表表格已顯示
  await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
}

/**
 * 選擇指定索引的鴿子（勾選 checkbox）
 *
 * @param page - Playwright Page 物件
 * @param pigeonIndex - 鴿子索引（預設為 0，即第一隻鴿子）
 * @returns 選擇後的勾選清單數量
 * @throws 如果鴿子不存在或無法選擇
 */
export async function selectPigeon(page: Page, pigeonIndex: number = 0): Promise<number> {
  // 等待表格載入
  await page.waitForSelector('table tbody tr', { timeout: 10000 });

  // 獲取所有行
  const rows = page.getByRole('row');
  const rowCount = await rows.count();

  if (rowCount <= 1) { // 表頭也算一行
    throw new Error('找不到任何鴿子');
  }

  if (pigeonIndex >= rowCount - 1) { // 減去表頭
    throw new Error(`鴿子索引 ${pigeonIndex} 超出範圍，共有 ${rowCount - 1} 隻鴿子`);
  }

  // 點擊指定索引的 checkbox（跳過表頭，所以 +1）
  const targetRow = rows.nth(pigeonIndex + 1);
  const checkbox = targetRow.getByRole('checkbox');

  await checkbox.click();

  // 等待勾選清單更新
  await page.waitForTimeout(500);

  // 獲取勾選數量（支援簡繁體：勾选清单 / 勾選清單）
  const selectedText = await page.locator('text=/勾[选選]清[单單] \\d+/').textContent();
  const match = selectedText?.match(/勾[选選]清[单單] (\d+)/);

  if (!match) {
    throw new Error('無法讀取勾選清單數量');
  }

  return parseInt(match[1], 10);
}

/**
 * 點擊「查看軌跡」按鈕打開軌跡視圖
 *
 * @param page - Playwright Page 物件
 * @throws 如果按鈕未啟用或軌跡視圖載入失敗
 */
export async function openTrajectory(page: Page): Promise<void> {
  // 支援簡繁體：查看轨迹 / 查看軌跡
  const trajectoryButton = page.getByRole('button', { name: /查看[轨軌][迹跡]/ });

  // 驗證按鈕已啟用
  await expect(trajectoryButton).toBeEnabled({ timeout: 5000 });

  // 點擊按鈕
  await trajectoryButton.click();

  // 等待軌跡視圖載入（等待網路請求完成）
  await page.waitForLoadState('networkidle');

  // 額外等待 2 秒讓地圖初始化
  await page.waitForTimeout(2000);
}

/**
 * 取得當前模式（2D 或 3D）
 *
 * ⚠️ IMPORTANT (Updated 2025-11-24):
 * - Mode button (2D模式/3D模式) is a PREFERENCE toggle, NOT a current state indicator
 * - Button state is independent of current map state
 * - Must detect mode by checking actual map type (AMap vs Cesium)
 *
 * @param page - Playwright Page 物件
 * @returns '2D' | '3D' | 'unknown'
 */
export async function getCurrentMode(page: Page): Promise<'2D' | '3D' | 'unknown'> {
  console.log('[mode] detecting current mode by map type...');

  // Layer 1: Check for 3D-specific controls (視角 buttons)
  // 使用正則匹配繁簡體：視角/视角
  const view1Button = page.getByRole('button', { name: /[视視]角1/ });
  const hasView1Button = await view1Button.isVisible().catch(() => false);
  if (hasView1Button) {
    console.log('[mode] ✓ detected 3D mode (Cesium controls visible)');
    return '3D';
  }

  // Layer 2: Check for 2D-specific container (AMap)
  const mapContainer = page.locator('.amap-container');
  const hasMapContainer = await mapContainer.isVisible().catch(() => false);
  if (hasMapContainer) {
    console.log('[mode] ✓ detected 2D mode (AMap container visible)');
    return '2D';
  }

  console.log('[mode] ⚠️ unable to determine current mode (no map detected)');
  return 'unknown';
}

/**
 * 設定偏好模式（Button Type 1 - 選擇鴿子畫面的偏好選擇器）
 *
 * ⚠️ 此函數操作的是 Button Type 1（偏好選擇器），NOT Button Type 2（地圖功能選單）
 *
 * @param page - Playwright Page 物件
 * @param preferredMode - 偏好模式 '2D' | '3D'
 */
export async function setPreferredMode(page: Page, preferredMode: '2D' | '3D'): Promise<void> {
  console.log(`[preference] Target preference: ${preferredMode}`);

  // Button Type 1: 偏好選擇器
  // 按鈕名稱 = 當前偏好狀態（"2D" 或 "3D"）
  const button2D = page.getByRole('button', { name: '2D', exact: true });
  const button3D = page.getByRole('button', { name: '3D', exact: true });

  // 檢查當前是哪個狀態
  const is2D = await button2D.isVisible().catch(() => false);
  const is3D = await button3D.isVisible().catch(() => false);

  if (!is2D && !is3D) {
    console.log('[preference] ⚠️ Preference button not found, skipping...');
    return;
  }

  const currentPreference = is3D ? '3D' : '2D';
  console.log(`[preference] Current preference: ${currentPreference}`);

  if (currentPreference !== preferredMode) {
    // 點擊按鈕切換偏好（使用 force: true 因為按鈕可能暫時 disabled）
    const buttonToClick = is2D ? button2D : button3D;
    await buttonToClick.click({ force: true });
    await page.waitForTimeout(500);
    console.log(`[preference] ✓ Switched preference to ${preferredMode}`);
  } else {
    console.log(`[preference] ✓ Already set to ${preferredMode}`);
  }
}

/**
 * 組合函數：從首頁到軌跡視圖的完整流程
 *
 * @param page - Playwright Page 物件
 * @param raceIndex - 賽事索引
 * @param pigeonIndex - 鴿子索引
 * @returns 當前模式
 */
export async function navigateToTrajectoryView(
  page: Page,
  raceIndex: number = 0,
  pigeonIndex: number = 0
): Promise<'2D' | '3D' | 'unknown'> {
  await enterRace(page, raceIndex);
  await selectPigeon(page, pigeonIndex);
  await openTrajectory(page);

  return await getCurrentMode(page);
}
