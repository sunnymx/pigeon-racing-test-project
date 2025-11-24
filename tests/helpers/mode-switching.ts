/**
 * mode-switching.ts - 2D/3D 模式切換
 *
 * 職責：處理 2D/3D 模式切換的不穩定性
 * - 根據按鈕文字確保正確模式
 * - 確保進入 2D 模式（注意：已知問題 #1 的解決方案在 trajectory-reload.ts）
 * - 實作可靠的 3D 切換
 * - 偵測當前視圖模式（2D-static / 2D-dynamic / 3D）
 *
 * ⚠️ 重要：已知問題 #1「2D 軌跡初次載入失敗」的推薦解決方案是「重新加載軌跡」
 * 請使用 trajectory-reload.ts 中的 reload2DTrajectory() 函數
 *
 * 關鍵理解：按鈕顯示的文字（"2D" 或 "3D"）指示點擊後將進入的模式
 *
 * 參考文檔：
 * - docs/test-plan/KNOWN_ISSUES_SOLUTIONS.md#問題-1 (方法1: 重新加載軌跡)
 * - docs/guides/troubleshooting.md
 * - docs/architecture/test-framework.md#2d3d-mode-architecture
 */

import { Page, expect } from '@playwright/test';
import { getCurrentMode } from './navigation';
import { waitForModeSwitch } from './wait-utils';

/**
 * 根據按鈕文字確保進入指定模式
 *
 * 策略：
 * 1. 讀取按鈕顯示的文字
 * 2. 如果按鈕顯示 "3D"，則當前在 2D，點擊會進入 3D
 * 3. 如果按鈕顯示 "2D"，則當前在 3D，點擊會進入 2D
 *
 * @param page - Playwright Page 物件
 * @param targetMode - 目標模式 '2D' | '3D'
 * @throws 如果按鈕不存在或模式切換失敗
 */
export async function ensureModeByText(
  page: Page,
  targetMode: '2D' | '3D'
): Promise<void> {
  // 尋找模式切換按鈕（可能顯示 "2D" 或 "3D"）
  const modeButton = page.getByRole('button', { name: /2D|3D/ }).first();

  // 確認按鈕存在
  await expect(modeButton).toBeVisible({ timeout: 5000 });

  // 讀取按鈕文字
  const buttonText = await modeButton.textContent();

  if (!buttonText) {
    throw new Error('❌ 無法讀取模式按鈕文字');
  }

  console.log(`📍 當前模式按鈕顯示：${buttonText.trim()}`);

  // 判斷是否需要切換
  const needSwitch =
    (targetMode === '3D' && buttonText.includes('3D')) ||
    (targetMode === '2D' && buttonText.includes('2D'));

  if (needSwitch) {
    console.log(`🔄 需要切換到 ${targetMode} 模式`);

    // Store current button text before clicking
    const beforeText = buttonText.trim();

    // Click with force option to overcome potential overlays
    await modeButton.click({ force: true });
    console.log(`  ✓ 已點擊模式切換按鈕`);

    // Wait for button text to change (indicates mode switch started)
    await page.waitForTimeout(1000);

    // Verify button text changed
    const afterText = await modeButton.textContent().catch(() => '');
    if (afterText && afterText.trim() === beforeText) {
      console.log(`  ⚠️  按鈕文字未改變，嘗試再次點擊`);
      await page.waitForTimeout(500);
      await modeButton.click({ force: true });
    }

    await waitForModeSwitch(page, targetMode);
  } else {
    // Button suggests we're already in target mode, but verify this is true
    console.log(`📍 按鈕顯示已在 ${targetMode} 模式，驗證中...`);

    // Verify by checking for characteristic elements
    if (targetMode === '3D') {
      const view1Button = page.getByRole('button', { name: '視角1' });
      const is3D = await view1Button.isVisible().catch(() => false);

      if (!is3D) {
        console.log(`⚠️  視角按鈕未顯示，強制切換到 3D 模式`);

        // Store current button text
        const beforeText = buttonText.trim();

        // Click with force
        await modeButton.click({ force: true });
        console.log(`  ✓ 已點擊模式切換按鈕`);

        // Wait and verify button text changed
        await page.waitForTimeout(1000);
        const afterText = await modeButton.textContent().catch(() => '');
        if (afterText && afterText.trim() === beforeText) {
          console.log(`  ⚠️  按鈕文字未改變，嘗試再次點擊`);
          await page.waitForTimeout(500);
          await modeButton.click({ force: true });
        }

        await waitForModeSwitch(page, targetMode);
      } else {
        console.log(`✅ 已在 ${targetMode} 模式（已驗證）`);
      }
    } else {
      // For 2D, check for map container
      const mapContainer = page.locator('.amap-container');
      const is2D = await mapContainer.isVisible().catch(() => false);

      if (!is2D) {
        console.log(`⚠️  2D 地圖容器未顯示，強制切換到 2D 模式`);
        await modeButton.click({ force: true });
        await page.waitForTimeout(1000);
        await waitForModeSwitch(page, targetMode);
      } else {
        console.log(`✅ 已在 ${targetMode} 模式（已驗證）`);
      }
    }
  }
}

/**
 * 確保進入 2D 模式（簡單切換）
 *
 * ⚠️ 重要：此函數僅執行基本的模式切換，不解決「首次載入失敗」問題
 * 如果遇到 gpx2d undefined 錯誤，請使用 trajectory-reload.ts 中的 reload2DTrajectory()
 *
 * 已知問題 #1 推薦解決方案：重新加載軌跡（見 trajectory-reload.ts）
 * 備選方案：3D→2D 切換序列（較不推薦，見 troubleshooting.md 方法 2）
 *
 * @param page - Playwright Page 物件
 * @throws 如果切換失敗
 *
 * 參考：
 * - docs/test-plan/KNOWN_ISSUES_SOLUTIONS.md#問題-1 (方法1 推薦)
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
 * 可靠的 3D 切換
 *
 * @param page - Playwright Page 物件
 * @throws 如果切換失敗
 */
export async function switchTo3DReliably(page: Page): Promise<void> {
  console.log('🔄 開始切換到 3D 模式...');

  await ensureModeByText(page, '3D');

  // 驗證 3D 特徵元素
  const view1Button = page.getByRole('button', { name: '視角1' });
  await expect(view1Button).toBeVisible({ timeout: 10000 });

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

  // 檢查 3D 特徵
  const view1Button = page.getByRole('button', { name: '視角1' });
  const is3D = await view1Button.isVisible().catch(() => false);

  if (is3D) {
    return '3D';
  }

  // 檢查 2D 模式下的標記數量
  const markers = page.locator('[title*="2025-"]');
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

  // 點擊 timeline 按鈕切換
  const timelineButton = page.locator('button:has(img[alt="timeline"])');
  await timelineButton.click();
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
