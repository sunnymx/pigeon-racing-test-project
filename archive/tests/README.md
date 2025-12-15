# 鴿子競賽 GPS 追蹤系統 - 自動化測試

## 專案概覽

本專案為 https://skyracing.com.cn 鴿子競賽GPS追蹤系統的端到端自動化測試。

**當前狀態**: Phase 2 完成 - P0 測試已實作

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 安裝 Playwright 瀏覽器

```bash
npx playwright install chromium
```

### 3. 執行測試

```bash
# 執行所有 P0 測試
npm run test:p0

# 執行所有測試
npm test

# 執行特定測試文件
npx playwright test tc-02-001-2d-static.spec.ts

# 以 UI 模式執行（推薦）
npm run test:ui

# Headed 模式（顯示瀏覽器）
npm run test:headed

# Debug 模式
npm run test:debug
```

### 4. 查看報告

```bash
npm run report
```

---

## 測試結構

```
tests/
├── helpers/                    # 輔助函數模組
│   ├── navigation.ts           # 導航相關（進入賽事、選擇鴿子）
│   ├── mode-switching.ts       # 2D/3D 模式切換（解決問題 #1）
│   ├── wait-utils.ts           # 智能等待策略（解決問題 #4）
│   ├── trajectory-utils.ts     # 軌跡操作（解決問題 #3）
│   ├── validators.ts           # 數據驗證
│   └── loft-list.ts            # 鴿舍列表操作
│
├── e2e/                        # E2E 測試案例
│   ├── tc-02-001-2d-static.spec.ts      # P0: 2D 靜態軌跡渲染
│   ├── tc-03-001-mode-switch.spec.ts    # P0: 靜態/動態模式切換
│   └── tc-04-001-3d-mode.spec.ts        # P0: 3D 模式基本渲染
│
├── fixtures/                   # 測試數據（待擴展）
└── README.md                   # 本文檔
```

---

## P0 測試案例（已實作）

### TC-02-001: 2D 靜態軌跡渲染 ⭐⭐⭐

**測試目標**: 驗證 2D 靜態模式下完整軌跡顯示

**驗證策略**:
- ✅ **Layer 1 (DOM)**: 驗證按鈕、元素存在性
- ✅ **Layer 2 (Canvas)**: 地圖瓦片載入（≥50個）、軌跡點數量（≥15個）
- ✅ **Layer 3 (Network)**: API 響應、數據完整性

**測試子案例**:
1. 應該正確渲染 2D 靜態軌跡
2. 應該顯示完整的軌跡線
3. 應該正確顯示起點和終點標記
4. 應該無控制台錯誤

**執行**:
```bash
npx playwright test tc-02-001-2d-static.spec.ts
```

---

### TC-03-001: 靜態/動態模式切換 ⭐⭐⭐

**測試目標**: 驗證 2D 模式下靜態/動態切換功能

**驗證策略**:
- 靜態模式：15-20 個軌跡標記點
- 動態模式：1-3 個可見標記點
- 模式切換：timeline 按鈕

**測試子案例**:
1. 應該成功切換靜態→動態→靜態
2. 動態模式應該顯示播放控制
3. 動態模式播放功能應該正常
4. 應該正確偵測當前模式
5. Canvas 應該在模式切換時更新

**執行**:
```bash
npx playwright test tc-03-001-mode-switch.spec.ts
```

---

### TC-04-001: 3D 模式基本渲染 ⭐⭐⭐

**測試目標**: 驗證 3D 模式基本功能

**驗證策略**:
- Cesium 引擎初始化
- 3D 地球渲染
- 視角控制（視角1/視角2）
- 播放控制

**測試子案例**:
1. 應該成功切換到 3D 模式並渲染
2. Cesium 引擎應該正確初始化
3. 視角切換功能應該正常
4. 3D 播放控制應該可用
5. 應該顯示軌跡點控制
6. 3D 和 2D 模式應該可以來回切換
7. 3D 模式應該顯示速度滑塊

**執行**:
```bash
npx playwright test tc-04-001-3d-mode.spec.ts
```

