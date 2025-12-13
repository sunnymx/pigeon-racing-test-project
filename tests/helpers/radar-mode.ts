/**
 * radar-mode.ts - 雷達模式相關 helper 函數
 *
 * 支援記錄點 #10 測試：雷達模式
 * 測試項目：對話框交互、進入雷達模式、介面元素驗證、搜尋功能、播放控制
 */

import { Page } from '@playwright/test';

// ============================================================================
// 常量定義
// ============================================================================

const QUICK_WAIT = 500;
const IS_CI = !!process.env.CI;
const RADAR_LOAD_TIMEOUT = IS_CI ? 300000 : 240000; // 雷達模式載入需要較長時間（CI: 5分鐘，本地: 4分鐘）

// ============================================================================
// 對話框操作
// ============================================================================

/**
 * 點擊雷達模式按鈕
 */
export async function clickRadarModeButton(page: Page): Promise<void> {
  const radarButton = page.getByRole('button', { name: /雷[达達]模式/ });
  await radarButton.click();
  await page.waitForTimeout(QUICK_WAIT);
}

/**
 * 檢查確認對話框是否可見
 */
export async function isConfirmDialogVisible(page: Page): Promise<boolean> {
  const dialog = page.getByRole('dialog');
  return await dialog.isVisible().catch(() => false);
}

/**
 * 取得對話框標題
 */
export async function getDialogTitle(page: Page): Promise<string> {
  const heading = page.getByRole('heading', { name: /雷[达達]模式/ });
  if (await heading.isVisible().catch(() => false)) {
    return (await heading.textContent()) || '';
  }
  return '';
}

/**
 * 點擊取消按鈕
 */
export async function cancelRadarMode(page: Page): Promise<void> {
  const cancelButton = page.getByRole('button', { name: /取消/ });
  await cancelButton.click();
  await page.waitForTimeout(QUICK_WAIT);
}

/**
 * 點擊確定按鈕進入雷達模式
 */
export async function confirmRadarMode(page: Page): Promise<void> {
  const confirmButton = page.getByRole('button', { name: /[确確]定/ });
  await confirmButton.click();
  await page.waitForTimeout(QUICK_WAIT);
}

// ============================================================================
// 載入狀態
// ============================================================================

/**
 * 檢查是否顯示載入中提示
 */
export async function isLoadingVisible(page: Page): Promise<boolean> {
  // 載入對話框可能顯示「切换至雷达模式中」或「载入资料中」
  const loadingDialog = page.getByRole('dialog').filter({ hasText: /切[换換]|[载載]入|\d+%/ });
  return await loadingDialog.isVisible().catch(() => false);
}

/**
 * 等待雷達模式載入完成
 *
 * @returns 是否成功載入
 */
