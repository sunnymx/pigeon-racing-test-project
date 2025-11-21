# 開發計劃

**專案**：鴿子競賽GPS追蹤系統自動化測試
**最後更新**：2025-11-18
**狀態**：Phase 1 準備中

---

## 📖 目的

本開發計劃文檔旨在：

1. **系統化建立專案架構文檔** - 完整記錄網站功能、用戶旅程、頁面結構、技術架構
2. **指導測試自動化實作** - 按優先級（P0→P1→P2）逐步實現35+測試案例
3. **確保測試覆蓋完整性** - 通過功能-測試映射確保無遺漏
4. **支援團隊協作** - 提供清晰的文檔和路線圖供團隊成員參考

---

## 📂 文檔結構

```
docs/development-plan/
├── README.md                      (你在這裡) - 開發計劃總覽和導航
├── ROADMAP.md                     - 完整的3階段開發路線圖
├── DOCUMENTS_CHECKLIST.md         - 待建立文檔清單和進度追蹤
└── evaluations/                   - 評估報告
    └── CODEGEN_ASSESSMENT.md      - Playwright Codegen 適用性評估
```

---

## 🗺️ 快速導航

### 想了解完整的開發路線圖？
👉 **[ROADMAP.md](ROADMAP.md)** - 查看 Phase 1-3 的詳細計劃、時程安排和交付成果

### 想追蹤文檔建立進度？
👉 **[DOCUMENTS_CHECKLIST.md](DOCUMENTS_CHECKLIST.md)** - 查看所有待建立文檔的清單和狀態

### 想了解專案背景和測試計劃？
👉 **[../test-plan/TEST_PLAN_OVERVIEW.md](../test-plan/TEST_PLAN_OVERVIEW.md)** - 查看完整的測試策略

### 想查看現有測試案例？
👉 **[../test-plan/TEST_CASES.md](../test-plan/TEST_CASES.md)** - 查看 35+ 詳細測試案例

### 想了解工具選擇評估？
👉 **[evaluations/CODEGEN_ASSESSMENT.md](evaluations/CODEGEN_ASSESSMENT.md)** - Playwright Codegen 適用性評估報告
   - 評估結論：保持現狀（不採用 Codegen）
   - 詳細分析：適用性、風險、時間估算

---

## 🎯 開發策略

採用**快速啟動優先**策略：

1. **Phase 1 (2-3天)**: 建立核心架構文檔
   - 探索網站功能和流程
   - 定義用戶角色和旅程
   - 建立功能-測試映射
   - 繪製技術架構圖

2. **Phase 2 (3-5天)**: 實作P0測試（邊做邊完善）
   - 實作關鍵測試案例
   - 建立 helper 函數模組
   - 補充發現的新文檔

3. **Phase 3 (按需進行)**: 逐步擴展
   - P1/P2 測試實作
   - 文檔完善和優化

---

## 📊 進度概覽

### 已完成
- ✅ MVP 測試執行（2025-11-17）
- ✅ 測試計劃文檔（35+ 測試案例）
- ✅ API 端點文檔（6 個核心 API）
- ✅ 已知問題解決方案（4 個問題）
- ✅ 測試架構設計（helper 函數模組設計）
- ✅ 文檔架構重構（Separation of Concerns）
- ✅ **Phase 1 Day 1 完成**（2025-11-18）
  - ✅ Playwright MCP 網站探索（5張截圖）
  - ✅ USER_PERSONAS.md - 用戶角色定義
  - ✅ FEATURE_CATALOG.md - 33個功能點完整清單
  - ✅ SITE_MAP.md - 完整網站結構地圖
- ✅ **Phase 1 Day 2 完成**（2025-11-18）
  - ✅ USER_JOURNEYS.md - 3個完整用戶旅程（含決策點分析）
  - ✅ COMPLETE_USER_JOURNEYS.md - 端到端流程與時序圖
  - ✅ USER_JOURNEY_TEST_MAPPING.md - 旅程-測試映射（93%覆蓋率）
  - ✅ FEATURE_TEST_MAPPING.md - 功能-測試映射（33功能，88%覆蓋率）

### 進行中
- 🚧 Phase 1 Day 3: 技術架構文檔

### 待執行
- ⬜ Phase 2: P0 測試實作
- ⬜ Phase 3: P1/P2 測試擴展

---

## 🔗 相關資源

### 專案文檔
- [CLAUDE.md](../../CLAUDE.md) - 專案快速參考指南
- [README.md](../../README.md) - 專案總覽

### 架構文檔
- [Test Framework](../architecture/test-framework.md) - 測試框架架構

### 測試指南
- [Mode Switching Guide](../guides/mode-switching.md) - 2D/3D 模式切換指南
- [Testing Strategies](../guides/testing-strategies.md) - 測試策略
- [Troubleshooting](../guides/troubleshooting.md) - 問題排解
- [Playwright Workflow](../guides/playwright-workflow.md) - Playwright MCP 工作流程

### API 文檔
- [API Endpoints](../api-reference/API_ENDPOINTS.md) - 6 個核心 API 端點

---

## 📝 如何使用這些文檔

### 對於開發人員
1. 閱讀 [ROADMAP.md](ROADMAP.md) 了解整體計劃
2. 查看 [DOCUMENTS_CHECKLIST.md](DOCUMENTS_CHECKLIST.md) 了解需要建立的文檔
3. 按照 Phase 1 → Phase 2 → Phase 3 的順序執行
4. 在實作過程中更新文檔狀態

### 對於專案經理
1. 使用 [ROADMAP.md](ROADMAP.md) 追蹤整體進度
2. 使用 [DOCUMENTS_CHECKLIST.md](DOCUMENTS_CHECKLIST.md) 檢查交付成果
3. 參考時程估算安排資源

### 對於新加入的團隊成員
1. 從 [../../CLAUDE.md](../../CLAUDE.md) 開始了解專案
2. 閱讀 [ROADMAP.md](ROADMAP.md) 了解開發方向
3. 查看 [../test-plan/TEST_PLAN_OVERVIEW.md](../test-plan/TEST_PLAN_OVERVIEW.md) 了解測試策略
4. 參考 [../guides/](../guides/) 學習測試方法

---

## ❓ 常見問題

**Q: 為什麼要先建立架構文檔而不是直接開始寫測試？**
A: 因為現有的 35+ 測試案例雖然涵蓋了主要功能，但缺少完整的用戶旅程和功能清單。建立架構文檔可以：
- 確保測試覆蓋完整性
- 發現可能遺漏的測試場景
- 為團隊提供清晰的系統理解
- 作為後續開發和維護的參考基準

**Q: Phase 1 需要多長時間？**
A: 預計 2-3 天。採用 Playwright MCP 互動式探索可以快速梳理網站結構。

**Q: 如果在實作過程中發現新的問題怎麼辦？**
A: 立即補充到相應的文檔中。這就是為什麼採用「邊做邊完善」的策略。

**Q: Phase 3 什麼時候開始？**
A: 按需進行。優先完成 Phase 1 和 Phase 2，確保核心文檔和 P0 測試穩定後再擴展。

---

**最後更新**: 2025-11-18
**維護者**: 專案團隊
