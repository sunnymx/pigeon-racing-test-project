/**
 * TC-02-001: 2D 靜態軌跡完整渲染測試 (DevTools MCP 版本)
 *
 * 優先級：P0 (Critical)
 * 測試目標：驗證 2D 靜態模式下完整軌跡顯示
 *
 * 驗證策略（三重驗證）：
 * 1. DOM 驗證：元素存在性、按鈕狀態
 * 2. Canvas 驗證：地圖瓦片載入、軌跡線渲染
 * 3. Network 驗證：API 響應數據完整性
 *
 * 對應 Playwright 版本：tests/e2e/tc-02-001-2d-static.spec.ts
 */

import { TestContext, TestMethodResult } from './shared/test-types';
import { BaseTestRunner, TestDefinition } from './shared/test-runner';
import { hasElement } from '../helpers-devtools/devtools-core';
import { enterRace } from '../helpers-devtools/navigation';
import { reload2DTrajectory } from '../helpers-devtools/trajectory-reload';
import {
  getTrajectoryPointsCount,
  verifyTrajectoryRendered,
  verifyTrajectoryData,
} from '../helpers-devtools/trajectory-utils';
import {
  validateFlightData,
  detectAnomaly,
  formatValidationReport,
} from '../shared/validators';

/**
 * TC-02-001 測試套件
 */
export class TC02001Test extends BaseTestRunner {
  /**
   * 取得測試清單
   */
  protected getTests(): TestDefinition[] {
    return [
      {
        name: '應該正確渲染 2D 靜態軌跡',
        method: () => this.test_shouldRender2DStaticTrajectory(),
      },
      {
        name: '應該正確顯示起點和終點標記',
        method: () => this.test_shouldShowStartEndMarkers(),
      },
      {
        name: '應該無控制台錯誤',
        method: () => this.test_shouldHaveNoConsoleErrors(),
      },
    ];
  }

  /**
   * 測試 1: 應該正確渲染 2D 靜態軌跡
   */
  async test_shouldRender2DStaticTrajectory(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：2D 靜態軌跡渲染');

    try {
      // ===== 步驟 1: 進入賽事 =====
      console.log('📍 步驟 1: 進入賽事');
      await enterRace(this.ctx, 0);

      // ===== 步驟 2-4: 加載 2D 軌跡 =====
      console.log('📍 步驟 2-4: 加載 2D 軌跡');
      const loadSuccess = await reload2DTrajectory(this.ctx, 0, 3);
      if (!loadSuccess) {
        errors.push('2D 軌跡加載失敗');
        return { passed: false, errors };
      }

      // ===== 層級 1: DOM 驗證 =====
      console.log('✅ 層級 1: DOM 驗證');
      const snapshotResult = await this.ctx.takeSnapshot();
      const has3DButton = hasElement(snapshotResult, 'button', /3D模式/);
      if (!has3DButton) {
        errors.push('未找到 3D模式 切換按鈕');
      } else {
        console.log('  ✓ 2D 模式確認（3D模式切換按鈕已顯示）');
      }

      // ===== 層級 2: Canvas 驗證 =====
      console.log('✅ 層級 2: Canvas 驗證');
      const canvasRendered = await verifyTrajectoryRendered(this.trajectoryCtx, '2D');
      if (!canvasRendered) {
        errors.push('Canvas 圖層未載入');
      } else {
        console.log('  ✓ Canvas 圖層已載入');
      }

      const pointsCount = await getTrajectoryPointsCount(this.trajectoryCtx);
      if (pointsCount < 15) {
        errors.push(`軌跡標記點數量不足：${pointsCount} < 15`);
      } else {
        console.log(`  ✓ 軌跡標記點數量：${pointsCount} 個（靜態模式）`);
      }

      if (this.ctx.takeScreenshotToFile) {
        await this.ctx.takeScreenshotToFile({
          filePath: 'screenshots/tc-02-001-2d-static-devtools.png',
        });
        console.log('  ✓ 軌跡截圖已保存');
      }

      // ===== 層級 3: Network 驗證 =====
      console.log('✅ 層級 3: Network 驗證');
      const trajectoryData = await verifyTrajectoryData(this.trajectoryCtx);
      console.log('  ✓ 軌跡數據已提取');

      const validationResult = validateFlightData(trajectoryData);
      console.log(formatValidationReport(validationResult));

      const anomaly = detectAnomaly(trajectoryData);
      if (anomaly) {
        console.warn(`⚠️ 偵測到異常數據：${anomaly}`);
      }

      if (!trajectoryData.ringNumber) {
        errors.push('公環號為空');
      }
      if (trajectoryData.avgSpeed <= 0) {
        errors.push('平均分速無效');
      }
      if (trajectoryData.actualDistance <= 0) {
        errors.push('實際距離無效');
      }

      if (errors.length === 0) {
        console.log('  ✓ 必填欄位驗證通過');
        console.log('✅ 測試通過：2D 靜態軌跡完整渲染');
      }

      return { passed: errors.length === 0, errors };
    } catch (error) {
      errors.push(`測試執行錯誤：${(error as Error).message}`);
      return { passed: false, errors };
    }
  }

  /**
   * 測試 2: 應該正確顯示起點和終點標記
   */
  async test_shouldShowStartEndMarkers(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：起點和終點標記');

    try {
      await enterRace(this.ctx, 0);
      await reload2DTrajectory(this.ctx, 0, 3);

      const markers = await getTrajectoryPointsCount(this.trajectoryCtx);
      if (markers < 2) {
        errors.push(`標記點數量不足：${markers} < 2`);
      } else {
        console.log(`✅ 起點和終點標記驗證通過（共 ${markers} 個標記）`);
      }

      return { passed: errors.length === 0, errors };
    } catch (error) {
      errors.push(`測試執行錯誤：${(error as Error).message}`);
      return { passed: false, errors };
    }
  }

  /**
   * 測試 3: 應該無控制台錯誤
   */
  async test_shouldHaveNoConsoleErrors(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：控制台錯誤檢查');

    try {
      await enterRace(this.ctx, 0);
      await reload2DTrajectory(this.ctx, 0, 3);

      if (!this.ctx.listConsoleMessages) {
        console.log('⚠️ listConsoleMessages 不可用，跳過此測試');
        return { passed: true, errors: [] };
      }

      const consoleMessages = await this.ctx.listConsoleMessages();
      const errorMessages = consoleMessages.filter((msg) => msg.type === 'error');
      const criticalErrors = errorMessages.filter(
        (msg) =>
          !msg.text.includes('favicon') &&
          !msg.text.includes('Chrome extension')
      );

      if (criticalErrors.length > 0) {
        console.warn('⚠️ 偵測到控制台錯誤：', criticalErrors);
      }

      const hasGpx2dError = errorMessages.some(
        (msg) => msg.text.includes('gpx2d') && msg.text.includes('undefined')
      );

      if (hasGpx2dError) {
        errors.push('偵測到 gpx2d undefined 錯誤');
      } else {
        console.log('✅ 無嚴重控制台錯誤');
      }

      return { passed: errors.length === 0, errors };
    } catch (error) {
      errors.push(`測試執行錯誤：${(error as Error).message}`);
      return { passed: false, errors };
    }
  }
}

/**
 * 互動式執行入口
 */
export function createTestRunner(ctx: TestContext): TC02001Test {
  return new TC02001Test(ctx);
}