export async function waitForRadarLoaded(page: Page): Promise<boolean> {
  try {
    // 階段 1：等待下載對話框消失（包含百分比進度）
    const downloadDialog = page.getByRole('dialog').filter({ hasText: /%/ });
    await downloadDialog.waitFor({
      state: 'hidden',
      timeout: RADAR_LOAD_TIMEOUT,
    });

    // 階段 2：等待「载入资料中」消失
    const loadingText = page.locator('text=载入资料中');
    await loadingText.waitFor({
      state: 'hidden',
      timeout: RADAR_LOAD_TIMEOUT,
    });

    // 階段 3：等待播放按鈕出現（雷達模式特有）
    const playButton = page.getByRole('button').filter({ hasText: 'play_arrow' });
    await playButton.waitFor({
      state: 'visible',
      timeout: 30000,
    });

    // 等待介面穩定
    await page.waitForTimeout(2000);

    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// 介面元素驗證
// ============================================================================

/**
 * 取得鴿子卡片的 Locator
 */
export function getPigeonCards(page: Page) {
  // 雷達模式卡片包含「最终名次」，這是區分於原始列表的關鍵
  return page.locator('div').filter({ hasText: '最终名次' }).filter({ hasText: /\d{2}-\d{7}/ });
}

/**
 * 取得鴿子卡片數量
 */
export async function getPigeonCardCount(page: Page): Promise<number> {
  const cards = getPigeonCards(page);
  return await cards.count().catch(() => 0);
}

/**
 * 取得里程碑元素的 Locator
 */
export function getMilestoneElements(page: Page) {
  // 里程碑：50KM, 100KM, 150KM, 200KM, 250KM
  return page.locator('div').filter({ hasText: /\d+KM/ }).filter({ hasText: /%/ });
}

/**
 * 取得里程碑統計
 *
 * @returns 里程碑列表 [{distance: '50KM', percentage: '0%', count: '0'}, ...]
 */
export async function getMilestoneStats(page: Page): Promise<{ distance: string; percentage: string }[]> {
  const milestones: { distance: string; percentage: string }[] = [];

  const distances = ['50KM', '100KM', '150KM', '200KM', '250KM'];

  for (const distance of distances) {
    const element = page.locator('div').filter({ hasText: distance }).filter({ hasText: /%/ }).first();
    if (await element.isVisible().catch(() => false)) {
      const text = (await element.textContent()) || '';
      const percentMatch = text.match(/(\d+%)/);
      milestones.push({
        distance,
        percentage: percentMatch ? percentMatch[1] : '0%',
      });
    }
  }

  return milestones;
}

/**
 * 檢查時間軸是否存在
 */
export async function hasTimeline(page: Page): Promise<boolean> {
  // 時間軸包含 UTC 日期格式
  const timeline = page.locator('div').filter({ hasText: /\d{4} \d{2}:\d{2}:\d{2} UTC/ });
  return (await timeline.count()) > 0;
}

// ============================================================================
// 搜尋功能
// ============================================================================

/**
 * 取得搜尋框
 */
export function getSearchBox(page: Page) {
  // 雷達模式中的搜尋框
  return page.locator('input[type="text"], textbox').first();
}

/**
 * 搜尋鴿子
 *
 * @param query - 搜尋關鍵字（環號）
 * @returns 搜尋後的卡片數量
 */
export async function searchPigeon(page: Page, query: string): Promise<number> {
  const searchBox = getSearchBox(page);

  if (!(await searchBox.isVisible().catch(() => false))) {
    return -1;
  }

  await searchBox.clear();
  await searchBox.fill(query);
  await page.waitForTimeout(1000);

  return await getPigeonCardCount(page);
}

/**
 * 清除搜尋
 */
export async function clearSearch(page: Page): Promise<void> {
  // 點擊 close 圖標清除搜尋
  const closeIcon = page.locator('div').filter({ hasText: 'close' }).last();
  if (await closeIcon.isVisible().catch(() => false)) {
    await closeIcon.click();
    await page.waitForTimeout(QUICK_WAIT);
  }
}

// ============================================================================
// 播放控制
// ============================================================================

/**
 * 取得播放按鈕
 */
export function getPlayButton(page: Page) {
  return page.getByRole('button').filter({ hasText: 'play_arrow' });
}

/**
 * 取得暫停按鈕
 */
export function getPauseButton(page: Page) {
  return page.getByRole('button').filter({ hasText: 'pause' });
}

/**
 * 檢查是否正在播放
 */
export async function isPlaying(page: Page): Promise<boolean> {
  const pauseButton = getPauseButton(page);
  return await pauseButton.isVisible().catch(() => false);
}

/**
 * 開始播放
 */
export async function startPlayback(page: Page): Promise<boolean> {
  const playButton = getPlayButton(page);

  if (await playButton.isVisible().catch(() => false)) {
    await playButton.click();
    await page.waitForTimeout(QUICK_WAIT);
    return await isPlaying(page);
  }

  return false;
}

/**
 * 暫停播放
 */
export async function pausePlayback(page: Page): Promise<boolean> {
  const pauseButton = getPauseButton(page);

  if (await pauseButton.isVisible().catch(() => false)) {
    await pauseButton.click();
    await page.waitForTimeout(QUICK_WAIT);
    return !(await isPlaying(page));
  }

  return false;
}

/**
 * 檢查播放控制是否存在
 */
export async function hasPlaybackControls(page: Page): Promise<boolean> {
  const playButton = getPlayButton(page);
  const fastForward = page.getByRole('button').filter({ hasText: 'fast_forward' });
  const fastRewind = page.getByRole('button').filter({ hasText: 'fast_rewind' });

  const hasPlay = await playButton.isVisible().catch(() => false);
  const hasForward = await fastForward.isVisible().catch(() => false);
  const hasRewind = await fastRewind.isVisible().catch(() => false);

  return hasPlay && hasForward && hasRewind;
}

// ============================================================================
// 綜合驗證
// ============================================================================

/**
 * 驗證雷達模式介面已完整載入
 */
export async function isRadarModeLoaded(page: Page): Promise<boolean> {
  const hasCards = (await getPigeonCardCount(page)) > 0;
  const hasMilestones = (await getMilestoneElements(page).count()) > 0;
  const hasControls = await hasPlaybackControls(page);

  return hasCards && hasMilestones && hasControls;
}
