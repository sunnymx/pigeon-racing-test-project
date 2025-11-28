# Chrome DevTools MCP 實作計劃

**建立日期**: 2025-11-28
**狀態**: 計劃已確認，待實作

---

## 1. 目標

建立 Chrome DevTools MCP 並行實作，與現有 Playwright 進行效能/穩定性/偵錯/開發體驗對比。

---

## 2. 目錄結構

```
tests/
├── helpers/                      # 現有 Playwright (保留不動)
├── helpers-devtools/             # 新建 DevTools MCP 版本
│   ├── devtools-core.ts          # DevTools 核心工具 (~150 行)
│   ├── navigation.ts             # (~180 行)
│   ├── mode-switching.ts         # (~250 行)
│   ├── wait-utils.ts             # (~200 行)
│   ├── trajectory-utils.ts       # (~280 行)
│   ├── trajectory-reload.ts      # (~180 行)
│   └── loft-list.ts              # (~200 行)
├── e2e/                          # 現有 Playwright 測試
├── e2e-devtools/                 # 新建 DevTools MCP 測試
│   ├── tc-02-001-2d-static.devtools.ts
│   ├── tc-03-001-mode-switch.devtools.ts
│   └── tc-04-001-3d-mode.devtools.ts
├── comparison/                   # 對比基礎設施
│   ├── benchmark-runner.ts
│   ├── metrics-collector.ts
│   └── report-generator.ts
└── shared/
    ├── types.ts                  # 共用型別
    └── validators.ts             # 共用驗證器 (無瀏覽器依賴)
```

---

## 3. 執行方式

**兩階段策略**:
1. **互動式驗證** - 透過 Claude Code 對話執行 DevTools MCP 工具，快速驗證可行性
2. **腳本式自動化** - 驗證成功後轉為 Node.js 腳本，支援 CI 整合

```
互動式 (Claude Code)          腳本式 (Node.js)
┌─────────────────┐          ┌─────────────────┐
│ mcp__chrome-    │          │ import { ... }  │
│ devtools__click │    →     │ from 'devtools' │
│ (手動觸發)       │          │ (自動執行)       │
└─────────────────┘          └─────────────────┘
```

---

## 4. 實作順序

### Phase 1: 基礎建設 (1-2 天)

| 順序 | 任務 | 預估行數 |
|------|------|----------|
| 1.1 | 設定 Chrome DevTools MCP (`claude mcp add`) | - |
| 1.2 | 互動式驗證核心 API (navigate, click, snapshot) | - |
| 1.3 | 建立 `devtools-core.ts` 核心工具 | ~150 |
| 1.4 | 建立 `shared/types.ts` | ~50 |

### Phase 2: Helper 轉換 (3-5 天)

| 順序 | 模組 | 預估行數 | 依賴 |
|------|------|----------|------|
| 2.1 | `navigation.ts` | ~180 | devtools-core |
| 2.2 | `wait-utils.ts` | ~200 | devtools-core |
| 2.3 | `mode-switching.ts` | ~250 | navigation, wait-utils |
| 2.4 | `trajectory-utils.ts` | ~280 | devtools-core, wait-utils |
| 2.5 | `trajectory-reload.ts` | ~180 | navigation, mode-switching |
| 2.6 | `loft-list.ts` | ~200 | devtools-core, navigation |

### Phase 3: 測試轉換 (2-3 天)

| 順序 | 測試案例 | 預估行數 |
|------|----------|----------|
| 3.1 | TC-02-001 (2D 靜態) | ~150 |
| 3.2 | TC-03-001 (模式切換) | ~200 |
| 3.3 | TC-04-001 (3D 模式) | ~220 |

### Phase 4: 對比與報告 (2 天)

| 順序 | 任務 | 預估行數 |
|------|------|----------|
| 4.1 | 建立 benchmark-runner | ~150 |
| 4.2 | 建立 metrics-collector | ~100 |
| 4.3 | 建立 report-generator | ~100 |
| 4.4 | 執行完整對比 | - |
| 4.5 | 產生最終報告 | - |

---

## 5. 對比指標

| 面向 | 指標 | 收集方式 |
|------|------|----------|
| **速度** | 測試執行時間 | `performance.now()` |
| **穩定性** | 通過率、Flaky 率、重試次數 | 多次執行統計 |
| **偵錯** | 效能追蹤、網路詳情、錯誤診斷 | DevTools 獨特 API |
| **開發體驗** | 程式碼行數、複雜度、API 呼叫次數 | 程式碼分析 |

---

## 6. 風險與對策

| 風險 | 影響 | 對策 |
|------|------|------|
| Canvas 元素不在 a11y 樹 | 無法與地圖標記互動 | 使用 `evaluate_script` 操作 |
| 沙盒環境不相容 | DevTools MCP 無法啟動 | 提前測試，準備備案 |
| 等待策略差異 | 測試需要不同等待邏輯 | 建立自適應等待工具 |
| a11y 樹解析複雜 | 元素定位代碼更複雜 | 建立穩健的解析工具 |

---

## 7. 預估工作量

| 階段 | 天數 | 程式碼行數 |
|------|------|-----------|
| 基礎建設 | 2 | ~400 |
| Helper 轉換 | 3-5 | ~1,290 |
| 測試轉換 | 2-3 | ~570 |
| 對比報告 | 2 | ~350 |
| **總計** | **10 天** | **~2,610 行** |

---

## 8. 關鍵參考檔案

實作時需參考:
- `tests/helpers/navigation.ts` - 導航模式
- `tests/helpers/mode-switching.ts` - 模式偵測邏輯
- `tests/helpers/wait-utils.ts` - 等待策略
- `tests/e2e/tc-02-001-2d-static.spec.ts` - 測試結構參考
- `docs/architecture/test-framework.md` - 架構原則

---

## 9. 成功標準

### 最低標準
- [ ] 所有 3 個 P0 測試案例轉換並通過
- [ ] 所有 7 個 Helper 模組轉換完成
- [ ] 收集所有測試案例的對比指標
- [ ] 產生最終對比報告

### 目標標準
- [ ] DevTools MCP 達到可比穩定性（與 Playwright 相差 5% 內）
- [ ] 效能追蹤提供可操作的洞察
- [ ] 網路檢查提供比 Playwright 更多細節
- [ ] 程式碼複雜度增加少於 30%

---

## 10. 參考資料

- [Chrome DevTools MCP GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Chrome DevTools MCP 工具參考](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md)
