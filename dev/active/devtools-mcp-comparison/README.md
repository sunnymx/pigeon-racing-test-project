# Chrome DevTools MCP vs Playwright 對比實驗

**建立日期**: 2025-11-28
**最後更新**: 2025-12-01
**狀態**: ✅ Phase 2 完成 (6/6 模組)

## 簡介

將現有 Playwright 測試方案與 Chrome DevTools MCP 進行 A/B 對比，評估四個面向：
- 執行速度
- 穩定性
- 偵錯能力
- 開發體驗

## 進度總覽

| 階段 | 狀態 | 完成度 |
|------|------|--------|
| Phase 1: 基礎建設 | ✅ 完成 | 100% |
| Phase 2: Helper 轉換 | ✅ 完成 | 100% (6/6) |
| Phase 3: 測試轉換 | ⏳ 待開始 | 0% |
| Phase 4: 對比報告 | ⏳ 待開始 | 0% |

## 文件結構

```
dev/active/devtools-mcp-comparison/
├── README.md                           # 本文件
├── implementation-plan.md              # 完整實作計劃
├── api-mapping.md                      # Playwright → DevTools API 映射
└── phase1-verification-report.md       # Phase 1 驗證報告 ✅ NEW
```

## 已完成工作

### Phase 1: 基礎建設 (2025-11-28) ✅

**建立的檔案**:

| 檔案 | 行數 | 說明 |
|------|------|------|
| `tests/shared/types.ts` | 72 | 共用型別定義 |
| `tests/helpers-devtools/devtools-core.ts` | 188 | 核心工具函數 |
| `tests/helpers-devtools/README.md` | - | 模組說明 |

**驗證結果**:

| API | 狀態 |
|-----|------|
| `navigate_page` | ✅ 成功 |
| `take_snapshot` | ✅ 成功 |
| `click` | ✅ 成功 |
| `list_pages` | ✅ 成功 |

**代碼品質**: 9/10

### Phase 2.1: wait-utils.ts (2025-12-01) ✅

| 檔案 | 行數 | 說明 |
|------|------|------|
| `tests/helpers-devtools/wait-utils.ts` | 284 | 等待工具函數 |

### Canvas 互動驗證 (2025-12-01) ✅

**關鍵發現**：

| 檢查項目 | 結果 |
|---------|------|
| DOM 中的 `.amap-icon > img` | **186 個** - 軌跡標記可透過 DOM 查詢 |
| a11y 快照包含標記 | **否** - 需透過 `evaluate_script` 操作 |
| 點擊標記觸發彈窗 | **成功** - 使用完整滑鼠事件序列 |

**結論**：Chrome DevTools MCP **完全支援**軌跡標記點操作

## 快速摘要

| 項目 | 內容 |
|------|------|
| 目標 | A/B 對比實驗（保留 Playwright） |
| 範圍 | 3 個 P0 測試 + 7 個 Helper 模組 |
| 預估工作量 | ~10 天，~2,610 行程式碼 |
| 已完成行數 | **~1,723 行 (66%)** |
| 執行方式 | 先互動式驗證 → 再腳本式自動化 |

## 下一步

1. [x] ~~設定 Chrome DevTools MCP~~
2. [x] ~~互動式驗證核心 API~~
3. [x] ~~wait-utils.ts~~
4. [x] ~~Canvas 互動驗證~~
5. [x] ~~建立 navigation.ts~~
6. [x] ~~建立 mode-switching.ts~~
7. [x] ~~建立 trajectory-utils.ts~~
8. [x] ~~建立 trajectory-reload.ts~~
9. [x] ~~建立 loft-list.ts~~
10. [ ] 轉換測試案例 ← **Phase 3 下一步**
11. [ ] 執行對比並產生報告

### Phase 2 完成狀態

| 模組 | 行數 | 狀態 |
|------|------|------|
| `devtools-core.ts` | 281 | ✅ 完成 |
| `wait-utils.ts` | 284 | ✅ 完成 |
| `navigation.ts` | 220 | ✅ 完成 |
| `mode-switching.ts` | 250 | ✅ 完成 |
| `trajectory-utils.ts` | 265 | ✅ 完成 |
| `trajectory-reload.ts` | 164 | ✅ 完成 |
| `loft-list.ts` | 259 | ✅ 完成 |
| **總計** | **1,723** | **100%** |

## 已知風險

| 風險 | 影響 | 狀態 |
|------|------|------|
| Canvas 元素不在 a11y 樹 | 高 | ✅ 已解決（使用完整滑鼠事件序列） |
| 等待策略差異 | 中 | ✅ 已完成（wait-utils.ts） |

## 詳細內容

- [完整實作計劃](./implementation-plan.md)
- [API 映射對照](./api-mapping.md)
- [Phase 1 驗證報告](./phase1-verification-report.md)
