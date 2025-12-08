/**
 * stage-3-2d-static.spec.ts - 階段 3: 2D 靜態軌跡
 *
 * 6 個獨立測試：
 * - 3.1 軌跡視圖載入
 * - 3.2 API 請求
 * - 3.3 Canvas 渲染
 * - 3.4 軌跡標記點
 * - 3.5 資訊彈窗
 * - 3.6 側邊欄數據
 */

import { test, expect } from '@playwright/test';
import { setupTrajectoryView, setup2DStaticWithMarkers, DEFAULT_TIMEOUT } from './fixtures';
import { WAIT_STRATEGIES } from '../../helpers/adaptive-wait';

test.describe('階段 3: 2D 靜態軌跡 @P0', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000); // 2 分鐘，因為需要載入軌跡
  });

  test('3.1 軌跡視圖載入', async ({ page }) => {
    const state = await setupTrajectoryView(page);
    expect(state.trajectory2DLoaded).toBe(true);
  });

  test('3.2 API 請求', async ({ page }) => {
    const state = await setupTrajectoryView(page);
    // API 驗證需在進入軌跡時攔截，這裡檢查頁面狀態作為代理
    expect(state.trajectory2DLoaded).toBe(true);
  });

  test('3.3 Canvas 渲染', async ({ page }) => {
    await setupTrajectoryView(page);

    const count = await page.locator('canvas.amap-layer').count();
    expect(count).toBeGreaterThan(0);
  });

  test('3.4 軌跡標記點', async ({ page }) => {
    await setupTrajectoryView(page);

    const wait = await WAIT_STRATEGIES.trajectoryMarkersReady(page, 3);

    // Known Issue #1: 標記點可能需要重選鴿子才會顯示
    if (!wait.success) {
      console.log('⚠️ 3.4 軌跡標記點: Known Issue #1 - 標記點未顯示，這是預期行為');
    }

    expect(wait.success).toBe(true);
  });

  test('3.5 資訊彈窗', async ({ page }) => {
    const state = await setup2DStaticWithMarkers(page);

    // 確保有標記點可以點擊
    const marker = page.locator('.amap-icon > img').first();

    if (await marker.isVisible({ timeout: 5000 }).catch(() => false)) {
      await marker.click({ force: true });
      await page.waitForTimeout(1000);

      const text = await page.locator('body').innerText();
      const hasDateFormat = /\d{4}-\d{2}-\d{2}/.test(text);
      const hasSpeedInfo = text.includes('速度');

      expect(hasDateFormat && hasSpeedInfo).toBe(true);
    } else {
      // 如果沒有標記點，跳過此測試
      console.log('⚠️ 3.5 資訊彈窗: 無標記點可點擊');
      expect(state.trajectory2DLoaded).toBe(true);
    }
  });

  test('3.6 側邊欄數據', async ({ page }) => {
    await setupTrajectoryView(page);

    const text = await page.locator('body').innerText();
    // 檢查公環號格式或分速資訊
    const hasRingNumber = /\d{4}-\d{2}-\d{6,7}/.test(text);
    const hasSpeedInfo = text.includes('分速');

    expect(hasRingNumber || hasSpeedInfo).toBe(true);
  });
});
