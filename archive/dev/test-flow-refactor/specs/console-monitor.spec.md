# 控制台監控規格

**檔案位置**: `tests/helpers/console-monitor.ts`
**優先級**: 🔴 必做
**預估行數**: ~100 行

---

## 1. 目的

為階段 7（錯誤監控）提供完整實現：
- 統一的錯誤收集
- 已知錯誤白名單過濾
- 分階段錯誤報告

---

## 2. 介面定義

```typescript
// ============================================================================
// 型別定義
// ============================================================================

export type ConsoleEventType = 'error' | 'warn' | 'log' | 'info' | 'debug';

export interface ConsoleEvent {
  type: ConsoleEventType;
  message: string;
  stack?: string;
  url?: string;
  lineNumber?: number;
  timestamp: number;
  stage: number;
}

export interface ConsoleReport {
  totalEvents: number;
  criticalErrors: ConsoleEvent[];
  warningsByStage: Map<number, number>;
  errorsByType: Map<string, number>;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  stage: number;
  type: ConsoleEventType;
  time: string;
  preview: string;
}

export interface MonitorConfig {
  captureWarnings?: boolean;   // 預設 false
  captureLogs?: boolean;       // 預設 false
  maxEvents?: number;          // 預設 1000
}
```

---

## 3. 錯誤白名單

```typescript
/**
 * 已知的無害錯誤，不計入嚴重錯誤
 */
export const ERROR_WHITELIST: RegExp[] = [
  // 瀏覽器/擴展相關
  /favicon\.ico/i,
  /chrome-extension/i,
  /moz-extension/i,

  // 第三方服務
  /google.*analytics/i,
  /gtag/i,
  /hotjar/i,

  // 已知問題（已標記）
  /gpx2d.*undefined/i,          // 已知 2D 軌跡問題
  /Cesium.*deprecated/i,        // Cesium 棄用警告

  // 網路相關
  /net::ERR_BLOCKED/i,
  /CORS/i,

  // 地圖相關
  /AMap.*BINDbindbindbindbindbindbin/i,  // AMap 內部錯誤
];

/**
 * 嚴重錯誤關鍵字（即使在白名單中也要報告）
 */
export const CRITICAL_PATTERNS: RegExp[] = [
  /uncaught.*error/i,
  /unhandled.*rejection/i,
  /fatal/i,
  /crash/i,
];
```

---

## 4. 核心類別

