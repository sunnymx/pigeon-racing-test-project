/**
 * trajectory-details.ts - 軌跡詳情面板 helper 函數
 *
 * 支援記錄點 #06: 軌跡詳情 - 航點列表
 * 處理已知問題: 航點列表需點擊按鈕觸發渲染
 */

import { Page } from '@playwright/test';

// ============================================================================
// 類型定義
// ============================================================================

export interface SummaryData {
  ringNumber: string;      // 公環號
  startTime: string;       // 起點時間
  endTime: string;         // 終點時間
  duration: string;        // 持續時間
  avgSpeed: number;        // 平均分速 (m/min)
  maxSpeed: number;        // 最高分速 (m/min)
  avgAltitude: number;     // 平均高度 (m)
  maxAltitude: number;     // 最大高度 (m)
  actualDistance: number;  // 實際距離 (km)
  straightDistance: number; // 直線距離 (km)
}

export interface WaypointData {
  waypoint: number | '🏁'; // 航點號或終點標記
  time: string;            // 時間 HH:MM:SS
  duration: string;        // 累積時間
  distance: number;        // 距離 (km)
  altitude: number;        // 海拔 (m)
  speed: number;           // 速度 (m/min)
}

// ============================================================================
// 面板操作
// ============================================================================

/**
 * 打開軌跡詳情面板
 *
 * 按鈕選擇器: button[mattooltip="軌跡詳情"] 或 description="軌跡詳情"
 */
export async function openTrajectoryDetails(page: Page): Promise<void> {
  // 嘗試多種選擇器
  const detailsButton = page.locator(
    'button[mattooltip="軌跡詳情"], button[mattooltip="轨迹详情"]'
  ).first();

  if (await detailsButton.isVisible().catch(() => false)) {
    await detailsButton.click();
  } else {
    // 備用：透過 accessible description
    await page.getByRole('button', { name: /軌跡詳情|轨迹详情/ }).click();
  }

  // 等待面板展開和終點標記出現
  await page.waitForSelector('.info-container', { timeout: 10000 });
  await page.waitForTimeout(1000);
}

/**
 * 檢查軌跡詳情面板是否可見
 */
export async function isDetailsPanelVisible(page: Page): Promise<boolean> {
  return await page.locator('.info-container').isVisible().catch(() => false);
}

// ============================================================================
// 數據提取
// ============================================================================

/**
 * 提取摘要數據
 *
 * 使用 TreeWalker 遍歷 .info-container 內的文字節點
 */
export async function extractSummaryData(page: Page): Promise<SummaryData> {
  return await page.evaluate(() => {
    const container = document.querySelector('.info-container');
    if (!container) throw new Error('.info-container not found');

    // 遍歷所有文字節點
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent?.trim();
      if (t) texts.push(t);
    }

    // 根據標籤取得下一個值
    const getValue = (label: string): string | null => {
      const idx = texts.findIndex((t) => t.includes(label));
      return idx !== -1 && idx + 1 < texts.length ? texts[idx + 1] : null;
    };

    return {
      ringNumber: getValue('公环号') || '',
      startTime: getValue('起点时间') || '',
      endTime: getValue('终点时间') || '',
      duration: getValue('持续时间') || '',
      avgSpeed: parseFloat(getValue('平均分速') || '0'),
      maxSpeed: parseFloat(getValue('最高分速') || '0'),
      avgAltitude: parseFloat(getValue('平均高度') || '0'),
      maxAltitude: parseFloat(getValue('最大高度') || '0'),
      actualDistance: parseFloat(getValue('实际距离') || '0'),
      straightDistance: parseFloat(getValue('直线距离') || '0'),
    };
  });
}

/**
 * 提取航點列表
 *
 * DOM 結構差異：
 * - 普通航點 (6 元素): [航點號] [時間] [累積] [距離] [海拔] [速度]
 * - 終點航點 (7 元素): [🏁] [航點號] [時間] [累積] [距離] [海拔] [速度]
 */
export async function extractWaypoints(page: Page): Promise<WaypointData[]> {
  return await page.evaluate(() => {
    const container = document.querySelector('.info-container');
    if (!container) return [];

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent?.trim();
      if (t) texts.push(t);
    }

    // 找到「速度」標題，之後是航點數據
    const speedIdx = texts.findIndex((t) => t === '速度');
    if (speedIdx === -1) return [];

    // 過濾干擾項
    const wpTexts = texts
      .slice(speedIdx + 1)
      .filter((t) => !['2d', '2D模式', '切换图资', '版权所有', '备案号'].some((k) => t.includes(k)));

    const waypoints: WaypointData[] = [];
    let i = 0;

    while (i < wpTexts.length) {
      const current = wpTexts[i];

      // 終點航點：🏁 開頭，共 7 個元素
      if (current === '🏁') {
        if (i + 6 >= wpTexts.length) break;
        waypoints.push({
          waypoint: '🏁',
          time: wpTexts[i + 2],        // 跳過 🏁 和航點號
          duration: wpTexts[i + 3],
          distance: parseFloat(wpTexts[i + 4]),
          altitude: parseFloat(wpTexts[i + 5]),
          speed: parseFloat(wpTexts[i + 6]),
        });
        i += 7; // 🏁 + 航點號 + 5 數據 = 7
      }
      // 普通航點：數字開頭，共 6 個元素
      else if (/^\d+$/.test(current)) {
        if (i + 5 >= wpTexts.length) break;
        waypoints.push({
          waypoint: parseInt(current),
          time: wpTexts[i + 1],
          duration: wpTexts[i + 2],
          distance: parseFloat(wpTexts[i + 3]),
          altitude: parseFloat(wpTexts[i + 4]),
          speed: parseFloat(wpTexts[i + 5]),
        });
        i += 6;
      }
      // 非航點數據，跳過
      else {
        i += 1;
      }
    }

    return waypoints;
  });
}

/**
 * 檢查終點標記是否存在
 */
export async function hasFinishMarker(page: Page): Promise<boolean> {
  const waypoints = await extractWaypoints(page);
  return waypoints.some((w) => w.waypoint === '🏁');
}

/**
 * 取得終點航點數據
 */
export async function getFinishWaypoint(page: Page): Promise<WaypointData | null> {
  const waypoints = await extractWaypoints(page);
  return waypoints.find((w) => w.waypoint === '🏁') || null;
}
