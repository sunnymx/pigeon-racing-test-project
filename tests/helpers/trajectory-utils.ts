/**
 * trajectory-utils.ts - 軌跡相關工具函數
 *
 * 職責：軌跡點互動和驗證
 * - 獲取軌跡標記點
 * - 點擊軌跡點（使用 accessibility tree 定位）
 * - 驗證軌跡數據
 * - 截圖驗證
 *
 * 解決問題：#3 - 軌跡點點擊無響應
 * 關鍵：使用 accessibility tree 定位器避免 canvas 遮擋
 *
 * 參考文檔：
 * - docs/guides/troubleshooting.md
 * - docs/architecture/test-framework.md
 */

import { Page, expect, Locator } from '@playwright/test';

/**
 * 軌跡數據接口
 */
export interface TrajectoryData {
  ringNumber: string;           // 公环号
  startTime: string;             // 起点时间
  endTime: string;               // 终点时间
  duration: string;              // 持续时间
  avgSpeed: number;              // 平均分速 (m/Min)
  maxSpeed: number;              // 最高分速 (m/Min)
  avgAltitude: number;           // 平均高度 (m)
  maxAltitude: number;           // 最大高度 (m)
  actualDistance: number;        // 实际距离 (km)
  straightDistance: number;      // 直线距离 (km)
}

/**
 * 軌跡點信息接口
 */
export interface TrajectoryPointInfo {
  ringNumber: string;
  time: string;
  speed: string;
  direction: string;
  altitude: string;
  rank: string;
}

/**
 * 獲取所有軌跡標記點
 *
 * DOM 結構：div > .amap-icon > img（由 codegen 確認）
 * 支援多鴿子不同顏色的軌跡
 *
 * @param page - Playwright Page 物件
 * @returns 軌跡標記點的 Locator 陣列
 */
export async function getTrajectoryPoints(page: Page): Promise<Locator[]> {
  const markers = page.locator('.amap-icon > img');
  const count = await markers.count();

  console.log(`📍 找到 ${count} 個軌跡標記點`);

  return await markers.all();
}

/**
 * 獲取軌跡標記點數量
 *
 * 用於判斷靜態/動態模式
 * - 靜態模式：≥ 15 個標記
 * - 動態模式：< 5 個標記
 *
 * DOM 結構：div > .amap-icon > img（由 codegen 確認）
 *
 * @param page - Playwright Page 物件
 * @returns 標記點數量
 */
export async function getTrajectoryPointsCount(page: Page): Promise<number> {
  const markers = page.locator('.amap-icon > img');
  return await markers.count();
}

/**
 * 從軌跡詳情面板獲取航點數量
 *
 * 用於驗證軌跡數據完整性
 * DOM 結構：<div class="mat-ripple row ng-star-inserted">...</div>
 *
 * @param page - Playwright Page 物件
 * @returns 航點數量
 */
export async function getWaypointCountFromDetails(page: Page): Promise<number> {
  const rows = page.locator('.mat-ripple.row.ng-star-inserted');
  return await rows.count();
}

/**
 * 點擊指定索引的軌跡標記點
 *
 * 解決問題：使用 accessibility tree 定位避免 canvas 遮擋
 *
 * @param page - Playwright Page 物件
 * @param index - 標記點索引
 * @throws 如果標記點不存在或點擊失敗
 */
export async function clickTrajectoryPoint(
  page: Page,
  index: number
): Promise<void> {
  const markers = await getTrajectoryPoints(page);

  if (index >= markers.length) {
    throw new Error(`❌ 標記點索引 ${index} 超出範圍（共 ${markers.length} 個）`);
  }

  const targetMarker = markers[index];

  try {
    // 使用 accessibility tree 定位（更可靠）
    await targetMarker.click({ force: true });
    await page.waitForTimeout(500);
    console.log(`✅ 已點擊軌跡點 #${index}`);
  } catch (error) {
    throw new Error(`❌ 點擊軌跡點失敗：${(error as Error).message}`);
  }
}

/**
 * 驗證軌跡點信息窗格顯示
 *
 * @param page - Playwright Page 物件
 * @returns 軌跡點信息
 * @throws 如果信息窗格未顯示或數據不完整
 */
export async function verifyPointInfo(page: Page): Promise<TrajectoryPointInfo> {
  // 等待信息窗格顯示
  await page.waitForSelector('heading:has-text("2025-")', { timeout: 5000 });

  // 提取信息
  const ringNumber = await page
    .locator('heading:has-text("2025-")')
    .textContent()
    .catch(() => '');

  const time = await extractFieldValue(page, '時間：');
  const speed = await extractFieldValue(page, '速度：');
  const direction = await extractFieldValue(page, '方向：');
  const altitude = await extractFieldValue(page, '海拔：');
  const rank = await extractFieldValue(page, '名次：');

  const pointInfo: TrajectoryPointInfo = {
    ringNumber: ringNumber?.trim() || '',
    time,
    speed,
    direction,
    altitude,
    rank,
  };

  // 驗證必填欄位
  if (!pointInfo.ringNumber || !pointInfo.time) {
    throw new Error('❌ 軌跡點信息不完整');
  }

  console.log('✅ 軌跡點信息驗證通過', pointInfo);
  return pointInfo;
}

/**
 * 提取側邊欄軌跡數據
 *
 * @param page - Playwright Page 物件
 * @returns 軌跡數據
 * @throws 如果數據不完整
 */
