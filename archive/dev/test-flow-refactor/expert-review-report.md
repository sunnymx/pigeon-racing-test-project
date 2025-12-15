# 測試流程重構計劃 - 專家審查報告

**審查日期**: 2025-12-02
**審查員**: 資深測試架構專家 (AI Agent)
**總體評分**: 7.75/10
**結論**: 推薦實施，但需完善關鍵改善項目

---

## 1. 計劃優點

### 1.1 流程故事導向設計 (優秀)

- 將分散的 38 個測試案例重新編織成 7 個連貫的使用者旅程階段
- 符合真實使用者操作順序（首頁 → 進入賽事 → 2D軌跡 → 2D動態 → 3D → 鴿舍 → 錯誤監控）
- 避免重複導航，提高測試效率

**程式架構相符度**:
```typescript
// 計劃的結構與現有 helper 函數完全兼容
enterRace(page, 0)                  // 階段 1-2
→ reload2DTrajectory(page, 0, 3)    // 階段 3
→ switchSubMode2D(page, 'dynamic')  // 階段 4
→ switchTo3DReliably(page)          // 階段 5
```

### 1.2 依賴阻斷策略明確且合理

- 清楚定義了哪些失敗會阻塞後續階段
- 避免級聯失敗（cascade failures）
- 與現有的 P0/P1/P2 優先級系統對齊

```
├─ 階段 1 失敗 → 全部終止         // 合理：無法進入賽事
├─ 階段 2 失敗 → 終止             // 合理：無法選擇鴿子
├─ 階段 3 失敗 → 跳過 4、5        // 合理：2D失敗不阻斷鴿舍列表
```

### 1.3 驗證點計數的整合效率 (36 vs 38)

- 從 38 個分散案例整合到 36 個驗證點（減少 ~5% 重複）
- 具體的合併邏輯清晰
- 保留了所有 P0 核心功能（22 個驗證點）

**驗證比例**:
```
P0: 22 個 (61%)  - 核心功能，必須驗證
P1: 10 個 (28%)  - 重要功能
P2: 4 個 (11%)   - 輔助功能
```

### 1.4 錯誤容錯機制完整

- 每個驗證點最多重試 2 次，避免偽陰性
- 失敗後仍記錄而不是拋出例外，支援部分通過
- 報告格式清晰，區分「終止」與「警告」

### 1.5 與現有架構的相容性高

- 完全利用現有 7 個 helper 模組
- 無需重寫現有函數，只需一個整合層
- 減少開發成本和引入 bugs 的風險

---

## 2. 潛在風險

### 2.1 「共用狀態」導致的脆弱性 (高風險) 🔴

**風險描述**:
計劃依賴單一持續的 Page 物件跨越 7 個階段。任何中間階段的意外導航或頁面刷新都會破壞整個流程。

**具體場景**:
```typescript
// 階段 1: 進入首頁
await enterRace(page, 0);           // ✓ 成功

// 階段 2: 進入賽事
// 如果此時發生未預期的頁面跳轉或 redirect...
await selectPigeon(page, 0);        // ❌ page context 已丟失

// 後續階段 3-7 全部失敗
```

**現實問題**:
- `navigation.ts` 使用 `page.waitForLoadState('networkidle')`，超時風險高
- `mode-switching.ts` 硬等待 3 秒，不靈活
- 未見自動重連邏輯

---

### 2.2 「2-3 秒等待」的時序問題 (中風險) 🟡

**風險描述**:
計劃的多個地方使用硬等待（hard wait），在不同網路條件下可能不足。

**問題點**:
- `waitForTrajectoryData()` 依賴 `waitForLoadState('networkidle')`
- 沒有基於元素可見性的自適應等待

---

### 2.3 階段 7（控制台監控）缺乏具體實現 (中風險) 🟡

**風險描述**:
1. 未定義如何在 `beforeEach` 中設置監聽器
2. 未說明如何過濾「已知錯誤」（白名單是什麼？）
3. 報告與測試結果的整合不清楚

---

### 2.4 網路請求驗證缺乏細節 (低風險) 🟢

**風險描述**:
1. 未說明如何攔截請求
2. 未定義 response 驗證標準
3. 多鴿軌跡時請求順序問題

---

### 2.5 依賴阻斷邏輯的過度簡化 (中風險) 🟡

