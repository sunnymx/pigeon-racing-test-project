/**
 * stage-5-3d-mode.spec.ts - 階段 5: 3D 模式
 *
 * 6 個獨立測試：
 * - 5.1 3D 切換
 * - 5.2 Cesium 初始化
 * - 5.3 視角1 按鈕
 * - 5.4 視角2 按鈕
 * - 5.5 3D 播放控制
 * - 5.6 2D 切回
 */

import { test, expect } from '@playwright/test';
import { setup3DMode, setupTrajectoryView, DEFAULT_TIMEOUT } from './fixtures';
import { WAIT_STRATEGIES } from '../../helpers/adaptive-wait';

test.describe('階段 5: 3D 模式 @P0', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  test('5.1 3D 切換', async ({ page }) => {
    await setupTrajectoryView(page);

    await page.getByRole('button', { name: /3D模式/ }).click();
    const wait = await WAIT_STRATEGIES.cesium3DReady(page);

    expect(wait.success).toBe(true);
  });

  test('5.2 Cesium 初始化', async ({ page }) => {
    await setup3DMode(page);

    const viewer = await page.locator('.cesium-viewer').isVisible().catch(() => false);
    const widget = await page.locator('.cesium-widget').isVisible().catch(() => false);

    expect(viewer || widget).toBe(true);
  });

  test('5.3 視角1 按鈕', async ({ page }) => {
    await setup3DMode(page);

    // 支援簡繁體：视角1/視角1
    const btn = page.getByRole('button', { name: /[视視]角1/ });
    await expect(btn).toBeVisible();
  });

  test('5.4 視角2 按鈕', async ({ page }) => {
    await setup3DMode(page);

    // 支援簡繁體：视角2/視角2
    const btn = page.getByRole('button', { name: /[视視]角2/ });
    await expect(btn).toBeVisible();
  });

  test('5.5 3D 播放控制', async ({ page }) => {
    await setup3DMode(page);

    // 3D 模式應有 play_arrow + fast_forward + fast_rewind
    const play = page.getByRole('button').filter({ hasText: 'play_arrow' }).first();
    const ff = page.getByRole('button').filter({ hasText: 'fast_forward' }).first();

    const hasPlay = await play.isVisible().catch(() => false);
    const hasFF = await ff.isVisible().catch(() => false);

    expect(hasPlay || hasFF).toBe(true);
  });

  test('5.6 2D 切回', async ({ page }) => {
    await setup3DMode(page);

    await page.getByRole('button', { name: /2D模式/ }).click();
    await page.waitForTimeout(2000);

    const amap = await page.locator('.amap-container').isVisible().catch(() => false);
    expect(amap).toBe(true);
  });
});
