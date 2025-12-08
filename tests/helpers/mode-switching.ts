/**
 * mode-switching.ts - 2D/3D 模式切換
 *
 * ⚠️ IMPORTANT UPDATE (2025-11-24): There are THREE types of mode buttons!
 *
 * Button Type 1: Preference selector (選擇鴿子畫面) - NOT used by this module
 * Button Type 2: Map mode switcher (地圖功能選單) - ⭐ THIS IS WHAT WE USE
 * Button Type 3: Static/Dynamic toggle (2D only)
 *
 * 職責：處理軌跡視圖中的 2D/3D 模式切換
 * - 操作 Button Type 2（地圖功能選單中的按鈕）
 * - 根據按鈕文字確保正確模式
 * - 實作可靠的 3D 切換
 * - 偵測當前視圖模式（2D-static / 2D-dynamic / 3D）
 *
 * 關鍵理解 (Button Type 2):
 * - 在 2D 地圖時，按鈕顯示「3D模式」→ 點擊進入 3D
 * - 在 3D 地圖時，按鈕顯示「2D模式」→ 點擊進入 2D
 * - 按鈕文字 = 點擊後將進入的模式（不是當前模式）
 *
 * 參考文檔：
 * - docs/guides/mode-switching.md
 * - docs/architecture/test-framework.md#2d3d-mode-architecture
 */

import { Page, expect } from '@playwright/test';
import { getCurrentMode } from './navigation';
import { waitForModeSwitch } from './wait-utils';

/**
 * 根據按鈕文字確保進入指定模式
 *
 * ⚠️ IMPORTANT: This function operates Button Type 2 (地圖功能選單中的模式切換按鈕)
 * NOT Button Type 1 (選擇鴿子畫面的偏好設定按鈕)
 *
 * 策略：
 * 1. 找到軌跡視圖中的模式切換按鈕（Button Type 2）
 * 2. 讀取按鈕顯示的文字
 * 3. 如果按鈕顯示 "3D模式"，則當前在 2D，點擊會進入 3D
 * 4. 如果按鈕顯示 "2D模式"，則當前在 3D，點擊會進入 2D
 *
 * @param page - Playwright Page 物件
 * @param targetMode - 目標模式 '2D' | '3D'
 * @throws 如果按鈕不存在或模式切換失敗
 */
export async function ensureModeByText(
  page: Page,
  targetMode: '2D' | '3D'
): Promise<void> {
  console.log(`🔄 ensureModeByText: target mode = ${targetMode}`);

  // Find Button Type 2: Map mode switcher button in trajectory view
  // ⚠️ FIXED (2025-11-25): Button shows different icons based on current mode:
  //   - In 3D mode: shows "2d 2D模式" (icon: 2d)
  //   - In 2D mode: shows "view_in_ar 3D模式" (icon: view_in_ar)
  // Use generic pattern to match both states
  const modeButton = page.getByRole('button', { name: /[23]D模式/ });

  // 確認按鈕存在
  await expect(modeButton).toBeVisible({ timeout: 5000 });

  // 讀取按鈕文字
  const buttonText = await modeButton.textContent();

  if (!buttonText) {
    throw new Error('❌ 無法讀取模式按鈕文字');
  }

  console.log(`📍 當前模式按鈕顯示：${buttonText.trim()}`);

  // Determine if we need to click based on button text
  // Button shows "3D模式" → currently in 2D → click if target is 3D
  // Button shows "2D模式" → currently in 3D → click if target is 2D
  const needSwitch =
    (targetMode === '3D' && buttonText.includes('3D')) ||
    (targetMode === '2D' && buttonText.includes('2D'));

  if (needSwitch) {
    console.log(`🔄 需要切換到 ${targetMode} 模式 (按鈕顯示 "${buttonText.trim()}")`);

    // Click the button to switch mode
    await modeButton.click({ force: true });
    console.log(`  ✓ 已點擊模式切換按鈕`);

    // Wait for mode switch to complete
    await waitForModeSwitch(page, targetMode);

    // Verify with getCurrentMode()
    const actualMode = await getCurrentMode(page);
    if (actualMode !== targetMode) {
      throw new Error(`❌ 模式切換失敗：目標 ${targetMode}，實際 ${actualMode}`);
    }

    console.log(`✅ 已成功切換到 ${targetMode} 模式`);
  } else {
    // Button text suggests we're already in target mode
    console.log(`📍 按鈕顯示 "${buttonText.trim()}" → 可能已在 ${targetMode} 模式，驗證中...`);

    // Verify with getCurrentMode()
    const actualMode = await getCurrentMode(page);
    if (actualMode === targetMode) {
      console.log(`✅ 確認已在 ${targetMode} 模式`);
    } else {
      console.log(`⚠️  實際模式 (${actualMode}) 與預期不符，嘗試切換...`);

      // Force click even though button text suggests otherwise
      await modeButton.click({ force: true });
      console.log(`  ✓ 已點擊模式切換按鈕`);

      await waitForModeSwitch(page, targetMode);

      const newMode = await getCurrentMode(page);
      if (newMode !== targetMode) {
        throw new Error(`❌ 強制切換後仍失敗：目標 ${targetMode}，實際 ${newMode}`);
      }

      console.log(`✅ 已成功切換到 ${targetMode} 模式`);
    }
  }
}

