/**
 * TC-04-001: 3D 模式基本渲染測試 (DevTools MCP 版本)
 *
 * 優先級：P0 (Critical)
 * 測試目標：驗證 3D 模式基本功能
 *
 * 關鍵驗證點：
 * - Cesium 引擎成功初始化
 * - 3D 地球正確渲染
 * - 視角控制按鈕可見
 * - 播放控制功能
 *
 * 對應 Playwright 版本：tests/e2e/tc-04-001-3d-mode.spec.ts
 */

import { TestContext, TestMethodResult } from './shared/test-types';
import { BaseTestRunner, TestDefinition } from './shared/test-runner';
import { hasElement, findElementByRole } from '../helpers-devtools/devtools-core';
import {
  enterRace,
  selectPigeon,
  openTrajectory,
  setPreferredMode,
  getCurrentMode,
} from '../helpers-devtools/navigation';
import {
  ensureModeByText,
  switchTo3DReliably,
  DevToolsContextExtended,
} from '../helpers-devtools/mode-switching';
import { waitForCesium3D, delay } from '../helpers-devtools/wait-utils';

/**
 * TC-04-001 測試套件
 */
export class TC04001Test extends BaseTestRunner {
  /**
   * 取得測試清單
   */
  protected getTests(): TestDefinition[] {
    return [
      {
        name: '應該成功切換到 3D 模式並渲染',
        method: () => this.test_shouldSwitchTo3DAndRender(),
      },
      {
        name: 'Cesium 引擎應該正確初始化',
        method: () => this.test_cesiumShouldInitialize(),
      },
      {
        name: '視角切換功能應該正常',
        method: () => this.test_viewSwitchShouldWork(),
      },
      {
        name: '3D 播放控制應該可用',
        method: () => this.test_playbackControlsShouldWork(),
      },
      {
        name: '3D 和 2D 模式應該可以來回切換',
        method: () => this.test_shouldSwitchBetween2DAnd3D(),
      },
      {
        name: '3D 模式應該顯示速度滑塊',
        method: () => this.test_shouldShowSpeedSlider(),
      },
    ];
  }

  /** 取得擴展上下文 */
  private get extCtx(): DevToolsContextExtended {
    return this.ctx as DevToolsContextExtended;
  }

  /**
   * 測試 1: 應該成功切換到 3D 模式並渲染
   */
  async test_shouldSwitchTo3DAndRender(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：3D 模式基本渲染');

    try {
      console.log('📍 準備：進入軌跡視圖');
      await enterRace(this.ctx, 0);
      await selectPigeon(this.ctx, 0);
      await setPreferredMode(this.ctx, '2D');
      await openTrajectory(this.ctx);

      console.log('📍 步驟 1: 切換到 3D 模式');
      await switchTo3DReliably(this.extCtx);

      console.log('✅ 驗證 3D 特徵元素');
      const snapshot = await this.ctx.takeSnapshot();

      const hasView1 = hasElement(snapshot, 'button', /[视視]角1/);
      const hasView2 = hasElement(snapshot, 'button', /[视視]角2/);

      if (!hasView1 || !hasView2) {
        errors.push('視角控制按鈕未顯示');
      } else {
        console.log('  ✓ 視角控制按鈕已顯示');
      }

      const has2DButton = hasElement(snapshot, 'button', /2D模式/);
      if (!has2DButton) {
        errors.push('2D 模式切換按鈕未顯示');
      } else {
        console.log('  ✓ 2D 模式切換按鈕已顯示');
      }

      console.log('✅ 驗證 Cesium 引擎');
      if (hasView1) {
        console.log('  ✓ Cesium 引擎已初始化（通過視覺元素驗證）');
      }

      if (this.ctx.takeScreenshotToFile) {
        await delay(3000);
        await this.ctx.takeScreenshotToFile({
          filePath: 'screenshots/tc-04-001-3d-mode-devtools.png',
        });
        console.log('  ✓ 3D 模式截圖已保存');
      }

      if (errors.length === 0) {
        console.log('✅ 測試通過：3D 模式基本渲染成功');
      }

      return { passed: errors.length === 0, errors };
    } catch (error) {
      errors.push(`測試執行錯誤：${(error as Error).message}`);
      return { passed: false, errors };
    }
  }

