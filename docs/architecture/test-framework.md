# 測試框架架構

## 文檔資訊
- **專案名稱**: PIGEON_RACING_TEST_PROJECT
- **文檔版本**: v1.0.0
- **創建日期**: 2025-11-18
- **目的**: 說明自動化測試框架的整體架構設計

---

## 目錄

1. [系統架構總覽](#系統架構總覽)
2. [測試架構設計](#測試架構設計)
3. [Helper 函數模組](#helper-函數模組)
4. [測試用例優先級系統](#測試用例優先級系統)
5. [2D/3D 模式架構](#2d3d-模式架構)
6. [數據驗證框架](#數據驗證框架)
7. [與現有文檔的整合](#與現有文檔的整合)

---

## 系統架構總覽

### 技術棧

- **前端技術**: AMap 2.0 (2D地圖), Cesium (3D地球)
- **測試框架**: Playwright with TypeScript
- **互動工具**: Playwright MCP (Model Context Protocol)
- **目標系統**: https://skyracing.com.cn/

### 核心組件

```
賽鴿追蹤系統
├─ 賽事選擇界面
├─ 鴿子列表管理
├─ 2D/3D 軌跡查看器
├─ 鴿舍列表管理
└─ API 數據層
```

---

## 測試架構設計

### 設計哲學

1. **互動優先** (Interactive-First)
   - 先用 Playwright MCP 驗證測試方法
   - 確認可行後再轉為自動化腳本
   - 避免盲目編碼

2. **三重驗證** (Triple Verification)
   - DOM 驗證：元素存在性、狀態
   - Canvas 驗證：視覺渲染正確性
   - Network 驗證：API 數據完整性
   - 📖 詳見：[Testing Strategies](../guides/testing-strategies.md)

3. **問題導向** (Problem-Driven)
   - 所有 Helper 函數都解決實際遇到的問題
   - 基於 MVP 測試發現的 4 個關鍵問題
   - 📖 詳見：[Troubleshooting Guide](../guides/troubleshooting.md)

4. **模組化設計** (Modular Design)
   - 清晰的關注點分離
   - 可組合的輔助函數
   - 單一職責原則

### 專案結構

```typescript
tests/
├── helpers/                    // 輔助函數模組
│   ├── navigation.ts           // 導航：進入賽事、選擇鴿子
│   ├── mode-switching.ts       // 模式切換 (解決問題 #1)
│   ├── trajectory-utils.ts     // 軌跡操作 (解決問題 #3)
│   ├── wait-utils.ts           // 等待策略 (解決問題 #4)
│   ├── validators.ts           // 數據驗證
│   └── loft-list.ts            // 鴿舍列表操作
│
└── e2e/                        // E2E 測試腳本
    ├── 01-race-list.spec.ts
    ├── 02-track-2d-static.spec.ts
    ├── 03-track-2d-playback.spec.ts
    ├── 04-track-3d-playback.spec.ts
    ├── 05-loft-list.spec.ts
    ├── 06-trajectory-detail.spec.ts
    └── 07-ui-elements.spec.ts
```

---

## Helper 函數模組

### 設計原則

1. **單一職責**：每個 helper 處理一個明確的關注點
2. **錯誤恢復**：內建重試邏輯處理已知問題
3. **可組合性**：函數可以鏈式調用
4. **明確依賴**：參數明確，無隱藏依賴

### 模組職責

#### navigation.ts
**職責**：基本用戶流程自動化

```typescript
// 主要函數
enterRace(page, raceIndex?)      // 進入指定賽事
selectPigeon(page, index?)       // 選擇鴿子
openTrajectory(page)             // 點擊「查看軌跡」
```

#### mode-switching.ts (解決問題 #1, #2)
**職責**：處理 2D/3D 模式切換與軌跡加載問題

```typescript
// 主要函數
ensureModeByText(page, mode)         // 根據按鈕文字確保模式
switchTo2DReliably(page)             // 可靠的 2D 切換 (3D→2D序列作為備選)
switchTo3DReliably(page)             // 可靠的 3D 切換
reload2DTrajectory(page, retries)    // 重新加載軌跡數據（推薦方法）
detectCurrentViewMode(page)          // 偵測當前靜態/動態模式
```

**關鍵**：
- 問題 #1: 使用 `reload2DTrajectory()` 重新選擇鴿子觸發數據加載
- 問題 #2: 使用 `detectCurrentViewMode()` 通過標記點數量判斷模式

📖 詳細說明：[Mode Switching Guide](../guides/mode-switching.md)

#### trajectory-utils.ts (解決問題 #3)
**職責**：軌跡點互動的可靠性

```typescript
// 主要函數
getTrajectoryPoints(page)            // 獲取所有軌跡點標記
clickTrajectoryPoint(page, index)    // 基於 accessibility 的點擊
verifyPointData(page, expected)      // 驗證點資訊顯示
```

**關鍵**：使用 accessibility tree 定位器避免 canvas 遮擋問題

#### wait-utils.ts (解決問題 #4)
**職責**：智能等待策略

```typescript
// 主要函數
waitForMapTiles(page, minCount)      // AMap 瓦片加載
waitForCesium3D(page)                // Cesium 引擎就緒
waitForTrajectoryData(page)          // API 數據加載完成
```

**關鍵**：針對不同場景的等待時間調整

📖 詳細模式：[Testing Strategies](../guides/testing-strategies.md#wait-strategies)

#### validators.ts
**職責**：數據質量保證

```typescript
// 主要函數
validateFlightData(data, rules)      // 驗證飛行數據
detectAnomaly(data)                  // 檢測異常數據
```

#### loft-list.ts
**職責**：鴿舍管理操作

```typescript
// 主要函數
openLoftList(page)                   // 打開鴿舍列表
addLoft(page, loftName)              // 添加鴿舍
deleteLoft(page, loftName)           // 刪除鴿舍
searchLoft(page, keyword)            // 搜尋鴿舍
```

---

## 測試用例優先級系統

### 優先級定義

#### P0 (Critical - 發布前必須通過)
**定義**：核心功能，失敗將導致系統不可用

**測試案例** (~5-7個):
- TC-02-001: 2D 靜態軌跡顯示
- TC-03-001: 靜態/動態模式切換
- TC-04-001: 3D 模式渲染

**測試頻率**：每次提交

#### P1 (Important - 重要功能)
**定義**：核心用戶流程，影響用戶體驗

**測試案例** (~15-20個):
- 軌跡點互動
- 數據驗證
- 模式切換邊界情況

**測試頻率**：每日執行

#### P2 (Nice-to-have - 邊界情況)
**定義**：邊緣功能、性能優化

**測試案例** (~10-15個):
- 鴿舍列表操作
- 錯誤處理
- 性能邊界

**測試頻率**：發布前執行

### 實作順序

```
階段 1: P0 測試 + 必要 helpers
  ↓
階段 2: P1 測試 + 驗證框架
  ↓
階段 3: P2 測試 + 完整覆蓋
```

📖 完整測試目錄：[Test Cases](../test-plan/TEST_CASES.md)

---

## 2D/3D 模式架構

### 設計原理

**關鍵理解**：按鈕的**顯示文字**指示目標模式（即將進入的模式）

```
按鈕顯示 "3D" → 點擊「查看軌跡」進入 3D 模式
按鈕顯示 "2D" → 點擊「查看軌跡」進入 2D 模式
```

### 驗證策略

**3D 模式驗證**：
```typescript
// 特徵元素
await expect(page.getByRole('button', { name: '視角1' })).toBeVisible();
await expect(page.getByRole('button', { name: '視角2' })).toBeVisible();

// Cesium 引擎
await page.waitForFunction(() => window.Cesium !== undefined);
```

**2D 模式驗證**：
```typescript
// 特徵元素
await expect(page.getByRole('button', { name: 'view_in_ar 3D模式' })).toBeVisible();

// AMap 瓦片
const tileCount = await page.locator('.amap-container img').count();
expect(tileCount).toBeGreaterThan(50);
```

### 模式特有功能

**2D 模式 (AMap)**:
- **靜態模式**：完整紅色軌跡線，15-20 個標記點
- **動態模式**：動畫播放，1-3 個可見點
- 控制項：播放/暫停、速度選擇器、3D 模式切換

**3D 模式 (Cesium)**:
- 3D 地球渲染
- 相機控制：視角1, 視角2
- 3D 空間中的軌跡可視化

📖 深入指南：[Mode Switching Guide](../guides/mode-switching.md)

---

## 數據驗證框架

### 標準規則

```typescript
const FLIGHT_DATA_RULES = {
  avgSpeed: {
    min: 800,    // m/Min
    max: 2000,
    typical: '1200-1500'
  },
  maxSpeed: {
    min: 1000,
    max: 2500,
    typical: '1500-2000'
  },
  avgAltitude: {
    min: 0,
    max: 3000,    // meters
    typical: '100-500'
  },
  maxAltitude: {
    min: 0,
    max: 5000,
    typical: '500-1000'
  },
  actualDistance: {
    min: 1,
    max: 1000,    // km
    typical: '50-300'
  },
  straightDistance: {
    min: 1,
    max: 800
  }
};
```

### 異常檢測範例

**實際異常數據**（來自 MVP 測試）:
```json
{
  "actual_distance": 46168.05,    // ❌ 異常: 46,168 km
  "actual_speed": 106529.36,      // ❌ 異常: 106,529 m/Min
  "avg_altitude": 128.99,         // ✓ 正常
  "max_altitude": 201.64          // ✓ 正常
}
```

**檢測策略**：
1. 應用規則邊界
2. 標記超出最大閾值的數值
3. 檢查關係一致性（actualDistance > straightDistance）
4. 記錄異常以供調查

📖 詳細指南：[Testing Strategies](../guides/testing-strategies.md#data-validation)

---

## 與現有文檔的整合

### 文檔層次結構

```
CLAUDE.md (快速參考)
  ↓
docs/architecture/test-framework.md (本文檔 - 架構)
  ↓
docs/guides/ (詳細指南)
  ↓
docs/test-plan/ (測試計劃與用例)
  ↓
docs/api-reference/ (API 文檔)
```

### 相關文檔

- **快速參考**: [CLAUDE.md](../../CLAUDE.md)
- **測試計劃總覽**: [Test Plan Overview](../test-plan/TEST_PLAN_OVERVIEW.md)
- **詳細測試用例**: [Test Cases](../test-plan/TEST_CASES.md) (35+ 測試案例)
- **已知問題解決**: [Known Issues](../test-plan/KNOWN_ISSUES_SOLUTIONS.md)
- **API 端點**: [API Endpoints](../api-reference/API_ENDPOINTS.md)

### 指南文檔

- **模式切換指南**: [Mode Switching](../guides/mode-switching.md)
- **問題排解指南**: [Troubleshooting](../guides/troubleshooting.md)
- **測試策略指南**: [Testing Strategies](../guides/testing-strategies.md)
- **Playwright 工作流程**: [Playwright Workflow](../guides/playwright-workflow.md)

---

## 實作建議

### 開始實作時

1. **從 P0 測試開始**：確保核心功能可靠
2. **先實作 helper 函數**：包含已知問題的解決方案
3. **使用三重驗證**：DOM + Canvas + Network
4. **參考 TEST_CASES.md**：包含完整的 TypeScript 代碼範例
5. **先互動測試**：用 Playwright MCP 驗證方法
6. **處理已知問題**：4個問題都有文檔化的解決方案

### 常見陷阱

1. ⚠️ **2D/3D 模式選擇**：按鈕文字決定模式，非 checkbox 狀態
2. ⚠️ **2D 首次加載失敗**：使用 3D→2D 切換序列
3. ⚠️ **軌跡點點擊失敗**：使用 accessibility tree 定位器
4. ⚠️ **數據未加載**：模式切換後等待 2-3 秒

---

**最後更新**: 2025-11-18
**版本**: v1.0.0
**維護者**: 測試團隊
