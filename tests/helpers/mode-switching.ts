/**
 * mode-switching.ts - 2D/3D 模式切換 helper
 *
 * 職責：處理軌跡視圖的模式切換
 * - 偵測當前視圖模式 (2D-static / 2D-dynamic / 3D)
 * - 2D 靜態/動態切換
 * - 2D/3D 模式切換
 *
 * ⚠️ 重要：三種按鈕類型
 * - Type 1: 偏好選擇器（選鴿畫面的 2D/3D badge）
 * - Type 2: 地圖模式切換器（軌跡頁面的「2D模式」/「3D模式」按鈕）← 自動化用這個
 * - Type 3: 靜態/動態切換（僅 2D 模式有 timeline 按鈕）
 *
 * 模式判斷標準：
 * - 3D 模式：有視角按鈕（視角1/視角2）
 * - 2D 動態：有播放控制按鈕（pause 或 play_arrow）
 * - 2D 靜態：標記點數量 >= 15
 */

import { Page, expect } from '@playwright/test';

// ============================================================================
// 常量定義
// ============================================================================

const MODE_SWITCH_WAIT = 2000;  // 模式切換後等待時間

// ============================================================================
// 模式偵測
// ============================================================================

/**
 * 偵測當前視圖模式
 *
 * @returns '2D-static' | '2D-dynamic' | '3D' | 'unknown'
 */
export async function detectCurrentViewMode(
  page: Page
): Promise<'2D-static' | '2D-dynamic' | '3D' | 'unknown'> {
  // 檢查 3D 特徵（視角按鈕，支援簡繁體）
  const view1Button = page.getByRole('button', { name: /[视視]角1/ });
  const is3D = await view1Button.isVisible().catch(() => false);

  if (is3D) {
    return '3D';
  }

  // 檢查是否有 AMap 容器（確認在 2D）
  const hasAMap = await page.locator('.amap-container').isVisible().catch(() => false);
  if (!hasAMap) {
    return 'unknown';
  }

  // 2D 動態模式判斷：檢查播放控制按鈕是否存在
  const pauseButton = page.getByRole('button').filter({ hasText: 'pause' });
  const playButton = page.getByRole('button').filter({ hasText: 'play_arrow' });

  const hasPause = await pauseButton.isVisible().catch(() => false);
  const hasPlay = await playButton.isVisible().catch(() => false);

  if (hasPause || hasPlay) {
    return '2D-dynamic';
  }

  return '2D-static';
}

// ============================================================================
// 模式切換
// ============================================================================

/**
 * 在 2D 模式下切換靜態/動態
 *
 * 策略：點擊 timeline 按鈕或動態/靜態切換按鈕
 *
 * @param page - Playwright Page 物件
 * @param targetSubMode - 'static' | 'dynamic'
 */
export async function switchSubMode2D(
  page: Page,
  targetSubMode: 'static' | 'dynamic'
): Promise<void> {
  const currentMode = await detectCurrentViewMode(page);

  // 檢查是否在 2D 模式
  if (!currentMode.startsWith('2D')) {
    throw new Error(`當前不在 2D 模式（當前：${currentMode}）`);
  }

  // 檢查是否已在目標模式
  const isAlreadyTarget =
    (targetSubMode === 'static' && currentMode === '2D-static') ||
    (targetSubMode === 'dynamic' && currentMode === '2D-dynamic');

  if (isAlreadyTarget) {
    return; // 已在目標模式
  }

  // 嘗試點擊切換按鈕
  // 優先：「切換動態/靜態模式」按鈕
  const toggleButton = page.getByRole('button', {
    name: /切換動態\/靜態模式|切换动态\/静态模式/,
  });

  if (await toggleButton.isVisible().catch(() => false)) {
    await toggleButton.first().click();
  } else {
    // 備選：timeline 按鈕
    const timelineButton = page.getByRole('button').filter({ hasText: 'timeline' });
    await timelineButton.click();
  }

  await page.waitForTimeout(MODE_SWITCH_WAIT);

  // 驗證切換成功
  const newMode = await detectCurrentViewMode(page);
  const expectedMode = targetSubMode === 'static' ? '2D-static' : '2D-dynamic';

  if (newMode !== expectedMode) {
    throw new Error(`切換失敗：預期 ${expectedMode}，實際 ${newMode}`);
  }
}

