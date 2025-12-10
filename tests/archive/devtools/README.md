# DevTools MCP 測試方案

**建立日期**: 2025-12-04
**狀態**: 待開發

---

## 概述

本資料夾存放 DevTools MCP 互動式測試腳本，作為 Phase 1 開發驗證方案。

---

## 檔案結構

```
tests/devtools/
├── README.md                    # 本文件
├── adaptive-wait.md             # 等待策略驗證
├── console-monitor.md           # 錯誤監控驗證
├── trajectory-validator.md      # 數據驗證
├── stage-context.md             # 階段管理驗證
└── user-journey.md              # 完整流程驗證
```

---

## 開發順序

| 順序 | 檔案 | 說明 | 規格 |
|------|------|------|------|
| 1 | adaptive-wait.md | 等待策略驗證 | [spec](../../dev/active/test-flow-refactor/specs/adaptive-wait.spec.md) |
| 2 | console-monitor.md | 錯誤監控驗證 | [spec](../../dev/active/test-flow-refactor/specs/console-monitor.spec.md) |
| 3 | trajectory-validator.md | 數據驗證 | [spec](../../dev/active/test-flow-refactor/specs/trajectory-validator.spec.md) |
| 4 | stage-context.md | 階段管理驗證 | [spec](../../dev/active/test-flow-refactor/specs/stage-context.spec.md) |
| 5 | user-journey.md | 完整流程驗證 | [plan](../../dev/active/test-flow-refactor/user-journey-test-plan.md) |

---

## 使用方式

每個 `.md` 檔案包含：
1. **目標說明** - 該模組要驗證什麼
2. **前置條件** - 需要先到達的頁面狀態
3. **DevTools 操作步驟** - 使用 DevTools MCP 的具體指令
4. **預期結果** - 驗證成功的判斷標準
5. **驗證記錄** - 實際執行結果

---

## 相關文件

| 文件 | 說明 |
|------|------|
| [IMPLEMENTATION_GUIDE.md](../../dev/active/test-flow-refactor/IMPLEMENTATION_GUIDE.md) | 開發執行指南 |
| [user-journey-test-plan.md](../../dev/active/test-flow-refactor/user-journey-test-plan.md) | 完整計劃 |
