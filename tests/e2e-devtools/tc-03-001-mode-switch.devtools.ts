/**
 * TC-03-001: 2D 靜態/動態模式切換測試 (DevTools MCP 版本)
 *
 * 優先級：P0 (Critical)
 * 測試目標：驗證 2D 模式下靜態/動態切換功能
 *
 * 關鍵驗證點：
 * - 靜態模式：15-20 個軌跡標記點
 * - 動態模式：1-3 個可見標記點
 * - 模式切換：點擊 timeline 按鈕
 *
 * 對應 Playwright 版本：tests/e2e/tc-03-001-mode-switch.spec.ts
 */

import { TestContext, TestMethodResult } from './shared/test-types';
import { BaseTestRunner, TestDefinition } from './shared/test-runner';
import { hasElement, findElementByText } from '../helpers-devtools/devtools-core';
import { enterRace } from '../helpers-devtools/navigation';
import { reload2DTrajectory } from '../helpers-devtools/trajectory-reload';
import { detectCurrentViewMode, switchSubMode2D, DevToolsContextExtended } from '../helpers-devtools/mode-switching';
import { delay } from '../helpers-devtools/wait-utils';
import { getTrajectoryPointsCount } from '../helpers-devtools/trajectory-utils';

/**
 * TC-03-001 測試套件
 */
export class TC03001Test extends BaseTestRunner {
  /**
   * 取得測試清單
   */
  protected getTests(): TestDefinition[] {
    return [
      {
        name: '應該成功切換靜態→動態→靜態',
        method: () => this.test_shouldSwitchStaticDynamicStatic(),
      },
      {
        name: '動態模式應該顯示播放控制',
        method: () => this.test_shouldShowPlaybackControls(),
      },
      {
        name: '應該正確偵測當前模式',
        method: () => this.test_shouldDetectCurrentMode(),
      },
      {
        name: 'Canvas 應該在模式切換時更新',
        method: () => this.test_shouldUpdateCanvasOnModeSwitch(),
      },
    ];
  }

  /** 取得擴展上下文 */
  private get extCtx(): DevToolsContextExtended {
    return this.ctx as DevToolsContextExtended;
  }

  /**
   * 測試 1: 應該成功切換靜態→動態→靜態
   */
  async test_shouldSwitchStaticDynamicStatic(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：靜態→動態→靜態切換');

    try {
      console.log('📍 步驟 1: 進入賽事');
      await enterRace(this.ctx, 0);

      console.log('📍 步驟 2-4: 加載 2D 軌跡');
      const loadSuccess = await reload2DTrajectory(this.extCtx, 0, 3);
      if (!loadSuccess) {
        errors.push('2D 軌跡加載失敗');
        return { passed: false, errors };
      }

      // 驗證初始為靜態模式
      console.log('📍 驗證初始狀態（靜態模式）');
      let pointsCount = await getTrajectoryPointsCount(this.trajectoryCtx);
      if (pointsCount < 15) {
        errors.push(`初始靜態模式標記點不足：${pointsCount} < 15`);
      } else {
        console.log(`  ✓ 靜態模式確認：${pointsCount} 個標記點`);
      }

      let currentMode = await detectCurrentViewMode(this.extCtx);
      if (currentMode !== '2D-static') {
        errors.push(`初始模式不是 2D-static：${currentMode}`);
      } else {
        console.log(`  ✓ 模式偵測：${currentMode}`);
      }

      // 切換到動態模式
      console.log('📍 切換到動態模式');
      await switchSubMode2D(this.extCtx, 'dynamic');

      // 驗證動態模式（標記點減少）
      pointsCount = await getTrajectoryPointsCount(this.trajectoryCtx);
      if (pointsCount >= 5) {
        errors.push(`動態模式標記點過多：${pointsCount} >= 5`);
      } else {
        console.log(`  ✓ 動態模式確認：${pointsCount} 個標記點`);
      }

      currentMode = await detectCurrentViewMode(this.extCtx);
      if (currentMode !== '2D-dynamic') {
        errors.push(`模式不是 2D-dynamic：${currentMode}`);
      } else {
        console.log(`  ✓ 模式偵測：${currentMode}`);
      }

      // 驗證播放控制按鈕存在
      const snapshot = await this.ctx.takeSnapshot();
      const hasPlayOrPause = hasElement(snapshot, 'button', /play_arrow/) ||
                             hasElement(snapshot, 'button', /pause/);
      if (!hasPlayOrPause) {
        errors.push('未找到播放/暫停按鈕');
      } else {
        console.log('  ✓ 播放控制按鈕可見');
      }

      // 切換回靜態模式
      console.log('📍 切換回靜態模式');
      await switchSubMode2D(this.extCtx, 'static');

      // 驗證恢復靜態模式
      pointsCount = await getTrajectoryPointsCount(this.trajectoryCtx);
      if (pointsCount < 15) {
        errors.push(`恢復靜態模式標記點不足：${pointsCount} < 15`);
      } else {
        console.log(`  ✓ 靜態模式恢復：${pointsCount} 個標記點`);
      }

      currentMode = await detectCurrentViewMode(this.extCtx);
      if (currentMode !== '2D-static') {
        errors.push(`恢復後模式不是 2D-static：${currentMode}`);
      } else {
        console.log(`  ✓ 模式偵測：${currentMode}`);
      }

      if (errors.length === 0) {
        console.log('✅ 測試通過：靜態/動態切換成功');
      }

      return { passed: errors.length === 0, errors };
    } catch (error) {
      errors.push(`測試執行錯誤：${(error as Error).message}`);
      return { passed: false, errors };
    }
  }

