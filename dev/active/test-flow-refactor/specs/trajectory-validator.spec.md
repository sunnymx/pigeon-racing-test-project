# 軌跡詳情驗證規格

**檔案位置**: `tests/helpers/trajectory-validator.ts`
**優先級**: 🔴 必做
**預估行數**: ~150 行
**驗證日期**: 2025-12-03 (DevTools MCP 實測驗證)
**最後更新**: 2025-12-05 (新增前置條件：航點列表渲染觸發步驟)

---

## 1. 目的

為軌跡詳情頁面提供完整的數據驗證：
- 摘要面板數據讀取
- 航點列表數據提取
- 摘要與航點交叉驗證
- 驗證報告生成

---

## 1.5 前置條件

> ⚠️ **重要**: 航點列表需點擊按鈕觸發渲染（2025-12-05 驗證發現）

### 進入步驟

1. 進入軌跡頁面
2. **點擊「軌跡詳情」按鈕** (`button description="軌跡詳情"`)
3. 等待航點列表渲染（檢查 🏁 出現）

### 注意事項

- 軌跡詳情面板可能已開啟顯示摘要數據，但**航點列表需按鈕點擊事件觸發**
- 參考: [USER_JOURNEY_RECORD.md 記錄點 #9](../USER_JOURNEY_RECORD.md#記錄點-9-軌跡詳情---航點列表)

---

## 2. 驗證策略

### 雙層驗證架構

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: 摘要數據健全性檢查 (Strategy A/B)                  │
│  ├── 策略 A: 數值邏輯驗證 (內部一致性)                       │
│  └── 策略 B: 數值範圍驗證 (領域合理性)                       │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: 摘要與航點一致性驗證                               │
│  └── 摘要面板數據 vs 航點列表計算值                          │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: 跨數據源比對 (Strategy C) [可選]                   │
│  └── 軌跡詳情 vs 排名榜 vs InfoWindow                        │
└─────────────────────────────────────────────────────────────┘
```

### 策略 A: 數值邏輯驗證 (內部一致性)

> 驗證數據本身的數學/邏輯關係是否正確

| # | 驗證規則 | 說明 | 優先級 |
|---|---------|------|--------|
| A1 | 最高分速 ≥ 平均分速 | 最大值必須 ≥ 平均值 | P0 |
| A2 | 最大高度 ≥ 平均高度 | 最大值必須 ≥ 平均值 | P0 |
| A3 | 實際距離 ≥ 直線距離 | 實際路徑必定 ≥ 直線 | P0 |
| A4 | 終點時間 > 起點時間 | 時序邏輯 | P0 |
| A5 | 持續時間 ≈ 終點 - 起點 | 容差 ±1 分鐘 | P1 |

### 策略 B: 數值範圍驗證 (領域合理性)

> 驗證數據是否在賽鴿飛行的合理範圍內

| # | 驗證項目 | 合理範圍 | 說明 | 優先級 |
|---|---------|----------|------|--------|
| B1 | 分速 | 800 ~ 2000 m/min | 賽鴿典型飛行速度 | P1 |
| B2 | 高度 | 0 ~ 500 m | 一般飛行高度 | P1 |
| B3 | 距離 | 10 ~ 500 km | 比賽距離範圍 | P1 |
| B4 | 持續時間 | 30min ~ 8hr | 比賽時長範圍 | P2 |

**注意**: 範圍可根據具體賽事類型調整（短距離賽 vs 長距離賽）

### 策略 C: 跨數據源比對 (可選)

> 驗證不同頁面/組件顯示的同一數據是否一致

| # | 驗證規則 | 數據源 A | 數據源 B | 容差 | 優先級 |
|---|---------|----------|----------|------|--------|
| C1 | 環號一致 | 軌跡詳情.環號 | InfoWindow.環號 | 精確 | P1 |
| C2 | 分速一致 | 軌跡詳情.分速 | 排名榜.分速 | ±5 | P2 |

---

### 驗證流程

```
Step 1: 讀取摘要面板數據
         ↓
Step 2: 執行策略 A (邏輯驗證) ── 失敗則標記數據異常
         ↓
Step 3: 執行策略 B (範圍驗證) ── 失敗則標記數據可疑
         ↓
Step 4: 提取航點列表數據
         ↓
Step 5: 從航點計算統計值
         ↓
Step 6: 比對摘要 vs 航點計算值 (Layer 2)
         ↓
Step 7: [可選] 執行策略 C (跨源驗證)
         ↓
Step 8: 生成驗證報告
```

---

### Layer 2: 摘要與航點一致性驗證項目

| # | 驗證項目 | 計算方式 | 容差 | 優先級 |
|---|---------|----------|------|--------|
| 1 | 最高分速 | max(航點.speed) | 精確匹配 | P0 |
| 2 | 最大高度 | max(航點.altitude) | 精確匹配 | P0 |
| 3 | 實際距離 | 終點航點.distance | 精確匹配 | P0 |
| 4 | 持續時間 | 終點航點.duration | 精確匹配 | P0 |
| 5 | 平均分速 | avg(航點.speed) | ±15% | P1 |
| 6 | 平均高度 | avg(航點.altitude) | ±10% | P1 |

---

## 3. 介面定義

```typescript
// ============================================================================
// 型別定義
// ============================================================================

export interface SummaryData {
  ringNumber: string;          // 公環號
  startTime: string;           // 起點時間
  endTime: string;             // 終點時間
  duration: string;            // 持續時間 (HH:MM:SS)
  avgSpeed: number;            // 平均分速 (m/min)
  maxSpeed: number;            // 最高分速 (m/min)
  avgAltitude: number;         // 平均高度 (m)
  maxAltitude: number;         // 最大高度 (m)
  actualDistance: number;      // 實際距離 (km)
  straightDistance: number;    // 直線距離 (km)
}

export interface WaypointData {
  waypoint: number | '🏁';     // 航點序號或終點旗標
  time: string;                // 時間 (HH:MM:SS)
  duration: string;            // 累積時間 (HH:MM:SS)
  distance: number;            // 累積距離 (km)
  altitude: number;            // 海拔高度 (m)
  speed: number;               // 分速 (m/min)
}

export interface CalculatedStats {
  totalWaypoints: number;
  maxSpeed: number;
  avgSpeed: number;
  maxAltitude: number;
  avgAltitude: number;
  totalDistance: number;
  finalDuration: string;
}

export interface ValidationResult {
  name: string;
  expected: number | string;
  actual: number | string;
  diff?: number;
  passed: boolean;
  tolerance: string;
}

export interface TrajectoryValidationReport {
  testName: string;
  timestamp: string;
  pigeonInfo: {
    ringNumber: string;
    startTime: string;
    endTime: string;
  };
  summary: SummaryData;
  calculated: CalculatedStats;
  validations: ValidationResult[];
  passed: boolean;
  passedCount: number;
  failedCount: number;
  totalTests: number;
}
```

---

## 4. 核心類別

```typescript
import { Page } from '@playwright/test';

export class TrajectoryValidator {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ========================================
  // 數據提取
  // ========================================

  /**
   * 從軌跡詳情面板提取摘要數據
   */
  async extractSummaryData(): Promise<SummaryData> {
    return await this.page.evaluate(() => {
      const infoContainer = document.querySelector('.info-container');
      if (!infoContainer) throw new Error('info-container not found');

      const walker = document.createTreeWalker(infoContainer, NodeFilter.SHOW_TEXT);
      const texts: string[] = [];
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent?.trim();
        if (text) texts.push(text);
      }

      const getValueAfter = (label: string): string | null => {
        const idx = texts.findIndex(t => t.includes(label));
        return idx !== -1 && idx + 1 < texts.length ? texts[idx + 1] : null;
      };

      return {
        ringNumber: getValueAfter('公环号') || '',
        startTime: getValueAfter('起点时间') || '',
        endTime: getValueAfter('终点时间') || '',
        duration: getValueAfter('持续时间') || '',
        avgSpeed: parseFloat(getValueAfter('平均分速') || '0'),
        maxSpeed: parseFloat(getValueAfter('最高分速') || '0'),
        avgAltitude: parseFloat(getValueAfter('平均高度') || '0'),
        maxAltitude: parseFloat(getValueAfter('最大高度') || '0'),
        actualDistance: parseFloat(getValueAfter('实际距离') || '0'),
        straightDistance: parseFloat(getValueAfter('直线距离') || '0'),
      };
    });
  }

  /**
   * 從軌跡詳情面板提取航點列表
   */
  async extractWaypoints(): Promise<WaypointData[]> {
    return await this.page.evaluate(() => {
      const infoContainer = document.querySelector('.info-container');
      if (!infoContainer) throw new Error('info-container not found');

      const walker = document.createTreeWalker(infoContainer, NodeFilter.SHOW_TEXT);
      const texts: string[] = [];
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent?.trim();
        if (text) texts.push(text);
      }

      // 找到航點列表開始位置
      const speedIndex = texts.findIndex(t => t === '速度');
      if (speedIndex === -1) return [];

      const waypointTexts = texts.slice(speedIndex + 1).filter(t =>
        !['2d', '2D模式', '切换图资', '版权所有', '备案号'].some(k => t.includes(k))
      );

      const waypoints: WaypointData[] = [];
      for (let i = 0; i < waypointTexts.length; i += 6) {
        if (i + 5 < waypointTexts.length) {
          const wp = waypointTexts[i];
          if (/^\d+$/.test(wp) || wp === '🏁') {
            waypoints.push({
              waypoint: wp === '🏁' ? '🏁' : parseInt(wp),
              time: waypointTexts[i + 1],
              duration: waypointTexts[i + 2],
              distance: parseFloat(waypointTexts[i + 3]),
              altitude: parseFloat(waypointTexts[i + 4]),
              speed: parseFloat(waypointTexts[i + 5]),
            });
          }
        }
      }

      return waypoints;
    });
  }

  // ========================================
  // 統計計算
  // ========================================

  /**
   * 從航點列表計算統計值
   */
  calculateStats(waypoints: WaypointData[]): CalculatedStats {
    const numericWaypoints = waypoints.filter(w => typeof w.waypoint === 'number');
    const validSpeeds = numericWaypoints.map(w => w.speed).filter(s => s > 0);
    const altitudes = numericWaypoints.map(w => w.altitude);

    // 找到終點數據
    const finishWaypoint = waypoints.find(w => w.waypoint === '🏁');
    const lastNumeric = numericWaypoints[numericWaypoints.length - 1];

    // 終點航點的距離和時間
    let totalDistance: number;
    let finalDuration: string;

    if (finishWaypoint) {
      // 🏁 的數據需要特殊處理 (從原始文字流解析)
      // 結構: 🏁 | 86 | 11:40:09 | 03:39:09 | 319.42 | 56 | 0
      totalDistance = finishWaypoint.altitude; // 位置偏移，實際是距離
      finalDuration = finishWaypoint.duration;
    } else {
      totalDistance = lastNumeric?.distance || 0;
      finalDuration = lastNumeric?.duration || '';
    }

    return {
      totalWaypoints: waypoints.length,
      maxSpeed: Math.max(...validSpeeds),
      avgSpeed: Math.round(validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length),
      maxAltitude: Math.max(...altitudes),
      avgAltitude: Math.round(altitudes.reduce((a, b) => a + b, 0) / altitudes.length),
      totalDistance,
      finalDuration,
    };
  }

  // ========================================
  // 驗證比對
  // ========================================

  /**
   * 執行完整驗證
   */
  async validate(): Promise<TrajectoryValidationReport> {
    const summary = await this.extractSummaryData();
    const waypoints = await this.extractWaypoints();

    // 特殊處理終點航點距離和時間
    const texts = await this.page.evaluate(() => {
      const infoContainer = document.querySelector('.info-container');
      if (!infoContainer) return [];
      const walker = document.createTreeWalker(infoContainer, NodeFilter.SHOW_TEXT);
      const texts: string[] = [];
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent?.trim();
        if (text) texts.push(text);
      }
      return texts;
    });

    const finishIndex = texts.findIndex(t => t === '🏁');
    let finalDistance = 0;
    let finalDuration = '';

    if (finishIndex !== -1) {
      finalDistance = parseFloat(texts[finishIndex + 4] || '0');
      finalDuration = texts[finishIndex + 3] || '';
    }

    const calculated: CalculatedStats = {
      ...this.calculateStats(waypoints),
      totalDistance: finalDistance,
      finalDuration,
    };

    const validations: ValidationResult[] = [];
    let passed = true;

    // 驗證 1: 最高分速
    const maxSpeedMatch = summary.maxSpeed === calculated.maxSpeed;
    validations.push({
      name: '最高分速',
      expected: summary.maxSpeed,
      actual: calculated.maxSpeed,
      passed: maxSpeedMatch,
      tolerance: '精確匹配',
    });
    if (!maxSpeedMatch) passed = false;

    // 驗證 2: 最大高度
    const maxAltMatch = summary.maxAltitude === calculated.maxAltitude;
    validations.push({
      name: '最大高度',
      expected: summary.maxAltitude,
      actual: calculated.maxAltitude,
      passed: maxAltMatch,
      tolerance: '精確匹配',
    });
    if (!maxAltMatch) passed = false;

    // 驗證 3: 平均分速 (±15%)
    const avgSpeedDiff = Math.abs(summary.avgSpeed - calculated.avgSpeed);
    const avgSpeedTolerance = summary.avgSpeed * 0.15;
    const avgSpeedMatch = avgSpeedDiff <= avgSpeedTolerance;
    validations.push({
      name: '平均分速',
      expected: summary.avgSpeed,
      actual: calculated.avgSpeed,
      diff: avgSpeedDiff,
      passed: avgSpeedMatch,
      tolerance: `±15% (${Math.round(avgSpeedTolerance)})`,
    });
    if (!avgSpeedMatch) passed = false;

    // 驗證 4: 平均高度 (±10%)
    const avgAltDiff = Math.abs(summary.avgAltitude - calculated.avgAltitude);
    const avgAltTolerance = summary.avgAltitude * 0.10;
    const avgAltMatch = avgAltDiff <= avgAltTolerance;
    validations.push({
      name: '平均高度',
      expected: summary.avgAltitude,
      actual: calculated.avgAltitude,
      diff: avgAltDiff,
      passed: avgAltMatch,
      tolerance: `±10% (${Math.round(avgAltTolerance)})`,
    });
    if (!avgAltMatch) passed = false;

    // 驗證 5: 實際距離
    const distanceMatch = summary.actualDistance === calculated.totalDistance;
    validations.push({
      name: '實際距離',
      expected: summary.actualDistance,
      actual: calculated.totalDistance,
      passed: distanceMatch,
      tolerance: '精確匹配',
    });
    if (!distanceMatch) passed = false;

    // 驗證 6: 持續時間
    const durationMatch = summary.duration === calculated.finalDuration;
    validations.push({
      name: '持續時間',
      expected: summary.duration,
      actual: calculated.finalDuration,
      passed: durationMatch,
      tolerance: '精確匹配',
    });
    if (!durationMatch) passed = false;

    return {
      testName: '軌跡詳情數據一致性驗證',
      timestamp: new Date().toISOString(),
      pigeonInfo: {
        ringNumber: summary.ringNumber,
        startTime: summary.startTime,
        endTime: summary.endTime,
      },
      summary,
      calculated,
      validations,
      passed,
      passedCount: validations.filter(v => v.passed).length,
      failedCount: validations.filter(v => !v.passed).length,
      totalTests: validations.length,
    };
  }

  // ========================================
  // 報告輸出
  // ========================================

  printReport(report: TrajectoryValidationReport): void {
    console.log('\n========================================');
    console.log('軌跡詳情數據驗證報告');
    console.log('========================================');
    console.log(`鴿子: ${report.pigeonInfo.ringNumber}`);
    console.log(`時間: ${report.pigeonInfo.startTime} ~ ${report.pigeonInfo.endTime}`);
    console.log(`航點數: ${report.calculated.totalWaypoints}`);
    console.log('----------------------------------------');

    for (const v of report.validations) {
      const status = v.passed ? '✅' : '❌';
      const diffStr = v.diff !== undefined ? ` (差異: ${v.diff})` : '';
      console.log(`${status} ${v.name}: 期望 ${v.expected}, 實際 ${v.actual}${diffStr}`);
    }

    console.log('----------------------------------------');
    console.log(`結果: ${report.passed ? '✅ PASSED' : '❌ FAILED'} (${report.passedCount}/${report.totalTests})`);
    console.log('========================================\n');
  }
}
```

---

## 5. 使用範例

```typescript
// user-journey.spec.ts
import { TrajectoryValidator } from '../helpers/trajectory-validator';

