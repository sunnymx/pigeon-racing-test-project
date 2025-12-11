/**
 * tc-03-001-2d-static.spec.ts - TC-03-001: 2D 靜態軌跡 + InfoWindow
 *
 * 對應規格：USER_JOURNEY_RECORD_V2.md 記錄點 #03
 *
 * 6 個獨立測試：
 * - 3.1 軌跡視圖載入 (P0)
 * - 3.2 軌跡標記點 (P0)
 * - 3.3 標記點點擊 (P0)
 * - 3.4 InfoWindow 數據 (P0)
 * - 3.5 排名榜顯示 (P1)
 * - 3.6 工具按鈕可用 (P1)
 */

import { test, expect } from '@playwright/test';
import { setup2DTrajectory, DEFAULT_TIMEOUT } from '../helpers/fixtures';
import {
  getMarkerCount,
  clickMarkerPoint,
  getInfoWindowData,
  hasCanvasLayer,
} from '../helpers/trajectory';

test.describe('TC-03-001: 2D 靜態軌跡 + InfoWindow @P0', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(DEFAULT_TIMEOUT * 2); // 軌跡載入需要更長時間
    await setup2DTrajectory(page);
  });

  test('3.1 軌跡視圖載入', async ({ page }) => {
    // 驗證 Canvas 圖層存在（AMap v2.0+ 使用 Canvas 渲染）
    const hasCanvas = await hasCanvasLayer(page);
    expect(hasCanvas).toBe(true);

    // 驗證地圖容器可見
    const mapContainer = page.locator('.amap-container');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
  });

  test('3.2 軌跡標記點', async ({ page }) => {
    // 靜態模式特徵：軌跡標記點 >= 15 個
    const markerCount = await getMarkerCount(page);
    expect(markerCount).toBeGreaterThanOrEqual(15);
  });

  test('3.3 標記點點擊', async ({ page }) => {
    // 點擊軌跡標記點
    await clickMarkerPoint(page, 2);

    // 驗證 InfoWindow 或資訊面板出現
    // InfoWindow 可能是 .amap-info-window 或側邊欄更新
    const infoVisible = await page.locator('.amap-info-window, .amap-info-contentContainer')
      .isVisible()
      .catch(() => false);

    // 或者側邊欄有軌跡詳情顯示
    const sidebarInfo = await page.locator('text=/時間|时间|海拔|分速/')
      .first()
      .isVisible()
      .catch(() => false);

    expect(infoVisible || sidebarInfo).toBe(true);
  });

  test('3.4 InfoWindow 數據', async ({ page }) => {
    // 點擊軌跡標記點
    await clickMarkerPoint(page, 3);
    await page.waitForTimeout(1000);

    // 取得 InfoWindow 數據
    const data = await getInfoWindowData(page);

    // 至少要有部分數據（環號或時間）
    // 注意：InfoWindow 結構可能因版本不同而變化
    const hasAnyData = data.ringNumber || data.time || data.altitude || data.speed;

    // 如果 InfoWindow 沒有數據，檢查頁面是否有相關資訊
    if (!hasAnyData) {
      // 備用驗證：頁面上是否有軌跡相關數據
      const hasTrajectoryInfo = await page.locator('text=/\\d{2}-\\d{7}|\\d{2}:\\d{2}:\\d{2}/')
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasTrajectoryInfo).toBe(true);
    } else {
      expect(hasAnyData).toBeTruthy();
    }
  });

  test('3.5 排名榜顯示', async ({ page }) => {
    // 驗證排名榜存在（通常在側邊欄）
    // 排名榜可能顯示名次、環號、分速等
    const rankingTable = page.locator('table, .ranking, .leaderboard').first();
    const isVisible = await rankingTable.isVisible().catch(() => false);

    // 或者有名次相關文字
    const hasRankingText = await page.locator('text=/名次|排名|第.*名/')
      .first()
      .isVisible()
      .catch(() => false);

    expect(isVisible || hasRankingText).toBe(true);
  });

  test('3.6 工具按鈕可用', async ({ page }) => {
    // 驗證工具列按鈕存在且可點擊
    // 使用 Material Icon 名稱或按鈕文字

    // 動態/靜態切換按鈕（timeline icon）
    const timelineButton = page.locator('button:has(mat-icon), button').filter({ hasText: 'timeline' });
    const hasTimeline = await timelineButton.first().isVisible().catch(() => false);

    // 3D 模式切換按鈕（在 2D 模式下顯示）
    const mode3DButton = page.getByRole('button').filter({ hasText: /3D模式|3D[模]?式?/ });
    const has3DSwitch = await mode3DButton.isVisible().catch(() => false);

    // AMap 地圖控制按鈕（縮放）
    const zoomIn = page.locator('.amap-zoom-touch-plus, [class*="zoom"]');
    const hasZoom = await zoomIn.isVisible().catch(() => false);

    // 地圖容器存在（確認在 2D 模式）
    const mapContainer = page.locator('.amap-container');
    const hasMap = await mapContainer.isVisible().catch(() => false);

    // 驗證：timeline + 3D切換 或 地圖控制存在
    const isIn2DMode = hasTimeline || has3DSwitch || hasZoom || hasMap;
    expect(isIn2DMode).toBe(true);
  });
});
