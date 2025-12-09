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

// CI 環境檢測
const isCI = !!process.env.CI;

// CI 環境的超時和重試配置
const CI_CONFIG = {
  maxRetries: 3,           // CI 最多重試 3 次
  dataLoadWait: 5000,      // CI 數據加載等待 5 秒（輪詢會補足）
  shortWait: 1500,         // CI 短等待 1.5 秒
  markerTimeout: 30000,    // 輪詢最大等待 30 秒
  markerInterval: 500,     // 每 500ms 檢查一次
};

const LOCAL_CONFIG = {
  maxRetries: 3,           // 本地最多重試 3 次
  dataLoadWait: 2000,      // 本地數據加載等待 2 秒
  shortWait: 500,          // 本地短等待 0.5 秒
  markerTimeout: 10000,    // 輪詢最大等待 10 秒
  markerInterval: 300,     // 每 300ms 檢查一次
};

const CONFIG = isCI ? CI_CONFIG : LOCAL_CONFIG;

/**
 * 輪詢等待標記點加載
 * 比固定延遲更可靠，能適應不同網路條件
 *
 * @param page - Playwright Page 物件
 * @param minCount - 最少需要的標記點數量
 * @param timeout - 最大等待時間（毫秒）
 * @param interval - 輪詢間隔（毫秒）
 * @returns 實際標記點數量
 */
