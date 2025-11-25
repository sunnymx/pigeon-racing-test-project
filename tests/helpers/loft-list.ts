/**
 * loft-list.ts - 鴿舍列表操作函數
 *
 * 職責：鴿舍管理相關操作
 * - 打開鴿舍列表
 * - 搜尋鴿舍
 * - 選擇鴿舍
 * - 驗證鴿舍資訊
 *
 * 參考文檔：docs/test-plan/TEST_CASES.md (TC-05 系列)
 */

import { Page, expect } from '@playwright/test';

/**
 * 鴿舍資訊接口
 */
export interface LoftInfo {
  loftName: string;
  pigeonCount: number;
  location?: string;
}

/**
 * 切換到鴿舍列表 Tab
 *
 * @param page - Playwright Page 物件
 * @throws 如果 Tab 不存在或切換失敗
 */
export async function openLoftList(page: Page): Promise<void> {
  // 支援簡繁體字符：鴿/鸽, 舍, 列表
  const loftTab = page.getByRole('tab', { name: /鴿舍列表|鸽舍列表/ });

  await expect(loftTab).toBeVisible({ timeout: 5000 });
  await loftTab.click();

  // 等待鴿舍列表載入
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('✅ 已切換到鴿舍列表');
}

/**
 * 搜尋鴿舍
 *
 * @param page - Playwright Page 物件
 * @param keyword - 搜尋關鍵字
 * @throws 如果搜尋功能不可用
 */
export async function searchLoft(page: Page, keyword: string): Promise<void> {
  const searchBox = page.getByRole('textbox', { name: /搜尋|鴿舍/ });

  await expect(searchBox).toBeVisible({ timeout: 5000 });
  await searchBox.fill(keyword);

  // 等待搜尋結果更新
  await page.waitForTimeout(1000);

  console.log(`✅ 已搜尋鴿舍：${keyword}`);
}

/**
 * 選擇鴿舍（點擊展開）
 *
 * @param page - Playwright Page 物件
 * @param loftIndex - 鴿舍索引（預設 0）
 * @returns 鴿舍資訊
 * @throws 如果鴿舍不存在
 */
export async function selectLoft(page: Page, loftIndex: number = 0): Promise<LoftInfo> {
  const loftItems = page.locator('.loft-item');
  const count = await loftItems.count();

  if (count === 0) {
    throw new Error('❌ 找不到任何鴿舍');
  }

  if (loftIndex >= count) {
    throw new Error(`❌ 鴿舍索引 ${loftIndex} 超出範圍（共 ${count} 個）`);
  }

  const targetLoft = loftItems.nth(loftIndex);
  const loftName = await targetLoft.textContent();

  // 點擊展開鴿舍
  await targetLoft.click();
  await page.waitForTimeout(1000);

  console.log(`✅ 已選擇鴿舍：${loftName}`);

  // 計算鴿子數量
  const pigeonCheckboxes = page.locator('.pigeon-checkbox');
  const pigeonCount = await pigeonCheckboxes.count();

  return {
    loftName: loftName?.trim() || '',
    pigeonCount,
  };
}

/**
 * 勾選鴿舍內的多隻鴿子
 *
 * @param page - Playwright Page 物件
 * @param pigeonIndices - 鴿子索引陣列（例如：[0, 1, 2]）
 * @returns 勾選的鴿子數量
 * @throws 如果勾選失敗
 */
export async function selectPigeonsInLoft(
  page: Page,
  pigeonIndices: number[]
): Promise<number> {
  const pigeonCheckboxes = page.locator('.pigeon-checkbox');
  const totalCount = await pigeonCheckboxes.count();

  if (totalCount === 0) {
    throw new Error('❌ 找不到任何鴿子');
  }

  // 驗證索引有效性
  for (const index of pigeonIndices) {
    if (index >= totalCount) {
      throw new Error(`❌ 鴿子索引 ${index} 超出範圍（共 ${totalCount} 隻）`);
    }
  }

  // 勾選鴿子
  for (const index of pigeonIndices) {
    await pigeonCheckboxes.nth(index).click();
    await page.waitForTimeout(300);
  }

  console.log(`✅ 已勾選 ${pigeonIndices.length} 隻鴿子`);
  return pigeonIndices.length;
}