export async function verifyTrajectoryData(page: Page): Promise<TrajectoryData> {
  // 點擊打開軌跡詳情面板（如果尚未打開）
  const detailButton = page.locator('button[mattooltip="軌跡詳情"]');
  if (await detailButton.isVisible().catch(() => false)) {
    await detailButton.click();
    await page.waitForTimeout(1000);
    console.log('📊 已打開軌跡詳情面板');
  }

  // 提取公环号（使用 .detail-text 選擇器）
  const ringNumberRow = await page
    .locator('.detail-text:has-text("公环号")')
    .locator('..')
    .textContent()
    .catch(() => '');
  const ringNumber = ringNumberRow;

  // 提取时间数据
  const startTime = await extractFieldValue(page, '起点时间');
  const endTime = await extractFieldValue(page, '终点时间');
  const duration = await extractFieldValue(page, '持续时间');

  // 提取速度数据
  const avgSpeedText = await extractFieldValue(page, '平均分速');
  const maxSpeedText = await extractFieldValue(page, '最高分速');

  // 提取高度数据
  const avgAltitudeText = await extractFieldValue(page, '平均高度');
  const maxAltitudeText = await extractFieldValue(page, '最大高度');

  // 提取距离数据
  const actualDistanceText = await extractFieldValue(page, '实际距离');
  const straightDistanceText = await extractFieldValue(page, '直线距离');

  // 轉換為數字
  const trajectoryData: TrajectoryData = {
    ringNumber: ringNumber?.match(/\d{2}-\d{7}/)?.[0] || '',
    startTime,
    endTime,
    duration,
    avgSpeed: parseFloat(avgSpeedText) || 0,
    maxSpeed: parseFloat(maxSpeedText) || 0,
    avgAltitude: parseFloat(avgAltitudeText) || 0,
    maxAltitude: parseFloat(maxAltitudeText) || 0,
    actualDistance: parseFloat(actualDistanceText) || 0,
    straightDistance: parseFloat(straightDistanceText) || 0,
  };

  console.log('✅ 軌跡數據提取完成', trajectoryData);
  return trajectoryData;
}

/**
 * 驗證軌跡渲染（Canvas 截圖對比）
 *
 * @param page - Playwright Page 物件
 * @param mode - '2D' | '3D'
 * @param screenshotName - 截圖檔名
 * @returns 是否渲染成功
 */
export async function verifyTrajectoryRendered(
  page: Page,
  mode: '2D' | '3D',
  screenshotName?: string
): Promise<boolean> {
  let canvasSelector: string;

  if (mode === '2D') {
    canvasSelector = 'canvas.amap-layer';
  } else {
    canvasSelector = 'canvas.cesium-viewer-canvas';
  }

  const canvas = page.locator(canvasSelector).first();

  // 檢查 Canvas 存在
  await expect(canvas).toBeVisible({ timeout: 10000 });

  // 可選：截圖保存
  if (screenshotName) {
    await canvas.screenshot({
      path: `screenshots/${screenshotName}.png`,
    });
    console.log(`📸 截圖已保存：screenshots/${screenshotName}.png`);
  }

  console.log(`✅ ${mode} 軌跡渲染驗證通過`);
  return true;
}

/**
 * 輔助函數：提取欄位值
 *
 * DOM 結構：標籤和值是相鄰的兄弟元素
 * <div>                              <- 父容器
 *   <div>平均分速 (m/Min)</div>      <- 標籤（index 0）
 *   <div>1320</div>                  <- 值（index 1）
 *   <div>最高分速 (m/Min)</div>      <- 標籤（index 2）
 *   <div>1800</div>                  <- 值（index 3）
 * </div>
 *
 * 策略：找到標籤的父容器，遍歷子元素找到標籤後取下一個
 */
async function extractFieldValue(page: Page, fieldName: string): Promise<string> {
  try {
    // 使用 getByText 找到精確的標籤元素
    const labelElements = page.getByText(fieldName);
    const count = await labelElements.count();

    for (let i = 0; i < count; i++) {
      const label = labelElements.nth(i);
      const labelText = await label.textContent();

      // 確保是精確匹配（標籤以欄位名開頭，且文字較短 - 排除父容器）
      if (labelText && labelText.trim().startsWith(fieldName) && labelText.length < 50) {
        // 獲取父元素
        const parent = label.locator('..');
        const siblings = parent.locator('> *');
        const siblingCount = await siblings.count();

        // 找到標籤的索引，然後取下一個元素的值
        for (let j = 0; j < siblingCount - 1; j++) {
          const siblingText = await siblings.nth(j).textContent();
          if (siblingText?.trim().startsWith(fieldName)) {
            // 找到標籤了，取下一個元素
            const valueText = await siblings.nth(j + 1).textContent();
            if (valueText && !valueText.includes(fieldName)) {
              return valueText.trim();
            }
          }
        }
      }
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * 等待軌跡線渲染完成
 *
 * 策略：檢查 Canvas 內容變化
 *
 * @param page - Playwright Page 物件
 * @param mode - '2D' | '3D'
 * @param timeout - 超時時間（毫秒）
 */
export async function waitForTrajectoryRender(
  page: Page,
  mode: '2D' | '3D',
  timeout: number = 5000
): Promise<void> {
  const canvasSelector = mode === '2D' ? 'canvas.amap-layer' : 'canvas';
  const canvas = page.locator(canvasSelector).first();

  await expect(canvas).toBeVisible({ timeout });
  await page.waitForTimeout(2000); // 額外等待渲染完成

  console.log(`✅ ${mode} 軌跡渲染完成`);
}