async function waitForMarkers(
  page: Page,
  minCount: number = 1,
  timeout: number = 30000,
  interval: number = 500
): Promise<number> {
  const startTime = Date.now();
  let markerCount = 0;

  console.log(`  ⏳ 輪詢等待標記點 (至少 ${minCount} 個, 最長 ${timeout / 1000}s)...`);

  while (Date.now() - startTime < timeout) {
    markerCount = await page.locator('.amap-icon > img').count();

    if (markerCount >= minCount) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✓ 標記點已加載: ${markerCount} 個 (${elapsed}s)`);
      return markerCount;
    }

    await page.waitForTimeout(interval);
  }

  console.warn(`  ⚠️ 輪詢超時，當前標記點: ${markerCount}`);
  return markerCount;
}

/**
 * 重新加載 2D 軌跡數據
 * 通過重新選擇鴿子並查看軌跡來觸發數據刷新
 *
 * 根據 KNOWN_ISSUES_SOLUTIONS.md 第 60-152 行的方法 1 (推薦)
 *
 * @param page - Playwright Page 物件
 * @param pigeonIndex - 鴿子索引（預設為 0，即第一隻鴿子）
 * @param maxRetries - 最大重試次數（預設根據環境自動設定）
 * @returns 是否成功加載
 */
export async function reload2DTrajectory(
  page: Page,
  pigeonIndex: number = 0,
  maxRetries: number = CONFIG.maxRetries
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🔄 嘗試加載 2D 軌跡 (第 ${attempt + 1}/${maxRetries} 次)...`);

      // 步驟1: 確保在鴿子列表頁面
      // 檢查表格是否可見（更可靠的狀態檢測）
      const isTableVisible = await page.locator('table tbody tr').isVisible().catch(() => false);

      if (!isTableVisible) {
        console.log('  ⚠️ 當前不在鴿子列表，嘗試導航返回...');

        // 如果 mat-drawer 打開（overlay 模式），先點擊 backdrop 關閉
        const drawerBackdrop = page.locator('.mat-drawer-backdrop');
        if (await drawerBackdrop.isVisible().catch(() => false)) {
          console.log('  ⚠️ 偵測到 drawer 打開，點擊 backdrop 關閉...');
          await drawerBackdrop.click();
          await page.waitForTimeout(500);
        }

        // 返回按鈕是 hamburger menu icon（Material Icon: "menu"）
        // 根據用戶錄製：點擊 menu 按鈕可直接返回鴿子列表
        // 使用 force: true 避免被 overlay 元素攔截
        const backButton = page.getByRole('button').filter({ hasText: 'menu' }).first();

        if (await backButton.isVisible().catch(() => false)) {
          await backButton.click({ force: true });
          await page.waitForTimeout(CONFIG.shortWait * 2);
          console.log('  ✓ 已點擊返回按鈕');
        } else {
          // 如果找不到返回按鈕，重新進入賽事
          console.log('  ⚠️ 未找到返回按鈕，重新進入賽事...');
          // ⚠️ 使用 domcontentloaded 替代 networkidle，避免因地圖瓦片持續載入導致超時
          await page.goto('/', { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('mat-card', { timeout: 10000 });

          const enterButtons = page.getByRole('button', { name: /\s*(进入|進入)\s*/ });
          const count = await enterButtons.count();

          if (count > 0) {
            await enterButtons.nth(0).click(); // 默認進入第一個賽事
            await page.waitForSelector('table tbody tr', { timeout: 15000 });
            console.log('  ✓ 已重新進入賽事');
          }
        }

        // 等待表格出現
        await page.waitForSelector('table tbody tr', { timeout: 10000 });
        console.log('  ✓ 已返回鴿子列表');
      } else {
        console.log('  ✓ 已在鴿子列表頁面');
      }

      // 步驟2: 取消之前的選擇
      const selectedCheckbox = page.locator('input[type="checkbox"]:checked').first();
      if (await selectedCheckbox.isVisible().catch(() => false)) {
        await selectedCheckbox.click();
        await page.waitForTimeout(CONFIG.shortWait);
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
      await page.waitForTimeout(CONFIG.shortWait);

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
      // CI 環境網路較慢，使用 domcontentloaded 替代 networkidle 避免超時
      await page.waitForLoadState(isCI ? 'domcontentloaded' : 'networkidle');
      await page.waitForTimeout(CONFIG.dataLoadWait);
      console.log('  ✓ 等待數據加載完成');

      // 步驟6: 切換到 2D 模式（如果當前不是）
      // 根據 KNOWN_ISSUES_SOLUTIONS.md 第 121-126 行
      const button2D = page.getByRole('button', { name: /2D[模模][式式]|2D.*mode/i });
      if (await button2D.isVisible().catch(() => false)) {
        console.log('  ⚠️ 當前在 3D 模式，切換到 2D...');
        await button2D.click();
        await page.waitForTimeout(CONFIG.shortWait * 2);
        console.log('  ✓ 已切換到 2D 模式');
      }

      // 步驟7: 輪詢等待標記點加載（CI 和本地都使用）
      // 用輪詢替代固定延遲，自適應網路條件
      const markerCount = await waitForMarkers(
        page,
        1,  // 至少需要 1 個標記點
        CONFIG.markerTimeout,
        CONFIG.markerInterval
      );

      // 步驟8: 驗證 2D 地圖加載
      // 檢查 Canvas 圖層（軌跡線渲染）
      const canvas = await page.locator('canvas.amap-layer').count();

      // 檢查地圖容器可見性
      const mapContainerVisible = await page.locator('.amap-container').isVisible().catch(() => false);

      // 檢查 2D 特有 UI 元素（timeline 按鈕）
      const timelineVisible = await page.getByRole('button').filter({ hasText: 'timeline' }).isVisible().catch(() => false);

      // 標記點要求：至少 1 個
      const markerRequired = 1;

      if ((canvas > 0 || mapContainerVisible) && timelineVisible && markerCount >= markerRequired) {
        console.log(`✅ 2D 軌跡加載成功！`);
        console.log(`   - Canvas 圖層: ${canvas}`);
        console.log(`   - 地圖容器可見: ${mapContainerVisible}`);
        console.log(`   - Timeline 按鈕可見: ${timelineVisible}`);
        console.log(`   - 軌跡標記點: ${markerCount}`);
        return true;
      } else {
        console.warn(
          `⚠️ 軌跡未完全加載 (Canvas: ${canvas}, 容器: ${mapContainerVisible}, Timeline: ${timelineVisible}, 標記: ${markerCount})，準備重試...`
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
  // DOM 結構：div > .amap-icon > img（由 codegen 確認）
  const markerCount = await page.locator('.amap-icon > img').count();

  if (markerCount >= 15) {
    console.log(`✅ 已切換到 2D 靜態模式，軌跡點數: ${markerCount}`);
    return true;
  } else {
    console.warn(`⚠️ 軌跡點不足 (${markerCount})，可能仍在動態模式或加載未完成`);
    return false;
  }
}