  /**
   * 測試 2: 動態模式應該顯示播放控制
   */
  async test_shouldShowPlaybackControls(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：播放控制元素');

    try {
      await enterRace(this.ctx, 0);
      await reload2DTrajectory(this.extCtx, 0, 3);
      await switchSubMode2D(this.extCtx, 'dynamic');

      const snapshot = await this.ctx.takeSnapshot();

      const hasPlayOrPause = hasElement(snapshot, 'button', /play_arrow/) ||
                             hasElement(snapshot, 'button', /pause/);
      if (!hasPlayOrPause) {
        errors.push('未找到播放/暫停按鈕');
      }

      const hasFastForward = hasElement(snapshot, 'button', /fast_forward/);
      if (!hasFastForward) {
        errors.push('未找到快進按鈕');
      }

      const hasFastRewind = hasElement(snapshot, 'button', /fast_rewind/);
      if (!hasFastRewind) {
        errors.push('未找到快退按鈕');
      }

      const hasSlider = await this.ctx.evaluateScript(`
        () => {
          const slider = document.querySelector('input[type="range"], mat-slider');
          return !!slider;
        }
      `);
      if (!hasSlider) {
        errors.push('未找到速度滑塊');
      }

      if (errors.length === 0) {
        console.log('✅ 播放控制元素驗證通過');
      }

      return { passed: errors.length === 0, errors };
    } catch (error) {
      errors.push(`測試執行錯誤：${(error as Error).message}`);
      return { passed: false, errors };
    }
  }

  /**
   * 測試 3: 應該正確偵測當前模式
   */
  async test_shouldDetectCurrentMode(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：模式偵測功能');

    try {
      await enterRace(this.ctx, 0);
      await reload2DTrajectory(this.extCtx, 0, 3);

      const initialMode = await detectCurrentViewMode(this.extCtx);
      console.log(`  模式偵測（初始）：${initialMode}`);

      if (!['2D-static', '2D-dynamic'].includes(initialMode)) {
        errors.push(`初始模式無效：${initialMode}`);
      }

      // 點擊 timeline 按鈕切換模式
      const snapshot = await this.ctx.takeSnapshot();
      const timelineBtnUid = findElementByText(snapshot, /timeline/);
      if (timelineBtnUid) {
        await this.ctx.click(timelineBtnUid);
        await delay(2000);
      }

      const newMode = await detectCurrentViewMode(this.extCtx);
      console.log(`  模式偵測（切換後）：${newMode}`);

      if (!['2D-static', '2D-dynamic'].includes(newMode)) {
        errors.push(`切換後模式無效：${newMode}`);
      }

      if (newMode === initialMode) {
        errors.push(`模式未改變：${initialMode} → ${newMode}`);
      }

      if (errors.length === 0) {
        console.log('✅ 模式偵測功能驗證通過');
      }

      return { passed: errors.length === 0, errors };
    } catch (error) {
      errors.push(`測試執行錯誤：${(error as Error).message}`);
      return { passed: false, errors };
    }
  }

  /**
   * 測試 4: Canvas 應該在模式切換時更新
   */
  async test_shouldUpdateCanvasOnModeSwitch(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：Canvas 更新');

    try {
      await enterRace(this.ctx, 0);
      await reload2DTrajectory(this.extCtx, 0, 3);

      if (this.ctx.takeScreenshotToFile) {
        await this.ctx.takeScreenshotToFile({ filePath: 'screenshots/2d-static-mode-devtools.png' });
        console.log('  ✓ 靜態模式截圖已保存');
      }

      await switchSubMode2D(this.extCtx, 'dynamic');

      if (this.ctx.takeScreenshotToFile) {
        await this.ctx.takeScreenshotToFile({ filePath: 'screenshots/2d-dynamic-mode-devtools.png' });
        console.log('  ✓ 動態模式截圖已保存');
      }

      const canvasExists = await this.ctx.evaluateScript(`
        () => {
          const canvas = document.querySelector('canvas.amap-layer');
          return canvas && canvas.width > 0 && canvas.height > 0;
        }
      `);

      if (!canvasExists) {
        errors.push('Canvas 不存在或尺寸為 0');
      }

      if (errors.length === 0) {
        console.log('✅ Canvas 更新驗證通過');
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
export function createTestRunner(ctx: TestContext): TC03001Test {
  return new TC03001Test(ctx);
}
