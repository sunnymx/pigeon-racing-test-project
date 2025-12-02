# DevTools MCP Helpers

Chrome DevTools MCP 版本的測試輔助函數。

**狀態**: ✅ Phase 2 完成, Phase 3 Step 0 完成 (2025-12-01)

## 模組列表

| 模組 | 行數 | 說明 |
|------|------|------|
| `devtools-core.ts` | 281 | 核心工具 + Canvas 操作 |
| `wait-utils.ts` | 325 | 等待策略 |
| `navigation.ts` | 220 | 導航輔助函數 |
| `mode-switching.ts` | 250 | 2D/3D 模式切換 |
| `trajectory-utils.ts` | 352 | 軌跡工具函數 |
| `trajectory-reload.ts` | 164 | 軌跡重載 |
| `loft-list.ts` | 259 | 鴿舍列表操作 |
| **總計** | **1,851** | — |

## 共用模組

| 模組 | 位置 | 說明 |
|------|------|------|
| `validators.ts` | `tests/shared/` | 數據驗證器（無瀏覽器依賴） |

## devtools-core.ts

核心工具函數，提供：

### 快照解析
- `parseSnapshot()` - 解析 a11y 快照
- `findElementByRole()` - 按角色尋找元素
- `findElementByText()` - 按文字尋找元素
- `findAllElementsByRole()` - 尋找所有匹配角色的元素
- `hasElement()` - 檢查元素是否存在
- `getElementText()` - 提取元素文字內容

### Canvas 操作 (a11y 樹外元素)
- `generateClickScript()` - 生成座標點擊腳本
- `generateGetCoordinatesScript()` - 生成取得座標腳本
- `generateCountElementsScript()` - 生成計數腳本
- `generateReadPopupScript()` - 生成讀取彈窗腳本

## wait-utils.ts

等待策略，提供：
- `delay()` - 延遲指定時間
- `waitForElement()` - 等待元素出現
- `waitForText()` - 等待文字出現
- `waitForElementHidden()` - 等待元素消失
- `waitForMapTiles()` - 等待 2D 地圖載入
- `waitForCesium3D()` - 等待 3D 引擎就緒
- `waitForApiResponse()` - 等待 API 響應
- `waitForModeSwitch()` - 等待模式切換
- `retryAsync()` - 通用重試邏輯
- `waitForTrajectoryData()` - 等待軌跡數據 API (Phase 3 新增)

## navigation.ts

導航輔助函數，提供：
- `enterRace()` - 進入賽事
- `selectPigeon()` - 選擇鴿子
- `openTrajectory()` - 打開軌跡視圖
- `getCurrentMode()` - 取得當前模式
- `setPreferredMode()` - 設定偏好模式
- `navigateToTrajectoryView()` - 完整導航流程

## mode-switching.ts

2D/3D 模式切換，提供：
- `ensureModeByText()` - 根據按鈕文字確保模式
- `switchTo2DReliably()` - 切換到 2D
- `switchTo3DReliably()` - 切換到 3D
- `detectCurrentViewMode()` - 偵測當前視圖模式
- `switchSubMode2D()` - 切換 2D 靜態/動態
- `verifyModeConsistency()` - 驗證模式一致性

## trajectory-utils.ts

軌跡工具函數，提供：
- `getTrajectoryPointsCount()` - 取得標記點數量
- `getTrajectoryPointCoordinates()` - 取得標記點座標
- `clickTrajectoryPoint()` - 點擊軌跡點
- `readTrajectoryPointPopup()` - 讀取彈窗內容
- `verifyPointInfo()` - 驗證軌跡點信息
- `verifyTrajectoryRendered()` - 驗證軌跡渲染
- `waitForTrajectoryRender()` - 等待軌跡渲染
- `getWaypointCountFromDetails()` - 取得航點數量
- `verifyTrajectoryData()` - 提取側邊欄軌跡數據 (Phase 3 新增)

## trajectory-reload.ts

軌跡重載（解決已知問題 #1），提供：
- `reload2DTrajectory()` - 重新加載 2D 軌跡
- `ensure2DStaticMode()` - 確保靜態模式

## loft-list.ts

鴿舍列表操作，提供：
- `openLoftList()` - 切換到鴿舍列表
- `searchLoft()` - 搜尋鴿舍
- `selectLoft()` - 選擇鴿舍
- `selectPigeonsInLoft()` - 勾選鴿子
- `verifyMultipleTrajectories()` - 驗證多軌跡
- `verifyMultipleTrajectoryRequests()` - 驗證 API 請求

## 使用範例

```typescript
import { findElementByRole } from './devtools-core';
import { waitForElement } from './wait-utils';
import { enterRace, selectPigeon } from './navigation';

// 定義 DevTools 上下文（依賴注入）
const ctx: DevToolsContext = {
  navigatePage: (url) => mcp__chrome_devtools__navigate_page({ url }),
  takeSnapshot: () => mcp__chrome_devtools__take_snapshot(),
  click: (uid) => mcp__chrome_devtools__click({ uid }),
  waitFor: (text, timeout) => mcp__chrome_devtools__wait_for({ text, timeout }),
};

// 執行導航流程
await enterRace(ctx, 0);
await selectPigeon(ctx, 0);
```

## 架構設計

所有模組採用**依賴注入模式** (`DevToolsContext`)：
- MCP 工具作為參數傳入
- 單元測試時可 mock
- 統一的錯誤處理

## 參考文檔

- [API 映射](../../dev/active/devtools-mcp-comparison/api-mapping.md)
- [實作計劃](../../dev/active/devtools-mcp-comparison/implementation-plan.md)
- [Phase 1 驗證報告](../../dev/active/devtools-mcp-comparison/phase1-verification-report.md)
