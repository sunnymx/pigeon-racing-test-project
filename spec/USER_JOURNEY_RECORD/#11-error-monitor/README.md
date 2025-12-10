# 記錄點 #11: 錯誤監控

**優先級**: P0
**狀態**: 待開發
**對應測試**: `tests/e2e/user-journey/11-error-monitor.spec.ts` (待建立)

---

## 概述

錯誤監控貫穿所有測試階段，持續監控 Console 錯誤、網路請求失敗和頁面崩潰。使用 `ConsoleMonitor` 類別實現。

---

## 執行方式

- **觸發點**: 所有測試階段
- **執行方式**: 持續監控，不需手動觸發
- **監控範圍**: 全域 (整個測試流程)

---

## 監控項目

| 類型 | 監控對象 | 嚴重程度 | 說明 |
|------|---------|----------|------|
| Console | `console.error` | 嚴重 | JavaScript 運行錯誤 |
| Console | `console.warn` | 警告 | 潛在問題警告 |
| Network | 5xx 響應 | 嚴重 | 伺服器錯誤 |
| Network | 4xx 響應 | 警告 | 客戶端錯誤 |
| Exception | 未處理異常 | 嚴重 | 頁面崩潰 |

---

## ConsoleMonitor 類別

```typescript
import { ConsoleMonitor } from '@/helpers/console-monitor';

// 使用方式
const monitor = new ConsoleMonitor(page);

// 在測試結束時檢查
const errors = monitor.getErrors();
expect(errors).toHaveLength(0);
```

### 方法

| 方法 | 說明 |
|------|------|
| `start()` | 開始監控 |
| `stop()` | 停止監控 |
| `getErrors()` | 取得所有錯誤 |
| `getWarnings()` | 取得所有警告 |
| `clear()` | 清除記錄 |

---

## 測試檢查點

| # | 檢查項目 | 優先級 | 驗證方式 | 狀態 |
|---|---------|--------|---------|------|
| 11.1 | Console 無嚴重錯誤 | P0 | 監控 `console.error` | ⬜ |
| 11.2 | 網路請求成功 | P0 | API 請求無 5xx 錯誤 | ⬜ |
| 11.3 | 頁面無崩潰 | P0 | 無未處理異常 | ⬜ |

---

## 錯誤處理策略

### 預期錯誤 (可忽略)

```typescript
const IGNORED_ERRORS = [
  /Failed to load resource.*favicon/,  // Favicon 載入失敗
  /ResizeObserver loop/,                // 常見的良性警告
];
```

### 意外錯誤 (需報告)

- 所有不在忽略清單中的 `console.error`
- 所有 5xx HTTP 響應
- 未處理的 Promise rejection

---

## 整合方式

### 方式 1: 每個測試獨立監控

```typescript
test('某個功能', async ({ page }) => {
  const monitor = new ConsoleMonitor(page);

  // 執行測試...

  // 測試結束檢查
  expect(monitor.getErrors()).toHaveLength(0);
});
```

### 方式 2: 全域 Fixture

```typescript
// tests/fixtures.ts
export const test = base.extend({
  consoleMonitor: async ({ page }, use) => {
    const monitor = new ConsoleMonitor(page);
    await use(monitor);

    // 自動檢查
    const errors = monitor.getErrors();
    if (errors.length > 0) {
      console.warn('Console errors detected:', errors);
    }
  },
});
```

---

## 已知問題

| 問題 | 狀態 | 解決方案 |
|------|------|---------|
| Favicon 404 | 已知 | 加入忽略清單 |
| ResizeObserver 警告 | 已知 | 加入忽略清單 |

---

## 相關參考

- USER_JOURNEY_RECORD_V2: [記錄點 #11](../USER_JOURNEY_RECORD_V2.md#記錄點-11-錯誤監控)
- Helper: `tests/helpers/console-monitor.ts` (待建立)

---

## 開發日誌

| 日期 | 內容 |
|------|------|
| 2025-12-10 | 建立 spec 模板 |
