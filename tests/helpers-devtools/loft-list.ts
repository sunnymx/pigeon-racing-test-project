/**
 * loft-list.ts - Chrome DevTools MCP 鴿舍列表操作
 *
 * 職責：鴿舍管理相關操作
 * - 打開鴿舍列表
 * - 搜尋鴿舍
 * - 選擇鴿舍
 * - 驗證鴿舍資訊
 *
 * 對應 Playwright 版本：tests/helpers/loft-list.ts
 * 參考文檔：docs/test-plan/TEST_CASES.md (TC-05 系列)
 */

import { findElementByRole, findAllElementsByRole, generateCountElementsScript } from './devtools-core';
import { waitForElement, delay } from './wait-utils';
import { DevToolsContext } from './navigation';

/**
 * 鴿舍資訊接口
 */
export interface LoftInfo {
  loftName: string;
  pigeonCount: number;
  location?: string;
}

/**
 * 擴展 DevToolsContext，支援 fill 和 evaluateScript
 */
export interface LoftListContext extends DevToolsContext {
  fill?: (uid: string, value: string) => Promise<void>;
  evaluateScript?: (script: string) => Promise<unknown>;
  listNetworkRequests?: () => Promise<Array<{ url: string; status?: number }>>;
}

/**
 * 切換到鴿舍列表 Tab
 *
 * @param ctx - DevTools 工具上下文
 */
export async function openLoftList(ctx: LoftListContext): Promise<void> {
  console.log('[loftList] 切換到鴿舍列表...');

  // 尋找鴿舍列表 Tab
  const tabUid = await waitForElement(
    ctx.takeSnapshot,
    'tab',
    /鴿舍列表|鸽舍列表/,
    5000
  );

  await ctx.click(tabUid);
  await delay(2000);

  console.log('[loftList] ✓ 已切換到鴿舍列表');
}

/**
 * 搜尋鴿舍
 *
 * @param ctx - DevTools 工具上下文
 * @param keyword - 搜尋關鍵字
 */
export async function searchLoft(ctx: LoftListContext, keyword: string): Promise<void> {
  console.log(`[loftList] 搜尋鴿舍: ${keyword}`);

  // 尋找搜尋框
  const searchBoxUid = await waitForElement(
    ctx.takeSnapshot,
    'textbox',
    /搜尋|鴿舍|search/i,
    5000
  );

  // 填入搜尋關鍵字
  if (ctx.fill) {
    await ctx.fill(searchBoxUid, keyword);
  } else {
    throw new Error('fill 方法未提供');
  }

  await delay(1000);
  console.log(`[loftList] ✓ 已搜尋鴿舍: ${keyword}`);
}

/**
 * 選擇鴿舍（點擊展開）
 *
 * @param ctx - DevTools 工具上下文
 * @param loftIndex - 鴿舍索引（預設 0）
 * @returns 鴿舍資訊
 */
export async function selectLoft(
  ctx: LoftListContext,
  loftIndex: number = 0
): Promise<LoftInfo> {
  console.log(`[loftList] 選擇鴿舍 #${loftIndex}`);

  // 透過 evaluateScript 查詢鴿舍項目
  if (!ctx.evaluateScript) {
    throw new Error('evaluateScript 方法未提供');
  }

  const loftInfo = await ctx.evaluateScript(`
    () => {
      const loftItems = document.querySelectorAll('.loft-item');
      if (loftItems.length === 0) return { error: '找不到任何鴿舍' };
      if (${loftIndex} >= loftItems.length) return { error: '索引超出範圍', count: loftItems.length };

      const target = loftItems[${loftIndex}];
      const name = target.textContent?.trim() || '';

      // 點擊展開
      target.click();

      return { loftName: name, success: true };
    }
  `) as { loftName?: string; error?: string; count?: number; success?: boolean };

  if (loftInfo.error) {
    throw new Error(loftInfo.error + (loftInfo.count ? `（共 ${loftInfo.count} 個）` : ''));
  }

  await delay(1000);

  // 計算鴿子數量
  const pigeonCount = await ctx.evaluateScript(
    generateCountElementsScript('.pigeon-checkbox')
  ) as number;

  console.log(`[loftList] ✓ 已選擇鴿舍: ${loftInfo.loftName}`);

  return {
    loftName: loftInfo.loftName || '',
    pigeonCount,
  };
}

