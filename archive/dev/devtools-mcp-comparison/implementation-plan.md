# Chrome DevTools MCP 實作計劃

**建立日期**: 2025-11-28
**最後更新**: 2025-12-01
**狀態**: ✅ Phase 3 完成 (100%)，Phase 4 待開始

---

## 1. 目標

建立 Chrome DevTools MCP 並行實作，與現有 Playwright 進行效能/穩定性/偵錯/開發體驗對比。

---

## 2. 目錄結構

```
tests/
├── helpers/                      # 現有 Playwright (保留不動)
├── helpers-devtools/             # 新建 DevTools MCP 版本 ✅
│   ├── devtools-core.ts          # DevTools 核心工具 (281 行)
│   ├── navigation.ts             # (220 行)
│   ├── mode-switching.ts         # (250 行)
│   ├── wait-utils.ts             # (325 行)
│   ├── trajectory-utils.ts       # (352 行)
│   ├── trajectory-reload.ts      # (164 行)
│   └── loft-list.ts              # (259 行)
├── e2e/                          # 現有 Playwright 測試
├── e2e-devtools/                 # 新建 DevTools MCP 測試 ✅
│   ├── shared/
│   │   ├── test-types.ts         # 共用型別 (63 行)
│   │   └── test-runner.ts        # 基礎執行器 (120 行)
│   ├── tc-02-001-2d-static.devtools.ts    # (219 行)
│   ├── tc-03-001-mode-switch.devtools.ts  # (300 行)
│   └── tc-04-001-3d-mode.devtools.ts      # (392 行)
├── comparison/                   # 對比基礎設施 (待建立)
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

### Phase 1: 基礎建設 (1-2 天) ✅ 完成

| 順序 | 任務 | 預估行數 | 實際行數 | 狀態 |
|------|------|----------|----------|------|
| 1.1 | 設定 Chrome DevTools MCP (`claude mcp add`) | - | - | ✅ |
| 1.2 | 互動式驗證核心 API (navigate, click, snapshot) | - | - | ✅ |
| 1.3 | 建立 `devtools-core.ts` 核心工具 | ~150 | 188 | ✅ |
| 1.4 | 建立 `shared/types.ts` | ~50 | 72 | ✅ |

**Phase 1 總計**: 260 行 (預估 200 行)

### Phase 2: Helper 轉換 (3-5 天) ✅ 完成

| 順序 | 模組 | 預估行數 | 實際行數 | 狀態 |
|------|------|----------|----------|------|
| 2.1 | `wait-utils.ts` | ~200 | 284 | ✅ |
| 2.2 | `navigation.ts` | ~180 | 220 | ✅ |
| 2.3 | `mode-switching.ts` | ~250 | 250 | ✅ |
| 2.4 | `trajectory-utils.ts` | ~280 | 265 | ✅ |
| 2.5 | `trajectory-reload.ts` | ~180 | 164 | ✅ |
| 2.6 | `loft-list.ts` | ~200 | 259 | ✅ |
| 2.7 | `devtools-core.ts` 擴展 | - | +93 | ✅ |

**Phase 2 總計**: 1,723 行 (預估 1,290 行) - 含 devtools-core 281 行

### Phase 3: 測試轉換 (2-3 天) ✅ 完成

| 順序 | 測試案例 | 預估行數 | 實際行數 | 狀態 |
|------|----------|----------|----------|------|
| 3.0 | 共用模組 (test-types.ts, test-runner.ts) | - | 183 | ✅ |
| 3.1 | TC-02-001 (2D 靜態) | ~150 | 219 | ✅ |
| 3.2 | TC-03-001 (模式切換) | ~200 | 300 | ✅ |
| 3.3 | TC-04-001 (3D 模式) | ~220 | 392 | ✅ |

**Phase 3 總計**: 1,094 行 (預估 570 行)

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

## 7. 預估 vs 實際工作量

| 階段 | 預估天數 | 預估行數 | 實際行數 | 狀態 |
|------|----------|----------|----------|------|
| 基礎建設 | 2 | ~400 | 260 | ✅ |
| Helper 轉換 | 3-5 | ~1,290 | 1,851 | ✅ |
| 測試轉換 | 2-3 | ~570 | 1,094 | ✅ |
| 對比報告 | 2 | ~350 | - | ⏳ |
| **總計** | **10 天** | **~2,610** | **3,205+** |

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
- [x] 所有 3 個 P0 測試案例轉換並通過
- [x] 所有 7 個 Helper 模組轉換完成
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
