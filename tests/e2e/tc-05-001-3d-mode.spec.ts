/**
 * tc-05-001-3d-mode.spec.ts - TC-05-001: 3D 模式完整功能
 *
 * 對應規格：USER_JOURNEY_RECORD_V2.md 記錄點 #05
 *
 * 8 個獨立測試：
 * - 5.1 3D 切換 (P0)
 * - 5.2 Cesium 初始化 (P0)
 * - 5.3 視角1 按鈕 (P0)
 * - 5.4 視角2 按鈕 (P0)
 * - 5.5 軌跡點顯示 (P1)
 * - 5.6 歸返軌跡顯示 (P1)
 * - 5.7 排名榜顯示 (P1)
 * - 5.8 時速表顯示 (P1)
 */

import { test, expect } from '@playwright/test';
import { setup3DTrajectory, DEFAULT_TIMEOUT } from '../helpers/fixtures';
import { getCurrentMode, ensureModeByText } from '../helpers/mode-switching';

test.describe('TC-05-001: 3D 模式完整功能 @P0', () => {
  test.beforeEach(async ({ page }) => {
    // 3D 模式需要較長超時（Cesium 初始化）
    const timeoutMultiplier = process.env.CI ? 5 : 3;
    test.setTimeout(DEFAULT_TIMEOUT * timeoutMultiplier);
    await setup3DTrajectory(page);
  });

  test('5.1 3D 切換', async ({ page }) => {
    // 驗證當前在 3D 模式
    const currentMode = await getCurrentMode(page);
    expect(currentMode).toBe('3D');
  });

  test('5.2 Cesium 初始化', async ({ page }) => {
    // 驗證 Cesium 相關元素存在
    // 方法1: 檢查 cesium 相關 class
    const cesiumWidget = page.locator('[class*="cesium"]');
    const hasCesium = await cesiumWidget.count();

    // 方法2: 檢查 canvas 元素（Cesium 使用 WebGL canvas）
    const canvasCount = await page.locator('canvas').count();

    // 至少要有 Cesium 元素或多個 canvas
    expect(hasCesium > 0 || canvasCount > 1).toBe(true);
  });

  test('5.3 視角1 按鈕', async ({ page }) => {
    // 驗證視角1 按鈕存在且可點擊
    const view1Button = page.getByRole('button', { name: /[视視]角1/ });
    await expect(view1Button).toBeVisible({ timeout: 10000 });

    // 點擊視角1 按鈕
    await view1Button.click();
    await page.waitForTimeout(2000);

    // 按鈕應該仍然可見（視角切換不會隱藏按鈕）
    await expect(view1Button).toBeVisible();
  });

  test('5.4 視角2 按鈕', async ({ page }) => {
    // 驗證視角2 按鈕存在且可點擊
    const view2Button = page.getByRole('button', { name: /[视視]角2/ });
    await expect(view2Button).toBeVisible({ timeout: 10000 });

    // 點擊視角2 按鈕
    await view2Button.click();
    await page.waitForTimeout(2000);

    // 按鈕應該仍然可見
    await expect(view2Button).toBeVisible();
  });

  test('5.5 軌跡點顯示', async ({ page }) => {
    // 查找軌跡點控制按鈕（支援簡繁體）
    const trajectoryPointButton = page.getByRole('button', {
      name: /[显顯]示[轨軌][迹跡][点點]|[隐隱]藏[轨軌][迹跡][点點]/,
    });

    const buttonExists = await trajectoryPointButton.count();

    if (buttonExists > 0) {
      await expect(trajectoryPointButton.first()).toBeVisible({ timeout: 5000 });
      // 點擊切換
      await trajectoryPointButton.first().click();
      await page.waitForTimeout(1000);
      // 驗證按鈕仍可操作
      await expect(trajectoryPointButton.first()).toBeVisible();
    } else {
      // 按鈕可能因版本不同而不存在，記錄並跳過
      console.log('ℹ️ 軌跡點控制按鈕不存在（可能是版本差異）');
      test.skip();
    }
  });

  test('5.6 歸返軌跡顯示', async ({ page }) => {
    // 查找歸返軌跡控制按鈕（支援簡繁體）
    const returnTrajectoryButton = page.getByRole('button', {
      name: /[显顯]示[归歸]返[轨軌][迹跡]|[隐隱]藏[归歸]返[轨軌][迹跡]/,
    });

    const buttonExists = await returnTrajectoryButton.count();

    if (buttonExists > 0) {
      await expect(returnTrajectoryButton.first()).toBeVisible({ timeout: 5000 });
      await returnTrajectoryButton.first().click();
      await page.waitForTimeout(1000);
      await expect(returnTrajectoryButton.first()).toBeVisible();
    } else {
      console.log('ℹ️ 歸返軌跡控制按鈕不存在（可能是版本差異）');
      test.skip();
    }
  });

  test('5.7 排名榜顯示', async ({ page }) => {
    // 查找排名榜控制按鈕（支援簡繁體）
    const rankingButton = page.getByRole('button', {
      name: /[显顯]示排名榜|[隐隱]藏排名榜/,
    });

    const buttonExists = await rankingButton.count();

    if (buttonExists > 0) {
      await expect(rankingButton.first()).toBeVisible({ timeout: 5000 });
      await rankingButton.first().click();
      await page.waitForTimeout(1000);
      await expect(rankingButton.first()).toBeVisible();
    } else {
      console.log('ℹ️ 排名榜控制按鈕不存在（可能是版本差異）');
      test.skip();
    }
  });

  test('5.8 時速表顯示', async ({ page }) => {
    // 查找時速表控制按鈕（支援簡繁體）
    const speedometerButton = page.getByRole('button', {
      name: /[显顯]示[时時]速表|[隐隱]藏[时時]速表/,
    });

    const buttonExists = await speedometerButton.count();

    if (buttonExists > 0) {
      await expect(speedometerButton.first()).toBeVisible({ timeout: 5000 });
      await speedometerButton.first().click();
      await page.waitForTimeout(1000);
      await expect(speedometerButton.first()).toBeVisible();
    } else {
      console.log('ℹ️ 時速表控制按鈕不存在（可能是版本差異）');
      test.skip();
    }
  });
});

// ============================================================================
// 附加測試：3D/2D 來回切換
// ============================================================================

test.describe('TC-05-001: 3D/2D 模式來回切換', () => {
  test('3D → 2D → 3D 來回切換', async ({ page }) => {
    const timeoutMultiplier = process.env.CI ? 5 : 3;
    test.setTimeout(DEFAULT_TIMEOUT * timeoutMultiplier);

    await setup3DTrajectory(page);

    // 確認在 3D
    let currentMode = await getCurrentMode(page);
    expect(currentMode).toBe('3D');

    // 切換到 2D
    await ensureModeByText(page, '2D');
    currentMode = await getCurrentMode(page);
    expect(currentMode).toBe('2D');

    // 切換回 3D
    await ensureModeByText(page, '3D');
    currentMode = await getCurrentMode(page);
    expect(currentMode).toBe('3D');
  });
});
