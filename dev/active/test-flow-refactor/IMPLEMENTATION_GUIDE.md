# 開發執行指南

**建立日期**: 2025-12-04
**狀態**: 待執行

---

## 1. 概述

### 專案目標

將 38 個分散測試整合為 7 階段 36 驗證點的使用者旅程測試。

### 預計產出

| 檔案 | 路徑 | 行數 |
|------|------|------|
| adaptive-wait.ts | tests/helpers/ | ~120 |
| console-monitor.ts | tests/helpers/ | ~100 |
| trajectory-validator.ts | tests/helpers/ | ~150 |
| stage-context.ts | tests/helpers/ | ~150 |
| user-journey.spec.ts | tests/e2e/ | ~200 |

---

## 2. 實作順序

### 依賴關係圖

```
adaptive-wait.ts ─────┐
                      │
console-monitor.ts ───┼──→ stage-context.ts ──→ user-journey.spec.ts
                      │
trajectory-validator.ts ─┘ (獨立使用)
```

### 建議執行順序

| 順序 | 模組 | 說明 | 可平行 |
|------|------|------|--------|
| 1 | adaptive-wait.ts | 基礎等待策略 | - |
| 2 | console-monitor.ts | 錯誤監控 | ✅ 可與 1 平行 |
| 3 | trajectory-validator.ts | 數據驗證 | ✅ 可與 1, 2 平行 |
| 4 | stage-context.ts | 階段管理 | 依賴 1 |
| 5 | user-journey.spec.ts | 整合測試 | 依賴 1-4 |

---

## 3. 模組實作清單

### 模組 1: adaptive-wait.ts

**規格**: [specs/adaptive-wait.spec.md](specs/adaptive-wait.spec.md)
**優先級**: 🔴 必做

**核心功能**:
- `amap2DReady()` - 2D 地圖等待
- `cesium3DReady()` - 3D 模式等待
- `trajectoryMarkersReady()` - 軌跡標記等待
- `apiResponse()` - API 響應等待
- `waitForAny()` - 多策略競爭
- `waitWithRetry()` - 帶重試等待

**驗收標準**:
- [ ] 所有硬等待已替換為適應性等待
- [ ] 等待時間減少 30% 以上
- [ ] 單元測試覆蓋率 > 80%

---

### 模組 2: console-monitor.ts

**規格**: [specs/console-monitor.spec.md](specs/console-monitor.spec.md)
**優先級**: 🔴 必做

**核心功能**:
- `setup(page)` - 設置監聽
- `setStage(id)` - 階段標記
- `getCriticalErrors()` - 過濾嚴重錯誤
- `getReport()` - 生成報告
- `printSummary()` - 輸出摘要

**驗收標準**:
- [ ] 正確過濾白名單錯誤
- [ ] 嚴重錯誤被正確識別
- [ ] 分階段報告準確
- [ ] 單元測試覆蓋率 > 80%

---

### 模組 3: trajectory-validator.ts

**規格**: [specs/trajectory-validator.spec.md](specs/trajectory-validator.spec.md)
**優先級**: 🔴 必做

**核心功能**:
- `extractSummaryData()` - 摘要提取
- `extractWaypoints()` - 航點提取
- `calculateStats()` - 統計計算
- `validate()` - 完整驗證
- `printReport()` - 報告輸出

**驗收標準**:
- [ ] 摘要數據正確提取
- [ ] 航點列表完整提取 (含終點 🏁)
- [ ] 精確匹配項目全部通過
- [ ] 容差匹配項目在範圍內
- [ ] 單元測試覆蓋率 > 80%

---

### 模組 4: stage-context.ts

**規格**: [specs/stage-context.spec.md](specs/stage-context.spec.md)
**優先級**: 🔴 必做
**依賴**: adaptive-wait.ts

**核心功能**:
- `executeStage()` - 階段執行
- `validatePreconditions()` - 前置驗證
- `captureSnapshot()` - 狀態備份
- `recover()` - 狀態恢復
- `DEPENDENCY_MAP` - 階段依賴規則

**驗收標準**:
- [ ] 前置條件驗證正確阻斷依賴階段
- [ ] 狀態備份和恢復機制有效
- [ ] 頁面失效時能正確檢測
- [ ] 單元測試覆蓋率 > 80%

---

## 4. 整合測試

### user-journey.spec.ts

**位置**: tests/e2e/user-journey.spec.ts
**依賴**: 以上 4 個 helper 模組

**結構**:
```typescript
import { StageExecutor } from '../helpers/stage-context';
import { ConsoleMonitor } from '../helpers/console-monitor';
import { TrajectoryValidator } from '../helpers/trajectory-validator';

test.describe('使用者旅程', () => {
  let executor: StageExecutor;
  let monitor: ConsoleMonitor;

  test.beforeAll(async ({ page }) => {
    executor = new StageExecutor(page);
    monitor = new ConsoleMonitor({ captureWarnings: true });
    monitor.setup(page);
  });

  test('階段 1: 首頁探索', async () => { /* ... */ });
  test('階段 2: 進入賽事', async () => { /* ... */ });
  test('階段 3: 2D 軌跡體驗', async () => { /* ... */ });
  test('階段 4: 2D 動態模式', async () => { /* ... */ });
  test('階段 5: 3D 模式體驗', async () => { /* ... */ });
  test('階段 6: 鴿舍列表', async () => { /* ... */ });

  test.afterAll(() => {
    monitor.printSummary();
    const report = monitor.getReport();
    expect(report.criticalErrors.length).toBe(0);
  });
});
```

---

## 5. 交付物驗收清單

### 必要條件

- [ ] 4 個 helper 模組全部完成
- [ ] user-journey.spec.ts 完成
- [ ] 全部測試通過 (36/36 驗證點)
- [ ] 無嚴重控制台錯誤

### 品質指標

- [ ] 單元測試覆蓋率 > 80%
- [ ] 測試執行時間 < 5 分鐘 (P0 only)
- [ ] 文件與實作同步

---

## 6. 相關文件

| 文件 | 說明 |
|------|------|
| [README.md](README.md) | 專案索引 |
| [user-journey-test-plan.md](user-journey-test-plan.md) | 完整計劃 |
| [expert-review-report.md](expert-review-report.md) | 專家審查 |
| [USER_JOURNEY_RECORD.md](USER_JOURNEY_RECORD.md) | 操作記錄 |
