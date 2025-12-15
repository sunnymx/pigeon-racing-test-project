/**
 * adaptive-wait.ts - 適應性等待策略
 *
 * 規格來源: dev/active/test-flow-refactor/specs/adaptive-wait.spec.md
 * 優先級: 🔴 必做
 *
 * 功能：取代硬等待，提供基於元素狀態的智能等待
 * - 多策略競爭機制
 * - 網路條件自適應
 * - 統一的 WaitResult 介面
 */

import { Page } from '@playwright/test';

// ============================================================================
// 型別定義
// ============================================================================

export interface WaitOptions {
  timeout?: number;
  interval?: number;
  throwOnTimeout?: boolean;
}

export interface WaitResult {
  success: boolean;
  strategy: string;
  duration: number;
  error?: Error;
}

export type WaitStrategy = (page: Page, options?: WaitOptions) => Promise<WaitResult>;

// ============================================================================
// 等待策略
// ============================================================================

export const WAIT_STRATEGIES = {
  /**
   * 等待 2D 地圖 (AMap) 完全載入
   */
  amap2DReady: async (page: Page, options: WaitOptions = {}): Promise<WaitResult> => {
    const { timeout = 15000 } = options;
    const startTime = Date.now();

    try {
      await Promise.race([
        page.waitForFunction(
          () => {
            const canvas = document.querySelector('canvas.amap-layer') as HTMLCanvasElement;
            return canvas && canvas.width > 0 && canvas.height > 0;
          },
          { timeout }
        ),
        page.waitForFunction(
          () => document.querySelectorAll('.amap-icon').length > 0,
          { timeout }
        ),
        page.waitForFunction(
          () => (window as any).AMap !== undefined,
          { timeout }
        ),
      ]);

      return { success: true, strategy: 'amap2DReady', duration: Date.now() - startTime };
    } catch (error) {
      return { success: false, strategy: 'amap2DReady', duration: Date.now() - startTime, error: error as Error };
    }
  },

  /**
   * 等待軌跡標記點載入 (靜態模式)
   */
  trajectoryMarkersReady: async (
    page: Page,
    minCount: number = 15,
    options: WaitOptions = {}
  ): Promise<WaitResult> => {
    const { timeout = 10000 } = options;
    const startTime = Date.now();

    try {
      await page.waitForFunction(
        (min) => document.querySelectorAll('.amap-icon > img').length >= min,
        minCount,
        { timeout }
      );
      return { success: true, strategy: 'trajectoryMarkersReady', duration: Date.now() - startTime };
    } catch (error) {
      return { success: false, strategy: 'trajectoryMarkersReady', duration: Date.now() - startTime, error: error as Error };
    }
  },

  /**
   * 等待 3D 模式 (Cesium) 初始化
   * 注意：使用 DOM 元素檢測，不依賴 window.Cesium
   */
  cesium3DReady: async (page: Page, options: WaitOptions = {}): Promise<WaitResult> => {
    const { timeout = 30000 } = options;
    const startTime = Date.now();

    try {
      await Promise.all([
        page.waitForSelector('.cesium-viewer', { timeout }),
        page.waitForSelector('.cesium-widget', { timeout }),
        page.getByRole('button', { name: /[视視]角1/ }).waitFor({ state: 'visible', timeout }),
      ]);
      return { success: true, strategy: 'cesium3DReady', duration: Date.now() - startTime };
    } catch (error) {
      return { success: false, strategy: 'cesium3DReady', duration: Date.now() - startTime, error: error as Error };
    }
  },

  /**
   * 等待 API 響應
   */
  apiResponse: async (page: Page, urlPattern: string, options: WaitOptions = {}): Promise<WaitResult> => {
    const { timeout = 10000 } = options;
    const startTime = Date.now();

    try {
      await page.waitForResponse(
        (response) => response.url().includes(urlPattern) && response.status() === 200,
        { timeout }
      );
      return { success: true, strategy: `apiResponse:${urlPattern}`, duration: Date.now() - startTime };
    } catch (error) {
      return { success: false, strategy: `apiResponse:${urlPattern}`, duration: Date.now() - startTime, error: error as Error };
    }
  },

  /**
   * 等待動畫完成
   */
  animationComplete: async (page: Page, options: WaitOptions = {}): Promise<WaitResult> => {
    const { timeout = 5000 } = options;
    const startTime = Date.now();

    try {
      await page.waitForFunction(
        () => {
          const animations = document.getAnimations();
          return animations.length === 0 || animations.every((a) => a.playState === 'finished');
        },
        { timeout }
      );
      return { success: true, strategy: 'animationComplete', duration: Date.now() - startTime };
    } catch (error) {
      return { success: false, strategy: 'animationComplete', duration: Date.now() - startTime, error: error as Error };
    }
  },
};

// ============================================================================
// 輔助函數
// ============================================================================

/**
 * 等待多個策略中任一成功
 */
export async function waitForAny(strategies: Array<() => Promise<WaitResult>>): Promise<WaitResult> {
  const results = await Promise.allSettled(strategies.map((s) => s()));
  const success = results.find((r) => r.status === 'fulfilled' && r.value.success);

  if (success && success.status === 'fulfilled') {
    return success.value;
  }

  const firstFailed = results[0];
  if (firstFailed.status === 'fulfilled') {
    return firstFailed.value;
  }

  return { success: false, strategy: 'waitForAny', duration: 0, error: new Error('All strategies failed') };
}

/**
 * 帶重試的等待
 */
export async function waitWithRetry(
  strategy: () => Promise<WaitResult>,
  maxRetries: number = 2
): Promise<WaitResult> {
  let lastResult: WaitResult | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResult = await strategy();
    if (lastResult.success) {
      return lastResult;
    }
    if (attempt < maxRetries) {
      console.log(`⚠️ 等待失敗，重試 ${attempt + 1}/${maxRetries}...`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return lastResult!;
}
