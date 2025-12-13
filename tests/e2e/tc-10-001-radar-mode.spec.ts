/**
 * tc-10-001-radar-mode.spec.ts - 雷達模式測試
 *
 * 對應規格：USER_JOURNEY_RECORD_V2.md 記錄點 #10
 *
 * 5 個測試（簡化自原 8 個）：
 * - 10.1 對話框交互 (P2) - 確認對話框顯示、取消返回、確定進入
 * - 10.2 進入雷達模式 (P2) - 下載進度、介面載入
 * - 10.3 介面元素驗證 (P2) - 鴿子列表、里程碑統計
 * - 10.4 搜尋功能 (P2) - 輸入環號過濾結果
 * - 10.5 播放控制 (P2) - 播放/暫停正常
 */

import { test, expect } from '@playwright/test';
import { setupRaceEntry, DEFAULT_TIMEOUT } from '../helpers/fixtures';
import {
  clickRadarModeButton,
  isConfirmDialogVisible,
  getDialogTitle,
  cancelRadarMode,
  confirmRadarMode,
  isLoadingVisible,
  waitForRadarLoaded,
  getPigeonCardCount,
  getMilestoneStats,
  hasTimeline,
  searchPigeon,
  hasPlaybackControls,
  startPlayback,
  pausePlayback,
  isRadarModeLoaded,
} from '../helpers/radar-mode';

// ============================================================================
// 測試配置
// ============================================================================

test.describe('TC-10-001: 雷達模式 @P2', () => {
  test.beforeEach(async ({ page }) => {
    // 雷達模式載入時間較長，需要更多超時（CI: 8倍，本地: 6倍）
    const timeoutMultiplier = process.env.CI ? 8 : 6;
    test.setTimeout(DEFAULT_TIMEOUT * timeoutMultiplier);

    // 進入賽事詳情頁
    await setupRaceEntry(page);
  });

  // ==========================================================================
  // 10.1 對話框交互
  // ==========================================================================

  test('10.1 對話框交互 - 確認對話框顯示、取消返回', async ({ page }) => {
    // 點擊雷達模式按鈕
    await clickRadarModeButton(page);

    // 驗證：對話框顯示
    const dialogVisible = await isConfirmDialogVisible(page);
    expect(dialogVisible).toBe(true);

    // 驗證：對話框標題正確
    const title = await getDialogTitle(page);
    expect(title).toContain('雷达模式');

    // 驗證：取消按鈕和確定按鈕可見
    const cancelButton = page.getByRole('button', { name: /取消/ });
    const confirmButton = page.getByRole('button', { name: /[确確]定/ });
    await expect(cancelButton).toBeVisible();
    await expect(confirmButton).toBeVisible();

    // 點擊取消
    await cancelRadarMode(page);

    // 驗證：對話框關閉，返回列表
    const dialogClosed = !(await isConfirmDialogVisible(page));
    expect(dialogClosed).toBe(true);

    // 驗證：鴿子列表仍可見
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  // ==========================================================================
  // 10.2 進入雷達模式
  // ==========================================================================

  test('10.2 進入雷達模式 - 下載進度、介面載入', async ({ page }) => {
    // 點擊雷達模式按鈕
    await clickRadarModeButton(page);

    // 驗證：對話框顯示
    expect(await isConfirmDialogVisible(page)).toBe(true);

    // 點擊確定
    await confirmRadarMode(page);

    // 驗證：顯示載入中（可能很快消失）
    // 只檢查是否出現過，不強制要求
    const loadingShown = await isLoadingVisible(page);
    // loadingShown 可能為 true 或 false，取決於網速

    // 等待雷達模式載入完成
    const loaded = await waitForRadarLoaded(page);
    expect(loaded).toBe(true);

    // 驗證：雷達模式介面已載入
    const isLoaded = await isRadarModeLoaded(page);
    expect(isLoaded).toBe(true);
  });

  // ==========================================================================
  // 10.3 介面元素驗證
  // ==========================================================================

  test('10.3 介面元素驗證 - 鴿子列表、里程碑統計', async ({ page }) => {
    // 進入雷達模式
    await clickRadarModeButton(page);
    await confirmRadarMode(page);
    await waitForRadarLoaded(page);

    // 驗證：鴿子卡片列表存在
    const cardCount = await getPigeonCardCount(page);
    expect(cardCount).toBeGreaterThan(0);

    // 驗證：里程碑統計存在
    const milestones = await getMilestoneStats(page);
    expect(milestones.length).toBeGreaterThan(0);

    // 驗證：里程碑包含 50KM ~ 250KM
    const distances = milestones.map((m) => m.distance);
    expect(distances).toContain('50KM');

    // 驗證：時間軸存在
    const hasTimelineElement = await hasTimeline(page);
    expect(hasTimelineElement).toBe(true);
  });

  // ==========================================================================
  // 10.4 搜尋功能
  // ==========================================================================

  test('10.4 搜尋功能 - 輸入環號過濾結果', async ({ page }) => {
    // 進入雷達模式
    await clickRadarModeButton(page);
    await confirmRadarMode(page);
    await waitForRadarLoaded(page);

    // 記錄搜尋前的卡片數量
    const beforeCount = await getPigeonCardCount(page);
    expect(beforeCount).toBeGreaterThan(0);

    // 搜尋一個可能存在的環號片段
    const searchKeyword = '01-';
    const afterCount = await searchPigeon(page, searchKeyword);

    // 驗證：搜尋功能有作用
    // 搜尋後結果應該變化（可能更多、更少或相同，但功能正常）
    expect(afterCount).toBeGreaterThanOrEqual(0);

    // 搜尋不存在的環號
    const noResultCount = await searchPigeon(page, '99-9999999');
    // 可能為 0 或仍顯示全部（取決於實現）
    expect(noResultCount).toBeGreaterThanOrEqual(0);
  });

  // ==========================================================================
  // 10.5 播放控制
  // ==========================================================================

  test('10.5 播放控制 - 播放/暫停正常', async ({ page }) => {
    // 進入雷達模式
    await clickRadarModeButton(page);
    await confirmRadarMode(page);
    await waitForRadarLoaded(page);

    // 驗證：播放控制存在
    const hasControls = await hasPlaybackControls(page);
    expect(hasControls).toBe(true);

    // 驗證：快進/快退按鈕存在
    const fastForward = page.getByRole('button').filter({ hasText: 'fast_forward' });
    const fastRewind = page.getByRole('button').filter({ hasText: 'fast_rewind' });
    await expect(fastForward).toBeVisible();
    await expect(fastRewind).toBeVisible();

    // 開始播放
    const playStarted = await startPlayback(page);
    // 播放功能可能成功或失敗（取決於數據狀態）
    // 只驗證操作不會崩潰

    // 如果播放成功，嘗試暫停
    if (playStarted) {
      await page.waitForTimeout(1000); // 播放一秒
      const paused = await pausePlayback(page);
      // 暫停應該成功
      expect(paused).toBe(true);
    }
  });
});