**風險描述**:
「階段 3 失敗 → 跳過 4、5，嘗試 6」過於簡單。實際上：
- 階段 4 和階段 5 都依賴階段 3 的 Canvas 載入
- 返回賽事頁面需要先清理 trajectory view

---

## 3. 改善建議

### 3.1 建立「階段上下文」來管理共用狀態 (必做)

**目的**: 減輕共用狀態脆弱性風險

**實現**:
```typescript
// stage-context.ts
export interface StageContext {
  page: Page;
  browser: Browser;
  lastValidURL: string;
  lastValidState: {
    raceIndex: number;
    pigeonIndex: number;
    currentMode: '2D' | '3D';
    trajectory2DLoaded: boolean;
  };
  screenshot: Map<string, Buffer>;
}

export class StageExecutor {
  private context: StageContext;

  async executeStageWithContext(stage: Stage): Promise<StageResult> {
    // 1. 驗證前置條件
    if (!await this.validatePreconditions(stage)) {
      return { status: 'SKIPPED', reason: 'precondition_failed' };
    }

    // 2. 執行前備份狀態
    const snapshot = await this.captureSnapshot();

    try {
      // 3. 執行階段
      const result = await this.runCheckpoints(stage);

      // 4. 更新上下文
      if (result.status === 'COMPLETE') {
        this.context.lastValidState = { /* 更新狀態 */ };
      }

      return result;
    } catch (error) {
      // 5. 失敗時嘗試恢復
      if (stage.isRecoverable && this.canRecover(error)) {
        await this.recover(snapshot);
        return await this.executeStageWithContext(stage);
      }
      throw error;
    }
  }
}
```

---

### 3.2 實現適應性等待 (必做)

**目的**: 減輕時序問題

**實現**:
```typescript
// adaptive-wait.ts
export const WAIT_STRATEGIES = {
  // 2D 地圖載入
  amap2DReady: async (page: Page, timeout = 15000) => {
    return Promise.race([
      page.waitForFunction(
        () => document.querySelector('canvas.amap-layer')?.width > 0,
        { timeout: 10000 }
      ),
      page.waitForFunction(
        () => document.querySelectorAll('.amap-icon').length > 0,
        { timeout: 10000 }
      ),
    ]);
  },

  // 3D 模式初始化
  cesium3DReady: async (page: Page, timeout = 30000) => {
    return Promise.all([
      page.waitForFunction(
        () => (window as any).Cesium !== undefined,
        { timeout }
      ),
      page.waitForFunction(
        () => (window as any).viewer !== undefined,
        { timeout }
      ),
    ]);
  },

  // API 響應
  apiResponse: async (page: Page, urlPattern: string, timeout = 10000) => {
    return page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === 200,
      { timeout }
    );
  }
};
```

---

### 3.3 為階段 7 建立通用的監控框架 (必做)

**目的**: 減輕實現缺陷

**實現**:
```typescript
// console-monitor.ts
export const ERROR_WHITELIST = [
  /favicon/,
  /Chrome extension/,
  /gpx2d.*已知問題/,
];

export class ConsoleMonitor {
  private events: ConsoleEvent[] = [];
  private currentStage = 1;

  setup(page: Page) {
    page.on('console', (msg) => {
      this.events.push({
        type: msg.type() as any,
        message: msg.text(),
        timestamp: Date.now(),
        stage: this.currentStage,
      });
    });

    page.on('pageerror', (error) => {
      this.events.push({
        type: 'error',
        message: error.toString(),
        stack: error.stack,
        timestamp: Date.now(),
        stage: this.currentStage,
      });
    });
  }

  getReport(): ConsoleReport {
    const filtered = this.events.filter(
      e => !ERROR_WHITELIST.some(pattern => pattern.test(e.message))
    );
    return {
      totalEvents: this.events.length,
      criticalErrors: filtered.filter(e => e.type === 'error'),
    };
  }
}
```

---

### 3.4 優化驗證點的粒度 (應做)

**問題**: 驗證點有些過粗

**改善**:
```typescript
// 現有的階段 3.2 太粗
階段 3.2 | Canvas 渲染成功 | P0 | canvas.count() > 0

// 應拆分為
3.2a | Canvas 元素存在 | P0 | document.querySelector('canvas.amap-layer') !== null
3.2b | Canvas 有有效尺寸 | P0 | canvas.width > 0 && canvas.height > 0
3.2c | Canvas 內容已渲染 | P1 | canvas.getContext('2d').getImageData(...) !== null
```