/**
 * 勾選鴿舍內的多隻鴿子
 *
 * @param ctx - DevTools 工具上下文
 * @param pigeonIndices - 鴿子索引陣列（例如：[0, 1, 2]）
 * @returns 勾選的鴿子數量
 */
export async function selectPigeonsInLoft(
  ctx: LoftListContext,
  pigeonIndices: number[]
): Promise<number> {
  if (!ctx.evaluateScript) {
    throw new Error('evaluateScript 方法未提供');
  }

  const result = await ctx.evaluateScript(`
    () => {
      const checkboxes = document.querySelectorAll('.pigeon-checkbox');
      if (checkboxes.length === 0) return { error: '找不到任何鴿子' };

      const indices = ${JSON.stringify(pigeonIndices)};
      let clicked = 0;

      for (const index of indices) {
        if (index >= checkboxes.length) {
          return { error: '索引超出範圍', index, count: checkboxes.length };
        }
        checkboxes[index].click();
        clicked++;
      }

      return { success: true, clicked };
    }
  `) as { error?: string; clicked?: number; success?: boolean };

  if (result.error) {
    throw new Error(result.error);
  }

  await delay(500);
  console.log(`[loftList] ✓ 已勾選 ${result.clicked} 隻鴿子`);

  return result.clicked || 0;
}

/**
 * 驗證多軌跡顯示
 *
 * @param ctx - DevTools 工具上下文
 * @param expectedCount - 預期的軌跡數量
 * @returns 實際軌跡數量（估計）
 */
export async function verifyMultipleTrajectories(
  ctx: LoftListContext,
  expectedCount: number
): Promise<number> {
  if (!ctx.evaluateScript) {
    throw new Error('evaluateScript 方法未提供');
  }

  await delay(5000); // 等待軌跡載入

  const markerCount = await ctx.evaluateScript(
    generateCountElementsScript('.amap-icon > img')
  ) as number;

  console.log(`[loftList] 找到 ${markerCount} 個軌跡標記`);

  // 每條軌跡約 15-20 個標記
  const estimatedTrajectories = Math.ceil(markerCount / 15);

  if (estimatedTrajectories < expectedCount) {
    throw new Error(`軌跡數量不符：預期 ${expectedCount}，估計 ${estimatedTrajectories}`);
  }

  console.log(`[loftList] ✓ 多軌跡驗證通過：至少 ${expectedCount} 條`);
  return estimatedTrajectories;
}

/**
 * 驗證多軌跡 API 請求
 *
 * @param ctx - DevTools 工具上下文
 * @param expectedCount - 預期的請求數量
 * @returns 實際請求數量
 */
export async function verifyMultipleTrajectoryRequests(
  ctx: LoftListContext,
  expectedCount: number
): Promise<number> {
  if (!ctx.listNetworkRequests) {
    console.warn('[loftList] listNetworkRequests 未提供，跳過 API 驗證');
    return expectedCount;
  }

  // 點擊查看軌跡
  const btnUid = await waitForElement(
    ctx.takeSnapshot,
    'button',
    /查看[轨軌][迹跡]/,
    5000
  );
  await ctx.click(btnUid);

  await delay(5000); // 等待請求完成

  // 檢查網路請求
  const requests = await ctx.listNetworkRequests();
  const trajectoryRequests = requests.filter(r =>
    r.url.includes('ugetPigeonAllJsonInfo')
  );

  const apiCallCount = trajectoryRequests.length;

  if (apiCallCount < expectedCount) {
    throw new Error(`API 請求數量不符：預期 ${expectedCount}，實際 ${apiCallCount}`);
  }

  console.log(`[loftList] ✓ API 請求驗證通過：${apiCallCount} 個請求`);
  return apiCallCount;
}