/**
 * 確保進入 2D 模式（簡單切換）
 *
 * ⚠️ 重要：此函數僅執行基本的模式切換，不解決「首次載入失敗」問題
 * 如果遇到 gpx2d undefined 錯誤，請使用 trajectory-reload.ts 中的 reload2DTrajectory()
 *
 * 已知問題 #1 唯一有效解決方案：重新加載軌跡（見 trajectory-reload.ts）
 * ⚠️ 3D→2D 切換或靜態/動態切換無法解決此問題
 *
 * @param page - Playwright Page 物件
 * @throws 如果切換失敗
 *
 * 參考：
 * - docs/test-plan/KNOWN_ISSUES_SOLUTIONS.md#問題-1
 * - docs/guides/troubleshooting.md#問題-1
 */
export async function switchTo2DReliably(page: Page): Promise<void> {
  console.log('🔄 切換到 2D 模式...');
  console.log('⚠️  注意：如果首次載入失敗，請使用 reload2DTrajectory()');

  // 簡單切換到 2D
  await ensureModeByText(page, '2D');

  console.log('✅ 2D 模式切換完成（基本切換）');
  console.log('💡 提示：如遇 gpx2d undefined，請在測試中調用 reload2DTrajectory()');
}

/**
 * 可靠的 3D 切換（確保進入 3D 模式）
 *
 * @param page - Playwright Page 物件
 * @throws 如果切換失敗
 */
export async function switchTo3DReliably(page: Page): Promise<void> {
  console.log('🔄 確保進入 3D 模式...');

  // 先檢查當前模式
  const currentMode = await getCurrentMode(page);
  console.log(`📍 當前模式：${currentMode}`);

  if (currentMode === '3D') {
    console.log('✅ 已在 3D 模式，無需切換');
    return;
  }

  // 如果在 2D，執行切換
  console.log('🔄 從 2D 切換到 3D...');
  await ensureModeByText(page, '3D');

  // 等待 3D 模式載入 - 使用視覺元素檢查，不依賴 window.Cesium
  console.log('⏳ 等待 3D 模式載入...');

  // 驗證 3D 特徵元素（視角按鈕）
  // 使用正則匹配繁簡體：視角/视角
  const view1Button = page.getByRole('button', { name: /[视視]角1/ });
  await expect(view1Button).toBeVisible({ timeout: 30000 });
  console.log('  ✓ 視角控制按鈕已顯示');

  // 額外等待確保 3D 完全初始化
  await page.waitForTimeout(3000);

  console.log('✅ 3D 模式切換成功');
}

/**
 * 偵測當前視圖模式
 *
 * 策略：
 * - 檢查 3D 特徵元素（視角按鈕）→ 3D 模式
 * - 檢查軌跡標記數量 → 2D-static (≥15) vs 2D-dynamic (<5)
 *
 * @param page - Playwright Page 物件
 * @returns '2D-static' | '2D-dynamic' | '3D' | 'unknown'
 */
