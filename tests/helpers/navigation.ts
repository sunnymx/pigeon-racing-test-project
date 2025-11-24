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
 * @param page - Playwright Page 物件
 * @returns '2D' | '3D' | 'unknown'
 */
export async function getCurrentMode(page: Page): Promise<'2D' | '3D' | 'unknown'> {
  console.log('[mode] detecting current mode...');

  // Layer 1: 3D 專屬控制（視角按鈕）
  const view1Button = page.getByRole('button', { name: '視角1' });
  const hasView1Button = await view1Button.isVisible().catch(() => false);
  if (hasView1Button) {
    console.log('[mode] detected 3D via 視角1 button');
    return '3D';
  }

  // Layer 2: 模式切換按鈕文字反推當前模式
  const modeToggleButton = page.getByRole('button', { name: /[23]D模式/ });
  const toggleText = await modeToggleButton.textContent().catch(() => null);
  if (toggleText) {
    const normalizedText = toggleText.trim();
    console.log(`[mode] mode toggle text: "${normalizedText}"`);

    if (normalizedText.includes('3D')) {
      console.log('[mode] toggle shows 3D模式 → currently in 2D');
      return '2D';
    }
    if (normalizedText.includes('2D')) {
      console.log('[mode] toggle shows 2D模式 → currently in 3D');
      return '3D';
    }
  }

  // Layer 3: 後備 - 2D 地圖容器存在
  const mapContainer = page.locator('.amap-container');
  const hasMapContainer = await mapContainer.isVisible().catch(() => false);
  if (hasMapContainer) {
    console.log('[mode] fallback: detected amap container → assuming 2D');
    return '2D';
  }

  console.log('[mode] unable to determine current mode');
  return 'unknown';
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
