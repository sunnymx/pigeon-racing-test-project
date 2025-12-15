# 適應性等待規格

**檔案位置**: `tests/helpers/adaptive-wait.ts`
**優先級**: 🔴 必做
**預估行數**: ~120 行

---

## 1. 目的

取代硬等待 (`waitForTimeout`)，提供：
- 基於元素狀態的智能等待
- 多策略競爭機制
- 網路條件自適應

---

## 2. 問題分析

### 現有硬等待問題

```typescript
// ❌ 問題：固定等待時間
await page.waitForTimeout(2000);  // 網路慢時不夠，網路快時浪費
await page.waitForTimeout(3000);  // mode-switching.ts

// ❌ 問題：networkidle 超時風險
await page.waitForLoadState('networkidle');  // 地圖持續載入時會超時
```

### 解決方案

```typescript
// ✅ 解決：基於元素狀態等待
await WAIT_STRATEGIES.amap2DReady(page);

// ✅ 解決：多策略競爭
await Promise.race([strategy1, strategy2, strategy3]);
```

---

## 3. 介面定義

```typescript
export interface WaitOptions {
  timeout?: number;          // 預設 15000ms
  interval?: number;         // 輪詢間隔，預設 100ms
  throwOnTimeout?: boolean;  // 超時是否拋錯，預設 true
}

export interface WaitResult {
  success: boolean;
  strategy: string;          // 成功的策略名稱
  duration: number;          // 實際等待時間
  error?: Error;
}

export type WaitStrategy = (page: Page, options?: WaitOptions) => Promise<WaitResult>;
```

---

## 4. 等待策略定義

```typescript
// ============================================================================
// 2D 地圖等待策略
// ============================================================================

export const WAIT_STRATEGIES = {
  /**
   * 等待 2D 地圖 (AMap) 完全載入
   */
  amap2DReady: async (page: Page, options: WaitOptions = {}): Promise<WaitResult> => {
    const { timeout = 15000 } = options;
    const startTime = Date.now();

    try {
      // 多策略競爭：任一成功即返回
      await Promise.race([
        // 策略 1：Canvas 有效尺寸
        page.waitForFunction(
          () => {
            const canvas = document.querySelector('canvas.amap-layer') as HTMLCanvasElement;
            return canvas && canvas.width > 0 && canvas.height > 0;
          },
          { timeout }
        ),

        // 策略 2：地圖標記出現
        page.waitForFunction(
          () => document.querySelectorAll('.amap-icon').length > 0,
          { timeout }
        ),

        // 策略 3：AMap 實例可用
        page.waitForFunction(
          () => (window as any).AMap !== undefined,
          { timeout }
        ),
      ]);

      return {
        success: true,
        strategy: 'amap2DReady',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'amap2DReady',
        duration: Date.now() - startTime,
        error: error as Error,
      };
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
        min,
        { timeout }
      );

      return {
        success: true,
        strategy: 'trajectoryMarkersReady',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'trajectoryMarkersReady',
        duration: Date.now() - startTime,
        error: error as Error,
      };
    }
  },

  /**
   * 等待 3D 模式 (Cesium) 初始化
   *
   * 注意：window.Cesium 和 window.viewer 在此網站不可用（未暴露至全局）
   * 改用 DOM 元素檢測，已於 2025-12-05 透過 DevTools MCP 驗證
   * 參考：tests/devtools/adaptive-wait.md
   */
  cesium3DReady: async (page: Page, options: WaitOptions = {}): Promise<WaitResult> => {
    const { timeout = 30000 } = options;
    const startTime = Date.now();

    try {
      await Promise.all([
        // Cesium 容器 DOM 元素
        page.waitForSelector('.cesium-viewer', { timeout }),

        // Cesium widget DOM 元素
        page.waitForSelector('.cesium-widget', { timeout }),

        // 視角按鈕可見（3D 模式特有控制項）
        page.getByRole('button', { name: /[视視]角1/ }).waitFor({
          state: 'visible',
          timeout,
        }),
      ]);

      return {
        success: true,
        strategy: 'cesium3DReady',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'cesium3DReady',
        duration: Date.now() - startTime,
        error: error as Error,
      };
    }
  },

  /**
   * 等待 API 響應
   */
  apiResponse: async (
    page: Page,
    urlPattern: string,
    options: WaitOptions = {}
  ): Promise<WaitResult> => {
    const { timeout = 10000 } = options;
    const startTime = Date.now();

    try {
      await page.waitForResponse(
        response =>
          response.url().includes(urlPattern) && response.status() === 200,
        { timeout }
      );

      return {
        success: true,
        strategy: `apiResponse:${urlPattern}`,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        strategy: `apiResponse:${urlPattern}`,
        duration: Date.now() - startTime,
        error: error as Error,
      };
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
          return animations.length === 0 || animations.every(a => a.playState === 'finished');
        },
        { timeout }
      );

      return {
        success: true,
        strategy: 'animationComplete',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'animationComplete',
        duration: Date.now() - startTime,
        error: error as Error,
      };
    }
  },
};
```

---

## 5. 輔助函數

```typescript
/**
 * 等待多個策略中任一成功
 */
export async function waitForAny(
  strategies: Array<() => Promise<WaitResult>>
): Promise<WaitResult> {
  const results = await Promise.allSettled(strategies.map(s => s()));

  const success = results.find(
    r => r.status === 'fulfilled' && r.value.success
  );

  if (success && success.status === 'fulfilled') {
    return success.value;
  }

  // 返回第一個失敗結果
  const firstFailed = results[0];
  if (firstFailed.status === 'fulfilled') {
    return firstFailed.value;
  }

  return {
    success: false,
    strategy: 'waitForAny',
    duration: 0,
    error: new Error('All strategies failed'),
  };
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
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return lastResult!;
}
```

---

## 6. 使用範例

```typescript
// 取代硬等待
// ❌ 舊方式
await page.waitForTimeout(3000);

// ✅ 新方式
const result = await WAIT_STRATEGIES.amap2DReady(page);
if (!result.success) {
  throw new Error(`2D 地圖載入失敗: ${result.error?.message}`);
}
console.log(`✓ 2D 地圖載入完成 (${result.duration}ms)`);


// 等待軌跡標記
const markersResult = await WAIT_STRATEGIES.trajectoryMarkersReady(page, 15);
expect(markersResult.success).toBe(true);


// 等待 3D 模式
const cesiumResult = await WAIT_STRATEGIES.cesium3DReady(page, { timeout: 30000 });
if (!cesiumResult.success) {
  console.warn('3D 載入超時，嘗試繼續...');
}
```

---

## 7. 驗收標準

- [ ] 所有硬等待已替換為適應性等待
- [ ] 等待時間減少 30% 以上
- [ ] 超時錯誤減少 50% 以上
- [ ] 單元測試覆蓋率 > 80%