export async function detectCurrentViewMode(
  page: Page
): Promise<'2D-static' | '2D-dynamic' | '3D' | 'unknown'> {
  // 先用通用的模式檢測取得大類別（2D/3D）
  const coarseMode = await getCurrentMode(page);

  // 檢查 3D 特徵（支援簡繁體）
  const view1Button = page.getByRole('button', { name: /[视視]角1/ });
  const is3D = await view1Button.isVisible().catch(() => false);

  if (is3D) {
    return '3D';
  }

  // 檢查 2D 模式下的標記數量（紅色軌跡標記點）
  const markers = page.locator('.amap-icon > img');
  const markerCount = await markers.count().catch(() => 0);

  if (markerCount >= 15) {
    return '2D-static';
  } else if (markerCount > 0 && markerCount < 5) {
    return '2D-dynamic';
  }

  // 後備：如果已確定在 2D，但未能依標記數判斷子模式，預設回傳 2D-static
  if (coarseMode === '2D') {
    console.log('[mode] fallback to 2D-static due to ambiguous marker count');
    return '2D-static';
  }

  return 'unknown';
}

/**
 * 在 2D 模式下切換靜態/動態
 *
 * 策略：點擊 timeline 按鈕
 * - 靜態模式：15-20 個標記點
 * - 動態模式：1-3 個標記點
 *
 * @param page - Playwright Page 物件
 * @param targetSubMode - 'static' | 'dynamic'
 * @throws 如果不在 2D 模式或切換失敗
 */
export async function switchSubMode2D(
  page: Page,
  targetSubMode: 'static' | 'dynamic'
): Promise<void> {
  const currentMode = await detectCurrentViewMode(page);

  if (!currentMode.startsWith('2D')) {
    throw new Error(`❌ 當前不在 2D 模式（當前：${currentMode}）`);
  }

  const isAlreadyTarget =
    (targetSubMode === 'static' && currentMode === '2D-static') ||
    (targetSubMode === 'dynamic' && currentMode === '2D-dynamic');

  if (isAlreadyTarget) {
    console.log(`✅ 已在 2D ${targetSubMode} 模式`);
    return;
  }

  // 優先點擊右上角「切換動態/靜態模式」按鈕；若不存在，退回 timeline 按鈕
  const toggleButton = page.getByRole('button', {
    name: /切換動態\/靜態模式|切换动态\/静态模式/,
  });
  const hasToggle = (await toggleButton.count()) > 0;

  if (hasToggle) {
    await toggleButton.first().click();
  } else {
    const timelineButton = page.getByRole('button').filter({ hasText: 'timeline' });
    await timelineButton.click();
  }

  await page.waitForTimeout(2000);

  // 驗證切換成功
  const newMode = await detectCurrentViewMode(page);
  const expectedMode = targetSubMode === 'static' ? '2D-static' : '2D-dynamic';

  if (newMode !== expectedMode) {
    throw new Error(`❌ 切換失敗：預期 ${expectedMode}，實際 ${newMode}`);
  }

  console.log(`✅ 已切換到 2D ${targetSubMode} 模式`);
}

/**
 * 驗證模式按鈕文字與實際模式一致（用於測試）
 *
 * @param page - Playwright Page 物件
 * @returns { buttonText: string, actualMode: string, isConsistent: boolean }
 */
export async function verifyModeConsistency(page: Page): Promise<{
  buttonText: string;
  actualMode: string;
  isConsistent: boolean;
}> {
  const modeButton = page.getByRole('button', { name: /2D|3D/ }).first();
  const buttonText = (await modeButton.textContent())?.trim() || '';
  const actualMode = await detectCurrentViewMode(page);

  const isConsistent =
    (buttonText.includes('3D') && actualMode.startsWith('2D')) ||
    (buttonText.includes('2D') && actualMode === '3D');

  return {
    buttonText,
    actualMode,
    isConsistent,
  };
}