// ============================================================================
// 2D/3D 模式切換（Button Type 2）
// ============================================================================

/**
 * 取得當前模式（2D 或 3D）
 *
 * 策略：檢測地圖類型特有元素
 * - 3D 模式：視角按鈕（視角1/視角2）
 * - 2D 模式：AMap 容器
 */
export async function getCurrentMode(page: Page): Promise<'2D' | '3D' | 'unknown'> {
  // Layer 1: 檢查 3D 特徵（視角按鈕，支援簡繁體）
  const view1Button = page.getByRole('button', { name: /[视視]角1/ });
  const hasView1Button = await view1Button.isVisible().catch(() => false);
  if (hasView1Button) {
    return '3D';
  }

  // Layer 2: 檢查 2D 特徵（AMap 容器）
  const mapContainer = page.locator('.amap-container');
  const hasMapContainer = await mapContainer.isVisible().catch(() => false);
  if (hasMapContainer) {
    return '2D';
  }

  return 'unknown';
}

/**
 * 等待 3D 模式載入完成
 *
 * 策略：檢測視角按鈕出現（應用不暴露 window.Cesium）
 */
async function waitForCesium3D(page: Page, timeout: number = 30000): Promise<void> {
  const view1Button = page.getByRole('button', { name: /[视視]角1/ });
  await view1Button.waitFor({ state: 'visible', timeout });
  // 額外等待確保 3D 場景渲染完成
  await page.waitForTimeout(2000);
}

/**
 * 等待模式切換完成
 */
async function waitForModeSwitch(
  page: Page,
  targetMode: '2D' | '3D',
  timeout: number = 15000
): Promise<void> {
  if (targetMode === '3D') {
    await waitForCesium3D(page, timeout);
  } else {
    // 2D 模式：等待 timeline 按鈕出現
    const timelineButton = page.getByRole('button').filter({ hasText: 'timeline' });
    try {
      await timelineButton.waitFor({ state: 'visible', timeout });
    } catch {
      // 備選：檢測 3D 視角按鈕消失
      const view1Button = page.getByRole('button', { name: /[视視]角1/ });
      await view1Button.waitFor({ state: 'hidden', timeout: 5000 });
    }
  }
  // 額外等待讓數據渲染
  await page.waitForTimeout(2500);
}

/**
 * 根據按鈕文字確保進入指定模式（Button Type 2）
 *
 * 關鍵理解：
 * - 按鈕顯示「3D模式」→ 當前在 2D → 點擊進入 3D
 * - 按鈕顯示「2D模式」→ 當前在 3D → 點擊進入 2D
 */
export async function ensureModeByText(
  page: Page,
  targetMode: '2D' | '3D'
): Promise<void> {
  // 找到模式切換按鈕（Button Type 2）
  const modeButton = page.getByRole('button', { name: /[23]D模式/ });
  await expect(modeButton).toBeVisible({ timeout: 5000 });

  const buttonText = await modeButton.textContent();
  if (!buttonText) {
    throw new Error('無法讀取模式按鈕文字');
  }

  // 判斷是否需要切換
  const needSwitch =
    (targetMode === '3D' && buttonText.includes('3D')) ||
    (targetMode === '2D' && buttonText.includes('2D'));

  if (needSwitch) {
    await modeButton.click({ force: true });
    await waitForModeSwitch(page, targetMode);

    // 驗證切換成功
    const actualMode = await getCurrentMode(page);
    if (actualMode !== targetMode) {
      throw new Error(`模式切換失敗：目標 ${targetMode}，實際 ${actualMode}`);
    }
  }
}

/**
 * 可靠的 3D 切換
 */
export async function switchTo3DReliably(page: Page): Promise<void> {
  const currentMode = await getCurrentMode(page);

  if (currentMode === '3D') {
    return; // 已在 3D 模式
  }

  await ensureModeByText(page, '3D');

  // 驗證 3D 特徵元素
  const view1Button = page.getByRole('button', { name: /[视視]角1/ });
  await expect(view1Button).toBeVisible({ timeout: 30000 });

  // 額外等待確保完全初始化
  await page.waitForTimeout(3000);
}
