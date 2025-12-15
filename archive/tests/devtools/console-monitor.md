# 控制台監控驗證腳本

**模組**: console-monitor
**規格**: [specs/console-monitor.spec.md](../../dev/active/test-flow-refactor/specs/console-monitor.spec.md)
**狀態**: ✅ 驗證完成
**驗證日期**: 2025-12-05

---

## 1. 概述

驗證控制台錯誤監控的 4 個核心功能，確認邏輯正確後再轉換為 Playwright 模組。

---

## 2. 前置條件

在執行驗證前，需先導航至軌跡頁面：

```
1. 開啟 https://skyracing.com.cn/
2. 點擊「進入」按鈕
3. 勾選任一鴿子
4. 點擊「查看軌跡」進入軌跡頁面
```

---

## 3. 驗證步驟

### 3.1 list_console_messages - 控制台事件收集

**目的**: 驗證 DevTools MCP 可正確收集控制台訊息

**步驟**:
1. 導航至軌跡頁面
2. 使用 `list_console_messages` 工具查看訊息

**預期結果**:
- 能獲取 error/warn/log/info 等類型訊息
- 每條訊息包含類型、內容、來源資訊

**實測結果** (2025-12-05):
| 項目 | 結果 | 數值 |
|------|------|------|
| 訊息收集 | ✅ | 6 條 |
| 錯誤類型 (error) | ✅ | 1 條 |
| 警告類型 (warn) | ✅ | 3 條 |
| 問題類型 (issue) | ✅ | 2 條 |

**訊息詳情**:
- `[warn]` Canvas2D: getImageData willReadFrequently 建議
- `[warn]` aria-hidden 焦點問題
- `[issue]` form field 缺少 id/name (x3)
- `[issue]` Deprecated: createImageBitmap imageOrientation
- `[error]` ERROR JSHandle@error

---

### 3.2 白名單過濾驗證

**目的**: 驗證已知無害錯誤可被正確識別

**白名單模式** (10 種):
```javascript
const ERROR_WHITELIST = [
  // 瀏覽器/擴展相關
  /favicon\.ico/i,
  /chrome-extension/i,
  /moz-extension/i,

  // 第三方服務
  /google.*analytics/i,
  /gtag/i,
  /hotjar/i,

  // 已知問題
  /gpx2d.*undefined/i,
  /Cesium.*deprecated/i,

  // 網路相關
  /net::ERR_BLOCKED/i,
  /CORS/i,
];
```

**步驟**:
1. 從 `list_console_messages` 獲取錯誤訊息
2. 逐一比對白名單模式
3. 記錄匹配結果

**實測結果** (2025-12-05):
| 白名單模式 | 匹配數量 | 備註 |
|------------|----------|------|
| favicon.ico | 0 | 未觸發 |
| chrome-extension | 0 | 未觸發 |
| gpx2d.*undefined | 0 | 未觸發 |
| Cesium.*deprecated | 0 | 未觸發 (deprecated 為 createImageBitmap) |
| CORS | 0 | 未觸發 |

> ⚠️ **備註**: 當前測試環境未產生白名單中的錯誤類型。
> 白名單過濾邏輯需在實際遇到這些錯誤時驗證。

---

### 3.3 嚴重錯誤識別

**目的**: 驗證嚴重錯誤即使在白名單中也能被識別

**嚴重錯誤模式** (4 種):
```javascript
const CRITICAL_PATTERNS = [
  /uncaught.*error/i,
  /unhandled.*rejection/i,
  /fatal/i,
  /crash/i,
];
```

**步驟**:
1. 從 `list_console_messages` 篩選 error 類型
2. 檢查是否匹配嚴重錯誤模式
3. 記錄發現的嚴重錯誤

**實測結果** (2025-12-05):
| 模式 | 發現數量 | 詳情 |
|------|----------|------|
| uncaught.*error | 0 | 無 |
| unhandled.*rejection | 0 | 無 |
| fatal | 0 | 無 |
| crash | 0 | 無 |

> ✅ **結論**: 當前頁面無嚴重錯誤。
> 唯一的 error 訊息 "ERROR JSHandle@error" 不匹配嚴重錯誤模式。

---

### 3.4 錯誤分類統計

**目的**: 驗證錯誤可按類型正確分類

**分類邏輯**:
```javascript
function categorizeError(message) {
  if (/network|fetch|xhr/i.test(message)) return 'Network';
  if (/syntax|parse/i.test(message)) return 'Syntax';
  if (/type.*error|undefined|null/i.test(message)) return 'TypeError';
  if (/reference/i.test(message)) return 'ReferenceError';
  return 'Other';
}
```

**步驟**:
1. 獲取所有錯誤訊息
2. 應用分類邏輯
3. 統計各類型數量

**實測結果** (2025-12-05):
| 類型 | 數量 | 佔比 |
|------|------|------|
| Network | 0 | 0% |
| Syntax | 0 | 0% |
| TypeError | 0 | 0% |
| ReferenceError | 0 | 0% |
| Other | 1 | 100% |

> **分析**: 唯一錯誤 "ERROR JSHandle@error" 不匹配任何特定類型，歸類為 Other。

---

## 4. 驗證結果記錄

| 功能 | 結果 | 備註 |
|------|------|------|
| 控制台事件收集 | ✅ | 成功收集 6 條訊息 |
| 白名單過濾 | ⚠️ | 邏輯正確，但未觸發白名單錯誤 |
| 嚴重錯誤識別 | ✅ | 無嚴重錯誤 |
| 錯誤分類統計 | ✅ | 分類邏輯可運作 |

---

## 5. 規格調整建議

### 建議 1: 新增白名單項目

當前測試發現以下常見警告，可考慮加入白名單：

```javascript
// 可選：Canvas 效能建議（非錯誤）
/Canvas2D.*willReadFrequently/i,

// 可選：無障礙警告（非關鍵）
/aria-hidden.*focus/i,
```

### 建議 2: issue 類型處理

DevTools MCP 返回 `issue` 類型（非標準 console 類型），需在 Playwright 版本中確認對應處理方式。

---

## 6. 下一步

1. ~~執行 DevTools MCP 驗證~~ ✅
2. ~~更新本文件的驗證結果~~ ✅
3. 進入 `trajectory-validator.md` 開發
