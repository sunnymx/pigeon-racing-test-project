/**
 * multi-select.ts - 多選鴿子相關 helper 函數
 *
 * 支援記錄點 #07 測試：多選鴿子顯示
 * 處理已知問題：2D 偏好失效（多選可能進入 3D）
 */

import { Page } from '@playwright/test';

// ============================================================================
// 常量定義
// ============================================================================

const QUICK_WAIT = 500;
const IS_CI = !!process.env.CI;
const TRAJECTORY_LOAD_TIMEOUT = IS_CI ? 60000 : 30000;
const POLL_INTERVAL = 500;

// ============================================================================
// 多選操作
// ============================================================================

/**
 * 選擇多隻鴿子
 *
 * @param page - Playwright Page 物件
 * @param count - 要選擇的鴿子數量 (預設 5)
 * @returns 實際選擇的數量
 */
export async function selectMultiplePigeons(
  page: Page,
  count: number = 5
): Promise<number> {
  // 取消之前的所有選擇
  const checkedBoxes = page.locator('input[type="checkbox"]:checked');
  const checkedCount = await checkedBoxes.count();
  for (let i = 0; i < checkedCount; i++) {
    await checkedBoxes.first().click();
    await page.waitForTimeout(200);
  }

  // 選擇指定數量的鴿子
  const checkboxes = page.locator('table').getByRole('checkbox');
  const availableCount = await checkboxes.count();
  const toSelect = Math.min(count, availableCount);

  for (let i = 0; i < toSelect; i++) {
    await checkboxes.nth(i).click();
    await page.waitForTimeout(200);
  }

  return toSelect;
}

/**
 * 取得「勾選清單 N」的數字
 */
export async function getSelectionCount(page: Page): Promise<number> {
  const button = page.locator('button').filter({ hasText: /勾[选選]清[单單]/ });

  if (!(await button.isVisible().catch(() => false))) {
    return 0;
  }

  const text = await button.textContent() || '';
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * 設置多選軌跡視圖 - 完整流程
 *
 * 流程：選擇多隻鴿子 → 設置 2D 偏好 → 查看軌跡 → 處理 3D 偏好失效問題
 *
 * @param page - Playwright Page 物件
 * @param count - 要選擇的鴿子數量 (預設 5)
 */
export async function setupMultiSelectTrajectory(
  page: Page,
  count: number = 5
): Promise<void> {
  // 選擇多隻鴿子
  const selected = await selectMultiplePigeons(page, count);
  if (selected === 0) {
    throw new Error('無法選擇鴿子');
  }

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

  // 點擊查看軌跡（等待按鈕啟用）
  const viewButton = page.getByRole('button', { name: /查看[轨軌][迹跡]/ });
  await viewButton.first().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500); // 等待按鈕狀態更新
  await viewButton.first().click();

  // 等待軌跡載入（多選需要更長時間）
  await waitForMultiTrajectoryLoaded(page);

  // 處理 2D 偏好失效問題：如果進入了 3D，切換到 2D
  const is3DMode = await page.getByRole('button', { name: /[视視]角1/ }).isVisible().catch(() => false);
  if (is3DMode) {
    const switch2D = page.getByRole('button', { name: '2D模式' });
    if (await switch2D.isVisible().catch(() => false)) {
      await switch2D.click();
      await page.waitForTimeout(2000);
    }
  }
}

/**
 * 等待多選軌跡載入完成
 *
 * 策略：等待「載入資料中」提示消失，表示軌跡數據已下載完成
 */
async function waitForMultiTrajectoryLoaded(page: Page): Promise<boolean> {
  // 先等待載入提示出現（確認已觸發下載）
  const loadingIndicator = page.locator('text=/載入|加载|Loading/i');
  await loadingIndicator.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

  // 等待載入提示消失（數據下載完成）
  await loadingIndicator.waitFor({ state: 'hidden', timeout: TRAJECTORY_LOAD_TIMEOUT }).catch(() => {});

  // 額外等待渲染完成
  await page.waitForTimeout(2000);

  // 驗證地圖或 3D 視圖已載入
  const mapVisible = await page.locator('.amap-container').isVisible().catch(() => false);
  const cesiumVisible = await page.locator('[class*="cesium"]').isVisible().catch(() => false);

  if (mapVisible || cesiumVisible) {
    return true;
  }

  throw new Error(`軌跡載入超時 (${TRAJECTORY_LOAD_TIMEOUT}ms)`);
}

// ============================================================================
// 多選軌跡驗證
// ============================================================================

/**
 * 取得排名榜行數
 *
 * 多選時排名榜應顯示所有選中的鴿子
 */
export async function getRankingBoardRows(page: Page): Promise<number> {
  // 排名榜通常在右側面板，包含 table 或 list
  const rankingRows = page.locator('.ranking-board tr, [class*="rank"] tr, table tr').filter({
    hasText: /\d{2}-\d{7}/ // 環號格式
  });

  return await rankingRows.count();
}

/**
 * 取得軌跡顏色列表（用於驗證顏色區分）
 *
 * 策略：從 SVG polyline 或 Canvas 分析顏色
 * 如果無法取得精確顏色，返回 null（測試將使用替代驗證）
 */
export async function getTrajectoryColors(page: Page): Promise<string[] | null> {
  try {
    // 嘗試從 SVG polyline 取得 stroke 顏色
    const polylines = page.locator('svg polyline, svg path');
    const count = await polylines.count();

    if (count > 0) {
      const colors: string[] = [];
      for (let i = 0; i < count; i++) {
        const stroke = await polylines.nth(i).getAttribute('stroke');
        if (stroke && !colors.includes(stroke)) {
          colors.push(stroke);
        }
      }
      if (colors.length > 1) {
        return colors;
      }
    }

    // 如果 SVG 不可用，返回 null（由測試使用替代驗證）
    return null;
  } catch {
    return null;
  }
}

/**
 * 驗證多軌跡標記點數量
 *
 * 多選時，標記點數量應該比單選時多
 */
export async function getMultiTrajectoryMarkerCount(page: Page): Promise<number> {
  return await page.locator('.amap-icon > img').count();
}

/**
 * 檢查軌跡詳情面板是否可切換鴿子
 *
 * 多選時，軌跡詳情面板應有切換鴿子的下拉選單或標籤
 */
export async function hasPigeonSwitcher(page: Page): Promise<boolean> {
  // 可能的切換元素：下拉選單、標籤頁、或環號選擇器
  const switcher = page.locator(
    'select, [role="combobox"], [role="tablist"], .pigeon-selector'
  ).filter({ hasText: /\d{2}-\d{7}/ });

  return await switcher.isVisible().catch(() => false);
}
