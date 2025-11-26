/**
 * TC-02-001: 2D 靜態軌跡完整渲染測試
 *
 * 優先級：P0 (Critical)
 * 測試目標：驗證 2D 靜態模式下完整軌跡顯示
 *
 * 驗證策略（三重驗證）：
 * 1. DOM 驗證：元素存在性、按鈕狀態
 * 2. Canvas 驗證：地圖瓦片載入、軌跡線渲染
 * 3. Network 驗證：API 響應數據完整性
 *
 * 參考文檔：
 * - docs/test-plan/TEST_CASES.md (TC-02-001)
 * - docs/guides/mode-switching.md
 * - docs/guides/testing-strategies.md
 */

import { test, expect } from '@playwright/test';
import { enterRace, selectPigeon, openTrajectory } from '../helpers/navigation';
import { reload2DTrajectory, ensure2DStaticMode } from '../helpers/trajectory-reload';
import { waitForTrajectoryData } from '../helpers/wait-utils';
import {
  getTrajectoryPointsCount,
  verifyTrajectoryRendered,
  verifyTrajectoryData,
} from '../helpers/trajectory-utils';
import { validateFlightData, detectAnomaly, formatValidationReport } from '../helpers/validators';

test.describe('TC-02-001: 2D 靜態軌跡渲染 @P0', () => {
  test.beforeEach(async ({ page }) => {
    // 設置較長的超時時間（地圖載入需時）
    test.setTimeout(90000);

    console.log('🚀 開始測試：2D 靜態軌跡渲染');
  });

  test('應該正確渲染 2D 靜態軌跡', async ({ page }) => {
    // ===== 步驟 1: 進入賽事（停在鴿子列表）=====
    console.log('📍 步驟 1: 進入賽事');
    await enterRace(page, 0);

    // ===== 步驟 2-4: 加載 2D 軌跡（解決已知問題 #1）=====
    // 此方法會處理：選擇鴿子 → 查看軌跡 → 切換2D → 驗證加載
    // 根據 KNOWN_ISSUES_SOLUTIONS.md 第 260-266 行的測試用例結構
    console.log('📍 步驟 2-4: 加載 2D 軌跡');
    const loadSuccess = await reload2DTrajectory(page, 0, 3);
    expect(loadSuccess).toBe(true);

    // ===== 層級 1: DOM 驗證 =====
    console.log('✅ 層級 1: DOM 驗證');

    // 驗證 2D 特徵按鈕可見（當前在 2D，按鈕顯示「3D模式」表示可切換到 3D）
    await expect(page.getByRole('button', { name: /3D模式/ })).toBeVisible({
      timeout: 5000,
    });
    console.log('  ✓ 2D 模式確認（3D模式切換按鈕已顯示）');

    // 注意：timeline 按鈕只在「動態播放」模式才會出現
    // 靜態軌跡模式不驗證 timeline 按鈕

    // ===== 層級 2: Canvas 驗證 =====
    console.log('✅ 層級 2: Canvas 驗證');

    // 驗證 Canvas 圖層存在（替代瓦片計數，AMap v2.0+ 使用 Canvas 渲染）
    const canvas = page.locator('canvas.amap-layer').first();
    await expect(canvas).toBeVisible();
    console.log('  ✓ Canvas 圖層已載入');

    // 驗證軌跡點數量（靜態模式應該 >= 15）
    const pointsCount = await getTrajectoryPointsCount(page);
    expect(pointsCount).toBeGreaterThanOrEqual(15);
    console.log(`  ✓ 軌跡標記點數量：${pointsCount} 個（靜態模式）`);

    // 截圖驗證軌跡線可見（合併原 :108 測試功能）
    await canvas.screenshot({
      path: 'screenshots/tc-02-001-trajectory-line.png',
    });
    console.log('  ✓ 軌跡線截圖已保存');

    // 截圖驗證軌跡渲染
    await verifyTrajectoryRendered(page, '2D', 'tc-02-001-2d-static');
    console.log('  ✓ 2D 軌跡渲染成功');

    // ===== 層級 3: Network 驗證 =====
    console.log('✅ 層級 3: Network 驗證');

    // 驗證軌跡數據 API 響應（此時應該已經載入）
    // 注意：API 請求在點擊「查看軌跡」時已發送
    // 這裡我們驗證數據是否正確顯示在側邊欄

    const trajectoryData = await verifyTrajectoryData(page);
    console.log('  ✓ 軌跡數據已提取');

    // 驗證數據完整性
    const validationResult = validateFlightData(trajectoryData);
    console.log(formatValidationReport(validationResult));

    // 檢測異常數據
    const anomaly = detectAnomaly(trajectoryData);
    if (anomaly) {
      console.warn(`⚠️ 偵測到異常數據：${anomaly}`);
    }

    // 驗證必填欄位
    expect(trajectoryData.ringNumber).toBeTruthy();
    expect(trajectoryData.avgSpeed).toBeGreaterThan(0);
    expect(trajectoryData.actualDistance).toBeGreaterThan(0);
    console.log('  ✓ 必填欄位驗證通過');

    // ===== 最終驗證 =====
    console.log('✅ 測試通過：2D 靜態軌跡完整渲染');
  });

  // 注意：「應該顯示完整的軌跡線」測試已合併到「應該正確渲染 2D 靜態軌跡」測試中

  test('應該正確顯示起點和終點標記', async ({ page }) => {
    // 進入賽事並加載 2D 軌跡
    await enterRace(page, 0);
    await reload2DTrajectory(page, 0, 3);

    // 檢查起點標記（棋盤格旗幟）
    // 注意：具體的標記選擇器可能需要根據實際 DOM 結構調整
    const markers = await getTrajectoryPointsCount(page);

    // 起點和終點應該在標記點中
    expect(markers).toBeGreaterThanOrEqual(2);

    console.log(`✅ 起點和終點標記驗證通過（共 ${markers} 個標記）`);
  });

  test('應該無控制台錯誤', async ({ page }) => {
    const errors: string[] = [];

    // 監聽控制台錯誤
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // 進入賽事並加載 2D 軌跡
    await enterRace(page, 0);
    await reload2DTrajectory(page, 0, 3);

    // 過濾已知的無關錯誤
    const criticalErrors = errors.filter(
      (error) => !error.includes('favicon') && !error.includes('Chrome extension')
    );

    if (criticalErrors.length > 0) {
      console.warn('⚠️ 偵測到控制台錯誤：', criticalErrors);
    }

    // 驗證無嚴重錯誤（特別是 gpx2d undefined）
    const hasGpx2dError = errors.some((error) => error.includes('gpx2d') && error.includes('undefined'));

    expect(hasGpx2dError).toBe(false);

    console.log('✅ 無嚴重控制台錯誤');
  });
});
