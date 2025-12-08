/**
 * fixtures.ts - 共用測試設定和 setup 函數
 *
 * 為 34 個獨立測試提供統一的頁面導航和狀態設定
 */

import { Page } from '@playwright/test';
import { WAIT_STRATEGIES } from '../../helpers/adaptive-wait';
import { reload2DTrajectory } from '../../helpers/trajectory-reload';
import { enterRace, selectPigeon, setPreferredMode, openTrajectory } from '../../helpers/navigation';
import { ensureModeByText } from '../../helpers/mode-switching';

// ============================================================================
// 常量定義
// ============================================================================

export const BASE_URL = 'https://skyracing.com.cn/';
export const DEFAULT_TIMEOUT = 60000;
export const NAVIGATION_TIMEOUT = 3000;

// ============================================================================
// 測試狀態介面
// ============================================================================

export interface TestState {
  pigeonIndex: number;
  trajectory2DLoaded: boolean;
  currentMode: '2D' | '3D' | null;
  subMode: 'static' | 'dynamic' | null;
}

export function createInitialState(): TestState {
  return {
    pigeonIndex: 0,
    trajectory2DLoaded: false,
    currentMode: null,
    subMode: null,
  };
}

// ============================================================================
// Setup 函數: 階段 1 - 首頁
// ============================================================================

/**
 * 設置首頁 - 最基本的 setup
 */
export async function setupHomepage(page: Page): Promise<void> {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(NAVIGATION_TIMEOUT);
}

// ============================================================================
// Setup 函數: 階段 2 - 賽事頁
// ============================================================================

/**
 * 設置賽事頁 - 點擊「進入」按鈕進入賽事詳情
 */
export async function setupRaceEntry(page: Page): Promise<void> {
  await setupHomepage(page);
  // 支援簡繁體：进入/進入
  await page.getByRole('button', { name: /进入|進入/ }).first().click();
  await page.waitForTimeout(NAVIGATION_TIMEOUT);
}

// ============================================================================
// Setup 函數: 階段 3 - 2D 軌跡視圖
// ============================================================================

/**
 * 設置 2D 軌跡視圖 - 使用與 TC-02-001 相同的方法
 *
 * 關鍵：使用 reload2DTrajectory 處理 Known Issue #1
 */
export async function setupTrajectoryView(page: Page): Promise<TestState> {
  const state = createInitialState();

  // 使用與 TC-02-001 相同的流程
  await enterRace(page, 0);

  // 使用 reload2DTrajectory 處理 Known Issue #1
  // 此方法會：選擇鴿子 → 設定2D偏好 → 查看軌跡 → 驗證載入
  const loadSuccess = await reload2DTrajectory(page, 0, 3);

  state.pigeonIndex = 0;
  state.trajectory2DLoaded = loadSuccess;
  state.currentMode = '2D';
  state.subMode = 'static';

  return state;
}

/**
 * 設置 2D 靜態模式並確保標記點已載入
 */
export async function setup2DStaticWithMarkers(page: Page): Promise<TestState> {
  const state = await setupTrajectoryView(page);

  // 等待軌跡標記點
  const markersWait = await WAIT_STRATEGIES.trajectoryMarkersReady(page, 3);
  if (markersWait.success) {
    state.subMode = 'static';
  }

  return state;
}

// ============================================================================
// Setup 函數: 階段 4 - 2D 動態模式
// ============================================================================

/**
 * 設置 2D 動態模式 - 使用與 TC-03-001 相同的方法
 */
export async function setup2DDynamicMode(page: Page): Promise<TestState> {
  const state = await setupTrajectoryView(page);

  // 確保在 2D 模式（setupTrajectoryView 已處理）
  // 使用 Material Icon 選擇器切換到動態模式
  const dynamicBtn = page.getByRole('button').filter({ hasText: 'timeline' });
  if (await dynamicBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await dynamicBtn.click();
    await page.waitForTimeout(2000);
  }

  state.subMode = 'dynamic';
  return state;
}

// ============================================================================
// Setup 函數: 階段 5 - 3D 模式
// ============================================================================

/**
 * 設置 3D 模式 - 使用與 TC-04-001 相同的方法
 */
export async function setup3DMode(page: Page): Promise<TestState> {
  const state = await setupTrajectoryView(page);

  // 使用可靠的 3D 切換方法（與 TC-04-001 一致）
  await ensureModeByText(page, '3D');

  // 等待 Cesium 載入
  const wait = await WAIT_STRATEGIES.cesium3DReady(page);
  state.currentMode = wait.success ? '3D' : '2D';

  return state;
}

// ============================================================================
// Setup 函數: 階段 6 - 鴿舍列表
// ============================================================================

/**
 * 設置鴿舍列表頁面
 */
export async function setupLoftList(page: Page): Promise<void> {
  await setupRaceEntry(page);
  // 鴿舍列表在賽事頁面可見
}

// ============================================================================
// 工具函數
// ============================================================================

/**
 * 等待並點擊元素
 */
export async function waitAndClick(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<boolean> {
  const el = page.locator(selector).first();
  try {
    await el.waitFor({ state: 'visible', timeout });
    await el.click();
    return true;
  } catch {
    return false;
  }
}

/**
 * 安全地獲取元素文字
 */
export async function safeGetText(page: Page, selector: string): Promise<string> {
  try {
    return await page.locator(selector).first().innerText();
  } catch {
    return '';
  }
}
