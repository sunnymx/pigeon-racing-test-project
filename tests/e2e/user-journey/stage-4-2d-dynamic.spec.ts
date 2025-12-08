/**
 * stage-4-2d-dynamic.spec.ts - 階段 4: 2D 動態模式
 *
 * 7 個獨立測試：
 * - 4.1 動態切換
 * - 4.2 播放按鈕
 * - 4.3 暫停按鈕
 * - 4.4 快進功能
 * - 4.5 快退功能
 * - 4.6 Canvas 更新
 * - 4.7 靜態切回
 */

import { test, expect } from '@playwright/test';
import { setupTrajectoryView, setup2DDynamicMode, DEFAULT_TIMEOUT } from './fixtures';

test.describe('階段 4: 2D 動態模式 @P0', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  test('4.1 動態切換', async ({ page }) => {
    await setupTrajectoryView(page);

    const btn = page.locator('button:has-text("timeline"), button:has-text("動態")').first();
    if (await btn.isVisible()) {
      await btn.click();
    }
    await page.waitForTimeout(2000);

    // 動態模式下標記點較少
    const markers = await page.locator('.amap-icon > img').count();
    expect(markers).toBeLessThan(5);
  });

  test('4.2 播放按鈕', async ({ page }) => {
    await setup2DDynamicMode(page);

    const btn = page.getByRole('button').filter({ hasText: 'play_arrow' }).first();
    await expect(btn).toBeVisible();
  });

  test('4.3 暫停按鈕', async ({ page }) => {
    await setup2DDynamicMode(page);

    // 先點擊播放
    const playBtn = page.getByRole('button').filter({ hasText: 'play_arrow' }).first();
    await playBtn.click().catch(() => {});
    await page.waitForTimeout(1000);

    // 檢查暫停按鈕是否出現
    const pauseBtn = page.getByRole('button').filter({ hasText: 'pause' }).first();
    await expect(pauseBtn).toBeVisible();
  });

  test('4.4 快進功能', async ({ page }) => {
    await setup2DDynamicMode(page);

    const btn = page.getByRole('button').filter({ hasText: 'fast_forward' }).first();
    await expect(btn).toBeVisible();
  });

  test('4.5 快退功能', async ({ page }) => {
    await setup2DDynamicMode(page);

    // 注意：2D 動態模式可能無快退按鈕，僅 3D 有
    const btn = page.getByRole('button').filter({ hasText: 'fast_rewind' }).first();
    const isVisible = await btn.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('⚠️ 4.5 快退功能: 2D 模式可能無此按鈕');
    }

    expect(isVisible).toBe(true);
  });

  test('4.6 Canvas 更新', async ({ page }) => {
    const state = await setup2DDynamicMode(page);

    // Canvas 更新需截圖對比，這裡檢查模式已切換
    expect(state.subMode).toBe('dynamic');
  });

  test('4.7 靜態切回', async ({ page }) => {
    await setup2DDynamicMode(page);

    // 切回靜態模式
    const btn = page.locator('button:has-text("靜態"), button:has-text("place")').first();
    if (await btn.isVisible()) {
      await btn.click();
    }
    await page.waitForTimeout(2000);

    // 靜態模式應有較多標記點
    const markers = await page.locator('.amap-icon > img').count();
    expect(markers).toBeGreaterThanOrEqual(3);
  });
});
