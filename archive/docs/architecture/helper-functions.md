# Helper Functions 架構文檔

**快速參考**: [CLAUDE.md](../../CLAUDE.md)
**最後更新**: 2025-11-26

本文檔詳細說明測試 Helper 函數模組的架構設計與使用方式。

---

## Helper 函數模組 (`tests/helpers/`)

| 模組 | 檔案 | 行數 | 職責 | 已知問題對應 |
|------|------|------|------|-------------|
| **Navigation** | `navigation.ts` | 211 | 進入賽事、選擇鴿子、打開軌跡視圖 | - |
| **Mode Switching** | `mode-switching.ts` | 300 | 2D/3D 模式切換、靜態/動態切換、模式偵測 | #2 |
| **Trajectory Utils** | `trajectory-utils.ts` | 338 | 軌跡標記點操作、點擊交互、軌跡數據提取 | #3 |
| **Trajectory Reload** | `trajectory-reload.ts` | 207 | 2D 軌跡重載（解決首次加載失敗） | #1 |
| **Wait Utils** | `wait-utils.ts` | 277 | 地圖瓦片等待、3D 引擎就緒檢測 | #4 |
| **Validators** | `validators.ts` | 255 | 飛行數據驗證、異常檢測、範圍驗證 | - |
| **Loft List** | `loft-list.ts` | 240 | 鴿舍列表操作、多軌跡管理 | - |

---

## 測試案例依賴 (`tests/e2e/`)

| 測試案例 | 檔案 | 優先級 | 依賴的 Helper |
|---------|------|-------|--------------|
| **TC-02-001** | `tc-02-001-2d-static.spec.ts` | P0 | trajectory-reload, trajectory-utils |
| **TC-03-001** | `tc-03-001-mode-switch.spec.ts` | P0 | mode-switching, navigation |
| **TC-04-001** | `tc-04-001-2d-dynamic.spec.ts` | P0 | fixtures, mode-switching, trajectory |

---

## 關鍵函數速查

### 軌跡相關

```typescript
getTrajectoryPoints(page)           // trajectory-utils.ts:57
getTrajectoryPointsCount(page)      // trajectory-utils.ts:78
clickTrajectoryPoint(page, index)   // trajectory-utils.ts:106
reload2DTrajectory(page)            // trajectory-reload.ts:25
```

### 模式切換

```typescript
ensureModeByText(page, '2D'|'3D')   // mode-switching.ts:46
detectCurrentViewMode(page)         // mode-switching.ts:196
ensure2DStaticMode(page)            // trajectory-reload.ts:176
```

### 導航

```typescript
enterFirstRace(page)                // navigation.ts:30
selectPigeon(page, index)           // navigation.ts:70
viewTrajectory(page)                // navigation.ts:100
```

---

## 模組詳細說明

### Navigation (`navigation.ts`)

**職責**: 處理頁面導航和基本操作

**主要函數**:
- `enterFirstRace(page)` - 進入第一個賽事
- `selectPigeon(page, index)` - 選擇指定索引的鴿子
- `viewTrajectory(page)` - 點擊查看軌跡按鈕

### Mode Switching (`mode-switching.ts`)

**職責**: 處理 2D/3D 模式和靜態/動態模式切換

**主要函數**:
- `ensureModeByText(page, mode)` - 確保進入指定模式
- `detectCurrentViewMode(page)` - 偵測當前模式
- `switchTo3DReliably(page)` - 可靠切換到 3D 模式

**已知問題對應**: #2 (靜態/動態模式混淆)

### Trajectory Utils (`trajectory-utils.ts`)

**職責**: 軌跡標記點的操作和數據提取

**主要函數**:
- `getTrajectoryPoints(page)` - 獲取所有軌跡標記點
- `getTrajectoryPointsCount(page)` - 獲取標記點數量
- `clickTrajectoryPoint(page, index)` - 點擊指定標記點

**已知問題對應**: #3 (軌跡點點擊無響應)

**選擇器**: `.amap-icon > img` (2025-11-26 更新)

### Trajectory Reload (`trajectory-reload.ts`)

**職責**: 解決 2D 軌跡首次加載失敗問題

**主要函數**:
- `reload2DTrajectory(page)` - 重新加載 2D 軌跡
- `ensure2DStaticMode(page)` - 確保處於 2D 靜態模式

**已知問題對應**: #1 (2D 軌跡初次加載失敗)

### Wait Utils (`wait-utils.ts`)

**職責**: 各種等待策略

**主要函數**:
- `waitForMapTiles(page)` - 等待地圖瓦片加載
- `waitFor3DReady(page)` - 等待 3D 引擎就緒
- `waitForTrajectoryData(page)` - 等待軌跡數據加載

**已知問題對應**: #4 (數據加載時序問題)

### Validators (`validators.ts`)

**職責**: 飛行數據驗證

**主要函數**:
- `validateFlightData(data)` - 驗證飛行數據合理性
- `detectAnomaly(data)` - 異常檢測

### Loft List (`loft-list.ts`)

**職責**: 鴿舍列表和多軌跡管理

**主要函數**:
- `getLoftList(page)` - 獲取鴿舍列表
- `selectMultiplePigeons(page, indices)` - 選擇多隻鴿子

---

## 相關文檔

- [Test Framework Architecture](test-framework.md)
- [Selectors Guide](../guides/selectors.md)
- [Known Issues Solutions](../test-plan/KNOWN_ISSUES_SOLUTIONS.md)
