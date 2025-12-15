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
 * ⚠️ 已更新：原選擇器 .amap-container img 已棄用（AMap v2.0+ 改用 Canvas 渲染）
 * 策略：檢查 canvas.amap-layer 元素是否已初始化
 * 成功標準：Canvas 元素存在且尺寸 > 0
 *
 * @param page - Playwright Page 物件
 * @param minTiles - 已棄用參數（保留以維持向後兼容）
 * @param timeout - 超時時間（毫秒，預設 15000）
 * @throws 如果超時仍未初始化
 */
export async function waitForMapTiles(
  page: Page,
  minTiles: number = 50,
  timeout: number = 15000
): Promise<number> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const canvas = page.locator('canvas.amap-layer').first();
    const isVisible = await canvas.isVisible().catch(() => false);

    if (isVisible) {
      const box = await canvas.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        console.log(`✅ 地圖 Canvas 已載入完成：${box.width}x${box.height}`);
        return 1; // 返回 1 表示 Canvas 已就緒
      }
    }

    await page.waitForTimeout(500);
  }

  throw new Error(
    `❌ 地圖 Canvas 載入超時：無法在 ${timeout}ms 內初始化`
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
  console.log('⏳ 等待 3D 模式載入（使用視覺元素檢查）...');

  // 方法：檢查 3D 特徵視覺元素（視角1按鈕）
  // 不依賴 window.Cesium 因為應用可能不將其暴露到全域
  // 使用正則匹配繁簡體：視角/视角
  try {
    const view1Button = page.getByRole('button', { name: /[视視]角1/ });
    await view1Button.waitFor({ state: 'visible', timeout });
    console.log('✅ 3D 視角控制按鈕已顯示');
  } catch (error) {
    throw new Error('❌ 3D 模式視角控制按鈕未顯示');
  }

  // 額外等待確保 3D 場景完全渲染
  await page.waitForTimeout(2000);
  console.log('✅ 3D 場景載入完成');

  // 以下是原始的 JS 對象檢查（已註解，因為應用不暴露這些對象）
  /*
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
  */
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
 * - 2D 模式：檢測 2D 特有 UI 元素（timeline 按鈕）和 3D 元素消失
 * - 3D 模式：等待 Cesium 引擎就緒（視角按鈕出現）
 * - 額外等待 2-3 秒讓數據渲染（解決已知問題 #4）
 *
 * ⚠️ 重要更新 (2025-11-26)：
 * 舊方法使用 .amap-container img 計數檢測 2D 模式，但現代高德地圖
 * 使用 Canvas 渲染而非 <img> 標籤，導致檢測失敗。
 * 新方法改用 UI 元素檢測，更可靠。
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
    console.log('⏳ 等待 2D 模式載入（使用 UI 元素檢測）...');

    // 方法：檢測 2D 模式特有的 timeline 按鈕
    // 2D 模式有 timeline/airwave/square_foot 按鈕，3D 模式則有視角按鈕
    const timelineButton = page.getByRole('button').filter({ hasText: 'timeline' });

    try {
      await timelineButton.waitFor({ state: 'visible', timeout });
      console.log('✅ 2D 模式 timeline 按鈕已顯示');
    } catch (error) {
      // 備選：檢測 3D 特有元素（視角按鈕）是否消失
      console.log('⚠️ timeline 按鈕未找到，嘗試檢測視角按鈕消失...');
      const view1Button = page.getByRole('button', { name: /[视視]角1/ });
      await view1Button.waitFor({ state: 'hidden', timeout: 5000 });
      console.log('✅ 3D 視角按鈕已消失，確認進入 2D 模式');
    }
  } else if (targetMode === '3D') {
    // 等待 Cesium 引擎（檢測視角按鈕出現）
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
