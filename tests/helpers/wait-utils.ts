/**
 * wait-utils.ts - 智能等待策略
 *
 * 職責：處理各種載入場景的等待邏輯
 * - AMap 地圖瓦片載入
 * - Cesium 3D 引擎就緒
 * - 軌跡數據 API 響應
 * - 模式切換完成
 *
 * 解決問題：#4 - 數據載入時序問題
 * 參考文檔：docs/guides/testing-strategies.md#wait-strategies
 */

import { Page } from '@playwright/test';

/**
 * 等待 AMap 地圖瓦片載入完成
 *
 * 策略：檢查 .amap-container img 元素數量
 * 成功標準：至少載入指定數量的瓦片
 *
 * @param page - Playwright Page 物件
 * @param minTiles - 最小瓦片數量（預設 50）
 * @param timeout - 超時時間（毫秒，預設 15000）
 * @throws 如果超時仍未達到最小瓦片數量
 */
export async function waitForMapTiles(
  page: Page,
  minTiles: number = 50,
  timeout: number = 15000
): Promise<number> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const tileCount = await page.locator('.amap-container img').count();

    if (tileCount >= minTiles) {
      console.log(`✅ 地圖瓦片載入完成：${tileCount} 個`);
      return tileCount;
    }

    await page.waitForTimeout(500);
  }

  const finalCount = await page.locator('.amap-container img').count();
  throw new Error(
    `❌ 地圖瓦片載入超時：預期 >= ${minTiles}，實際 ${finalCount}`
  );
}

/**
 * 等待 Cesium 3D 引擎就緒
 *
 * 策略：
 * 1. 檢查 window.Cesium 對象存在
 * 2. 檢查 window.viewer 對象存在
 * 3. 檢查地球瓦片載入完成
 *
 * @param page - Playwright Page 物件
 * @param timeout - 超時時間（毫秒，預設 30000）
 * @throws 如果 Cesium 引擎初始化失敗
 */
export async function waitForCesium3D(
  page: Page,
  timeout: number = 30000
): Promise<void> {
  // 步驟 1: 等待 Cesium 對象
  try {
    await page.waitForFunction(
      () => typeof (window as any).Cesium !== 'undefined',
      { timeout }
    );
    console.log('✅ Cesium 對象已載入');
  } catch (error) {
    throw new Error('❌ Cesium 對象載入失敗');
  }

  // 步驟 2: 等待 viewer 對象
  try {
    await page.waitForFunction(
      () => typeof (window as any).viewer !== 'undefined',
      { timeout: 10000 }
    );
    console.log('✅ Cesium viewer 已初始化');
  } catch (error) {
    throw new Error('❌ Cesium viewer 初始化失敗');
  }

  // 步驟 3: 等待地球瓦片載入
  try {
    await page.waitForFunction(
      () => {
        const viewer = (window as any).viewer;
        return viewer && viewer.scene && viewer.scene.globe && viewer.scene.globe.tilesLoaded;
      },
      { timeout: 20000 }
    );
    console.log('✅ Cesium 地球瓦片已載入');
  } catch (error) {
    console.warn('⚠️ 地球瓦片載入等待超時（可能正常，繼續測試）');
  }

  // 額外等待 1 秒讓渲染穩定
  await page.waitForTimeout(1000);
}

/**
 * 等待軌跡數據 API 響應完成
 *
 * 策略：監聽 ugetPigeonAllJsonInfo API 請求並等待響應
 *
 * @param page - Playwright Page 物件
 * @param timeout - 超時時間（毫秒，預設 10000）
 * @returns API 響應數據
 * @throws 如果 API 請求失敗或超時
 */
export async function waitForTrajectoryData(
  page: Page,
  timeout: number = 10000
): Promise<any> {
  try {
    const response = await page.waitForResponse(
      (response) => response.url().includes('ugetPigeonAllJsonInfo') && response.status() === 200,
      { timeout }
    );

    const data = await response.json();
    console.log('✅ 軌跡數據 API 響應成功');
    return data;
  } catch (error) {
    throw new Error('❌ 軌跡數據 API 響應失敗或超時');
  }
}

/**
 * 等待模式切換完成
 *
 * 策略：
 * - 2D 模式：等待地圖瓦片載入
 * - 3D 模式：等待 Cesium 引擎就緒
 * - 額外等待 2-3 秒讓數據渲染（解決已知問題 #4）
 *
 * @param page - Playwright Page 物件
 * @param targetMode - 目標模式 '2D' | '3D'
 * @param timeout - 超時時間（毫秒，預設 15000）
 */
export async function waitForModeSwitch(
  page: Page,
  targetMode: '2D' | '3D',
  timeout: number = 15000
): Promise<void> {
  if (targetMode === '2D') {
    // 等待 AMap 瓦片載入
    await waitForMapTiles(page, 50, timeout);
  } else if (targetMode === '3D') {
    // 等待 Cesium 引擎
    await waitForCesium3D(page, timeout);
  }

  // 關鍵：額外等待讓數據完全載入和渲染
  await page.waitForTimeout(2500);
  console.log(`✅ ${targetMode} 模式切換完成`);
}

/**
 * 通用等待策略：重試邏輯
 *
 * @param fn - 要執行的異步函數
 * @param retries - 重試次數（預設 3）
 * @param delay - 重試間隔（毫秒，預設 1000）
 * @returns 函數執行結果
 * @throws 如果所有重試都失敗
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ 嘗試 ${i + 1}/${retries} 失敗：${lastError.message}`);

      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`❌ 重試 ${retries} 次後仍失敗：${lastError?.message}`);
}

/**
 * 等待元素穩定（不再變化）
 *
 * 用於等待動畫完成或數據載入完成
 *
 * @param page - Playwright Page 物件
 * @param selector - 元素選擇器
 * @param stableTime - 穩定時間（毫秒，預設 1000）
 * @param timeout - 總超時時間（毫秒，預設 10000）
 */
export async function waitForStable(
  page: Page,
  selector: string,
  stableTime: number = 1000,
  timeout: number = 10000
): Promise<void> {
  const startTime = Date.now();
  let lastContent: string | null = null;
  let stableStartTime: number | null = null;

  while (Date.now() - startTime < timeout) {
    const element = page.locator(selector).first();
    const content = await element.textContent().catch(() => null);

    if (content === lastContent) {
      if (!stableStartTime) {
        stableStartTime = Date.now();
      } else if (Date.now() - stableStartTime >= stableTime) {
        console.log(`✅ 元素已穩定：${selector}`);
        return;
      }
    } else {
      lastContent = content;
      stableStartTime = null;
    }

    await page.waitForTimeout(200);
  }

  throw new Error(`❌ 等待元素穩定超時：${selector}`);
}