test.describe('使用者旅程', () => {
  test('階段 3.5: 軌跡詳情數據驗證', async ({ page }) => {
    // 前置條件: 已進入軌跡頁面並開啟軌跡詳情面板

    const validator = new TrajectoryValidator(page);
    const report = await validator.validate();

    // 輸出報告
    validator.printReport(report);

    // 驗證結果
    expect(report.passed).toBe(true);
    expect(report.passedCount).toBe(report.totalTests);
  });
});
```

---

## 6. 終點航點特殊處理

### 問題描述

終點航點 🏁 的 DOM 結構與普通航點不同：

```
普通航點: [航點號] [時間] [累積時間] [距離] [海拔] [速度]
終點航點: [🏁] [航點號] [時間] [累積時間] [距離] [海拔] [速度]
```

### 解決方案

```typescript
// 查找 🏁 位置後，使用偏移量取得正確數據
const finishIndex = texts.findIndex(t => t === '🏁');
if (finishIndex !== -1) {
  // 🏁 後面是: 86, 11:40:09, 03:39:09, 319.42, 56, 0
  const waypointNum = texts[finishIndex + 1];  // 86
  const time = texts[finishIndex + 2];          // 11:40:09
  const duration = texts[finishIndex + 3];      // 03:39:09
  const distance = texts[finishIndex + 4];      // 319.42
  const altitude = texts[finishIndex + 5];      // 56
  const speed = texts[finishIndex + 6];         // 0
}
```

---

## 7. 驗收標準

- [ ] 摘要數據正確提取
- [ ] 航點列表完整提取 (含終點 🏁)
- [ ] 精確匹配項目全部通過
- [ ] 容差匹配項目在範圍內
- [ ] 驗證報告格式清晰
- [ ] 單元測試覆蓋率 > 80%

---

## 8. 實測驗證記錄

**驗證日期**: 2025-12-03
**測試鴿子**: 27-0162950
**航點數量**: 86 (含終點)

### 測試結果: ✅ ALL PASSED (6/6)

| # | 驗證項目 | 摘要值 | 計算值 | 差異 | 容差 | 結果 |
|---|---------|--------|--------|------|------|------|
| 1 | 最高分速 | 1680 | 1680 | 0 | 精確 | ✅ |
| 2 | 最大高度 | 150 | 150 | 0 | 精確 | ✅ |
| 3 | 平均分速 | 1419 | 1453 | 34 | ±213 | ✅ |
| 4 | 平均高度 | 79 | 80 | 1 | ±8 | ✅ |
| 5 | 實際距離 | 319.42 | 319.42 | 0 | 精確 | ✅ |
| 6 | 持續時間 | 03:39:09 | 03:39:09 | 0 | 精確 | ✅ |