---

## 已解決的問題

本測試套件解決了 4 個已知問題：

### 問題 #1: 2D 軌跡初次載入失敗 🔴
**症狀**: 首次查看軌跡時，API 加載未等候響應即渲染地圖，導致 gpx2d undefined 錯誤
**解決方案**: 重新執行「選擇鴿子 → 查看軌跡」流程觸發數據重新加載（最多重試 3 次）
**實作**: `reload2DTrajectory()` 或使用 3D→2D 切換序列作為備選方案

### 問題 #2: 靜態/動態模式混淆 🟡
**症狀**: 無法判斷當前是靜態還是動態模式
**解決方案**: 通過標記點數量判斷
**實作**: `detectCurrentViewMode()` in `mode-switching.ts`

### 問題 #3: 軌跡點點擊無響應 🟡
**症狀**: 點擊軌跡點無反應
**解決方案**: 使用 accessibility tree 定位器
**實作**: `clickTrajectoryPoint()` in `trajectory-utils.ts`

### 問題 #4: 數據載入時序問題 🟡
**症狀**: 模式切換後數據未完全載入
**解決方案**: 增加等待時間（2-3秒）+ 重試機制
**實作**: `waitForModeSwitch()` in `wait-utils.ts`

---

## Helper 函數模組

### navigation.ts - 導航相關
```typescript
enterRace(page, raceIndex)              // 進入指定賽事
selectPigeon(page, pigeonIndex)         // 選擇鴿子
openTrajectory(page)                    // 打開軌跡視圖
getCurrentMode(page)                    // 取得當前模式
navigateToTrajectoryView(page, ...)    // 組合函數：完整流程
```

### mode-switching.ts - 模式切換
```typescript
ensureModeByText(page, targetMode)      // 根據按鈕文字確保模式
switchTo2DReliably(page)                // 可靠的 2D 切換（3D→2D）
switchTo3DReliably(page)                // 可靠的 3D 切換
detectCurrentViewMode(page)             // 偵測當前視圖模式
switchSubMode2D(page, targetSubMode)    // 2D 靜態/動態切換
```

### wait-utils.ts - 等待策略
```typescript
waitForMapTiles(page, minTiles)         // AMap 瓦片載入
waitForCesium3D(page)                   // Cesium 3D 引擎就緒
waitForTrajectoryData(page)             // 軌跡數據 API 響應
waitForModeSwitch(page, targetMode)     // 模式切換完成
retryAsync(fn, retries, delay)          // 通用重試邏輯
```

### trajectory-utils.ts - 軌跡工具
```typescript
getTrajectoryPoints(page)               // 獲取所有軌跡標記點
getTrajectoryPointsCount(page)          // 獲取標記點數量
clickTrajectoryPoint(page, index)       // 點擊指定軌跡點
verifyPointInfo(page)                   // 驗證軌跡點信息窗格
verifyTrajectoryData(page)              // 提取側邊欄軌跡數據
verifyTrajectoryRendered(page, mode)    // Canvas 截圖驗證
```

### validators.ts - 數據驗證
```typescript
validateFlightData(data)                // 驗證飛行數據
detectAnomaly(data)                     // 檢測異常數據
validateSpeedRange(speed)               // 驗證速度範圍
validateAltitudeRange(altitude)         // 驗證高度範圍
formatValidationReport(result)          // 格式化驗證報告
```

### loft-list.ts - 鴿舍列表
```typescript
openLoftList(page)                      // 打開鴿舍列表 Tab
searchLoft(page, keyword)               // 搜尋鴿舍
selectLoft(page, loftIndex)             // 選擇鴿舍（展開）
selectPigeonsInLoft(page, indices)      // 勾選多隻鴿子
verifyMultipleTrajectories(page)        // 驗證多軌跡顯示
```

---

## 測試策略

### 三重驗證機制

所有 P0 測試採用三重驗證策略：

1. **DOM 驗證**：檢查元素存在性、文本內容、屬性變化
2. **Canvas 驗證**：截圖對比、渲染狀態檢測
3. **Network 驗證**：監聽 API 請求、驗證響應數據

