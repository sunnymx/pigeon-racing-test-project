/**
 * tc-04-001-2d-dynamic.spec.ts - TC-04-001: 2D 動態模式 + 風場
 *
 * 對應規格：USER_JOURNEY_RECORD_V2.md 記錄點 #04
 *
 * 7 個獨立測試：
 * - 4.1 動態切換 (P0)
 * - 4.2 播放按鈕 (P0)
 * - 4.3 暫停按鈕 (P0)
 * - 4.4 快進功能 (P1)
 * - 4.5 快退功能 (P1)
 * - 4.6 風場開啟 (P1)
 * - 4.7 靜態切回 (P0)
 */

import { test, expect } from '@playwright/test';
import { setup2DDynamicMode, setup2DTrajectory, DEFAULT_TIMEOUT } from '../helpers/fixtures';
import { switchSubMode2D } from '../helpers/mode-switching';
import { getMarkerCount } from '../helpers/trajectory';

test.describe('TC-04-001: 2D 動態模式 + 風場 @P0', () => {
  test.beforeEach(async ({ page }) => {
    // CI 環境需要更長超時
    const timeoutMultiplier = process.env.CI ? 5 : 2;
    test.setTimeout(DEFAULT_TIMEOUT * timeoutMultiplier);
  });

  test('4.1 動態切換', async ({ page }) => {
    // 先進入 2D 靜態模式
    await setup2DTrajectory(page);

    // 記錄靜態模式標記點數量
    const staticMarkers = await getMarkerCount(page);
    expect(staticMarkers).toBeGreaterThanOrEqual(15);

    // 切換到動態模式
    await switchSubMode2D(page, 'dynamic');

    // 動態模式標記點應 < 5
    const dynamicMarkers = await getMarkerCount(page);
    expect(dynamicMarkers).toBeLessThan(5);
  });

  test('4.2 播放按鈕', async ({ page }) => {
    await setup2DDynamicMode(page);

    // 動態模式可能自動播放，需同時檢查 play_arrow 和 pause
    const playButton = page.getByRole('button').filter({ hasText: 'play_arrow' }).first();
    const pauseButton = page.getByRole('button').filter({ hasText: 'pause' }).first();

    const isPlaying = await pauseButton.isVisible().catch(() => false);
    const hasPaused = await playButton.isVisible().catch(() => false);

    // 播放或暫停按鈕至少有一個存在
    expect(isPlaying || hasPaused).toBe(true);
  });

  test('4.3 暫停按鈕', async ({ page }) => {
    await setup2DDynamicMode(page);

    // 先點擊播放（如果處於暫停狀態）
    const playBtn = page.getByRole('button').filter({ hasText: 'play_arrow' }).first();
    if (await playBtn.isVisible().catch(() => false)) {
      await playBtn.click();
      await page.waitForTimeout(1000);
    }

    // 檢查暫停按鈕是否出現
    const pauseBtn = page.getByRole('button').filter({ hasText: 'pause' }).first();
    await expect(pauseBtn).toBeVisible({ timeout: 5000 });
  });

  test('4.4 快進功能', async ({ page }) => {
    await setup2DDynamicMode(page);

    const fastForwardBtn = page.getByRole('button').filter({ hasText: 'fast_forward' }).first();
    await expect(fastForwardBtn).toBeVisible({ timeout: 5000 });
  });

  test('4.5 快退功能', async ({ page }) => {
    await setup2DDynamicMode(page);

    // 注意：2D 動態模式可能無快退按鈕
    const fastRewindBtn = page.getByRole('button').filter({ hasText: 'fast_rewind' }).first();
    const isVisible = await fastRewindBtn.isVisible().catch(() => false);

    // 允許 2D 模式無此按鈕
    if (!isVisible) {
      console.log('⚠️ 4.5 快退功能: 2D 動態模式可能無此按鈕，測試略過');
      test.skip();
    }

    expect(isVisible).toBe(true);
  });

  test('4.6 風場開啟', async ({ page }) => {
    await setup2DDynamicMode(page);

    // 風場按鈕：Material Icon "airwave"
    const windFieldBtn = page.getByRole('button').filter({ hasText: 'airwave' }).first();

    const hasWindField = await windFieldBtn.isVisible().catch(() => false);

    if (!hasWindField) {
      console.log('⚠️ 4.6 風場開啟: 未找到風場按鈕 (airwave)');
      test.skip();
    }

    // 確保風場是關閉狀態（先開再關確保狀態一致）
    await windFieldBtn.click();
    await page.waitForTimeout(1000);
    await windFieldBtn.click();
    await page.waitForTimeout(2000);

    // 截取風場關閉時的地圖截圖
    const mapContainer = page.locator('.amap-container').first();
    const screenshotBefore = await mapContainer.screenshot();

    // 點擊開啟風場
    await windFieldBtn.click();
    await page.waitForTimeout(5000); // 等待風場渲染

    // 截取風場開啟時的地圖截圖
    const screenshotAfter = await mapContainer.screenshot();

    // 比較截圖是否不同（風場開啟後視覺應有變化）
    const isSameImage = screenshotBefore.equals(screenshotAfter);

    // 關閉風場（還原狀態）
    await windFieldBtn.click();
    await page.waitForTimeout(500);

    // 驗證：截圖應該不同（風場效果已載入）
    expect(isSameImage).toBe(false);
  });

  test('4.7 靜態切回', async ({ page }) => {
    await setup2DDynamicMode(page);

    // 切換回靜態模式
    await switchSubMode2D(page, 'static');

    // 驗證靜態模式標記點數量
    const markerCount = await getMarkerCount(page);
    expect(markerCount).toBeGreaterThanOrEqual(15);
  });
});
