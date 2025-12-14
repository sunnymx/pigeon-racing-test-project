/**
 * tc-06-001-trajectory-details.spec.ts - TC-06-001: 軌跡詳情 - 航點列表
 *
 * 對應規格：USER_JOURNEY_RECORD_V2.md 記錄點 #06
 *
 * 15 個測試項目：
 * - UI 互動驗證：6.1-6.5 (4 P0 + 1 P1)
 * - 策略 A 數值邏輯：6.6-6.9 (4 P0)
 * - 策略 B 數值範圍：6.10-6.12 (3 P1)
 * - Layer 2 一致性：6.13-6.15 (3 P0)
 */

import { test, expect } from '@playwright/test';
import { setupTrajectoryDetails, DEFAULT_TIMEOUT } from '../helpers/fixtures';
import {
  extractSummaryData,
  extractWaypoints,
  isDetailsPanelVisible,
  hasFinishMarker,
  getFinishWaypoint,
  SummaryData,
  WaypointData,
} from '../helpers/trajectory-details';

// ============================================================================
// 共用變數 - 避免重複提取數據
// ============================================================================

let summaryData: SummaryData;
let waypoints: WaypointData[];

// ============================================================================
// UI 互動驗證 (6.1-6.4) - P0
// ============================================================================

test.describe('TC-06-001: 軌跡詳情 - UI 驗證 @P0', () => {
  test.beforeEach(async ({ page }) => {
    const timeoutMultiplier = process.env.CI ? 5 : 2;
    test.setTimeout(DEFAULT_TIMEOUT * timeoutMultiplier);
    await setupTrajectoryDetails(page);
  });

  test('6.1 面板展開', async ({ page }) => {
    // 驗證 .info-container 面板可見
    const isVisible = await isDetailsPanelVisible(page);
    expect(isVisible).toBe(true);
  });

  test('6.2 摘要數據完整', async ({ page }) => {
    // 提取摘要數據
    const summary = await extractSummaryData(page);

    // 驗證必要欄位存在且有值
    expect(summary.ringNumber).toBeTruthy();
    expect(summary.startTime).toBeTruthy();
    expect(summary.endTime).toBeTruthy();
    expect(summary.duration).toBeTruthy();

    // 驗證數值欄位 > 0
    expect(summary.avgSpeed).toBeGreaterThan(0);
    expect(summary.maxSpeed).toBeGreaterThan(0);
    expect(summary.actualDistance).toBeGreaterThan(0);
  });

  test('6.3 航點列表載入', async ({ page }) => {
    // 提取航點列表
    const wps = await extractWaypoints(page);

    // 驗證航點數量 > 0
    expect(wps.length).toBeGreaterThan(0);

    // 驗證第一個航點結構完整
    const firstWp = wps[0];
    expect(firstWp.waypoint).toBeDefined();
    expect(firstWp.time).toBeTruthy();
    expect(firstWp.duration).toBeTruthy();
  });

  test('6.4 終點標記存在', async ({ page }) => {
    // 驗證 🏁 終點標記存在
    const hasFinish = await hasFinishMarker(page);
    expect(hasFinish).toBe(true);

    // 驗證終點航點數據可提取
    const finishWp = await getFinishWaypoint(page);
    expect(finishWp).not.toBeNull();
    expect(finishWp?.waypoint).toBe('🏁');
  });
});

// ============================================================================
// 策略 A: 數值邏輯驗證 (6.6-6.9) - P0
// ============================================================================

test.describe('TC-06-001: 軌跡詳情 - 數值邏輯 @P0', () => {
  test.beforeEach(async ({ page }) => {
    const timeoutMultiplier = process.env.CI ? 5 : 2;
    test.setTimeout(DEFAULT_TIMEOUT * timeoutMultiplier);
    await setupTrajectoryDetails(page);

    // 預先提取數據供後續測試使用
    summaryData = await extractSummaryData(page);
    waypoints = await extractWaypoints(page);
  });

  test('6.6 最高分速 >= 平均分速', async () => {
    expect(summaryData.maxSpeed).toBeGreaterThanOrEqual(summaryData.avgSpeed);
  });

  test('6.7 最大高度 >= 平均高度', async () => {
    expect(summaryData.maxAltitude).toBeGreaterThanOrEqual(summaryData.avgAltitude);
  });

  test('6.8 實際距離 >= 直線距離', async () => {
    expect(summaryData.actualDistance).toBeGreaterThanOrEqual(summaryData.straightDistance);
  });

  test('6.9 終點時間 > 起點時間', async () => {
    // 解析時間字串 (格式: YYYY-MM-DD HH:MM:SS 或 HH:MM:SS)
    const parseTime = (timeStr: string): Date => {
      // 如果只有時間，加上假日期
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
        return new Date(`2000-01-01 ${timeStr}`);
      }
      return new Date(timeStr);
    };

    const startTime = parseTime(summaryData.startTime);
    const endTime = parseTime(summaryData.endTime);

    expect(endTime.getTime()).toBeGreaterThan(startTime.getTime());
  });
});

