/**
 * navigation.ts - Chrome DevTools MCP 導航輔助函數
 *
 * 職責：自動化基本用戶流程
 * - 進入賽事
 * - 選擇鴿子
 * - 打開軌跡視圖
 *
 * 對應 Playwright 版本：tests/helpers/navigation.ts
 * API 映射參考：dev/active/devtools-mcp-comparison/api-mapping.md
 */

import { findElementByRole, findAllElementsByRole, hasElement } from './devtools-core';
import { waitForElement, delay } from './wait-utils';
import type { ViewMode } from '../shared/types';

/**
 * DevTools MCP 工具注入介面
 * 允許函數接受 MCP 工具作為參數，實現依賴注入
 */
export interface DevToolsContext {
  navigatePage: (url: string) => Promise<void>;
  takeSnapshot: () => Promise<string>;
  click: (uid: string) => Promise<void>;
  waitFor: (text: string, timeout?: number) => Promise<void>;
}

/**
 * 進入指定索引的賽事
 *
 * @param ctx - DevTools 工具上下文
 * @param raceIndex - 賽事索引（預設為 0）
 */
export async function enterRace(
  ctx: DevToolsContext,
  raceIndex: number = 0
): Promise<void> {
  console.log(`[enterRace] 進入賽事 #${raceIndex}`);

  // 導航到首頁
  await ctx.navigatePage('https://skyracing.com.cn/');
  await delay(2000); // 等待頁面載入

  // 取得快照並尋找所有「進入」按鈕
  const snapshot = await ctx.takeSnapshot();
  const enterButtons = findAllElementsByRole(snapshot, 'button')
    .filter(uid => {
      const line = snapshot.split('\n').find(l => l.includes(`uid=${uid}`));
      return line && /进入|進入/.test(line);
    });

  if (enterButtons.length === 0) {
    throw new Error('找不到任何賽事的「進入」按鈕');
  }

  if (raceIndex >= enterButtons.length) {
    throw new Error(`賽事索引 ${raceIndex} 超出範圍，共有 ${enterButtons.length} 個賽事`);
  }

  // 點擊指定索引的按鈕
  await ctx.click(enterButtons[raceIndex]);
  console.log(`[enterRace] ✓ 已點擊進入按鈕`);

  // 等待賽事詳情頁載入
  await ctx.waitFor('查看', 10000);
  await delay(1000);
  console.log('[enterRace] ✓ 賽事詳情頁已載入');
}

/**
 * 選擇指定索引的鴿子（勾選 checkbox）
 *
 * @param ctx - DevTools 工具上下文
 * @param pigeonIndex - 鴿子索引（預設為 0）
 * @returns 勾選後的數量（從 UI 解析）
 */
