# 測試指南索引

歡迎來到賽鴿追蹤系統自動化測試指南！本目錄包含詳細的測試指南文檔，幫助您深入理解測試策略、解決常見問題、掌握 Playwright MCP 工作流程。

---

## 📚 指南目錄

### 🎯 [模式切換指南](mode-switching.md)
**2D/3D Mode Switching Guide**

深入解析 2D/3D 模式選擇機制，這是測試中最容易誤解的部分。

**內容**：
- 模式選擇機制詳解
- 按鈕文字與模式對應關係
- 完整測試流程代碼範例
- 常見錯誤與解決方案
- 視覺化圖解

**適合**：需要理解或測試 2D/3D 模式切換的開發者

**關鍵發現**：按鈕**顯示文字**決定模式，非 checkbox 狀態

---

### 🔧 [問題排解指南](troubleshooting.md)
**Troubleshooting Guide**

MVP 測試期間發現的 4 個關鍵問題及其完整解決方案。

**內容**：
- 問題 #1: 2D 軌跡首次加載失敗 (HIGH severity)
- 問題 #2: 靜態/動態模式混淆 (MEDIUM severity)
- 問題 #3: 軌跡點點擊無響應 (MEDIUM severity)
- 問題 #4: 數據加載時序問題 (MEDIUM severity)
- 每個問題的根本原因分析
- 完整解決方案實作代碼
- 驗證步驟和預防措施

**適合**：遇到測試失敗或不穩定情況的開發者

**關鍵**：所有 4 個問題都有驗證過的解決方案

---

### 🧪 [測試策略指南](testing-strategies.md)
**Testing Strategies Guide**

完整的測試策略、驗證模式和最佳實踐。

**內容**：
- 三重驗證策略（DOM + Canvas + Network）
- 等待策略模式大全
- 數據驗證規則和異常檢測
- 測試最佳實踐
- 實用代碼範例

**適合**：需要設計測試策略或編寫測試腳本的開發者

**亮點**：提供可直接使用的驗證模式代碼

---

### 🎬 [Playwright 工作流程指南](playwright-workflow.md)
**Playwright MCP Workflow Guide**

Playwright MCP 互動式測試的完整工作流程。

**內容**：
- Playwright MCP 安裝和設定
- 互動式測試工作流程
- 從互動測試到自動化腳本的轉換
- 調試技巧和最佳實踐
- 常見問題解答

**適合**：初次使用 Playwright MCP 或想提高測試效率的開發者

**優勢**：先驗證後編碼，避免盲目開發

---

### 🎯 [選擇器參考指南](selectors.md)
**Selectors Reference Guide**

DOM 選擇器的完整參考，包括最新更新和棄用警告。

**內容**：
- 選擇器用途對照表
- 棄用選擇器警告（含原因和替代方案）
- DOM 結構說明
- 版本變更歷史

**適合**：編寫測試腳本或除錯選擇器問題的開發者

**關鍵更新**: 2025-11-26 軌跡標記點選擇器更新為 `.amap-icon > img`

---

## 🗺️ 如何使用這些指南

### 新手入門路徑

1. **開始** → 閱讀 [CLAUDE.md](../../CLAUDE.md) 快速參考
2. **理解** → 閱讀 [Test Framework 架構](../architecture/test-framework.md)
3. **深入** → 閱讀本目錄的相關指南
4. **實作** → 參考 [Test Cases](../test-plan/TEST_CASES.md) 中的代碼範例

### 問題導向路徑

遇到問題時：

1. **查看** → [問題排解指南](troubleshooting.md) 中的 4 個已知問題
2. **如果是模式切換問題** → [模式切換指南](mode-switching.md)
3. **如果是測試策略問題** → [測試策略指南](testing-strategies.md)
4. **如果是工具使用問題** → [Playwright 工作流程指南](playwright-workflow.md)

### 實作開發路徑

準備開始編寫測試時：

1. **規劃** → [Test Framework 架構](../architecture/test-framework.md)
2. **學習工具** → [Playwright 工作流程指南](playwright-workflow.md)
3. **了解策略** → [測試策略指南](testing-strategies.md)
4. **參考案例** → [Test Cases](../test-plan/TEST_CASES.md)
5. **處理問題** → [問題排解指南](troubleshooting.md)

---

## 📖 相關文檔

### 架構文檔
- [測試框架架構](../architecture/test-framework.md) - 整體架構設計

### 測試計劃
- [測試計劃總覽](../test-plan/TEST_PLAN_OVERVIEW.md) - 完整測試策略
- [詳細測試用例](../test-plan/TEST_CASES.md) - 35+ 測試案例
- [已知問題解決方案](../test-plan/KNOWN_ISSUES_SOLUTIONS.md) - 原始問題文檔

### API 參考
- [API 端點文檔](../api-reference/API_ENDPOINTS.md) - 6 個核心 API

### 快速參考
- [CLAUDE.md](../../CLAUDE.md) - 項目快速參考
- [README.md](../../README.md) - 專案總覽

---

## 💡 提示

- **所有指南都包含實際代碼範例**：可直接複製使用
- **基於真實測試經驗**：所有內容來自 MVP 測試實戰
- **持續更新**：隨著測試推進會不斷補充

---

## 🤝 貢獻

發現指南中的問題或有改進建議？

1. 查看相關的測試計劃文檔
2. 驗證建議的可行性
3. 提交更新建議

---

**最後更新**: 2025-11-26
**指南數量**: 5
**狀態**: ✅ 活躍維護中