---

### 3.5 建立測試優先級的執行策略 (應做)

**目的**: 允許快速反饋循環

**實現**:
```typescript
export enum TestMode {
  QUICK = 'quick',          // 只執行 P0 (20-30 分鐘)
  STANDARD = 'standard',    // 執行 P0+P1 (45-60 分鐘)
  COMPREHENSIVE = 'full'    // 執行全部 (60-90 分鐘)
}

const MODE = process.env.TEST_MODE || TestMode.STANDARD;

test.describe('階段 1: 首頁探索', () => {
  test('1.1 首頁載入 @P0 @required', async () => { });
  test('1.2 賽事卡片數 @P1', async () => {
    test.skip(MODE === TestMode.QUICK, '快速模式下跳過');
  });
});
```

---

## 4. 替代方案

### 4.1 方案 A：分層測試（Tiered Testing）- 推薦 ⭐⭐⭐

```
層級 1 (基礎驗證)  →  層級 2 (功能驗證)  →  層級 3 (完整驗證)
P0 only           →  P0 + P1            →  P0 + P1 + P2
(15-20 分鐘)       (40-50 分鐘)          (70-90 分鐘)
```

**優點**:
- 快速反饋：開發者可在 20 分鐘內驗證核心功能
- 漸進式信心：完全通過後才進行完整測試
- 降低脆弱性：每層級獨立

**缺點**:
- 導航重複

---

### 4.2 方案 B：參數化測試 ⭐⭐

```typescript
const TEST_COMBINATIONS = [
  { raceIndex: 0, pigeonIndex: 0, mode: '2D' },
  { raceIndex: 0, pigeonIndex: 0, mode: '3D' },
  { raceIndex: 1, pigeonIndex: 0, mode: '3D' },
];
```

**優點**: 覆蓋更多資料組合
**缺點**: 測試數量爆增

---

### 4.3 方案 C：事件驅動架構 ⭐

**優點**: 靈活控制
**缺點**: 複雜度高

---

## 5. 評分明細

| 評估維度 | 得分 | 說明 |
|---------|------|------|
| 流程設計 | 9/10 | 故事導向很好，依賴規則需細化 |
| 實現可行性 | 8/10 | 與現有架構相容，但共用狀態風險高 |
| 錯誤容錯 | 7/10 | 重試機制好，恢復機制不足 |
| 時序穩定性 | 6/10 | 硬等待問題未解決 |
| 維護性 | 8/10 | 清晰的報告格式，但監控邏輯缺乏 |
| 覆蓋率 | 8/10 | 36 個驗證點覆蓋完整 |
| 可擴展性 | 7/10 | 支援快速/完整模式選擇，但未實現 |
| 文檔完整性 | 9/10 | 計劃文檔非常詳細 |

**加權總分：7.75/10**

---

## 6. 實施優先級

### 🔴 必做（進行實施前）
1. 建立階段上下文管理 - 減低脆弱性風險
2. 實現適應性等待 - 確保時序穩定
3. 完成階段 7 監控框架 - 提高可觀測性

### 🟡 應做（V1.0 發佈前）
4. 細化依賴規則 - 提高邏輯正確性
5. 優化驗證點粒度 - 便於診斷

### 🟢 可做（後續優化）
6. 支援測試模式選擇 - 提高開發效率
7. 考慮分層測試 - 加速反饋

---

## 7. 建議新增檔案

```
tests/helpers/
├── stage-context.ts      # 階段上下文管理 (新增)
├── adaptive-wait.ts      # 適應性等待 (新增)
├── console-monitor.ts    # 控制台監控 (新增)

tests/e2e/
└── user-journey.spec.ts  # 統合測試主檔案 (新增)

tests/support/
└── journey-reporter.ts   # 報告生成器 (新增)
```

---

## 8. 核心建議總結

1. **將計劃視為「架構藍圖」而非「實施細節」** - 需要實際編碼驗證
2. **優先實現「狀態恢復」和「適應性等待」** - 對測試穩定性最關鍵
3. **在第一次運行時設置「乾運行模式」** - 只驗證邏輯流程和依賴關係
4. **建立「已知脆弱點」清單** - 明確列出哪些地方容易失敗、如何恢復
5. **使用時間預算** - P0 only (20-30 分鐘)、Full (70-90 分鐘)