/**
 * 驗證鴿舍資訊顯示
 *
 * @param page - Playwright Page 物件
 * @param expectedLoftName - 預期的鴿舍名稱
 * @returns 鴿舍資訊
 * @throws 如果鴿舍資訊不匹配
 */
export async function verifyLoftInfo(
  page: Page,
  expectedLoftName: string
): Promise<LoftInfo> {
  const loftNameElement = page.locator(`.loft-name:has-text("${expectedLoftName}")`);

  await expect(loftNameElement).toBeVisible({ timeout: 5000 });

  const pigeonCount = await page.locator('.pigeon-item').count();

  console.log(`✅ 鴿舍資訊驗證通過：${expectedLoftName}，${pigeonCount} 隻鴿子`);

  return {
    loftName: expectedLoftName,
    pigeonCount,
  };
}

/**
 * 驗證多軌跡顯示
 *
 * 檢查是否有多條軌跡同時顯示
 *
 * @param page - Playwright Page 物件
 * @param expectedCount - 預期的軌跡數量
 * @returns 實際軌跡數量
 */
export async function verifyMultipleTrajectories(
  page: Page,
  expectedCount: number
): Promise<number> {
  // 等待軌跡視圖載入
  await page.waitForTimeout(5000);

  // 檢查軌跡標記（紅色軌跡標記點，可能有多組）
  const allMarkers = page.locator('.amap-marker:has(img[src*="ff0000"])');
  const markerCount = await allMarkers.count();

  console.log(`📍 找到 ${markerCount} 個軌跡標記`);

  // 驗證軌跡數量符合預期
  // 注意：每條軌跡可能有 15-20 個標記，所以總數會是 expectedCount * 15-20
  const estimatedTrajectories = Math.ceil(markerCount / 15);

  if (estimatedTrajectories < expectedCount) {
    throw new Error(
      `❌ 軌跡數量不符：預期 ${expectedCount}，估計 ${estimatedTrajectories}`
    );
  }

  console.log(`✅ 多軌跡驗證通過：至少 ${expectedCount} 條軌跡`);
  return estimatedTrajectories;
}

/**
 * 驗證多個軌跡 API 請求
 *
 * 監聽 API 請求，確保每隻鴿子都發送了軌跡數據請求
 *
 * @param page - Playwright Page 物件
 * @param expectedRequestCount - 預期的請求數量
 * @returns 實際請求數量
 */
export async function verifyMultipleTrajectoryRequests(
  page: Page,
  expectedRequestCount: number
): Promise<number> {
  let apiCallCount = 0;

  // 監聽 API 請求
  page.on('request', (request) => {
    if (request.url().includes('ugetPigeonAllJsonInfo')) {
      apiCallCount++;
      console.log(`📡 軌跡 API 請求 #${apiCallCount}`);
    }
  });

  // 點擊查看軌跡
  // 支援簡繁體字符：軌/轨, 跡/迹
  const trajectoryButton = page.getByRole('button', { name: /查看[轨軌][迹跡]/ });
  await expect(trajectoryButton).toBeEnabled({ timeout: 5000 });
  await trajectoryButton.click();

  // 等待所有請求完成
  await page.waitForTimeout(5000);

  if (apiCallCount < expectedRequestCount) {
    throw new Error(
      `❌ API 請求數量不符：預期 ${expectedRequestCount}，實際 ${apiCallCount}`
    );
  }

  console.log(`✅ 多軌跡 API 請求驗證通過：${apiCallCount} 個請求`);
  return apiCallCount;
}
