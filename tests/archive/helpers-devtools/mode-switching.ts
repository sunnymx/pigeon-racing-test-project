/**
 * mode-switching.ts - Chrome DevTools MCP 2D/3D 模式切換
 *
 * ⚠️ IMPORTANT: There are THREE types of mode buttons!
 * - Button Type 1: Preference selector (選擇鴿子畫面) - NOT used here
 * - Button Type 2: Map mode switcher (地圖功能選單) - ⭐ THIS IS WHAT WE USE
 * - Button Type 3: Static/Dynamic toggle (2D only)
 *
 * 職責：處理軌跡視圖中的 2D/3D 模式切換
 *
 * 對應 Playwright 版本：tests/helpers/mode-switching.ts
 * API 映射參考：dev/active/devtools-mcp-comparison/api-mapping.md
 */

import { findElementByRole, findAllElementsByRole, hasElement, getElementText } from './devtools-core';
import { waitForElement, waitForModeSwitch, delay } from './wait-utils';
import { getCurrentMode, DevToolsContext } from './navigation';
import type { ViewMode, SubMode2D } from '../shared/types';

/** 2D 子模式偵測結果 */
type ViewModeDetailed = '2D-static' | '2D-dynamic' | '3D' | 'unknown';

/**
 * 擴展 DevToolsContext，增加 evaluate_script 支援
 */
export interface DevToolsContextExtended extends DevToolsContext {
  evaluateScript?: (script: string) => Promise<unknown>;
}

/**
 * 根據按鈕文字確保進入指定模式
 *
 * 策略：
 * 1. 找到軌跡視圖中的模式切換按鈕（Button Type 2）
 * 2. 讀取按鈕顯示的文字
 * 3. 如果按鈕顯示 "3D模式"，則當前在 2D，點擊會進入 3D
 * 4. 如果按鈕顯示 "2D模式"，則當前在 3D，點擊會進入 2D
 *
 * @param ctx - DevTools 工具上下文
 * @param targetMode - 目標模式 '2D' | '3D'
 */
export async function ensureModeByText(
  ctx: DevToolsContextExtended,
  targetMode: ViewMode
): Promise<void> {
  console.log(`[ensureModeByText] 目標模式: ${targetMode}`);

  // 尋找模式切換按鈕 (Button Type 2)
  const snapshot = await ctx.takeSnapshot();
  const modeButtonUid = findElementByRole(snapshot, 'button', /[23]D模式/);

  if (!modeButtonUid) {
    throw new Error('找不到模式切換按鈕');
  }

  // 讀取按鈕文字
  const buttonText = getElementText(snapshot, modeButtonUid);
  console.log(`[ensureModeByText] 按鈕文字: ${buttonText}`);

  if (!buttonText) {
    throw new Error('無法讀取模式按鈕文字');
  }

  // 判斷是否需要切換
  // 按鈕顯示 "3D模式" → 當前在 2D → 點擊進入 3D
  // 按鈕顯示 "2D模式" → 當前在 3D → 點擊進入 2D
  const needSwitch =
    (targetMode === '3D' && buttonText.includes('3D')) ||
    (targetMode === '2D' && buttonText.includes('2D'));

  if (needSwitch) {
    console.log(`[ensureModeByText] 需要切換到 ${targetMode}`);
    await ctx.click(modeButtonUid);
    console.log('[ensureModeByText] ✓ 已點擊模式按鈕');

    // 等待模式切換完成
    await waitForModeSwitch(ctx.takeSnapshot, targetMode);

    // 驗證切換結果
    const actualMode = await getCurrentMode(ctx);
    if (actualMode !== targetMode) {
      throw new Error(`模式切換失敗：目標 ${targetMode}，實際 ${actualMode}`);
    }
    console.log(`[ensureModeByText] ✓ 已切換到 ${targetMode}`);
  } else {
    console.log(`[ensureModeByText] 按鈕顯示 "${buttonText}"，驗證當前模式...`);

    const actualMode = await getCurrentMode(ctx);
    if (actualMode === targetMode) {
      console.log(`[ensureModeByText] ✓ 已在 ${targetMode} 模式`);
    } else {
      console.log(`[ensureModeByText] ⚠️ 實際模式 ${actualMode}，強制切換...`);
      await ctx.click(modeButtonUid);
      await waitForModeSwitch(ctx.takeSnapshot, targetMode);

      const newMode = await getCurrentMode(ctx);
      if (newMode !== targetMode) {
        throw new Error(`強制切換失敗：目標 ${targetMode}，實際 ${newMode}`);
      }
      console.log(`[ensureModeByText] ✓ 強制切換成功`);
    }
  }
}

/**
 * 確保進入 2D 模式（簡單切換）
 *
 * @param ctx - DevTools 工具上下文
 */
