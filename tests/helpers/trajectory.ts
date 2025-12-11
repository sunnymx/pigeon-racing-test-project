/**
 * trajectory.ts - 軌跡相關 helper 函數
 *
 * 支援記錄點 #03 測試
 * 處理已知問題 #3: 軌跡點點擊無響應
 */

import { Page } from '@playwright/test';

// ============================================================================
// 類型定義
// ============================================================================

export interface InfoWindowData {
  ringNumber: string | null;
  time: string | null;
  altitude: string | null;
  speed: string | null;
}

// ============================================================================
// 軌跡標記點操作
// ============================================================================

/**
 * 取得軌跡標記點數量
 *
 * 選擇器: .amap-icon > img (2025-11-26 更新)
 */
export async function getMarkerCount(page: Page): Promise<number> {
  return await page.locator('.amap-icon > img').count();
}

/**
 * 點擊軌跡標記點並等待 InfoWindow
 *
 * 處理已知問題 #3: 使用 force: true 避免 canvas 遮擋
 *
 * @param page - Playwright Page 物件
 * @param index - 要點擊的標記點索引（預設: 中間點）
 */
export async function clickMarkerPoint(
  page: Page,
  index?: number
): Promise<void> {
  const markers = page.locator('.amap-icon > img');
  const count = await markers.count();

  if (count === 0) {
    throw new Error('未找到軌跡標記點');
  }

  // 預設點擊中間位置的標記點
  const targetIndex = index !== undefined
    ? Math.min(index, count - 1)
    : Math.floor(count / 2);

  await markers.nth(targetIndex).click({ force: true });

  // 等待 InfoWindow 出現
  await page.waitForTimeout(1000);
}

/**
 * 驗證 InfoWindow 是否顯示
 */
export async function isInfoWindowVisible(page: Page): Promise<boolean> {
  // InfoWindow 通常包含環號格式 "2025-" 或類似標題
  const infoWindow = page.locator('.amap-info-window, .amap-info-contentContainer');
  return await infoWindow.isVisible().catch(() => false);
}

/**
 * 取得 InfoWindow 數據
 *
 * 返回：{ ringNumber, time, altitude, speed }
 */
export async function getInfoWindowData(page: Page): Promise<InfoWindowData> {
  const result: InfoWindowData = {
    ringNumber: null,
    time: null,
    altitude: null,
    speed: null,
  };

  // 嘗試從 InfoWindow 或側邊欄提取數據
  const infoContainer = page.locator('.amap-info-window, .info-container').first();

  if (await infoContainer.isVisible().catch(() => false)) {
    const text = await infoContainer.textContent() || '';

    // 環號格式：XX-XXXXXXX
    const ringMatch = text.match(/(\d{2}-\d{7})/);
    if (ringMatch) result.ringNumber = ringMatch[1];

    // 時間格式：HH:MM:SS
    const timeMatch = text.match(/(\d{2}:\d{2}:\d{2})/);
    if (timeMatch) result.time = timeMatch[1];

    // 海拔：數字 + m
    const altMatch = text.match(/(\d+)\s*m/i);
    if (altMatch) result.altitude = altMatch[1];

    // 分速：數字 + m/min
    const speedMatch = text.match(/(\d+)\s*m\/min/i);
    if (speedMatch) result.speed = speedMatch[1];
  }

  return result;
}

// ============================================================================
// Canvas 驗證
// ============================================================================

/**
 * 驗證 Canvas 圖層存在
 *
 * 選擇器: canvas.amap-layer (AMap v2.0+)
 */
export async function hasCanvasLayer(page: Page): Promise<boolean> {
  const count = await page.locator('canvas.amap-layer').count();
  return count > 0;
}