export async function selectPigeon(
  ctx: DevToolsContext,
  pigeonIndex: number = 0
): Promise<number> {
  console.log(`[selectPigeon] 選擇鴿子 #${pigeonIndex}`);

  // 取得快照並尋找所有 checkbox
  const snapshot = await ctx.takeSnapshot();
  const checkboxes = findAllElementsByRole(snapshot, 'checkbox');

  if (checkboxes.length === 0) {
    throw new Error('找不到任何鴿子 checkbox');
  }

  if (pigeonIndex >= checkboxes.length) {
    throw new Error(`鴿子索引 ${pigeonIndex} 超出範圍，共有 ${checkboxes.length} 隻鴿子`);
  }

  // 點擊指定索引的 checkbox
  await ctx.click(checkboxes[pigeonIndex]);
  await delay(500);
  console.log('[selectPigeon] ✓ 已勾選鴿子');

  // 解析勾選數量
  const updatedSnapshot = await ctx.takeSnapshot();
  const match = updatedSnapshot.match(/勾[选選]清[单單]\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * 點擊「查看軌跡」按鈕打開軌跡視圖
 *
 * @param ctx - DevTools 工具上下文
 */
export async function openTrajectory(ctx: DevToolsContext): Promise<void> {
  console.log('[openTrajectory] 打開軌跡視圖');

  // 等待並尋找「查看軌跡」按鈕
  const buttonUid = await waitForElement(
    ctx.takeSnapshot,
    'button',
    /查看[轨軌][迹跡]/,
    5000
  );

  await ctx.click(buttonUid);
  console.log('[openTrajectory] ✓ 已點擊查看軌跡按鈕');

  // 等待地圖載入
  await delay(3000);
  console.log('[openTrajectory] ✓ 軌跡視圖已載入');
}

/**
 * 取得當前模式（2D 或 3D）
 *
 * 偵測策略：
 * - 3D: 檢查「視角1」按鈕是否存在
 * - 2D: 檢查 .amap-container 相關元素
 *
 * @param ctx - DevTools 工具上下文
 * @returns '2D' | '3D' | 'unknown'
 */
export async function getCurrentMode(
  ctx: DevToolsContext
): Promise<ViewMode | 'unknown'> {
  console.log('[getCurrentMode] 偵測當前模式...');

  const snapshot = await ctx.takeSnapshot();

  // Layer 1: 檢查 3D 特有控制項（視角按鈕）
  if (hasElement(snapshot, 'button', /[视視]角1/)) {
    console.log('[getCurrentMode] ✓ 偵測到 3D 模式');
    return '3D';
  }

  // Layer 2: 檢查 2D 特有元素（透過快照文字判斷）
  // 注意：a11y 快照可能不包含 .amap-container，改用其他 2D 特徵
  if (hasElement(snapshot, 'button', /timeline/i) ||
      hasElement(snapshot, 'button', /[静靜][态態][轨軌][迹跡]/)) {
    console.log('[getCurrentMode] ✓ 偵測到 2D 模式');
    return '2D';
  }

  console.log('[getCurrentMode] ⚠️ 無法確定當前模式');
  return 'unknown';
}

/**
 * 設定偏好模式（選擇鴿子畫面的偏好選擇器）
 *
 * @param ctx - DevTools 工具上下文
 * @param preferredMode - 偏好模式 '2D' | '3D'
 */
export async function setPreferredMode(
  ctx: DevToolsContext,
  preferredMode: ViewMode
): Promise<void> {
  console.log(`[setPreferredMode] 設定偏好: ${preferredMode}`);

  const snapshot = await ctx.takeSnapshot();

  // 尋找偏好切換按鈕（exact match: "2D" 或 "3D"）
  const button2D = findElementByRole(snapshot, 'button', /^2D$/);
  const button3D = findElementByRole(snapshot, 'button', /^3D$/);

  if (!button2D && !button3D) {
    console.log('[setPreferredMode] ⚠️ 未找到偏好按鈕，跳過');
    return;
  }

  const currentPref = button3D ? '3D' : '2D';
  console.log(`[setPreferredMode] 當前偏好: ${currentPref}`);

  if (currentPref !== preferredMode) {
    const buttonToClick = button2D || button3D;
    if (buttonToClick) {
      await ctx.click(buttonToClick);
      await delay(500);
      console.log(`[setPreferredMode] ✓ 已切換至 ${preferredMode}`);
    }
  } else {
    console.log(`[setPreferredMode] ✓ 已是 ${preferredMode}`);
  }
}

/**
 * 組合函數：從首頁到軌跡視圖的完整流程
 *
 * @param ctx - DevTools 工具上下文
 * @param raceIndex - 賽事索引
 * @param pigeonIndex - 鴿子索引
 * @returns 當前模式
 */
export async function navigateToTrajectoryView(
  ctx: DevToolsContext,
  raceIndex: number = 0,
  pigeonIndex: number = 0
): Promise<ViewMode | 'unknown'> {
  await enterRace(ctx, raceIndex);
  await selectPigeon(ctx, pigeonIndex);
  await openTrajectory(ctx);
  return getCurrentMode(ctx);
}
