/**
 * wait-utils.ts - Chrome DevTools MCP 等待策略
 *
 * 職責：提供 DevTools MCP 版本的等待邏輯
 * - 基於 a11y 快照輪詢的元素等待
 * - 基於網路請求的 API 等待
 * - 模式切換等待
 *
 * 對應 Playwright 版本：tests/helpers/wait-utils.ts
 * API 映射參考：dev/active/devtools-mcp-comparison/api-mapping.md
 */

import { findElementByRole, findElementByText, hasElement } from './devtools-core';
import type { ViewMode } from '../shared/types';

/** 預設超時時間 (ms) */
const DEFAULT_TIMEOUT = 15000;

/** 輪詢間隔 (ms) */
const POLL_INTERVAL = 500;

/**
 * 延遲指定時間
 * @param ms - 毫秒數
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 等待 a11y 快照中出現指定角色的元素
 *
 * @param takeSnapshotFn - 取得快照的函數（由調用者注入 MCP 工具）
 * @param role - 元素角色 (button, textbox, link 等)
 * @param namePattern - 可選的名稱匹配模式
 * @param timeout - 超時時間（毫秒）
 * @returns 符合條件的元素 uid
 * @throws 超時錯誤
 */
export async function waitForElement(
  takeSnapshotFn: () => Promise<string>,
  role: string,
  namePattern?: RegExp | string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const snapshot = await takeSnapshotFn();
    const uid = findElementByRole(snapshot, role, namePattern);
    if (uid) {
      console.log(`[OK] 找到元素：role=${role}, name=${namePattern}`);
      return uid;
    }
    await delay(POLL_INTERVAL);
  }

  throw new Error(
    `[TIMEOUT] 等待元素超時：role=${role}, name=${namePattern}, timeout=${timeout}ms`
  );
}

/**
 * 等待 a11y 快照中出現包含指定文字的元素
 *
 * @param takeSnapshotFn - 取得快照的函數
 * @param textPattern - 文字匹配模式
 * @param timeout - 超時時間（毫秒）
 * @returns 符合條件的元素 uid
 * @throws 超時錯誤
 */
export async function waitForText(
  takeSnapshotFn: () => Promise<string>,
  textPattern: RegExp | string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const snapshot = await takeSnapshotFn();
    const uid = findElementByText(snapshot, textPattern);
    if (uid) {
      console.log(`[OK] 找到文字：${textPattern}`);
      return uid;
    }
    await delay(POLL_INTERVAL);
  }

  throw new Error(`[TIMEOUT] 等待文字超時：${textPattern}, timeout=${timeout}ms`);
}

/**
 * 等待元素消失
 *
 * @param takeSnapshotFn - 取得快照的函數
 * @param role - 元素角色
 * @param namePattern - 可選的名稱匹配模式
 * @param timeout - 超時時間（毫秒）
 * @throws 超時錯誤
 */
export async function waitForElementHidden(
  takeSnapshotFn: () => Promise<string>,
  role: string,
  namePattern?: RegExp | string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const snapshot = await takeSnapshotFn();
    const exists = hasElement(snapshot, role, namePattern);
    if (!exists) {
      console.log(`[OK] 元素已消失：role=${role}, name=${namePattern}`);
      return;
    }
    await delay(POLL_INTERVAL);
  }

  throw new Error(
    `[TIMEOUT] 等待元素消失超時：role=${role}, name=${namePattern}, timeout=${timeout}ms`
  );
}

/**
 * 等待 2D 地圖載入完成
 *
 * DevTools MCP 策略：
 * 1. 檢查 a11y 快照中是否出現 2D 模式特有的 timeline 按鈕
 * 2. 或使用 evaluate_script 檢查 canvas.amap-layer 元素
 *
 * @param takeSnapshotFn - 取得快照的函數
 * @param evaluateScriptFn - 執行腳本的函數（可選，用於 Canvas 檢查）
 * @param timeout - 超時時間（毫秒）
 */
export async function waitForMapTiles(
  takeSnapshotFn: () => Promise<string>,
  evaluateScriptFn?: (script: string) => Promise<unknown>,
  timeout: number = DEFAULT_TIMEOUT
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    // 方法 1：透過 a11y 快照檢測 2D UI 元素
    const snapshot = await takeSnapshotFn();
    const hasTimeline = hasElement(snapshot, 'button', /timeline/i);
    if (hasTimeline) {
      console.log('[OK] 2D 地圖已載入（檢測到 timeline 按鈕）');
      return;
    }

    // 方法 2：透過 evaluate_script 檢測 Canvas（如果提供）
    if (evaluateScriptFn) {
      const canvasReady = await evaluateScriptFn(`
        () => {
          const canvas = document.querySelector('canvas.amap-layer');
          return canvas && canvas.width > 0 && canvas.height > 0;
        }
      `);
      if (canvasReady) {
        console.log('[OK] 2D 地圖 Canvas 已載入');
        return;
      }
    }
    await delay(POLL_INTERVAL);
  }

  throw new Error(`[TIMEOUT] 地圖載入超時：timeout=${timeout}ms`);
}