  /**
   * 測試 2: Cesium 引擎應該正確初始化
   */
  async test_cesiumShouldInitialize(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：Cesium 引擎初始化');

    try {
      await enterRace(this.ctx, 0);
      await selectPigeon(this.ctx, 0);
      await openTrajectory(this.ctx);
      await switchTo3DReliably(this.extCtx);

      await waitForCesium3D(() => this.ctx.takeSnapshot(), 30000);

      const cesiumDetails = await this.ctx.evaluateScript(`
        () => {
          return {
            hasCesiumVersion: typeof window.CESIUM_VERSION !== 'undefined',
            hasCesiumBaseUrl: typeof window.CESIUM_BASE_URL !== 'undefined',
            cesiumVersion: window.CESIUM_VERSION || null,
            widgetCount: document.querySelectorAll('.cesium-widget, .cesium-viewer, [class*="cesium-viewer"]').length,
            hasTimelineCanvas: document.querySelector('canvas.cesium-timeline-tracks') !== null,
            canvasCount: document.querySelectorAll('canvas').length,
          };
        }
      `) as {
        hasCesiumVersion: boolean;
        hasCesiumBaseUrl: boolean;
        cesiumVersion: string | null;
        widgetCount: number;
        hasTimelineCanvas: boolean;
        canvasCount: number;
      };

      console.log('Cesium 初始化詳情：', cesiumDetails);

      if (!cesiumDetails.hasCesiumVersion) {
        errors.push('CESIUM_VERSION 未定義');
      }
      if (!cesiumDetails.hasCesiumBaseUrl) {
        errors.push('CESIUM_BASE_URL 未定義');
      }
      if (cesiumDetails.widgetCount === 0) {
        errors.push('Cesium widget 不存在');
      }
      if (!cesiumDetails.hasTimelineCanvas) {
        errors.push('Cesium timeline canvas 不存在');
      }

      if (errors.length === 0) {
        console.log('✅ Cesium 引擎驗證通過');
      }

      return { passed: errors.length === 0, errors };
    } catch (error) {
      errors.push(`測試執行錯誤：${(error as Error).message}`);
      return { passed: false, errors };
    }
  }

  /**
   * 測試 3: 視角切換功能應該正常
   */
  async test_viewSwitchShouldWork(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：視角切換功能');

    try {
      await enterRace(this.ctx, 0);
      await selectPigeon(this.ctx, 0);
      await openTrajectory(this.ctx);
      await switchTo3DReliably(this.extCtx);

      let snapshot = await this.ctx.takeSnapshot();
      const view1Uid = findElementByRole(snapshot, 'button', /[视視]角1/);
      if (view1Uid) {
        await this.ctx.click(view1Uid);
        await delay(2000);
        if (this.ctx.takeScreenshotToFile) {
          await this.ctx.takeScreenshotToFile({ filePath: 'screenshots/3d-view1-devtools.png' });
        }
        console.log('  ✓ 視角1 截圖已保存');
      } else {
        errors.push('未找到視角1按鈕');
      }

      snapshot = await this.ctx.takeSnapshot();
      const view2Uid = findElementByRole(snapshot, 'button', /[视視]角2/);
      if (view2Uid) {
        await this.ctx.click(view2Uid);
        await delay(2000);
        if (this.ctx.takeScreenshotToFile) {
          await this.ctx.takeScreenshotToFile({ filePath: 'screenshots/3d-view2-devtools.png' });
        }
        console.log('  ✓ 視角2 截圖已保存');
      } else {
        errors.push('未找到視角2按鈕');
      }

      if (errors.length === 0) {
        console.log('✅ 視角切換功能驗證通過');
      }

      return { passed: errors.length === 0, errors };
    } catch (error) {
      errors.push(`測試執行錯誤：${(error as Error).message}`);
      return { passed: false, errors };
    }
  }

