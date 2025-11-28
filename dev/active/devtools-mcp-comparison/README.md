# Chrome DevTools MCP vs Playwright 對比實驗

**建立日期**: 2025-11-28
**狀態**: 計劃已確認，待實作

## 簡介

將現有 Playwright 測試方案與 Chrome DevTools MCP 進行 A/B 對比，評估四個面向：
- 執行速度
- 穩定性
- 偵錯能力
- 開發體驗

## 文件結構

```
dev/active/devtools-mcp-comparison/
├── README.md                           # 本文件
├── implementation-plan.md              # 完整實作計劃
└── api-mapping.md                      # Playwright → DevTools API 映射
```

## 快速摘要

| 項目 | 內容 |
|------|------|
| 目標 | A/B 對比實驗（保留 Playwright） |
| 範圍 | 3 個 P0 測試 + 7 個 Helper 模組 |
| 預估工作量 | ~10 天，~2,610 行程式碼 |
| 執行方式 | 先互動式驗證 → 再腳本式自動化 |

## 下一步

1. [ ] 設定 Chrome DevTools MCP
2. [ ] 互動式驗證核心 API
3. [ ] 建立 Helper 模組 DevTools 版本
4. [ ] 轉換測試案例
5. [ ] 執行對比並產生報告

## 詳細內容

- [完整實作計劃](./implementation-plan.md)
- [API 映射對照](./api-mapping.md)
