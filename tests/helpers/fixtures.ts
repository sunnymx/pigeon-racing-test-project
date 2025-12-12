/**
 * fixtures.ts - 共用測試設定和 setup 函數
 *
 * 等待策略：快速重試 (5 秒內沒成功就立即重試)
 * - 不浪費時間長時間等待
 * - 增加重試次數，每次等待時間短
 */

import { Page } from '@playwright/test';
import { switchSubMode2D, switchTo3DReliably } from './mode-switching';
import { openTrajectoryDetails } from './trajectory-details';

// ============================================================================
// 常量定義 - 統一等待時間策略
// ============================================================================

export const BASE_URL = 'https://hungdev.skyracing.com.cn/';
export const DEFAULT_TIMEOUT = 60000;

// 快速等待策略
const QUICK_WAIT = 500;       // 基本操作等待
const IS_CI = !!process.env.CI;
const QUICK_CHECK = IS_CI ? 45000 : 5000;  // CI 給 45 秒等待（美國→中國延遲較高）
const POLL_INTERVAL = 300;    // 輪詢間隔

// ============================================================================
// Setup 函數
// ============================================================================

/**
 * 設置首頁 - 最基本的 setup
 */
export async function setupHomepage(page: Page): Promise<void> {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  // 等待賽事卡片出現（最多 10 秒）
  await page.waitForSelector('mat-card', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(QUICK_WAIT);
}

/**
 * 設置賽事頁 - 點擊「進入」按鈕進入賽事詳情
 */
export async function setupRaceEntry(page: Page): Promise<void> {
  await setupHomepage(page);
  await page.getByRole('button', { name: /进入|進入/ }).first().click();
  await page.waitForTimeout(QUICK_WAIT);
}

/**
 * 設置 2D 軌跡頁 - 快速重試策略
 *
 * 策略：5 秒內沒出現軌跡就立即重新選取，不浪費時間等待
 */
export async function setup2DTrajectory(page: Page): Promise<void> {
  const maxRetries = IS_CI ? 2 : 5; // CI 給更長等待時間，減少重試次數

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 第一次進入賽事頁面
      if (attempt === 0) {
        await setupRaceEntry(page);
      } else {
        // 重試：返回鴿子列表
        await returnToPigeonList(page);
      }

      // 選擇鴿子並設置 2D 偏好
      await selectPigeonWith2DPreference(page);

      // 點擊查看軌跡
      await page.getByText(/查看[轨軌][迹跡]/).click();

      // 快速檢查 - 5 秒內確認成功
      const success = await quickCheckTrajectoryLoaded(page);
      if (success) {
        await page.waitForTimeout(QUICK_WAIT);
        return; // 成功！
      }
      // 5 秒沒成功，立即重試
    } catch {
      // 忽略錯誤，繼續重試
    }
  }

  throw new Error(`2D 軌跡加載失敗，已重試 ${maxRetries} 次`);
}

// ============================================================================
// 輔助函數
// ============================================================================

/**
 * 返回鴿子列表
 */
async function returnToPigeonList(page: Page): Promise<void> {
  // 關閉可能打開的 drawer
  const drawerBackdrop = page.locator('.mat-drawer-backdrop');
  if (await drawerBackdrop.isVisible().catch(() => false)) {
    await drawerBackdrop.click();
    await page.waitForTimeout(QUICK_WAIT);
  }

  // 點擊返回按鈕
  const backButton = page.getByRole('button').filter({ hasText: 'menu' }).first();
  if (await backButton.isVisible().catch(() => false)) {
    await backButton.click({ force: true });
    await page.waitForTimeout(QUICK_WAIT);
  }

  // 等待表格出現
  await page.waitForSelector('table tbody tr', { timeout: 10000 });
}

/**
 * 選擇鴿子並確保 2D 偏好
 */
async function selectPigeonWith2DPreference(page: Page): Promise<void> {
  // 取消之前的選擇
  const checkedBox = page.locator('input[type="checkbox"]:checked').first();
  if (await checkedBox.isVisible().catch(() => false)) {
    await checkedBox.click();
    await page.waitForTimeout(QUICK_WAIT);
  }

  // 選擇第一隻鴿子
  const checkbox = page.locator('table').getByRole('checkbox').first();
  await checkbox.click();
  await page.waitForTimeout(QUICK_WAIT);

  // 確保 2D 偏好選中
  const toggle3D = page.getByRole('button', { name: '3D', exact: true });
  if (await toggle3D.isVisible().catch(() => false)) {
    const is3DSelected = await toggle3D.evaluate((el) =>
      el.classList.contains('mat-button-toggle-checked')
    ).catch(() => false);
    if (is3DSelected) {
      const toggle2D = page.getByRole('button', { name: '2D', exact: true });
      await toggle2D.click({ force: true });
      await page.waitForTimeout(QUICK_WAIT);
    }
  }
}

/**
 * 快速檢查軌跡是否加載成功（5秒內）
 */
async function quickCheckTrajectoryLoaded(page: Page): Promise<boolean> {
  let elapsed = 0;

  while (elapsed < QUICK_CHECK) {
    const markerCount = await page.locator('.amap-icon > img').count();
    const mapVisible = await page.locator('.amap-container').isVisible().catch(() => false);

    // 成功條件：有標記點且地圖可見
    if (markerCount >= 1 && mapVisible) {
      return true;
    }

    await page.waitForTimeout(POLL_INTERVAL);
    elapsed += POLL_INTERVAL;
  }

  return false;
}

// ============================================================================
// 2D 動態模式 Setup
// ============================================================================

/**
 * 設置 2D 動態模式
 *
 * 前置條件：需要先完成 2D 軌跡加載
 * 策略：setup2DTrajectory → switchSubMode2D('dynamic')
 */
export async function setup2DDynamicMode(page: Page): Promise<void> {
  await setup2DTrajectory(page);
  await switchSubMode2D(page, 'dynamic');
}

// ============================================================================
// 3D 模式 Setup
// ============================================================================

/**
 * 設置 3D 軌跡模式
 *
 * 策略：先進入 2D 軌跡 → 切換到 3D 模式
 * 原因：先確保軌跡數據載入成功，再切換到 3D 渲染
 *
 * @param page - Playwright Page 物件
 * @throws 如果 3D 模式切換失敗
 */
export async function setup3DTrajectory(page: Page): Promise<void> {
  // 先進入 2D 軌跡（確保數據載入）
  await setup2DTrajectory(page);

  // 切換到 3D 模式
  await switchTo3DReliably(page);

  // CI 環境額外等待（Cesium 初始化較慢）
  if (IS_CI) {
    await page.waitForTimeout(3000);
  }
}

// ============================================================================
// 軌跡詳情 Setup
// ============================================================================

/**
 * 設置軌跡詳情面板
 *
 * 前置條件：需要先完成 2D 軌跡加載
 * 策略：setup2DTrajectory → openTrajectoryDetails
 *
 * @param page - Playwright Page 物件
 * @throws 如果軌跡詳情面板打開失敗
 */
export async function setupTrajectoryDetails(page: Page): Promise<void> {
  // 先進入 2D 軌跡（確保數據載入）
  await setup2DTrajectory(page);

  // 打開軌跡詳情面板
  await openTrajectoryDetails(page);

  // 等待面板內容渲染
  await page.waitForTimeout(QUICK_WAIT);
}

// 導出常量供測試使用
export const NAVIGATION_TIMEOUT = QUICK_WAIT;
