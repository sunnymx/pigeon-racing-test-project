/**
 * fixtures.ts - 共用測試設定和 setup 函數
 *
 * 為 34 個獨立測試提供統一的頁面導航和狀態設定
 */

import { Page } from '@playwright/test';
import { WAIT_STRATEGIES } from '../../helpers/adaptive-wait';
import { reload2DTrajectory } from '../../helpers/trajectory-reload';

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
 * 設置 2D 軌跡視圖 - 勾選鴿子並查看軌跡
 */
export async function setupTrajectoryView(page: Page): Promise<TestState> {
  const state = createInitialState();

  await setupRaceEntry(page);

  // 勾選第一隻鴿子
  const rows = page.locator('table tbody tr, table tr');
  const checkbox = rows.nth(1).getByRole('checkbox');
  if (await checkbox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await checkbox.click();
    await page.waitForTimeout(1000);
  }
  state.pigeonIndex = 0;

  // 點擊「查看軌跡」按鈕
  const viewBtn = page.getByRole('button', { name: /查看[轨軌][迹跡]/ });
  if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await viewBtn.click();
  }
  await page.waitForTimeout(NAVIGATION_TIMEOUT);

  // 等待 2D 地圖載入
  let wait = await WAIT_STRATEGIES.amap2DReady(page);

  // Known Issue #1 恢復機制
  if (!wait.success) {
    console.log('⚠️ 2D 載入失敗，嘗試 reload2DTrajectory 恢復...');
    const reloaded = await reload2DTrajectory(page, state.pigeonIndex, 2);
    if (reloaded) {
      wait = await WAIT_STRATEGIES.amap2DReady(page);
    }
  }

  state.trajectory2DLoaded = wait.success;
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
 * 設置 2D 動態模式
 */
export async function setup2DDynamicMode(page: Page): Promise<TestState> {
  const state = await setupTrajectoryView(page);

  // 切換到動態模式
  const dynamicBtn = page.locator('button:has-text("timeline"), button:has-text("動態")').first();
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
 * 設置 3D 模式
 */
export async function setup3DMode(page: Page): Promise<TestState> {
  const state = await setupTrajectoryView(page);

  // 切換到 3D 模式
  const btn3D = page.getByRole('button', { name: /3D模式/ });
  if (await btn3D.isVisible({ timeout: 5000 }).catch(() => false)) {
    await btn3D.click();
  }

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