// ============================================================================
// 策略 B: 數值範圍驗證 (6.10-6.12) - P1
// ============================================================================

test.describe('TC-06-001: 軌跡詳情 - 數值範圍 @P1', () => {
  test.beforeEach(async ({ page }) => {
    const timeoutMultiplier = process.env.CI ? 5 : 2;
    test.setTimeout(DEFAULT_TIMEOUT * timeoutMultiplier);
    await setupTrajectoryDetails(page);

    summaryData = await extractSummaryData(page);
  });

  test('6.10 分速範圍 500~3000 m/min', async () => {
    // 賽鴿分速範圍（根據實測數據調整：最高可達 2220+）
    expect(summaryData.avgSpeed).toBeGreaterThanOrEqual(500);
    expect(summaryData.avgSpeed).toBeLessThanOrEqual(3000);
    expect(summaryData.maxSpeed).toBeGreaterThanOrEqual(500);
    expect(summaryData.maxSpeed).toBeLessThanOrEqual(3000);
  });

  test('6.11 高度範圍 0~2000 m', async () => {
    // 賽鴿飛行高度（根據實測數據調整：最高可達 1232+）
    expect(summaryData.avgAltitude).toBeGreaterThanOrEqual(0);
    expect(summaryData.avgAltitude).toBeLessThanOrEqual(2000);
    expect(summaryData.maxAltitude).toBeGreaterThanOrEqual(0);
    expect(summaryData.maxAltitude).toBeLessThanOrEqual(2000);
  });

  test('6.12 距離範圍 5~800 km', async () => {
    // 賽鴿合理比賽距離（短程賽可低於 10km，長程決賽可達 500+ km）
    expect(summaryData.actualDistance).toBeGreaterThanOrEqual(5);
    expect(summaryData.actualDistance).toBeLessThanOrEqual(800);
  });
});

// ============================================================================
// Layer 2: 摘要與航點一致性驗證 (6.13-6.15) - P0
// ============================================================================

test.describe('TC-06-001: 軌跡詳情 - 一致性驗證 @P0', () => {
  test.beforeEach(async ({ page }) => {
    const timeoutMultiplier = process.env.CI ? 5 : 2;
    test.setTimeout(DEFAULT_TIMEOUT * timeoutMultiplier);
    await setupTrajectoryDetails(page);

    summaryData = await extractSummaryData(page);
    waypoints = await extractWaypoints(page);
  });

  test('6.13 最高分速 = max(航點.speed)', async () => {
    // 從航點計算最高分速
    const numericWps = waypoints.filter((w) => typeof w.waypoint === 'number');
    const speeds = numericWps.map((w) => w.speed).filter((s) => s > 0);
    const calculatedMaxSpeed = Math.max(...speeds);

    // 驗證精確匹配
    expect(summaryData.maxSpeed).toBe(calculatedMaxSpeed);
  });

  test('6.14 最大高度 = max(航點.altitude)', async () => {
    // 從航點計算最大高度
    const numericWps = waypoints.filter((w) => typeof w.waypoint === 'number');
    const altitudes = numericWps.map((w) => w.altitude);
    const calculatedMaxAlt = Math.max(...altitudes);

    // 驗證精確匹配
    expect(summaryData.maxAltitude).toBe(calculatedMaxAlt);
  });

  test('6.15 實際距離 = 終點航點.distance', async () => {
    // 終點航點的 distance 應等於摘要的實際距離
    const finishWp = waypoints.find((w) => w.waypoint === '🏁');

    if (finishWp) {
      // 精確匹配（或使用小容差處理四捨五入）
      expect(summaryData.actualDistance).toBeCloseTo(finishWp.distance, 1);
    } else {
      // 備用：使用最後一個數值航點
      const numericWps = waypoints.filter((w) => typeof w.waypoint === 'number');
      const lastWp = numericWps[numericWps.length - 1];
      expect(summaryData.actualDistance).toBeCloseTo(lastWp.distance, 1);
    }
  });
});