```typescript
export class ConsoleMonitor {
  private events: ConsoleEvent[] = [];
  private currentStage: number = 1;
  private config: Required<MonitorConfig>;
  private isSetup: boolean = false;

  constructor(config: MonitorConfig = {}) {
    this.config = {
      captureWarnings: config.captureWarnings ?? false,
      captureLogs: config.captureLogs ?? false,
      maxEvents: config.maxEvents ?? 1000,
    };
  }

  // ========================================
  // 設置監聽
  // ========================================

  setup(page: Page): void {
    if (this.isSetup) {
      console.warn('ConsoleMonitor 已設置，跳過重複設置');
      return;
    }

    // 監聽 console 事件
    page.on('console', (msg) => {
      const type = msg.type() as ConsoleEventType;

      // 根據配置決定是否捕獲
      if (type === 'log' && !this.config.captureLogs) return;
      if (type === 'warn' && !this.config.captureWarnings) return;

      this.addEvent({
        type,
        message: msg.text(),
        url: msg.location().url,
        lineNumber: msg.location().lineNumber,
        timestamp: Date.now(),
        stage: this.currentStage,
      });
    });

    // 監聽頁面錯誤
    page.on('pageerror', (error) => {
      this.addEvent({
        type: 'error',
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        stage: this.currentStage,
      });
    });

    this.isSetup = true;
  }

  // ========================================
  // 事件管理
  // ========================================

  private addEvent(event: ConsoleEvent): void {
    if (this.events.length >= this.config.maxEvents) {
      this.events.shift(); // 移除最舊的事件
    }
    this.events.push(event);
  }

  setStage(stageId: number): void {
    this.currentStage = stageId;
  }

  clear(): void {
    this.events = [];
  }

  // ========================================
  // 過濾與查詢
  // ========================================

  getEventsByStage(stageId: number): ConsoleEvent[] {
    return this.events.filter(e => e.stage === stageId);
  }

  getErrors(): ConsoleEvent[] {
    return this.events.filter(e => e.type === 'error');
  }

  getCriticalErrors(): ConsoleEvent[] {
    return this.getErrors().filter(e => {
      // 檢查是否為嚴重錯誤
      if (CRITICAL_PATTERNS.some(p => p.test(e.message))) {
        return true;
      }

      // 檢查是否在白名單中
      if (ERROR_WHITELIST.some(p => p.test(e.message))) {
        return false;
      }

      return true;
    });
  }

  // ========================================
  // 報告生成
  // ========================================

  getReport(): ConsoleReport {
    const criticalErrors = this.getCriticalErrors();

    // 按階段統計警告
    const warningsByStage = new Map<number, number>();
    this.events
      .filter(e => e.type === 'warn')
      .forEach(e => {
        const count = warningsByStage.get(e.stage) || 0;
        warningsByStage.set(e.stage, count + 1);
      });

    // 按類型統計錯誤
    const errorsByType = new Map<string, number>();
    this.getErrors().forEach(e => {
      const type = this.categorizeError(e.message);
      const count = errorsByType.get(type) || 0;
      errorsByType.set(type, count + 1);
    });

    // 時間軸
    const timeline = this.events.map(e => ({
      stage: e.stage,
      type: e.type,
      time: new Date(e.timestamp).toISOString(),
      preview: e.message.substring(0, 80) + (e.message.length > 80 ? '...' : ''),
    }));

    return {
      totalEvents: this.events.length,
      criticalErrors,
      warningsByStage,
      errorsByType,
      timeline,
    };
  }

  private categorizeError(message: string): string {
    if (/network|fetch|xhr/i.test(message)) return 'Network';
    if (/syntax|parse/i.test(message)) return 'Syntax';
    if (/type.*error|undefined|null/i.test(message)) return 'TypeError';
    if (/reference/i.test(message)) return 'ReferenceError';
    return 'Other';
  }

  // ========================================
  // 格式化輸出
  // ========================================

  printSummary(): void {
    const report = this.getReport();

    console.log('\n========================================');
    console.log('控制台監控摘要');
    console.log('========================================');
    console.log(`總事件數: ${report.totalEvents}`);
    console.log(`嚴重錯誤: ${report.criticalErrors.length}`);

    if (report.criticalErrors.length > 0) {
      console.log('\n⚠️ 嚴重錯誤詳情:');
      report.criticalErrors.forEach((e, i) => {
        console.log(`  ${i + 1}. [階段 ${e.stage}] ${e.message.substring(0, 100)}`);
      });
    }

    console.log('\n各階段警告數:');
    report.warningsByStage.forEach((count, stage) => {
      console.log(`  階段 ${stage}: ${count} 個警告`);
    });

    console.log('========================================\n');
  }
}
```

---

## 5. 使用範例

```typescript
// user-journey.spec.ts
import { ConsoleMonitor } from '../helpers/console-monitor';

test.describe('使用者旅程', () => {
  const monitor = new ConsoleMonitor({
    captureWarnings: true,
  });

  test.beforeAll(async ({ page }) => {
    monitor.setup(page);
  });

  test('階段 1: 首頁探索', async ({ page }) => {
    monitor.setStage(1);
    // ... 測試內容
  });

  test('階段 2: 進入賽事', async ({ page }) => {
    monitor.setStage(2);
    // ... 測試內容
  });

  test.afterAll(() => {
    // 輸出摘要
    monitor.printSummary();

    // 驗證無嚴重錯誤
    const report = monitor.getReport();
    expect(report.criticalErrors.length).toBe(0);
  });
});
```

---

## 6. 驗收標準

- [ ] 正確過濾白名單錯誤
- [ ] 嚴重錯誤被正確識別
- [ ] 分階段報告準確
- [ ] 不影響測試執行效能
- [ ] 單元測試覆蓋率 > 80%