export async function switchTo2DReliably(ctx: DevToolsContextExtended): Promise<void> {
  console.log('[switchTo2D] 切換到 2D 模式...');
  await ensureModeByText(ctx, '2D');
  console.log('[switchTo2D] ✓ 完成');
}

/**
 * 可靠的 3D 切換
 *
 * @param ctx - DevTools 工具上下文
 */
export async function switchTo3DReliably(ctx: DevToolsContextExtended): Promise<void> {
  console.log('[switchTo3D] 確保進入 3D 模式...');

  const currentMode = await getCurrentMode(ctx);
  console.log(`[switchTo3D] 當前模式: ${currentMode}`);

  if (currentMode === '3D') {
    console.log('[switchTo3D] ✓ 已在 3D 模式');
    return;
  }

  await ensureModeByText(ctx, '3D');

  // 等待 3D 特徵元素（視角按鈕）
  console.log('[switchTo3D] 等待 3D 載入...');
  await waitForElement(ctx.takeSnapshot, 'button', /[视視]角1/, 30000);

  // 額外等待
  await delay(3000);
  console.log('[switchTo3D] ✓ 3D 模式切換成功');
}

/**
 * 偵測當前視圖模式（含 2D 子模式）
 *
 * @param ctx - DevTools 工具上下文
 * @returns '2D-static' | '2D-dynamic' | '3D' | 'unknown'
 */
export async function detectCurrentViewMode(
  ctx: DevToolsContextExtended
): Promise<ViewModeDetailed> {
  const snapshot = await ctx.takeSnapshot();

  // 檢查 3D 特徵
  if (hasElement(snapshot, 'button', /[视視]角1/)) {
    return '3D';
  }

  // 檢查 2D 子模式（需透過 evaluate_script 計算標記數量）
  if (ctx.evaluateScript) {
    const markerCount = await ctx.evaluateScript(`
      () => document.querySelectorAll('.amap-icon > img').length
    `) as number;

    if (markerCount >= 15) {
      return '2D-static';
    } else if (markerCount > 0 && markerCount < 5) {
      return '2D-dynamic';
    }
  }

  // 後備：檢查 2D 特徵元素
  if (hasElement(snapshot, 'button', /timeline/i) ||
      hasElement(snapshot, 'button', /[静靜][态態]/)) {
    return '2D-static'; // 預設靜態
  }

  return 'unknown';
}

/**
 * 在 2D 模式下切換靜態/動態
 *
 * @param ctx - DevTools 工具上下文
 * @param targetSubMode - 'static' | 'dynamic'
 */
export async function switchSubMode2D(
  ctx: DevToolsContextExtended,
  targetSubMode: SubMode2D
): Promise<void> {
  const currentMode = await detectCurrentViewMode(ctx);

  if (!currentMode.startsWith('2D')) {
    throw new Error(`當前不在 2D 模式（當前：${currentMode}）`);
  }

  const isAlreadyTarget =
    (targetSubMode === 'static' && currentMode === '2D-static') ||
    (targetSubMode === 'dynamic' && currentMode === '2D-dynamic');

  if (isAlreadyTarget) {
    console.log(`[switchSubMode2D] ✓ 已在 2D ${targetSubMode} 模式`);
    return;
  }

  // 尋找切換按鈕
  const snapshot = await ctx.takeSnapshot();
  const toggleBtnUid = findElementByRole(snapshot, 'button', /切換動態|切换动态|timeline/i);

  if (!toggleBtnUid) {
    throw new Error('找不到靜態/動態切換按鈕');
  }

  await ctx.click(toggleBtnUid);
  await delay(2000);

  // 驗證切換結果
  const newMode = await detectCurrentViewMode(ctx);
  const expectedMode = targetSubMode === 'static' ? '2D-static' : '2D-dynamic';

  if (newMode !== expectedMode) {
    throw new Error(`切換失敗：預期 ${expectedMode}，實際 ${newMode}`);
  }

  console.log(`[switchSubMode2D] ✓ 已切換到 2D ${targetSubMode}`);
}

/**
 * 驗證模式按鈕文字與實際模式一致
 *
 * @param ctx - DevTools 工具上下文
 * @returns 驗證結果
 */
export async function verifyModeConsistency(ctx: DevToolsContextExtended): Promise<{
  buttonText: string;
  actualMode: string;
  isConsistent: boolean;
}> {
  const snapshot = await ctx.takeSnapshot();
  const modeButtonUid = findElementByRole(snapshot, 'button', /[23]D/);
  const buttonText = modeButtonUid ? getElementText(snapshot, modeButtonUid) || '' : '';
  const actualMode = await detectCurrentViewMode(ctx);

  // 按鈕顯示 "3D模式" 表示當前在 2D；顯示 "2D模式" 表示當前在 3D
  const isConsistent =
    (buttonText.includes('3D') && actualMode.startsWith('2D')) ||
    (buttonText.includes('2D') && actualMode === '3D');

  return { buttonText, actualMode, isConsistent };
}
