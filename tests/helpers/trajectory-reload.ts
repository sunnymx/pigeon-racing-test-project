/**
 * trajectory-reload.ts - 軌跡重新加載解決方案
 *
 * 職責：解決已知問題 #1 - 2D 軌跡初次加載失敗
 * 策略：通過「重新選擇鴿子 → 查看軌跡」流程觸發數據重新加載
 *
 * 參考文檔：
 * - docs/test-plan/KNOWN_ISSUES_SOLUTIONS.md#問題-1 (方法1)
 * - docs/guides/troubleshooting.md#問題-1
 */

import { Page } from '@playwright/test';

/**
 * 重新加載 2D 軌跡數據
 * 通過重新選擇鴿子並查看軌跡來觸發數據刷新
 *
 * 根據 KNOWN_ISSUES_SOLUTIONS.md 第 60-152 行的方法 1 (推薦)
 *
 * @param page - Playwright Page 物件
 * @param pigeonIndex - 鴿子索引（預設為 0，即第一隻鴿子）
 * @param maxRetries - 最大重試次數（預設 3）
 * @returns 是否成功加載
 */
export async function reload2DTrajectory(
  page: Page,
  pigeonIndex: number = 0,
  maxRetries: number = 3
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🔄 嘗試加載 2D 軌跡 (第 ${attempt + 1}/${maxRetries} 次)...`);

      // 步驟1: 確保在鴿子列表頁面
      // 注意：調用此函數前應該已經通過 enterRace() 進入鴿子列表
      // 等待 table 出現（鴿子列表的特徵）
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      console.log('  ✓ 已在鴿子列表頁面');

      // 步驟2: 取消之前的選擇
      const selectedCheckbox = page.locator('input[type="checkbox"]:checked').first();
      if (await selectedCheckbox.isVisible().catch(() => false)) {
        await selectedCheckbox.click();
        await page.waitForTimeout(500);
        console.log('  ✓ 已取消之前的選擇');
      }

      // 步驟3: 重新選擇鴿子（使用與 navigation.ts selectPigeon 相同的邏輯）
      const rows = page.getByRole('row');
      const rowCount = await rows.count();

      if (rowCount <= 1) {
        throw new Error('找不到任何鴿子');
      }

      if (pigeonIndex >= rowCount - 1) {
        throw new Error(`鴿子索引 ${pigeonIndex} 超出範圍，共有 ${rowCount - 1} 隻鴿子`);
      }

      // 通過 row 找 checkbox（更可靠）
      const targetRow = rows.nth(pigeonIndex + 1); // +1 跳過表頭
      const checkbox = targetRow.getByRole('checkbox');
      await checkbox.click();
      await page.waitForTimeout(500);

      // 驗證選擇成功（檢查勾選清單數量）
      const selectedText = await page.locator('text=/勾[选選]清[单單] \\d+/').textContent();
      const match = selectedText?.match(/勾[选選]清[单單] (\d+)/);

      if (!match || parseInt(match[1], 10) === 0) {
        throw new Error('鴿子選擇失敗：勾選清單數量為 0');
      }

      console.log(`  ✓ 已選擇鴿子 #${pigeonIndex}（勾選清單：${match[1]}）`);

      // 步驟4: 點擊查看軌跡（支援簡繁體）
      const viewButton = page.getByRole('button', { name: /查看[轨軌][迹跡]/ });
      await viewButton.click();
      console.log('  ✓ 已點擊查看軌跡');

      // 步驟5: 等待數據加載
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // 額外等待數據處理
      console.log('  ✓ 等待數據加載完成');

      // 步驟6: 切換到 2D 模式（如果當前不是）
      // 根據 KNOWN_ISSUES_SOLUTIONS.md 第 121-126 行
      const button2D = page.getByRole('button', { name: /2D[模模][式式]|2D.*mode/i });
      if (await button2D.isVisible().catch(() => false)) {
        console.log('  ⚠️ 當前在 3D 模式，切換到 2D...');
        await button2D.click();
        await page.waitForTimeout(2000);
        console.log('  ✓ 已切換到 2D 模式');
      }

      // 步驟7: 驗證地圖瓦片加載（靜態模式特徵）
      const tileCount = await page.locator('.amap-container img, .amap-layer img').count();

      // 步驟8: 驗證軌跡線存在（通過 Canvas 檢查）
      const canvas = await page.locator('canvas.amap-layer').count();

      if (tileCount > 50 && canvas > 0) {
        console.log(`✅ 2D 軌跡加載成功！`);
        console.log(`   - 地圖瓦片數: ${tileCount}`);
        console.log(`   - Canvas 圖層: ${canvas}`);
        return true;
      } else {
        console.warn(
          `⚠️ 軌跡未完全加載 (瓦片: ${tileCount}, Canvas: ${canvas})，準備重試...`
        );
      }
    } catch (error) {
      console.error(`❌ 第 ${attempt + 1} 次加載失敗:`, error);
      if (attempt === maxRetries - 1) {
        throw new Error(`2D 軌跡加載失敗，已重試 ${maxRetries} 次`);
      }
    }
  }

  return false;
}

/**
 * 確保處於 2D 靜態模式
 * 區分靜態模式和動態模式的關鍵
 *
 * @param page - Playwright Page 物件
 * @returns 是否成功切換到靜態模式
 */
export async function ensure2DStaticMode(page: Page): Promise<boolean> {
  // 檢查當前是否有播放控制按鈕（動態模式特徵）
  const playButton = page.getByRole('button').filter({ hasText: /play_arrow|播放/ });
  const pauseButton = page.getByRole('button').filter({ hasText: /pause|暫停/ });

  const isPlaying = await pauseButton.isVisible().catch(() => false);

  if (isPlaying) {
    // 當前在動態播放模式，需要暫停或切換到靜態模式
    console.log('⚠️ 當前為 2D 動態模式，切換到靜態模式...');

    // 查找靜態模式按鈕（timeline 按鈕）
    const timelineButton = page.locator('button:has(img[alt="timeline"])');
    if (await timelineButton.isVisible().catch(() => false)) {
      await timelineButton.click();
      await page.waitForTimeout(1000);
    }
  }

  // 驗證靜態模式特徵：軌跡點數量 >= 15
  // 根據 KNOWN_ISSUES_SOLUTIONS.md 第 250-256 行
  const markerCount = await page.locator('[title*="2025-"]').count();

  if (markerCount >= 15) {
    console.log(`✅ 已切換到 2D 靜態模式，軌跡點數: ${markerCount}`);
    return true;
  } else {
    console.warn(`⚠️ 軌跡點不足 (${markerCount})，可能仍在動態模式或加載未完成`);
    return false;
  }
}
