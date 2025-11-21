# 文檔封存目錄

本目錄保存專案歷史文檔和過時內容，供參考使用。

## 📁 目錄結構

```
archive/
├── early-plans/        # 早期計劃文檔
├── phase2-reports/     # Phase 2 報告
└── non-core-docs/      # 非核心文檔
```

---

## 📋 封存內容說明

### early-plans/ - 早期計劃文檔

**封存原因**: 這些文檔是專案早期階段（MVP 和 Phase 1-2）的計劃文檔，現已被更新的文檔取代。

**內容清單**:
- `PLAYWRIGHT_MCP_WORKFLOW.md` - Playwright MCP 工作流程（已被 guides/playwright-workflow.md 取代）
- `AUTOMATION_IMPLEMENTATION_PLAN.md` - 自動化實施計劃（Phase 2 前的計劃，已執行完成）
- `AUTOMATED_EXPLORATION_PLAN.md` - 自動化探索計劃（早期探索階段文檔）
- `MVP_PLAYWRIGHT_MCP_PLAN.md` - MVP 計劃文檔（MVP 階段已完成）
- `PIGEON_RACING_TEST_PROJECT.md` - 早期專案文檔（已被 CLAUDE.md 和其他文檔取代）

**參考價值**: 了解專案早期規劃思路和演進過程

---

### phase2-reports/ - Phase 2 報告

**封存原因**: Phase 2 已完成，報告內容已記錄在案，移至封存以保持主目錄整潔。

**內容清單**:
- `PHASE2_IMPLEMENTATION_REPORT.md` - Phase 2 詳細實施報告（包含代碼統計、測試結果、已解決問題）
- `PHASE2_SUMMARY.md` - Phase 2 總結報告

**參考價值**: 了解 Phase 2 實施細節、遇到的問題及解決方案

---

### non-core-docs/ - 非核心文檔

**封存原因**: 這些文檔對當前測試開發工作非核心，封存以專注於核心測試計劃文檔。

**內容清單**:
- `user-research/` - 使用者研究文檔（使用者角色、使用者旅程）
- `features/` - 功能目錄文檔
- `test-coverage/` - 測試覆蓋映射文檔
- `user-workflows/` - 完整使用者工作流程文檔

**參考價值**:
- 了解系統功能全貌
- 了解使用者需求和工作流程
- 功能與測試案例的映射關係

---

## 🔍 當前核心文檔位置

為了快速找到需要的文檔，以下是當前核心文檔的位置：

### 測試計劃文檔
- **測試計劃總覽**: [docs/test-plan/TEST_PLAN_OVERVIEW.md](../test-plan/TEST_PLAN_OVERVIEW.md)
- **測試案例**: [docs/test-plan/TEST_CASES.md](../test-plan/TEST_CASES.md)
- **已知問題解決方案**: [docs/test-plan/KNOWN_ISSUES_SOLUTIONS.md](../test-plan/KNOWN_ISSUES_SOLUTIONS.md)

### 指南文檔
- **模式切換指南**: [docs/guides/mode-switching.md](../guides/mode-switching.md)
- **問題排解指南**: [docs/guides/troubleshooting.md](../guides/troubleshooting.md)
- **測試策略指南**: [docs/guides/testing-strategies.md](../guides/testing-strategies.md)
- **Playwright 工作流程**: [docs/guides/playwright-workflow.md](../guides/playwright-workflow.md)

### 架構文檔
- **測試框架架構**: [docs/architecture/test-framework.md](../architecture/test-framework.md)
- **系統架構**: [docs/technical-architecture/SYSTEM_ARCHITECTURE.md](../technical-architecture/SYSTEM_ARCHITECTURE.md)
- **依賴圖**: [docs/technical-architecture/DEPENDENCY_GRAPH.md](../technical-architecture/DEPENDENCY_GRAPH.md)

### 開發計劃
- **開發路線圖**: [docs/development-plan/ROADMAP.md](../development-plan/ROADMAP.md)
- **文檔清單**: [docs/development-plan/DOCUMENTS_CHECKLIST.md](../development-plan/DOCUMENTS_CHECKLIST.md)

### 核心文檔
- **Claude Code 指引**: [CLAUDE.md](../../CLAUDE.md)
- **測試指南**: [TESTING_GUIDE.md](../../TESTING_GUIDE.md)
- **主要 README**: [README.md](../../README.md)

---

## 📝 封存記錄

**封存日期**: 2025-11-21
**封存原因**: 專案重構，專注於測試計劃開發核心文檔
**封存內容**: 早期計劃文檔、Phase 2 報告、非核心文檔
**節省空間**: ~368 MB（主要來自刪除的臨時文件和 MVP 測試截圖）

---

## ⚠️ 注意事項

1. **不要修改封存內容**: 封存的文檔僅供參考，不應再修改
2. **歷史記錄**: 所有封存的文檔仍可在 Git 歷史記錄中找到
3. **恢復文檔**: 如需恢復某個文檔，可從封存目錄複製回原位置

---

**最後更新**: 2025-11-21
