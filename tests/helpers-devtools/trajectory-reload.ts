/**
 * trajectory-reload.ts - Chrome DevTools MCP 軌跡重新加載
 *
 * 職責：解決已知問題 #1 - 2D 軌跡初次加載失敗
 * 策略：通過「重新選擇鴿子 → 查看軌跡」流程觸發數據重新加載
 *
 * 對應 Playwright 版本：tests/helpers/trajectory-reload.ts
 * 參考文檔：docs/test-plan/KNOWN_ISSUES_SOLUTIONS.md#問題-1
 */

import { findElementByRole, findAllElementsByRole, generateCountElementsScript } from './devtools-core';
import { waitForElement, delay } from './wait-utils';
import { DevToolsContext, enterRace, selectPigeon, openTrajectory } from './navigation';
import { ensureModeByText, DevToolsContextExtended } from './mode-switching';

/**
 * 重新加載 2D 軌跡數據
 *
 * @param ctx - DevTools 工具上下文（擴展版，含 evaluateScript）
 * @param pigeonIndex - 鴿子索引（預設為 0）
 * @param maxRetries - 最大重試次數（預設 3）
 * @returns 是否成功加載
 */
export async function reload2DTrajectory(
  ctx: DevToolsContextExtended,
  pigeonIndex: number = 0,
  maxRetries: number = 3
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[reload2D] 嘗試加載 (第 ${attempt + 1}/${maxRetries} 次)...`);

      // 步驟1: 檢查是否在鴿子列表頁面
      const snapshot = await ctx.takeSnapshot();
      const hasTable = snapshot.includes('table') || snapshot.includes('row');

      if (!hasTable) {
        console.log('[reload2D] 不在鴿子列表，嘗試返回...');

        // 尋找返回按鈕
        const backBtnUid = findElementByRole(snapshot, 'button', /返回|關閉|close|back|×/i);
        if (backBtnUid) {
          await ctx.click(backBtnUid);
          await delay(2000);
          console.log('[reload2D] ✓ 已點擊返回按鈕');
        } else {
          // 重新進入賽事
          console.log('[reload2D] 未找到返回按鈕，重新進入賽事...');
          await enterRace(ctx, 0);
        }
      } else {
        console.log('[reload2D] ✓ 已在鴿子列表頁面');
      }

      // 步驟2: 取消之前的選擇
      const snapshot2 = await ctx.takeSnapshot();
      const checkedBoxes = findAllElementsByRole(snapshot2, 'checkbox');
      // 注意：這裡簡化處理，實際可能需要檢查 checked 狀態
      // 透過再次點擊來取消選擇

      // 步驟3: 重新選擇鴿子
      await selectPigeon(ctx, pigeonIndex);

      // 步驟4: 點擊查看軌跡
      await openTrajectory(ctx);

      // 步驟5: 等待數據加載
      await delay(3000);
      console.log('[reload2D] 等待數據加載...');

      // 步驟6: 確保在 2D 模式
      const snapshot3 = await ctx.takeSnapshot();
      const has3DButton = findElementByRole(snapshot3, 'button', /2D[模模][式式]/);
      if (has3DButton) {
        console.log('[reload2D] 當前在 3D 模式，切換到 2D...');
        await ensureModeByText(ctx, '2D');
      }

      // 步驟7: 驗證 2D 地圖加載
      if (ctx.evaluateScript) {
        const markerCount = await ctx.evaluateScript(
          generateCountElementsScript('.amap-icon > img')
        ) as number;

        const canvasCount = await ctx.evaluateScript(
          generateCountElementsScript('canvas.amap-layer')
        ) as number;

        const containerVisible = await ctx.evaluateScript(`
          () => {
            const container = document.querySelector('.amap-container');
            return container && container.offsetWidth > 0;
          }
        `) as boolean;

        if ((canvasCount > 0 || containerVisible) && markerCount > 0) {
          console.log(`[reload2D] ✓ 2D 軌跡加載成功！`);
          console.log(`   - Canvas: ${canvasCount}, 標記點: ${markerCount}`);
          return true;
        } else {
          console.warn(`[reload2D] 軌跡未完全加載 (Canvas: ${canvasCount}, 標記: ${markerCount})`);
        }
      } else {
        // 沒有 evaluateScript，只能透過 a11y 快照判斷
        const snapshot4 = await ctx.takeSnapshot();
        const hasTimeline = findElementByRole(snapshot4, 'button', /timeline/i);
        if (hasTimeline) {
          console.log('[reload2D] ✓ 2D 軌跡加載成功（透過 timeline 按鈕判斷）');
          return true;
        }
      }
    } catch (error) {
      console.error(`[reload2D] 第 ${attempt + 1} 次加載失敗:`, error);
      if (attempt === maxRetries - 1) {
        throw new Error(`2D 軌跡加載失敗，已重試 ${maxRetries} 次`);
      }
    }
  }

  return false;
}

/**
 * 確保處於 2D 靜態模式
 *
 * @param ctx - DevTools 工具上下文
 * @returns 是否成功切換到靜態模式
 */
export async function ensure2DStaticMode(ctx: DevToolsContextExtended): Promise<boolean> {
  const snapshot = await ctx.takeSnapshot();

  // 檢查是否有暫停按鈕（動態模式特徵）
  const hasPauseBtn = findElementByRole(snapshot, 'button', /pause|暫停/);

  if (hasPauseBtn) {
    console.log('[ensure2DStatic] 當前為動態模式，切換到靜態...');

    // 尋找 timeline 按鈕
    const timelineBtnUid = findElementByRole(snapshot, 'button', /timeline/i);
    if (timelineBtnUid) {
      await ctx.click(timelineBtnUid);
      await delay(1000);
    }
  }

  // 驗證靜態模式：軌跡點數量 >= 15
  if (ctx.evaluateScript) {
    const markerCount = await ctx.evaluateScript(
      generateCountElementsScript('.amap-icon > img')
    ) as number;

    if (markerCount >= 15) {
      console.log(`[ensure2DStatic] ✓ 已在 2D 靜態模式，軌跡點: ${markerCount}`);
      return true;
    } else {
      console.warn(`[ensure2DStatic] 軌跡點不足 (${markerCount})`);
      return false;
    }
  }

  // 沒有 evaluateScript，假設成功
  console.log('[ensure2DStatic] ✓ 已切換到靜態模式（無法驗證標記點數量）');
  return true;
}