### 等待策略

```typescript
// 網路空閒等待
await page.waitForLoadState('networkidle');

// 地圖瓦片等待
await waitForMapTiles(page, 50);

// Cesium 3D 等待
await waitForCesium3D(page);

// 模式切換等待（關鍵：額外 2-3 秒）
await waitForModeSwitch(page, '2D');
```

---

## 配置說明

### playwright.config.ts

關鍵配置：
- **baseURL**: `https://skyracing.com.cn`
- **timeout**: 60 秒（地圖渲染需時較長）
- **retries**: CI 環境 2 次，本地 1 次
- **screenshot**: 失敗時自動截圖
- **video**: 失敗時保留錄影
- **viewport**: 1920x1080（確保地圖有足夠空間渲染）

---

## 執行建議

### 開發環境

```bash
# UI 模式（推薦）- 可視化測試流程
npm run test:ui

# Headed 模式 - 觀察瀏覽器操作
npm run test:headed

# Debug 模式 - 逐步除錯
npm run test:debug
```

### CI/CD 環境

```bash
# Headless 模式
npm test

# 只執行 P0 測試
npm run test:p0

# 生成報告
npm run report
```

---

## 常見問題

### Q: 測試失敗，出現 "gpx2d undefined" 錯誤？
**A**: 這是已知問題 #1。確保使用 `switchTo2DReliably()` 而非直接切換。

### Q: 無法判斷當前是靜態還是動態模式？
**A**: 使用 `detectCurrentViewMode()`，它會根據標記點數量自動判斷。

### Q: 點擊軌跡點無反應？
**A**: 使用 `clickTrajectoryPoint()`，它使用 accessibility tree 定位，避免 canvas 遮擋。

### Q: 模式切換後數據未載入？
**A**: 使用 `waitForModeSwitch()`，它包含額外的 2-3 秒等待時間。

### Q: Cesium 3D 載入超時？
**A**: 增加 `test.setTimeout(120000)`，3D 模式需要較長時間初始化。

---

## 後續計劃

### Phase 3: P1 測試（待實作）
- TC-06 系列：軌跡點互動測試
- TC-02-004, TC-03-006：數據驗證測試
- TC-05 系列：鴿舍列表操作

### Phase 4: P2 測試（待實作）
- TC-07 系列：UI 元素測試
- 錯誤處理測試
- 性能測試

---

## 相關文檔

- **測試計劃總覽**: [docs/test-plan/TEST_PLAN_OVERVIEW.md](../docs/test-plan/TEST_PLAN_OVERVIEW.md)
- **詳細測試用例**: [docs/test-plan/TEST_CASES.md](../docs/test-plan/TEST_CASES.md)
- **測試框架架構**: [docs/architecture/test-framework.md](../docs/architecture/test-framework.md)
- **模式切換指南**: [docs/guides/mode-switching.md](../docs/guides/mode-switching.md)
- **問題排解指南**: [docs/guides/troubleshooting.md](../docs/guides/troubleshooting.md)
- **測試策略指南**: [docs/guides/testing-strategies.md](../docs/guides/testing-strategies.md)
- **Playwright 工作流程**: [docs/guides/playwright-workflow.md](../docs/guides/playwright-workflow.md)
- **API 端點文檔**: [docs/api-reference/API_ENDPOINTS.md](../docs/api-reference/API_ENDPOINTS.md)

---

## 貢獻指南

### 新增測試案例
1. 在 `tests/e2e/` 建立新的 `.spec.ts` 文件
2. 遵循三重驗證策略
3. 使用現有的 helper 函數
4. 添加適當的 `@P0`, `@P1`, `@P2` 標籤

### 新增 Helper 函數
1. 在適當的 `tests/helpers/` 文件中添加
2. 提供詳細的 JSDoc 註釋
3. 處理錯誤情況並提供清晰的錯誤訊息
4. 更新本 README 文檔

---

**最後更新**: 2025-11-18
**版本**: v1.0.0
**狀態**: Phase 2 完成 - P0 測試已實作
