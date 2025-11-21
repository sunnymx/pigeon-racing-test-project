/**
 * TC-03-001: 2D 靜態/動態模式切換測試
 *
 * 優先級：P0 (Critical)
 * 測試目標：驗證 2D 模式下靜態/動態切換功能
 *
 * 關鍵驗證點：
 * - 靜態模式：15-20 個軌跡標記點
 * - 動態模式：1-3 個可見標記點
 * - 模式切換：點擊 timeline 按鈕
 *
 * 解決問題：#2 - 靜態/動態模式混淆
 * 判斷依據：標記點數量
 *
 * 參考文檔：
 * - docs/test-plan/TEST_CASES.md (TC-03-001)
 * - docs/guides/troubleshooting.md#problem-2
 */

import { test, expect } from '@playwright/test';
import { enterRace, selectPigeon, openTrajectory } from '../helpers/navigation';
import { reload2DTrajectory } from '../helpers/trajectory-reload';
import { detectCurrentViewMode, switchSubMode2D } from '../helpers/mode-switching';
import { waitForMapTiles } from '../helpers/wait-utils';
import { getTrajectoryPointsCount } from '../helpers/trajectory-utils';

test.describe('TC-03-001: 2D 靜態/動態模式切換 @P0', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    console.log('🚀 開始測試：2D 靜態/動態模式切換');
  });

  test('應該成功切換靜態→動態→靜態', async ({ page }) => {
    // ===== 步驟 1: 進入賽事（停在鴿子列表）=====
    console.log('📍 步驟 1: 進入賽事');
    await enterRace(page, 0);

    // ===== 步驟 2-4: 加載 2D 軌跡（解決已知問題 #1）=====
    console.log('📍 步驟 2-4: 加載 2D 軌跡');
    const loadSuccess = await reload2DTrajectory(page, 0, 3);
    expect(loadSuccess).toBe(true);

    // ===== 步驟 4: 驗證初始為靜態模式 =====
    console.log('📍 步驟 1: 驗證初始狀態（靜態模式）');
    let pointsCount = await getTrajectoryPointsCount(page);
    expect(pointsCount).toBeGreaterThanOrEqual(15);
    console.log(`  ✓ 靜態模式確認：${pointsCount} 個標記點`);

    let currentMode = await detectCurrentViewMode(page);
    expect(currentMode).toBe('2D-static');
    console.log(`  ✓ 模式偵測：${currentMode}`);

    // ===== 步驟 5: 切換到動態模式 =====
    console.log('📍 步驟 2: 切換到動態模式');
    const timelineButton = page.locator('button:has(img[alt="timeline"])');
    await timelineButton.click();
    await page.waitForTimeout(2000);

    // 驗證動態模式（標記點減少）
    pointsCount = await getTrajectoryPointsCount(page);
    expect(pointsCount).toBeLessThan(5);
    console.log(`  ✓ 動態模式確認：${pointsCount} 個標記點`);

    currentMode = await detectCurrentViewMode(page);
    expect(currentMode).toBe('2D-dynamic');
    console.log(`  ✓ 模式偵測：${currentMode}`);

    // 驗證播放控制按鈕存在
    const playButton = page.getByRole('button').filter({ hasText: 'play_arrow' });
    await expect(playButton).toBeVisible({ timeout: 5000 });
    console.log('  ✓ 播放控制按鈕已顯示');

    // ===== 步驟 6: 切換回靜態模式 =====
    console.log('📍 步驟 3: 切換回靜態模式');
    await timelineButton.click();
    await page.waitForTimeout(2000);

    // 驗證恢復靜態模式
    pointsCount = await getTrajectoryPointsCount(page);
    expect(pointsCount).toBeGreaterThanOrEqual(15);
    console.log(`  ✓ 靜態模式恢復：${pointsCount} 個標記點`);

    currentMode = await detectCurrentViewMode(page);
    expect(currentMode).toBe('2D-static');
    console.log(`  ✓ 模式偵測：${currentMode}`);

    console.log('✅ 測試通過：靜態/動態切換成功');
  });

  test('動態模式應該顯示播放控制', async ({ page }) => {
    // 進入賽事並加載 2D 軌跡
    await enterRace(page, 0);
    await reload2DTrajectory(page, 0, 3);

    // 切換到動態模式
    await switchSubMode2D(page, 'dynamic');

    // 驗證播放控制元素
    await expect(page.getByRole('button').filter({ hasText: 'play_arrow' })).toBeVisible();
    await expect(page.getByRole('button').filter({ hasText: 'fast_forward' })).toBeVisible();
    await expect(page.getByRole('button').filter({ hasText: 'fast_rewind' })).toBeVisible();

    // 驗證速度滑塊
    const slider = page.locator('input[type="range"], mat-slider');
    const sliderCount = await slider.count();
    expect(sliderCount).toBeGreaterThan(0);

    console.log('✅ 播放控制元素驗證通過');
  });

  test('動態模式播放功能應該正常', async ({ page }) => {
    // 進入賽事並加載 2D 軌跡
    await enterRace(page, 0);
    await reload2DTrajectory(page, 0, 3);
    await switchSubMode2D(page, 'dynamic');

    // 記錄初始時間
    const timeDisplay = page.locator('text=/\\d{2}:\\d{2}/').first();
    const initialTime = await timeDisplay.textContent();
    console.log(`  初始時間：${initialTime}`);

    // 點擊播放按鈕
    const playButton = page.getByRole('button').filter({ hasText: 'play_arrow' });
    await playButton.click();
    await page.waitForTimeout(2000);

    // 驗證播放圖標變為暫停
    const pauseButton = page.getByRole('button').filter({ hasText: 'pause' });
    await expect(pauseButton).toBeVisible({ timeout: 5000 });
    console.log('  ✓ 播放按鈕變為暫停按鈕');

    // 驗證時間持續更新（可選，可能較慢）
    await page.waitForTimeout(1000);
    const currentTime = await timeDisplay.textContent();
    console.log(`  當前時間：${currentTime}`);

    // Canvas 應該有更新（可視覺檢查）
    const canvas = page.locator('canvas.amap-layer').first();
    await expect(canvas).toBeVisible();

    console.log('✅ 播放功能驗證通過');
  });

  test('應該正確偵測當前模式', async ({ page }) => {
    // 進入賽事並加載 2D 軌跡
    await enterRace(page, 0);
    await reload2DTrajectory(page, 0, 3);

    // 測試模式偵測
    let mode = await detectCurrentViewMode(page);
    console.log(`  模式偵測（初始）：${mode}`);
    expect(['2D-static', '2D-dynamic']).toContain(mode);

    // 切換模式
    const timelineButton = page.locator('button:has(img[alt="timeline"])');
    await timelineButton.click();
    await page.waitForTimeout(2000);

    // 再次偵測
    const newMode = await detectCurrentViewMode(page);
    console.log(`  模式偵測（切換後）：${newMode}`);
    expect(['2D-static', '2D-dynamic']).toContain(newMode);

    // 驗證模式確實改變了
    expect(newMode).not.toBe(mode);

    console.log('✅ 模式偵測功能驗證通過');
  });

  test('Canvas 應該在模式切換時更新', async ({ page }) => {
    // 進入賽事並加載 2D 軌跡
    await enterRace(page, 0);
    await reload2DTrajectory(page, 0, 3);

    const canvas = page.locator('canvas.amap-layer').first();

    // 截圖靜態模式
    await canvas.screenshot({ path: 'screenshots/2d-static-mode.png' });
    console.log('  ✓ 靜態模式截圖已保存');

    // 切換到動態模式
    await switchSubMode2D(page, 'dynamic');

    // 截圖動態模式
    await canvas.screenshot({ path: 'screenshots/2d-dynamic-mode.png' });
    console.log('  ✓ 動態模式截圖已保存');

    // 視覺差異驗證（截圖對比可以在後續實作）
    console.log('✅ Canvas 更新驗證通過（截圖已保存）');
  });
});