/**
 * 等待 Cesium 3D 引擎就緒
 *
 * DevTools MCP 策略：檢查 a11y 快照中是否出現「視角1」按鈕
 *
 * @param takeSnapshotFn - 取得快照的函數
 * @param timeout - 超時時間（毫秒）
 */
export async function waitForCesium3D(
  takeSnapshotFn: () => Promise<string>,
  timeout: number = 30000
): Promise<void> {
  console.log('[WAIT] 等待 3D 模式載入...');
  await waitForElement(takeSnapshotFn, 'button', /[视視]角1/, timeout);
  // 額外等待讓 3D 場景完全渲染
  await delay(2000);
  console.log('[OK] 3D 場景載入完成');
}

/**
 * 等待軌跡數據 API 響應
 *
 * DevTools MCP 策略：使用 list_network_requests 輪詢檢查
 *
 * @param listNetworkRequestsFn - 列出網路請求的函數
 * @param urlPattern - API URL 匹配模式
 * @param timeout - 超時時間（毫秒）
 * @returns 是否找到符合的請求
 */
export async function waitForApiResponse(
  listNetworkRequestsFn: () => Promise<Array<{ url: string; status?: number }>>,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<boolean> {
  const startTime = Date.now();
  const pattern = urlPattern instanceof RegExp ? urlPattern : new RegExp(urlPattern);

  while (Date.now() - startTime < timeout) {
    const requests = await listNetworkRequestsFn();
    const found = requests.find(
      (req) => pattern.test(req.url) && req.status === 200
    );
    if (found) {
      console.log(`[OK] API 響應成功：${found.url}`);
      return true;
    }
    await delay(POLL_INTERVAL);
  }

  console.warn(`[WARN] API 響應等待超時：${urlPattern}`);
  return false;
}

/**
 * 等待模式切換完成
 *
 * @param takeSnapshotFn - 取得快照的函數
 * @param targetMode - 目標模式
 * @param timeout - 超時時間（毫秒）
 */
export async function waitForModeSwitch(
  takeSnapshotFn: () => Promise<string>,
  targetMode: ViewMode,
  timeout: number = DEFAULT_TIMEOUT
): Promise<void> {
  if (targetMode === '2D') {
    console.log('[WAIT] 等待 2D 模式載入...');
    // 策略 1：檢測 timeline 按鈕出現
    try {
      await waitForElement(takeSnapshotFn, 'button', /timeline/i, timeout);
      console.log('[OK] 2D 模式已載入（timeline 按鈕）');
    } catch {
      // 策略 2：檢測 3D 視角按鈕消失
      console.log('[WARN] timeline 未找到，嘗試檢測視角按鈕消失...');
      await waitForElementHidden(takeSnapshotFn, 'button', /[视視]角1/, 5000);
      console.log('[OK] 2D 模式已載入（3D 元素已消失）');
    }
  } else {
    await waitForCesium3D(takeSnapshotFn, timeout);
  }
  // 額外等待讓數據完全渲染
  await delay(2500);
  console.log(`[OK] ${targetMode} 模式切換完成`);
}

/**
 * 通用重試邏輯
 *
 * @param fn - 要執行的異步函數
 * @param retries - 重試次數
 * @param delayMs - 重試間隔（毫秒）
 * @returns 函數執行結果
 * @throws 所有重試都失敗時拋出最後一個錯誤
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[WARN] 嘗試 ${i + 1}/${retries} 失敗：${lastError.message}`);
      if (i < retries - 1) {
        await delay(delayMs);
      }
    }
  }

  throw new Error(`[ERROR] 重試 ${retries} 次後仍失敗：${lastError?.message}`);
}

/**
 * 網路請求資訊接口
 */
interface NetworkRequest {
  url: string;
  status?: number;
  method?: string;
}

/**
 * 等待軌跡數據 API 響應
 *
 * 對應 Playwright 版本的 waitForTrajectoryData()
 * 使用 list_network_requests 輪詢檢查 ugetPigeonAllJsonInfo API
 *
 * @param listNetworkRequestsFn - 列出網路請求的函數
 * @param timeout - 超時時間（毫秒）
 * @returns 是否成功接收到數據
 */
export async function waitForTrajectoryData(
  listNetworkRequestsFn: () => Promise<NetworkRequest[]>,
  timeout: number = 10000
): Promise<boolean> {
  console.log('[WAIT] 等待軌跡數據 API 響應...');
  const API_PATTERN = /ugetPigeonAllJsonInfo/;

  const result = await waitForApiResponse(
    listNetworkRequestsFn,
    API_PATTERN,
    timeout
  );

  if (result) {
    console.log('[OK] 軌跡數據 API 響應成功');
  } else {
    console.warn('[WARN] 軌跡數據 API 響應等待超時');
  }

  return result;
}
