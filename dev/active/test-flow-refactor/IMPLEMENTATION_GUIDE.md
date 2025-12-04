# 開發執行指南

**建立日期**: 2025-12-04
**最後更新**: 2025-12-04
**狀態**: 待執行

---

## 1. 概述

### 專案目標

將 38 個分散測試整合為 7 階段 36 驗證點的使用者旅程測試。

### 雙方案架構

本專案採用兩階段開發策略：

| Phase | 方案 | 位置 | 用途 |
|-------|------|------|------|
| 1 | DevTools MCP | `tests/devtools/` | 互動式開發驗證，確認邏輯正確性 |
| 2 | Playwright | `tests/helpers/` + `tests/e2e/` | 自動化測試，CI/CD 整合 |

### 檔案結構

```
tests/
├── devtools/                    # Phase 1: DevTools MCP 測試方案
│   ├── adaptive-wait.md
│   ├── console-monitor.md
│   ├── trajectory-validator.md
│   ├── stage-context.md
│   └── user-journey.md
│
├── helpers/                     # Phase 2: Playwright 模組
│   ├── adaptive-wait.ts
│   ├── console-monitor.ts
│   ├── trajectory-validator.ts
│   └── stage-context.ts
│
└── e2e/
    └── user-journey.spec.ts     # Playwright 整合測試
```

---

## 2. 開發流程

```
Phase 1: DevTools MCP 完整方案
├── 建立 tests/devtools/ 資料夾
├── 實作 5 個 DevTools 互動腳本
└── 驗證完整 7 階段流程

     ↓ 全部驗證通過

Phase 2: Playwright 完整方案
├── 參考 DevTools 版本轉換為 .ts 模組
├── 實作 tests/helpers/ 4 個模組
├── 實作 tests/e2e/user-journey.spec.ts
└── 執行 Playwright 測試確認
```

---

## 3. 實作順序

### Phase 1: DevTools MCP 方案

| 順序 | 檔案 | 說明 | 規格 |
|------|------|------|------|
| 1 | adaptive-wait.md | 等待策略驗證 | [spec](specs/adaptive-wait.spec.md) |
| 2 | console-monitor.md | 錯誤監控驗證 | [spec](specs/console-monitor.spec.md) |
| 3 | trajectory-validator.md | 數據驗證 | [spec](specs/trajectory-validator.spec.md) |
| 4 | stage-context.md | 階段管理驗證 | [spec](specs/stage-context.spec.md) |
| 5 | user-journey.md | 完整流程驗證 | [plan](user-journey-test-plan.md) |

### Phase 2: Playwright 方案

| 順序 | 檔案 | 說明 | 依賴 |
|------|------|------|------|
| 1 | adaptive-wait.ts | 轉換自 DevTools 版 | - |
| 2 | console-monitor.ts | 轉換自 DevTools 版 | - |
| 3 | trajectory-validator.ts | 轉換自 DevTools 版 | - |
| 4 | stage-context.ts | 轉換自 DevTools 版 | 依賴 1 |
| 5 | user-journey.spec.ts | 整合測試 | 依賴 1-4 |

### 依賴關係圖

```
adaptive-wait ─────┐
                   │
console-monitor ───┼──→ stage-context ──→ user-journey
                   │
trajectory-validator ─┘ (獨立使用)
```

---

## 4. 模組規格摘要

### 模組 1: adaptive-wait

**規格**: [specs/adaptive-wait.spec.md](specs/adaptive-wait.spec.md)
**優先級**: 🔴 必做

**核心功能**:
- `amap2DReady()` - 2D 地圖等待
- `cesium3DReady()` - 3D 模式等待
- `trajectoryMarkersReady()` - 軌跡標記等待
- `apiResponse()` - API 響應等待

---

### 模組 2: console-monitor

**規格**: [specs/console-monitor.spec.md](specs/console-monitor.spec.md)
**優先級**: 🔴 必做

**核心功能**:
- `setup(page)` - 設置監聽
- `setStage(id)` - 階段標記
- `getCriticalErrors()` - 過濾嚴重錯誤
- `getReport()` - 生成報告

---

### 模組 3: trajectory-validator

**規格**: [specs/trajectory-validator.spec.md](specs/trajectory-validator.spec.md)
**優先級**: 🔴 必做

**核心功能**:
- `extractSummaryData()` - 摘要提取
- `extractWaypoints()` - 航點提取
- `validate()` - 完整驗證 (策略 A/B/Layer 2)
- `printReport()` - 報告輸出

---

### 模組 4: stage-context

**規格**: [specs/stage-context.spec.md](specs/stage-context.spec.md)
**優先級**: 🔴 必做

**核心功能**:
- `executeStage()` - 階段執行
- `validatePreconditions()` - 前置驗證
- `captureSnapshot()` / `recover()` - 狀態管理

---

## 5. 交付物驗收清單

### Phase 1 交付物

- [ ] `tests/devtools/` 資料夾建立
- [ ] 5 個 DevTools 互動腳本完成
- [ ] 7 階段流程全部驗證通過

### Phase 2 交付物

- [ ] 4 個 Playwright helper 模組完成
- [ ] `user-journey.spec.ts` 完成
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