  /**
   * 測試 4: 3D 播放控制應該可用
   */
  async test_playbackControlsShouldWork(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：3D 播放控制');

    try {
      await enterRace(this.ctx, 0);
      await selectPigeon(this.ctx, 0);
      await openTrajectory(this.ctx);
      await switchTo3DReliably(this.extCtx);

      const snapshot = await this.ctx.takeSnapshot();

      const hasPlay = hasElement(snapshot, 'button', /play_arrow/);
      const hasFastForward = hasElement(snapshot, 'button', /fast_forward/);
      const hasFastRewind = hasElement(snapshot, 'button', /fast_rewind/);

      if (!hasPlay) errors.push('未找到播放按鈕');
      if (!hasFastForward) errors.push('未找到快進按鈕');
      if (!hasFastRewind) errors.push('未找到快退按鈕');

      if (hasPlay) {
        console.log('  ✓ 播放控制按鈕已顯示');

        const playUid = findElementByRole(snapshot, 'button', /play_arrow/);
        if (playUid) {
          await this.ctx.click(playUid);
          await delay(1000);

          const newSnapshot = await this.ctx.takeSnapshot();
          const hasPause = hasElement(newSnapshot, 'button', /pause/);
          if (hasPause) {
            console.log('  ✓ 播放功能正常');
          } else {
            errors.push('播放後未顯示暫停按鈕');
          }
        }
      }

      if (errors.length === 0) {
        console.log('✅ 3D 播放控制驗證通過');
      }

      return { passed: errors.length === 0, errors };
    } catch (error) {
      errors.push(`測試執行錯誤：${(error as Error).message}`);
      return { passed: false, errors };
    }
  }

  /**
   * 測試 5: 3D 和 2D 模式應該可以來回切換
   */
  async test_shouldSwitchBetween2DAnd3D(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：2D/3D 來回切換');

    try {
      await enterRace(this.ctx, 0);
      await selectPigeon(this.ctx, 0);
      await openTrajectory(this.ctx);

      console.log('  切換到 3D...');
      await switchTo3DReliably(this.extCtx);
      let currentMode = await getCurrentMode(this.ctx);
      if (currentMode !== '3D') {
        errors.push(`切換到 3D 後模式不正確：${currentMode}`);
      }

      console.log('  切換到 2D...');
      await ensureModeByText(this.extCtx, '2D');
      currentMode = await getCurrentMode(this.ctx);
      if (currentMode !== '2D') {
        errors.push(`切換到 2D 後模式不正確：${currentMode}`);
      }

      console.log('  再次切換到 3D...');
      await ensureModeByText(this.extCtx, '3D');
      currentMode = await getCurrentMode(this.ctx);
      if (currentMode !== '3D') {
        errors.push(`再次切換到 3D 後模式不正確：${currentMode}`);
      }

      if (errors.length === 0) {
        console.log('✅ 2D/3D 來回切換驗證通過');
      }

      return { passed: errors.length === 0, errors };
    } catch (error) {
      errors.push(`測試執行錯誤：${(error as Error).message}`);
      return { passed: false, errors };
    }
  }

  /**
   * 測試 6: 3D 模式應該顯示速度滑塊
   */
  async test_shouldShowSpeedSlider(): Promise<TestMethodResult> {
    const errors: string[] = [];
    console.log('🚀 開始測試：速度滑塊');

    try {
      await enterRace(this.ctx, 0);
      await selectPigeon(this.ctx, 0);
      await openTrajectory(this.ctx);
      await switchTo3DReliably(this.extCtx);

      const sliderInfo = await this.ctx.evaluateScript(`
        () => {
          const sliders = document.querySelectorAll('input[type="range"], mat-slider');
          const speedText = document.body.innerText.match(/\\d+x/);
          return {
            sliderCount: sliders.length,
            speedText: speedText ? speedText[0] : null
          };
        }
      `) as { sliderCount: number; speedText: string | null };

      if (sliderInfo.sliderCount === 0) {
        errors.push('未找到速度滑塊');
      } else {
        console.log(`  ✓ 找到 ${sliderInfo.sliderCount} 個滑塊控制`);
      }

      if (sliderInfo.speedText) {
        console.log(`  ✓ 當前速度：${sliderInfo.speedText}`);
      }

      if (errors.length === 0) {
        console.log('✅ 速度控制驗證通過');
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
export function createTestRunner(ctx: TestContext): TC04001Test {
  return new TC04001Test(ctx);
}
